/**
 * Lecture et écriture de PNG, sans dépendance.
 *
 * `sips`, livré avec macOS, normalise n'importe quelle source en PNG 8 bits non
 * entrelacé ; le décodage et le réencodage tiennent dans `zlib`, que Node porte
 * déjà. Le dépôt a fabriqué un `.ico` à la main faute d'ImageMagick (§8), c'est
 * le même parti.
 *
 * Partagé par `detourer.mjs` et `cadrer.mjs` : deux copies d'un défiltreur PNG
 * dériveraient sans que ça se voie, et le §6 en garde assez d'exemples.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

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

export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Décode un PNG 8 bits non entrelacé, couleur ou couleur+alpha, en RGBA. */
export function decoder(buf) {
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
export function encoder({ large, haut, px }) {
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

/**
 * N'importe quel format en entrée, image RGBA décodée en sortie.
 * Lève si `sips` manque ou si le fichier n'est pas une image.
 */
export function lireImage(buf, travail, nom) {
  const entree = join(travail, `${nom}.src`);
  const png = join(travail, `${nom}.png`);
  writeFileSync(entree, buf);
  execFileSync("sips", ["--setProperty", "format", "png", entree, "--out", png],
    { stdio: "ignore" });
  const image = decoder(readFileSync(png));
  rmSync(entree, { force: true });
  rmSync(png, { force: true });
  return image;
}
