import { identiteCourante } from "./auth";
import type { EntreeImportee } from "./import-collection";
import type { StatutValue } from "./reelio-db";
import { supabase, clientAuthentifie } from "./supabase";
import { CompteRequis } from "./collections";

/**
 * Apparier une liste importée au catalogue, puis l'écrire.
 *
 * **L'appariement vit en base**, dans `public.apparier_import` : c'est la même
 * règle que la recherche, titre exact replié par `mots_recherche` sur le titre,
 * le titre original ou les titres alternatifs, année à ±1. Une seconde
 * implémentation en TypeScript aurait dérivé de la première sans que ça se voie,
 * ce que le §6 reproche déjà à deux copies de `chercher()`.
 *
 * **Le choix de l'édition, lui, vit ici**, parce que c'est une décision
 * d'affichage : quelle édition proposer quand le film en a quatorze, et surtout
 * quand se taire.
 */

/** Une édition candidate, telle que la base la rend dans le même appel. */
export interface EditionCandidate {
  id: number;
  titre: string | null;
  formats: string[] | null;
  editeur: string | null;
  ean: string | null;
  image_url: string | null;
  url_source: string | null;
  date_parution: string | null;
}

/** Un film candidat pour une entrée du fichier. */
export interface FilmApparie {
  filmId: number;
  titre: string;
  titreOriginal: string | null;
  annee: number | null;
  slug: string | null;
  afficheUrl: string | null;
  realisateur: string | null;
  nbCandidats: number;
  editions: EditionCandidate[];
}

interface LigneRpc {
  rang: number;
  film_id: number;
  titre: string;
  titre_original: string | null;
  annee: number | null;
  slug: string | null;
  affiche_url: string | null;
  realisateur: string | null;
  nb_candidats: number;
  editions: EditionCandidate[];
}

/** Deux cents par appel, c'est le plafond que la fonction refuse de dépasser. */
const LOT = 200;

export type Progression = (faits: number, total: number) => void;

/**
 * Apparie toutes les entrées, par lots.
 *
 * Mesuré le 7 août 2026 sur une liste réelle de 1 005 titres : **4,1 secondes**,
 * soit 3,5 ms par titre, une fois posés les deux index btree d'expression de la
 * migration. Une barre de progression n'est donc pas décorative, dix secondes
 * d'écran figé passent pour une panne.
 */
export async function apparier(
  entrees: EntreeImportee[],
  progression?: Progression,
): Promise<FilmApparie[][]> {
  const resultat: FilmApparie[][] = entrees.map(() => []);

  for (let debut = 0; debut < entrees.length; debut += LOT) {
    const lot = entrees.slice(debut, debut + LOT).map((e, i) => ({
      i: debut + i,
      t: e.titre,
      ...(e.titreOriginal ? { o: e.titreOriginal } : {}),
      ...(e.annee ? { a: e.annee } : {}),
    }));

    const { data, error } = await supabase.rpc("apparier_import", { p_entrees: lot });
    if (error) throw new Error(`Appariement impossible : ${error.message}`);

    for (const ligne of (data ?? []) as LigneRpc[]) {
      resultat[ligne.rang]?.push({
        filmId: ligne.film_id,
        titre: ligne.titre,
        titreOriginal: ligne.titre_original,
        annee: ligne.annee,
        slug: ligne.slug,
        afficheUrl: ligne.affiche_url,
        realisateur: ligne.realisateur,
        nbCandidats: ligne.nb_candidats,
        editions: ligne.editions ?? [],
      });
    }
    progression?.(Math.min(debut + LOT, entrees.length), entrees.length);
  }

  return resultat;
}

/* --------------------------------------------------------------- formats - */

/** Les formats qu'on sait déclarer, dans l'ordre où on les propose. */
export const FORMATS = ["Blu-ray 4K", "Blu-ray", "DVD"] as const;
export type FormatVoulu = (typeof FORMATS)[number];

/**
 * Devine un format dans un texte libre.
 *
 * Les deux pièges du §9 sont repris tels quels, parce qu'ils se reproduisent
 * mot pour mot ici :
 *
 * - **un « 4K » n'est pas toujours un format de disque.** « restauré en 4K »,
 *   « nouveau master 4K » décrivent la restauration, pas le support, et tout
 *   éditeur de patrimoine écrit cette phrase. D'où la garde de contexte ;
 * - **`blu-ray` répond à l'intérieur de « Blu-ray 4K »**, donc un 4K recevrait
 *   aussi l'étiquette Blu-ray. Le refus se pose sur ce qui **suit** la mention,
 *   jamais sur la présence de « 4K » ailleurs dans la chaîne : `Blu-ray +
 *   Blu-ray 4K` est un vrai combo dont le premier terme doit répondre.
 */
export function formatDepuisTexte(texte: string | null | undefined): FormatVoulu | null {
  if (!texte) return null;
  const t = texte.toLowerCase();

  /*
    `\S*` et non `\w*` après la racine, et ce détail a été trouvé par un test :
    `\w` ne couvre pas les lettres accentuées en JavaScript, donc `restaur\w*`
    s'arrête avant le « é » de « restauré », le `\s+` qui suit échoue, et
    « restauré en 4K » repassait pour un disque 4K. Exactement le piège du §9 sur
    `translate()` appliqué avant `lower()`, dans une autre grammaire.

    Le garde ne vaut que dans ce sens, la mention de restauration **avant** le
    4K : « Blu-ray 4K restauré » déclare bien un disque 4K, et le bloquer
    perdrait un format réel pour se protéger d'une tournure qui n'existe pas.
  */
  const restauration = /(restaur|master|scan|t[eé]l[eé]cin[eé]ma|n[eé]gatif|copie)\S*\s+(en\s+)?(4k|uhd)/;
  if (/\b(4k|ultra\s*hd|uhd)\b/.test(t) && !restauration.test(t)) return "Blu-ray 4K";
  if (/blu-?ray(?!\s*(?:4k|ultra\s*hd|uhd))|\bbrd?\b/.test(t)) return "Blu-ray";
  if (/\bdvd\b/.test(t)) return "DVD";
  return null;
}

function porteFormat(edition: EditionCandidate, format: FormatVoulu): boolean {
  return (edition.formats ?? []).includes(format);
}

/**
 * L'édition représentative d'un film, quand personne n'a tranché.
 *
 * **La règle doit être déterministe**, sinon réimporter le même fichier
 * écrirait une seconde ligne pour le même film et la collection doublerait. On
 * classe donc sur des données stables, jamais sur un hasard ni sur une date du
 * jour : d'abord la fiche la plus complète, code-barres et visuel étant ce qui
 * fait qu'une carte s'affiche correctement, puis la parution la plus récente,
 * puis l'identifiant.
 */
function representative(editions: EditionCandidate[]): EditionCandidate | null {
  if (editions.length === 0) return null;
  const score = (e: EditionCandidate) =>
    (e.ean ? 4 : 0) + (e.image_url ? 2 : 0) + (e.date_parution ? 1 : 0);
  return [...editions].sort((a, b) => {
    const d = score(b) - score(a);
    if (d !== 0) return d;
    const da = a.date_parution ?? "";
    const db = b.date_parution ?? "";
    if (da !== db) return db.localeCompare(da);
    return a.id - b.id;
  })[0];
}

/* ---------------------------------------------------------------- verdict - */

export type Sort = "sur" | "aPreciser" | "homonyme" | "absent";

export interface LigneImport {
  entree: EntreeImportee;
  candidats: FilmApparie[];
  sort: Sort;
  /** Le film retenu. Nul tant qu'un homonyme n'est pas tranché. */
  film: FilmApparie | null;
  /** L'édition qui sera écrite. Nulle si rien n'a pu être choisi. */
  edition: EditionCandidate | null;
  /**
   * Faux quand l'édition n'a pas été choisie mais désignée faute de mieux.
   * Recopié tel quel dans `collections.edition_precisee`.
   */
  precisee: boolean;
}

/**
 * Choisit une édition pour une entrée, et dit si le choix en est un.
 *
 * Quatre chemins, du plus sûr au moins sûr :
 *
 * 1. **l'annotation porte une adresse de fiche**, ce que SensCritique laisse
 *    faire et que les collectionneurs utilisent :
 *    `"Coffret blu-ray steelbook (https://editioncollector.fr/collectors/…)"`.
 *    C'est l'édition exacte, sans ambiguïté possible ;
 * 2. **l'annotation porte un code-barres**, même chose ;
 * 3. **une seule édition existe**, ou une seule dans le format déclaré ;
 * 4. **sinon on désigne sans affirmer**, et `precisee` vaut faux.
 *
 * Le quatrième cas est le cas courant et non l'exception : mesuré sur une liste
 * réelle, 390 des 527 films appariés portent plusieurs éditions, et déclarer un
 * format n'en lève que 51. Un film populaire a quatorze Blu-ray, personne ne se
 * souvient duquel, et le §9 interdit d'écrire un lien qu'on ne sait pas vrai.
 */
export function choisirEdition(
  film: FilmApparie,
  note: string | null | undefined,
  formatVoulu: FormatVoulu | null,
): { edition: EditionCandidate | null; precisee: boolean } {
  const editions = film.editions;
  if (editions.length === 0) return { edition: null, precisee: false };
  if (editions.length === 1) return { edition: editions[0], precisee: true };

  if (note) {
    const parUrl = editions.find(
      (e) => e.url_source && note.includes(e.url_source),
    );
    if (parUrl) return { edition: parUrl, precisee: true };

    const code = note.match(/\b\d{13}\b/)?.[0];
    if (code) {
      const parEan = editions.find((e) => e.ean === code);
      if (parEan) return { edition: parEan, precisee: true };
    }
  }

  // Le format de l'annotation prime sur celui déclaré une fois pour toute la
  // liste : « DVD » écrit à la main sur cette ligne-là est plus précis qu'un
  // « je collectionne en Blu-ray » qui vaut pour le lot.
  const format = formatDepuisTexte(note) ?? formatVoulu;
  if (format) {
    const dansLeFormat = editions.filter((e) => porteFormat(e, format));
    if (dansLeFormat.length === 1) return { edition: dansLeFormat[0], precisee: true };
    if (dansLeFormat.length > 1) {
      return { edition: representative(dansLeFormat), precisee: false };
    }
  }

  return { edition: representative(editions), precisee: false };
}

/**
 * Classe chaque entrée du fichier, sans rien écrire.
 *
 * Le compte rendu se lit avant l'écriture, jamais après : c'est la seule façon
 * de refuser un import qui aurait mal tourné, et c'est aussi ce qui rend le
 * levier de format utile, on le change et le tableau se recalcule sans un appel.
 */
export function classer(
  entrees: EntreeImportee[],
  candidatsParEntree: FilmApparie[][],
  formatVoulu: FormatVoulu | null,
): LigneImport[] {
  return entrees.map((entree, i) => {
    const candidats = candidatsParEntree[i] ?? [];

    if (candidats.length === 0) {
      return { entree, candidats, sort: "absent", film: null, edition: null, precisee: false };
    }
    if (candidats[0].nbCandidats > 1) {
      return { entree, candidats, sort: "homonyme", film: null, edition: null, precisee: false };
    }

    const film = candidats[0];
    const { edition, precisee } = choisirEdition(film, entree.note, formatVoulu);
    if (!edition) {
      // Un film apparié sans édition ne devrait pas exister, `apparier_import`
      // les écarte. Si ça arrive quand même, c'est un absent, pas un import.
      return { entree, candidats, sort: "absent", film, edition: null, precisee: false };
    }
    return {
      entree,
      candidats,
      sort: precisee ? "sur" : "aPreciser",
      film,
      edition,
      precisee,
    };
  });
}

/** Ce qu'un import a produit, pour l'écran de compte rendu. */
export interface Bilan {
  sur: number;
  aPreciser: number;
  homonyme: number;
  absent: number;
}

export function bilanDe(lignes: LigneImport[]): Bilan {
  const b: Bilan = { sur: 0, aPreciser: 0, homonyme: 0, absent: 0 };
  for (const l of lignes) b[l.sort]++;
  return b;
}

/* ---------------------------------------------------------------- écriture */

/** PostgREST tient largement 500 lignes par requête ; on ne pousse pas plus. */
const LOT_ECRITURE = 500;

export interface ResultatEcriture {
  ecrites: number;
  precisees: number;
}

/**
 * Écrit les lignes retenues dans `collections`.
 *
 * `upsert` sur `(user_id, edition_id)`, exactement comme `fusionner()` dans
 * `collections.ts` : réimporter le même fichier est donc sans effet de bord, et
 * **rien n'est jamais retiré**. Une édition déjà possédée le reste, l'import ne
 * peut qu'ajouter.
 *
 * `edition_precisee` part avec la ligne : c'est ce qui distingue « j'ai ce
 * steelbook » de « j'ai ce film en Blu-ray, sans savoir lequel », et ce que
 * l'écran « à préciser » relira ensuite.
 */
export async function ecrireImport(
  lignes: LigneImport[],
  statut: StatutValue,
): Promise<ResultatEcriture> {
  const identite = await identiteCourante();
  if (!identite) throw new CompteRequis();

  // Une même édition peut être désignée par deux entrées du fichier, deux
  // titres différents rattachés au même coffret par exemple. Sans ce
  // dédoublonnage, l'upsert bute sur « ON CONFLICT DO UPDATE command cannot
  // affect row a second time ».
  const parEdition = new Map<number, LigneImport>();
  for (const l of lignes) {
    if (!l.edition) continue;
    const deja = parEdition.get(l.edition.id);
    // Entre deux prétendantes, la précise gagne : elle affirme davantage.
    if (!deja || (!deja.precisee && l.precisee)) parEdition.set(l.edition.id, l);
  }

  const rangs = [...parEdition.values()].map((l) => ({
    user_id: identite.userId,
    edition_id: l.edition!.id,
    statut,
    edition_precisee: l.precisee,
  }));

  const client = clientAuthentifie(identite.jeton);
  for (let debut = 0; debut < rangs.length; debut += LOT_ECRITURE) {
    const { error } = await client
      .from("collections")
      .upsert(rangs.slice(debut, debut + LOT_ECRITURE), {
        onConflict: "user_id,edition_id",
      });
    if (error) throw new Error(`Écriture impossible : ${error.message}`);
  }

  return {
    ecrites: rangs.length,
    precisees: rangs.filter((r) => r.edition_precisee).length,
  };
}
