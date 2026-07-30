import { identiteCourante } from "./auth";
import { readStatuts, viderStatutsLocaux } from "./local-statuts";
import type { StatutValue } from "./reelio-db";
import { clientAuthentifie } from "./supabase";

/**
 * Collection et envies, rattachées à un compte.
 *
 * Le catalogue se consulte sans compte — c'est ce qui permet aux fiches films
 * d'être indexées. Mais toute action en demande un : une liste doit appartenir
 * à quelqu'un pour survivre à un vidage de cache et suivre d'un appareil à
 * l'autre.
 *
 * Sans session, les lectures rendent donc du vide et les écritures lèvent
 * `CompteRequis`, que l'interface intercepte pour ouvrir la modale de connexion
 * plutôt que d'échouer en silence.
 */

/** PostgREST ne renvoie jamais plus de 1 000 lignes d'un coup. */
const PAGE = 1000;

/** Levée quand une action est tentée sans compte. */
export class CompteRequis extends Error {
  constructor() {
    super("Un compte est nécessaire pour cette action.");
    this.name = "CompteRequis";
  }
}

/**
 * Reprise des listes constituées avant les comptes.
 *
 * Le site n'écrit plus dans localStorage, mais des listes y dorment encore chez
 * ceux qui ont utilisé le site avant. Sans cette reprise, se connecter donnerait
 * l'impression d'avoir tout perdu.
 *
 * En cas de désaccord sur une même édition, le local gagne : il reflète le
 * dernier geste posé, sur l'appareil qu'on a en main.
 */
async function fusionner(jeton: string, userId: string): Promise<void> {
  const locaux = readStatuts();
  const ids = Object.keys(locaux);
  if (ids.length === 0) return;

  const lignes = ids.map((id) => ({
    user_id: userId,
    edition_id: Number(id),
    statut: locaux[Number(id)],
  }));

  // `merge-duplicates` fait de l'upsert sur la clé primaire (user_id,
  // edition_id) : c'est ce qui donne la priorité au local.
  const { error } = await clientAuthentifie(jeton)
    .from("collections")
    .upsert(lignes, { onConflict: "user_id,edition_id" });
  if (error) throw new Error(`Reprise des listes locales impossible : ${error.message}`);

  viderStatutsLocaux();
}

/**
 * Garantit que la reprise a eu lieu une fois par session de navigation.
 *
 * Placée ici plutôt que dans un composant : elle n'a d'intérêt qu'au moment où
 * l'on touche vraiment aux listes, et aucun écran n'a à s'en occuper.
 */
let fusionEnCours: Promise<void> | null = null;

async function connexion(): Promise<{ jeton: string; userId: string } | null> {
  const identite = await identiteCourante();
  if (!identite) return null;
  fusionEnCours ??= fusionner(identite.jeton, identite.userId).catch((e) => {
    // On laisse retenter au prochain appel : une panne réseau ne doit pas
    // condamner la reprise pour toute la durée de la visite.
    fusionEnCours = null;
    throw e;
  });
  await fusionEnCours;
  return identite;
}

/** Statuts des éditions demandées, pour une fiche film. Vide sans compte. */
export async function chargerStatuts(
  editionIds: number[],
): Promise<Record<number, StatutValue>> {
  if (editionIds.length === 0) return {};

  const identite = await connexion();
  if (!identite) return {};

  const { data, error } = await clientAuthentifie(identite.jeton)
    .from("collections")
    .select("edition_id, statut")
    .in("edition_id", editionIds);
  if (error) throw new Error(`Chargement des statuts impossible : ${error.message}`);

  const resultat: Record<number, StatutValue> = {};
  for (const ligne of data ?? []) {
    resultat[ligne.edition_id as number] = ligne.statut as StatutValue;
  }
  return resultat;
}

/**
 * Pose le statut, ou le retire s'il était déjà celui-là. Renvoie l'état obtenu,
 * `null` signifiant « plus dans aucune liste ». Lève `CompteRequis` sans compte.
 */
export async function basculerStatut(
  editionId: number,
  statut: StatutValue,
): Promise<StatutValue | null> {
  const identite = await connexion();
  if (!identite) throw new CompteRequis();

  const client = clientAuthentifie(identite.jeton);
  const actuel = await chargerStatuts([editionId]);

  if (actuel[editionId] === statut) {
    const { error } = await client.from("collections").delete().eq("edition_id", editionId);
    if (error) throw new Error(`Retrait impossible : ${error.message}`);
    return null;
  }

  const { error } = await client
    .from("collections")
    .upsert(
      { user_id: identite.userId, edition_id: editionId, statut },
      { onConflict: "user_id,edition_id" },
    );
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  return statut;
}

/** Toutes les éditions portant ce statut. Vide sans compte. */
export async function idsParStatut(statut: StatutValue): Promise<number[]> {
  const identite = await connexion();
  if (!identite) return [];

  const client = clientAuthentifie(identite.jeton);
  const ids: number[] = [];

  // Une collection au-delà de 1 000 éditions est rare mais possible, et une
  // troncature silencieuse ferait disparaître des titres de la liste.
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await client
      .from("collections")
      .select("edition_id")
      .eq("statut", statut)
      .order("cree_le", { ascending: false })
      .range(debut, debut + PAGE - 1);
    if (error) throw new Error(`Chargement de la liste impossible : ${error.message}`);

    const lot = data ?? [];
    ids.push(...lot.map((l) => l.edition_id as number));
    if (lot.length < PAGE) break;
  }

  return ids;
}
