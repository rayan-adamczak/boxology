/**
 * Recadre un packshot pour que le boîtier occupe la même part sur toutes les
 * planches.
 *
 * **C'est la solution inverse du détourage, et elle assume le fond au lieu de
 * le combattre.** Retirer le cyclo blanc demandait de deviner où finit le
 * boîtier, ce qu'aucune règle de couleur ne sait faire sur une jaquette claire,
 * et l'enveloppe convexe qui a réglé ce cas en a cassé un autre, les objets
 * séparés. Ici rien n'est effacé : on garde la photo telle qu'elle est, et on
 * corrige la seule chose qui gênait vraiment, l'**inégalité de cadrage**.
 *
 * Une source cadre serré, le boîtier touche presque le bord ; une autre laisse
 * un tiers de blanc autour. Enchaînées dans un carrousel, les deux donnent des
 * boîtiers de tailles apparentes différentes alors que le cadre de la planche
 * est le même. On remesure donc le sujet et on le repose au centre d'une toile
 * carrée où il occupe toujours la même fraction.
 *
 * **Aucun pixel du sujet n'est touché.** On recopie le rectangle du sujet tel
 * quel, marge comprise, et on complète avec la couleur du fond relevée aux
 * coins : un packshot sur cyclo blanc reste sur blanc, un steelbook shooté sur
 * fond noir reste sur noir. Le cadrage se normalise, pas le rendu.
 */

import { decoder, encoder, lireImage } from "./png.mjs";

/**
 * Part de la toile occupée par la plus grande dimension du sujet.
 *
 * 0,78 laisse 11 % de marge de chaque côté sur cette dimension. Plus serré, le
 * boîtier touche presque le bord de sa vignette et le halo teinté n'a plus de
 * place pour se voir ; plus large, la planche se vide.
 */
const PART_SUJET = 0.78;

/**
 * Tolérance de couleur du fond, en distance de Manhattan sur les trois canaux.
 *
 * Elle n'a pas à être fine : on ne découpe rien, on cherche seulement où
 * s'arrête le sujet. 66 avale les dégradés de cyclo et les ombres portées sans
 * mordre sur une illustration, et une erreur de quelques pixels sur le
 * rectangle ne se voit pas une fois recadré.
 */
const TOLERANCE = 66;

/** Taille du carré échantillonné à chaque coin pour lire la couleur du fond. */
const COIN = 16;

/** Couleur du fond, médiane des quatre coins canal par canal. La médiane et non
 *  la moyenne : un coin mordu par le sujet fausserait la seconde. */
function couleurFond({ large, haut, px }) {
  const c = Math.min(COIN, large >> 2, haut >> 2);
  const moyenneCoin = (x0, y0) => {
    let r = 0, v = 0, b = 0;
    for (let y = y0; y < y0 + c; y++) {
      for (let x = x0; x < x0 + c; x++) {
        const p = (y * large + x) * 4;
        r += px[p]; v += px[p + 1]; b += px[p + 2];
      }
    }
    const k = c * c;
    return [r / k, v / k, b / k];
  };
  const coins = [
    moyenneCoin(0, 0), moyenneCoin(large - c, 0),
    moyenneCoin(0, haut - c), moyenneCoin(large - c, haut - c),
  ];
  return [0, 1, 2].map((canal) => {
    const v = coins.map((co) => co[canal]).sort((a, b) => a - b);
    return Math.round((v[1] + v[2]) / 2);
  });
}

/**
 * Rectangle du sujet : tout ce que le remplissage depuis les bords n'atteint
 * pas. Rend `null` si le fond n'est pas uniforme, auquel cas il n'y a rien à
 * recadrer et on garde la photo entière.
 */
function rectangleSujet({ large, haut, px }, fond) {
  const n = large * haut;
  const dehors = new Uint8Array(n);
  const file = new Int32Array(n);
  let tete = 0, queue = 0;

  const proche = (p) =>
    Math.abs(px[p] - fond[0]) + Math.abs(px[p + 1] - fond[1]) +
    Math.abs(px[p + 2] - fond[2]) <= TOLERANCE;

  const pousser = (i) => {
    if (dehors[i] || !proche(i * 4)) return;
    dehors[i] = 1;
    file[queue++] = i;
  };
  for (let x = 0; x < large; x++) { pousser(x); pousser((haut - 1) * large + x); }
  for (let y = 0; y < haut; y++) { pousser(y * large); pousser(y * large + large - 1); }
  while (tete < queue) {
    const i = file[tete++];
    const x = i % large, y = (i / large) | 0;
    if (x > 0) pousser(i - 1);
    if (x < large - 1) pousser(i + 1);
    if (y > 0) pousser(i - large);
    if (y < haut - 1) pousser(i + large);
  }

  let xMin = large, xMax = -1, yMin = haut, yMax = -1;
  for (let y = 0; y < haut; y++) {
    for (let x = 0; x < large; x++) {
      if (dehors[y * large + x]) continue;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  if (xMax < xMin) return null;

  /* Un rectangle qui couvre déjà toute la photo veut dire qu'aucun fond n'a été
     reconnu : la marge est nulle, le recadrage n'aurait rien à faire, et
     agrandir de force ajouterait une bordure inventée autour d'une image qui
     n'en avait pas. */
  const couvre = ((xMax - xMin + 1) * (yMax - yMin + 1)) / (large * haut);
  if (couvre > 0.985) return null;

  return { xMin, xMax, yMin, yMax };
}

/**
 * Arrondit les quatre coins de la toile, en transparence.
 *
 * Sans ça, un packshot sur cyclo donne un carré blanc à angles vifs posé sur la
 * planche : ça se lit comme une image mal détourée. Arrondi, il se lit comme
 * une carte, c'est-à-dire comme une intention. Sur un fond sombre, la carte se
 * confond avec la planche et l'arrondi ne se voit pas, ce qui est le
 * comportement voulu, il ne coûte rien là où il ne sert pas.
 *
 * L'alpha est progressive sur un pixel : un masque binaire remettrait l'escalier
 * dont on vient de débarrasser les bords.
 */
const PART_ARRONDI = 0.045;

function arrondir(px, cote) {
  const r = Math.round(cote * PART_ARRONDI);
  if (r < 2) return;
  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      const cx = x < r ? r : x >= cote - r ? cote - r - 1 : x;
      const cy = y < r ? r : y >= cote - r ? cote - r - 1 : y;
      if (cx === x && cy === y) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r - 1) continue;
      const p = (y * cote + x) * 4;
      px[p + 3] = d >= r ? 0 : Math.round(255 * (r - d));
    }
  }
}

/**
 * Repose le sujet au centre d'une toile carrée où il occupe `PART_SUJET`.
 *
 * La toile est **carrée** exprès. Le gabarit dimensionne le visuel sur son
 * rapport ; des rapports différents d'une planche à l'autre donnaient des
 * cadres de tailles différentes, ce qui est précisément le défaut qu'on répare.
 * Carré partout, le cadre est le même et seule la taille du boîtier dedans
 * change, comme il se doit.
 */
export function cadrer(image) {
  const fond = couleurFond(image);
  const rect = rectangleSujet(image, fond);
  if (!rect) return { refus: "fond non reconnu, photo gardée telle quelle" };

  const { large, haut, px } = image;
  const largeurSujet = rect.xMax - rect.xMin + 1;
  const hauteurSujet = rect.yMax - rect.yMin + 1;
  const cote = Math.round(Math.max(largeurSujet, hauteurSujet) / PART_SUJET);

  const toile = Buffer.alloc(cote * cote * 4);
  for (let i = 0; i < cote * cote; i++) {
    const p = i * 4;
    toile[p] = fond[0]; toile[p + 1] = fond[1]; toile[p + 2] = fond[2]; toile[p + 3] = 255;
  }

  const decaleX = Math.round((cote - largeurSujet) / 2);
  const decaleY = Math.round((cote - hauteurSujet) / 2);
  for (let y = 0; y < hauteurSujet; y++) {
    const source = ((rect.yMin + y) * large + rect.xMin) * 4;
    const cible = ((decaleY + y) * cote + decaleX) * 4;
    px.copy(toile, cible, source, source + largeurSujet * 4);
  }

  arrondir(toile, cote);

  return {
    large: cote,
    haut: cote,
    px: toile,
    marge: 1 - Math.max(largeurSujet, hauteurSujet) / cote,
    /* Ce qu'était la marge avant, pour savoir si on a rogné ou complété. */
    margeAvant: 1 - Math.max(largeurSujet / large, hauteurSujet / haut),
  };
}

/** Chaîne complète : n'importe quel format en entrée, PNG carré en sortie. */
export function cadrerFichier(buf, travail, nom) {
  let image;
  try {
    image = lireImage(buf, travail, nom);
  } catch (erreur) {
    return { refus: `lecture impossible : ${erreur.message}` };
  }
  const cadre = cadrer(image);
  if (cadre.refus) return cadre;
  return {
    buf: encoder(cadre),
    marge: cadre.marge,
    margeAvant: cadre.margeAvant,
    cote: cadre.large,
  };
}
