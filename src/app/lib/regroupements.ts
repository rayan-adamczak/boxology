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
  { slug: "blu-ray", libelle: "Blu-ray", compte: 11887 },
  { slug: "blu-ray-4k", libelle: "Blu-ray 4K", compte: 5190 },
  { slug: "steelbook", libelle: "Steelbook", compte: 2190 },
  { slug: "dvd", libelle: "DVD", compte: 1545 },
  { slug: "slipcover", libelle: "Slipcover", compte: 1070 },
  { slug: "digipack", libelle: "Digipack", compte: 703 },
  { slug: "coffret", libelle: "Coffret", compte: 437 },
  { slug: "digibook", libelle: "Digibook", compte: 218 },
  { slug: "blu-ray-3d", libelle: "Blu-ray 3D", compte: 128 },
];

/** `editeur` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
  { slug: "kino-lorber", libelle: "Kino Lorber", compte: 635 },
  { slug: "warner-bros", libelle: "Warner Bros.", compte: 492 },
  { slug: "studio-canal", libelle: "Studio Canal", compte: 487 },
  { slug: "arrow-video", libelle: "Arrow Video", compte: 448 },
  { slug: "universal-pictures", libelle: "Universal Pictures", compte: 376 },
  { slug: "shout-factory", libelle: "Shout Factory", compte: 371 },
  { slug: "the-criterion-collection", libelle: "The Criterion Collection", compte: 346 },
  { slug: "88-films", libelle: "88 Films", compte: 342 },
  { slug: "sony-pictures", libelle: "Sony Pictures", compte: 338 },
  { slug: "warner-archive", libelle: "Warner Archive", compte: 321 },
  { slug: "network", libelle: "Network", compte: 313 },
  { slug: "severin-films", libelle: "Severin Films", compte: 310 },
  { slug: "paramount-home-entertainment", libelle: "Paramount Home Entertainment", compte: 301 },
  { slug: "carlotta-films", libelle: "Carlotta Films", compte: 283 },
  { slug: "bqhl-editions", libelle: "BQHL Editions", compte: 270 },
  { slug: "warner-video", libelle: "Warner Vidéo", compte: 266 },
  { slug: "elephant-films", libelle: "Elephant Films", compte: 265 },
  { slug: "vinegar-syndrome", libelle: "Vinegar Syndrome", compte: 250 },
  { slug: "paramount", libelle: "Paramount", compte: 210 },
  { slug: "rimini-editions", libelle: "Rimini Editions", compte: 206 },
  { slug: "studiocanal", libelle: "Studiocanal", compte: 205 },
  { slug: "esc-editions", libelle: "ESC Editions", compte: 201 },
  { slug: "universal-studios", libelle: "Universal Studios", compte: 186 },
  { slug: "le-chat-qui-fume", libelle: "Le Chat qui fume", compte: 182 },
  { slug: "gaumont", libelle: "Gaumont", compte: 180 },
  { slug: "sidonis-calysta", libelle: "Sidonis Calysta", compte: 169 },
  { slug: "artus-films", libelle: "Artus Films", compte: 151 },
  { slug: "20th-century-fox", libelle: "20th Century Fox", compte: 144 },
  { slug: "powerhouse-films", libelle: "Powerhouse Films", compte: 142 },
  { slug: "second-sight-films", libelle: "Second Sight Films", compte: 139 },
  { slug: "lionsgate", libelle: "Lionsgate", compte: 138 },
  { slug: "eureka-entertainment", libelle: "Eureka Entertainment", compte: 132 },
  { slug: "spirit-entertainment", libelle: "Spirit Entertainment", compte: 132 },
  { slug: "radiance-films", libelle: "Radiance Films", compte: 131 },
  { slug: "bfi", libelle: "BFI", compte: 130 },
  { slug: "disney-buena-vista", libelle: "Disney / Buena Vista", compte: 127 },
  { slug: "uncut-movies", libelle: "Uncut Movies", compte: 127 },
  { slug: "spectrum-films", libelle: "Spectrum Films", compte: 126 },
  { slug: "paramount-pictures", libelle: "Paramount Pictures", compte: 120 },
  { slug: "lcj-editions", libelle: "LCJ Editions", compte: 102 },
  { slug: "tamasa-diffusion", libelle: "Tamasa Diffusion", compte: 99 },
  { slug: "coin-de-mire", libelle: "Coin de Mire", compte: 93 },
  { slug: "anime", libelle: "@Anime", compte: 90 },
  { slug: "radiance", libelle: "Radiance", compte: 85 },
  { slug: "101-films", libelle: "101 Films", compte: 83 },
  { slug: "screenbound", libelle: "Screenbound", compte: 80 },
  { slug: "lionsgate-films", libelle: "Lionsgate Films", compte: 78 },
  { slug: "curzon-film", libelle: "Curzon Film", compte: 75 },
  { slug: "metropolitan", libelle: "Metropolitan", compte: 75 },
  { slug: "umbrella-entertainment", libelle: "Umbrella Entertainment", compte: 75 },
  { slug: "potemkine", libelle: "Potemkine", compte: 73 },
  { slug: "fox-pathe-europa", libelle: "Fox Pathe Europa", compte: 65 },
  { slug: "pathe", libelle: "Pathé", compte: 62 },
  { slug: "dazzler", libelle: "Dazzler", compte: 61 },
  { slug: "extralucid-films", libelle: "Extralucid Films", compte: 57 },
  { slug: "l-atelier-d-images", libelle: "L'atelier d'Images", compte: 56 },
  { slug: "21st-century-studios", libelle: "21st Century Studios", compte: 52 },
  { slug: "m6-video", libelle: "M6 Video", compte: 51 },
  { slug: "second-run", libelle: "Second Run", compte: 49 },
  { slug: "kaze", libelle: "Kaze", compte: 45 },
  { slug: "metropolitan-films", libelle: "Metropolitan Films", compte: 45 },
  { slug: "pulse-video", libelle: "Pulse Vidéo", compte: 45 },
  { slug: "dogwoof", libelle: "Dogwoof", compte: 44 },
  { slug: "bach-films", libelle: "Bach Films", compte: 41 },
  { slug: "altitude", libelle: "Altitude", compte: 40 },
  { slug: "crunchyroll-llc", libelle: "Crunchyroll, LLC", compte: 40 },
  { slug: "mubi", libelle: "MUBI", compte: 40 },
  { slug: "pathe-distribution", libelle: "Pathe Distribution", compte: 40 },
  { slug: "wild-side-video", libelle: "Wild Side Video", compte: 39 },
  { slug: "hbo", libelle: "HBO", compte: 38 },
  { slug: "the-jokers", libelle: "The Jokers", compte: 38 },
  { slug: "matchbox-films", libelle: "Matchbox Films", compte: 36 },
  { slug: "walt-disney-studios", libelle: "Walt Disney Studios", compte: 36 },
  { slug: "koba-films", libelle: "Koba Films", compte: 35 },
  { slug: "third-window-films", libelle: "Third Window Films", compte: 35 },
  { slug: "tf1-video", libelle: "TF1 Vidéo", compte: 32 },
  { slug: "universal", libelle: "Universal", compte: 32 },
  { slug: "ab-video", libelle: "AB Vidéo", compte: 29 },
  { slug: "kaleidoscope-home-entertainment", libelle: "Kaleidoscope Home Entertainment", compte: 29 },
  { slug: "columbia-pictures", libelle: "Columbia Pictures", compte: 28 },
  { slug: "dybex", libelle: "Dybex", compte: 28 },
  { slug: "picture-house", libelle: "Picture House", compte: 28 },
  { slug: "roboto-films", libelle: "Roboto Films", compte: 27 },
  { slug: "signature-entertainment", libelle: "Signature Entertainment", compte: 27 },
  { slug: "vintage-classics", libelle: "Vintage Classics", compte: 26 },
  { slug: "france-televisions-distribution", libelle: "France Télévisions Distribution", compte: 24 },
  { slug: "kana-home-video", libelle: "Kana Home Video", compte: 24 },
  { slug: "all-the-anime", libelle: "All The Anime", compte: 22 },
  { slug: "cornerstone-media", libelle: "Cornerstone Media", compte: 22 },
  { slug: "entertainment-one", libelle: "Entertainment One", compte: 21 },
  { slug: "factoris-films", libelle: "Factoris Films", compte: 20 },
  { slug: "itv-home-entertainment", libelle: "ITV Home Entertainment", compte: 20 },
  { slug: "lions-gate-home-entertainment", libelle: "Lions Gate Home Entertainment", compte: 20 },
  { slug: "signal-one-entertainment", libelle: "Signal One Entertainment", compte: 20 },
  { slug: "arte-editions", libelle: "Arte Éditions", compte: 19 },
  { slug: "hk-video", libelle: "HK Vidéo", compte: 19 },
  { slug: "icon-home-entertainment", libelle: "Icon Home Entertainment", compte: 19 },
  { slug: "saffron-hill", libelle: "Saffron Hill", compte: 19 },
  { slug: "verve-pictures", libelle: "Verve Pictures", compte: 19 },
  { slug: "disney", libelle: "Disney", compte: 18 },
  { slug: "metro-goldwyn-mayer", libelle: "Metro-Goldwyn-Mayer", compte: 18 },
  { slug: "strawberry-media", libelle: "Strawberry Media", compte: 18 },
  { slug: "crunchyroll", libelle: "Crunchyroll", compte: 17 },
  { slug: "final-cut-entertainment", libelle: "Final Cut Entertainment", compte: 16 },
  { slug: "manga-entertainment", libelle: "Manga Entertainment", compte: 16 },
  { slug: "mediumrare", libelle: "Mediumrare", compte: 16 },
  { slug: "20th-century-studios", libelle: "20th Century Studios", compte: 15 },
  { slug: "black-box", libelle: "Black Box", compte: 15 },
  { slug: "palisades-tartan", libelle: "Palisades Tartan", compte: 15 },
  { slug: "terror-vision", libelle: "Terror Vision", compte: 15 },
  { slug: "drakes-avenue", libelle: "Drakes Avenue", compte: 14 },
  { slug: "les-films-du-camelia", libelle: "Les Films du Camélia", compte: 14 },
  { slug: "shameless", libelle: "Shameless", compte: 14 },
  { slug: "sony", libelle: "Sony", compte: 14 },
  { slug: "bbc", libelle: "BBC", compte: 13 },
  { slug: "citel-video", libelle: "Citel Video", compte: 13 },
  { slug: "lightbulb-film-distribution", libelle: "Lightbulb Film Distribution", compte: 13 },
  { slug: "peccadillo-pictures", libelle: "Peccadillo Pictures", compte: 13 },
  { slug: "trinity-films", libelle: "Trinity Films", compte: 13 },
  { slug: "acorn", libelle: "Acorn", compte: 12 },
  { slug: "channel-4", libelle: "Channel 4", compte: 12 },
  { slug: "lucasfilm", libelle: "Lucasfilm", compte: 12 },
  { slug: "icon-film-distribution", libelle: "ICON FILM DISTRIBUTION", compte: 11 },
  { slug: "intersections", libelle: "Intersections", compte: 11 },
  { slug: "mdc-films", libelle: "MDC Films", compte: 11 },
  { slug: "refuse-films", libelle: "Refuse Films", compte: 11 },
  { slug: "seven7", libelle: "Seven7", compte: 11 },
  { slug: "axiom-films", libelle: "Axiom Films", compte: 10 },
  { slug: "bubbel-pop-edition", libelle: "Bubbel Pop Edition", compte: 10 },
  { slug: "bulldog", libelle: "Bulldog", compte: 10 },
  { slug: "capricci", libelle: "Capricci", compte: 10 },
  { slug: "fabulous-films", libelle: "Fabulous Films", compte: 10 },
  { slug: "yume-pictures", libelle: "YUME PICTURES", compte: 10 },
];

/** `genres` des films, source TMDB. */
export const GENRES: Regroupement[] = [
  { slug: "drame", libelle: "Drame", compte: 4829 },
  { slug: "comedie", libelle: "Comédie", compte: 2584 },
  { slug: "thriller", libelle: "Thriller", compte: 2412 },
  { slug: "action", libelle: "Action", compte: 2084 },
  { slug: "horreur", libelle: "Horreur", compte: 1972 },
  { slug: "crime", libelle: "Crime", compte: 1845 },
  { slug: "aventure", libelle: "Aventure", compte: 1371 },
  { slug: "romance", libelle: "Romance", compte: 1232 },
  { slug: "science-fiction", libelle: "Science-Fiction", compte: 1162 },
  { slug: "mystere", libelle: "Mystère", compte: 1009 },
  { slug: "fantastique", libelle: "Fantastique", compte: 864 },
  { slug: "animation", libelle: "Animation", compte: 845 },
  { slug: "familial", libelle: "Familial", compte: 509 },
  { slug: "histoire", libelle: "Histoire", compte: 468 },
  { slug: "documentaire", libelle: "Documentaire", compte: 459 },
  { slug: "guerre", libelle: "Guerre", compte: 430 },
  { slug: "musique", libelle: "Musique", compte: 372 },
  { slug: "science-fiction-fantastique", libelle: "Science-Fiction & Fantastique", compte: 336 },
  { slug: "western", libelle: "Western", compte: 320 },
  { slug: "action-adventure", libelle: "Action & Adventure", compte: 312 },
  { slug: "telefilm", libelle: "Téléfilm", compte: 149 },
  { slug: "war-politics", libelle: "War & Politics", compte: 52 },
  { slug: "kids", libelle: "Kids", compte: 12 },
];

/**
 * `collection_editeur` des éditions : les séries numérotées d'éditeur.
 *
 * Ce n'est pas `EDITEURS` sous un autre nom. `editeur` dit qui presse le
 * disque, `collection_editeur` dans quelle série il rentre : Studiocanal
 * édite « Make My Day! » **et** cent titres hors collection.
 */
export const COLLECTIONS: Regroupement[] = [
  { slug: "the-criterion-collection", libelle: "The Criterion Collection", compte: 338 },
  { slug: "make-my-day", libelle: "Make My Day!", compte: 91 },
];

/**
 * La clé est le premier segment de l'URL, `base` en est la forme complète : les
 * deux doivent rester en accord, `axeDeChemin` du middleware fait correspondre
 * le segment à la clé.
 *
 * Les adresses sont en anglais depuis le 1er août 2026, les libellés restent en
 * français : c'est l'URL qui change, pas la langue du site. `formats` et
 * `genres` ne bougent pas, les mots sont les mêmes dans les deux langues.
 */
export const AXES = {
  formats: { titre: "Formats", tables: FORMATS, base: "/formats" },
  publishers: { titre: "Éditeurs", tables: EDITEURS, base: "/publishers" },
  genres: { titre: "Genres", tables: GENRES, base: "/genres" },
  collections: { titre: "Collections", tables: COLLECTIONS, base: "/collections" },
} as const;

export type NomAxe = keyof typeof AXES;

/** Retrouve une entrée par son slug, ou null. */
export function trouver(axe: NomAxe, slug: string): Regroupement | null {
  return AXES[axe].tables.find((e) => e.slug === slug) ?? null;
}
