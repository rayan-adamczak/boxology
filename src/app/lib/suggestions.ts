import { AXES, type NomAxe, type Regroupement } from "./regroupements";

/**
 * Passerelles vers les pages de regroupement, depuis la recherche.
 *
 * Taper « Carlotta » ne pouvait rien rendre : l'éditeur est une colonne des
 * **éditions**, la recherche porte sur les **films**, et aucun titre ne
 * s'appelle Carlotta. La réponse existait pourtant déjà, `/publishers/carlotta-films`
 * liste ses 283 éditions depuis le 31 juillet 2026.
 *
 * Rien n'est demandé à la base : `regroupements.ts` est généré au build et
 * porte déjà les 75 entrées avec leur slug. Une recherche d'éditeur coûte donc
 * une comparaison de chaînes, pas un aller-retour réseau.
 *
 * **C'est un raccourci, pas un résultat.** Ces puces s'affichent au-dessus des
 * films sans les remplacer : « Warner » nomme un éditeur *et* apparaît dans des
 * titres, et rien ne dit laquelle des deux intentions est la bonne.
 */

/** Au singulier : la puce désigne une entrée, pas l'axe entier. */
const INTITULE: Record<NomAxe, string> = {
  formats: "Format",
  publishers: "Éditeur",
  genres: "Genre",
};

export interface Suggestion {
  axe: NomAxe;
  intitule: string;
  libelle: string;
  href: string;
  compte: number;
}

/**
 * Même normalisation que `public.mots_recherche` en base : accents repliés,
 * ponctuation ramenée à l'espace. Les deux doivent dire la même chose, sinon
 * « Disney / Buena Vista » se cherche d'une façon ici et d'une autre là.
 */
function mots(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Rang de correspondance, du plus fort au plus faible. `null` = pas de
 * correspondance.
 *
 * Le début d'un mot passe avant une occurrence au milieu d'un autre : sans
 * quoi « ese » remonterait *ESC Editions* par le milieu de « Editions ».
 */
function rang(libelle: string, terme: string): number | null {
  const cible = mots(libelle);
  if (cible === terme) return 0;
  if (cible.startsWith(terme)) return 1;
  if (` ${cible}`.includes(` ${terme}`)) return 2;
  return null;
}

/** Une saisie plus courte ne désigne rien : « bl » remonterait la moitié des formats. */
const LONGUEUR_MINIMALE = 3;

/** Au-delà, la rangée de puces se lit comme une seconde liste de résultats. */
const MAXIMUM = 4;

export function suggestionsPour(query: string): Suggestion[] {
  const terme = mots(query);
  if (terme.length < LONGUEUR_MINIMALE) return [];

  const trouvees: (Suggestion & { rang: number })[] = [];
  for (const [axe, { tables, base }] of Object.entries(AXES) as [
    NomAxe,
    { tables: readonly Regroupement[]; base: string },
  ][]) {
    for (const entree of tables) {
      const r = rang(entree.libelle, terme);
      if (r === null) continue;
      trouvees.push({
        axe,
        rang: r,
        intitule: INTITULE[axe],
        libelle: entree.libelle,
        href: `${base}/${entree.slug}`,
        compte: entree.compte,
      });
    }
  }

  // À rang égal, l'effectif tranche : `compte` est un instantané de génération,
  // ce qui suffit à ordonner, jamais à afficher un décompte au visiteur.
  return trouvees
    .sort((a, b) => a.rang - b.rang || b.compte - a.compte)
    .slice(0, MAXIMUM)
    .map(({ rang: _rang, ...suggestion }) => suggestion);
}
