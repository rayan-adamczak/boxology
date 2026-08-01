/**
 * Génère `src/app/lib/regroupements.ts` depuis la base.
 *
 * Les pages de regroupement (`/formats/steelbook`, `/editeurs/carlotta-films`,
 * `/genres/horreur`) ont besoin d'une table slug vers libellé. Elle est
 * **générée puis commitée**, pas calculée à l'exécution, pour trois raisons :
 *
 *   - un slug d'URL doit être stable ; le recalculer à chaque rendu le ferait
 *     bouger au gré des données ;
 *   - la page d'index n'a alors aucune requête à faire avant de s'afficher ;
 *   - PostgREST ne sait pas rendre un `distinct` sans vue dédiée, et compter
 *     les valeurs d'un tableau demanderait un `unnest` côté serveur.
 *
 * Contrepartie : la table se périme. Un éditeur qui arrive au catalogue n'a pas
 * de page tant que ce script n'a pas tourné. C'est voulu et visible, plutôt
 * qu'une page qui apparaîtrait toute seule sans que personne l'ait relue.
 *
 *     node scripts/generer-regroupements.mjs
 *
 * Lecture seule, via la clé anon publique.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Seuil d'existence d'une page.
 *
 * En dessous, la page serait une liste de trois lignes, c'est-à-dire du contenu
 * mince, exactement ce qui a fait écarter les pages éditions (cf. §7). Le seuil
 * écarte au passage le bruit de saisie : `4K Ultra HD` à 6 lignes est un
 * doublon de `Blu-ray 4K`, il disparaît sans qu'on ait à le lister à la main.
 */
const SEUIL = 10;

const info = readFileSync(resolve(RACINE, "utils/supabase/info.tsx"), "utf8");
const projectId = info.match(/projectId = "([^"]+)"/)?.[1];
const anonKey = info.match(/publicAnonKey = "([^"]+)"/)?.[1];
if (!projectId || !anonKey) throw new Error("utils/supabase/info.tsx illisible");

const API = `https://${projectId}.supabase.co/rest/v1`;
const entetes = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

/** PostgREST plafonne à 1 000 lignes. Paginer, toujours, et ordonner. */
async function lireTout(table, colonnes) {
  const lignes = [];
  for (let debut = 0; ; debut += 1000) {
    const url = `${API}/${table}?select=${colonnes}&order=id.asc&offset=${debut}&limit=1000`;
    const reponse = await fetch(url, { headers: entetes });
    if (!reponse.ok) throw new Error(`${table} : HTTP ${reponse.status} ${await reponse.text()}`);
    const lot = await reponse.json();
    lignes.push(...lot);
    if (lot.length < 1000) return lignes;
  }
}

/**
 * Slug d'URL, mêmes règles que `public.slug_titre` en base.
 *
 * Les pièges du §9 s'appliquent : `Fox Pathe Europa` et `Disney / Buena Vista`
 * passent, mais un éditeur accentué comme `Éléphant Films` doit se replier, et
 * l'apostrophe typographique doit séparer comme la droite.
 */
function slugifier(source) {
  return String(source ?? "")
    .replace(/œ/g, "oe").replace(/Œ/g, "OE")
    .replace(/æ/g, "ae").replace(/Æ/g, "AE")
    .replace(/ß/g, "ss")
    // Décompose les accents puis retire les diacritiques : équivalent du
    // `translate` de la migration, sans avoir à énumérer les paires.
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/¹/g, "1").replace(/²/g, "2").replace(/³/g, "3")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Compte les occurrences d'une valeur, tableaux dépliés. */
function compter(lignes, champ) {
  const compte = new Map();
  for (const ligne of lignes) {
    const brut = ligne[champ];
    if (brut === null || brut === undefined) continue;
    for (const valeur of Array.isArray(brut) ? brut : [brut]) {
      const propre = String(valeur).trim();
      if (!propre) continue;
      compte.set(propre, (compte.get(propre) ?? 0) + 1);
    }
  }
  return compte;
}

/** Table triée par effectif décroissant, valeurs sous le seuil écartées. */
function table(compte, axe) {
  const vus = new Map();
  for (const [libelle, n] of [...compte].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    if (n < SEUIL) continue;
    const slug = slugifier(libelle);
    if (!slug) {
      console.warn(`${axe} : « ${libelle} » ne produit aucun slug, écarté`);
      continue;
    }
    // Deux libellés distincts peuvent se replier sur le même slug. Le premier
    // gagne, c'est-à-dire le plus fourni ; l'autre est signalé, pas avalé en
    // silence.
    if (vus.has(slug)) {
      console.warn(`${axe} : « ${libelle} » entre en collision avec « ${vus.get(slug).libelle} »`);
      continue;
    }
    vus.set(slug, { slug, libelle, compte: n });
  }
  return [...vus.values()];
}

const editions = await lireTout("editions", "id,editeur,formats_extraits");
const films = await lireTout("films", "id,genres");

const formats = table(compter(editions, "formats_extraits"), "format");
const editeurs = table(compter(editions, "editeur"), "editeur");
const genres = table(compter(films, "genres"), "genre");

if (formats.length === 0 || genres.length === 0) {
  throw new Error("aucun format ou genre au-dessus du seuil, table non générée");
}

const rendre = (liste) =>
  liste
    .map((e) => `  { slug: ${JSON.stringify(e.slug)}, libelle: ${JSON.stringify(e.libelle)}, compte: ${e.compte} },`)
    .join("\n");

const sortie = `/* GÉNÉRÉ PAR scripts/generer-regroupements.mjs, NE PAS ÉDITER À LA MAIN. */

/**
 * Tables des pages de regroupement.
 *
 * Un slug d'URL doit être stable, donc il est figé ici plutôt que recalculé au
 * rendu. Relancer le script quand le catalogue a bougé :
 *
 *     node scripts/generer-regroupements.mjs
 *
 * \`compte\` est un instantané de génération, pas une vérité courante : la page
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

/** \`formats_extraits\` des éditions. */
export const FORMATS: Regroupement[] = [
${rendre(formats)}
];

/** \`editeur\` des éditions, source blu-ray.com. */
export const EDITEURS: Regroupement[] = [
${rendre(editeurs)}
];

/** \`genres\` des films, source TMDB. */
export const GENRES: Regroupement[] = [
${rendre(genres)}
];

/**
 * La clé est le premier segment de l'URL, \`base\` en est la forme complète : les
 * deux doivent rester en accord, \`axeDeChemin\` du middleware fait correspondre
 * le segment à la clé.
 *
 * Les adresses sont en anglais depuis le 1er août 2026, les libellés restent en
 * français : c'est l'URL qui change, pas la langue du site. \`formats\` et
 * \`genres\` ne bougent pas, les mots sont les mêmes dans les deux langues.
 */
export const AXES = {
  formats: { titre: "Formats", tables: FORMATS, base: "/formats" },
  publishers: { titre: "Éditeurs", tables: EDITEURS, base: "/publishers" },
  genres: { titre: "Genres", tables: GENRES, base: "/genres" },
} as const;

export type NomAxe = keyof typeof AXES;

/** Retrouve une entrée par son slug, ou null. */
export function trouver(axe: NomAxe, slug: string): Regroupement | null {
  return AXES[axe].tables.find((e) => e.slug === slug) ?? null;
}
`;

writeFileSync(resolve(RACINE, "src/app/lib/regroupements.ts"), sortie);
console.log(
  `regroupements.ts : ${formats.length} formats, ${editeurs.length} éditeurs, ` +
    `${genres.length} genres, soit ${formats.length + editeurs.length + genres.length} pages`,
);
