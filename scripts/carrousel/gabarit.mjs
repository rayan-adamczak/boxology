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

/**
 * Plancher typographique, mesuré et non choisi.
 *
 * Un fil mobile affiche une planche sur environ 374 px de large, soit une
 * réduction de 2,9. Tout ce qui est sous **34 px ici passe sous 12 px chez le
 * lecteur**, et 12 px est le seuil en dessous duquel on ne lit plus, on devine.
 *
 * Le premier jet mettait les métadonnées à 22 px, donc 7,6 px dans un fil : le
 * gabarit d'aperçu l'a montré d'un coup d'œil, ce qu'aucune relecture de la
 * planche en grand ne pouvait faire. C'est la raison d'être de `apercu.mjs`.
 *
 * La conséquence n'est pas seulement de grossir : à taille lisible, tout ne
 * tient plus. Une planche d'édition porte donc **une seule ligne de
 * métadonnée** au lieu de quatre. Le code-barres, la collection et le nombre de
 * disques sont sortis : ils se lisent sur la fiche, pas dans un fil.
 */
const PLANCHER = 34;

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
  .lockup svg { display: block; height: 30px; width: auto; }
  .lockup .nom {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 37px; letter-spacing: -0.035em; line-height: 1;
  }
  .corps { flex: 1; display: flex; flex-direction: column; min-height: 0; padding-bottom: 34px; }

  /* --- pied : le filet tricolore, et rien d'autre ---
     Le compteur « 3/8 » et le rail d'avancement ont été retirés. L'application
     pose déjà sa pastille et ses puces : les redire, c'est occuper deux fois la
     même place pour la même information, et une planche n'a de la place que
     pour ce qu'elle est seule à dire. Reste le filet, qui n'informe pas mais
     signe. */
  .filet {
    position: absolute; left: 0; right: 0; bottom: 0; height: 14px;
    display: flex; z-index: 3;
  }
  .filet i { flex: 1; }

  /* --- éléments partagés --- */
  .surtitre {
    font-size: ${PLANCHER}px; font-weight: 700; letter-spacing: 0.14em;
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
    font-size: ${PLANCHER}px; font-weight: 600; padding: 12px 24px; border-radius: 999px;
    background: ${SURFACE_2}; color: ${TEXTE}; border: 1px solid ${BORDURE};
  }
  .badge.accent { border-color: currentColor; background: transparent; border-width: 2px; }

  .meta { font-size: ${PLANCHER + 2}px; color: ${DISCRET}; line-height: 1.45; }
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
function planche({ accent, contenu, fondSupplementaire = "" }) {
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
    </div>
    <div class="corps">${contenu}</div>
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
export function couverture({ accent, surtitre, titre, annee, sous, mosaique = [] }) {
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
          /* Bandeau de tête : le mot-symbole et le compteur tombent sur la
             mosaïque, et une jaquette claire les efface. Un voile court en
             haut plutôt qu'un fond plein derrière le bandeau, qui se lirait
             comme une barre d'application. */
          linear-gradient(180deg, rgba(16,23,32,.88) 0%,
                                  rgba(16,23,32,.55) 9%, rgba(16,23,32,0) 17%),
          linear-gradient(180deg,
            rgba(16,23,32,.34) 0%, rgba(16,23,32,.58) 30%,
            rgba(16,23,32,.92) 54%, ${FOND} 68%),
          linear-gradient(90deg, rgba(16,23,32,.86) 0%, rgba(16,23,32,0) 62%);
      }
      /* Trois éléments et pas un de plus : ce que le carrousel montre, de quoi
         il parle, la question posée. L'invitation « → Balaye » a été retirée,
         l'application affiche déjà ses puces et personne n'apprend à balayer
         sur une planche. */
      .bloc { margin-top: auto; padding-bottom: 46px; position: relative; z-index: 2; }
      .bloc h1 { font-size: 96px; margin-top: 24px; }
      .bloc h1 .annee { font-weight: 300; color: ${DISCRET}; }
      .bloc .sous { font-size: 40px; color: ${TEXTE}; margin-top: 30px; line-height: 1.3;
                    max-width: 860px; font-weight: 500; }
    </style>
    <div class="bloc">
      <div class="surtitre" style="color:${accent}">${echapper(surtitre)}</div>
      <h1>${echapper(titre)}${
        annee ? `<span class="annee">&nbsp;&nbsp;${annee}</span>` : ""}</h1>
      ${sous ? `<div class="sous">${sous}</div>` : ""}
    </div>`;

  return planche({ accent, contenu, fondSupplementaire: fond });
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
  accent, surtitre, titre, annee, edition, badges = [], lignes = [], visuel,
}) {
  const rapport = visuel?.rapport ?? 2 / 3;
  /* La largeur est la plus petite des deux contraintes, la seconde étant la
     hauteur disponible traduite en largeur. Aucune déformation possible, et
     un packshot carré ou un photogramme paysage tiennent sans réglage à part.

     Le visuel est **au-dessus** du texte et non à côté : sur une toile 4/5, une
     colonne de texte à côté d'une jaquette ne laisse que 320 px, où un titre de
     film passe à la ligne trois fois. Empilé, il a les 928 px du cadre. */
  /* La hauteur disponible est tombée de 700 à 620 le jour où le texte est
     passé au-dessus du plancher de lisibilité : à taille lisible, le bloc de
     texte prend la place, et c'est le bon arbitrage. Un boîtier un peu plus
     petit se voit encore, une ligne de 7 px ne se lit pas. */
  const largeur = Math.min(928, Math.round(590 * rapport));

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
      .bloc-texte { padding-bottom: 30px; }
      .bloc-texte h2 { font-size: 74px; margin-top: 16px; -webkit-line-clamp: 2; }
      .bloc-texte .annee { font-weight: 300; color: ${DISCRET}; }
      .edition-nom {
        font-size: 42px; font-weight: 600; margin-top: 18px; line-height: 1.22;
        -webkit-line-clamp: 2;
      }
      .badges { margin-top: 28px; }
      /* Une seule ligne, empilée. Les deux colonnes du premier jet tenaient
         parce que le texte était trop petit pour être lu ; à taille lisible
         elles se chevauchent, et la quatrième information ne se lisait de
         toute façon pas dans un fil. */
      /* Coupée à une ligne, et c'est un garde-fou et non un choix de mise en
         page : le visuel a une hauteur fixe, donc un texte plus haut que prévu
         ne le comprime pas, il pousse le rail hors de la planche. Un défaut qui
         ne lève rien et ne se voit qu'à l'image. */
      .lignes { margin-top: 26px; }
      .lignes .meta {
        display: -webkit-box; -webkit-box-orient: vertical;
        -webkit-line-clamp: 1; overflow: hidden;
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

  return planche({ accent, contenu });
}

/* ------------------------------------------------------------------- grille */

/**
 * Neuf vignettes numérotées, pour les collections à numéro.
 *
 * Make My Day! numérote de 1 à 98 et c'est le seul cas du catalogue où le rang
 * est publié par la source (§3). La case à cocher est le sens de la planche :
 * le lecteur compte les siennes.
 */
export function grille({ accent, titre, sous, cases }) {
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
      .entete-grille { padding: 26px 0 30px; }
      .entete-grille h2 { font-size: 56px; }
      .entete-grille .sous { font-size: 32px; color: ${DISCRET}; margin-top: 10px; }

      /* Les rangées valent 1fr et la vignette se dimensionne sur la hauteur
         reçue, sa largeur suivant le rapport. C'est la règle de la visionneuse
         appliquée dans l'autre sens (§8), et c'est ce qui évite le défaut du
         premier jet : à largeur imposée, la troisième rangée passait sous le
         filet, et overflow hidden la coupait sans rien signaler. */
      .cases {
        flex: 1; min-height: 0; display: grid;
        /* Neuf par planche et non douze. À quatre colonnes le nom d'un film
           tombait à 16 px, soit 5,5 px dans un fil : la grille était une
           planche-contact illisible. Plus de planches, chacune lisible. */
        grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
        gap: 26px 28px; padding-bottom: 12px;
      }
      .case { display: flex; flex-direction: column; min-height: 0; }
      /* Vignette calée à gauche et non centrée : le nom en dessous l'est, et
         deux alignements différents dans la même case se lisent comme un
         décalage. */
      .cadre-v { flex: 1; min-height: 0; display: flex; justify-content: flex-start; }
      .vignette {
        position: relative; height: 100%; aspect-ratio: 2/3; border-radius: 5px;
        background-size: cover; background-position: center;
        background-color: ${SURFACE}; box-shadow: 0 12px 26px rgba(0,0,0,.45);
      }
      .vignette.vide { border: 1px dashed ${BORDURE}; box-shadow: none; }
      .rang {
        position: absolute; top: -14px; left: -14px; min-width: 54px; height: 54px;
        border-radius: 999px; color: #101720; font-weight: 800; font-size: 28px;
        display: flex; align-items: center; justify-content: center; padding: 0 12px;
        font-variant-numeric: tabular-nums;
      }
      .nom { height: 62px; margin-top: 14px; font-size: 27px; line-height: 1.22;
             color: ${DISCRET}; -webkit-line-clamp: 2; }
    </style>
    <div class="entete-grille">
      <h2>${echapper(titre)}</h2>
      ${sous ? `<div class="sous">${echapper(sous)}</div>` : ""}
    </div>
    <div class="cases">${tuiles}</div>`;

  return planche({ accent, contenu });
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
export function fin({ accent, titre, sous, chemin = "" }) {
  const contenu = `
    <style>
      .fin { flex: 1; display: flex; flex-direction: column; justify-content: center;
             align-items: center; text-align: center; padding-bottom: 40px; }
      .fin .marque svg { height: 108px; width: auto; display: block; margin: 0 auto; }
      .fin h1 { font-size: 62px; margin-top: 46px; max-width: 840px; }
      .fin .sous { font-size: 34px; color: ${DISCRET}; margin-top: 26px; line-height: 1.42;
                   max-width: 780px; }
      .adresse {
        margin-top: 52px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
        font-size: 44px; letter-spacing: -0.03em;
        background: linear-gradient(90deg, ${COULEURS[0]}, ${COULEURS[1]}, ${COULEURS[2]});
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .chemin { font-size: 32px; color: ${DISCRET}; margin-top: 12px; }
      .signalement {
        margin-top: 46px; font-size: 30px; color: ${DISCRET}; line-height: 1.45;
        border-top: 1px solid ${BORDURE}; padding-top: 28px; max-width: 720px;
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

  return planche({ accent, contenu });
}
