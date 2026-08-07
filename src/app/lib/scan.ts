import { supabase } from "./supabase";
import type { Edition, Film } from "./reelio-db";
// `?url` fait émettre le fichier tel quel et rend son chemin haché, sans
// l'inliner. Voir `creerDetecteur` pour ce que ça évite.
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

/**
 * Lire un code-barres avec la caméra, et retrouver le disque.
 *
 * **C'est la fonction la plus demandée du relevé du 2 août 2026 (§8)**, et elle
 * était bloquée par la couverture EAN, pas par le lecteur : 26,5 % le 3 août, un
 * scan qui échoue trois fois sur quatre est pire que pas de scan. Elle est
 * **mesurée à 48,0 % le 7 août 2026**, 14 253 codes valides sur 29 701 éditions,
 * après l'entrée du DVD au catalogue. Un scan sur deux aboutit, et l'autre part
 * vers `/report`, qui est précisément le couple que le §8 réclame.
 *
 * **Le scan désambiguïse là où l'import ne peut pas.** Un fichier importé donne
 * un titre, donc un film, donc parfois quatorze éditions entre lesquelles
 * personne ne sait choisir. Un code-barres désigne **le disque qu'on a dans la
 * main**, sans le moindre doute. C'est la supériorité de cette fonction et il
 * faut la garder : on cherche donc dans `editions`, jamais via la route `/ean/`
 * du middleware, qui redirige vers le film.
 */

/* ------------------------------------------------------------- détecteur - */

/** Ce qu'on sait lire. Un boîtier de disque porte un EAN 13, parfois un UPC A. */
const FORMATS = ["ean_13", "upc_a"] as const;

export interface Detecteur {
  /** Les codes lisibles dans l'image, souvent aucun. */
  lire(source: CanvasImageSource): Promise<string[]>;
  /** Vrai quand c'est l'implémentation du navigateur, faux pour le repli WASM. */
  natif: boolean;
}

interface ApiDetecteur {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

interface ConstructeurDetecteur {
  new (options: { formats: readonly string[] }): ApiDetecteur;
  getSupportedFormats?: () => Promise<string[]>;
}

/**
 * Le détecteur du navigateur quand il existe, le repli WebAssembly sinon.
 *
 * **Safari et tous les navigateurs iOS n'implémentent pas `BarcodeDetector`**,
 * WebKit ne le porte pas, et Firefox non plus. S'en tenir au natif reviendrait à
 * ne livrer le scan qu'à Chrome sur Android, c'est-à-dire à écarter la moitié
 * des téléphones du marché français.
 *
 * Le repli est `barcode-detector`, qui expose la même API et s'appuie sur
 * zxing-wasm. Il est chargé en `import()` : un mégaoctet de WebAssembly n'a rien
 * à faire dans le bundle initial, et cette page n'est pas un chemin de
 * consultation au sens du §9, personne n'y arrive depuis un moteur.
 */
export async function creerDetecteur(): Promise<Detecteur> {
  const natif = (globalThis as { BarcodeDetector?: ConstructeurDetecteur }).BarcodeDetector;

  if (natif) {
    try {
      // La classe peut exister sans connaître l'EAN 13 : on demande la liste
      // plutôt que de supposer, et on retombe sur le repli si elle manque.
      const connus = (await natif.getSupportedFormats?.()) ?? [];
      if (connus.includes("ean_13")) {
        /*
          On n'exige que ce qu'il déclare savoir lire.

          Mesuré sur Chromium : `upc_a` n'est **pas** dans sa liste, il n'y a
          que `upc_e`. Il ne se plaint pas quand on le demande quand même, mais
          une autre implémentation lèverait, et on basculerait alors sur un
          mégaoctet de WebAssembly pour rien.

          Rien n'est perdu au passage : un UPC-A **est** un EAN 13 avec un zéro
          devant, et c'est ainsi que les lecteurs le rendent. `normaliserCode`
          remet ce zéro.
        */
        const demandes = FORMATS.filter((f) => connus.includes(f));
        const instance = new natif({ formats: demandes });
        return {
          natif: true,
          lire: async (source) => (await instance.detect(source)).map((c) => c.rawValue),
        };
      }
    } catch {
      // Certaines implémentations lèvent à la construction plutôt que de
      // déclarer leur absence. Le repli couvre ce cas comme les autres.
    }
  }

  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/pure");

  /*
    **Le WebAssembly est servi par nous, jamais par un CDN.**

    zxing-wasm va chercher son `.wasm` sur `fastly.jsdelivr.net` par défaut. Deux
    raisons de ne pas le laisser faire, et la première suffirait : la CSP
    n'autorise en `connect-src` que le projet Supabase, donc la requête ne
    partirait même pas, et le §10 a sorti le site de toute dépendance à un tiers
    pour ses fichiers, precisément pour qu'une décision extérieure ne puisse pas
    tout casser du jour au lendemain.

    Vite émet le fichier dans `/assets/` avec son empreinte, donc il est couvert
    par la règle de cache existante.

    Signature du défaut si cette ligne saute : la caméra s'ouvre, rien n'est
    jamais détecté, et la console montre une violation `connect-src`. C'est le
    symptôme du §3, zéro octet et zéro statut.
  */
  prepareZXingModule({
    overrides: { locateFile: () => wasmUrl },
    fireImmediately: false,
  });

  const instance = new BarcodeDetector({ formats: [...FORMATS] });
  return {
    natif: false,
    lire: async (source) => (await instance.detect(source)).map((c) => c.rawValue),
  };
}

/* ------------------------------------------------------------- validité -- */

/**
 * Clé de contrôle EAN 13.
 *
 * Une lecture de caméra peut rendre douze chiffres justes et un faux sur un
 * boîtier abîmé ou un reflet. La clé coûte une addition et évite d'aller
 * demander à la base un code qui n'existe nulle part.
 */
export function eanValide(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let somme = 0;
  for (let i = 0; i < 12; i++) {
    somme += Number(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (somme % 10)) % 10 === Number(code[12]);
}

/**
 * Un UPC A tient sur douze chiffres et devient un EAN 13 avec un zéro devant.
 *
 * Les disques du marché américain, ceux que le §5 assume au catalogue avec
 * Criterion, portent souvent un UPC : sans cette conversion, ils ne
 * correspondraient à aucune ligne alors que leur code est en base.
 */
export function normaliserCode(code: string): string {
  const chiffres = code.replace(/\D/g, "");
  return chiffres.length === 12 ? `0${chiffres}` : chiffres;
}

/**
 * Un code en `2xxxxxxxxxxxx` n'identifie rien hors du magasin.
 *
 * Préfixe GS1 20-29, circulation restreinte, attribué en interne par une
 * enseigne. Le §9 le consigne déjà pour la déduplication, et treize éditions du
 * catalogue n'ont que ça pour code. Le dire vaut mieux que de rendre « inconnu ».
 */
export function codeMagasin(code: string): boolean {
  return /^2\d{12}$/.test(code);
}

/* --------------------------------------------------------------- lecture - */

export interface EditionScannee extends Edition {
  films: Pick<Film, "id" | "titre" | "slug" | "annee" | "affiche_url" | "realisateur">[];
}

interface LigneScannee extends Edition {
  edition_films: {
    film: Pick<Film, "id" | "titre" | "slug" | "annee" | "affiche_url" | "realisateur"> | null;
  }[] | null;
}

/**
 * Les éditions portant ce code-barres.
 *
 * **Rend une liste, jamais une édition.** Cinq codes du catalogue sont portés
 * par deux éditions au 7 août 2026 : rendre la première serait choisir au
 * hasard, et le §9 interdit d'écrire un lien qu'on ne sait pas vrai.
 *
 * Le film passe par `edition_films` et non par `editions.film_id`, qui est un
 * vestige nul sur 858 lignes (§3, §4).
 */
export async function editionsParEan(code: string): Promise<EditionScannee[]> {
  const { data, error } = await supabase
    .from("editions")
    // Une seule chaîne littérale : `postgrest-js` infère le type de la réponse
    // depuis le texte du `select`, et une concaténation le lui rend opaque.
    .select("*, edition_films(film:films(id,titre,slug,annee,affiche_url,realisateur))")
    .eq("ean", code)
    .limit(10);
  if (error) throw new Error(`Lecture du code-barres impossible : ${error.message}`);

  return ((data ?? []) as unknown as LigneScannee[]).map(
    ({ edition_films: liens, ...edition }) => ({
      ...(edition as Edition),
      films: (liens ?? []).map((l) => l.film).filter(Boolean) as EditionScannee["films"],
    }),
  );
}
