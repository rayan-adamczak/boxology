/**
 * Lire un fichier de collection déposé par le visiteur.
 *
 * **Pourquoi ça existe.** Le relevé du 2 août 2026 (§8) met le remplissage
 * initial au cœur de l'adoption : personne ne saisit huit cents titres à la
 * main, et ces gens ont déjà leur liste ailleurs. Letterboxd a un export
 * officiel en libre-service, et les outils tiers de SensCritique produisent tous
 * un CSV.
 *
 * **On ne récupère jamais le site de Letterboxd.** Leur `robots.txt` met
 * `ClaudeBot`, `GPTBot`, `CCBot` et une vingtaine d'autres en `Disallow: /` :
 * c'est une politique déclarée au sens du §5, donc on la respecte, et il n'y a
 * de toute façon rien à y chercher puisque *Settings → Data → Export your data*
 * rend le ZIP complet.
 *
 * **Aucune dépendance ajoutée.** Le §8 a retiré quatorze dépendances directes le
 * 4 août 2026 ; on n'en rajoute pas une pour lire un CSV ni pour ouvrir un ZIP,
 * `DecompressionStream` étant dans tous les navigateurs qui nous intéressent.
 */

/** Une ligne du fichier, réduite à ce qui sert à apparier. */
export interface EntreeImportee {
  titre: string;
  /** Publié par SensCritique sur les films étrangers, jamais par Letterboxd. */
  titreOriginal?: string;
  annee?: number;
  /**
   * Ce que la personne a écrit elle-même à côté du titre. L'`annotation` d'une
   * liste SensCritique vaut souvent « Blu-ray » ou « Coffret blu-ray steelbook »,
   * c'est-à-dire le format, donné à la main et gratuitement.
   */
  note?: string;
}

/** Un CSV lu, prêt à être proposé à l'import. */
export interface FichierLu {
  /** Nom du fichier, celui du dépôt ou celui de l'entrée dans le ZIP. */
  nom: string;
  entrees: EntreeImportee[];
  /** En-têtes reconnus, affichés pour que le visiteur vérifie d'un coup d'œil. */
  colonneTitre: string;
  colonneAnnee: string | null;
  /** Lignes ignorées faute de titre exploitable. */
  ignorees: number;
}

/* ------------------------------------------------------------------ CSV -- */

/**
 * Le séparateur se devine, il ne se suppose pas.
 *
 * Letterboxd écrit des virgules, un export français passé par Excel écrit des
 * points-virgules (c'est ce que produit notre propre export, cf.
 * `export-collection.ts`), et certains outils écrivent des tabulations. Compté
 * hors guillemets sur la seule ligne d'en-tête : un titre contenant une virgule
 * fausserait le compte s'il entrait dans la mesure.
 */
function separateur(entete: string): string {
  let meilleur = ",";
  let max = -1;
  for (const candidat of [",", ";", "\t"]) {
    let n = 0;
    let dansGuillemets = false;
    for (const c of entete) {
      if (c === '"') dansGuillemets = !dansGuillemets;
      else if (c === candidat && !dansGuillemets) n++;
    }
    if (n > max) {
      max = n;
      meilleur = candidat;
    }
  }
  return meilleur;
}

/**
 * Découpe un CSV en tableau de lignes de champs.
 *
 * Guillemets doublés, sauts de ligne à l'intérieur d'un champ, `\r\n` comme
 * `\n` : c'est le format que produit n'importe quel tableur, et celui que notre
 * propre export écrit.
 */
function decouper(texte: string, sep: string): string[][] {
  const lignes: string[][] = [];
  let champs: string[] = [];
  let courant = "";
  let dansGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];

    if (dansGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          courant += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += c;
      }
      continue;
    }

    if (c === '"') {
      dansGuillemets = true;
    } else if (c === sep) {
      champs.push(courant);
      courant = "";
    } else if (c === "\n") {
      champs.push(courant);
      lignes.push(champs);
      champs = [];
      courant = "";
    } else if (c !== "\r") {
      courant += c;
    }
  }

  if (courant !== "" || champs.length > 0) {
    champs.push(courant);
    lignes.push(champs);
  }
  return lignes;
}

/** Replie un en-tête pour le reconnaître : minuscules, sans accent ni ponctuation. */
function cle(entete: string): string {
  return entete
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * On renifle l'en-tête au lieu de figer un format.
 *
 * Letterboxd écrit `Name`, notre propre export écrit `film`, SensBoxd écrit
 * `Title`, une extension française écrira `Titre`. Une branche par outil aurait
 * dérivé au premier outil de plus ; la liste de synonymes se relit d'un coup
 * d'œil et n'a qu'un endroit où grandir.
 */
const TITRE = ["name", "title", "titre", "nom", "film", "movie", "oeuvre"];
const ANNEE = ["year", "annee", "release year", "annee de sortie", "annee de production"];
const ORIGINAL = ["original title", "originaltitle", "titre original"];
const NOTE = ["note", "annotation", "commentaire", "tags", "description", "edition", "support", "format"];

function trouver(entetes: string[], synonymes: string[]): number {
  for (const s of synonymes) {
    const i = entetes.indexOf(s);
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Une année se lit dans une colonne « Year », mais aussi dans une date.
 *
 * On borne à quatre chiffres entre 1880 et l'an prochain : le §9 garde la trace
 * d'une extraction qui datait un disque sur deux de 1920 en lisant le `1920` de
 * `1920x1080`. Ici la colonne est déclarée, le risque est moindre, mais la
 * borne ne coûte rien.
 */
function annee(valeur: string): number | undefined {
  const m = valeur.match(/\b(1[89]\d{2}|20\d{2})\b/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const plafond = new Date().getFullYear() + 2;
  return n >= 1880 && n <= plafond ? n : undefined;
}

/**
 * Lit un CSV et en tire des entrées appariables.
 *
 * Rend `null` si aucune colonne de titre n'est reconnue : c'est un refus franc,
 * pas un fichier vide. Le §9 pose qu'une lecture qui échoue doit s'interrompre
 * plutôt que rendre du vide, et un « 0 titre trouvé » se lit comme une liste
 * vide alors que c'est un en-tête qu'on n'a pas su lire.
 */
export function lireCsv(nom: string, texte: string): FichierLu | null {
  // Le BOM UTF-8 est écrit par notre propre export et réécrit par Excel : sans
  // ce retrait, la première colonne s'appellerait « ﻿Name ».
  const propre = texte.replace(/^\ufeff/, "");
  const premiere = propre.split("\n", 1)[0] ?? "";
  const lignes = decouper(propre, separateur(premiere));
  if (lignes.length < 2) return null;

  const entetes = lignes[0].map(cle);
  const iTitre = trouver(entetes, TITRE);
  if (iTitre === -1) return null;

  const iAnnee = trouver(entetes, ANNEE);
  const iOriginal = trouver(entetes, ORIGINAL);
  const iNote = trouver(entetes, NOTE);

  const entrees: EntreeImportee[] = [];
  let ignorees = 0;

  for (const ligne of lignes.slice(1)) {
    const titre = (ligne[iTitre] ?? "").trim();
    if (!titre) {
      // Une ligne sans titre est une ligne vide de fin de fichier ou un
      // séparateur : elle ne se signale pas comme une erreur, on la compte.
      ignorees++;
      continue;
    }
    const e: EntreeImportee = { titre };
    if (iAnnee !== -1) {
      const a = annee(ligne[iAnnee] ?? "");
      if (a) e.annee = a;
    }
    if (iOriginal !== -1) {
      const o = (ligne[iOriginal] ?? "").trim();
      if (o && o !== titre) e.titreOriginal = o;
    }
    if (iNote !== -1) {
      const n = (ligne[iNote] ?? "").trim();
      if (n) e.note = n;
    }
    entrees.push(e);
  }

  return {
    nom,
    entrees,
    colonneTitre: lignes[0][iTitre] ?? "",
    colonneAnnee: iAnnee === -1 ? null : (lignes[0][iAnnee] ?? ""),
    ignorees,
  };
}

/* ------------------------------------------------------------------ ZIP -- */

/**
 * Ouvre un ZIP sans bibliothèque.
 *
 * L'export Letterboxd est une archive : demander au visiteur de la dézipper
 * puis de retrouver `watchlist.csv` dedans, c'est trois gestes de plus et une
 * occasion de se tromper de fichier.
 *
 * `DecompressionStream('deflate-raw')` fait tout le travail de décompression ;
 * il ne reste qu'à lire le répertoire central, une centaine de lignes. Ajouter
 * une dépendance pour ça irait contre le §8, qui en a retiré quatorze le 4 août
 * 2026.
 */
async function inflater(donnees: Uint8Array): Promise<Uint8Array> {
  const flux = new Blob([donnees as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(flux).arrayBuffer());
}

/** Un fichier trouvé dans l'archive. */
interface EntreeZip {
  nom: string;
  /** 0 = stocké tel quel, 8 = deflate. Les autres ne sont pas produits par les
   *  outils d'export, on les ignore plutôt que d'échouer sur toute l'archive. */
  methode: number;
  debut: number;
  taille: number;
}

/**
 * Lit le répertoire central, seul endroit qui donne les noms sans deviner.
 *
 * On part de la fin : la signature `PK\x05\x06` du *end of central directory*
 * est dans les 64 derniers kilo-octets, commentaire compris.
 */
function repertoire(vue: DataView): EntreeZip[] | null {
  const fin = vue.byteLength;
  let eocd = -1;
  for (let i = fin - 22; i >= Math.max(0, fin - 65558); i--) {
    if (vue.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;

  const nb = vue.getUint16(eocd + 10, true);
  let p = vue.getUint32(eocd + 16, true);
  const entrees: EntreeZip[] = [];

  for (let k = 0; k < nb; k++) {
    if (vue.getUint32(p, true) !== 0x02014b50) return null;
    const methode = vue.getUint16(p + 10, true);
    const taille = vue.getUint32(p + 20, true);
    const lNom = vue.getUint16(p + 28, true);
    const lExtra = vue.getUint16(p + 30, true);
    const lComm = vue.getUint16(p + 32, true);
    const decalage = vue.getUint32(p + 42, true);

    const octets = new Uint8Array(vue.buffer, vue.byteOffset + p + 46, lNom);
    const nom = new TextDecoder().decode(octets);

    // L'en-tête local redit les longueurs de nom et d'extra, et elles diffèrent
    // parfois de celles du répertoire central : c'est lui qui donne le vrai
    // début des données, jamais le décalage seul.
    const lNomLocal = vue.getUint16(decalage + 26, true);
    const lExtraLocal = vue.getUint16(decalage + 28, true);
    entrees.push({
      nom,
      methode,
      debut: decalage + 30 + lNomLocal + lExtraLocal,
      taille,
    });

    p += 46 + lNom + lExtra + lComm;
  }
  return entrees;
}

/**
 * Tous les CSV d'une archive, lus et appariables.
 *
 * Rend une liste vide si l'archive n'en porte aucun ; rend `null` si ce n'est
 * pas un ZIP lisible, pour que l'écran distingue « archive vide » de « fichier
 * illisible ».
 */
export async function lireZip(fichier: File): Promise<FichierLu[] | null> {
  const tampon = await fichier.arrayBuffer();
  const vue = new DataView(tampon);
  const entrees = repertoire(vue);
  if (!entrees) return null;

  const lus: FichierLu[] = [];
  for (const e of entrees) {
    if (!e.nom.toLowerCase().endsWith(".csv")) continue;
    if (e.methode !== 0 && e.methode !== 8) continue;

    const brut = new Uint8Array(tampon, e.debut, e.taille);
    try {
      const octets = e.methode === 8 ? await inflater(brut) : brut;
      const lu = lireCsv(e.nom, new TextDecoder().decode(octets));
      if (lu && lu.entrees.length > 0) lus.push(lu);
    } catch {
      // Une entrée abîmée ne condamne pas l'archive : le §9 garde la trace de
      // douze pages gzip cassées sur trois mille qui avaient fait tomber une
      // passe entière. On garde ce qui se lit.
    }
  }
  return lus;
}

/* ------------------------------------------------------- ce que c'est --- */

/** Ce qu'un fichier Letterboxd contient, pour ne pas confondre vu et possédé. */
export type NatureFichier = "envies" | "vus" | "liste";

/**
 * Devine ce que porte un fichier d'export Letterboxd, d'après son nom.
 *
 * **« Vu » n'est pas « possédé », et c'est la distinction qui fonde le site.**
 * `watched.csv`, `ratings.csv` et `diary.csv` sont un journal de visionnage :
 * les proposer comme collection ferait entrer huit cents films que la personne
 * ne possède pas. Ils restent proposés, nommés pour ce qu'ils sont, et jamais
 * cochés d'avance.
 */
export function natureDe(nom: string): NatureFichier {
  const n = nom.toLowerCase().split("/").pop() ?? "";
  if (n.startsWith("watchlist")) return "envies";
  if (n.startsWith("watched") || n.startsWith("ratings") || n.startsWith("diary")) {
    return "vus";
  }
  return "liste";
}

/** Libellé affiché pour un fichier reconnu. */
export const LIBELLE_NATURE: Record<NatureFichier, string> = {
  envies: "Votre liste d’envies",
  vus: "Films vus, ce n’est pas ce que vous possédez",
  liste: "Une de vos listes",
};
