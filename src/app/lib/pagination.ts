/**
 * Pagination des pages de regroupement.
 *
 * Module sans aucune dépendance, et c'est le point : `functions/_middleware.ts`
 * l'importe pour servir exactement les mêmes adresses et la même fenêtre de
 * numéros que l'application. Le poser dans `listes.ts` aurait tiré
 * `@supabase/postgrest-js` dans le Worker, et dans `RegroupementPage.tsx` aurait
 * tiré React.
 *
 * La duplication est le vrai risque ici : deux implémentations qui divergent
 * produiraient une page servie et une page rendue avec des liens différents,
 * ce qui ne se voit ni à l'œil ni au build.
 */

/** Nombre de lignes par page. */
export const PAR_PAGE = 60;

/** Nombre de pages d'une sélection, au moins une même vide. */
export function nombreDePages(total: number): number {
  return Math.max(1, Math.ceil(total / PAR_PAGE));
}

/**
 * `/genres/horreur` pour la première page, `/genres/horreur/3` ensuite.
 *
 * La première page n'a pas de `/1` : deux adresses pour le même contenu sont
 * deux doublons, et le middleware redirige `/x/y/1` vers `/x/y` en 301.
 */
export function cheminPage(base: string, slug: string, page: number): string {
  return page <= 1 ? `${base}/${slug}` : `${base}/${slug}/${page}`;
}

/**
 * Numéros à afficher : les extrémités, et une fenêtre autour de la page
 * courante. `0` marque une coupure, à rendre en points de suspension.
 *
 * Sur 93 pages, tout lister ferait 93 liens en pied de page, dont l'essentiel
 * sans rapport avec l'endroit où on se trouve. Mais garder la première et la
 * dernière compte pour le crawl : elles restent atteignables en un saut.
 */
export function fenetrePages(page: number, pages: number, rayon = 2): number[] {
  if (pages <= 1) return [];
  const numeros = new Set<number>([1, pages]);
  for (let n = page - rayon; n <= page + rayon; n++) {
    if (n >= 1 && n <= pages) numeros.add(n);
  }
  const tries = [...numeros].sort((a, b) => a - b);

  const sortie: number[] = [];
  let precedent = 0;
  for (const n of tries) {
    if (precedent && n - precedent > 1) sortie.push(0);
    sortie.push(n);
    precedent = n;
  }
  return sortie;
}
