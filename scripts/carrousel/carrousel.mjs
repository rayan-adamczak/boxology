#!/usr/bin/env node
/**
 * Génère un carrousel Instagram, 1080 × 1350 par planche.
 *
 *     node scripts/carrousel/carrousel.mjs comparatif 560
 *     node scripts/carrousel/carrousel.mjs sorties
 *     node scripts/carrousel/carrousel.mjs collection "Make My Day!"
 *     node scripts/carrousel/carrousel.mjs editeur "Carlotta Films"
 *     node scripts/carrousel/carrousel.mjs faces 53959
 *
 * Sort dans `carrousels/<nom>/`, une image numérotée par planche plus la
 * légende prête à coller. **Rien n'est publié** : la mise en ligne reste un
 * geste manuel, donc une relecture. L'API Graph d'Instagram demanderait un
 * compte professionnel, une page Facebook liée et des jetons à renouveler, pour
 * automatiser trois posts par semaine ; ça se branchera quand la cadence sera
 * prouvée, pas avant.
 *
 * Rendu par Chrome sans interface, comme `scripts/og/og-jaquette.html`. Trois
 * pièges du §8 sont désamorcés ici même :
 *
 * - **pas de `--virtual-time-budget`**, il fait pendre Chrome 150 en
 *   `--headless=new`, y compris sur une page témoin ;
 * - **un profil jetable**, faute de quoi l'invocation se heurte au Chrome déjà
 *   ouvert de la machine et sort sans rien écrire ;
 * - **les visuels sont des data URI**, un `<img src="file://">` restant bloqué.
 *
 * Lecture seule côté base.
 */

import { spawn } from "node:child_process";
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

import { RACINE } from "./donnees.mjs";
import { FORMATS } from "./formats.mjs";
import {
  LARGEUR, HAUTEUR, COULEURS, NOMS_COULEURS,
  couverture, planchEdition, grille, fin,
} from "./gabarit.mjs";

const GABARITS = { couverture, edition: planchEdition, grille, fin };

/* ------------------------------------------------------------------- Chrome */

const CANDIDATS = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function trouverChrome() {
  const chemin = CANDIDATS.find((c) => existsSync(c));
  if (!chemin) {
    throw new Error(
      "Chrome introuvable. Installer Google Chrome, ou pointer la variable " +
      "CHROME sur un binaire compatible.");
  }
  return chemin;
}

/**
 * Une planche, un appel à Chrome.
 *
 * **`--screenshot` écrit son fichier puis ne rend jamais la main**, mesuré le
 * 4 août 2026 sur Chrome 150 et sur une page témoin de trois balises, donc ni
 * le gabarit ni les visuels n'y sont pour rien. C'est exactement ce que le §9
 * consigne déjà pour `--dump-dom` : le dépassement de délai est le
 * fonctionnement normal, et le traiter comme une panne jette précisément ce
 * qu'on venait chercher. Attendre la sortie du processus bloquerait pour
 * toujours.
 *
 * On surveille donc le **fichier** et non le processus : dès que sa taille ne
 * bouge plus d'un relevé à l'autre, la capture est complète et Chrome est tué.
 * Le plafond de temps n'est là que pour la vraie panne, un gabarit qui ne se
 * charge pas.
 *
 * Deux drapeaux qui ne se devinent pas :
 *
 * - **un profil jetable par planche.** Sans lui, Chrome se heurte à la fenêtre
 *   déjà ouverte de la machine ; et comme on le tue, son `SingletonLock` reste
 *   derrière et gênerait la planche suivante ;
 * - **`detached`**, pour tuer le groupe entier. Chrome essaime en processus
 *   d'aide, et abattre le seul parent en laisse tourner la moitié.
 */
const PAS_MS = 250;
const PLAFOND_MS = 60000;

function rendre(chrome, profil, html, png) {
  return new Promise((tenir, rejeter) => {
    const proc = spawn(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--user-data-dir=${profil}`,
      `--window-size=${LARGEUR},${HAUTEUR}`,
      "--default-background-color=ff101720",
      ...(process.env.CI ? ["--no-sandbox"] : []),
      `--screenshot=${png}`,
      `file://${html}`,
    ], { stdio: "ignore", detached: true });

    let dernier = -1;
    let stable = 0;
    let ecoule = 0;

    const finir = (erreur) => {
      clearInterval(tic);
      try { process.kill(-proc.pid, "SIGKILL"); } catch { proc.kill("SIGKILL"); }
      if (erreur) rejeter(erreur); else tenir();
    };

    const tic = setInterval(() => {
      ecoule += PAS_MS;
      let taille = 0;
      try { taille = statSync(png).size; } catch { /* pas encore écrit */ }

      /* Deux relevés identiques et non un seul : Chrome écrit le PNG par
         morceaux, et conclure au premier octet rendrait une image tronquée,
         ce qui ne se voit qu'une fois publiée. */
      if (taille > 2000 && taille === dernier) stable += 1;
      else stable = 0;
      dernier = taille;

      if (stable >= 2) finir(null);
      else if (ecoule >= PLAFOND_MS) {
        finir(new Error(`${png} : rien d'écrit après ${PLAFOND_MS / 1000} s`));
      }
    }, PAS_MS);

    proc.on("error", (e) => finir(e));
  });
}

/* ---------------------------------------------------------------------- CLI */

function aide() {
  const lignes = Object.entries(FORMATS).map(([nom, f]) =>
    `  ${f.usage.padEnd(30)} ${f.quoi}`);
  return [
    "Carrousels Instagram jaquette.app, 1080 × 1350.",
    "",
    "  node scripts/carrousel/carrousel.mjs <format> [argument] [options]",
    "",
    "Formats :",
    ...lignes,
    "",
    "Options :",
    "  --max N          nombre de planches de contenu (défaut : selon le format)",
    "  --sortie CHEMIN  dossier de sortie (défaut : carrousels/<nom>)",
    "  --garder-html    conserve les gabarits rendus, pour retoucher le dessin",
  ].join("\n");
}

const argv = process.argv.slice(2);
const format = argv[0];

if (!format || format === "--aide" || format === "-h") {
  console.log(aide());
  process.exit(format ? 0 : 1);
}
if (!FORMATS[format]) {
  console.error(`Format inconnu : ${format}\n\n${aide()}`);
  process.exit(1);
}

const positionnels = [];
const options = {};
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--garder-html") options.garderHtml = true;
  else if (a === "--max") options.max = Number(argv[++i]);
  else if (a === "--sortie") options.sortie = argv[++i];
  else if (a.startsWith("--")) { console.error(`Option inconnue : ${a}`); process.exit(1); }
  else positionnels.push(a);
}

/* ------------------------------------------------------------------ montage */

const t0 = Date.now();
const { nom, planches, legende } = await FORMATS[format].construire(
  positionnels.join(" ") || null,
  options,
);

/* Instagram plafonne un carrousel à vingt planches, et personne ne balaye
   jusque-là. On coupe la queue en le disant : une troncature muette se lit
   comme une couverture complète (§6). */
const PLAFOND = 12;
let gardees = planches;
if (planches.length > PLAFOND) {
  gardees = [...planches.slice(0, PLAFOND - 1), planches[planches.length - 1]];
  console.warn(
    `${planches.length} planches ramenées à ${PLAFOND} : ` +
    `${planches.length - PLAFOND} écartées, la dernière est conservée.`);
}

const dossier = resolve(RACINE, options.sortie ?? join("carrousels", nom));
mkdirSync(dossier, { recursive: true });

/* Les planches d'une passe précédente sont retirées, et pas seulement écrasées.
 * Une passe plus courte que la précédente laisserait derrière elle les numéros
 * de queue, qui se posteraient avec les autres : sur un carrousel dont le
 * dossier fait foi, une planche périmée ne se distingue en rien d'une planche
 * neuve. Défaut rencontré le 4 août 2026, quatre planches d'un rendu antérieur
 * survivant à un rendu de six. */
const restes = readdirSync(dossier).filter((f) => /^\d+\.(png|html)$/.test(f));
for (const f of restes) rmSync(join(dossier, f));
if (restes.length) console.log(`${restes.length} planche(s) d'une passe précédente retirée(s)`);

const chrome = trouverChrome();
const profil = mkdtempSync(join(tmpdir(), "jaquette-carrousel-"));
const html = options.garderHtml ? dossier : profil;

try {
  for (let i = 0; i < gardees.length; i++) {
    const descripteur = gardees[i];
    const gabarit = GABARITS[descripteur.type];
    if (!gabarit) throw new Error(`type de planche inconnu : ${descripteur.type}`);

    const accent = COULEURS[i % COULEURS.length];
    const numero = String(i + 1).padStart(2, "0");

    const cheminHtml = join(html, `${numero}.html`);
    const cheminPng = join(dossier, `${numero}.png`);
    rmSync(cheminPng, { force: true });
    writeFileSync(cheminHtml, gabarit({ ...descripteur, index: i, total: gardees.length, accent }));
    await rendre(chrome, join(profil, numero), cheminHtml, cheminPng);

    const poids = Math.round(statSync(cheminPng).size / 1024);
    /* Le détourage est annoncé planche par planche : c'est une heuristique, elle
       se trompe sur un visuel de temps en temps, et l'aperçu est l'endroit où on
       le voit. Le taire ferait chercher longtemps d'où vient une bavure. */
    console.log(
      `  ${numero}  ${descripteur.type.padEnd(11)} ` +
      `${NOMS_COULEURS[i % 3].padEnd(6)} ${String(poids).padStart(4)} Ko` +
      `${descripteur.visuel?.detoure ? "  détouré" : ""}`);
  }

  /* La légende part dans un fichier plutôt qu'à l'écran : elle porte des sauts
     de ligne, et un terminal les rend fidèlement mais un copier-coller depuis
     un terminal les mange une fois sur deux. */
  writeFileSync(join(dossier, "legende.txt"), `${legende}\n`);
} finally {
  rmSync(profil, { recursive: true, force: true });
}

console.log(
  `\n${gardees.length} planches dans ${dossier}` +
  `\nlégende dans ${join(dossier, "legende.txt")}` +
  `\n${((Date.now() - t0) / 1000).toFixed(1)} s`);
