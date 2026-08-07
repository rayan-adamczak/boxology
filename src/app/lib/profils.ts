import { useEffect, useReducer } from "react";
import { identiteCourante, useSession } from "./auth";
import { CompteRequis } from "./collections";
import { clientAuthentifie, supabase } from "./supabase";
import type { StatutValue } from "./reelio-db";

/**
 * Le profil public d'un compte : son identifiant @, son nom affiché, et
 * l'interrupteur qui décide si la page est servie.
 *
 * Deux chemins de lecture, et ils ne se croisent jamais :
 *
 *   - **le sien**, par la table `profils` sous jeton de session, la RLS ne
 *     rendant que sa propre ligne ;
 *   - **celui d'un autre**, par les fonctions `profil_public` et
 *     `editions_du_profil`, en clé anon. `profils` et `collections` restent
 *     inaccessibles à `anon`, ces deux fonctions sont la seule porte, et c'est
 *     ce qui garde `visible` à un seul endroit (cf. la migration
 *     `20260803_profils.sql`).
 *
 * Un compte connecté qui regarde le profil de quelqu'un d'autre emprunte le
 * second chemin comme tout le monde : une seule porte, un seul endroit où
 * `visible` peut être oublié.
 */

/** Le profil du compte connecté, tel qu'il peut le modifier. */
export interface Profil {
  identifiant: string;
  nom: string;
  visible: boolean;
  /** Photo de profil, ou `null`. Voir `lib/avatar.ts` pour le dépôt. */
  avatarUrl: string | null;
}

/** Ce qu'un visiteur sans compte a le droit de voir. Jamais l'adresse. */
export interface ProfilPublic {
  identifiant: string;
  nom: string;
  avatarUrl: string | null;
  creeLe: string;
  /** Éditions marquées « possédée ». Compté en base, listes comprises. */
  possedees: number;
  envies: number;
}

/** Réponse de `etat_identifiant`. Le motif, pas seulement un oui ou non. */
export type EtatIdentifiant = "libre" | "pris" | "reserve" | "invalide";

/**
 * L'état du profil du compte courant, vu par l'interface.
 *
 * Cinq cas et non trois, parce que « pas encore chargé », « pas de compte » et
 * « compte sans profil » appellent trois écrans différents, et surtout parce
 * qu'**une panne ne doit pas se lire comme une absence** : `erreur` laisse
 * passer, `absent` bloque sur l'écran de choix. Confondre les deux enfermerait
 * un utilisateur hors du site pour une coupure réseau, exactement le défaut du
 * 30 juillet consigné au §9.
 */
export type EtatProfil =
  | { statut: "attente" }
  | { statut: "anonyme" }
  | { statut: "absent" }
  | { statut: "pret"; profil: Profil }
  | { statut: "erreur" };

/* -------------------------------------------------------------------------- */
/* Cache partagé                                                              */
/* -------------------------------------------------------------------------- */

/*
 * Le profil est lu par le bandeau, le tableau de bord, la page de profil et le
 * garde-fou du Layout. Sans cache partagé, chacun déclencherait sa propre
 * requête au montage, et un changement d'identifiant n'en rafraîchirait qu'un.
 *
 * `userId` fait partie de l'état : changer de compte dans le même onglet, ce
 * qui arrive en se déconnectant puis reconnectant, doit invalider le cache et
 * non recycler le profil du précédent.
 */
let cache: { userId: string; etat: EtatProfil } | null = null;
let enCours: Promise<void> | null = null;
const auditeurs = new Set<() => void>();

function notifier(): void {
  for (const auditeur of auditeurs) auditeur();
}

function poser(userId: string, etat: EtatProfil): void {
  cache = { userId, etat };
  notifier();
}

/**
 * Recharge le profil du compte connecté.
 *
 * Une seule requête en vol à la fois : quatre composants montés ensemble
 * partagent la même promesse. L'échec n'est pas mis en cache comme état
 * définitif, il est rangé en `erreur`, que le prochain appel retentera.
 */
export async function rafraichirProfil(): Promise<void> {
  if (enCours) return enCours;

  enCours = (async () => {
    const identite = await identiteCourante();
    if (!identite) {
      cache = null;
      notifier();
      return;
    }

    const { data, error } = await clientAuthentifie(identite.jeton)
      .from("profils")
      .select(COLONNES)
      .eq("user_id", identite.userId)
      .maybeSingle();

    if (error) {
      // Une lecture qui échoue doit se voir (§9). Ici « se voir » veut dire :
      // ne pas être prise pour un compte sans profil, ce qui enverrait
      // l'utilisateur sur l'écran de création alors qu'il en a déjà un.
      poser(identite.userId, { statut: "erreur" });
      return;
    }

    poser(
      identite.userId,
      data
        ? { statut: "pret", profil: versProfil(data) }
        : { statut: "absent" },
    );
  })().finally(() => {
    enCours = null;
  });

  return enCours;
}

/**
 * L'état du profil courant, partagé par tous les composants qui l'appellent.
 *
 * Ne déclenche aucune requête tant que la session n'est pas résolue, et aucune
 * du tout sans compte : un visiteur de passage, le cas courant, ne paie rien.
 */
export function useProfil(): EtatProfil {
  const session = useSession();
  const [, forcer] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    auditeurs.add(forcer);
    return () => {
      auditeurs.delete(forcer);
    };
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) {
      if (cache !== null) {
        cache = null;
        notifier();
      }
      return;
    }
    if (cache?.userId === session.user.id && cache.etat.statut !== "erreur") return;
    void rafraichirProfil();
    // Comme ailleurs dans le dépôt : on suit l'identité, pas l'objet session,
    // recréé à chaque rafraîchissement de jeton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session === undefined, session?.user.id]);

  if (session === undefined) return { statut: "attente" };
  if (session === null) return { statut: "anonyme" };
  if (cache?.userId !== session.user.id) return { statut: "attente" };
  return cache.etat;
}

/* -------------------------------------------------------------------------- */
/* Écriture                                                                    */
/* -------------------------------------------------------------------------- */

/** Disponibilité d'un identifiant, motif compris. Demande une session. */
export async function etatIdentifiant(identifiant: string): Promise<EtatIdentifiant> {
  const identite = await identiteCourante();
  if (!identite) throw new Error("Un compte est nécessaire.");

  const { data, error } = await clientAuthentifie(identite.jeton).rpc("etat_identifiant", {
    p_identifiant: identifiant,
  });
  if (error) throw new Error(`Vérification impossible : ${error.message}`);
  return data as EtatIdentifiant;
}

/**
 * Crée le profil du compte connecté. Un seul par compte, la clé primaire étant
 * `user_id` : une seconde tentative se solde par un conflit, pas par un doublon.
 */
export async function creerProfil(identifiant: string, nom: string): Promise<Profil> {
  const identite = await identiteCourante();
  if (!identite) throw new Error("Un compte est nécessaire.");

  const ligne = { user_id: identite.userId, identifiant, nom };
  const { data, error } = await clientAuthentifie(identite.jeton)
    .from("profils")
    .insert(ligne)
    .select(COLONNES)
    .single();
  if (error) throw new Error(traduire(error));

  const profil = versProfil(data);
  poser(identite.userId, { statut: "pret", profil });
  return profil;
}

/**
 * Les colonnes du profil, en une seule copie.
 *
 * Trois requêtes les listaient à l'identique ; ajouter `avatar_url` à deux
 * d'entre elles aurait suffi à ce que la troisième rende un profil sans photo,
 * sans que rien ne le signale.
 */
const COLONNES = "identifiant, nom, visible, avatar_url";

/**
 * De la forme de l'application vers celle de la table.
 *
 * `Profil` est en camel, PostgREST attend les noms de colonnes. La conversion
 * est **explicite et exhaustive** plutôt qu'automatique : un `update` qui
 * laisserait passer une clé inconnue serait refusé par PostgREST au mieux, et
 * écrirait une colonne qu'on ne voulait pas au pire.
 */
function versColonnes(champs: Partial<Profil>): Record<string, unknown> {
  const ligne: Record<string, unknown> = {};
  if (champs.identifiant !== undefined) ligne.identifiant = champs.identifiant;
  if (champs.nom !== undefined) ligne.nom = champs.nom;
  if (champs.visible !== undefined) ligne.visible = champs.visible;
  if (champs.avatarUrl !== undefined) ligne.avatar_url = champs.avatarUrl;
  return ligne;
}

/** Ce que la table rend, vers la forme de l'application. */
function versProfil(ligne: unknown): Profil {
  const l = ligne as { identifiant: string; nom: string; visible: boolean; avatar_url: string | null };
  return {
    identifiant: l.identifiant,
    nom: l.nom,
    visible: l.visible,
    avatarUrl: l.avatar_url ?? null,
  };
}

/** Modifie ce qui est passé, laisse le reste. */
export async function majProfil(champs: Partial<Profil>): Promise<Profil> {
  const identite = await identiteCourante();
  if (!identite) throw new Error("Un compte est nécessaire.");

  const { data, error } = await clientAuthentifie(identite.jeton)
    .from("profils")
    .update(versColonnes(champs))
    .eq("user_id", identite.userId)
    .select(COLONNES)
    .single();
  if (error) throw new Error(traduire(error));

  const profil = versProfil(data);
  poser(identite.userId, { statut: "pret", profil });
  return profil;
}

/**
 * Message lisible pour les refus que la base sait opposer.
 *
 * `23505` est le conflit d'unicité : quelqu'un a pris l'identifiant entre la
 * vérification et l'envoi. Rare, mais c'est la seule garantie réelle, la
 * vérification n'étant qu'une amabilité.
 *
 * `23514` est le code que le déclencheur pose sur un identifiant réservé, sur
 * un identifiant filtré et sur un nom filtré. Le message de la base distingue
 * les deux **colonnes**, pour que l'écran sache lequel des deux champs est en
 * cause, mais jamais la **cause** : « réservé » et « interdit » rendent le même
 * message, sans quoi on désignerait la mutation qui a échoué, donc on
 * apprendrait à contourner une entrée à la fois
 * (cf. `20260803_identifiants_interdits.sql`).
 */
function traduire(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Cet identifiant vient d’être pris. Essayez-en un autre.";
  if (error.code === "23514") {
    return error.message.includes("nom")
      ? "Ce nom affiché n’est pas accepté. Choisissez-en un autre."
      : "Cet identifiant n’est pas disponible. Essayez-en un autre.";
  }
  return `Enregistrement impossible : ${error.message}`;
}

/* -------------------------------------------------------------------------- */
/* Lecture publique                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Le profil désigné par un identifiant, ou `null`.
 *
 * `null` couvre aussi bien l'identifiant inconnu que le profil masqué, et
 * c'est délibéré : les distinguer dirait quels comptes existent.
 */
export async function profilPublic(identifiant: string): Promise<ProfilPublic | null> {
  const { data, error } = await supabase.rpc("profil_public", { p_identifiant: identifiant });
  if (error) throw new Error(`Profil indisponible : ${error.message}`);
  if (!data) return null;

  const brut = data as {
    identifiant: string;
    nom: string;
    avatar_url: string | null;
    cree_le: string;
    possedees: number;
    envies: number;
  };
  return {
    identifiant: brut.identifiant,
    nom: brut.nom,
    avatarUrl: brut.avatar_url ?? null,
    creeLe: brut.cree_le,
    possedees: brut.possedees,
    envies: brut.envies,
  };
}

/**
 * L'identifiant du jour d'un compte qui en portait un autre, ou `null`.
 *
 * C'est ce qui fait qu'un lien partagé survit à un renommage : l'ancienne
 * adresse redirige vers la nouvelle en 301, comme `/films/560` redirige vers
 * `/movies/<slug>/560` (§7). Le §3 posait l'inverse, « l'ancien identifiant
 * redevient libre » ; la contrepartie assumée est qu'un identifiant, une fois
 * porté, n'est plus rendu à la circulation. Détail dans
 * `20260806_identifiants_precedents.sql`.
 *
 * **Ne s'appelle qu'après un `profil_public` à `null`**, jamais avant : c'est
 * le cas rare, et l'ajouter au chemin normal coûterait un aller-retour à
 * chaque profil ouvert. Rend `null` pour un profil devenu masqué, exactement
 * comme pour un identifiant inconnu — sinon la redirection deviendrait
 * l'oracle que `profil_public` s'emploie à ne pas être.
 */
export async function identifiantCourant(identifiant: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("identifiant_courant", {
    p_identifiant: identifiant,
  });
  // Une panne ici ne doit pas transformer un 404 en écran d'erreur : on rend
  // `null`, l'appelant sert la page introuvable, qui est la bonne réponse.
  if (error) return null;
  return typeof data === "string" && data.length > 0 ? data : null;
}

/* -------------------------------------------------------------------------- */
/* Signalement                                                                 */
/* -------------------------------------------------------------------------- */

export const MOTIFS_SIGNALEMENT = [
  { cle: "injure", libelle: "Injure ou grossièreté" },
  { cle: "haine", libelle: "Propos racistes, antisémites, homophobes" },
  { cle: "usurpation", libelle: "Usurpation d’identité" },
  { cle: "spam", libelle: "Spam ou publicité" },
  { cle: "autre", libelle: "Autre" },
] as const;

export type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number]["cle"];

/** Ce que la base répond. Chaque cas mérite une phrase différente à l'écran. */
export type ResultatSignalement =
  | "enregistre"
  | "deja"
  | "soi"
  | "inconnu"
  | "trop"
  | "connexion";

/**
 * Signale un profil. **Demande un compte.**
 *
 * La première version acceptait un signalement anonyme, au motif qu'on tombe
 * sur un profil par un lien partagé. L'argument inverse l'emporte : sans
 * compte, il n'y a rien à dédoublonner, donc un seul plafond de flot pour toute
 * défense, et un signalement qui n'engage personne se prête au harcèlement par
 * répétition. `anon` n'a plus l'`EXECUTE` sur la fonction, le refus arrive donc
 * en 401 avant elle.
 *
 * Lève `CompteRequis`, comme toute action du site qui en demande un
 * (`lib/collections.ts`) : l'interface a déjà de quoi la présenter.
 */
export async function signalerProfil(
  identifiant: string,
  motif: MotifSignalement,
  commentaire: string,
): Promise<ResultatSignalement> {
  const identite = await identiteCourante();
  // Contrôlé ici pour éviter un aller-retour dont on connaît la réponse. La
  // garantie, elle, est le privilège révoqué, pas ce test.
  if (!identite) throw new CompteRequis();

  const { data, error } = await clientAuthentifie(identite.jeton).rpc("signaler_profil", {
    p_identifiant: identifiant,
    p_motif: motif,
    p_commentaire: commentaire.trim() || null,
  });
  if (error) throw new Error(`Signalement impossible : ${error.message}`);
  return data as ResultatSignalement;
}

/**
 * Les éditions d'une liste publique, du geste le plus récent au plus ancien.
 *
 * Rend des identifiants : les éditions elles-mêmes se relisent ensuite par le
 * chemin ordinaire du catalogue (`getEditionsByIds`), qui est public. La
 * fonction en base n'a donc pas à savoir ce qu'une carte affiche.
 */
export async function editionsDuProfil(
  identifiant: string,
  statut: StatutValue,
): Promise<number[]> {
  const PAGE = 500;
  const ids: number[] = [];

  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await supabase.rpc("editions_du_profil", {
      p_identifiant: identifiant,
      p_statut: statut,
      p_debut: debut,
      p_limite: PAGE,
    });
    if (error) throw new Error(`Liste indisponible : ${error.message}`);

    const lot = (data ?? []) as number[];
    ids.push(...lot);
    if (lot.length < PAGE) break;
  }

  return ids;
}
