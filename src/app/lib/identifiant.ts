/**
 * L'identifiant public d'un compte, le « @ », et l'adresse qu'il ouvre.
 *
 * Module **sans aucune dépendance**, comme `chemins.ts` et `pagination.ts`, et
 * pour la même raison : `functions/_middleware.ts` l'importe pour servir
 * `/u/<identifiant>` à la périphérie, et l'application l'importe pour ses
 * routes et ses liens. Deux tables qui divergeraient produiraient des adresses
 * que l'un des deux ne saurait pas résoudre.
 *
 * **Ce qui fait autorité est en base**, pas ici : la forme est aussi une
 * contrainte de `public.profils`, la liste des identifiants réservés n'existe
 * qu'en SQL, et la disponibilité se demande à `etat_identifiant`. Ce qui suit
 * ne sert qu'à répondre tout de suite sur ce qui se voit à l'œil, une saisie
 * trop courte ou un signe interdit, sans un aller-retour par frappe.
 */

/**
 * Minuscules, chiffres et souligné, 3 à 20 signes.
 *
 * Recopié de la contrainte `profils_identifiant_forme`. C'est la seule chose
 * qui existe en double, et elle est stable : la liste réservée et la
 * disponibilité, elles, restent en base.
 *
 * Pas de tiret : il se confond avec le souligné à l'oral comme dans certaines
 * polices, et un identifiant se dicte.
 */
export const FORME_IDENTIFIANT = /^[a-z0-9_]{3,20}$/;

export const IDENTIFIANT_MIN = 3;
export const IDENTIFIANT_MAX = 20;

/** La forme est-elle acceptable ? Ne dit rien de la disponibilité. */
export function identifiantBienForme(valeur: string): boolean {
  return FORME_IDENTIFIANT.test(valeur);
}

/**
 * Ramène une saisie à la forme acceptée, sans jamais la refuser.
 *
 * Appliqué à chaque frappe : quelqu'un qui tape « Jean-Luc » doit voir
 * `jean_luc` apparaître, pas un message d'erreur. Les accents sont repliés
 * avant le filtrage, sinon `José` rendrait `jos` au lieu de `jose`, le même
 * piège que la normalisation ASCII du §9.
 *
 * La coupure à 20 signes est faite ici et pas seulement à l'envoi : un champ
 * qui accepte trente signes puis rejette est plus désagréable qu'un champ qui
 * s'arrête.
 */
export function normaliserIdentifiant(brut: string): string {
  return brut
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+/, "")
    .slice(0, IDENTIFIANT_MAX);
}

/**
 * Une proposition d'identifiant à partir du nom du compte Google.
 *
 * Prérempli à la création : l'écran demande une décision, il ne doit pas
 * demander une invention. Le souligné final est retiré, il ne se voit pas et
 * se recopie mal.
 *
 * Rend une chaîne vide quand il ne reste rien d'utilisable, un nom en
 * japonais ou en hébreu par exemple. L'appelant présente alors un champ vide
 * plutôt qu'une proposition absurde, comme les 16 films à titre non latin dont
 * le slug retombe sur la forme nue (§7).
 */
export function suggererIdentifiant(nom: string): string {
  const propose = normaliserIdentifiant(nom).replace(/_+$/, "");
  return propose.length >= IDENTIFIANT_MIN ? propose : "";
}

/** `/u/rayan`. Le « @ » s'affiche, il n'entre pas dans le chemin. */
export function cheminProfil(identifiant: string): string {
  return `/u/${identifiant}`;
}

/**
 * `@rayan` pour l'affichage.
 *
 * Une fonction plutôt qu'un `@` recopié dans chaque composant : c'est le seul
 * endroit à changer si la marque du site devait un jour ne plus être l'arobase.
 */
export function arobase(identifiant: string): string {
  return `@${identifiant}`;
}
