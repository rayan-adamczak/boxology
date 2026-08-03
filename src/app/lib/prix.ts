/**
 * Prix éditeur : lecture, devise, mise en forme.
 *
 * `editions.prix_editeur` est du **texte**, `24.99` ou `29.0`, et surtout il
 * n'est pas dans la même monnaie selon la source. Zavvi est une boutique
 * britannique : ses 4 446 prix sont en **livres**, et les afficher en euros
 * serait faux sur près de la moitié des éditions valorisées. D'où cette
 * fonction plutôt qu'un `${prix} €` posé sur place.
 *
 * Couverture au 3 août 2026, sur 16 923 éditions :
 *
 *     zavvi.com             4 446   livres
 *     metalunastore.fr      3 949   euros
 *     editioncollector.fr   1 482   euros
 *     lechatquifume.com       212   euros
 *     bluray.com                0   la source ne publie pas de prix
 *
 * **C'est un prix conseillé, jamais une cote.** Il vaut ce qu'il valait à la
 * sortie du disque : un steelbook épuisé se revend plus cher, un fond de bac
 * beaucoup moins. Le §8 garde la valorisation d'une collection en chantier
 * ouvert pour cette raison.
 */

/** Sources dont les prix sont en livres. Tout le reste est en euros. */
const SOURCES_LIVRES = new Set(["zavvi.com"]);

export function prixNumerique(brut: unknown): number | null {
  if (typeof brut !== "string" && typeof brut !== "number") return null;
  const nombre = Number(String(brut).replace(",", ".").replace(/[^\d.]/g, ""));
  // `0.0` existe chez Le Chat qui fume : un prix nul n'est pas un prix.
  return Number.isFinite(nombre) && nombre > 0 ? nombre : null;
}

export function devise(source: string | null | undefined): "EUR" | "GBP" {
  return source && SOURCES_LIVRES.has(source) ? "GBP" : "EUR";
}

/** `24,99 €` ou `9,99 £`. Rend `null` quand il n'y a pas de prix lisible. */
export function formaterPrix(brut: unknown, source: string | null | undefined): string | null {
  const nombre = prixNumerique(brut);
  if (nombre === null) return null;
  return nombre.toLocaleString("fr-FR", {
    style: "currency",
    currency: devise(source),
    // `narrowSymbol` sans quoi la locale française écrit « 8,99 £GB », la livre
    // n'étant pas sa monnaie : elle la désambiguïse par le code pays.
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  });
}

/**
 * Le prix en euros, ou `null` s'il est dans une autre monnaie.
 *
 * Sert aux totaux : additionner des livres à des euros donnerait un nombre qui
 * ne veut rien dire, et aucune conversion n'est possible sans taux daté, qu'on
 * n'a pas et qu'on n'ira pas chercher pour une estimation.
 */
export function prixEnEuros(brut: unknown, source: string | null | undefined): number | null {
  if (devise(source) !== "EUR") return null;
  return prixNumerique(brut);
}
