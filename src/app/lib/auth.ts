import type { GoTrueClient, Session } from "@supabase/auth-js";
import { useEffect, useState } from "react";
import { CLE_STOCKAGE } from "./auth-config";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * Authentification par compte Google, et rien d'autre.
 *
 * Google uniquement, par réduction de surface : aucun mot de passe stocké,
 * aucun flux de réinitialisation à écrire, aucun envoi de courriel — le SMTP par
 * défaut de Supabase plafonne de toute façon à quelques messages par heure. La
 * contrepartie est assumée : sans compte Google, pas de compte ici.
 *
 * @supabase/auth-js pèse 104 Ko bruts (25 Ko compressés). Le chemin d'entrée
 * réel du site est une fiche film consultée sans compte : lui faire payer ce
 * poids annulerait une bonne part du gain obtenu en abandonnant supabase-js.
 * D'où le chargement à la demande — seuls le visiteur déjà connecté, celui qui
 * clique « Connexion » et le retour de Google le déclenchent.
 *
 * Les `import type` ci-dessus disparaissent à la compilation : ils ne créent
 * aucune dépendance à l'exécution.
 */

let chargement: Promise<GoTrueClient> | null = null;

function charger(): Promise<GoTrueClient> {
  chargement ??= import("./auth-client").then((m) => m.auth);
  return chargement;
}

/**
 * Une session est-elle plausible sans avoir chargé la bibliothèque ?
 *
 * On ne valide rien ici : la présence de la clé suffit à décider s'il faut
 * charger auth-js, lequel tranchera ensuite (jeton expiré, rafraîchissement,
 * données illisibles). Un faux positif coûte un chargement inutile, jamais une
 * session fantôme.
 */
function sessionPlausible(): boolean {
  try {
    if (localStorage.getItem(CLE_STOCKAGE) !== null) return true;
  } catch {
    /* stockage indisponible : pas de session à reprendre */
  }
  // Retour de Google : le flux PKCE renvoie un paramètre `code`, et signale les
  // refus par `error`. Dans les deux cas, auth-js doit reprendre la main.
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
}

/**
 * Le site est utilisable sans compte. On revient donc là où l'utilisateur a
 * cliqué, pas sur une page d'accueil.
 */
export async function connexionGoogle(retourVers: string = window.location.pathname): Promise<void> {
  const auth = await charger();
  const redirectTo = new URL(retourVers, window.location.origin).toString();
  // Aucun `scopes` : le provider Google de Supabase demande déjà `email` et
  // `profile`, et les redéclarer les faisait apparaître en double dans l'URL
  // d'autorisation. Surtout, ne rien ajouter ici est une contrainte à tenir —
  // tout autre scope serait jugé sensible par Google, ce qui impose une revue
  // manuelle et plafonne l'application à 100 comptes tant qu'elle n'est pas
  // passée.
  const { error } = await auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function deconnexion(): Promise<void> {
  const auth = await charger();
  await auth.signOut();
}

/**
 * Efface le compte et, par cascade, les collections. Irréversible : l'appelant
 * doit avoir demandé confirmation.
 */
export async function supprimerCompte(): Promise<void> {
  const auth = await charger();
  const { data } = await auth.getSession();
  if (!data.session) return;
  const reponse = await fetch(`https://${projectId}.supabase.co/rest/v1/rpc/supprimer_mon_compte`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!reponse.ok) throw new Error(`Suppression refusée (${reponse.status})`);
  await auth.signOut();
}

/**
 * Jeton et identifiant du compte connecté, ou `null`.
 *
 * Sert aux appels de données (cf. lib/collections.ts), qui doivent savoir s'ils
 * écrivent en base ou dans localStorage. Le test de plausibilité passe d'abord :
 * pour un visiteur sans compte — le cas courant — la fonction répond
 * immédiatement sans télécharger auth-js.
 */
export async function identiteCourante(): Promise<{ jeton: string; userId: string } | null> {
  if (!sessionPlausible()) return null;
  const auth = await charger();
  const { data } = await auth.getSession();
  if (!data.session) return null;
  return { jeton: data.session.access_token, userId: data.session.user.id };
}

/** Nom affichable, en repli sur l'adresse puis sur un libellé neutre. */
export function nomAffiche(session: Session | null): string {
  if (!session) return "";
  const meta = session.user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name ?? meta?.name ?? session.user.email ?? "Compte";
}

/**
 * `undefined` tant que la session n'est pas résolue, `null` ensuite si personne
 * n'est connecté. Les deux états sont distincts : afficher « Connexion » avant
 * de savoir ferait clignoter le bouton à chaque chargement pour un visiteur déjà
 * connecté.
 */
export function useSession(): Session | null | undefined {
  // Sans clé en stockage ni retour de Google, la réponse est connue tout de
  // suite : pas de session, et pas un octet d'auth-js téléchargé.
  const [session, setSession] = useState<Session | null | undefined>(() =>
    sessionPlausible() ? undefined : null);

  useEffect(() => {
    if (session === null && !sessionPlausible()) return;

    let vivant = true;
    let desabonner: (() => void) | undefined;

    void charger().then((auth) => {
      if (!vivant) return;
      // Couvre aussi le rafraîchissement du jeton et le retour de Google, qui
      // surviennent après le premier rendu.
      const { data } = auth.onAuthStateChange((_evenement, s) => {
        if (vivant) setSession(s);
      });
      desabonner = () => data.subscription.unsubscribe();
      // `onAuthStateChange` émet l'état courant à l'abonnement, mais seulement
      // une fois la session lue depuis le stockage. Cet appel garantit qu'on
      // sort de `undefined` même si aucun événement ne suit.
      void auth.getSession().then(({ data: courant }) => {
        if (vivant) setSession((prec) => (prec === undefined ? courant.session : prec));
      });
    });

    return () => {
      vivant = false;
      desabonner?.();
    };
    // Volontairement monté une seule fois : `session` n'est lu ici que pour son
    // état initial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}
