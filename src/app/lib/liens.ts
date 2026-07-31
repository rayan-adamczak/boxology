/**
 * Construction des URL internes.
 *
 * L'adresse canonique d'une fiche film est `/films/<slug>/<id>`, sur le modèle
 * de SensCritique. Le slug est décoratif, l'id fait autorité, ce qui règle
 * trois choses d'un coup :
 *
 *   - `films.titre` est un instantané pris à l'import, pas un miroir de TMDB,
 *     et il dérive : 89 titres réécrits le 30 juillet 2026. Un slug seul aurait
 *     rendu ces URL caduques ; ici l'id continue de résoudre et la Pages
 *     Function redirige en 301 vers la forme courante ;
 *   - les homonymes (deux *Dune*, deux *Nosferatu*) n'ont besoin d'aucun
 *     suffixe d'unicité bricolé ;
 *   - un titre qui ne produit aucun slug (opéras, titres non latins) reste
 *     servable sous sa forme nue.
 *
 * Un lien qui ne connaît que l'id n'est donc pas une faute : il fonctionne, au
 * prix d'une redirection. Passer l'objet quand on l'a évite ce détour.
 */

/** Ce qu'il faut savoir d'un film pour lui fabriquer une adresse. */
export interface CibleFilm {
  id: number;
  slug?: string | null;
}

/** `/films/la-la-land-2016/11913569`, ou `/films/11913569` à défaut de slug. */
export function lienFilm(film: CibleFilm | null | undefined): string | null {
  if (!film || typeof film.id !== "number") return null;
  return film.slug ? `/films/${film.slug}/${film.id}` : `/films/${film.id}`;
}
