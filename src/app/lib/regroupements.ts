/* GÉNÉRÉ PAR scripts/generer-regroupements.mjs, NE PAS ÉDITER À LA MAIN. */

/**
 * Tables des pages de regroupement.
 *
 * Un slug d'URL doit être stable, donc il est figé ici plutôt que recalculé au
 * rendu. Relancer le script quand le catalogue a bougé :
 *
 *     node scripts/generer-regroupements.mjs
 *
 * `compte` est un instantané de génération, pas une vérité courante : la page
 * affiche le nombre qu'elle a réellement chargé, jamais celui-ci.
 */

export interface Regroupement {
  /** Segment d'URL, figé. */
  slug: string;
  /** Valeur telle qu'elle est en base, qui sert aussi de filtre PostgREST. */
  libelle: string;
  /** Effectif au moment de la génération. Indicatif. */
  compte: number;
}

/** `formats_extraits` des éditions. */
export const FORMATS: Regroupement[] = [
  { slug: "blu-ray", libelle: "Blu-ray", compte: 5572 },
  { slug: "blu-ray-4k", libelle: "Blu-ray 4K", compte: 2611 },
  { slug: "steelbook", libelle: "Steelbook", compte: 1766 },
  { slug: "slipcover", libelle: "Slipcover", compte: 959 },
  { slug: "digipack", libelle: "Digipack", compte: 688 },
  { slug: "coffret", libelle: "Coffret", compte: 436 },
  { slug: "dvd", libelle: "DVD", compte: 337 },
  { slug: "blu-ray-3d", libelle: "Blu-ray 3D", compte: 103 },
  { slug: "digibook", libelle: "Digibook", compte: 94 },
];

/** `editeur` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
  { slug: "warner-bros", libelle: "Warner Bros.", compte: 310 },
  { slug: "universal-studios", libelle: "Universal Studios", compte: 186 },
  { slug: "studio-canal", libelle: "Studio Canal", compte: 155 },
  { slug: "sony-pictures", libelle: "Sony Pictures", compte: 151 },
  { slug: "disney-buena-vista", libelle: "Disney / Buena Vista", compte: 127 },
  { slug: "20th-century-fox", libelle: "20th Century Fox", compte: 124 },
  { slug: "paramount-pictures", libelle: "Paramount Pictures", compte: 120 },
  { slug: "anime", libelle: "@Anime", compte: 90 },
  { slug: "elephant-films", libelle: "Elephant Films", compte: 88 },
  { slug: "metropolitan", libelle: "Metropolitan", compte: 75 },
  { slug: "fox-pathe-europa", libelle: "Fox Pathe Europa", compte: 65 },
  { slug: "carlotta-films", libelle: "Carlotta Films", compte: 52 },
  { slug: "m6-video", libelle: "M6 Video", compte: 51 },
  { slug: "gaumont", libelle: "Gaumont", compte: 49 },
  { slug: "kaze", libelle: "Kaze", compte: 45 },
  { slug: "crunchyroll-llc", libelle: "Crunchyroll, LLC", compte: 40 },
  { slug: "pathe-distribution", libelle: "Pathe Distribution", compte: 40 },
  { slug: "wild-side-video", libelle: "Wild Side Video", compte: 39 },
  { slug: "hbo", libelle: "HBO", compte: 38 },
  { slug: "koba-films", libelle: "Koba Films", compte: 35 },
  { slug: "tf1-video", libelle: "TF1 Vidéo", compte: 32 },
  { slug: "ab-video", libelle: "AB Vidéo", compte: 29 },
  { slug: "dybex", libelle: "Dybex", compte: 28 },
  { slug: "esc-editions", libelle: "ESC Editions", compte: 24 },
  { slug: "france-televisions-distribution", libelle: "France Télévisions Distribution", compte: 24 },
  { slug: "kana-home-video", libelle: "Kana Home Video", compte: 24 },
  { slug: "potemkine", libelle: "Potemkine", compte: 21 },
  { slug: "arte-editions", libelle: "Arte Éditions", compte: 19 },
  { slug: "hk-video", libelle: "HK Vidéo", compte: 19 },
  { slug: "metro-goldwyn-mayer", libelle: "Metro-Goldwyn-Mayer", compte: 18 },
  { slug: "lcj-editions", libelle: "LCJ Editions", compte: 16 },
  { slug: "black-box", libelle: "Black Box", compte: 15 },
  { slug: "rimini-editions", libelle: "Rimini Editions", compte: 15 },
  { slug: "l-atelier-d-images", libelle: "L'atelier d'images", compte: 14 },
  { slug: "bqhl-editions", libelle: "BQHL Éditions", compte: 13 },
  { slug: "citel-video", libelle: "Citel Video", compte: 13 },
  { slug: "lucasfilm", libelle: "Lucasfilm", compte: 12 },
  { slug: "entertainment-one", libelle: "Entertainment One", compte: 11 },
  { slug: "seven7", libelle: "Seven7", compte: 11 },
  { slug: "sidonis-calysta", libelle: "Sidonis Calysta", compte: 11 },
];

/** `genres` des films, source TMDB. */
export const GENRES: Regroupement[] = [
  { slug: "drame", libelle: "Drame", compte: 1863 },
  { slug: "action", libelle: "Action", compte: 1203 },
  { slug: "comedie", libelle: "Comédie", compte: 1109 },
  { slug: "thriller", libelle: "Thriller", compte: 944 },
  { slug: "aventure", libelle: "Aventure", compte: 908 },
  { slug: "animation", libelle: "Animation", compte: 750 },
  { slug: "crime", libelle: "Crime", compte: 728 },
  { slug: "science-fiction", libelle: "Science-Fiction", compte: 677 },
  { slug: "horreur", libelle: "Horreur", compte: 570 },
  { slug: "fantastique", libelle: "Fantastique", compte: 524 },
  { slug: "mystere", libelle: "Mystère", compte: 428 },
  { slug: "romance", libelle: "Romance", compte: 412 },
  { slug: "familial", libelle: "Familial", compte: 379 },
  { slug: "science-fiction-fantastique", libelle: "Science-Fiction & Fantastique", compte: 331 },
  { slug: "action-adventure", libelle: "Action & Adventure", compte: 308 },
  { slug: "histoire", libelle: "Histoire", compte: 211 },
  { slug: "documentaire", libelle: "Documentaire", compte: 188 },
  { slug: "guerre", libelle: "Guerre", compte: 166 },
  { slug: "musique", libelle: "Musique", compte: 160 },
  { slug: "western", libelle: "Western", compte: 93 },
  { slug: "telefilm", libelle: "Téléfilm", compte: 72 },
  { slug: "war-politics", libelle: "War & Politics", compte: 50 },
  { slug: "kids", libelle: "Kids", compte: 11 },
];

export const AXES = {
  formats: { titre: "Formats", tables: FORMATS, base: "/formats" },
  editeurs: { titre: "Éditeurs", tables: EDITEURS, base: "/editeurs" },
  genres: { titre: "Genres", tables: GENRES, base: "/genres" },
} as const;

export type NomAxe = keyof typeof AXES;

/** Retrouve une entrée par son slug, ou null. */
export function trouver(axe: NomAxe, slug: string): Regroupement | null {
  return AXES[axe].tables.find((e) => e.slug === slug) ?? null;
}
