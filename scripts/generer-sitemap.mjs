/**
 * Génère dist/sitemap.xml après le build.
 *
 * Sans sitemap, un moteur ne découvre les fiches films qu'en suivant les liens
 * depuis l'accueil, qui n'en affiche que 50 à la fois : l'essentiel du
 * catalogue resterait invisible.
 *
 * Seuls les films rattachés à au moins une édition sont listés. Une fiche sans
 * édition n'apporte rien qu'un moteur ne trouve déjà sur TMDB, et faire indexer
 * des centaines de pages vides dessert le reste du site.
 *
 * Lancé par `npm run build`. Lecture seule, via la clé anon publique.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINE = "https://jaquette.app";

/** PostgREST plafonne une réponse à 1 000 lignes : il faut paginer, toujours. */
const PAGE = 1000;

const info = readFileSync(resolve(RACINE, "utils/supabase/info.tsx"), "utf8");
const projectId = info.match(/projectId = "([^"]+)"/)?.[1];
const anonKey = info.match(/publicAnonKey = "([^"]+)"/)?.[1];

if (!projectId || !anonKey) {
  throw new Error("utils/supabase/info.tsx : projectId ou publicAnonKey introuvable");
}

const API = `https://${projectId}.supabase.co/rest/v1`;
const entetes = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

/** Récupère toutes les lignes d'une table en suivant la pagination. */
async function lireTout(table, colonnes) {
  const lignes = [];
  for (let debut = 0; ; debut += PAGE) {
    const url = `${API}/${table}?select=${colonnes}&order=${colonnes.split(",")[0]}.asc` +
      `&offset=${debut}&limit=${PAGE}`;
    const reponse = await fetch(url, { headers: entetes });
    if (!reponse.ok) {
      throw new Error(`${table} : HTTP ${reponse.status} ${await reponse.text()}`);
    }
    const lot = await reponse.json();
    lignes.push(...lot);
    if (lot.length < PAGE) return lignes;
  }
}

function urlXml(chemin, priorite) {
  return `  <url>\n    <loc>${ORIGINE}${chemin}</loc>\n` +
    `    <priority>${priorite}</priority>\n  </url>`;
}

const liens = await lireTout("edition_films", "film_id");
const filmIds = [...new Set(liens.map((l) => l.film_id))].sort((a, b) => a - b);

// Un scan qui renvoie « rien » ressemble à un scan négatif : mieux vaut casser
// le build que publier un sitemap vide qui désindexerait le catalogue.
if (filmIds.length === 0) {
  throw new Error("aucun film rattaché à une édition — sitemap non généré");
}

const pages = [
  urlXml("/", "1.0"),
  urlXml("/a-propos", "0.5"),
  urlXml("/mentions-legales", "0.3"),
  urlXml("/confidentialite", "0.3"),
  ...filmIds.map((id) => urlXml(`/films/${id}`, "0.8")),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${pages.join("\n")}\n</urlset>\n`;

writeFileSync(resolve(RACINE, "dist/sitemap.xml"), xml);
console.log(`sitemap.xml : ${pages.length} URL (${filmIds.length} fiches films)`);
