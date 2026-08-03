import { getEditionsByIds, type EditionWithFilm, type StatutValue } from "./reelio-db";
import { idsParStatut } from "./collections";

/**
 * Export CSV de la collection et des envies.
 *
 * **Pourquoi ça existe.** Le relevé des attentes du 2 août 2026 met la perte de
 * données au deuxième rang des griefs contre les applications concurrentes, par
 * volume d'avis : des collections de sept à neuf cents titres effacées après
 * une mise à jour, aucune récupération, service client muet. Movie Collector
 * réserve l'export à sa version Pro, et un avis relève que les codes-barres n'y
 * sont ni consultables ni exportables.
 *
 * **Il ne sera jamais payant.** Le grief numéro un contre ces applications
 * n'est pas le fait de payer, c'est le mur surgi en cours de route et la
 * licence reprise. Gager l'export ou la sauvegarde transformerait l'argument
 * de confiance en son contraire.
 */

/** Colonnes, dans l'ordre où elles sont écrites. */
const COLONNES = [
  "statut", "film", "annee", "realisateur", "edition", "formats",
  "editeur", "distributeur", "ean", "zone", "date_parution", "fiche",
] as const;

const LIBELLE: Record<StatutValue, string> = {
  possede: "possédé",
  envie: "envie",
};

/**
 * Le point-virgule plutôt que la virgule.
 *
 * RFC 4180 dit la virgule, mais Excel en locale française attend le
 * point-virgule et met sinon toute la ligne dans une seule cellule. Le public
 * de ce site est francophone et ouvrira le fichier d'un double-clic ; Numbers
 * et LibreOffice acceptent les deux. Le format prime sur la norme quand la
 * norme rend le fichier illisible pour presque tout le monde.
 */
const SEP = ";";

/**
 * Neutralise l'injection de formule.
 *
 * Un tableur exécute une cellule qui commence par `=`, `+`, `-`, `@`, et nos
 * titres viennent de catalogues marchands, pas de nous : rien ne garantit
 * qu'aucun ne commence par l'un de ces caractères. L'apostrophe de tête est la
 * parade standard, elle ne s'affiche pas dans Excel.
 */
function neutraliser(valeur: string): string {
  return /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur;
}

/** Échappement CSV : guillemets doublés, champ encadré s'il en a besoin. */
function champ(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "";
  const brut = neutraliser(String(valeur));
  return /["\n\r;,]/.test(brut) ? `"${brut.replace(/"/g, '""')}"` : brut;
}

function liste(valeur: unknown): string {
  if (Array.isArray(valeur)) return valeur.filter(Boolean).join(", ");
  return valeur ? String(valeur) : "";
}

function ligne(statut: StatutValue, e: EditionWithFilm, origine: string): string {
  const film = e.film;
  const slug = film?.slug ? `${film.slug}/` : "";
  return [
    LIBELLE[statut],
    film?.titre ?? "",
    // L'année vit sur le film, jamais sur l'édition : `date_parution` date le
    // disque, pas l'œuvre, et les confondre donnerait 2026 pour un film de 1960.
    (film as { annee?: unknown } | null)?.annee ?? "",
    (film as { realisateur?: unknown } | null)?.realisateur ?? "",
    e.titre ?? "",
    liste(e.formats_extraits),
    e.editeur ?? "",
    e.distributeur ?? "",
    // **L'EAN part tel quel, et Excel le massacrera** en le lisant comme un
    // nombre : 3512394015968 devient 3,51239E+12. La parade serait une formule
    // `="…"`, qui s'affiche littéralement partout ailleurs et rouvre justement
    // l'injection qu'on vient de fermer. Le fichier reste juste ; c'est à
    // l'import qu'on déclare la colonne en texte.
    e.ean ?? "",
    e.region ?? "",
    e.date_parution ?? "",
    film ? `${origine}/movies/${slug}${film.id}` : "",
  ].map(champ).join(SEP);
}

export interface ExportCsv {
  nom: string;
  contenu: string;
  lignes: number;
}

/**
 * Construit le CSV des deux listes. Rend `lignes: 0` si elles sont vides,
 * l'appelant décidant quoi en dire.
 *
 * Les deux listes sont dans **un seul fichier**, distinguées par la colonne
 * `statut` : deux fichiers obligeraient à les rapprocher soi-même, et un
 * tableur filtre une colonne en deux clics.
 */
export async function exporterCollectionCsv(origine: string): Promise<ExportCsv> {
  const [possede, envie] = await Promise.all([
    idsParStatut("possede"),
    idsParStatut("envie"),
  ]);

  const tous = [...new Set([...possede, ...envie])];
  const editions = await getEditionsByIds(tous);
  const parId = new Map(editions.map((e) => [e.id, e]));

  const lignes: string[] = [];
  for (const [statut, ids] of [["possede", possede], ["envie", envie]] as const) {
    for (const id of ids) {
      const e = parId.get(id);
      // Une édition supprimée du catalogue depuis l'ajout ne doit pas faire
      // sauter l'export : on la passe, le reste vaut d'être sauvé.
      if (e) lignes.push(ligne(statut, e, origine));
    }
  }

  const jour = new Date().toISOString().slice(0, 10);
  return {
    nom: `jaquette-collection-${jour}.csv`,
    // **Le BOM est indispensable.** Sans lui, Excel lit un CSV UTF-8 en
    // Windows-1252 et rend « Amélie » en « AmÃ©lie ». Les autres tableurs
    // l'ignorent.
    contenu: "﻿" + [COLONNES.join(SEP), ...lignes].join("\r\n") + "\r\n",
    lignes: lignes.length,
  };
}

/**
 * Déclenche le téléchargement dans le navigateur.
 *
 * Un `Blob` et une URL d'objet plutôt qu'un `data:` : au-delà de quelques
 * dizaines de kilooctets, une URL `data:` est refusée par certains
 * navigateurs, et une collection de mille titres les dépasse largement.
 */
export function telecharger({ nom, contenu }: ExportCsv): void {
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  // Sans révocation, le blob reste en mémoire jusqu'au rechargement de la page.
  URL.revokeObjectURL(url);
}
