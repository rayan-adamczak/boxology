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
  { slug: "blu-ray", libelle: "Blu-ray", compte: 20112 },
  { slug: "dvd", libelle: "DVD", compte: 6241 },
  { slug: "blu-ray-4k", libelle: "Blu-ray 4K", compte: 5897 },
  { slug: "steelbook", libelle: "Steelbook", compte: 2570 },
  { slug: "coffret", libelle: "Coffret", compte: 2413 },
  { slug: "slipcover", libelle: "Slipcover", compte: 1070 },
  { slug: "digibook", libelle: "Digibook", compte: 843 },
  { slug: "digipack", libelle: "Digipack", compte: 706 },
  { slug: "blu-ray-3d", libelle: "Blu-ray 3D", compte: 238 },
  { slug: "combo", libelle: "Combo", compte: 36 },
];

/** `editeur` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
  { slug: "warner-bros", libelle: "Warner Bros.", compte: 1181 },
  { slug: "universal-pictures", libelle: "Universal Pictures", compte: 1179 },
  { slug: "studiocanal", libelle: "Studiocanal", compte: 1045 },
  { slug: "paramount-pictures", libelle: "Paramount Pictures", compte: 981 },
  { slug: "sony-pictures", libelle: "Sony Pictures", compte: 883 },
  { slug: "metropolitan-film-video", libelle: "Metropolitan Film & Video", compte: 735 },
  { slug: "bqhl-editions", libelle: "BQHL Éditions", compte: 668 },
  { slug: "kino-lorber", libelle: "Kino Lorber", compte: 635 },
  { slug: "gaumont", libelle: "Gaumont", compte: 513 },
  { slug: "studio-canal", libelle: "Studio Canal", compte: 487 },
  { slug: "arrow-video", libelle: "Arrow Video", compte: 451 },
  { slug: "carlotta-films", libelle: "Carlotta Films", compte: 429 },
  { slug: "m6-video", libelle: "M6 Vidéo", compte: 419 },
  { slug: "sidonis-calysta", libelle: "Sidonis Calysta", compte: 411 },
  { slug: "20th-century-fox", libelle: "20th Century Fox", compte: 401 },
  { slug: "elephant-films", libelle: "Elephant Films", compte: 383 },
  { slug: "esc-editions", libelle: "ESC Editions", compte: 383 },
  { slug: "pathe", libelle: "Pathé", compte: 380 },
  { slug: "shout-factory", libelle: "Shout Factory", compte: 371 },
  { slug: "88-films", libelle: "88 Films", compte: 349 },
  { slug: "the-criterion-collection", libelle: "The Criterion Collection", compte: 346 },
  { slug: "walt-disney-france", libelle: "Walt Disney France", compte: 345 },
  { slug: "network", libelle: "Network", compte: 339 },
  { slug: "warner-bros-entertainment-france", libelle: "Warner Bros. Entertainment France", compte: 333 },
  { slug: "rimini-editions", libelle: "Rimini Editions", compte: 331 },
  { slug: "warner-archive", libelle: "Warner Archive", compte: 321 },
  { slug: "wild-side-video", libelle: "Wild Side Video", compte: 317 },
  { slug: "severin-films", libelle: "Severin Films", compte: 310 },
  { slug: "coin-de-mire-cinema", libelle: "Coin de Mire Cinéma", compte: 308 },
  { slug: "20th-century-studios", libelle: "20th Century Studios", compte: 300 },
  { slug: "warner-video", libelle: "Warner Vidéo", compte: 266 },
  { slug: "vinegar-syndrome", libelle: "Vinegar Syndrome", compte: 250 },
  { slug: "lionsgate", libelle: "Lionsgate", compte: 246 },
  { slug: "the-jokers-films", libelle: "The Jokers Films", compte: 231 },
  { slug: "universal-pictures-home-entertainment", libelle: "Universal Pictures Home Entertainment", compte: 228 },
  { slug: "le-chat-qui-fume", libelle: "Le Chat qui fume", compte: 226 },
  { slug: "amazon-mgm-studios", libelle: "Amazon MGM Studios", compte: 220 },
  { slug: "radiance-films", libelle: "Radiance Films", compte: 220 },
  { slug: "diaphana", libelle: "Diaphana", compte: 210 },
  { slug: "artus-films", libelle: "Artus Films", compte: 179 },
  { slug: "spirit-entertainment", libelle: "Spirit Entertainment", compte: 175 },
  { slug: "crunchyroll", libelle: "Crunchyroll", compte: 166 },
  { slug: "all-the-anime", libelle: "All the Anime", compte: 165 },
  { slug: "le-pacte", libelle: "Le Pacte", compte: 165 },
  { slug: "blaq-out", libelle: "Blaq Out", compte: 154 },
  { slug: "second-sight-films", libelle: "Second Sight Films", compte: 148 },
  { slug: "tf1-studio", libelle: "TF1 Studio", compte: 148 },
  { slug: "powerhouse-films", libelle: "Powerhouse Films", compte: 144 },
  { slug: "eureka-entertainment", libelle: "Eureka Entertainment", compte: 135 },
  { slug: "l-atelier-d-images", libelle: "L'atelier d'Images", compte: 132 },
  { slug: "bfi", libelle: "BFI", compte: 131 },
  { slug: "spectrum-films", libelle: "Spectrum Films", compte: 130 },
  { slug: "uncut-movies", libelle: "Uncut Movies", compte: 128 },
  { slug: "disney-buena-vista", libelle: "Disney / Buena Vista", compte: 127 },
  { slug: "potemkine", libelle: "Potemkine", compte: 125 },
  { slug: "ab-video", libelle: "AB Vidéo", compte: 119 },
  { slug: "hbo", libelle: "HBO", compte: 109 },
  { slug: "koba-films", libelle: "Koba Films", compte: 109 },
  { slug: "marvel-studios", libelle: "Marvel Studios", compte: 107 },
  { slug: "paramount-pictures-france", libelle: "Paramount Pictures France", compte: 105 },
  { slug: "lcj-editions", libelle: "LCJ Editions", compte: 102 },
  { slug: "france-tv-distribution", libelle: "France.TV Distribution", compte: 100 },
  { slug: "tamasa-diffusion", libelle: "Tamasa Diffusion", compte: 99 },
  { slug: "anime", libelle: "@Anime", compte: 90 },
  { slug: "condor-entertainment", libelle: "Condor Entertainment", compte: 87 },
  { slug: "curzon-film", libelle: "Curzon Film", compte: 85 },
  { slug: "extralucid-films", libelle: "Extralucid Films", compte: 85 },
  { slug: "ugc", libelle: "UGC", compte: 85 },
  { slug: "factoris-films", libelle: "Factoris Films", compte: 84 },
  { slug: "screenbound", libelle: "Screenbound", compte: 84 },
  { slug: "101-films", libelle: "101 Films", compte: 83 },
  { slug: "outplay", libelle: "Outplay", compte: 83 },
  { slug: "europacorp", libelle: "EuropaCorp", compte: 80 },
  { slug: "disney-pixar", libelle: "Disney - PIXAR", compte: 78 },
  { slug: "umbrella-entertainment", libelle: "Umbrella Entertainment", compte: 75 },
  { slug: "dazzler", libelle: "Dazzler", compte: 71 },
  { slug: "dybex", libelle: "Dybex", compte: 71 },
  { slug: "mondo-macabro", libelle: "Mondo Macabro", compte: 67 },
  { slug: "seven7-studio-tf1-cinema", libelle: "Seven7 - Studio TF1 Cinéma", compte: 66 },
  { slug: "fox-pathe-europa", libelle: "Fox Pathe Europa", compte: 65 },
  { slug: "lucasfilm", libelle: "Lucasfilm", compte: 62 },
  { slug: "british-film-institute", libelle: "British Film Institute", compte: 61 },
  { slug: "the-searchers", libelle: "The Searchers", compte: 60 },
  { slug: "third-window-films", libelle: "Third Window Films", compte: 57 },
  { slug: "ad-vitam", libelle: "Ad Vitam", compte: 56 },
  { slug: "21st-century-studios", libelle: "21st Century Studios", compte: 55 },
  { slug: "filmedia", libelle: "Filmedia", compte: 55 },
  { slug: "dreamworks-animation-skg", libelle: "DreamWorks Animation SKG", compte: 54 },
  { slug: "hk-video", libelle: "HK Vidéo", compte: 54 },
  { slug: "arp-selection", libelle: "ARP Sélection", compte: 53 },
  { slug: "blue-underground", libelle: "Blue Underground", compte: 53 },
  { slug: "second-run", libelle: "Second Run", compte: 49 },
  { slug: "pyramide-video", libelle: "Pyramide Vidéo", compte: 47 },
  { slug: "eurozoom", libelle: "Eurozoom", compte: 46 },
  { slug: "bach-films", libelle: "Bach Films", compte: 45 },
  { slug: "kaze", libelle: "Kaze", compte: 45 },
  { slug: "pulse-video", libelle: "Pulse Vidéo", compte: 45 },
  { slug: "dogwoof", libelle: "Dogwoof", compte: 44 },
  { slug: "roboto-films", libelle: "Roboto Films", compte: 44 },
  { slug: "touchstone-home-video", libelle: "Touchstone Home Video", compte: 44 },
  { slug: "altitude", libelle: "Altitude", compte: 43 },
  { slug: "mubi", libelle: "MUBI", compte: 42 },
  { slug: "kana-home-video", libelle: "Kana Home Video", compte: 41 },
  { slug: "pathe-distribution", libelle: "Pathe Distribution", compte: 41 },
  { slug: "itv-home-entertainment", libelle: "ITV Home Entertainment", compte: 39 },
  { slug: "arte-editions", libelle: "Arte Éditions", compte: 38 },
  { slug: "icon-home-entertainment", libelle: "Icon Home Entertainment", compte: 38 },
  { slug: "matchbox-films", libelle: "Matchbox Films", compte: 38 },
  { slug: "mocky-delicious-products", libelle: "Mocky Delicious Products", compte: 36 },
  { slug: "kaleidoscope-home-entertainment", libelle: "Kaleidoscope Home Entertainment", compte: 35 },
  { slug: "lcj-editions-productions", libelle: "LCJ Éditions & Productions", compte: 35 },
  { slug: "seven7", libelle: "Seven7", compte: 34 },
  { slug: "bbc", libelle: "BBC", compte: 33 },
  { slug: "black-box", libelle: "Black Box", compte: 33 },
  { slug: "picture-house", libelle: "Picture House", compte: 32 },
  { slug: "tf1-video", libelle: "TF1 Vidéo", compte: 32 },
  { slug: "columbia-pictures", libelle: "Columbia Pictures", compte: 29 },
  { slug: "memento-distribution", libelle: "Memento Distribution", compte: 29 },
  { slug: "bubbel-pop-edition", libelle: "Bubbel Pop Edition", compte: 28 },
  { slug: "esc-films", libelle: "ESC Films", compte: 28 },
  { slug: "vintage-classics", libelle: "Vintage Classics", compte: 28 },
  { slug: "arcades-editions", libelle: "Arcadès éditions", compte: 27 },
  { slug: "channel-4", libelle: "Channel 4", compte: 27 },
  { slug: "new-line", libelle: "New Line", compte: 27 },
  { slug: "signature-entertainment", libelle: "Signature Entertainment", compte: 27 },
  { slug: "bac-films", libelle: "BAC Films", compte: 26 },
  { slug: "jour2fete", libelle: "Jour2Fête", compte: 26 },
  { slug: "raro-video", libelle: "Raro Video", compte: 26 },
  { slug: "nour-films", libelle: "Nour Films", compte: 25 },
  { slug: "cornerstone-media", libelle: "Cornerstone Media", compte: 24 },
  { slug: "e1-entertainment", libelle: "E1 Entertainment", compte: 24 },
  { slug: "france-televisions-distribution", libelle: "France Télévisions Distribution", compte: 24 },
  { slug: "program-store", libelle: "Program Store", compte: 24 },
  { slug: "strawberry-media", libelle: "Strawberry Media", compte: 24 },
  { slug: "tandem-films", libelle: "Tandem Films", compte: 24 },
  { slug: "les-films-du-camelia", libelle: "Les Films du Camélia", compte: 23 },
  { slug: "verve-pictures", libelle: "Verve Pictures", compte: 23 },
  { slug: "film-4", libelle: "Film 4", compte: 22 },
  { slug: "first-international-production", libelle: "First International Production", compte: 22 },
  { slug: "entertainment-one", libelle: "Entertainment One", compte: 21 },
  { slug: "jhr-films", libelle: "jhr Films", compte: 21 },
  { slug: "orange-studio", libelle: "Orange Studio", compte: 21 },
  { slug: "zylo", libelle: "Zylo", compte: 21 },
  { slug: "disney", libelle: "Disney", compte: 20 },
  { slug: "marco-polo-production", libelle: "Marco Polo Production", compte: 20 },
  { slug: "signal-one-entertainment", libelle: "Signal One Entertainment", compte: 20 },
  { slug: "acorn-media", libelle: "Acorn Media", compte: 19 },
  { slug: "mediumrare", libelle: "Mediumrare", compte: 19 },
  { slug: "saffron-hill", libelle: "Saffron Hill", compte: 19 },
  { slug: "shameless", libelle: "Shameless", compte: 19 },
  { slug: "synapse-films", libelle: "Synapse Films", compte: 19 },
  { slug: "final-cut-entertainment", libelle: "Final Cut Entertainment", compte: 18 },
  { slug: "intersections", libelle: "Intersections", compte: 18 },
  { slug: "metro-goldwyn-mayer", libelle: "Metro-Goldwyn-Mayer", compte: 18 },
  { slug: "palisades-tartan", libelle: "Palisades Tartan", compte: 18 },
  { slug: "citel-video", libelle: "Citel Video", compte: 17 },
  { slug: "drakes-avenue", libelle: "Drakes Avenue", compte: 17 },
  { slug: "wayna-pitch", libelle: "Wayna Pitch", compte: 17 },
  { slug: "zinc", libelle: "Zinc.", compte: 17 },
  { slug: "cbs", libelle: "CBS", compte: 16 },
  { slug: "manga-entertainment", libelle: "Manga Entertainment", compte: 16 },
  { slug: "originals-factory", libelle: "Originals Factory", compte: 16 },
  { slug: "capricci", libelle: "Capricci", compte: 15 },
  { slug: "cinebox", libelle: "Cinebox", compte: 15 },
  { slug: "dreamworks", libelle: "DreamWorks", compte: 15 },
  { slug: "hanabi", libelle: "Hanabi", compte: 15 },
  { slug: "massacre-video", libelle: "Massacre Video", compte: 15 },
  { slug: "mdc-films", libelle: "MDC Films", compte: 15 },
  { slug: "saje-distribution", libelle: "SAJE Distribution", compte: 15 },
  { slug: "studio-ghibli", libelle: "Studio Ghibli", compte: 15 },
  { slug: "terror-vision", libelle: "Terror Vision", compte: 15 },
  { slug: "bulldog", libelle: "Bulldog", compte: 14 },
  { slug: "kaze-animation", libelle: "Kazé Animation", compte: 14 },
  { slug: "lightbulb-film-distribution", libelle: "Lightbulb Film Distribution", compte: 14 },
  { slug: "optimale", libelle: "Optimale", compte: 14 },
  { slug: "peccadillo-pictures", libelle: "Peccadillo Pictures", compte: 14 },
  { slug: "potemkine-films", libelle: "Potemkine Films", compte: 14 },
  { slug: "trinity-films", libelle: "Trinity Films", compte: 14 },
  { slug: "ufo-distribution", libelle: "UFO Distribution", compte: 14 },
  { slug: "badlands", libelle: "Badlands", compte: 13 },
  { slug: "acorn", libelle: "Acorn", compte: 12 },
  { slug: "arizona-distribution", libelle: "Arizona Distribution", compte: 12 },
  { slug: "cauldron-films", libelle: "Cauldron Films", compte: 12 },
  { slug: "emylia", libelle: "Emylia", compte: 12 },
  { slug: "mep-video", libelle: "MEP Vidéo", compte: 12 },
  { slug: "movinside", libelle: "Movinside", compte: 12 },
  { slug: "vertigo-releasing", libelle: "Vertigo Releasing", compte: 12 },
  { slug: "dreamworks-france", libelle: "DreamWorks France", compte: 11 },
  { slug: "epicentre-films", libelle: "Epicentre Films", compte: 11 },
  { slug: "refuse-films", libelle: "Refuse Films", compte: 11 },
  { slug: "axiom-films", libelle: "Axiom Films", compte: 10 },
  { slug: "fabulous-films", libelle: "Fabulous Films", compte: 10 },
  { slug: "les-gardiens-du-cinema", libelle: "Les Gardiens du Cinéma", compte: 10 },
  { slug: "modern-films", libelle: "Modern Films", compte: 10 },
  { slug: "pan-europeenne", libelle: "Pan-Européenne", compte: 10 },
  { slug: "tla-releasing", libelle: "TLA Releasing", compte: 10 },
  { slug: "treasured-films", libelle: "Treasured Films", compte: 10 },
  { slug: "uca", libelle: "UCA", compte: 10 },
  { slug: "yume-pictures", libelle: "YUME PICTURES", compte: 10 },
];

/** `genres` des films, source TMDB. */
export const GENRES: Regroupement[] = [
  { slug: "drame", libelle: "Drame", compte: 6790 },
  { slug: "comedie", libelle: "Comédie", compte: 3787 },
  { slug: "thriller", libelle: "Thriller", compte: 3108 },
  { slug: "action", libelle: "Action", compte: 2691 },
  { slug: "crime", libelle: "Crime", compte: 2324 },
  { slug: "horreur", libelle: "Horreur", compte: 2281 },
  { slug: "aventure", libelle: "Aventure", compte: 1825 },
  { slug: "romance", libelle: "Romance", compte: 1764 },
  { slug: "science-fiction", libelle: "Science-Fiction", compte: 1412 },
  { slug: "mystere", libelle: "Mystère", compte: 1234 },
  { slug: "fantastique", libelle: "Fantastique", compte: 1129 },
  { slug: "animation", libelle: "Animation", compte: 1118 },
  { slug: "familial", libelle: "Familial", compte: 824 },
  { slug: "histoire", libelle: "Histoire", compte: 715 },
  { slug: "documentaire", libelle: "Documentaire", compte: 660 },
  { slug: "guerre", libelle: "Guerre", compte: 582 },
  { slug: "musique", libelle: "Musique", compte: 480 },
  { slug: "western", libelle: "Western", compte: 461 },
  { slug: "science-fiction-fantastique", libelle: "Science-Fiction & Fantastique", compte: 363 },
  { slug: "action-adventure", libelle: "Action & Adventure", compte: 330 },
  { slug: "telefilm", libelle: "Téléfilm", compte: 196 },
  { slug: "war-politics", libelle: "War & Politics", compte: 57 },
  { slug: "kids", libelle: "Kids", compte: 17 },
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
  { slug: "collection-selection", libelle: "Collection Sélection", compte: 127 },
  { slug: "make-my-day", libelle: "Make My Day!", compte: 91 },
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
