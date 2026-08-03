import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { connexionGoogle, deconnexion, nomAffiche, supprimerCompte, useSession } from "../lib/auth";
import {
  IDENTIFIANT_MAX,
  IDENTIFIANT_MIN,
  arobase,
  cheminProfil,
  identifiantBienForme,
  normaliserIdentifiant,
} from "../lib/identifiant";
import { etatIdentifiant, majProfil, useProfil, type EtatIdentifiant } from "../lib/profils";
import { SITE_ORIGIN } from "../lib/seo";

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

          <ProfilPublicReglages />

          <SuppressionCompte />
        </>
      )}
    </PageStatique>
  );
}

/**
 * L'identifiant, le nom affiché et la visibilité de la page publique.
 *
 * Les trois vivent dans la même section parce qu'ils décrivent une seule
 * chose : ce que voit quelqu'un qui ouvre votre lien. Les séparer aurait
 * dispersé le consentement, alors que c'est précisément ce qui doit se lire
 * d'un coup d'œil.
 *
 * **Changer d'identifiant casse les liens déjà partagés**, et rien ne les
 * répare : il n'y a pas d'id stable derrière comme sur une fiche film, où le
 * slug est décoratif (§7). C'est écrit à l'écran plutôt que découvert après
 * coup, et c'est aussi pourquoi l'ancien identifiant redevient libre : le
 * garder en réserve n'aiderait personne et priverait les autres d'un mot.
 */
function ProfilPublicReglages() {
  const etat = useProfil();
  const profil = etat.statut === "pret" ? etat.profil : null;

  const [identifiant, setIdentifiant] = useState("");
  const [nom, setNom] = useState("");
  const [verdict, setVerdict] = useState<EtatIdentifiant | "attente" | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le formulaire part de la valeur en base, et s'y réaligne quand elle change,
  // par exemple après un enregistrement réussi.
  useEffect(() => {
    if (!profil) return;
    setIdentifiant(profil.identifiant);
    setNom(profil.nom);
  }, [profil?.identifiant, profil?.nom]);

  // Même temporisation que l'écran de création : une requête par frappe
  // interrogerait la base huit fois pour un identifiant de huit signes.
  useEffect(() => {
    if (!profil || identifiant === profil.identifiant) { setVerdict(null); return; }
    if (!identifiantBienForme(identifiant)) { setVerdict("invalide"); return; }

    let annule = false;
    setVerdict("attente");
    const minuteur = setTimeout(() => {
      etatIdentifiant(identifiant)
        .then((e) => { if (!annule) setVerdict(e); })
        .catch(() => { if (!annule) setVerdict(null); });
    }, 400);

    return () => { annule = true; clearTimeout(minuteur); };
  }, [identifiant, profil?.identifiant]);

  if (etat.statut === "attente") {
    return (
      <Section titre="Ma page publique">
        <p>Chargement…</p>
      </Section>
    );
  }

  // Profil absent ou illisible : on n'invente pas un formulaire vide qui
  // échouerait à l'envoi. Le garde-fou du Layout demandera l'identifiant à la
  // prochaine page.
  if (!profil) {
    return (
      <Section titre="Ma page publique">
        <p>
          Votre identifiant n’a pas encore été choisi, ou n’a pas pu être lu. Rechargez la page :
          l’écran de choix s’ouvrira.
        </p>
      </Section>
    );
  }

  const nomPropre = nom.trim();
  const modifie = identifiant !== profil.identifiant || nomPropre !== profil.nom;
  const valide =
    identifiantBienForme(identifiant) &&
    nomPropre.length > 0 &&
    verdict !== "pris" &&
    verdict !== "reserve" &&
    verdict !== "invalide";

  async function enregistrer() {
    if (!profil) return;
    setEnCours(true);
    try {
      await majProfil({ identifiant, nom: nomPropre });
      toast.success("Profil mis à jour.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerVisibilite() {
    if (!profil) return;
    setEnCours(true);
    try {
      const suite = await majProfil({ visible: !profil.visible });
      toast.success(suite.visible ? "Votre page est publique." : "Votre page est masquée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Section titre="Ma page publique">
      <p>
        Votre identifiant donne son adresse à votre page de collection. Elle se consulte sans
        compte : c’est ce qui la rend partageable.
      </p>

      <Encadre>
        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {SITE_ORIGIN.replace("https://", "")}
          {cheminProfil(profil.identifiant)}
        </span>
        <br />
        {profil.visible ? (
          <Link to={cheminProfil(profil.identifiant)} style={{ color: "var(--reel-accent-clair)" }}>
            Ouvrir ma page
          </Link>
        ) : (
          <span>Masquée : cette adresse répond comme une page inexistante.</span>
        )}
      </Encadre>

      <label className="flex flex-col gap-2 pt-1">
        <span style={{ color: "var(--reel-text)", fontWeight: 600 }}>Identifiant</span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true" style={{ fontFamily: "ui-monospace, monospace" }}>@</span>
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(normaliserIdentifiant(e.target.value))}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={enCours}
            className="w-full max-w-[320px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "14px",
            }}
          />
        </span>
        <span
          aria-live="polite"
          style={{
            fontSize: "13px",
            color:
              verdict === "libre"
                ? "#4ade80"
                : verdict === "pris" || verdict === "reserve" || verdict === "invalide"
                ? "#ef6b6b"
                : "var(--reel-muted)",
          }}
        >
          {verdict === "attente"
            ? "Vérification…"
            : verdict === "libre"
            ? "Disponible."
            : verdict === "pris"
            ? "Cet identifiant est déjà pris."
            : verdict === "reserve"
            ? "Cet identifiant n’est pas disponible."
            : verdict === "invalide"
            ? `Entre ${IDENTIFIANT_MIN} et ${IDENTIFIANT_MAX} signes : lettres, chiffres et « _ ».`
            : `Les liens déjà partagés vers ${arobase(profil.identifiant)} cesseront de fonctionner si vous le changez.`}
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span style={{ color: "var(--reel-text)", fontWeight: 600 }}>Nom affiché</span>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value.slice(0, 60))}
          autoComplete="off"
          disabled={enCours}
          className="w-full max-w-[320px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
          style={{
            backgroundColor: "var(--reel-surface)",
            border: "1px solid var(--reel-border)",
            color: "var(--reel-text)",
            fontSize: "14px",
          }}
        />
        <span style={{ fontSize: "13px" }}>
          Ce nom paraît sur votre page publique. Votre adresse électronique, elle, n’y paraît jamais.
        </span>
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <Bouton
          disabled={!modifie || !valide || enCours}
          onClick={() => { void enregistrer(); }}
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Bouton>
        <Bouton disabled={enCours} onClick={() => { void basculerVisibilite(); }}>
          {profil.visible ? "Masquer ma page" : "Rendre ma page publique"}
        </Bouton>
      </div>

      <p>
        Masquée, la page répond comme une page inexistante, et non « profil masqué » : un visiteur ne
        peut donc pas déduire de son adresse que le compte existe. Vos listes restent visibles pour
        vous, et vos gestes sur les fiches films ne changent pas.
      </p>
    </Section>
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
