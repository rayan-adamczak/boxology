/**
 * Chemins d'URL du site, et redirections depuis leurs anciennes formes.
 *
 * Les adresses sont en anglais depuis le 1er août 2026, alors que le site est
 * en français et vise le marché français. C'est un choix de forme, pas de
 * référencement : le mot-clé dans l'URL est un facteur de classement quasi nul,
 * et ce qui compte, la structure et le maillage, ne change pas.
 *
 * Module **sans aucune dépendance**, comme `pagination.ts` et pour la même
 * raison : `functions/_middleware.ts` l'importe pour servir les 301, et
 * l'application l'importe pour ses routes. Deux tables qui divergeraient
 * produiraient des redirections vers des pages qui n'existent pas.
 *
 * `/formats` et `/genres` ne bougent pas, les mots sont les mêmes dans les deux
 * langues.
 */

/** Préfixe des fiches films. Anciennement `/films`. */
export const BASE_FILMS = "/movies";

/**
 * Anciennes adresses vers les nouvelles, pour les pages sans paramètre.
 *
 * Les préfixes à segments, `/films/…` et `/editeurs/…`, ne sont pas ici : ils
 * demandent de reconstruire la suite du chemin, ce que fait `redirectionDe`.
 */
export const PAGES_RENOMMEES: Record<string, string> = {
  "/bienvenue": "/welcome",
  "/a-propos": "/about",
  "/mentions-legales": "/legal",
  "/confidentialite": "/privacy",
  "/profil": "/profile",
  "/compte": "/account",
};

/** Préfixes renommés, segment de tête seulement. */
const PREFIXES_RENOMMES: Record<string, string> = {
  films: "movies",
  editeurs: "publishers",
};

/**
 * Nouvelle adresse d'un chemin ancien, ou null s'il n'a pas bougé.
 *
 * Rend le chemin seul, sans origine ni chaîne de recherche : l'appelant les
 * rattache, parce que la Pages Function doit conserver `?utm_source=…` là où
 * une redirection côté client n'en a pas besoin.
 */
export function redirectionDe(chemin: string): string | null {
  const exact = PAGES_RENOMMEES[chemin.replace(/\/+$/, "") || "/"];
  if (exact) return exact;

  const segments = chemin.split("/").filter(Boolean);
  const neuf = segments.length > 0 ? PREFIXES_RENOMMES[segments[0]] : undefined;
  if (!neuf) return null;
  return `/${[neuf, ...segments.slice(1)].join("/")}`;
}
