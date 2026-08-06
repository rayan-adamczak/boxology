import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { AttentePleine } from "../components/AttenteRecherche";
import { connexionGoogle, deconnexion, nomAffiche, supprimerCompte, useSession } from "../lib/auth";
import {
  IDENTIFIANT_MAX,
  IDENTIFIANT_MIN,
  arobase,
  cheminProfil,
  identifiantBienForme,
  normaliserIdentifiant,
} from "../lib/identifiant";
import { exporterCollectionCsv, telecharger } from "../lib/export-collection";
import { etatIdentifiant, majProfil, useProfil, type EtatIdentifiant } from "../lib/profils";
import { formaterEuros, valeurCollection, type ValeurCollection } from "../lib/valeur";
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
        <AttentePleine libelle="Vérification de la session…" />
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

          <ValeurEstimee />

          <ExportCollection />

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
      <AttentePleine hauteur={180} />
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
        compte, c’est ce qui la rend partageable, et elle est indexée par les moteurs de
        recherche.
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
/**
 * Valeur estimée de la collection, sur les prix d'occasion.
 *
 * **Deuxième fonction la plus demandée** du relevé du 2 août 2026, et la
 * première fois qu'elle peut s'écrire sans mentir : momox shop, accepté sur
 * Awin le 6 août 2026, est la première source de seconde main du catalogue.
 * Ce que le nombre veut dire, et ce qu'il ne veut pas dire, est dans
 * `lib/valeur.ts`.
 *
 * **Sur `/account` et nulle part ailleurs, en particulier pas sur `/u/…`.** Le
 * profil public montre ce qu'on possède, et c'est déjà un changement de posture
 * assumé (§10) ; ce qu'une collection vaut est autre chose. Publier l'inventaire
 * chiffré de biens qui dorment chez quelqu'un, sous un identifiant qu'un moteur
 * indexe, n'est pas une fonction qu'on ajoute sans que la personne l'ait
 * demandé. Cette page-là est en `noindex` et ne se lit que connecté.
 *
 * **Rien n'est calculé avant qu'on le demande.** Un compte de mille éditions
 * coûte cinq requêtes par lots de deux cents, et l'immense majorité des visites
 * à `/account` viennent chercher autre chose. C'est aussi la règle du §8 vue de
 * l'autre bout : ce qui se décide au premier rendu doit se décider sans réseau,
 * donc ce qui demande le réseau ne se décide pas au premier rendu.
 */
function ValeurEstimee() {
  const [etat, setEtat] = useState<"repos" | "calcul" | "fait" | "panne">("repos");
  const [valeur, setValeur] = useState<ValeurCollection | null>(null);

  async function estimer() {
    setEtat("calcul");
    try {
      setValeur(await valeurCollection());
      setEtat("fait");
    } catch {
      setEtat("panne");
    }
  }

  return (
    <Section titre="Valeur estimée de ma collection">
      <p>
        Une estimation de ce qu’il coûterait de racheter vos disques d’occasion aujourd’hui, au
        moins cher des exemplaires en vente chez nos partenaires.
      </p>

      {etat !== "fait" && (
        <div className="pt-1">
          <Bouton onClick={() => { void estimer(); }} disabled={etat === "calcul"}>
            {etat === "calcul" ? "Calcul…" : "Estimer ma collection"}
          </Bouton>
        </div>
      )}

      {etat === "panne" && (
        <p>Le calcul a échoué. Réessayez dans un instant.</p>
      )}

      {etat === "fait" && valeur && valeur.possedees === 0 && (
        <p>
          Votre collection est vide. Marquez des éditions comme possédées depuis une fiche film,
          et le calcul aura de quoi travailler.
        </p>
      )}

      {etat === "fait" && valeur && valeur.possedees > 0 && (
        <>
          <Encadre>
            {valeur.estimees === 0 ? (
              <>
                Aucune de vos {valeur.possedees} édition{valeur.possedees > 1 ? "s" : ""} ne porte
                de prix d’occasion connu. Ce n’est pas un défaut de votre collection : nos
                partenaires publient un prix pour une édition sur quinze.
              </>
            ) : (
              <>
                <span
                  className="tabular-nums"
                  style={{ fontSize: "24px", fontWeight: 600, color: "var(--reel-text)" }}
                >
                  {formaterEuros(valeur.total)}
                </span>
                <br />
                {/*
                  **Le dénominateur est collé au total, jamais dans une note plus
                  bas.** 1 618 éditions du catalogue portent un prix d'occasion
                  sur 23 803 : un montant présenté seul laisserait croire qu'il
                  couvre toute la collection. C'est la même règle qu'au §4, un
                  taux se lit avec ce qui le divise.
                */}
                sur {valeur.estimees} édition{valeur.estimees > 1 ? "s" : ""} estimée
                {valeur.estimees > 1 ? "s" : ""} — vous en possédez {valeur.possedees}.
                {valeur.medianeUnitaire !== null && (
                  <> Médiane {formaterEuros(valeur.medianeUnitaire)} par disque.</>
                )}
              </>
            )}
          </Encadre>

          {valeur.estimees > 0 && (
            <>
              <p>
                {/* La date la plus ancienne du lot, pas la plus fraîche : c'est
                    elle qui dit ce que vaut l'estimation (§10). */}
                Prix d’occasion relevés chez {valeur.marchands.join(", ")}, le plus ancien datant du{" "}
                {new Date(valeur.releveLePlusAncien ?? "").toLocaleDateString("fr-FR")}.
              </p>
              <p>
                {/* Trois limites, écrites parce qu'elles sont le sujet. Le §8
                    refusait ce total tant qu'il ne pouvait pas être qualifié. */}
                C’est un plancher, pas une cote : le total ne compte que les éditions dont un
                partenaire publie un prix, retient le moins cher, et ne dit pas ce qu’un
                revendeur vous en donnerait — un marchand d’occasion achète bien moins cher
                qu’il ne vend. Rien n’est publié sur votre page publique.
              </p>
            </>
          )}
        </>
      )}
    </Section>
  );
}

/**
 * Export CSV de la collection et des envies.
 *
 * **Il est ici, et juste avant la suppression, exprès.** Les deux répondent à
 * la même question, « et si je veux partir ». Le relevé du 2 août 2026 met la
 * perte de données au deuxième rang des griefs contre les concurrents : des
 * collections de sept à neuf cents titres effacées après une mise à jour, sans
 * récupération. Pouvoir tout emporter avant d'effacer est ce qui rend le
 * bouton rouge acceptable.
 *
 * **Gratuit, et il le restera.** Movie Collector réserve l'export à sa version
 * Pro. Le grief numéro un dans ces avis n'est pas le fait de payer, c'est le
 * mur surgi en cours de route : gager l'export retournerait l'argument de
 * confiance.
 */
function ExportCollection() {
  const [enCours, setEnCours] = useState(false);

  async function exporter() {
    setEnCours(true);
    try {
      const csv = await exporterCollectionCsv(SITE_ORIGIN);
      if (csv.lignes === 0) {
        // Télécharger un fichier vide laisserait croire à une panne. On le dit.
        toast("Vos listes sont vides, il n’y a rien à exporter.");
        return;
      }
      telecharger(csv);
      toast.success(`${csv.lignes} ligne${csv.lignes > 1 ? "s" : ""} exportée${csv.lignes > 1 ? "s" : ""}.`);
    } catch {
      toast.error("L’export a échoué. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Section titre="Exporter mes listes">
      <p>
        Un fichier CSV de votre collection et de vos envies, à ouvrir dans un tableur. Une ligne
        par édition, avec le film, l’éditeur, le code-barres et le lien vers la fiche.
      </p>
      <div className="pt-1">
        <Bouton onClick={() => { void exporter(); }} disabled={enCours}>
          {enCours ? "Préparation…" : "Télécharger le CSV"}
        </Bouton>
      </div>
      <p>
        L’export est gratuit et le restera. C’est votre sauvegarde : gardez-la avant de supprimer
        quoi que ce soit.
      </p>
    </Section>
  );
}

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
