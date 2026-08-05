/**
 * Lecture de la base et préparation des visuels, pour les carrousels Instagram.
 *
 * Trois choses, dont une seule est évidente :
 *
 * 1. lire PostgREST avec la clé anon, exactement comme `generer-sitemap.mjs` ;
 * 2. choisir le **meilleur** visuel d'une édition, qui n'est pas `image_url` ;
 * 3. **refuser** un visuel trop petit plutôt que de publier une image floue.
 *
 * Le point 2 vient du §5 : les `image_url` d'editioncollector sont de vraies
 * vignettes, 172 × 233, et il n'existe pas de version pleine taille, le même
 * chemin sans le préfixe `vignette-` répondant 404. Les `images_secondaires`,
 * elles, font autour de 1 024 px. Sur une planche de 1 080 de large la vignette
 * donne une bouillie, la secondaire tient. C'est l'inverse de l'ordre employé
 * par le site, où la vignette est le bon choix parce que le cadre fait 56 px.
 *
 * Le point 3 est le vrai garde-fou. Un post flou ne casse rien, ne lève aucune
 * erreur, et se voit seulement une fois publié : c'est la panne muette du §9,
 * transposée à une image. On mesure donc les pixels avant de composer.
 *
 * Lecture seule, aucune écriture en base.
 */

import { mkdtempSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { detourerFichier } from "./detourer.mjs";

export const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const info = readFileSync(resolve(RACINE, "utils/supabase/info.tsx"), "utf8");
const projectId = info.match(/projectId = "([^"]+)"/)?.[1];
const anonKey = info.match(/publicAnonKey = "([^"]+)"/)?.[1];

if (!projectId || !anonKey) {
  throw new Error("utils/supabase/info.tsx : projectId ou publicAnonKey introuvable");
}

const API = `https://${projectId}.supabase.co/rest/v1`;
const ENTETES = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

/** GET PostgREST. Une lecture qui échoue s'interrompt, elle ne rend pas vide (§9). */
export async function lire(chemin) {
  const reponse = await fetch(`${API}/${chemin}`, { headers: ENTETES });
  if (!reponse.ok) {
    throw new Error(`${chemin} : HTTP ${reponse.status} ${await reponse.text()}`);
  }
  return reponse.json();
}

/** Effectif exact, lu dans `content-range`, sans rapatrier les lignes. */
export async function compter(chemin) {
  const reponse = await fetch(`${API}/${chemin}`, {
    headers: { ...ENTETES, Prefer: "count=exact", Range: "0-0" },
  });
  if (!reponse.ok) throw new Error(`${chemin} : HTTP ${reponse.status}`);
  return Number((reponse.headers.get("content-range") ?? "").split("/")[1]) || 0;
}

/* ------------------------------------------------------------------ visuels */

/**
 * Demande à chaque hôte la taille dont la planche a besoin.
 *
 * Le site fait l'inverse et pour la même raison : `lib/visuels.ts` rétrécit les
 * URL Leclerc parce qu'un cadre de 56 px n'a que faire de 928 Ko. Ici le cadre
 * fait 520 px sur une planche à 1 080, donc on redemande grand. La logique est
 * volontairement redite plutôt qu'importée, `visuels.ts` étant du TypeScript
 * que Node ne charge pas sans passer par le build ; elle tient en trois cas et
 * ne concerne que la génération d'images, jamais le rendu du site.
 */
function pleineTaille(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "media.e.leclerc") {
      u.searchParams.set("w", "1400");
      u.searchParams.set("h", "1400");
      // `func=fit` garde le rapport au lieu de rogner, cf. lib/visuels.ts.
      return u.toString();
    }
    if (u.hostname === "image.tmdb.org") {
      // La taille fait partie du chemin chez eux, comme `pleineResolution`.
      return url.replace(/\/w\d+\//, "/original/");
    }
    if (u.pathname.includes("/cdn/shop/")) {
      // Shopify encode la largeur dans le nom : `..._1024x.jpg`. Les boutiques
      // servent jusqu'à 2048, au-delà elles rendent l'original.
      return url.replace(/_\d+x(\.[a-z]+)/i, "_2048x$1");
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Dimensions en pixels, lues dans l'en-tête du fichier.
 *
 * Pas de dépendance : trois formats couvrent tout ce que les six sources
 * servent. Un format inconnu rend `null`, et l'appelant traite « taille
 * inconnue » comme un avertissement et non comme un refus, sous peine de jeter
 * un bon visuel pour un en-tête qu'on n'a pas su lire.
 */
function dimensions(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf.toString("latin1", 1, 4) === "PNG") {
    return { largeur: buf.readUInt32BE(16), hauteur: buf.readUInt32BE(20) };
  }

  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marqueur = buf[i + 1];
      // SOF0 à SOF15, en écartant DHT, JPG, DAC, qui tombent dans la plage.
      const estSof =
        marqueur >= 0xc0 && marqueur <= 0xcf &&
        marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc;
      if (estSof) return { hauteur: buf.readUInt16BE(i + 5), largeur: buf.readUInt16BE(i + 7) };
      const taille = buf.readUInt16BE(i + 2);
      if (taille < 2) return null;
      i += 2 + taille;
    }
    return null;
  }

  if (buf.length > 30 && buf.toString("latin1", 0, 4) === "RIFF" &&
      buf.toString("latin1", 8, 12) === "WEBP") {
    const type = buf.toString("latin1", 12, 16);
    if (type === "VP8X") {
      return {
        largeur: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        hauteur: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      };
    }
    if (type === "VP8 ") {
      return { largeur: buf.readUInt16LE(26) & 0x3fff, hauteur: buf.readUInt16LE(28) & 0x3fff };
    }
    if (type === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { largeur: 1 + (bits & 0x3fff), hauteur: 1 + ((bits >> 14) & 0x3fff) };
    }
  }

  return null;
}

const TYPES = { 0x89: "image/png", 0xff: "image/jpeg", 0x52: "image/webp" };

/**
 * Poids minimal d'un fichier tenu pour une vraie image.
 *
 * Le visuel d'attente d'editioncollector, `actularge.jpg`, pèse 3 155 octets,
 * le même à l'octet près sur les 328 éditions qui le portaient (§5). Il répond
 * 200 et donne un appareil photo gris à l'écran. Un contrôle par code HTTP ne
 * l'attrape pas ; le poids, si.
 */
const POIDS_MINIMAL = 6000;

const cache = new Map();

/* Détourage actif par défaut. `CARROUSEL_SANS_DETOURAGE=1` le coupe, pour
   comparer une série avec et sans sans toucher au code. */
const detourage = !process.env.CARROUSEL_SANS_DETOURAGE;

let travail = null;
let compteur = 0;
const dossierTravail = () =>
  (travail ??= mkdtempSync(join(tmpdir(), "jaquette-detour-")));

async function telecharger(url) {
  if (cache.has(url)) return cache.get(url);
  let resultat = null;
  try {
    const reponse = await fetch(pleineTaille(url), {
      headers: { "User-Agent": "jaquette.app carrousel" },
    });
    if (reponse.ok) {
      const buf = Buffer.from(await reponse.arrayBuffer());
      if (buf.length >= POIDS_MINIMAL) {
        resultat = { buf, type: TYPES[buf[0]] ?? "image/jpeg", ...(dimensions(buf) ?? {}) };
      }
    }
  } catch {
    /* Hôte injoignable : traité comme une absence de visuel. La planche se
       compose sans, ce qui se dégrade mieux qu'un cadre vide. */
  }
  cache.set(url, resultat);
  return resultat;
}

/** Une vignette d'editioncollector se reconnaît à son préfixe, jamais à son hôte. */
function estVignette(url) {
  return /\/vignette-[^/]*$/.test(new URL(url).pathname);
}

/**
 * Meilleur visuel d'une édition, en data URI prêt pour `background-image`.
 *
 * **Un `<img src="file://…">` reste bloqué dans Chrome sans interface** et
 * ressort en icône d'image cassée : c'est le piège du §8, rencontré en
 * fabriquant les favicons. La voie qui marche est l'image de fond CSS encodée
 * en base64, et c'est celle-ci.
 *
 * Rend `null` plutôt qu'un visuel douteux. L'appelant saute l'édition : mieux
 * vaut un carrousel de six planches nettes que de huit dont deux sont floues.
 */
export async function visuel(edition, { minLargeur = 400 } = {}) {
  const principale = edition.image_url;
  const secondaires = Array.isArray(edition.images_secondaires)
    ? edition.images_secondaires
    : [];

  /* L'ordre est le seul endroit où ce module diverge du site. Sur une vignette
     editioncollector la secondaire passe devant, elle fait 1 024 px là où la
     principale plafonne à 172 et n'a aucune version plus grande. */
  const candidats = principale && estVignette(principale)
    ? [...secondaires, principale]
    : [principale, ...secondaires].filter(Boolean);

  for (const url of candidats) {
    const fichier = await telecharger(url);
    if (!fichier) continue;
    if (fichier.largeur && fichier.largeur < minLargeur) continue;

    /* Détourage du fond blanc, quand la photo s'y prête. `detourerFichier`
       refuse de lui-même et dit pourquoi ; on garde alors l'original, qui reste
       parfaitement lisible, simplement sur son cyclo. */
    let buf = fichier.buf;
    let type = fichier.type;
    let detoure = false;
    if (detourage) {
      const r = detourerFichier(fichier.buf, dossierTravail(), `d${compteur++}`);
      if (r.buf) { buf = r.buf; type = "image/png"; detoure = true; }
      else if (process.env.CARROUSEL_VERBEUX) console.log(`  fond gardé : ${r.refus}`);
    }

    return {
      src: `data:${type};base64,${buf.toString("base64")}`,
      detoure,
      largeur: fichier.largeur ?? null,
      hauteur: fichier.hauteur ?? null,
      /* Sans en-tête lisible on ne connaît pas le rapport : le gabarit
         retombera sur le 2/3 d'une jaquette, qui est le cas courant. */
      rapport: fichier.largeur && fichier.hauteur ? fichier.largeur / fichier.hauteur : 2 / 3,
      url,
    };
  }
  return null;
}

/* ------------------------------------------------------------- présentation */

/**
 * Zones d'un `editions.region`, même règle que `zonesDe` dans `reelio-db.ts`.
 *
 * La colonne est du texte libre qui décrit parfois deux disques à la fois,
 * `4K Blu-ray: Region free 2K Blu-ray: Region B (A, C untested)`. Ce qui est
 * entre parenthèses est marqué `untested`, donc invérifié, donc écarté.
 */
export function zonesDe(region) {
  if (!region) return [];
  const affirme = region.split("(")[0];
  const lettres = [...new Set(affirme.match(/\bRegion\s+([ABC])\b/g) ?? [])]
    .map((m) => m.replace(/\bRegion\s+/, "Zone "));
  if (!lettres.length && /region\s*free/i.test(affirme)) return ["Toutes zones"];
  return lettres;
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** `2026-08-04` en « 4 août 2026 ». Découpage de la chaîne, jamais `new Date` :
 *  une date ISO nue est lue en UTC et bascule d'un jour selon le fuseau. */
export function dateFr(iso) {
  if (!iso) return null;
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return null;
  return `${j} ${MOIS[m - 1]} ${a}`;
}

/** `2026-08-04` en « 4 août », sans le millésime. */
export function jourFr(iso) {
  if (!iso) return null;
  const [, m, j] = iso.split("-").map(Number);
  return m && j ? `${j} ${MOIS[m - 1]}` : null;
}

/** Le nom du mois d'une date ISO, `août`. */
export function moisFr(iso) {
  const m = Number((iso ?? "").split("-")[1]);
  return MOIS[m - 1] ?? null;
}

/** Le dernier jour du mois d'une date ISO, en ISO. Table explicite plutôt que
 *  `new Date(a, m, 0)`, pour la même raison que ci-dessus, et parce que le
 *  piège de locale du §6 vaut aussi pour les mois. */
export function finDeMois(iso) {
  const [a, m] = iso.split("-").map(Number);
  const bissextile = (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
  const jours = [31, bissextile ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return `${a}-${String(m).padStart(2, "0")}-${jours[m - 1]}`;
}

/**
 * Titre lisible d'une édition.
 *
 * Les titres de source valent parfois `Blu-ray Coffret Digipack DVD — Coffret
 * Prestige`, c'est-à-dire du vocabulaire de boîtier et rien d'autre. Sur une
 * planche où le titre du film est déjà en tête, ce qui reste utile est le
 * qualificatif d'édition, donc on coupe la queue après le dernier tiret quand
 * la tête n'est que du format.
 *
 * Si la coupe ne laisse rien de substantiel, on garde le titre complet : c'est
 * la règle du §9, un nom redondant vaut mieux que pas de nom.
 */
const VOCABULAIRE =
  /^(blu-?ray|4k|uhd|ultra\s*hd|dvd|disc|disque|combo|coffret|digipack|digibook|mediabook|steelbook|édition|edition|limitée|limitee|collector|3d|\+|—|–|-|:|\/|\s)+$/i;

/**
 * Vrai quand un titre d'édition n'est que du vocabulaire de boîtier.
 *
 * `Blu-ray 4K Steelbook` ne dit rien que les capsules ne disent déjà, en plus
 * gros et en couleur : l'afficher en sous-titre écrit deux fois la même chose
 * sur la même planche. Ce qui mérite d'être écrit est ce qui **nomme** une
 * édition, `Coffret Édition Spéciale Fnac`, `Titans of cult`.
 */
export function estFormatSeul(titre) {
  return VOCABULAIRE.test((titre ?? "").trim());
}

export function titreEdition(edition) {
  const brut = (edition.titre ?? "").trim();
  if (!brut) return null;
  const morceaux = brut.split(/\s+[—–-]\s+/);
  if (morceaux.length > 1) {
    const queue = morceaux[morceaux.length - 1].trim();
    const tete = morceaux.slice(0, -1).join(" ").trim();
    if (VOCABULAIRE.test(tete) && queue.length >= 4) return queue;
  }
  return brut;
}

/** Le film porté par une édition, extrait de l'embed `edition_films(films(…))`. */
export function filmDe(edition) {
  return edition.edition_films?.[0]?.films ?? null;
}
