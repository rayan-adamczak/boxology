import { supabase } from "./supabase";
import { searchFilms, type Film, type ResultatRecherche } from "./reelio-db";
import { EDITEURS, FORMATS, GENRES } from "./regroupements";

/**
 * Filtres de la page Catalogue, posés le 3 août 2026.
 *
 * Six axes, et ils ne se lisent pas au même endroit : décennie, genre, note et
 * type sont des colonnes de `films`, éditeur et format des colonnes
 * d'`editions`. D'où deux chemins, et c'est ce qui explique la forme du code
 * ci-dessous plutôt qu'une seule requête à rallonge.
 *
 * **Les valeurs viennent de `regroupements.ts`**, la table générée au build :
 * pas de `distinct` à demander à PostgREST, qui ne sait pas le faire sans vue
 * dédiée, et les mêmes libellés que les pages `/formats`, `/publishers` et
 * `/genres`. Une liste écrite à la main aurait dérivé au premier import.
 */
export interface Filtres {
  /** Première année de la décennie, `1990` pour les années 1990. */
  decennie?: number;
  /** Libellé de genre, tel qu'écrit dans `films.genres`. */
  genre?: string;
  /** Note minimale sur 10. */
  noteMin?: number;
  type?: "film" | "serie";
  /** Libellé d'éditeur, tel qu'écrit dans `editions.editeur`. */
  editeur?: string;
  /** Libellé de format, tel qu'écrit dans `editions.formats_extraits`. */
  format?: string;
}

/** Décennies proposées. 1930 en plancher : en dessous, le catalogue est creux. */
export const DECENNIES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930];

export const NOTES = [8, 7, 6, 5];

export function filtresActifs(f: Filtres): number {
  return Object.values(f).filter((v) => v !== undefined && v !== "").length;
}

/** Lit les filtres depuis l'URL. Une valeur inconnue est ignorée, pas rejetée. */
export function lireFiltres(params: URLSearchParams): Filtres {
  const nombre = (cle: string) => {
    const brut = Number(params.get(cle));
    return Number.isFinite(brut) && brut > 0 ? brut : undefined;
  };
  const parmi = (cle: string, valeurs: string[]) => {
    const v = params.get(cle) ?? "";
    return valeurs.includes(v) ? v : undefined;
  };

  const decennie = nombre("decennie");
  const type = params.get("type");

  return {
    decennie: decennie && DECENNIES.includes(decennie) ? decennie : undefined,
    genre: parmi("genre", GENRES.map((g) => g.libelle)),
    noteMin: NOTES.includes(nombre("note") ?? 0) ? nombre("note") : undefined,
    type: type === "film" || type === "serie" ? type : undefined,
    editeur: parmi("editeur", EDITEURS.map((e) => e.libelle)),
    format: parmi("format", FORMATS.map((f) => f.libelle)),
  };
}

/** Réécrit les paramètres d'URL, en gardant la recherche en cours. */
export function ecrireFiltres(f: Filtres, terme: string): Record<string, string> {
  const p: Record<string, string> = {};
  if (terme) p.q = terme;
  if (f.decennie) p.decennie = String(f.decennie);
  if (f.genre) p.genre = f.genre;
  if (f.noteMin) p.note = String(f.noteMin);
  if (f.type) p.type = f.type;
  if (f.editeur) p.editeur = f.editeur;
  if (f.format) p.format = f.format;
  return p;
}

/**
 * Les identifiants de films portés par une édition d'un éditeur ou d'un format
 * donné.
 *
 * Le filtre passe par `edition_films` et non par `editions.film_id` : cette
 * colonne est un vestige, nulle sur 858 lignes, et le rattachement vit dans la
 * table de liaison (§3). Un coffret rend donc plusieurs films, ce qui est le
 * comportement voulu.
 *
 * **Plafonné à 1 000**, comme toute lecture PostgREST (§9). Warner, le plus
 * gros éditeur du catalogue, porte 310 films : la limite ne mord pas
 * aujourd'hui, mais elle est là pour ne pas tronquer en silence si elle mordait
 * un jour, et l'appelant en est averti par `tronque`.
 */
async function filmsPortesPar(filtres: Filtres): Promise<{ ids: number[]; tronque: boolean } | null> {
  if (!filtres.editeur && !filtres.format) return null;

  let requete = supabase
    .from("edition_films")
    .select("film_id, editions!inner(editeur, formats_extraits)")
    .limit(1000);

  if (filtres.editeur) requete = requete.eq("editions.editeur", filtres.editeur);
  if (filtres.format) requete = requete.contains("editions.formats_extraits", [filtres.format]);

  const { data, error } = await requete;
  if (error) throw new Error(`Filtre par édition impossible : ${error.message}`);

  const lignes = (data ?? []) as { film_id: number }[];
  const ids = [...new Set(lignes.map((l) => l.film_id))];
  return { ids, tronque: lignes.length >= 1000 };
}

export interface ResultatCatalogue extends ResultatRecherche {
  /** Vrai quand le filtre par édition a buté sur le plafond de 1 000 lignes. */
  tronque: boolean;
}

/**
 * Recherche et filtres, ensemble.
 *
 * Deux régimes, parce que la recherche classée vit dans une fonction SQL
 * (`public.recherche_films`, §7) et qu'on ne greffe pas de jointure dessus :
 *
 *   sans terme   requête directe sur `films`, tous les filtres côté serveur,
 *                classement par popularité ;
 *   avec terme   la fonction rend ses 200 premiers résultats **classés**, et
 *                les filtres s'appliquent ensuite en mémoire.
 *
 * Filtrer en mémoire n'est acceptable que parce que le classement est déjà
 * fait : on ne réordonne rien, on retire. Le revers est assumé et visible, une
 * recherche très large plus un filtre rare peut rendre peu de lignes alors que
 * la base en contient davantage.
 */
export async function chercherCatalogue(
  terme: string,
  filtres: Filtres,
  limite = 60,
): Promise<ResultatCatalogue> {
  const aucunFiltre = filtresActifs(filtres) === 0;
  if (aucunFiltre) {
    const base = await searchFilms(terme);
    return { ...base, tronque: false };
  }

  const parEdition = await filmsPortesPar(filtres);
  if (parEdition && parEdition.ids.length === 0) {
    return { films: [], approchante: false, tronque: parEdition.tronque };
  }

  if (terme.trim()) {
    const { data, error } = await supabase.rpc("recherche_films", { terme: terme.trim(), limite: 200 });
    if (error) throw new Error(`Erreur lors de la recherche de films : ${error.message}`);
    const films = filtrerEnMemoire((data ?? []) as Film[], filtres, parEdition?.ids);
    return { films: films.slice(0, limite), approchante: false, tronque: parEdition?.tronque ?? false };
  }

  let requete = supabase.from("films").select("*");
  if (filtres.decennie) {
    requete = requete.gte("annee", filtres.decennie).lte("annee", filtres.decennie + 9);
  }
  if (filtres.genre) requete = requete.contains("genres", [filtres.genre]);
  if (filtres.noteMin) requete = requete.gte("note", filtres.noteMin);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (parEdition) requete = requete.in("id", parEdition.ids.slice(0, 1000));

  // `nullsFirst: false` est indispensable : PostgreSQL classe les nuls en tête
  // d'un `desc`, et la page s'ouvrirait sur les fiches les moins renseignées.
  const { data, error } = await requete
    .order("popularite", { ascending: false, nullsFirst: false })
    .limit(limite);
  if (error) throw new Error(`Erreur lors du chargement du catalogue : ${error.message}`);

  return { films: (data ?? []) as Film[], approchante: false, tronque: parEdition?.tronque ?? false };
}

/**
 * Les mêmes règles, appliquées en mémoire sur ce que la fonction SQL a rendu.
 *
 * `annee` et `note` sont typés `string | number` : PostgREST rend un `numeric`
 * en chaîne, et comparer une chaîne à un nombre en JavaScript passe par une
 * conversion implicite qu'on préfère écrire. `genres` est un `text[]` en base
 * mais le type du dépôt le déclare en `string` : on accepte les deux plutôt que
 * de mentir sur l'un ou l'autre.
 */
function filtrerEnMemoire(films: Film[], f: Filtres, ids?: number[]): Film[] {
  const permis = ids ? new Set(ids) : null;

  return films.filter((film) => {
    if (permis && !permis.has(film.id)) return false;

    if (f.decennie) {
      const annee = Number(film.annee);
      if (!Number.isFinite(annee) || annee < f.decennie || annee > f.decennie + 9) return false;
    }
    if (f.genre) {
      const genres = Array.isArray(film.genres) ? (film.genres as string[]) : String(film.genres ?? "").split(",");
      if (!genres.some((g) => g.trim() === f.genre)) return false;
    }
    if (f.noteMin && !(Number(film.note) >= f.noteMin)) return false;
    if (f.type && (film as { type?: string }).type !== f.type) return false;

    return true;
  });
}
