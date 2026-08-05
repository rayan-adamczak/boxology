/**
 * Détoure les packshots posés sur fond blanc.
 *
 * La moitié des sources livrent leur boîtier sur un fond blanc plein, souvent
 * avec une ombre portée grise en dessous : Leclerc parce que son CDN répond en
 * `func=fit` et ajoute la marge, les boutiques Shopify parce que leurs
 * photographes shootent sur cyclo blanc. Sur une planche bleu nuit, ça donne un
 * rectangle blanc au milieu de l'image, là où un packshot déjà détouré, un
 * steelbook sur fond noir, se pose proprement.
 *
 * On ramène donc le fond blanc à la transparence. **Par remplissage depuis les
 * bords et non par seuil global** : un seuil global mangerait le blanc *dans*
 * l'illustration, le titre du film, une chemise, un ciel. Seul ce qui touche le
 * bord et reste clair de proche en proche s'en va.
 *
 * L'ombre portée de la photo part avec le fond, et c'est voulu : elle est
 * remplacée par un `drop-shadow` CSS, identique d'une planche à l'autre, là où
 * chaque source a la sienne.
 *
 * **Aucune dépendance.** `sips`, livré avec macOS, normalise n'importe quelle
 * source en PNG 8 bits non entrelacé ; le décodage et le réencodage tiennent
 * dans `zlib`, que Node porte déjà. Le dépôt a déjà fabriqué un `.ico` à la
 * main faute d'ImageMagick (§8), c'est le même parti.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

/**
 * Deux règles d'entrée, et il faut les deux.
 *
 * `BLANC` attrape le cyclo, quasiment pur. `GRIS` attrape l'ombre portée de la
 * photo, qui descend jusqu'au gris moyen : sans elle le remplissage s'arrête
 * dedans et laisse un halo clair autour du boîtier, pire que le fond d'origine.
 *
 * **Ce qui les sépare de l'illustration est la saturation, pas la clarté.** Un
 * seuil de clarté seul à 150, essayé d'abord, entrait par le ciel pâle du haut
 * de la jaquette Mario, connecté au fond puisque l'illustration touche le bord
 * du boîtier, et mangeait un quart de l'image. Une ombre photographique est
 * neutre, `r ≈ v ≈ b` ; un ciel, une bannière lavande, un aplat pastel ont
 * toujours quelques points d'écart entre canaux.
 */
const BLANC = 244;
const GRIS = 168;
const NEUTRE = 10;

/**
 * Part minimale que la zone opaque doit occuper dans son propre rectangle
 * englobant.
 *
 * Mesuré sur un échantillon : un détourage propre rend 92 à 97 %, une morsure
 * dans l'illustration fait tomber à 60 ou 76. Le seuil est donc placé à 72, au
 * milieu du vide entre les deux populations plutôt qu'au jugé. Le rejet garde
 * la photo d'origine, et un fond blanc se pardonne mieux qu'un boîtier rongé.
 */
const PART_PLEINE = 0.72;

/**
 * Clarté moyenne maximale de la frontière, c'est-à-dire des pixels gardés qui
 * touchent le fond retiré.
 *
 * **C'est le seul contrôle qui attrape une jaquette claire**, et il a fallu le
 * voir à l'image pour le trouver : le remplissage rongeait les bords blancs de
 * `The Ultimate Degenerate` et la couverture crème de `Jean de Florette`, et le
 * contrôle de remplissage ne bronchait pas, la morsure rétrécissant le
 * rectangle englobant en même temps que le sujet.
 *
 * Un boîtier ordinaire s'arrête sur une arête franche, tranche noire, liseré
 * bleu de Blu-ray, illustration saturée : la frontière est sombre ou colorée.
 * Sur une jaquette claire il n'y a pas d'arête du tout, le fond et le sujet se
 * touchent sans se distinguer, et aucun remplissage ne peut trancher. Une
 * frontière claire est donc l'aveu que la limite était ambiguë.
 */
const FRONTIERE_CLAIRE = 198;

/**
 * Part maximale de frontière quasi blanche.
 *
 * La moyenne ne suffit pas : sur les steelbooks Mario, le reflet en miroir sous
 * les boîtiers laisse une bavure blanche que le remplissage n'atteint pas, et
 * la frontière reste sombre en moyenne parce qu'elle longe aussi les tranches.
 * Ce qui distingue ce cas d'une jaquette simplement claire, `Crime 101` et son
 * fond crème, c'est la **proportion** de frontière qui est presque blanche :
 * sur une jaquette claire l'arête du boîtier reste tranchée, sur une bavure la
 * limite est blanche sur toute sa longueur.
 */
const PART_FRONTIERE_BLANCHE = 0.3;

/**
 * Le test « est-ce du cyclo » porte sur les **coins**, pas sur tout le contour.
 *
 * Le contour entier, essayé d'abord à 85 %, refusait les packshots recadrés
 * serré : quand le boîtier touche le haut et le bas de la photo, deux côtés sur
 * quatre traversent le sujet et le ratio tombe à 45 %. Les coins, eux, sont du
 * fond dans tous les cas de figure, un boîtier ne remplissant jamais son cadre
 * jusqu'aux angles.
 */
const COIN = 24;
const COINS_CLAIRS = 3;
const PART_COIN = 0.9;

/* ------------------------------------------------------------------ PNG lu */

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Décode un PNG 8 bits non entrelacé, couleur ou couleur+alpha, en RGBA. */
function decoder(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("pas un PNG");

  let i = 8;
  let large = 0, haut = 0, profondeur = 0, type = 0, entrelace = 0;
  const morceaux = [];
  while (i < buf.length) {
    const taille = buf.readUInt32BE(i);
    const nom = buf.toString("latin1", i + 4, i + 8);
    const debut = i + 8;
    if (nom === "IHDR") {
      large = buf.readUInt32BE(debut);
      haut = buf.readUInt32BE(debut + 4);
      profondeur = buf[debut + 8];
      type = buf[debut + 9];
      entrelace = buf[debut + 12];
    } else if (nom === "IDAT") {
      morceaux.push(buf.subarray(debut, debut + taille));
    } else if (nom === "IEND") break;
    i = debut + taille + 4;
  }

  if (profondeur !== 8 || entrelace !== 0 || (type !== 2 && type !== 6)) {
    throw new Error(`PNG non géré : profondeur ${profondeur}, type ${type}, entrelacé ${entrelace}`);
  }

  const canaux = type === 6 ? 4 : 3;
  const brut = inflateSync(Buffer.concat(morceaux));
  const parLigne = large * canaux;
  const px = Buffer.alloc(large * haut * 4);

  /* Défiltrage, spec PNG §9. Les cinq filtres sont là parce que `sips` en
     emploie plusieurs dans un même fichier : n'en gérer qu'un rend une image
     rayée, ce qui se voit, mais seulement une fois publiée. */
  const precedente = Buffer.alloc(parLigne);
  const courante = Buffer.alloc(parLigne);
  let source = 0;
  for (let y = 0; y < haut; y++) {
    const filtre = brut[source++];
    brut.copy(courante, 0, source, source + parLigne);
    source += parLigne;
    for (let x = 0; x < parLigne; x++) {
      const a = x >= canaux ? courante[x - canaux] : 0;
      const b = precedente[x];
      const c = x >= canaux ? precedente[x - canaux] : 0;
      let v = courante[x];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      courante[x] = v & 0xff;
    }
    for (let x = 0; x < large; x++) {
      const s = x * canaux, d = (y * large + x) * 4;
      px[d] = courante[s];
      px[d + 1] = courante[s + 1];
      px[d + 2] = courante[s + 2];
      px[d + 3] = canaux === 4 ? courante[s + 3] : 255;
    }
    courante.copy(precedente);
  }
  return { large, haut, px };
}

/* --------------------------------------------------------------- PNG écrit */

function morceau(nom, donnees) {
  const entete = Buffer.alloc(8);
  entete.writeUInt32BE(donnees.length, 0);
  entete.write(nom, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(nom, "latin1"), donnees])), 0);
  return Buffer.concat([entete, donnees, crc]);
}

/** Réencode en PNG RGBA. Filtre 0 partout : `deflate` fait le gros du travail
 *  et un choix de filtre par ligne coûterait plus de code que d'octets. */
function encoder({ large, haut, px }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(large, 0);
  ihdr.writeUInt32BE(haut, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  const lignes = Buffer.alloc(haut * (large * 4 + 1));
  for (let y = 0; y < haut; y++) {
    lignes[y * (large * 4 + 1)] = 0;
    px.copy(lignes, y * (large * 4 + 1) + 1, y * large * 4, (y + 1) * large * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    morceau("IHDR", ihdr),
    morceau("IDAT", deflateSync(lignes, { level: 9 })),
    morceau("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------- détourage */

function clair(px, p) {
  const r = px[p], v = px[p + 1], b = px[p + 2];
  const bas = Math.min(r, v, b);
  if (bas >= BLANC) return true;
  return bas >= GRIS && Math.max(r, v, b) - bas <= NEUTRE;
}

/**
 * Un pixel appartient **certainement** au sujet : franchement sombre, ou
 * franchement coloré. C'est volontairement restrictif, ces points servent
 * d'ancres et une seule ancre fausse déforme l'enveloppe.
 */
const SUJET_SOMBRE = 190;
const SUJET_SATURE = 45;

function masqueSujet({ large, haut, px }) {
  const brut = new Uint8Array(large * haut);
  for (let i = 0; i < brut.length; i++) {
    const p = i * 4;
    const r = px[p], v = px[p + 1], b = px[p + 2];
    const bas = Math.min(r, v, b);
    if (bas < SUJET_SOMBRE || Math.max(r, v, b) - bas > SUJET_SATURE) brut[i] = 1;
  }

  /* Érosion d'un pixel : le bruit de compression sème des points isolés dans le
     cyclo, près de l'arête du boîtier, et un seul point aberrant tire
     l'enveloppe convexe jusqu'au bord de la photo. Un point qui n'a pas ses
     huit voisins avec lui n'est pas une ancre. */
  const sujet = new Uint8Array(brut.length);
  for (let y = 1; y < haut - 1; y++) {
    for (let x = 1; x < large - 1; x++) {
      const i = y * large + x;
      if (!brut[i]) continue;
      if (brut[i - 1] && brut[i + 1] && brut[i - large] && brut[i + large] &&
          brut[i - large - 1] && brut[i - large + 1] &&
          brut[i + large - 1] && brut[i + large + 1]) sujet[i] = 1;
    }
  }
  return sujet;
}

/**
 * Enveloppe convexe des ancres, rendue sous forme d'un intervalle de colonnes
 * par ligne. C'est la **forme du boîtier**, et elle règle le cas que la couleur
 * seule ne sait pas trancher.
 *
 * Une jaquette claire, `Les Spécialistes` et sa plage en plein soleil, touche
 * le cyclo sans arête distinguable : le remplissage y entre et ronge la
 * couverture, et le seul recours jusqu'ici était de refuser la photo. Or un
 * boîtier photographié de trois quarts est un **volume convexe**, et ses
 * parties sombres ou colorées, la tranche, le titre, les visages, suffisent à
 * en dessiner le contour. Le blanc qui tombe à l'intérieur de ce contour
 * appartient à la couverture, celui qui tombe dehors est du fond.
 *
 * L'intervalle par ligne suffit parce qu'un convexe coupe une horizontale en un
 * segment, jamais deux.
 */
function enveloppe({ large, haut }, sujet) {
  const points = [];
  for (let y = 0; y < haut; y++) {
    let g = -1, d = -1;
    for (let x = 0; x < large; x++) if (sujet[y * large + x]) { if (g < 0) g = x; d = x; }
    if (g >= 0) { points.push([g, y]); points.push([d, y]); }
  }
  if (points.length < 6) return null;

  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const croix = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chaine = (liste) => {
    const pile = [];
    for (const p of liste) {
      while (pile.length >= 2 && croix(pile[pile.length - 2], pile[pile.length - 1], p) <= 0) {
        pile.pop();
      }
      pile.push(p);
    }
    pile.pop();
    return pile;
  };
  const casque = [...chaine(points), ...chaine([...points].reverse())];
  if (casque.length < 3) return null;

  const gauche = new Int32Array(haut).fill(large);
  const droite = new Int32Array(haut).fill(-1);
  for (let k = 0; k < casque.length; k++) {
    const [x1, y1] = casque[k];
    const [x2, y2] = casque[(k + 1) % casque.length];
    const pas = y2 === y1 ? 0 : (x2 - x1) / (y2 - y1);
    const yA = Math.min(y1, y2), yB = Math.max(y1, y2);
    for (let y = yA; y <= yB; y++) {
      const x = Math.round(y1 === y2 ? x1 : x1 + (y - y1) * pas);
      if (x < gauche[y]) gauche[y] = x;
      if (x > droite[y]) droite[y] = x;
    }
    // Les sommets eux-mêmes, pour les arêtes horizontales.
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      if (x < gauche[y]) gauche[y] = x;
      if (x > droite[y]) droite[y] = x;
    }
  }
  return { gauche, droite };
}

/** Nombre de coins posés sur du fond clair, sur quatre. */
function coinsClairs({ large, haut, px }) {
  const c = Math.min(COIN, large >> 2, haut >> 2);
  const part = (x0, y0) => {
    let clairs = 0;
    for (let y = y0; y < y0 + c; y++) {
      for (let x = x0; x < x0 + c; x++) if (clair(px, (y * large + x) * 4)) clairs++;
    }
    return clairs / (c * c);
  };
  return [
    part(0, 0), part(large - c, 0), part(0, haut - c), part(large - c, haut - c),
  ].filter((p) => p >= PART_COIN).length;
}

/**
 * Cherche l'axe d'un reflet en miroir sous le sujet, et rend son ordonnée.
 *
 * Le studio pose souvent le boîtier sur un sol brillant : sous lui court une
 * copie retournée, plus sombre et floue. Elle est **claire et colorée**, donc
 * ni la règle du blanc ni celle du gris neutre ne l'attrapent, et le remplissage
 * s'arrête à son bord en laissant une bavure. C'est le seul défaut visible qui
 * restait sur les cinq planches détourées d'août.
 *
 * Ce qui le reconnaît n'est ni la couleur ni la clarté mais la **structure** :
 * un reflet est symétrique du sujet par rapport à une horizontale. On cherche
 * donc l'axe qui maximise la corrélation croisée normalisée entre les lignes
 * `axe - d` et `axe + d`. La NCC est employée exprès plutôt qu'une différence
 * absolue : le reflet est plus sombre et moins contrasté que l'original, une
 * différence pixel à pixel le manquerait, une corrélation le voit.
 *
 * Rend `null` s'il n'y a pas de reflet franc, et c'est le cas de figure
 * ordinaire : mieux vaut laisser un reflet que couper le bas d'un boîtier.
 */
/**
 * Seuil de corrélation, et **0,72 est un plancher éprouvé, pas un réglage à
 * baisser**.
 *
 * Le reflet des steelbooks Mario sort à 0,66, juste dessous, et la tentation de
 * descendre à 0,62 pour l'attraper a été essayée : à ce seuil l'axe gagnant
 * n'est plus le sol mais une symétrie de hasard **à l'intérieur de
 * l'illustration**, et deux planches sur huit se sont retrouvées coupées en
 * deux, boîtier compris. Un reflet laissé se répare à l'œil, un boîtier tranché
 * ne se rattrape pas.
 *
 * Ce qui manque pour descendre serait une preuve que l'axe est bien le sol,
 * une rupture de netteté ou un dégradé vers le fond sous l'axe, et non une
 * simple corrélation.
 */
const NCC_REFLET = 0.72;
const PART_REFLET = 0.08;

function axeDuReflet({ large, haut, px }, dehors) {
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
  const hauteur = yMax - yMin + 1;
  if (hauteur < 80 || xMax < xMin) return null;

  const lum = (i) => {
    const p = i * 4;
    return 0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2];
  };

  /* Sous-échantillonnage : sans lui la recherche coûte des milliards
     d'opérations sur une photo de 1 400 px, et un détourage qui prend une
     minute par visuel ne serait jamais lancé. */
  const pasX = Math.max(1, Math.round((xMax - xMin) / 90));
  const pasD = 4;

  let meilleur = null;
  let meilleurScore = 0;
  const departAxe = yMin + Math.round(hauteur * 0.35);
  for (let axe = departAxe; axe <= yMax - Math.round(hauteur * PART_REFLET); axe++) {
    const portee = Math.min(60, axe - yMin, yMax - axe);
    if (portee < 12) continue;

    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, k = 0;
    for (let d = 1; d <= portee; d += pasD) {
      for (let x = xMin; x <= xMax; x += pasX) {
        const iHaut = (axe - d) * large + x;
        const iBas = (axe + d) * large + x;
        if (dehors[iHaut] || dehors[iBas]) continue;
        const a = lum(iHaut), b = lum(iBas);
        sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; k++;
      }
    }
    if (k < 300) continue;

    const cov = sab / k - (sa / k) * (sb / k);
    const va = saa / k - (sa / k) ** 2;
    const vb = sbb / k - (sb / k) ** 2;
    if (va <= 1 || vb <= 1) continue;
    const ncc = cov / Math.sqrt(va * vb);
    if (ncc > meilleurScore) { meilleurScore = ncc; meilleur = axe; }
  }

  if (process.env.CARROUSEL_REFLET) {
    console.log(`    reflet : meilleure NCC ${meilleurScore.toFixed(2)} à y=${meilleur}`);
  }
  return meilleurScore >= NCC_REFLET ? meilleur : null;
}

/**
 * Rend une copie détourée, ou `null` si la photo n'est pas sur fond clair.
 *
 * Remplissage par diffusion depuis les bords, puis un passage de lissage : un
 * pixel resté opaque qui touche du transparent prend une alpha partielle, ce
 * qui évite l'escalier que laisse un masque binaire sur un bord antialiasé.
 */
export function detourer(image) {
  const coins = coinsClairs(image);
  if (coins < COINS_CLAIRS) return { refus: `${coins} coin(s) clair(s) sur 4` };

  const { large, haut, px } = image;
  const n = large * haut;
  const dehors = new Uint8Array(n);
  const file = new Int32Array(n);
  let tete = 0, queue = 0;

  /* **Rien ne s'enlève à l'intérieur de l'enveloppe.** La règle a d'abord été
     « seul le blanc pur y part », pour pouvoir vider aussi l'interstice entre
     deux boîtiers ; elle laissait passer les aplats blancs d'une illustration,
     qui sont purs eux aussi. Entre garder du blanc dans un interstice et ronger
     une couverture, le choix n'est pas symétrique. */
  const sujetMasque = masqueSujet(image);
  const forme = enveloppe(image, sujetMasque);
  if (process.env.CARROUSEL_FORME) {
    if (!forme) console.log("    forme : aucune enveloppe");
    else {
      let aire = 0, ancres = 0, lignes = 0;
      for (let y = 0; y < haut; y++) {
        if (forme.droite[y] < forme.gauche[y]) continue;
        lignes++;
        aire += forme.droite[y] - forme.gauche[y] + 1;
        for (let x = forme.gauche[y]; x <= forme.droite[y]; x++) {
          if (sujetMasque[y * large + x]) ancres++;
        }
      }
      console.log(
        `    forme : ${lignes}/${haut} lignes, ` +
        `ancres à ${((ancres / aire) * 100).toFixed(0)} % de l'enveloppe`);
    }
  }

  /* Pixels que la forme seule a retenus. Ils sont exclus de la mesure de
     frontière : leur clarté n'est pas l'aveu d'une limite ambiguë, c'est la
     preuve que le contour a fait son travail. */
  const stopForme = new Uint8Array(n);

  const pousser = (i) => {
    if (dehors[i]) return;
    const p = i * 4;
    if (!clair(px, p)) return;
    const x = i % large, y = (i / large) | 0;
    if (dansForme(x, y)) { stopForme[i] = 1; return; }
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

  /* Le reflet en miroir, coupé quand on le reconnaît vraiment. Voir
     `axeDuReflet` : il est retiré sur toute sa hauteur, pas atténué. */
  const axe = axeDuReflet(image, dehors);
  if (axe !== null) {
    for (let y = axe; y < haut; y++) {
      for (let x = 0; x < large; x++) {
        const i = y * large + x;
        if (!dehors[i]) { dehors[i] = 1; queue++; }
      }
    }
  }

  const sortie = Buffer.from(px);

  /**
   * Liseré blanc et bord en escalier, traités ensemble par une carte de
   * distance.
   *
   * Deux défauts distincts se voyaient au zoom 4× sur le bord du boîtier, et un
   * lissage sur un seul pixel n'en réglait aucun.
   *
   * Le **liseré** : le remplissage s'arrête sur la dernière rangée de pixels
   * encore contaminée par le fond, celle où la compression JPEG a mélangé le
   * blanc et l'arête. Elle reste opaque, et sur une planche bleu nuit elle
   * dessine un trait clair tout autour du boîtier. On l'enlève en **érodant**
   * le masque de deux pixels : c'est invisible sur un boîtier de mille pixels
   * de haut, et ça retire exactement la zone contaminée.
   *
   * L'**escalier** : le masque est binaire, donc ses diagonales montent en
   * marches d'un pixel. On rend l'alpha progressive sur deux pixels de plus,
   * proportionnelle à la distance au fond.
   *
   * La distance est calculée une fois par diffusion en largeur depuis le fond,
   * plafonnée à ce dont on a besoin. Un lissage par comptage de voisins, essayé
   * d'abord, ne sait faire qu'un pixel et ne peut pas éroder.
   */
  const EROSION = 2;
  const ADOUCI = 2;
  const PLAFOND_DIST = EROSION + ADOUCI + 1;

  const dist = new Uint8Array(n);
  let t2 = 0, q2 = 0;
  for (let i = 0; i < n; i++) if (dehors[i]) file[q2++] = i;
  while (t2 < q2) {
    const i = file[t2++];
    const d = dist[i];
    if (d >= PLAFOND_DIST) continue;
    const x = i % large, y = (i / large) | 0;
    const voir = (j) => {
      if (dehors[j] || dist[j]) return;
      dist[j] = d + 1;
      file[q2++] = j;
    };
    if (x > 0) voir(i - 1);
    if (x < large - 1) voir(i + 1);
    if (y > 0) voir(i - large);
    if (y < haut - 1) voir(i + large);
  }

  for (let i = 0; i < n; i++) {
    if (dehors[i]) { sortie[i * 4 + 3] = 0; continue; }
    const d = dist[i];
    /* `dist` vaut 0 sur les pixels que la diffusion n'a jamais atteints, donc
       le cœur du sujet : ils restent pleinement opaques. */
    if (d === 0) continue;
    sortie[i * 4 + 3] = d <= EROSION
      ? 0
      : Math.min(255, Math.round((255 * (d - EROSION)) / (ADOUCI + 1)));
  }

  /* Frontière : pixels gardés qui touchent le fond retiré. Mesurée avant le
     lissage, qui rendrait la comparaison flottante. */
  let sommeFrontiere = 0, nFrontiere = 0, blanchesFrontiere = 0;
  for (let y = 1; y < haut - 1; y++) {
    for (let x = 1; x < large - 1; x++) {
      const i = y * large + x;
      if (dehors[i]) continue;
      if (!dehors[i - 1] && !dehors[i + 1] && !dehors[i - large] && !dehors[i + large]) continue;
      if (stopForme[i]) continue;
      const p = i * 4;
      const bas = Math.min(px[p], px[p + 1], px[p + 2]);
      sommeFrontiere += bas;
      if (bas >= 232) blanchesFrontiere++;
      nFrontiere++;
    }
  }
  const frontiere = nFrontiere ? sommeFrontiere / nFrontiere : 0;
  const partBlanche = nFrontiere ? blanchesFrontiere / nFrontiere : 0;

  /* Le contrôle de frontière claire ne vaut que **faute d'enveloppe**. C'était
     un substitut : ne sachant pas où finissait le boîtier, on lisait dans une
     frontière claire l'aveu d'une limite ambiguë. Quand la forme est connue, le
     remplissage ne peut plus mordre par construction, et la même frontière
     claire ne dit plus qu'une chose, que la jaquette est claire. Le garder
     refusait `Les Spécialistes` alors que rien n'avait été rongé. */
  if (forme === null && frontiere > FRONTIERE_CLAIRE) {
    return { refus: `frontière claire (${frontiere.toFixed(0)}), la limite du boîtier est ambiguë` };
  }
  /* Même raison : avec une enveloppe, une frontière blanche est du fond resté
     volontairement à l'intérieur du contour, pas une bavure. Le reflet, lui, a
     son propre contrôle, `axeDuReflet`. */
  if (forme === null && partBlanche > PART_FRONTIERE_BLANCHE) {
    return {
      refus: `${(partBlanche * 100).toFixed(0)} % de frontière quasi blanche, ` +
        `reflet ou fond resté collé au sujet`,
    };
  }

  const restants = n - queue;

  /* Un remplissage qui avale presque tout a mordu sur le sujet : une jaquette
     blanche sans liseré, par exemple. Mieux vaut la photo d'origine qu'un
     boîtier à moitié effacé, et le refus se dit plutôt que de se taire. */
  if (restants < n * 0.04) {
    return { refus: `sujet réduit à ${((restants / n) * 100).toFixed(0)} %` };
  }

  /* Second contrôle, celui qui attrape la fuite dans l'illustration : la zone
     opaque doit remplir son propre rectangle englobant. Une morsure y ouvre un
     trou, et le rapport s'effondre. */
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
  const aireBoite = (xMax - xMin + 1) * (yMax - yMin + 1);
  const plein = restants / aireBoite;
  if (plein < PART_PLEINE) {
    return { refus: `remplissage ${(plein * 100).toFixed(0)} %, le fond a mordu dans le sujet` };
  }

  return { large, haut, px: sortie, garde: restants / n, plein };
}

/**
 * Chaîne complète : n'importe quel format en entrée, PNG détouré en sortie.
 *
 * **Un refus dit pourquoi.** C'est la règle du §9 appliquée à une image : un
 * visuel qu'on croyait détouré et qui ne l'est pas se lit comme une panne du
 * détourage, alors que c'est le plus souvent une décision, un fond noir ou une
 * morsure évitée. L'appelant garde l'original dans tous les cas.
 */
export function detourerFichier(buf, travail, nom) {
  let image;
  try {
    const entree = join(travail, `${nom}.src`);
    const png = join(travail, `${nom}.png`);
    writeFileSync(entree, buf);
    execFileSync("sips", ["--setProperty", "format", "png", entree, "--out", png],
      { stdio: "ignore" });
    image = decoder(readFileSync(png));
    rmSync(entree, { force: true });
    rmSync(png, { force: true });
  } catch (erreur) {
    return { refus: `lecture impossible : ${erreur.message}` };
  }

  const detoure = detourer(image);
  if (detoure.refus) return detoure;
  return { buf: encoder(detoure), garde: detoure.garde, plein: detoure.plein };
}
