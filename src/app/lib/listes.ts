/**
 * Chargement des pages de regroupement.
 *
 * Module à part de `reelio-db.ts`, qui est retouché par d'autres sessions : y
 * poser ces fonctions ferait emporter leur travail en cours dans le commit.
 * À y remonter le jour où un second appelant apparaît.
 */

import { supabase } from "./supabase";
import type { Film } from "./reelio-db";
import { PAR_PAGE } from "./pagination";

export { PAR_PAGE, nombreDePages, cheminPage, fenetrePages } from "./pagination";

/** Une page de résultats, avec le total pour savoir combien il en reste. */
export interface Page<T> {
  lignes: T[];
  /** Total de la sélection entière, pas de la page. */
  total: number;
}

/** Une édition de la liste, avec le film qui lui sert de destination. */
export interface LigneEdition {
  id: number;
  titre: string | null;
  image_url: string | null;
  formats_extraits: string[] | null;
  editeur: string | null;
  date_parution: string | null;
  ean: string | null;
  /** Rang dans la série de l'éditeur, le numéro imprimé sur la tranche. */
  numero_collection: number | null;
  film: Pick<Film, "id" | "titre" | "slug" | "affiche_url" | "annee"> | null;
}

const CHAMPS_EDITION =
  "id,titre,image_url,formats_extraits,editeur,date_parution,ean,numero_collection," +
  "edition_films(film:films(id,titre,slug,affiche_url,annee))";

/** Bornes PostgREST d'une page, `page` comptant à partir de 1. */
function bornes(page: number): [number, number] {
  const debut = (Math.max(1, page) - 1) * PAR_PAGE;
  return [debut, debut + PAR_PAGE - 1];
}

/**
 * Aplatit la jointure : PostgREST rend `edition_films` en tableau, parce qu'un
 * coffret appartient à plusieurs films. On garde le premier, qui suffit à
 * donner une destination à la vignette.
 */
function aplatir(lignes: any[]): LigneEdition[] {
  return (lignes ?? []).map((ligne) => {
    const { edition_films, ...edition } = ligne;
    return { ...edition, film: edition_films?.[0]?.film ?? null } as LigneEdition;
  });
}

/**
 * Éditions portant un format donné, les illustrées d'abord.
 *
 * **Triées par `id` croissant, et c'est un revirement.** Le tri d'origine
 * remontait les éditions illustrées, `image_url.asc.nullslast`, pour qu'une
 * page de boîtiers montre des boîtiers. Mais il rend le contenu d'une page
 * numérotée instable : chaque édition illustrée qui entre décale tout vers le
 * bas. Mesuré le 1er août 2026, une édition indexée par Google en page 21 de
 * `/formats/steelbook` se trouvait en page 27 trois jours plus tard, après
 * 2 400 entrées. Google servait donc une URL dont le contenu était parti
 * ailleurs, et la requête, un code-barres, n'y trouvait plus rien.
 *
 * `id` croissant est le seul ordre qui ne décale rien : les nouvelles lignes
 * s'ajoutent à la fin, les pages déjà explorées gardent leur contenu. Le prix
 * est assumé, les premières pages ne sont plus les mieux illustrées.
 *
 * L'ordre doit rester **total**, sans quoi PostgREST répète et saute des
 * lignes d'une page à l'autre, piège déjà consigné au §9. `id` l'est.
 */
export async function getEditionsParFormat(
  format: string,
  page = 1,
): Promise<Page<LigneEdition>> {
  const [debut, fin] = bornes(page);
  const { data, count, error } = await supabase
    .from("editions")
    .select(CHAMPS_EDITION, { count: "exact" })
    .contains("formats_extraits", [format])
    .order("id", { ascending: true })
    .range(debut, fin);
  if (error) throw new Error(`Erreur lors du chargement du format ${format}: ${error.message}`);
  return { lignes: aplatir(data as any[]), total: count ?? 0 };
}

/** Éditions d'un éditeur. Toutes viennent de blu-ray.com, donc aucune image. */
export async function getEditionsParEditeur(
  editeur: string,
  page = 1,
): Promise<Page<LigneEdition>> {
  const [debut, fin] = bornes(page);
  const { data, count, error } = await supabase
    .from("editions")
    .select(CHAMPS_EDITION, { count: "exact" })
    .eq("editeur", editeur)
    .order("id", { ascending: true })
    .range(debut, fin);
  if (error) throw new Error(`Erreur lors du chargement de l'éditeur ${editeur}: ${error.message}`);
  return { lignes: aplatir(data as any[]), total: count ?? 0 };
}

/**
 * Éditions d'une collection numérotée d'éditeur.
 *
 * Triées par **numéro de collection** et non par date : c'est le rang imprimé
 * sur la tranche qui ordonne une série, et un collectionneur cherche le
 * numéro manquant. `nullsFirst: false` renvoie en fin de liste les éditions
 * dont le numéro n'est pas connu, ce qui est le cas de tout Criterion, dont
 * aucune de nos sources ne publie le spine number.
 */
export async function getEditionsParCollection(
  collection: string,
  page = 1,
): Promise<Page<LigneEdition>> {
  const [debut, fin] = bornes(page);
  const { data, count, error } = await supabase
    .from("editions")
    .select(CHAMPS_EDITION, { count: "exact" })
    .eq("collection_editeur", collection)
    .order("numero_collection", { ascending: true, nullsFirst: false })
    .order("date_parution", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range(debut, fin);
  if (error) throw new Error(`Erreur lors du chargement de la collection ${collection}: ${error.message}`);
  return { lignes: aplatir(data as any[]), total: count ?? 0 };
}

/**
 * Films d'un genre, les plus consultés d'abord.
 *
 * `edition_films!inner` écarte les films sans édition : ils n'ont rien à faire
 * dans un catalogue d'éditions physiques, et le sitemap ne les liste pas non
 * plus. Sur *Horreur* la contrainte fait passer de 570 films à 559.
 *
 * **Le décompte est juste malgré la jointure.** PostgREST n'aplatit pas une
 * relation plusieurs-à-plusieurs en produit cartésien : il rend un film par
 * ligne, ses liens dans un tableau imbriqué. `count: "exact"` compte donc bien
 * des films. Vérifié, il n'y a aucun doublon à écarter.
 *
 * **Triés par `id` croissant**, pour la même raison que les formats : la
 * popularité TMDB est recalculée chaque semaine, donc trier dessus faisait
 * changer le contenu de chaque page numérotée à chaque repasse, sous les URL
 * déjà explorées par Google.
 *
 * Les collections d'éditeur, elles, gardent leur tri par numéro : c'est le
 * rang imprimé sur la tranche, il ne bouge pas, et ces listes tiennent le plus
 * souvent en une page.
 */
export async function getFilmsParGenre(genre: string, page = 1): Promise<Page<Film>> {
  const [debut, fin] = bornes(page);
  const { data, count, error } = await supabase
    .from("films")
    .select("*, edition_films!inner(edition_id)", { count: "exact" })
    .contains("genres", [genre])
    .order("id", { ascending: true })
    .range(debut, fin);
  if (error) throw new Error(`Erreur lors du chargement du genre ${genre}: ${error.message}`);
  return { lignes: (data ?? []) as Film[], total: count ?? 0 };
}
