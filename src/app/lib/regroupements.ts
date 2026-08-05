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
  { slug: "blu-ray", libelle: "Blu-ray", compte: 14364 },
  { slug: "blu-ray-4k", libelle: "Blu-ray 4K", compte: 5715 },
  { slug: "steelbook", libelle: "Steelbook", compte: 2204 },
  { slug: "dvd", libelle: "DVD", compte: 1553 },
  { slug: "slipcover", libelle: "Slipcover", compte: 1070 },
  { slug: "digipack", libelle: "Digipack", compte: 706 },
  { slug: "coffret", libelle: "Coffret", compte: 463 },
  { slug: "digibook", libelle: "Digibook", compte: 220 },
  { slug: "blu-ray-3d", libelle: "Blu-ray 3D", compte: 128 },
];

/** `editeur` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
  { slug: "warner-bros", libelle: "Warner Bros.", compte: 1009 },
  { slug: "universal-pictures", libelle: "Universal Pictures", compte: 920 },
  { slug: "paramount-pictures", libelle: "Paramount Pictures", compte: 817 },
  { slug: "sony-pictures", libelle: "Sony Pictures", compte: 642 },
  { slug: "studiocanal", libelle: "Studiocanal", compte: 639 },
  { slug: "kino-lorber", libelle: "Kino Lorber", compte: 635 },
  { slug: "studio-canal", libelle: "Studio Canal", compte: 487 },
  { slug: "arrow-video", libelle: "Arrow Video", compte: 451 },
  { slug: "bqhl-editions", libelle: "BQHL Éditions", compte: 448 },
  { slug: "metropolitan-film-video", libelle: "Metropolitan Film & Video", compte: 377 },
  { slug: "carlotta-films", libelle: "Carlotta Films", compte: 375 },
  { slug: "shout-factory", libelle: "Shout Factory", compte: 371 },
  { slug: "elephant-films", libelle: "Elephant Films", compte: 350 },
  { slug: "88-films", libelle: "88 Films", compte: 349 },
  { slug: "the-criterion-collection", libelle: "The Criterion Collection", compte: 346 },
  { slug: "network", libelle: "Network", compte: 339 },
  { slug: "warner-archive", libelle: "Warner Archive", compte: 321 },
  { slug: "severin-films", libelle: "Severin Films", compte: 310 },
  { slug: "gaumont", libelle: "Gaumont", compte: 306 },
  { slug: "20th-century-fox", libelle: "20th Century Fox", compte: 302 },
  { slug: "rimini-editions", libelle: "Rimini Editions", compte: 288 },
  { slug: "esc-editions", libelle: "ESC Editions", compte: 280 },
  { slug: "warner-video", libelle: "Warner Vidéo", compte: 266 },
  { slug: "vinegar-syndrome", libelle: "Vinegar Syndrome", compte: 250 },
  { slug: "lionsgate", libelle: "Lionsgate", compte: 245 },
  { slug: "sidonis-calysta", libelle: "Sidonis Calysta", compte: 230 },
  { slug: "radiance-films", libelle: "Radiance Films", compte: 216 },
  { slug: "pathe", libelle: "Pathé", compte: 202 },
  { slug: "le-chat-qui-fume", libelle: "Le Chat qui fume", compte: 189 },
  { slug: "spirit-entertainment", libelle: "Spirit Entertainment", compte: 175 },
  { slug: "m6-video", libelle: "M6 Vidéo", compte: 173 },
  { slug: "artus-films", libelle: "Artus Films", compte: 172 },
  { slug: "walt-disney-france", libelle: "Walt Disney France", compte: 170 },
  { slug: "20th-century-studios", libelle: "20th Century Studios", compte: 166 },
  { slug: "crunchyroll", libelle: "Crunchyroll", compte: 160 },
  { slug: "wild-side-video", libelle: "Wild Side Video", compte: 151 },
  { slug: "second-sight-films", libelle: "Second Sight Films", compte: 148 },
  { slug: "powerhouse-films", libelle: "Powerhouse Films", compte: 144 },
  { slug: "coin-de-mire-cinema", libelle: "Coin de Mire Cinéma", compte: 138 },
  { slug: "eureka-entertainment", libelle: "Eureka Entertainment", compte: 135 },
  { slug: "universal-pictures-home-entertainment", libelle: "Universal Pictures Home Entertainment", compte: 133 },
  { slug: "all-the-anime", libelle: "All the Anime", compte: 131 },
  { slug: "bfi", libelle: "BFI", compte: 131 },
  { slug: "spectrum-films", libelle: "Spectrum Films", compte: 130 },
  { slug: "disney-buena-vista", libelle: "Disney / Buena Vista", compte: 127 },
  { slug: "uncut-movies", libelle: "Uncut Movies", compte: 127 },
  { slug: "diaphana", libelle: "Diaphana", compte: 120 },
  { slug: "amazon-mgm-studios", libelle: "Amazon MGM Studios", compte: 113 },
  { slug: "hbo", libelle: "HBO", compte: 109 },
  { slug: "lcj-editions", libelle: "LCJ Editions", compte: 102 },
  { slug: "tamasa-diffusion", libelle: "Tamasa Diffusion", compte: 99 },
  { slug: "the-jokers-films", libelle: "The Jokers Films", compte: 96 },
  { slug: "coin-de-mire", libelle: "Coin de Mire", compte: 93 },
  { slug: "l-atelier-d-images", libelle: "L'atelier d'Images", compte: 93 },
  { slug: "potemkine", libelle: "Potemkine", compte: 92 },
  { slug: "anime", libelle: "@Anime", compte: 90 },
  { slug: "curzon-film", libelle: "Curzon Film", compte: 85 },
  { slug: "screenbound", libelle: "Screenbound", compte: 84 },
  { slug: "101-films", libelle: "101 Films", compte: 83 },
  { slug: "paramount-pictures-france", libelle: "Paramount Pictures France", compte: 83 },
  { slug: "warner-bros-entertainment-france", libelle: "Warner Bros. Entertainment France", compte: 80 },
  { slug: "extralucid-films", libelle: "Extralucid Films", compte: 79 },
  { slug: "umbrella-entertainment", libelle: "Umbrella Entertainment", compte: 75 },
  { slug: "marvel-studios", libelle: "Marvel Studios", compte: 72 },
  { slug: "dazzler", libelle: "Dazzler", compte: 71 },
  { slug: "dybex", libelle: "Dybex", compte: 70 },
  { slug: "koba-films", libelle: "Koba Films", compte: 70 },
  { slug: "mondo-macabro", libelle: "Mondo Macabro", compte: 67 },
  { slug: "le-pacte", libelle: "Le Pacte", compte: 66 },
  { slug: "esc-films", libelle: "ESC Films", compte: 65 },
  { slug: "fox-pathe-europa", libelle: "Fox Pathe Europa", compte: 65 },
  { slug: "ab-video", libelle: "AB Vidéo", compte: 61 },
  { slug: "british-film-institute", libelle: "British Film Institute", compte: 61 },
  { slug: "the-jokers", libelle: "The Jokers", compte: 57 },
  { slug: "third-window-films", libelle: "Third Window Films", compte: 57 },
  { slug: "21st-century-studios", libelle: "21st Century Studios", compte: 55 },
  { slug: "factoris-films", libelle: "Factoris Films", compte: 55 },
  { slug: "blue-underground", libelle: "Blue Underground", compte: 53 },
  { slug: "blaq-out", libelle: "Blaq Out", compte: 52 },
  { slug: "disney-pixar", libelle: "Disney - PIXAR", compte: 50 },
  { slug: "lucasfilm", libelle: "Lucasfilm", compte: 50 },
  { slug: "second-run", libelle: "Second Run", compte: 49 },
  { slug: "hk-video", libelle: "HK Vidéo", compte: 48 },
  { slug: "kaze", libelle: "Kaze", compte: 45 },
  { slug: "pulse-video", libelle: "Pulse Vidéo", compte: 45 },
  { slug: "bach-films", libelle: "Bach Films", compte: 44 },
  { slug: "dogwoof", libelle: "Dogwoof", compte: 44 },
  { slug: "roboto-films", libelle: "Roboto Films", compte: 44 },
  { slug: "altitude", libelle: "Altitude", compte: 43 },
  { slug: "mubi", libelle: "MUBI", compte: 42 },
  { slug: "pathe-distribution", libelle: "Pathe Distribution", compte: 41 },
  { slug: "icon-home-entertainment", libelle: "Icon Home Entertainment", compte: 38 },
  { slug: "itv-home-entertainment", libelle: "ITV Home Entertainment", compte: 38 },
  { slug: "kana-home-video", libelle: "Kana Home Video", compte: 38 },
  { slug: "matchbox-films", libelle: "Matchbox Films", compte: 38 },
  { slug: "arte-editions", libelle: "Arte Éditions", compte: 36 },
  { slug: "kaleidoscope-home-entertainment", libelle: "Kaleidoscope Home Entertainment", compte: 34 },
  { slug: "paramount-home-entertainment", libelle: "Paramount Home Entertainment", compte: 34 },
  { slug: "bbc", libelle: "BBC", compte: 33 },
  { slug: "black-box", libelle: "Black Box", compte: 33 },
  { slug: "picture-house", libelle: "Picture House", compte: 32 },
  { slug: "tf1-video", libelle: "TF1 Vidéo", compte: 32 },
  { slug: "columbia-pictures", libelle: "Columbia Pictures", compte: 29 },
  { slug: "seven7-studio-tf1-cinema", libelle: "Seven7 - Studio TF1 Cinéma", compte: 29 },
  { slug: "tf1-studio", libelle: "TF1 Studio", compte: 29 },
  { slug: "vintage-classics", libelle: "Vintage Classics", compte: 28 },
  { slug: "channel-4", libelle: "Channel 4", compte: 27 },
  { slug: "condor-entertainment", libelle: "Condor Entertainment", compte: 27 },
  { slug: "signature-entertainment", libelle: "Signature Entertainment", compte: 27 },
  { slug: "the-searchers", libelle: "The Searchers", compte: 27 },
  { slug: "raro-video", libelle: "Raro Video", compte: 26 },
  { slug: "france-tv-distribution", libelle: "France.TV Distribution", compte: 25 },
  { slug: "cornerstone-media", libelle: "Cornerstone Media", compte: 24 },
  { slug: "france-televisions-distribution", libelle: "France Télévisions Distribution", compte: 24 },
  { slug: "strawberry-media", libelle: "Strawberry Media", compte: 24 },
  { slug: "ad-vitam", libelle: "Ad Vitam", compte: 23 },
  { slug: "europacorp", libelle: "EuropaCorp", compte: 23 },
  { slug: "verve-pictures", libelle: "Verve Pictures", compte: 23 },
  { slug: "film-4", libelle: "Film 4", compte: 22 },
  { slug: "entertainment-one", libelle: "Entertainment One", compte: 21 },
  { slug: "lcj-editions-productions", libelle: "LCJ Éditions & Productions", compte: 21 },
  { slug: "les-films-du-camelia", libelle: "Les Films du Camélia", compte: 21 },
  { slug: "arp-selection", libelle: "ARP Sélection", compte: 20 },
  { slug: "disney", libelle: "Disney", compte: 20 },
  { slug: "signal-one-entertainment", libelle: "Signal One Entertainment", compte: 20 },
  { slug: "acorn-media", libelle: "Acorn Media", compte: 19 },
  { slug: "mediumrare", libelle: "Mediumrare", compte: 19 },
  { slug: "saffron-hill", libelle: "Saffron Hill", compte: 19 },
  { slug: "shameless", libelle: "Shameless", compte: 19 },
  { slug: "synapse-films", libelle: "Synapse Films", compte: 19 },
  { slug: "arcades-editions", libelle: "Arcadès éditions", compte: 18 },
  { slug: "e1-entertainment", libelle: "E1 Entertainment", compte: 18 },
  { slug: "eurozoom", libelle: "Eurozoom", compte: 18 },
  { slug: "final-cut-entertainment", libelle: "Final Cut Entertainment", compte: 18 },
  { slug: "intersections", libelle: "Intersections", compte: 18 },
  { slug: "metro-goldwyn-mayer", libelle: "Metro-Goldwyn-Mayer", compte: 18 },
  { slug: "mocky-delicious-products", libelle: "Mocky Delicious Products", compte: 18 },
  { slug: "palisades-tartan", libelle: "Palisades Tartan", compte: 18 },
  { slug: "bubbel-pop-edition", libelle: "Bubbel Pop Edition", compte: 17 },
  { slug: "drakes-avenue", libelle: "Drakes Avenue", compte: 17 },
  { slug: "dreamworks-animation-skg", libelle: "DreamWorks Animation SKG", compte: 17 },
  { slug: "filmedia", libelle: "Filmedia", compte: 17 },
  { slug: "potemkine-films", libelle: "Potemkine Films", compte: 17 },
  { slug: "pyramide-video", libelle: "Pyramide Vidéo", compte: 17 },
  { slug: "citel-video", libelle: "Citel Video", compte: 16 },
  { slug: "manga-entertainment", libelle: "Manga Entertainment", compte: 16 },
  { slug: "ugc", libelle: "UGC", compte: 16 },
  { slug: "cbs", libelle: "CBS", compte: 15 },
  { slug: "massacre-video", libelle: "Massacre Video", compte: 15 },
  { slug: "mdc-films", libelle: "MDC Films", compte: 15 },
  { slug: "new-line", libelle: "New Line", compte: 15 },
  { slug: "terror-vision", libelle: "Terror Vision", compte: 15 },
  { slug: "bulldog", libelle: "Bulldog", compte: 14 },
  { slug: "dreamworks", libelle: "DreamWorks", compte: 14 },
  { slug: "lightbulb-film-distribution", libelle: "Lightbulb Film Distribution", compte: 14 },
  { slug: "peccadillo-pictures", libelle: "Peccadillo Pictures", compte: 14 },
  { slug: "trinity-films", libelle: "Trinity Films", compte: 14 },
  { slug: "touchstone-home-video", libelle: "Touchstone Home Video", compte: 13 },
  { slug: "acorn", libelle: "Acorn", compte: 12 },
  { slug: "badlands", libelle: "Badlands", compte: 12 },
  { slug: "cauldron-films", libelle: "Cauldron Films", compte: 12 },
  { slug: "seven7", libelle: "Seven7", compte: 12 },
  { slug: "vertigo-releasing", libelle: "Vertigo Releasing", compte: 12 },
  { slug: "capricci", libelle: "Capricci", compte: 11 },
  { slug: "refuse-films", libelle: "Refuse Films", compte: 11 },
  { slug: "studio-ghibli", libelle: "Studio Ghibli", compte: 11 },
  { slug: "axiom-films", libelle: "Axiom Films", compte: 10 },
  { slug: "fabulous-films", libelle: "Fabulous Films", compte: 10 },
  { slug: "les-gardiens-du-cinema", libelle: "Les Gardiens du Cinéma", compte: 10 },
  { slug: "memento-distribution", libelle: "Memento Distribution", compte: 10 },
  { slug: "modern-films", libelle: "Modern Films", compte: 10 },
  { slug: "tla-releasing", libelle: "TLA Releasing", compte: 10 },
  { slug: "uca", libelle: "UCA", compte: 10 },
  { slug: "yume-pictures", libelle: "YUME PICTURES", compte: 10 },
];

/** `genres` des films, source TMDB. */
export const GENRES: Regroupement[] = [
  { slug: "drame", libelle: "Drame", compte: 5474 },
  { slug: "comedie", libelle: "Comédie", compte: 2955 },
  { slug: "thriller", libelle: "Thriller", compte: 2675 },
  { slug: "action", libelle: "Action", compte: 2289 },
  { slug: "horreur", libelle: "Horreur", compte: 2150 },
  { slug: "crime", libelle: "Crime", compte: 2039 },
  { slug: "aventure", libelle: "Aventure", compte: 1474 },
  { slug: "romance", libelle: "Romance", compte: 1383 },
  { slug: "science-fiction", libelle: "Science-Fiction", compte: 1252 },
  { slug: "mystere", libelle: "Mystère", compte: 1094 },
  { slug: "fantastique", libelle: "Fantastique", compte: 925 },
  { slug: "animation", libelle: "Animation", compte: 909 },
  { slug: "familial", libelle: "Familial", compte: 559 },
  { slug: "histoire", libelle: "Histoire", compte: 543 },
  { slug: "documentaire", libelle: "Documentaire", compte: 520 },
  { slug: "guerre", libelle: "Guerre", compte: 468 },
  { slug: "musique", libelle: "Musique", compte: 412 },
  { slug: "science-fiction-fantastique", libelle: "Science-Fiction & Fantastique", compte: 351 },
  { slug: "western", libelle: "Western", compte: 348 },
  { slug: "action-adventure", libelle: "Action & Adventure", compte: 324 },
  { slug: "telefilm", libelle: "Téléfilm", compte: 169 },
  { slug: "war-politics", libelle: "War & Politics", compte: 56 },
  { slug: "kids", libelle: "Kids", compte: 13 },
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
  { slug: "collection-selection", libelle: "Collection Sélection", compte: 62 },
  { slug: "collection-prestige", libelle: "Collection Prestige", compte: 60 },
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
