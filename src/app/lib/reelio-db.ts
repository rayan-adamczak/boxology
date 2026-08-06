import { supabase } from "./supabase";

/* ---- Row types ---- */

export interface Film {
  id: number;
  titre: string;
  /**
   * Segment lisible de l'URL, dérivé de `titre` et `annee` par un déclencheur
   * en base. Décoratif : c'est l'id qui identifie la fiche (cf. `lib/liens.ts`).
   * Nul tant que la migration `20260731_films_slug.sql` n'est pas appliquée.
   */
  slug: string | null;
  realisateur: string | null;
  duree: string | null;
  note: string | number | null;
  annee: string | number | null;
  synopsis: string | null;
  affiche_url: string | null;
  /** Image large TMDB, 16/9. Absente sur une partie du catalogue. */
  backdrop_url: string | null;
  /** Accroche d'affiche TMDB. Souvent vide, jamais inventée. */
  tagline: string | null;
  titre_original: string | null;
  nb_votes: number | null;
  imdb_id: string | null;
  genres: string | null;
  cast_principal: unknown | null;
  scenariste: string | null;
  /**
   * Titres TMDB par langue ISO 639-1, hors français : `{"en": "Arrival"}`.
   * Alimenté par `enrichir_tmdb.py`, absent tant qu'il n'a pas tourné.
   */
  titres_alternatifs: Record<string, string> | null;
  /* Fiche technique, alimentée par `champs_tmdb.py`. */
  pays: string[] | null;
  /** Sortie salle française quand TMDB la connaît, sortie mondiale sinon. */
  date_sortie: string | null;
  producteurs: string[] | null;
  /** Budget en dollars. NULL quand TMDB l'ignore, il rend 0 dans ce cas. */
  budget: number | null;
  /** Compositeur de la musique originale. */
  musique: string | null;
  /**
   * Champ `popularity` de TMDB, recalculé chez eux tous les jours à partir des
   * consultations et des recherches récentes. Mesure ce qu'on regarde *en ce
   * moment*, et se périme donc sans repasse du script.
   */
  popularite: number | null;
}

export interface Edition {
  id: number;
  /** Code-barres, présent sur 3 428 des 5 739 éditions. */
  ean: string | null;
  film_id: number;
  titre: string | null;
  formats_extraits: string | null;
  prix_fnac_extrait: string | null;
  /**
   * Prix conseillé, en **texte** : `24.99`, `29.0`. Sa devise dépend de la
   * source, Zavvi étant britannique (cf. `lib/prix.ts`). Présent sur 10 089
   * éditions sur 16 923 au 3 août 2026, absent de tout blu-ray.com.
   */
  prix_editeur: string | null;
  /** `bluray.com`, `zavvi.com`, `metalunastore.fr`… Sert à lire la devise. */
  source: string | null;
  image_url: string | null;
  pays: string | null;
  date_sortie: string | null;
  region: string | null;
  /* Specs du disque, source blu-ray.com. Nulles sur les 3 193 éditions
     editioncollector, qui ne publient pas de fiche technique. */
  codec: string | null;
  resolution: string | null;
  hdr: string[] | null;
  ratio: string | null;
  /** Ratio de projection, quand il diffère de celui du disque. */
  ratio_origine: string | null;
  pistes_audio: PisteAudio[] | null;
  sous_titres: string[] | null;
  disques: string | null;
  packaging: string | null;
  /** Éditeur vidéo du disque, celui qui presse. */
  editeur: string | null;
  /**
   * Distributeur du disque, relevé chez dvdfr et nulle part ailleurs : TMDB ne
   * le publie pas, et `production_companies` liste les sociétés de production,
   * qui ne le sont que par coïncidence. Distinct d'`editeur` : Studiocanal
   * presse, Universal distribue.
   */
  distributeur: string | null;
  /**
   * Date de parution du disque, analysée depuis `date_sortie`, qui reste du
   * texte anglais, inutilisable pour trier. Nulle sur les éditions
   * editioncollector, qui ne publient pas de date.
   */
  date_parution: string | null;
  /**
   * Visuels supplémentaires du boîtier : dos, tranche, intérieur, goodies.
   * Renseignés sur 2 877 éditions, toutes editioncollector. Sert la
   * visionneuse, qui les enchaîne après l'image principale.
   */
  images_secondaires: string[] | null;
  /**
   * Offres marchandes de cette édition, jointes depuis `offres`.
   *
   * Vide sur l'immense majorité du catalogue : 4 285 éditions en portent une au
   * 6 août 2026, celles dont l'EAN tombe dans un des deux flux Awin, E.Leclerc
   * en neuf et momox shop en occasion. Une édition sans offre n'est pas une
   * édition introuvable, c'est une édition dont aucun de nos partenaires ne
   * publie de prix.
   *
   * **Une édition peut en porter plusieurs**, et 413 le font : c'est le cas
   * prévu depuis le premier jour par l'unicité `(edition_id, marchand,
   * reference)`, et ce qui oblige l'affichage à choisir plutôt qu'à prendre la
   * première venue (cf. `offreAAfficher`).
   */
  offres?: Offre[] | null;
}

/**
 * Une offre marchande : un prix **réel**, daté, avec son lien de tracking.
 *
 * À ne pas confondre avec `Edition.prix_editeur`, qui est un prix conseillé
 * figé à la sortie du disque et dont la devise dépend de la source. Ici le
 * prix est celui du jour du relevé, et il se périme : d'où `releve_le`, que
 * l'affichage doit pouvoir montrer.
 */
export interface Offre {
  marchand: string;
  prix: number | null;
  devise: string;
  disponible: boolean | null;
  /** Lien de tracking Awin. Jamais l'URL marchande nue, sans quoi la visite
      n'est pas attribuée et la commission n'existe pas. */
  url: string;
  /**
   * État du disque déclaré par le marchand, vocabulaire fermé de
   * `offres.etat` : `neuf`, `tres_bon`, `bon`, `acceptable`.
   *
   * **Nul veut dire « le marchand ne le dit pas », pas « neuf ».** Momox shop
   * vend de l'occasion depuis le 6 août 2026 : un prix affiché sans son état
   * laisserait croire qu'un disque à 3,49 € est neuf.
   */
  etat: EtatOffre | null;
  releve_le: string;
}

export type EtatOffre = "neuf" | "tres_bon" | "bon" | "acceptable";

/**
 * Ce qu'on écrit à l'écran pour chaque état.
 *
 * Le neuf ne porte pas de mention : c'est le cas attendu quand on regarde un
 * prix marchand, et l'écrire sur les 3 014 offres Leclerc ajouterait un mot par
 * ligne sans rien apprendre. C'est l'occasion qui doit se dire, et les trois
 * paliers reprennent le libellé du marchand plutôt qu'un barème à nous.
 */
export const LIBELLE_ETAT: Record<EtatOffre, string | null> = {
  neuf: null,
  tres_bon: "occasion, très bon état",
  bon: "occasion, bon état",
  acceptable: "occasion, état acceptable",
};

/** Vrai pour une offre de seconde main. Un état inconnu n'est pas une
 *  occasion : on ne devine pas dans ce sens-là non plus. */
export function estOccasion(offre: Offre): boolean {
  return offre.etat !== null && offre.etat !== "neuf";
}

/**
 * L'offre à montrer sur une ligne d'édition, quand il y en a plusieurs.
 *
 * **La moins chère, et son état est écrit à côté.** Le choix d'origine était
 * « la première qui porte un prix », ce qui était juste tant qu'un seul
 * programme existait. Avec deux marchands dont l'un vend de l'occasion, cet
 * ordre est celui que PostgREST a rendu, c'est-à-dire un hasard : la même
 * édition aurait pu afficher 3,49 € ou 19,99 € sans que rien ne le décide.
 *
 * La moins chère est ce qu'on vient chercher, à condition de dire ce qu'elle
 * est : un occasion « état acceptable » à 3,49 € n'est pas une bonne affaire
 * sur un neuf, c'est un autre produit. C'est `LIBELLE_ETAT` qui porte cette
 * moitié du contrat, et sans elle ce classement serait trompeur.
 *
 * **On ne compare que des montants dans la même monnaie.** `lib/prix.ts` pose
 * déjà qu'additionner des livres à des euros donne un nombre qui ne veut rien
 * dire, et le classer n'est pas mieux. Les deux flux sont en euros aujourd'hui,
 * donc ce repli ne sert rien ; il empêche qu'un troisième programme, une
 * boutique britannique par exemple, fasse passer 8,99 £ pour moins cher que
 * 9,99 €.
 */
export function offreAAfficher(offres: Offre[] | null | undefined): Offre | null {
  const exploitables = (offres ?? []).filter(
    (o) => typeof o.prix === "number" && Number.isFinite(o.prix) && o.prix > 0,
  );
  if (exploitables.length === 0) return null;

  const euros = exploitables.filter((o) => (o.devise || "EUR") === "EUR");
  const comparables = euros.length > 0 ? euros : null;
  // Aucune offre en euros : on n'a rien à départager honnêtement, on garde la
  // première plutôt que d'inventer un taux de change.
  if (!comparables) return exploitables[0];

  return comparables.reduce((a, b) => ((b.prix as number) < (a.prix as number) ? b : a));
}

export interface PisteAudio {
  /** Nom en français : le parseur traduit et filtre à l'import. */
  langue: string;
  /** « DTS-HD Master Audio 5.1 », « Dolby Atmos »… */
  format: string;
}

export type StatutValue = "envie" | "possede";

/**
 * Normalise les champs de liste des éditions (`formats_extraits`, etc.).
 *
 * PostgREST rend un `text[]` en tableau, mais certaines lignes issues des
 * imports portent encore une chaîne séparée par des virgules. Les deux formes
 * cohabitent en base, il faut donc accepter les deux.
 */
export function splitList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  return String(val).split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Agrège les specs techniques des éditions d'un film en une seule fiche.
 *
 * Les specs sont portées par le disque, pas par l'œuvre : une 4K en Dolby
 * Vision et un Blu-ray 1080p du même film n'ont ni la même définition, ni le
 * même codec, ni les mêmes pistes. La fiche film réunit donc ce qui existe
 * *quelque part* au catalogue, « disponible en Dolby Vision », pas « ce film
 * est en Dolby Vision ». Le décompte d'éditions renseignées est rendu avec,
 * pour que la page dise sur quoi elle s'appuie.
 *
 * Chaque liste est ordonnée par fréquence décroissante : la valeur portée par
 * le plus d'éditions passe devant. À égalité, l'ordre alphabétique tranche,
 * sinon deux chargements de la même page pourraient différer.
 */
export interface SpecsFilm {
  definitions: string[];
  hdr: string[];
  ratios: string[];
  codecs: string[];
  languesAudio: string[];
  sousTitres: string[];
  editeurs: string[];
  distributeurs: string[];
  zones: string[];
  /** Nombre d'éditions ayant fourni au moins une valeur. */
  sources: number;
}

/** « Native 4K (2160p) » et « 4K (2160p) » désignent la même chose. */
function normaliserDefinition(v: string): string {
  if (/2160p/i.test(v)) return "4K (2160p)";
  return v;
}

/**
 * Un champ de blu-ray.com peut porter plusieurs valeurs dans une seule chaîne,
 * « 2.41:1, 2.40:1, 1.85:1 » sur un coffret qui réunit trois montages,
 * « MPEG-4 AVC, VC-1 » sur un disque à deux encodages. Sans découpage, chaque
 * combinaison devient une valeur distincte et la ligne affiche
 * « 1.85:1 · 2.41:1, 2.40:1, 1.85:1 », où 1.85:1 apparaît deux fois.
 *
 * Le débit entre parenthèses est retiré au passage : « HEVC / H.265 » et
 * « HEVC / H.265 (50.53 Mbps) » sont le même codec, et le débit relève du
 * disque, pas du film.
 */
function eclater(valeur: string): string[] {
  return valeur
    .split(",")
    .map((v) => v.replace(/\s*\([^)]*\)\s*$/, "").trim())
    .filter(Boolean);
}

/**
 * `region` arrive tel quel de blu-ray.com : « 2K Blu-ray: Region B (A, C
 * untested) ». Seules les zones affirmées comptent, celles entre parenthèses
 * sont marquées `untested`, donc invérifiées, et les afficher les ferait
 * passer pour des garanties.
 */
export function zonesDe(region: string | null): string[] {
  if (!region) return [];
  const affirme = region.split("(")[0];
  return Array.from(new Set(affirme.match(/\bRegion\s+([ABC])\b/g) || []))
    .map((m) => m.replace(/\bRegion\s+/, "Zone "));
}

export function agregerSpecs(editions: Edition[]): SpecsFilm {
  const compteurs: Record<string, Map<string, number>> = {
    definitions: new Map(), hdr: new Map(), ratios: new Map(),
    codecs: new Map(), languesAudio: new Map(), sousTitres: new Map(),
    editeurs: new Map(), distributeurs: new Map(), zones: new Map(),
  };
  const ajouter = (cle: string, valeurs: (string | null | undefined)[]) => {
    for (const v of valeurs) {
      const s = (v || "").trim();
      if (!s) continue;
      compteurs[cle].set(s, (compteurs[cle].get(s) || 0) + 1);
    }
  };

  let sources = 0;
  for (const ed of editions) {
    const pistes = Array.isArray(ed.pistes_audio) ? ed.pistes_audio : [];
    const renseignee =
      !!(ed.resolution || ed.ratio || ed.ratio_origine || ed.codec || ed.editeur ||
         ed.distributeur) ||
      pistes.length > 0 || splitList(ed.hdr).length > 0 || splitList(ed.sous_titres).length > 0;
    if (renseignee) sources += 1;

    ajouter("definitions", [ed.resolution && normaliserDefinition(ed.resolution)]);
    ajouter("hdr", splitList(ed.hdr));
    // Le ratio du disque prime ; `ratio_origine` ne sert que s'il manque, pour
    // ne pas afficher deux fois la même valeur, les deux sont identiques sur
    // l'écrasante majorité des fiches.
    ajouter("ratios", eclater(ed.ratio || ed.ratio_origine || ""));
    ajouter("codecs", eclater(ed.codec || ""));
    ajouter("languesAudio", pistes.map((p) => p?.langue));
    ajouter("sousTitres", splitList(ed.sous_titres));
    ajouter("editeurs", [ed.editeur]);
    ajouter("distributeurs", [ed.distributeur]);
    ajouter("zones", zonesDe(ed.region));
  }

  const classer = (cle: string) =>
    Array.from(compteurs[cle].entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
      .map(([v]) => v);

  return {
    definitions: classer("definitions"),
    hdr: classer("hdr"),
    ratios: classer("ratios"),
    codecs: classer("codecs"),
    languesAudio: classer("languesAudio"),
    sousTitres: classer("sousTitres"),
    editeurs: classer("editeurs"),
    distributeurs: classer("distributeurs"),
    zones: classer("zones"),
    sources,
  };
}

/** An edition joined with its parent film, used by the list pages. */
export interface EditionWithFilm extends Edition {
  film: Pick<Film, "id" | "titre" | "affiche_url" | "slug"> | null;
}

/* ---- Films ---- */

/**
 * En dessous de quatre caractères, une saisie n'est pas une faute de frappe,
 * c'est un début de mot. `war` doit continuer de rendre tout ce qui contient
 * « war », et surtout pas les titres qui lui ressemblent de loin.
 */
const LONGUEUR_MINIMALE_APPROCHANTE = 4;

/**
 * Repli tolérant aux fautes de frappe, par trigrammes.
 *
 * Il ne se substitue jamais à la recherche exacte, il la prolonge quand elle ne
 * rend rien : « Intrestellar » n'atteint *Interstellar* par aucun `ilike`, deux
 * lettres interverties suffisant à casser la sous-chaîne. Le classement revient
 * ici à la proximité mesurée, pas à l'alphabet : le meilleur candidat doit
 * ouvrir la liste.
 *
 * L'échec est avalé. La recherche exacte a déjà rendu zéro résultat, donc une
 * liste vide est exactement ce que l'utilisateur aurait vu sans ce repli ; y
 * substituer un message rouge transformerait une amélioration en panne.
 *
 * cf. `supabase/migrations/20260801_recherche_approchante.sql` pour le seuil
 * retenu et pourquoi c'est `word_similarity` et non `similarity`, et
 * `20260801_recherche_classee.sql` pour la normalisation partagée.
 */
async function rechercheApprochante(terme: string, limite = 50): Promise<Film[]> {
  if (terme.length < LONGUEUR_MINIMALE_APPROCHANTE) return [];
  const { data, error } = await supabase.rpc("recherche_films_approchante", {
    terme,
    limite,
  });
  if (error) {
    console.warn("Recherche approchante indisponible:", error.message);
    return [];
  }
  return (data ?? []) as Film[];
}

/** Résultats, et la façon dont ils ont été trouvés. */
export interface ResultatRecherche {
  films: Film[];
  /** Vrai quand la recherche exacte n'a rien rendu et que le repli approchant a pris le relais. */
  approchante: boolean;
}

/**
 * Recherche par titre, ou catalogue par défaut quand la requête est vide.
 *
 * **Le classement par défaut est la popularité TMDB, pas l'ordre alphabétique.**
 * Une page d'accueil qui ouvre sur « …Et pour quelques dollars de plus » et
 * « [REC] » ne montre pas un catalogue vivant, elle montre le début d'une liste.
 * `popularite` est recalculé quotidiennement chez TMDB à partir des
 * consultations et recherches récentes : la sortie du mois y remonte d'elle-même,
 * là où `nb_votes` figerait les mêmes classiques pour toujours.
 *
 * `nulls: "last"` est indispensable : les films non encore enrichis ont une
 * popularité nulle, et PostgreSQL classe les nuls en premier sur un tri
 * descendant, la page se serait ouverte sur les fiches les moins renseignées.
 *
 * **La recherche explicite n'est plus alphabétique.** Elle l'a été, au motif
 * qu'on cherche un titre connu ; mais « Star » ouvrait alors sur *A Star for
 * Two* et *Star Crystal*, et le plafond de 50 lignes tombait avant *Star Wars*.
 * Le classement par pertinence vit en base (`recherche_films`), parce que la
 * limite s'applique **avant** le tri : reclasser côté client ne ferait pas
 * revenir ce qui n'a jamais été chargé.
 *
 * C'est aussi ce qui fait entrer le réalisateur dans la recherche : « Kubrick »
 * rend ses films, au dernier rang, donc sans jamais passer devant un titre.
 *
 * **Deux étages, jamais un seul.** L'exact d'abord, l'approchant en repli. Une
 * recherche par trigrammes menée d'emblée classerait par proximité un lot que
 * l'utilisateur a désigné sans se tromper, et ferait passer *Matrix Reloaded*
 * devant *Matrix* sur une saisie parfaite. Le repli ne coûte rien tant que la
 * frappe est juste : il n'est appelé que sur zéro résultat.
 */
export async function searchFilms(query: string, limite = 50): Promise<ResultatRecherche> {
  const terme = query.trim();

  if (!terme) {
    const { data, error } = await supabase
      .from("films")
      .select("*")
      .limit(limite)
      .order("popularite", { ascending: false, nullsFirst: false });
    if (error) throw new Error(`Erreur lors du chargement du catalogue: ${error.message}`);
    return { films: (data ?? []) as Film[], approchante: false };
  }

  const { data, error } = await supabase.rpc("recherche_films", { terme, limite });
  if (error) throw new Error(`Erreur lors de la recherche de films: ${error.message}`);

  const exacts = (data ?? []) as Film[];
  if (exacts.length > 0) return { films: exacts, approchante: false };

  const proches = await rechercheApprochante(terme, limite);
  return { films: proches, approchante: proches.length > 0 };
}

/**
 * Dernières parutions, avec l'affiche de leur film.
 *
 * Triées sur `date_parution`, la colonne date normalisée, et non sur
 * `date_sortie`, qui reste le texte anglais des sources (« Sep 30, 2025 ») et
 * dont le tri SQL serait alphabétique, donc faux : « Apr » passerait avant
 * « Sep » quelle que soit l'année.
 *
 * Le plafond à aujourd'hui écarte les annonces : 117 éditions portent une date
 * de parution en 2026, dont certaines à venir. Une page qui titre « dernières
 * parutions » et montre un disque qui sort dans deux mois se trompe de mot.
 *
 * `!inner` sur `edition_films` écarte les 377 éditions sans film, sans affiche
 * ni titre d'œuvre, elles n'ont rien à montrer.
 *
 * **Ces éditions n'ont pas de visuel de boîtier, et c'est structurel.** Les
 * 2 543 lignes datées viennent toutes de blu-ray.com, qui ne publie aucune
 * image, les 3 193 visuels du catalogue sont chez editioncollector, qui ne
 * publie aucune date. Le recouvrement est exactement nul. La carte retombe donc
 * sur l'affiche TMDB du film, qui existe toujours ; filtrer sur `image_url`
 * comme le faisait la première version vidait la liste.
 */
export async function getDernieresEditions(limite = 18): Promise<EditionWithFilm[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("*, edition_films!inner(film:films!inner(id, titre, affiche_url, slug))")
    .not("date_parution", "is", null)
    .lte("date_parution", new Date().toISOString().slice(0, 10))
    .order("date_parution", { ascending: false })
    /*
      Tri secondaire obligatoire, et ce n'est pas décoratif : dix éditions
      partagent le 27 juillet 2026, quatorze le 21. Sans ordre total, PostgreSQL
      départage les ex æquo comme son plan le décide, donc le rail changeait
      d'ordre — et de contenu, la limite tombant au milieu d'un paquet — à chaque
      rechargement. Même piège que la pagination du §9, vu ici sans `offset`.
    */
    .order("id", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Erreur lors du chargement des dernières éditions: ${error.message}`);

  // PostgREST rend la jointure comme un tableau : une édition peut appartenir à
  // plusieurs films quand c'est un coffret. On garde le premier, qui suffit à
  // l'illustrer.
  return (data ?? []).map((ligne) => {
    const { edition_films: liens, ...edition } = ligne as Record<string, unknown> & {
      edition_films?: { film: Pick<Film, "id" | "titre" | "affiche_url"> }[];
    };
    return { ...edition, film: liens?.[0]?.film ?? null } as EditionWithFilm;
  });
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
    // `offres(...)` est une jointure à gauche : une édition sans offre revient
    // avec un tableau vide, elle ne disparaît pas de la liste. C'est le cas
    // de 96 % du catalogue, donc ce n'est pas un détail.
    // Une seule chaîne littérale, jamais une concaténation : `postgrest-js`
    // infère le type de la réponse depuis le texte du `select`, et une
    // expression le lui rend opaque. Le symptôme est un `tsc` qui parle de
    // `{ error: true } & String` sur la ligne du `map`, dix lignes plus bas.
    .select("*, edition_films!inner(film_id), offres(marchand,prix,devise,disponible,url,releve_le,etat)")
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
      // PostgREST voit deux chemins entre `editions` et `films`, la colonne
      // `film_id` et la table de liaison `edition_films`, et refuse la requête
      // avec « more than one relationship was found ».
      .select("*, film:films!film_id(id, titre, affiche_url, slug)")
      .in("id", ids.slice(debut, debut + TRANCHE));
    if (error) throw new Error(`Erreur lors du chargement des éditions: ${error.message}`);
    resultat.push(...((data ?? []) as EditionWithFilm[]));
  }

  return resultat;
}
