import { supabase } from "./supabase";
import type { Film } from "./reelio-db";

/**
 * Sélection hebdomadaire de gros titres récemment édités en physique.
 *
 * Sert la vignette « Mes envies » de la page de bienvenue : y montrer trois
 * films que le visiteur reconnaît vaut mieux que trois éditions prises au
 * hasard, parce que l'exemple doit ressembler à la liste qu'il se ferait.
 *
 * **Le tri part de `films.popularite` et non des éditions.** La colonne
 * `editions.date_parution` semblait le bon axe — « les dernières sorties » —
 * mais elle n'existe que sur les lignes blu-ray.com, qui ne portent aucun
 * visuel, tandis que les 3 193 visuels du catalogue sont chez editioncollector,
 * qui ne date rien. Le recouvrement est nul : une requête « récent *et*
 * illustré » rend zéro ligne. On passe donc par la date de sortie salle du
 * film, qui est renseignée et qui dit la même chose ici, un gros titre étant
 * édité dans l'année qui suit.
 *
 * Rotation hebdomadaire sans tâche planifiée : le numéro de semaine décale la
 * fenêtre dans un vivier des films les plus populaires. Rien à faire tourner,
 * rien à maintenir, et la page change même les semaines sans nouvel import.
 */

export interface FilmVitrine {
  id: number;
  titre: string;
  affiche_url: string | null;
}

export interface EditionVitrine {
  id: number;
  titre: string | null;
  image_url: string | null;
  formats_extraits: string | null;
}

export interface LigneVitrine {
  film: FilmVitrine;
  /** L'édition illustrée retenue, quand le film en a une. */
  edition: EditionVitrine | null;
}

/**
 * Films par identifiant, rendus dans l'ordre demandé.
 *
 * L'ordre compte : l'appelant désigne une liste choisie — le contenu d'un
 * coffret, une sélection d'exemples — et l'affiche telle quelle, là où
 * PostgREST rend ce que l'index lui donne.
 *
 * Ici plutôt que dans `reelio-db` : seule la page de bienvenue s'en sert, et le
 * module des données partagées est retouché par ailleurs. À y remonter le jour
 * où un deuxième appelant apparaît.
 */
export async function getFilmsByIds(ids: number[]): Promise<Film[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("films").select("*").in("id", ids);
  if (error) throw new Error(`Erreur lors du chargement des films: ${error.message}`);
  const parId = new Map((data as Film[]).map((f) => [f.id, f]));
  return ids.map((id) => parId.get(id)).filter((f): f is Film => Boolean(f));
}

const SEMAINE_MS = 7 * 24 * 60 * 60 * 1000;

/** Taille du vivier où la fenêtre hebdomadaire se déplace. */
const VIVIER = 24;

/** Ancienneté maximale de la sortie salle, en jours. */
const FENETRE_JOURS = 540;

/** Numéro de semaine absolu depuis l'époque Unix. */
export function semaine(maintenant: number = Date.now()): number {
  return Math.floor(maintenant / SEMAINE_MS);
}

function jour(decalageJours = 0): string {
  return new Date(Date.now() + decalageJours * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Trois films populaires édités en physique, renouvelés chaque semaine.
 *
 * Rend au plus `nombre` lignes, et moins si le vivier est plus court. L'appelant
 * doit tenir l'absence : la vignette se lit avec deux lignes.
 */
export async function getVitrineHebdo(nombre = 3): Promise<LigneVitrine[]> {
  // `edition_films!inner` écarte les films sans édition : un film sans jaquette
  // au catalogue n'a rien à faire dans une liste d'envies.
  const { data: films, error } = await supabase
    .from("films")
    .select("id, titre, affiche_url, edition_films!inner(edition_id)")
    .not("date_sortie", "is", null)
    .lte("date_sortie", jour())
    .gte("date_sortie", jour(-FENETRE_JOURS))
    .order("popularite", { ascending: false, nullsFirst: false })
    .limit(VIVIER);
  if (error) throw new Error(`Erreur lors du chargement de la vitrine: ${error.message}`);

  const vivier = (films ?? []) as FilmVitrine[];
  if (vivier.length === 0) return [];

  // La fenêtre glisse de `nombre` films par semaine et boucle sur le vivier.
  const groupes = Math.max(1, Math.floor(vivier.length / nombre));
  const debut = (semaine() % groupes) * nombre;
  // Le vivier est parcouru en boucle à partir de `debut` : les films qui n'ont
  // pas d'édition illustrée sont sautés, et sans ce report on rendrait deux
  // lignes là où le vivier en contient de quoi en remplir trois.
  const ordonnes = [...vivier.slice(debut), ...vivier.slice(0, debut)];

  const { data: liens, error: erreurLiens } = await supabase
    .from("edition_films")
    .select("film_id, edition:editions!inner(id, titre, image_url, formats_extraits)")
    .in("film_id", ordonnes.map((f) => f.id))
    .not("edition.image_url", "is", null);
  if (erreurLiens) throw new Error(`Erreur lors du chargement des éditions: ${erreurLiens.message}`);

  const parFilm = new Map<number, EditionVitrine>();
  // PostgREST rend `edition` comme un objet, la relation partant d'une clé
  // étrangère, mais les types générés l'annoncent en tableau : on accepte les
  // deux formes plutôt que de parier sur l'une.
  for (const lien of (liens ?? []) as unknown as {
    film_id: number;
    edition: EditionVitrine | EditionVitrine[] | null;
  }[]) {
    const edition = Array.isArray(lien.edition) ? lien.edition[0] : lien.edition;
    if (edition && !parFilm.has(lien.film_id)) parFilm.set(lien.film_id, edition);
  }

  return ordonnes
    .filter((film) => parFilm.has(film.id))
    .slice(0, nombre)
    .map((film) => ({ film, edition: parFilm.get(film.id) ?? null }));
}
