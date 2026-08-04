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
  { slug: "blu-ray", libelle: "Blu-ray", compte: 12117 },
  { slug: "blu-ray-4k", libelle: "Blu-ray 4K", compte: 5247 },
  { slug: "steelbook", libelle: "Steelbook", compte: 2190 },
  { slug: "dvd", libelle: "DVD", compte: 1553 },
  { slug: "slipcover", libelle: "Slipcover", compte: 1070 },
  { slug: "digipack", libelle: "Digipack", compte: 703 },
  { slug: "coffret", libelle: "Coffret", compte: 437 },
  { slug: "digibook", libelle: "Digibook", compte: 218 },
  { slug: "blu-ray-3d", libelle: "Blu-ray 3D", compte: 128 },
];

/** `editeur` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
  { slug: "warner-bros", libelle: "Warner Bros.", compte: 982 },
  { slug: "universal-pictures", libelle: "Universal Pictures", compte: 896 },
  { slug: "paramount-pictures", libelle: "Paramount Pictures", compte: 817 },
  { slug: "kino-lorber", libelle: "Kino Lorber", compte: 635 },
  { slug: "sony-pictures", libelle: "Sony Pictures", compte: 545 },
  { slug: "studio-canal", libelle: "Studio Canal", compte: 487 },
  { slug: "arrow-video", libelle: "Arrow Video", compte: 450 },
  { slug: "studiocanal", libelle: "Studiocanal", compte: 387 },
  { slug: "shout-factory", libelle: "Shout Factory", compte: 371 },
  { slug: "elephant-films", libelle: "Elephant Films", compte: 350 },
  { slug: "the-criterion-collection", libelle: "The Criterion Collection", compte: 346 },
  { slug: "88-films", libelle: "88 Films", compte: 342 },
  { slug: "carlotta-films", libelle: "Carlotta Films", compte: 335 },
  { slug: "warner-archive", libelle: "Warner Archive", compte: 321 },
  { slug: "network", libelle: "Network", compte: 313 },
  { slug: "severin-films", libelle: "Severin Films", compte: 310 },
  { slug: "bqhl-editions", libelle: "BQHL Éditions", compte: 302 },
  { slug: "20th-century-fox", libelle: "20th Century Fox", compte: 301 },
  { slug: "esc-editions", libelle: "ESC Editions", compte: 280 },
  { slug: "warner-video", libelle: "Warner Vidéo", compte: 266 },
  { slug: "vinegar-syndrome", libelle: "Vinegar Syndrome", compte: 250 },
  { slug: "metropolitan-film-video", libelle: "Metropolitan Film & Video", compte: 242 },
  { slug: "lionsgate", libelle: "Lionsgate", compte: 236 },
  { slug: "gaumont", libelle: "Gaumont", compte: 228 },
  { slug: "rimini-editions", libelle: "Rimini Editions", compte: 220 },
  { slug: "radiance-films", libelle: "Radiance Films", compte: 216 },
  { slug: "sidonis-calysta", libelle: "Sidonis Calysta", compte: 190 },
  { slug: "le-chat-qui-fume", libelle: "Le Chat qui fume", compte: 189 },
  { slug: "artus-films", libelle: "Artus Films", compte: 156 },
  { slug: "pathe", libelle: "Pathé", compte: 150 },
  { slug: "crunchyroll", libelle: "Crunchyroll", compte: 146 },
  { slug: "second-sight-films", libelle: "Second Sight Films", compte: 146 },
  { slug: "powerhouse-films", libelle: "Powerhouse Films", compte: 144 },
  { slug: "eureka-entertainment", libelle: "Eureka Entertainment", compte: 135 },
  { slug: "spirit-entertainment", libelle: "Spirit Entertainment", compte: 132 },
  { slug: "bfi", libelle: "BFI", compte: 130 },
  { slug: "spectrum-films", libelle: "Spectrum Films", compte: 130 },
  { slug: "disney-buena-vista", libelle: "Disney / Buena Vista", compte: 127 },
  { slug: "uncut-movies", libelle: "Uncut Movies", compte: 127 },
  { slug: "m6-video", libelle: "M6 Vidéo", compte: 112 },
  { slug: "hbo", libelle: "HBO", compte: 109 },
  { slug: "lcj-editions", libelle: "LCJ Editions", compte: 102 },
  { slug: "tamasa-diffusion", libelle: "Tamasa Diffusion", compte: 99 },
  { slug: "walt-disney-france", libelle: "Walt Disney France", compte: 98 },
  { slug: "all-the-anime", libelle: "All the Anime", compte: 93 },
  { slug: "coin-de-mire", libelle: "Coin de Mire", compte: 93 },
  { slug: "l-atelier-d-images", libelle: "L'atelier d'Images", compte: 93 },
  { slug: "potemkine", libelle: "Potemkine", compte: 92 },
  { slug: "20th-century-studios", libelle: "20th Century Studios", compte: 91 },
  { slug: "anime", libelle: "@Anime", compte: 90 },
  { slug: "curzon-film", libelle: "Curzon Film", compte: 84 },
  { slug: "101-films", libelle: "101 Films", compte: 83 },
  { slug: "screenbound", libelle: "Screenbound", compte: 82 },
  { slug: "wild-side-video", libelle: "Wild Side Video", compte: 82 },
  { slug: "umbrella-entertainment", libelle: "Umbrella Entertainment", compte: 75 },
  { slug: "mondo-macabro", libelle: "Mondo Macabro", compte: 67 },
  { slug: "fox-pathe-europa", libelle: "Fox Pathe Europa", compte: 65 },
  { slug: "dybex", libelle: "Dybex", compte: 62 },
  { slug: "british-film-institute", libelle: "British Film Institute", compte: 61 },
  { slug: "dazzler", libelle: "Dazzler", compte: 61 },
  { slug: "extralucid-films", libelle: "Extralucid Films", compte: 59 },
  { slug: "koba-films", libelle: "Koba Films", compte: 59 },
  { slug: "the-jokers", libelle: "The Jokers", compte: 57 },
  { slug: "third-window-films", libelle: "Third Window Films", compte: 57 },
  { slug: "amazon-mgm-studios", libelle: "Amazon MGM Studios", compte: 55 },
  { slug: "blue-underground", libelle: "Blue Underground", compte: 53 },
  { slug: "21st-century-studios", libelle: "21st Century Studios", compte: 52 },
  { slug: "second-run", libelle: "Second Run", compte: 49 },
  { slug: "ab-video", libelle: "AB Vidéo", compte: 47 },
  { slug: "kaze", libelle: "Kaze", compte: 45 },
  { slug: "pulse-video", libelle: "Pulse Vidéo", compte: 45 },
  { slug: "dogwoof", libelle: "Dogwoof", compte: 44 },
  { slug: "bach-films", libelle: "Bach Films", compte: 43 },
  { slug: "altitude", libelle: "Altitude", compte: 42 },
  { slug: "mubi", libelle: "MUBI", compte: 41 },
  { slug: "pathe-distribution", libelle: "Pathe Distribution", compte: 41 },
  { slug: "marvel-studios", libelle: "Marvel Studios", compte: 39 },
  { slug: "kana-home-video", libelle: "Kana Home Video", compte: 38 },
  { slug: "icon-home-entertainment", libelle: "Icon Home Entertainment", compte: 37 },
  { slug: "arte-editions", libelle: "Arte Éditions", compte: 36 },
  { slug: "matchbox-films", libelle: "Matchbox Films", compte: 36 },
  { slug: "black-box", libelle: "Black Box", compte: 33 },
  { slug: "lucasfilm", libelle: "Lucasfilm", compte: 33 },
  { slug: "kaleidoscope-home-entertainment", libelle: "Kaleidoscope Home Entertainment", compte: 32 },
  { slug: "picture-house", libelle: "Picture House", compte: 32 },
  { slug: "roboto-films", libelle: "Roboto Films", compte: 32 },
  { slug: "tf1-video", libelle: "TF1 Vidéo", compte: 32 },
  { slug: "factoris-films", libelle: "Factoris Films", compte: 31 },
  { slug: "hk-video", libelle: "HK Vidéo", compte: 30 },
  { slug: "columbia-pictures", libelle: "Columbia Pictures", compte: 29 },
  { slug: "tf1-studio", libelle: "TF1 Studio", compte: 29 },
  { slug: "signature-entertainment", libelle: "Signature Entertainment", compte: 27 },
  { slug: "raro-video", libelle: "Raro Video", compte: 26 },
  { slug: "vintage-classics", libelle: "Vintage Classics", compte: 26 },
  { slug: "disney-pixar", libelle: "Disney - PIXAR", compte: 25 },
  { slug: "france-tv-distribution", libelle: "France.TV Distribution", compte: 25 },
  { slug: "france-televisions-distribution", libelle: "France Télévisions Distribution", compte: 24 },
  { slug: "itv-home-entertainment", libelle: "ITV Home Entertainment", compte: 24 },
  { slug: "blaq-out", libelle: "Blaq Out", compte: 22 },
  { slug: "cornerstone-media", libelle: "Cornerstone Media", compte: 22 },
  { slug: "europacorp", libelle: "EuropaCorp", compte: 22 },
  { slug: "entertainment-one", libelle: "Entertainment One", compte: 21 },
  { slug: "disney", libelle: "Disney", compte: 20 },
  { slug: "signal-one-entertainment", libelle: "Signal One Entertainment", compte: 20 },
  { slug: "mediumrare", libelle: "Mediumrare", compte: 19 },
  { slug: "saffron-hill", libelle: "Saffron Hill", compte: 19 },
  { slug: "shameless", libelle: "Shameless", compte: 19 },
  { slug: "synapse-films", libelle: "Synapse Films", compte: 19 },
  { slug: "verve-pictures", libelle: "Verve Pictures", compte: 19 },
  { slug: "e1-entertainment", libelle: "E1 Entertainment", compte: 18 },
  { slug: "metro-goldwyn-mayer", libelle: "Metro-Goldwyn-Mayer", compte: 18 },
  { slug: "strawberry-media", libelle: "Strawberry Media", compte: 18 },
  { slug: "bubbel-pop-edition", libelle: "Bubbel Pop Edition", compte: 17 },
  { slug: "filmedia", libelle: "Filmedia", compte: 17 },
  { slug: "les-films-du-camelia", libelle: "Les Films du Camélia", compte: 17 },
  { slug: "citel-video", libelle: "Citel Video", compte: 16 },
  { slug: "final-cut-entertainment", libelle: "Final Cut Entertainment", compte: 16 },
  { slug: "manga-entertainment", libelle: "Manga Entertainment", compte: 16 },
  { slug: "cbs", libelle: "CBS", compte: 15 },
  { slug: "drakes-avenue", libelle: "Drakes Avenue", compte: 15 },
  { slug: "massacre-video", libelle: "Massacre Video", compte: 15 },
  { slug: "palisades-tartan", libelle: "Palisades Tartan", compte: 15 },
  { slug: "terror-vision", libelle: "Terror Vision", compte: 15 },
  { slug: "condor-entertainment", libelle: "Condor Entertainment", compte: 14 },
  { slug: "dreamworks", libelle: "DreamWorks", compte: 14 },
  { slug: "dreamworks-animation-skg", libelle: "DreamWorks Animation SKG", compte: 14 },
  { slug: "lcj-editions-productions", libelle: "LCJ Éditions & Productions", compte: 14 },
  { slug: "lightbulb-film-distribution", libelle: "Lightbulb Film Distribution", compte: 14 },
  { slug: "bbc", libelle: "BBC", compte: 13 },
  { slug: "peccadillo-pictures", libelle: "Peccadillo Pictures", compte: 13 },
  { slug: "trinity-films", libelle: "Trinity Films", compte: 13 },
  { slug: "acorn", libelle: "Acorn", compte: 12 },
  { slug: "bulldog", libelle: "Bulldog", compte: 12 },
  { slug: "cauldron-films", libelle: "Cauldron Films", compte: 12 },
  { slug: "channel-4", libelle: "Channel 4", compte: 12 },
  { slug: "seven7", libelle: "Seven7", compte: 12 },
  { slug: "seven7-studio-tf1-cinema", libelle: "Seven7 - Studio TF1 Cinéma", compte: 12 },
  { slug: "capricci", libelle: "Capricci", compte: 11 },
  { slug: "intersections", libelle: "Intersections", compte: 11 },
  { slug: "mdc-films", libelle: "MDC Films", compte: 11 },
  { slug: "refuse-films", libelle: "Refuse Films", compte: 11 },
  { slug: "studio-ghibli", libelle: "Studio Ghibli", compte: 11 },
  { slug: "vertigo-releasing", libelle: "Vertigo Releasing", compte: 11 },
  { slug: "axiom-films", libelle: "Axiom Films", compte: 10 },
  { slug: "fabulous-films", libelle: "Fabulous Films", compte: 10 },
  { slug: "yume-pictures", libelle: "YUME PICTURES", compte: 10 },
];

/** `genres` des films, source TMDB. */
export const GENRES: Regroupement[] = [
  { slug: "drame", libelle: "Drame", compte: 4934 },
  { slug: "comedie", libelle: "Comédie", compte: 2644 },
  { slug: "thriller", libelle: "Thriller", compte: 2487 },
  { slug: "action", libelle: "Action", compte: 2162 },
  { slug: "horreur", libelle: "Horreur", compte: 2066 },
  { slug: "crime", libelle: "Crime", compte: 1891 },
  { slug: "aventure", libelle: "Aventure", compte: 1393 },
  { slug: "romance", libelle: "Romance", compte: 1259 },
  { slug: "science-fiction", libelle: "Science-Fiction", compte: 1192 },
  { slug: "mystere", libelle: "Mystère", compte: 1031 },
  { slug: "fantastique", libelle: "Fantastique", compte: 882 },
  { slug: "animation", libelle: "Animation", compte: 848 },
  { slug: "familial", libelle: "Familial", compte: 515 },
  { slug: "histoire", libelle: "Histoire", compte: 473 },
  { slug: "documentaire", libelle: "Documentaire", compte: 467 },
  { slug: "guerre", libelle: "Guerre", compte: 437 },
  { slug: "musique", libelle: "Musique", compte: 377 },
  { slug: "science-fiction-fantastique", libelle: "Science-Fiction & Fantastique", compte: 336 },
  { slug: "western", libelle: "Western", compte: 330 },
  { slug: "action-adventure", libelle: "Action & Adventure", compte: 312 },
  { slug: "telefilm", libelle: "Téléfilm", compte: 154 },
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
