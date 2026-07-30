import type { StatutValue } from "./reelio-db";

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

function write(data: Record<number, StatutValue>): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getStatusForEditions(editionIds: number[]): Record<number, StatutValue> {
  const all = readStatuts();
  const result: Record<number, StatutValue> = {};
  for (const id of editionIds) {
    if (all[id] !== undefined) result[id] = all[id];
  }
  return result;
}

export function setStatutLocal(editionId: number, statut: StatutValue): void {
  const all = readStatuts();
  all[editionId] = statut;
  write(all);
}

export function removeStatutLocal(editionId: number): void {
  const all = readStatuts();
  delete all[editionId];
  write(all);
}

export function toggleStatutLocal(editionId: number, statut: StatutValue): StatutValue | null {
  const all = readStatuts();
  if (all[editionId] === statut) {
    delete all[editionId];
    write(all);
    return null;
  }
  all[editionId] = statut;
  write(all);
  return statut;
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

export function getEditionIdsByStatut(statut: StatutValue): number[] {
  const all = readStatuts();
  return Object.entries(all)
    .filter(([, v]) => v === statut)
    .map(([k]) => Number(k));
}
