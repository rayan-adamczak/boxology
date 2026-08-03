import { identiteCourante } from "./auth";
import { clientAuthentifie } from "./supabase";

/**
 * Signalement d'une édition absente du catalogue.
 *
 * **Pourquoi ça existe.** Le catalogue est piloté par les éditions : une œuvre
 * n'existe que si un disque la porte, et 134 fiches sans édition ont été
 * supprimées le 31 juillet 2026 pour cette raison. Quand aucune de nos sources
 * ne vend un disque, l'œuvre reste donc absente, quoi qu'on relise.
 *
 * Le §8 tient ce mécanisme pour **la meilleure réponse au trou de source** :
 * il ne dépend d'aucune autorisation extérieure, contrairement aux flux Awin,
 * et il ne heurte pas la règle du catalogue, puisqu'il porte sur le disque.
 * My Movies en fait un argument de vente, l'équipe créant la fiche rapidement.
 *
 * **Tout passe par une fonction `security definer`**, la table restant fermée
 * à `anon` comme à `authenticated` (§3). C'est elle qui valide la forme du
 * code, refuse les codes de magasin, tient le quota et dit si l'édition est
 * déjà là. Le front n'a aucune de ces règles en double : une seconde copie
 * dériverait au premier ajustement.
 */

/** Ce que la base peut répondre. Un motif, jamais un booléen : les refus ne se
 *  corrigent pas de la même façon, et l'écran doit pouvoir le dire. */
export type Verdict =
  | "enregistre"
  | "deja_au_catalogue"
  | "ean_invalide"
  | "ean_magasin"
  | "quota_atteint"
  | "compte_requis";

/** Message affiché pour chaque verdict. Les quatre refus disent quoi faire. */
export const MESSAGE: Record<Verdict, string> = {
  enregistre: "Merci, c’est noté. L’édition sera ajoutée à la prochaine passe.",
  deja_au_catalogue: "Ce code-barres est déjà au catalogue : cherchez-le, la fiche existe.",
  ean_invalide: "Un code-barres de disque compte treize chiffres. Vérifiez la saisie.",
  ean_magasin:
    "Ce code commence par 2 : c’est une référence interne à une enseigne, " +
    "qui n’identifie pas le disque en dehors de leurs rayons. Prenez celui " +
    "imprimé au dos du boîtier.",
  quota_atteint: "Vingt signalements par jour, c’est le maximum. À demain.",
  compte_requis: "Il faut être connecté pour signaler une édition.",
};

/**
 * Signale une édition par son code-barres.
 *
 * Rend le verdict de la base tel quel. Une erreur réseau lève, elle n'est pas
 * traduite en refus : « le serveur a dit non » et « je n'ai pas pu demander »
 * ne se corrigent pas pareil, et le §9 garde la trace d'un défaut de ce genre,
 * où une session illisible passait pour un compte neuf.
 */
export async function signalerEdition(ean: string, note: string): Promise<Verdict> {
  const identite = await identiteCourante();
  if (!identite) return "compte_requis";

  const client = clientAuthentifie(identite.jeton);
  const { data, error } = await client.rpc("signaler_edition", {
    p_ean: ean,
    p_note: note,
  });
  if (error) throw new Error(`Signalement impossible : ${error.message}`);
  return (data as Verdict) ?? "ean_invalide";
}

export interface SignalementEdition {
  ean: string;
  note: string | null;
  statut: string;
  cree_le: string;
}

/** Les signalements du compte connecté, du plus récent au plus ancien. */
export async function mesSignalements(): Promise<SignalementEdition[]> {
  const identite = await identiteCourante();
  if (!identite) return [];

  const client = clientAuthentifie(identite.jeton);
  const { data, error } = await client.rpc("mes_signalements_edition");
  if (error) throw new Error(`Lecture impossible : ${error.message}`);
  return (data as SignalementEdition[]) ?? [];
}

/**
 * Forme d'un code-barres, pour répondre à la frappe sans aller-retour.
 *
 * **C'est la seule règle en double avec la base**, et c'est assumé pour la
 * même raison que la forme de l'identifiant public (§3) : le champ doit dire
 * tout de suite qu'il manque des chiffres. Les règles qui décident, code de
 * magasin, quota, présence au catalogue, restent en SQL et là seulement.
 */
export function eanBienForme(saisie: string): boolean {
  return /^\d{13}$/.test(saisie.replace(/\D/g, ""));
}

/** Ne garde que les chiffres : les gens recopient avec des espaces. */
export function chiffres(saisie: string): string {
  return saisie.replace(/\D/g, "").slice(0, 13);
}
