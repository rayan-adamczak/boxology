#!/usr/bin/env node
/**
 * Aperçu d'un carrousel dans un gabarit de fil mobile, avant publication.
 *
 *     node scripts/carrousel/apercu.mjs comparatif-the-batman-2022
 *
 * Écrit `apercu.html` dans le dossier du carrousel, autonome, à ouvrir dans un
 * navigateur. Il répond aux trois questions qu'une planche isolée ne répond
 * pas : est-ce que la première tient à la taille d'un fil, est-ce que le titre
 * reste lisible une fois réduit à 390 px, et est-ce que la série se lit comme
 * une série quand on balaye.
 *
 * **C'est un gabarit de fil, pas une reproduction d'Instagram.** Le
 * chrome est générique et porte le mot-symbole de jaquette.app : ce qu'on
 * vérifie ici est le cadrage et la lisibilité, et le logotype d'un tiers n'y
 * ajouterait rien.
 *
 * Les planches sont réduites à 440 px et passées en JPEG par `sips`, livré avec
 * macOS. En pleine taille les huit pèsent 4,8 Mo, soit 6,5 Mo une fois encodées
 * en base64 dans la page : un fichier qu'aucun navigateur n'ouvre avec plaisir.
 * À 440 px on tombe sous 250 Ko, et c'est de toute façon la largeur à laquelle
 * un fil affiche une image, donc l'aperçu est plus juste ainsi que trop net.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { tmpdir } from "node:os";

import { RACINE } from "./donnees.mjs";

const LARGEUR_APERCU = 440;
const QUALITE = 68;

const LOGO = readFileSync(resolve(RACINE, "public/logo.svg"), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();

function echapper(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const argument = process.argv[2];
if (!argument) {
  console.error("Usage : node scripts/carrousel/apercu.mjs <dossier de carrousel>");
  process.exit(1);
}

const dossier = existsSync(argument)
  ? resolve(argument)
  : resolve(RACINE, "carrousels", argument);
if (!existsSync(dossier)) {
  console.error(`Dossier introuvable : ${dossier}`);
  process.exit(1);
}

const planches = readdirSync(dossier).filter((f) => /^\d+\.png$/.test(f)).sort();
if (!planches.length) {
  console.error(`Aucune planche dans ${dossier}`);
  process.exit(1);
}

/* `sips` est propre à macOS. Ailleurs on embarque les PNG tels quels plutôt que
   de refuser de produire l'aperçu : la page pèse lourd, elle s'ouvre quand
   même, et le défaut se dit à l'écran plutôt que de se taire. */
let sipsDispo = true;
try { execFileSync("sips", ["--version"], { stdio: "ignore" }); } catch { sipsDispo = false; }
if (!sipsDispo) console.warn("sips absent : planches embarquées en pleine taille");

const travail = mkdtempSync(join(tmpdir(), "jaquette-apercu-"));
const images = [];
try {
  for (const nom of planches) {
    const source = join(dossier, nom);
    if (!sipsDispo) {
      images.push(`data:image/png;base64,${readFileSync(source).toString("base64")}`);
      continue;
    }
    const sortie = join(travail, `${nom}.jpg`);
    execFileSync("sips", [
      "-Z", String(LARGEUR_APERCU),
      "--setProperty", "format", "jpeg",
      "--setProperty", "formatOptions", String(QUALITE),
      source, "--out", sortie,
    ], { stdio: "ignore" });
    images.push(`data:image/jpeg;base64,${readFileSync(sortie).toString("base64")}`);
  }
} finally {
  rmSync(travail, { recursive: true, force: true });
}

const cheminLegende = join(dossier, "legende.txt");
const legende = existsSync(cheminLegende) ? readFileSync(cheminLegende, "utf8").trim() : "";

/* Les mots-dièse passent en bleu comme dans un vrai fil : ils occupent quatre
   lignes sur huit, et les laisser en gris fait croire que la légende est plus
   courte qu'elle ne l'est. */
const legendeHtml = echapper(legende)
  .replace(/#([\p{L}\p{N}_]+)/gu, '<span class="tag">#$1</span>')
  .replace(/\n/g, "<br />");

const titre = `Aperçu ${basename(dossier)}`;

const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${echapper(titre)}</title>
<style>
  :root {
    --fond: #0b0f14; --tel: #000; --texte: #f2f2f2; --gris: #9aa0a6;
    --filet: #262b31; --lien: #4a9df8;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background:
      radial-gradient(900px 600px at 50% -10%, #16202c 0%, rgba(11,15,20,0) 70%),
      var(--fond);
    color: var(--texte);
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; gap: 22px; padding: 40px 16px 60px;
  }
  .titre-page { font-size: 15px; color: var(--gris); letter-spacing: .02em; text-align: center; }
  .titre-page b { color: var(--texte); font-weight: 600; }

  /* Cadre de téléphone. Aucune image de châssis : un contour et un rayon
     suffisent à dire « mobile », et une photo de coque daterait la maquette. */
  .tel {
    width: 390px; background: var(--tel); border-radius: 42px;
    border: 1px solid #2a2f36; overflow: hidden;
    box-shadow: 0 40px 90px rgba(0,0,0,.6), 0 0 0 10px #14181d;
  }
  .encoche { height: 34px; display: flex; align-items: center; justify-content: center; }
  .encoche i { width: 108px; height: 26px; background: #000; border-radius: 999px;
               box-shadow: inset 0 0 0 1px #1a1d21; }

  .barre-appli {
    height: 46px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; border-bottom: 1px solid var(--filet);
  }
  .marque { display: flex; align-items: center; gap: 8px; }
  .marque svg { height: 17px; width: auto; display: block; }
  .marque span { font-size: 16px; font-weight: 700; letter-spacing: -.02em; }
  .barre-appli .apercu-etiquette {
    font-size: 10px; text-transform: uppercase; letter-spacing: .12em;
    color: var(--gris); border: 1px solid var(--filet); border-radius: 999px;
    padding: 3px 8px;
  }

  .entete-post { display: flex; align-items: center; gap: 10px; padding: 11px 14px; }
  .avatar {
    width: 34px; height: 34px; border-radius: 50%; flex: none;
    background: linear-gradient(155deg, #1b232f, #10161d);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 1.5px #2b3340;
  }
  .avatar svg { height: 15px; width: auto; display: block; }
  .qui { flex: 1; min-width: 0; }
  .qui .nom { font-size: 13.5px; font-weight: 600; }
  .qui .lieu { font-size: 11.5px; color: var(--gris); margin-top: 1px; }
  .points { color: var(--texte); font-size: 18px; letter-spacing: 1px; }

  .scene { position: relative; background: #000; touch-action: pan-y; user-select: none; }
  .scene img { display: block; width: 100%; aspect-ratio: 4/5; object-fit: cover; }
  .zone { position: absolute; top: 0; bottom: 0; width: 42%; cursor: pointer; }
  .zone.g { left: 0; } .zone.d { right: 0; }
  .fleche {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.88);
    color: #111; display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; opacity: 0; transition: opacity .15s;
    pointer-events: none;
  }
  .scene:hover .fleche { opacity: .9; }
  .fleche.g { left: 10px; } .fleche.d { right: 10px; }
  .fleche.eteinte { opacity: 0 !important; }

  .actions { display: flex; align-items: center; gap: 16px; padding: 11px 14px 4px; }
  .actions svg { width: 24px; height: 24px; stroke: var(--texte); fill: none;
                 stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
  .actions .droite { margin-left: auto; display: flex; }
  .puces { display: flex; gap: 5px; margin: 0 auto; }
  .puces button {
    width: 6px; height: 6px; border-radius: 50%; border: 0; padding: 0;
    background: #3a4048; cursor: pointer; transition: background .15s;
  }
  .puces button.on { background: var(--lien); }

  .sous-post { padding: 4px 14px 16px; font-size: 13.5px; line-height: 1.42; }
  .aimes { font-weight: 600; margin-bottom: 5px; }
  .legende .nom { font-weight: 600; margin-right: 5px; }
  .legende { color: var(--texte); }
  .legende.repliee { display: -webkit-box; -webkit-box-orient: vertical;
                     -webkit-line-clamp: 2; overflow: hidden; }
  .tag { color: var(--lien); }
  .plus { color: var(--gris); cursor: pointer; margin-top: 2px; font-size: 13.5px; }
  .quand { color: var(--gris); font-size: 11px; margin-top: 9px;
           text-transform: uppercase; letter-spacing: .04em; }

  .pied {
    height: 52px; border-top: 1px solid var(--filet); display: flex;
    align-items: center; justify-content: space-around; padding: 0 22px 6px;
  }
  .pied svg { width: 23px; height: 23px; stroke: var(--gris); fill: none; stroke-width: 1.7; }
  .pied svg.actif { stroke: var(--texte); }

  .note { max-width: 430px; font-size: 12.5px; line-height: 1.6; color: var(--gris);
          text-align: center; }
  .note kbd { background: #1b2129; border: 1px solid var(--filet); border-radius: 4px;
              padding: 1px 5px; font-size: 11px; color: var(--texte); }
</style>
</head>
<body>
  <div class="titre-page"><b>${echapper(basename(dossier))}</b> · ${images.length} planches</div>

  <div class="tel">
    <div class="encoche"><i></i></div>
    <div class="barre-appli">
      <div class="marque">${LOGO}<span>jaquette.app</span></div>
      <div class="apercu-etiquette">aperçu</div>
    </div>

    <div class="entete-post">
      <div class="avatar">${LOGO}</div>
      <div class="qui">
        <div class="nom">jaquette.app</div>
        <div class="lieu">Le catalogue des éditions physiques</div>
      </div>
      <div class="points">···</div>
    </div>

    <div class="scene" id="scene">
      <img id="planche" alt="planche 1" />
      <div class="zone g" data-pas="-1"></div>
      <div class="zone d" data-pas="1"></div>
      <div class="fleche g eteinte" id="fg">‹</div>
      <div class="fleche d" id="fd">›</div>
    </div>

    <div class="actions">
      <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.6-4.8A8.4 8.4 0 1 1 21 11.5z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
      <div class="puces" id="puces"></div>
      <div class="droite">
        <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/></svg>
      </div>
    </div>

    <div class="sous-post">
      <div class="aimes">312 J'aime</div>
      <div class="legende repliee" id="legende"><span class="nom">jaquette.app</span>${legendeHtml}</div>
      <div class="plus" id="plus">… plus</div>
      <div class="quand">Il y a 2 heures</div>
    </div>

    <div class="pied">
      <svg viewBox="0 0 24 24" class="actif"><path d="M3 10.5 12 3l9 7.5V21H3z"/></svg>
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>
      <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    </div>
  </div>

  <div class="note">
    Clique à droite ou à gauche de l'image, ou <kbd>←</kbd> <kbd>→</kbd>, pour balayer.
    Gabarit de fil, pas une reproduction : ce qu'il sert à vérifier est le cadrage
    et la lisibilité à 390 px.
  </div>

<script>
  const IMAGES = ${JSON.stringify(images)};
  const planche = document.getElementById("planche");
  const puces = document.getElementById("puces");
  const fg = document.getElementById("fg");
  const fd = document.getElementById("fd");
  let i = 0;

  IMAGES.forEach((_, n) => {
    const b = document.createElement("button");
    b.addEventListener("click", () => aller(n));
    puces.appendChild(b);
  });

  function aller(n) {
    i = Math.max(0, Math.min(IMAGES.length - 1, n));
    planche.src = IMAGES[i];
    planche.alt = "planche " + (i + 1);
    [...puces.children].forEach((b, n2) => b.classList.toggle("on", n2 === i));
    fg.classList.toggle("eteinte", i === 0);
    fd.classList.toggle("eteinte", i === IMAGES.length - 1);
  }

  document.querySelectorAll(".zone").forEach((z) =>
    z.addEventListener("click", () => aller(i + Number(z.dataset.pas))));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") aller(i + 1);
    if (e.key === "ArrowLeft") aller(i - 1);
  });

  // Balayage au doigt et à la souris. Seuil à 40 px : en dessous, un clic un peu
  // traînant se lit comme un balayage et on saute deux planches d'un coup.
  const scene = document.getElementById("scene");
  let depart = null;
  scene.addEventListener("pointerdown", (e) => { depart = e.clientX; });
  scene.addEventListener("pointerup", (e) => {
    if (depart === null) return;
    const d = e.clientX - depart;
    depart = null;
    if (Math.abs(d) > 40) aller(i + (d < 0 ? 1 : -1));
  });

  const legende = document.getElementById("legende");
  const plus = document.getElementById("plus");
  plus.addEventListener("click", () => {
    const repliee = legende.classList.toggle("repliee");
    plus.textContent = repliee ? "… plus" : "moins";
  });

  aller(0);
</script>
</body></html>`;

const sortie = join(dossier, "apercu.html");
writeFileSync(sortie, html);
console.log(
  `${sortie}\n${images.length} planches, ${Math.round(html.length / 1024)} Ko` +
  `${sipsDispo ? ` (réduites à ${LARGEUR_APERCU} px)` : " (pleine taille, sips absent)"}`);
