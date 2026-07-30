import type { StatutValue } from "./reelio-db";

/**
 * Vestige en lecture seule des listes constituées avant les comptes.
 *
 * Le site n'écrit plus rien ici : toute action demande désormais un compte, et
 * les listes vivent dans `public.collections`. Ce module ne sert plus qu'à
 * reprendre une fois ce qui existait, à la première connexion
 * (cf. `fusionner` dans lib/collections.ts), puis à l'effacer.
 *
 * À supprimer le jour où plus personne n'a de reliquat — c'est-à-dire jamais
 * avec certitude, d'où le maintien.
 */

const KEY = "jaquette_statuts";
const KEY_HISTORIQUE = "boxology_statuts";

/**
 * Reprend la collection enregistrée sous l'ancien nom du site.
 * Sans ça, le changement de nom effacerait les listes déjà constituées.
 */
function migrer(): void {
  try {
    if (localStorage.getItem(KEY) !== null) return;
    const ancien = localStorage.getItem(KEY_HISTORIQUE);
    if (ancien === null) return;
    localStorage.setItem(KEY, ancien);
    localStorage.removeItem(KEY_HISTORIQUE);
  } catch {
    /* stockage indisponible : rien à migrer */
  }
}

export function readStatuts(): Record<number, StatutValue> {
  try {
    migrer();
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Efface la copie locale, une fois qu'elle a été reprise dans un compte
 * (cf. `fusionner` dans lib/collections.ts). Laisser les deux dépôts en place
 * donnerait un instantané figé, réaffiché après déconnexion comme s'il était à
 * jour.
 */
export function viderStatutsLocaux(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}

