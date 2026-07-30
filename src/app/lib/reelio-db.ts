import { supabase } from "./supabase";

/* ---- Row types ---- */

export interface Film {
  id: number;
  titre: string;
  realisateur: string | null;
  duree: string | null;
  note: string | number | null;
  annee: string | number | null;
  synopsis: string | null;
  affiche_url: string | null;
  genres: string | null;
  cast_principal: unknown | null;
  scenariste: string | null;
}

export interface Edition {
  id: number;
  film_id: number;
  titre: string | null;
  formats_extraits: string | null;
  prix_fnac_extrait: string | null;
  image_url: string | null;
  pays: string | null;
  date_sortie: string | null;
  region: string | null;
}

export type StatutValue = "envie" | "possede";

/** An edition joined with its parent film — used by the list pages. */
export interface EditionWithFilm extends Edition {
  film: Pick<Film, "id" | "titre" | "affiche_url"> | null;
}

/* ---- Films ---- */

export async function searchFilms(query: string): Promise<Film[]> {
  let req = supabase.from("films").select("*").order("titre", { ascending: true }).limit(50);
  if (query.trim()) req = req.ilike("titre", `%${query.trim()}%`);
  const { data, error } = await req;
  if (error) throw new Error(`Erreur lors de la recherche de films: ${error.message}`);
  return (data ?? []) as Film[];
}

export async function getFilm(id: number): Promise<Film | null> {
  const { data, error } = await supabase.from("films").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Erreur lors du chargement du film ${id}: ${error.message}`);
  return (data as Film) ?? null;
}

/** Find all films where a person appears as director or in cast_principal. */
export async function searchFilmsByPerson(name: string): Promise<Film[]> {
  const escaped = name.replace(/[%_]/g, "\\$&");

  const [byDirector, byCast] = await Promise.all([
    supabase.from("films").select("*").ilike("realisateur", `%${escaped}%`),
    supabase.from("films").select("*").filter("cast_principal", "cs", JSON.stringify([{ nom: name }])),
  ]);

  if (byDirector.error) throw new Error(`Erreur réalisateur: ${byDirector.error.message}`);
  if (byCast.error) throw new Error(`Erreur cast: ${byCast.error.message}`);

  const seen = new Set<number>();
  const merged: Film[] = [];
  for (const film of [...(byDirector.data ?? []), ...(byCast.data ?? [])] as Film[]) {
    if (!seen.has(film.id)) { seen.add(film.id); merged.push(film); }
  }
  return merged.sort((a, b) => a.titre.localeCompare(b.titre));
}

/* ---- Editions ---- */

export async function getEditionsForFilm(filmId: number): Promise<Edition[]> {
  // Les éditions passent par edition_films : un coffret contient plusieurs films,
  // il doit donc apparaître sur la fiche de chacun d'eux.
  const { data, error } = await supabase
    .from("editions")
    .select("*, edition_films!inner(film_id)")
    .eq("edition_films.film_id", filmId)
    .order("id", { ascending: true });
  if (error) throw new Error(`Erreur lors du chargement des éditions du film ${filmId}: ${error.message}`);
  return (data ?? []).map(({ edition_films: _ignored, ...edition }) => edition) as Edition[];
}

/**
 * Fetch a list of editions by their IDs, joined with their parent film.
 *
 * Découpé en tranches parce que PostgREST plafonne à 1 000 lignes par réponse :
 * une collection plus grande verrait ses éditions disparaître de la liste sans
 * la moindre erreur. La taille de tranche tient aussi la longueur de l'URL, le
 * filtre `in` étant sérialisé dans la query string.
 */
export async function getEditionsByIds(ids: number[]): Promise<EditionWithFilm[]> {
  if (ids.length === 0) return [];

  const TRANCHE = 500;
  const resultat: EditionWithFilm[] = [];

  for (let debut = 0; debut < ids.length; debut += TRANCHE) {
    const { data, error } = await supabase
      .from("editions")
      // `!film_id` désigne explicitement la colonne à suivre. Sans cet indice,
      // PostgREST voit deux chemins entre `editions` et `films` — la colonne
      // `film_id` et la table de liaison `edition_films` — et refuse la requête
      // avec « more than one relationship was found ».
      .select("*, film:films!film_id(id, titre, affiche_url)")
      .in("id", ids.slice(debut, debut + TRANCHE));
    if (error) throw new Error(`Erreur lors du chargement des éditions: ${error.message}`);
    resultat.push(...((data ?? []) as EditionWithFilm[]));
  }

  return resultat;
}
