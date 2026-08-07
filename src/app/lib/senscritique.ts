import type { EntreeImportee } from "./import-collection";

/**
 * Lire une collection SensCritique, depuis le navigateur du visiteur.
 *
 * **Ce que la sonde du 7 août 2026 a établi.** `apollo.senscritique.com` est un
 * serveur Apollo qui ne sert aucun `robots.txt`, répond sans authentification, et
 * annonce `access-control-allow-origin: *`. Tout se fait donc **dans le
 * navigateur du visiteur, sur ses propres données** : nos serveurs n'adressent
 * aucune requête à senscritique.com, il n'y a ni proxy, ni crawl HTML, ni
 * pagination de `www.senscritique.com`. Le `Disallow: /*?page=*` de leur
 * `robots.txt` vise un robot sur l'hôte `www`, que nous ne touchons pas.
 *
 * Mesuré sur des comptes réels : `collection(DONE)` rend 847 films,
 * `collection(WISH)` 1 005, `listsCreated` 48 listes, et une liste rend ses
 * films avec leur `annotation`.
 *
 * **Toutes les requêtes ne sont pas ouvertes**, et c'est rassurant plutôt que
 * l'inverse : `usersByUniverse` rend `auth/unauthenticated-user`. L'API distingue
 * explicitement ce qu'elle expose de ce qu'elle ferme, et les trois champs
 * employés ici sont du côté ouvert.
 */

const ENDPOINT = "https://apollo.senscritique.com/";

/**
 * Deux cents par page.
 *
 * L'application mobile de SensCritique pagine par 18 ; rien ne l'impose, le
 * plafond n'a pas été atteint à 200, et 200 divise par onze le nombre
 * d'allers-retours sur une collection de deux mille titres.
 */
const PAGE = 200;

/**
 * **Un univers inconnu n'est pas refusé, il est ignoré**, et la requête rend
 * alors *tous* les univers confondus. Mesuré : `universe: "serie"`, qui n'existe
 * pas, rend 4 998 œuvres là où `movie` en rend 847 et `tvShow` 51, jeux vidéo,
 * livres, BD et albums compris. Une faute de frappe ici ferait donc entrer un
 * catalogue de jeux vidéo dans une collection de disques, sans la moindre
 * erreur. Les deux seules valeurs valides sont écrites une fois, ici.
 */
const UNIVERS = ["movie", "tvShow"] as const;

/** Ce que SensCritique appelle une action de collection. */
export type ActionSc = "DONE" | "WISH";

export interface ListeSensCritique {
  id: number;
  label: string;
  nb: number;
  url: string;
}

export interface CompteSensCritique {
  pseudo: string;
  /** Films et séries « vus ». Ce n'est **pas** ce qu'on possède. */
  vus: number;
  envies: number;
  listes: ListeSensCritique[];
}

/** Levée quand l'API ne répond pas ou répond une erreur GraphQL. */
export class SensCritiqueIndisponible extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "SensCritiqueIndisponible";
  }
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(ENDPOINT, {
      method: "POST",
      // `content-type: application/json` satisfait la protection CSRF d'Apollo,
      // qui refuse les types de formulaire simples. C'est ce qu'envoie n'importe
      // quel client GraphQL, il n'y a rien à contourner.
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new SensCritiqueIndisponible("SensCritique est injoignable.");
  }
  if (!reponse.ok) {
    throw new SensCritiqueIndisponible(`SensCritique a répondu ${reponse.status}.`);
  }
  const corps = (await reponse.json()) as { data?: T; errors?: { message: string }[] };
  if (corps.errors?.length) {
    throw new SensCritiqueIndisponible(corps.errors[0].message);
  }
  if (!corps.data) throw new SensCritiqueIndisponible("Réponse vide.");
  return corps.data;
}

/* --------------------------------------------------------- ce qu'on saisit */

/**
 * Tire un pseudo d'une saisie, qu'elle soit un `@`, un pseudo nu ou une URL.
 *
 * On accepte l'URL parce que c'est ce qu'on a sous la main : on est sur son
 * profil, on copie la barre d'adresse. Exiger le pseudo seul ferait rater ceux
 * qui ne savent pas où il se lit.
 */
export function pseudoDepuis(saisie: string): string | null {
  const brut = saisie.trim().replace(/^@/, "");
  if (!brut) return null;

  if (/^https?:\/\//i.test(brut)) {
    try {
      const url = new URL(brut);
      if (!/senscritique\.com$/i.test(url.hostname.replace(/^www\./i, ""))) return null;
      const segments = url.pathname.split("/").filter(Boolean);
      // `/Reikurooo`, `/Reikurooo/collection`, `/Reikurooo/collection?action=WISH`
      const premier = segments[0];
      return premier && !["liste", "top", "film", "serie"].includes(premier) ? premier : null;
    } catch {
      return null;
    }
  }
  return /^[A-Za-z0-9._-]{2,40}$/.test(brut) ? brut : null;
}

/**
 * Tire l'identifiant d'une liste d'une URL `/liste/<slug>/<id>` ou `/top/…`.
 *
 * C'est la porte d'entrée la plus directe : on colle le lien de sa liste, sans
 * avoir à donner son pseudo ni à rendre son profil public.
 */
export function listeDepuis(saisie: string): number | null {
  const m = saisie.trim().match(/\/(?:liste|top)\/[^/]+\/(\d+)/);
  return m ? Number(m[1]) : null;
}

/* ---------------------------------------------------------------- lectures */

const REQUETE_COMPTE = `query Compte($u: String!) {
  user(username: $u) {
    username
    vusFilms: collection(action: DONE, universe: "movie", limit: 1, offset: 0) { total }
    vusSeries: collection(action: DONE, universe: "tvShow", limit: 1, offset: 0) { total }
    enviesFilms: collection(action: WISH, universe: "movie", limit: 1, offset: 0) { total }
    enviesSeries: collection(action: WISH, universe: "tvShow", limit: 1, offset: 0) { total }
    listsCreated(limit: 100, offset: 0, notEmpty: true) {
      items { id label productCount isPrivate url }
    }
  }
}`;

interface ReponseCompte {
  user: {
    username: string;
    vusFilms: { total: number } | null;
    vusSeries: { total: number } | null;
    enviesFilms: { total: number } | null;
    enviesSeries: { total: number } | null;
    listsCreated: {
      items: {
        id: number;
        label: string;
        productCount: number;
        isPrivate: boolean;
        url: string;
      }[];
    } | null;
  } | null;
}

/**
 * Lit un compte, ou rend `null` s'il n'existe pas.
 *
 * **Le pseudo se valide par cette requête et par rien d'autre.** D'autres
 * intégrations sondent d'abord `www.senscritique.com/{pseudo}/collection` ;
 * c'est inutile, `user()` rendant déjà `null` sur un pseudo inconnu, et
 * inutilisable depuis un navigateur, `www` ne servant aucun en-tête CORS.
 */
export async function lireCompte(pseudo: string): Promise<CompteSensCritique | null> {
  const { user } = await graphql<ReponseCompte>(REQUETE_COMPTE, { u: pseudo });
  if (!user) return null;

  const total = (a: { total: number } | null, b: { total: number } | null) =>
    (a?.total ?? 0) + (b?.total ?? 0);

  return {
    pseudo: user.username,
    vus: total(user.vusFilms, user.vusSeries),
    envies: total(user.enviesFilms, user.enviesSeries),
    listes: (user.listsCreated?.items ?? [])
      .filter((l) => !l.isPrivate && l.productCount > 0)
      .map((l) => ({ id: l.id, label: l.label, nb: l.productCount, url: l.url }))
      .sort((a, b) => b.nb - a.nb),
  };
}

const REQUETE_COLLECTION = `query Collection($u: String!, $a: ProductAction, $univers: String, $limit: Int, $offset: Int) {
  user(username: $u) {
    collection(action: $a, universe: $univers, order: LAST_ACTION_DESC, limit: $limit, offset: $offset) {
      total
      products { id title originalTitle yearOfProduction }
    }
  }
}`;

interface Produit {
  id: number;
  title: string | null;
  originalTitle: string | null;
  yearOfProduction: number | null;
}

interface ReponseCollection {
  user: { collection: { total: number; products: Produit[] | null } | null } | null;
}

function versEntree(p: Produit, note?: string | null): EntreeImportee | null {
  const titre = (p.title ?? "").trim();
  if (!titre) return null;
  const e: EntreeImportee = { titre };
  const original = (p.originalTitle ?? "").trim();
  if (original && original !== titre) e.titreOriginal = original;
  if (p.yearOfProduction) e.annee = p.yearOfProduction;
  const n = (note ?? "").trim();
  if (n) e.note = n;
  return e;
}

/** Rappel de progression, pour que mille titres ne ressemblent pas à une panne. */
export type Progression = (faits: number, total: number) => void;

/**
 * Toute la collection d'un compte pour une action, films et séries.
 *
 * Les deux univers sont lus l'un après l'autre : `universe` ne prend qu'une
 * valeur, et une valeur inconnue rendrait tous les univers, jeux vidéo compris.
 */
export async function lireCollection(
  pseudo: string,
  action: ActionSc,
  progression?: Progression,
): Promise<EntreeImportee[]> {
  const entrees: EntreeImportee[] = [];
  let attendu = 0;

  for (const univers of UNIVERS) {
    let offset = 0;
    for (;;) {
      const { user } = await graphql<ReponseCollection>(REQUETE_COLLECTION, {
        u: pseudo,
        a: action,
        univers,
        limit: PAGE,
        offset,
      });
      const collection = user?.collection;
      if (!collection) break;
      if (offset === 0) attendu += collection.total;

      const produits = collection.products ?? [];
      for (const p of produits) {
        const e = versEntree(p);
        if (e) entrees.push(e);
      }
      progression?.(entrees.length, attendu);

      offset += PAGE;
      // On s'arrête sur une page incomplète, jamais sur `total` : le §9 garde la
      // trace d'un listing qui tournait entre deux lectures, et une page courte
      // est le seul signal qui ne dépende pas d'un compteur.
      if (produits.length < PAGE || offset >= collection.total) break;
    }
  }
  return entrees;
}

const REQUETE_LISTE = `query Liste($id: Int!, $limit: Int, $offset: Int) {
  userList(id: $id) {
    label
    productCount
    isPrivate
    productsList(limit: $limit, offset: $offset) {
      total
      items {
        annotation
        product { id title originalTitle yearOfProduction }
      }
    }
  }
}`;

interface ReponseListe {
  userList: {
    label: string;
    productCount: number;
    isPrivate: boolean;
    productsList: {
      total: number;
      items: { annotation: string | null; product: Produit | null }[] | null;
    } | null;
  } | null;
}

/**
 * Une liste entière, avec l'annotation de chaque entrée.
 *
 * **L'annotation vaut de l'or ici.** Mesurée sur une liste réelle intitulée
 * « La collection », elle porte `"Blu-ray"`, `"DVD"`, et jusqu'à
 * `"Coffret blu-ray steelbook (https://editioncollector.fr/…)"`. C'est le
 * format donné à la main, et parfois l'adresse exacte de l'édition, ce qui lève
 * l'ambiguïté sans rien demander.
 */
export async function lireListe(
  id: number,
  progression?: Progression,
): Promise<{ label: string; entrees: EntreeImportee[] } | null> {
  const entrees: EntreeImportee[] = [];
  let label = "";
  let offset = 0;

  for (;;) {
    const { userList } = await graphql<ReponseListe>(REQUETE_LISTE, {
      id,
      limit: PAGE,
      offset,
    });
    if (!userList || userList.isPrivate) return null;
    label = userList.label;

    const items = userList.productsList?.items ?? [];
    for (const item of items) {
      if (!item.product) continue;
      const e = versEntree(item.product, item.annotation);
      if (e) entrees.push(e);
    }
    progression?.(entrees.length, userList.productsList?.total ?? userList.productCount);

    offset += PAGE;
    if (items.length < PAGE || offset >= (userList.productsList?.total ?? 0)) break;
  }

  return { label, entrees };
}
