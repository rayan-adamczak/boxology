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

/* Le sitemap doit annoncer l'adresse canonique, `/films/<slug>/<id>`. Y mettre
   la forme nue ferait rediriger en 301 chacune des 3 349 URL soumises : ça
   marche, mais ça gaspille le budget de crawl et Google note l'écart entre
   l'URL déclarée et celle qu'il finit par indexer.

   Si la colonne manque, ce script échoue et casse le build. C'est voulu, et
   c'est le bon sens de la panne : `reelio-db.ts` demande `slug` dans ses
   jointures, donc déployé avant la migration, le site rendrait une erreur
   PostgREST sur le rail de l'accueil et sur la fiche film. Mieux vaut un
   déploiement qui ne part pas qu'un déploiement qui casse la consultation. */
let films;
try {
  films = await lireTout("films", "id,slug");
} catch (erreur) {
  throw new Error(
    "films.slug introuvable : appliquer supabase/migrations/20260731_films_slug.sql " +
      `avant de déployer (${erreur.message})`,
  );
}
const slugParId = new Map(films.map((f) => [f.id, f.slug]));

/* Adresses en anglais depuis le 1er août 2026. Le sitemap ne doit annoncer que
   la forme neuve : y laisser `/films/` ferait rediriger en 301 chacune des
   4 581 URL soumises, ce qui marche mais gaspille le budget de crawl. */
const BASE_FILMS = "/movies";

function cheminFilm(id) {
  const slug = slugParId.get(id);
  return slug ? `${BASE_FILMS}/${slug}/${id}` : `${BASE_FILMS}/${id}`;
}

const sansSlug = filmIds.filter((id) => !slugParId.get(id)).length;
if (sansSlug > 0) {
  console.warn(`sitemap.xml : ${sansSlug} film(s) sans slug, adresse nue employée`);
}

// Un scan qui renvoie « rien » ressemble à un scan négatif : mieux vaut casser
// le build que publier un sitemap vide qui désindexerait le catalogue.
if (filmIds.length === 0) {
  throw new Error("aucun film rattaché à une édition — sitemap non généré");
}

/* Pages de regroupement, lues dans la table générée plutôt que recalculées :
   `src/app/lib/regroupements.ts` est la seule source des slugs, et le sitemap
   ne doit pas pouvoir en inventer un que l'application ne servirait pas. */
const tables = readFileSync(resolve(RACINE, "src/app/lib/regroupements.ts"), "utf8");

function slugsDe(nomTable) {
  const bloc = tables.match(new RegExp(`export const ${nomTable}[^=]*= \\[([^\\]]*)\\]`, "s"));
  if (!bloc) throw new Error(`regroupements.ts : table ${nomTable} introuvable`);
  return [...bloc[1].matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
}

const regroupements = [
  ["/formats", slugsDe("FORMATS")],
  ["/publishers", slugsDe("EDITEURS")],
  ["/genres", slugsDe("GENRES")],
];

/* Les libellés, pour reconstruire le filtre PostgREST qui donne l'effectif.
   Ils sont dans la même table que les slugs, dans le même ordre. */
function libellesDe(nomTable) {
  const bloc = tables.match(new RegExp(`export const ${nomTable}[^=]*= \\[([^\\]]*)\\]`, "s"));
  return [...bloc[1].matchAll(/libelle: "((?:[^"\\\\]|\\\\.)*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"'),
  );
}

/** Pagination : 60 par page, comme `src/app/lib/pagination.ts`. */
const PAR_PAGE = 60;

/**
 * Effectif d'un regroupement, lu dans l'en-tête `content-range`.
 *
 * On ne se fie pas au `compte` de la table générée : pour les genres il compte
 * tous les films, alors que la page n'affiche que ceux qui ont une édition.
 * Sur *Horreur* l'écart est de 570 contre 559, soit une page de trop annoncée
 * au sitemap, donc un 404 promis à Google.
 */
async function effectif(axe, libelle) {
  const filtre = encodeURIComponent(`{"${libelle.replace(/"/g, '\\"')}"}`);
  const url =
    axe === "genres"
      ? `${API}/films?genres=cs.${filtre}&select=id,edition_films!inner(edition_id)`
      : axe === "formats"
      ? `${API}/editions?formats_extraits=cs.${filtre}&select=id`
      : axe === "collections"
      ? `${API}/editions?collection_editeur=eq.${encodeURIComponent(libelle)}&select=id`
      : `${API}/editions?editeur=eq.${encodeURIComponent(libelle)}&select=id`;
  const reponse = await fetch(url, {
    headers: { ...entetes, Prefer: "count=exact", Range: "0-0" },
  });
  if (!reponse.ok) throw new Error(`${axe}/${libelle} : HTTP ${reponse.status}`);
  return Number((reponse.headers.get("content-range") ?? "").split("/")[1]) || 0;
}

const AXES_SITEMAP = [
  ["formats", "/formats", slugsDe("FORMATS"), libellesDe("FORMATS")],
  ["editeurs", "/publishers", slugsDe("EDITEURS"), libellesDe("EDITEURS")],
  ["genres", "/genres", slugsDe("GENRES"), libellesDe("GENRES")],
  ["collections", "/collections", slugsDe("COLLECTIONS"), libellesDe("COLLECTIONS")],
];

const urlsRegroupements = [];
let pagesSuivantes = 0;
for (const [axe, base, slugs, libelles] of AXES_SITEMAP) {
  urlsRegroupements.push(urlXml(base, "0.6"));
  for (let i = 0; i < slugs.length; i++) {
    urlsRegroupements.push(urlXml(`${base}/${slugs[i]}`, "0.6"));
    const pages = Math.max(1, Math.ceil((await effectif(axe, libelles[i])) / PAR_PAGE));
    for (let n = 2; n <= pages; n++) {
      // Priorité plus basse : une page 47 vaut moins que la première, et
      // l'annoncer autrement serait mentir sur ce qu'on en pense.
      urlsRegroupements.push(urlXml(`${base}/${slugs[i]}/${n}`, "0.4"));
      pagesSuivantes++;
    }
  }
}

const pages = [
  urlXml("/", "1.0"),
  urlXml("/welcome", "0.7"),
  urlXml("/about", "0.5"),
  urlXml("/legal", "0.3"),
  urlXml("/privacy", "0.3"),
  ...urlsRegroupements,
  ...filmIds.map((id) => urlXml(cheminFilm(id), "0.8")),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${pages.join("\n")}\n</urlset>\n`;

writeFileSync(resolve(RACINE, "dist/sitemap.xml"), xml);
console.log(
  `sitemap.xml : ${pages.length} URL (${filmIds.length} fiches films, ` +
    `${urlsRegroupements.length} pages de regroupement dont ${pagesSuivantes} paginées)`,
);
