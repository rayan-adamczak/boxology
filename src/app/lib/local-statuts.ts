import type { StatutValue } from "./reelio-db";

const KEY = "boxology_statuts";

export function readStatuts(): Record<number, StatutValue> {
  try {
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

export function getEditionIdsByStatut(statut: StatutValue): number[] {
  const all = readStatuts();
  return Object.entries(all)
    .filter(([, v]) => v === statut)
    .map(([k]) => Number(k));
}
