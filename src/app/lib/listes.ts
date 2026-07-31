/**
 * Chargement des pages de regroupement.
 *
 * Module à part de `reelio-db.ts`, qui est retouché par d'autres sessions : y
 * poser ces fonctions ferait emporter leur travail en cours dans le commit.
 * À y remonter le jour où un second appelant apparaît.
 */

import { supabase } from "./supabase";
import type { Film } from "./reelio-db";

/** Nombre de lignes affichées sur une page de regroupement. */
export const PLAFOND = 60;

/** Une édition de la liste, avec le film qui lui sert de destination. */
export interface LigneEdition {
  id: number;
  titre: string | null;
  image_url: string | null;
  formats_extraits: string[] | null;
  editeur: string | null;
  date_parution: string | null;
  ean: string | null;
  film: Pick<Film, "id" | "titre" | "slug" | "affiche_url" | "annee"> | null;
}

const CHAMPS_EDITION =
  "id,titre,image_url,formats_extraits,editeur,date_parution,ean," +
  "edition_films(film:films(id,titre,slug,affiche_url,annee))";

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
 * `order=image_url.asc.nullslast` fait remonter celles qui ont une jaquette.
 * Ce n'est pas de la coquetterie : une page qui montre des boîtiers doit en
 * montrer. Les visuels sont chez editioncollector, qui ne publie aucune spec,
 * et les specs chez blu-ray.com, qui ne publie aucune image (§3) ; sans ce tri
 * la page de `/formats/steelbook` s'ouvrirait sur soixante lignes de texte nu.
 */
export async function getEditionsParFormat(format: string): Promise<LigneEdition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select(CHAMPS_EDITION)
    .contains("formats_extraits", [format])
    .order("image_url", { ascending: true, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(PLAFOND);
  if (error) throw new Error(`Erreur lors du chargement du format ${format}: ${error.message}`);
  return aplatir(data as any[]);
}

/** Éditions d'un éditeur. Toutes viennent de blu-ray.com, donc aucune image. */
export async function getEditionsParEditeur(editeur: string): Promise<LigneEdition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select(CHAMPS_EDITION)
    .eq("editeur", editeur)
    .order("date_parution", { ascending: false, nullsFirst: false })
    .limit(PLAFOND);
  if (error) throw new Error(`Erreur lors du chargement de l'éditeur ${editeur}: ${error.message}`);
  return aplatir(data as any[]);
}

/**
 * Films d'un genre, les plus consultés d'abord.
 *
 * `edition_films!inner` écarte les films sans édition : ils n'ont rien à faire
 * dans un catalogue d'éditions physiques, et le sitemap ne les liste pas non
 * plus. `nulls: "last"` est indispensable, PostgreSQL classant les nuls en
 * premier sur un `desc`.
 */
export async function getFilmsParGenre(genre: string): Promise<Film[]> {
  const { data, error } = await supabase
    .from("films")
    .select("*, edition_films!inner(edition_id)")
    .contains("genres", [genre])
    .order("popularite", { ascending: false, nullsFirst: false })
    .limit(PLAFOND);
  if (error) throw new Error(`Erreur lors du chargement du genre ${genre}: ${error.message}`);
  // Un film à plusieurs éditions ressort autant de fois que de liens.
  const vus = new Set<number>();
  return ((data ?? []) as Film[]).filter((f) => !vus.has(f.id) && vus.add(f.id));
}
