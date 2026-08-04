/**
 * Gabarit des planches de carrousel, 1080 × 1350.
 *
 * Une planche est un document HTML complet rendu par Chrome sans interface,
 * même mécanique que `scripts/og/og-jaquette.html`. Les pièges de ce rendu sont
 * consignés au §8 et repris ici tels quels : polices par chemin de fichier et
 * jamais par serveur local, visuels en image de fond base64 et jamais en
 * `<img src="file://">`, taille du corps posée à l'exact pour que la dernière
 * ligne de pixels ne sorte pas transparente.
 *
 * **Les trois couleurs du mot-symbole portent tout le dessin ici**, ce qui est
 * une divergence assumée avec le §8 : dans l'interface elles ne colorent rien,
 * parce qu'un bouton ambre ne dit rien de plus qu'un bouton bleu. Sur une
 * planche de réseau social, la marque *est* le sujet, et un carrousel où les
 * planches se répondent en cyan, ambre, rouge se reconnaît dans un fil sans
 * qu'on lise le nom. Mesuré sur le fond #101720, les trois passent AA en texte
 * normal : cyan 8,12:1, ambre 9,90:1, rouge 5,16:1.
 *
 * Le mot-symbole est **lu dans `public/logo.svg`** au lieu d'être recopié. Le
 * site en garde trois copies parce qu'un `<img>` de plus sur le chemin de rendu
 * du bandeau coûterait une requête ; ici on lit un fichier sur disque, la
 * raison de la copie tombe, et une quatrième aurait dérivé au premier redessin.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RACINE } from "./donnees.mjs";

export const LARGEUR = 1080;
export const HAUTEUR = 1350;

/** Les trois tranches, dans l'ordre du logo. Une planche prend la suivante. */
export const COULEURS = ["#00bced", "#ffb000", "#fb4412"];
export const NOMS_COULEURS = ["cyan", "ambre", "rouge"];

const FOND = "#101720";
const SURFACE = "#18202c";
const SURFACE_2 = "#1f2836";
const TEXTE = "#e8e8e8";
const DISCRET = "#8a8f98";
const BORDURE = "#263042";

const police = (fichier) => `file://${resolve(RACINE, "public/fonts", fichier)}`;

/* Le mot-symbole, commentaires XML retirés : Chrome les ignore, mais ils
   pèsent 1 Ko sur chacune des dix planches d'un carrousel. */
const LOGO = readFileSync(resolve(RACINE, "public/logo.svg"), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\s+/g, " ")
  .trim();

export function echapper(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CSS = `
  @font-face {
    font-family: 'Bricolage Grotesque';
    font-weight: 200 800;
    src: url('${police("bricolage-grotesque-latin.woff2")}') format('woff2');
  }
  @font-face {
    font-family: 'Bricolage Grotesque';
    font-weight: 200 800;
    src: url('${police("bricolage-grotesque-latin-ext.woff2")}') format('woff2');
    unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+2020, U+20A0-20AB;
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 200 800;
    src: url('${police("inter-latin.woff2")}') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 200 800;
    src: url('${police("inter-latin-ext.woff2")}') format('woff2');
    unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+2020, U+20A0-20AB;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${LARGEUR}px; height: ${HAUTEUR}px; }
  body {
    background: ${FOND};
    color: ${TEXTE};
    font-family: 'Inter', system-ui, sans-serif;
    font-feature-settings: 'ss01';
    position: relative;
    overflow: hidden;
  }

  /* Atmosphère par opacité et dégradés, jamais par un filtre CSS : un
     backdrop-filter force une couche de composition sur toute la largeur et
     laisse des tuiles périmées, défaut mesuré sur le héros de l'accueil (§8). */
  .halo { position: absolute; border-radius: 50%; }
  .halo-a { width: 1000px; height: 1000px; right: -320px; top: -380px; }
  .halo-b { width: 780px; height: 780px; left: -300px; bottom: -260px;
            background: radial-gradient(circle, rgba(110,168,255,.10) 0%, rgba(110,168,255,0) 66%); }

  .cadre {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    padding: 68px 76px 0;
    z-index: 2;
  }

  /* --- bandeau de tête, identique sur toutes les planches --- */
  .tete { display: flex; align-items: center; justify-content: space-between; }
  .lockup { display: flex; align-items: center; gap: 13px; }
  .lockup svg { display: block; height: 27px; width: auto; }
  .lockup .nom {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 33px; letter-spacing: -0.035em; line-height: 1;
  }
  .compteur {
    font-size: 21px; font-weight: 600; color: ${DISCRET};
    font-variant-numeric: tabular-nums; letter-spacing: 0.04em;
  }
  .compteur b { font-weight: 700; }

  .corps { flex: 1; display: flex; flex-direction: column; min-height: 0; }

  /* --- pied : rail d'avancement puis filet tricolore --- */
  .rail { display: flex; gap: 7px; padding: 0 0 26px; }
  .rail span { height: 5px; flex: 1; border-radius: 3px; background: ${BORDURE}; }
  .filet {
    position: absolute; left: 0; right: 0; bottom: 0; height: 14px;
    display: flex; z-index: 3;
  }
  .filet i { flex: 1; }

  /* --- éléments partagés --- */
  .surtitre {
    font-size: 22px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  h1 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; letter-spacing: -0.035em; line-height: 0.98;
  }
  h2 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; letter-spacing: -0.03em; line-height: 1.04;
  }
  .coupe { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }

  /* La capsule dit une propriété relevée à la source, et rien d'autre (§8).
     Ici rien ne se clique, donc pas d'état de survol et pas de bordure vive. */
  .badges { display: flex; flex-wrap: wrap; gap: 10px; }
  .badge {
    font-size: 21px; font-weight: 600; padding: 8px 16px; border-radius: 999px;
    background: ${SURFACE_2}; color: ${TEXTE}; border: 1px solid ${BORDURE};
  }
  .badge.accent { border-color: currentColor; background: transparent; }

  .meta { font-size: 22px; color: ${DISCRET}; line-height: 1.5; }
  .meta b { color: ${TEXTE}; font-weight: 600; }
  .nombres { font-variant-numeric: tabular-nums; }

  /* Le visuel est posé en image de fond : un <img src="file://"> reste bloqué
     dans Chrome sans interface (§8). Contain et non cover : les packshots du
     Chat qui fume sont carrés, ceux de Leclerc arrivent en func=fit avec leur
     marge blanche, et rogner un boîtier est exactement ce qu'il ne faut pas
     faire quand le boîtier est le sujet. */
  .visuel {
    background-repeat: no-repeat; background-position: center;
    background-size: contain;
    filter: drop-shadow(0 26px 54px rgba(0,0,0,.55));
  }
`;

/** Le squelette commun. `contenu` est déjà échappé par l'appelant. */
function planche({ index, total, accent, contenu, fondSupplementaire = "" }) {
  const rail = Array.from({ length: total }, (_, i) =>
    `<span style="background:${i === index ? accent : BORDURE}"></span>`).join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><style>${CSS}
  .halo-a { background: radial-gradient(circle, ${accent}26 0%, ${accent}00 62%); }
</style></head>
<body>
  <div class="halo halo-a"></div>
  <div class="halo halo-b"></div>
  ${fondSupplementaire}
  <div class="cadre">
    <div class="tete">
      <div class="lockup">${LOGO}<span class="nom">jaquette.app</span></div>
      <div class="compteur"><b style="color:${accent}">${index + 1}</b>/${total}</div>
    </div>
    <div class="corps">${contenu}</div>
    <div class="rail">${rail}</div>
  </div>
  <div class="filet">
    <i style="background:${COULEURS[0]}"></i>
    <i style="background:${COULEURS[1]}"></i>
    <i style="background:${COULEURS[2]}"></i>
  </div>
</body></html>`;
}

/* --------------------------------------------------------------- couverture */

/**
 * Première planche : c'est elle qui décide si on balaye ou non.
 *
 * Le fond est une mosaïque d'affiches très assombrie, jamais une image nette :
 * elle doit dire « catalogue » d'un coup d'œil sans disputer la lisibilité au
 * titre. Même traitement que le héros de la fiche film, opacité et dégradés.
 */
export function couverture({ index, total, accent, surtitre, titre, sous, mosaique = [] }) {
  /* La grille est **toujours pleine**, au besoin en reprenant les visuels du
     début. Une dernière rangée à moitié vide se lit comme un défaut d'affichage
     et non comme un parti pris, or le nombre de visuels nets dépend de la
     source et n'est jamais rond. */
  const CASES = 15;
  const tuiles = mosaique.length
    ? Array.from({ length: CASES }, (_, i) => mosaique[i % mosaique.length])
        .map((v) => `<div class="tuile" style="background-image:url('${v.src}')"></div>`)
        .join("")
    : "";

  const fond = mosaique.length
    ? `<div class="mosaique">${tuiles}</div><div class="voile"></div>`
    : "";

  const contenu = `
    <style>
      .mosaique {
        position: absolute; inset: -70px -70px auto -70px; height: 940px;
        display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;
        transform: rotate(-6deg) scale(1.2); transform-origin: top center;
        z-index: 0;
      }
      .tuile { aspect-ratio: 2/3; background-size: cover; background-position: center;
               border-radius: 8px; }
      /* Le voile laisse voir le haut et devient franc avant le titre : une
         mosaïque uniformément assombrie ne dit plus « catalogue », elle fait
         une texture grise. */
      .voile {
        position: absolute; inset: 0; z-index: 1;
        background:
          linear-gradient(180deg,
            rgba(16,23,32,.34) 0%, rgba(16,23,32,.58) 30%,
            rgba(16,23,32,.92) 54%, ${FOND} 68%),
          linear-gradient(90deg, rgba(16,23,32,.86) 0%, rgba(16,23,32,0) 62%);
      }
      .bloc { margin-top: auto; padding-bottom: 44px; position: relative; z-index: 2; }
      .bloc h1 { font-size: 92px; margin-top: 26px; }
      .bloc .sous { font-size: 30px; color: ${DISCRET}; margin-top: 26px; line-height: 1.42;
                    max-width: 800px; }
      .balaye { display: flex; align-items: center; gap: 14px; margin-top: 40px;
                font-size: 23px; font-weight: 600; letter-spacing: 0.04em; }
      .balaye .fleche { font-size: 30px; }
    </style>
    <div class="bloc">
      <div class="surtitre" style="color:${accent}">${echapper(surtitre)}</div>
      <h1>${echapper(titre)}</h1>
      ${sous ? `<div class="sous">${sous}</div>` : ""}
      <div class="balaye" style="color:${accent}"><span class="fleche">→</span> Balaye</div>
    </div>`;

  return planche({ index, total, accent, contenu, fondSupplementaire: fond });
}

/* ------------------------------------------------------------------ édition */

/**
 * Une édition, un visuel, ses propriétés relevées à la source.
 *
 * **Une seule dimension est pilotée, la largeur ; la hauteur suit le rapport.**
 * C'est la règle de la visionneuse (§8) et elle vaut ici pour la même raison :
 * un `max-height` posé en plus écrase les visuels carrés, et une déformation
 * sur une jaquette se voit immédiatement.
 */
export function planchEdition({
  index, total, accent, surtitre, titre, annee, edition, badges = [], lignes = [], visuel,
}) {
  const rapport = visuel?.rapport ?? 2 / 3;
  /* La largeur est la plus petite des deux contraintes, la seconde étant la
     hauteur disponible traduite en largeur. Aucune déformation possible, et
     un packshot carré ou un photogramme paysage tiennent sans réglage à part.

     Le visuel est **au-dessus** du texte et non à côté : sur une toile 4/5, une
     colonne de texte à côté d'une jaquette ne laisse que 320 px, où un titre de
     film passe à la ligne trois fois. Empilé, il a les 928 px du cadre. */
  const largeur = Math.min(928, Math.round(700 * rapport));

  const contenu = `
    <style>
      .pile { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .zone-visuel {
        flex: 1; display: flex; align-items: center; justify-content: center;
        min-height: 0; padding: 30px 0 44px;
      }
      .zone-visuel .visuel {
        width: ${largeur}px; max-width: 100%; aspect-ratio: ${rapport};
        border-radius: 6px;
      }
      .sans-visuel {
        width: 400px; aspect-ratio: 2/3; border-radius: 6px; background: ${SURFACE};
        border: 1px dashed ${BORDURE};
      }
      .bloc-texte { padding-bottom: 34px; }
      .bloc-texte .surtitre { font-size: 20px; }
      .bloc-texte h2 { font-size: 56px; margin-top: 14px; -webkit-line-clamp: 2; }
      .bloc-texte .annee { font-weight: 300; color: ${DISCRET}; }
      .edition-nom {
        font-size: 27px; font-weight: 600; margin-top: 16px; line-height: 1.3;
        -webkit-line-clamp: 2;
      }
      .badges { margin-top: 24px; }
      /* Deux colonnes : quatre lignes empilées mangeraient la hauteur qui
         revient au boîtier, qui est le sujet de la planche. */
      .lignes {
        margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr;
        gap: 10px 40px;
      }
    </style>
    <div class="pile">
      <div class="zone-visuel">
        ${visuel
          ? `<div class="visuel" style="background-image:url('${visuel.src}')"></div>`
          : `<div class="sans-visuel"></div>`}
      </div>
      <div class="bloc-texte">
        ${surtitre ? `<div class="surtitre" style="color:${accent}">${echapper(surtitre)}</div>` : ""}
        <h2 class="coupe">${echapper(titre)}${
          annee ? `<span class="annee">&nbsp;&nbsp;${annee}</span>` : ""}</h2>
        ${edition ? `<div class="edition-nom coupe" style="color:${accent}">${echapper(edition)}</div>` : ""}
        ${badges.length
          ? `<div class="badges">${badges.map((b, i) =>
              `<span class="badge${i === 0 ? " accent" : ""}"${
                i === 0 ? ` style="color:${accent}"` : ""}>${echapper(b)}</span>`).join("")}</div>`
          : ""}
        ${lignes.length
          ? `<div class="lignes">${lignes.map((l) => `<div class="meta nombres">${l}</div>`).join("")}</div>`
          : ""}
      </div>
    </div>`;

  return planche({ index, total, accent, contenu });
}

/* ------------------------------------------------------------------- grille */

/**
 * Douze vignettes numérotées, pour les collections à numéro.
 *
 * Make My Day! numérote de 1 à 98 et c'est le seul cas du catalogue où le rang
 * est publié par la source (§3). La case à cocher est le sens de la planche :
 * le lecteur compte les siennes.
 */
export function grille({ index, total, accent, titre, sous, cases }) {
  const tuiles = cases.map((c) => `
    <div class="case">
      <div class="cadre-v">
        <div class="vignette${c.visuel ? "" : " vide"}"${
          c.visuel ? ` style="background-image:url('${c.visuel.src}')"` : ""}>
          ${c.rang ? `<div class="rang" style="background:${accent}">${echapper(c.rang)}</div>` : ""}
        </div>
      </div>
      <div class="nom coupe">${echapper(c.nom)}</div>
    </div>`).join("");

  const contenu = `
    <style>
      .entete-grille { padding: 28px 0 30px; }
      .entete-grille h2 { font-size: 44px; }
      .entete-grille .sous { font-size: 22px; color: ${DISCRET}; margin-top: 10px; }

      /* Les rangées valent 1fr et la vignette se dimensionne sur la hauteur
         reçue, sa largeur suivant le rapport. C'est la règle de la visionneuse
         appliquée dans l'autre sens (§8), et c'est ce qui évite le défaut du
         premier jet : à largeur imposée, la troisième rangée passait sous le
         filet, et overflow hidden la coupait sans rien signaler. */
      .cases {
        flex: 1; min-height: 0; display: grid;
        grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr);
        gap: 24px 20px; padding-bottom: 12px;
      }
      .case { display: flex; flex-direction: column; min-height: 0; }
      .cadre-v { flex: 1; min-height: 0; display: flex; justify-content: center; }
      .vignette {
        position: relative; height: 100%; aspect-ratio: 2/3; border-radius: 5px;
        background-size: cover; background-position: center;
        background-color: ${SURFACE}; box-shadow: 0 12px 26px rgba(0,0,0,.45);
      }
      .vignette.vide { border: 1px dashed ${BORDURE}; box-shadow: none; }
      .rang {
        position: absolute; top: -11px; left: -11px; min-width: 38px; height: 38px;
        border-radius: 999px; color: #101720; font-weight: 800; font-size: 19px;
        display: flex; align-items: center; justify-content: center; padding: 0 9px;
        font-variant-numeric: tabular-nums;
      }
      .nom { height: 40px; margin-top: 10px; font-size: 16px; line-height: 1.26;
             color: ${DISCRET}; -webkit-line-clamp: 2; }
    </style>
    <div class="entete-grille">
      <h2>${echapper(titre)}</h2>
      ${sous ? `<div class="sous">${echapper(sous)}</div>` : ""}
    </div>
    <div class="cases">${tuiles}</div>`;

  return planche({ index, total, accent, contenu });
}

/* ---------------------------------------------------------------- fin, CTA */

/**
 * Dernière planche.
 *
 * Deux appels et pas trois : la fiche, et le signalement d'édition manquante.
 * Ce second est la meilleure réponse au trou de source du §8, et c'est la seule
 * boucle où un post rend du catalogue. Aucun prix n'y figure : une image reste
 * en ligne pour toujours quand la passe Awin rafraîchit tous les jours, et un
 * prix périmé affiché comme actuel est une pratique commerciale trompeuse
 * (§10).
 */
export function fin({ index, total, accent, titre, sous, chemin = "" }) {
  const contenu = `
    <style>
      .fin { flex: 1; display: flex; flex-direction: column; justify-content: center;
             align-items: center; text-align: center; padding-bottom: 40px; }
      .fin .marque svg { height: 108px; width: auto; display: block; margin: 0 auto; }
      .fin h1 { font-size: 62px; margin-top: 46px; max-width: 840px; }
      .fin .sous { font-size: 27px; color: ${DISCRET}; margin-top: 26px; line-height: 1.46;
                   max-width: 720px; }
      .adresse {
        margin-top: 52px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
        font-size: 44px; letter-spacing: -0.03em;
        background: linear-gradient(90deg, ${COULEURS[0]}, ${COULEURS[1]}, ${COULEURS[2]});
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .chemin { font-size: 26px; color: ${DISCRET}; margin-top: 10px; }
      .signalement {
        margin-top: 46px; font-size: 22px; color: ${DISCRET}; line-height: 1.5;
        border-top: 1px solid ${BORDURE}; padding-top: 26px; max-width: 640px;
      }
      .signalement b { color: ${TEXTE}; font-weight: 600; }
    </style>
    <div class="fin">
      <div class="marque">${LOGO}</div>
      <h1>${echapper(titre)}</h1>
      ${sous ? `<div class="sous">${echapper(sous)}</div>` : ""}
      <div class="adresse">jaquette.app</div>
      ${chemin ? `<div class="chemin">${echapper(chemin)}</div>` : ""}
      <div class="signalement">
        Une édition manque au catalogue&nbsp;?<br />
        Signale son code-barres sur <b>jaquette.app/report</b>
      </div>
    </div>`;

  return planche({ index, total, accent, contenu });
}
