import { useState } from "react";
import { toast } from "sonner";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { connexionGoogle, deconnexion, nomAffiche, supprimerCompte, useSession } from "../lib/auth";

/**
 * Réglages du compte, et surtout sa suppression.
 *
 * Un écran dédié plutôt qu'une entrée de menu : l'effacement est immédiat et
 * définitif, il lui faut la place d'être expliqué et une confirmation qu'on ne
 * déclenche pas d'un clic de travers. La politique de confidentialité annonce
 * que la suppression est accessible ici, c'est cette page qui tient la
 * promesse, et c'est une obligation du RGPD (article 17), pas un agrément.
 */
export function ComptePage() {
  const session = useSession();

  return (
    <PageStatique
      titre="Mon compte"
      description="Réglages de votre compte Jaquette et suppression définitive."
      noindex
    >
      {session === undefined && (
        <Section titre="Chargement">
          <p>Vérification de la session…</p>
        </Section>
      )}

      {session === null && (
        <Section titre="Aucun compte">
          <p>
            Vous n’êtes pas connecté. Le site fonctionne très bien ainsi : vos listes sont alors
            conservées dans ce navigateur, et rien n’est transmis.
          </p>
          <p>
            Un compte ne sert qu’à retrouver ces listes sur vos autres appareils. La connexion se
            fait uniquement par Google, et nous ne recevons ni votre mot de passe ni l’accès à vos
            autres services Google.
          </p>
          <div className="pt-1">
            <Bouton onClick={() => { void connexionGoogle("/account"); }}>
              Se connecter avec Google
            </Bouton>
          </div>
        </Section>
      )}

      {session && (
        <>
          <Section titre="Compte connecté">
            <Encadre>
              <span style={{ color: "var(--reel-text)", fontWeight: 600 }}>{nomAffiche(session)}</span>
              <br />
              {session.user.email}
            </Encadre>
            <p>
              Vos listes sont enregistrées sur nos serveurs, situés en Suède, au sein de l’Union
              européenne, et rattachées à ce compte.
            </p>
            <div className="pt-1">
              <Bouton onClick={() => { void deconnexion(); }}>Se déconnecter</Bouton>
            </div>
            <p>
              La déconnexion n’efface rien : vos listes vous attendent à la prochaine connexion.
            </p>
          </Section>

          <SuppressionCompte />
        </>
      )}
    </PageStatique>
  );
}

/**
 * Réplique à recopier pour confirmer. Un catalogue de films peut se permettre
 * un clin d’œil là où d’autres écriraient « SUPPRIMER ».
 *
 * Attention à ce que ce choix déplace : le mot « SUPPRIMER » énonçait
 * l’intention, une réplique non. Ce sont donc le paragraphe de conséquence et
 * le libellé du bouton qui portent le sens, ne pas les édulcorer en pensant
 * que la phrase suffit.
 */
const PHRASE = "Hasta la vista, baby";

/**
 * Comparaison indulgente : casse, accents et ponctuation ignorés.
 *
 * La friction voulue est de recopier une phrase, pas de reproduire une virgule.
 * Bloquer quelqu’un qui a manifestement compris serait de la brutalité sans
 * bénéfice.
 *
 * La décomposition NFD précède le retrait des diacritiques, sinon les
 * majuscules accentuées passent au travers, le même piège que `translate()`
 * appliqué avant `lower()` en SQL.
 */
function normaliser(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

/**
 * Confirmation en deux temps, la seconde exigeant de recopier une phrase.
 *
 * Une simple boîte « êtes-vous sûr ? » se clique par réflexe. Comme il n’existe
 * aucune sauvegarde de laquelle revenir, le geste doit demander une intention
 * explicite.
 */
function SuppressionCompte() {
  const [demande, setDemande] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);

  const confirme = normaliser(saisie) === normaliser(PHRASE);

  async function supprimer() {
    setEnCours(true);
    try {
      await supprimerCompte();
      toast.success("Compte supprimé.");
    } catch {
      // On ne prétend pas avoir supprimé si le serveur a refusé : l'utilisateur
      // repartirait convaincu que ses données ont disparu.
      toast.error("La suppression a échoué. Écrivez-nous, nous la ferons à la main.");
      setEnCours(false);
    }
  }

  return (
    <Section titre="Supprimer mon compte">
      <p>
        La suppression est immédiate et définitive. Le compte, la collection et les envies sont
        effacés dans le même mouvement, sans copie conservée : nous n’avons aucun moyen de les
        rétablir ensuite.
      </p>

      {!demande && (
        <div className="pt-1">
          <Bouton destructif onClick={() => setDemande(true)}>
            Supprimer mon compte
          </Bouton>
        </div>
      )}

      {demande && (
        <div className="flex flex-col gap-3 pt-1">
          <label className="flex flex-col gap-2">
            <span>
              Pour confirmer, recopiez{" "}
              <code style={{ color: "var(--reel-text)" }}>{PHRASE}</code> ci-dessous. La casse et la
              ponctuation n’ont pas d’importance.
            </span>
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={enCours}
              className="w-full max-w-[320px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
                fontSize: "14px",
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Bouton
              destructif
              disabled={!confirme || enCours}
              onClick={() => { void supprimer(); }}
            >
              {enCours ? "Suppression…" : "Supprimer définitivement"}
            </Bouton>
            <Bouton
              disabled={enCours}
              onClick={() => { setDemande(false); setSaisie(""); }}
            >
              Annuler
            </Bouton>
          </div>
        </div>
      )}
    </Section>
  );
}

function Bouton({
  children,
  onClick,
  destructif,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructif?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
      style={{
        fontSize: "14px",
        fontWeight: 600,
        backgroundColor: destructif ? "#b3261e" : "var(--reel-surface-2)",
        color: destructif ? "#ffffff" : "var(--reel-text)",
        border: `1px solid ${destructif ? "#b3261e" : "var(--reel-border)"}`,
      }}
    >
      {children}
    </button>
  );
}
