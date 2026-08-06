import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  AtSign,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  UserRound,
} from "lucide-react";
import { Banniere } from "../components/VueProfil";
import { UserAvatar } from "../components/UserAvatar";
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
import { SITE_ORIGIN, useSeo } from "../lib/seo";

/**
 * Réglages du compte, et surtout sa suppression.
 *
 * Un écran dédié plutôt qu'une entrée de menu : l'effacement est immédiat et
 * définitif, il lui faut la place d'être expliqué et une confirmation qu'on ne
 * déclenche pas d'un clic de travers. La politique de confidentialité annonce
 * que la suppression est accessible ici, c'est cette page qui tient la
 * promesse, et c'est une obligation du RGPD (article 17), pas un agrément.
 *
 * ## Pourquoi elle ne ressemble plus à une page éditoriale
 *
 * Elle était bâtie sur `PageStatique`, comme `/legal` et `/privacy` : une
 * colonne de 760 px, cinq sections titrées, et **treize paragraphes** pour
 * quatre gestes. Un écran de réglages n'est pas un texte à lire, c'est un
 * tableau de bord : on y vient changer une chose et repartir.
 *
 * D'où trois emprunts, relevés sur des écrans de comptes existants :
 *
 *   - **l'en-tête est celui du profil public**, même dégradé, même avatar,
 *     même `@` en chasse fixe. C'est la même personne vue depuis l'autre côté,
 *     et se reconnaître d'un coup d'œil vaut mieux qu'un encadré « Compte
 *     connecté » qui répète ce qu'on sait déjà ;
 *   - **des tuiles chiffrées** plutôt que des phrases. Ce qu'on possède, ce
 *     qu'on veut, ce que ça vaut : trois nombres, aucune prose ;
 *   - **des lignes groupées** dans une carte, chacune repliée sur son libellé
 *     et sa valeur, qui ne déploie son formulaire et ses avertissements qu'une
 *     fois ouverte. Le texte n'a pas été supprimé, il a été **déplacé au
 *     moment où il sert**.
 *
 * Ce qui n'a pas bougé, et ne devait pas : le dénominateur collé au total de
 * l'estimation (§8), les limites de ce total (§10), l'avertissement sur les
 * liens partagés avant de changer d'identifiant, et la phrase à recopier avant
 * d'effacer. Ces quatre-là sont le sujet, pas de l'habillage.
 */
export function ComptePage() {
  const session = useSession();

  useSeo({
    titre: "Mon compte",
    description: "Réglages de votre compte Jaquette et suppression définitive.",
    noindex: true,
  });

  if (session === undefined) {
    return (
      <Coquille>
        <AttentePleine libelle="Vérification de la session…" />
      </Coquille>
    );
  }

  if (session === null) return <SansCompte />;

  return <Connecte nom={nomAffiche(session)} email={session.user.email ?? ""} />;
}

/**
 * Cadre commun aux trois états.
 *
 * La bannière est **hors** de la gouttière, elle doit filer d'un bord à
 * l'autre ; le contenu, lui, s'aligne sur le mot-symbole du bandeau comme le
 * reste du site. La colonne reste bornée à 720 px : une ligne de réglage large
 * de 1 200 px met son libellé et sa valeur à deux mètres l'un de l'autre.
 */
function Coquille({ children }: { children: ReactNode }) {
  return (
    <>
      <Banniere />
      <div className="reel-gouttiere pb-24">
        <div className="max-w-[720px]">{children}</div>
      </div>
    </>
  );
}

function SansCompte() {
  return (
    <Coquille>
      <div className="-mt-12">
        <h1
          className="pt-16"
          style={{ fontSize: "28px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.2 }}
        >
          Mon compte
        </h1>
        <p className="max-w-[520px] pt-3" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
          Vous n’êtes pas connecté. Le site fonctionne très bien ainsi : vos listes restent dans ce
          navigateur. Un compte ne sert qu’à les retrouver sur vos autres appareils.
        </p>
        <div className="pt-6">
          <Bouton principal onClick={() => { void connexionGoogle("/account"); }}>
            Se connecter avec Google
          </Bouton>
        </div>
        <p className="pt-3" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Ni mot de passe, ni accès à vos autres services Google.
        </p>
      </div>
    </Coquille>
  );
}

function Connecte({ nom, email }: { nom: string; email: string }) {
  const etat = useProfil();
  const profil = etat.statut === "pret" ? etat.profil : null;

  return (
    <Coquille>
      <EnTete nom={profil?.nom || nom} email={email} identifiant={profil?.identifiant ?? null} visible={profil?.visible ?? false} />

      {etat.statut === "attente" ? (
        <AttentePleine hauteur={200} />
      ) : profil ? (
        <ReglagesProfil profil={profil} />
      ) : (
        <Carte>
          <div className="px-4 py-4" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
            Votre identifiant n’a pas encore été choisi, ou n’a pas pu être lu. Rechargez la page :
            l’écran de choix s’ouvrira.
          </div>
        </Carte>
      )}

      <Donnees />

      <p className="pt-6" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        Vos listes sont enregistrées sur nos serveurs, en Suède, au sein de l’Union européenne.{" "}
        <Link to="/privacy" style={{ color: "var(--reel-accent-clair)" }}>
          Confidentialité
        </Link>
      </p>
    </Coquille>
  );
}

/**
 * Avatar, nom, `@`, adresse, et les deux gestes de session.
 *
 * Repris de `VueProfil` au pixel près, chevauchement de la bannière compris :
 * c'est le même en-tête, et l'écart entre les deux se verrait tout de suite.
 * L'adresse électronique, elle, n'apparaît **que** ici, jamais sur la page
 * publique (§10).
 */
function EnTete({
  nom,
  email,
  identifiant,
  visible,
}: {
  nom: string;
  email: string;
  identifiant: string | null;
  visible: boolean;
}) {
  return (
    <header className="-mt-12 flex flex-wrap items-end gap-3">
      <span className="rounded-full p-1" style={{ backgroundColor: "var(--reel-bg)" }}>
        <UserAvatar name={nom} size={96} />
      </span>

      <div className="min-w-0 pb-1">
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>{nom}</h1>
        {identifiant && (
          <p
            className="truncate"
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "15px",
              color: "var(--reel-accent-clair)",
            }}
          >
            {arobase(identifiant)}
          </p>
        )}
        <p className="max-w-[420px] truncate" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          {email}
        </p>
      </div>

      <div className="mb-1 ml-auto flex items-center gap-2">
        {identifiant && visible && (
          <Lien to={cheminProfil(identifiant)}>
            <ExternalLink size={15} />
            Ma page
          </Lien>
        )}
        <Bouton onClick={() => { void deconnexion(); }} titre="Se déconnecter">
          <LogOut size={15} />
          <span className="hidden sm:inline">Déconnexion</span>
        </Bouton>
      </div>
    </header>
  );
}

/**
 * L'identifiant, le nom affiché et la visibilité de la page publique.
 *
 * Les trois vivent dans la même carte parce qu'ils décrivent une seule chose :
 * ce que voit quelqu'un qui ouvre votre lien. Les séparer aurait dispersé le
 * consentement, alors que c'est précisément ce qui doit se lire d'un coup
 * d'œil.
 *
 * **Changer d'identifiant ne casse plus les liens déjà partagés**, depuis
 * `20260806_identifiants_precedents.sql` : l'ancienne adresse redirige en 301
 * vers la nouvelle, comme `/films/560` redirige vers `/movies/<slug>/560`
 * (§7). La ligne ouverte le dit, parce que c'est exactement l'inquiétude qui
 * retient de corriger une faute de frappe dans son pseudonyme.
 *
 * La contrepartie est l'inverse de ce que le §3 posait au départ : **un
 * identifiant, une fois porté, n'est plus rendu à la circulation.** Le laisser
 * reprendre par quelqu'un d'autre ferait mener un lien partagé vers la
 * collection d'un tiers, ce qui est bien pire qu'un 404.
 */
function ReglagesProfil({ profil }: { profil: { identifiant: string; nom: string; visible: boolean } }) {
  const [ouverte, setOuverte] = useState<"identifiant" | "nom" | null>(null);
  const [identifiant, setIdentifiant] = useState(profil.identifiant);
  const [nom, setNom] = useState(profil.nom);
  const [verdict, setVerdict] = useState<EtatIdentifiant | "attente" | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le formulaire part de la valeur en base, et s'y réaligne quand elle change,
  // par exemple après un enregistrement réussi.
  useEffect(() => {
    setIdentifiant(profil.identifiant);
    setNom(profil.nom);
  }, [profil.identifiant, profil.nom]);

  // Même temporisation que l'écran de création : une requête par frappe
  // interrogerait la base huit fois pour un identifiant de huit signes.
  useEffect(() => {
    if (identifiant === profil.identifiant) { setVerdict(null); return; }
    if (!identifiantBienForme(identifiant)) { setVerdict("invalide"); return; }

    let annule = false;
    setVerdict("attente");
    const minuteur = setTimeout(() => {
      etatIdentifiant(identifiant)
        .then((e) => { if (!annule) setVerdict(e); })
        .catch(() => { if (!annule) setVerdict(null); });
    }, 400);

    return () => { annule = true; clearTimeout(minuteur); };
  }, [identifiant, profil.identifiant]);

  const nomPropre = nom.trim();

  async function enregistrer(champs: { identifiant?: string; nom?: string }) {
    setEnCours(true);
    try {
      await majProfil(champs);
      setOuverte(null);
      toast.success("Profil mis à jour.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerVisibilite() {
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

  const identifiantValide =
    identifiantBienForme(identifiant) &&
    identifiant !== profil.identifiant &&
    verdict !== "pris" &&
    verdict !== "reserve" &&
    verdict !== "invalide" &&
    verdict !== "attente";

  return (
    <section className="pt-8">
      <Titre>Ma page publique</Titre>

      <Carte>
        <Ligne
          icone={AtSign}
          libelle="Identifiant"
          valeur={arobase(profil.identifiant)}
          mono
          ouverte={ouverte === "identifiant"}
          onToggle={() => setOuverte(ouverte === "identifiant" ? null : "identifiant")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" style={{ fontFamily: "ui-monospace, monospace" }}>@</span>
            <Champ
              value={identifiant}
              onChange={(v) => setIdentifiant(normaliserIdentifiant(v))}
              disabled={enCours}
              mono
              ariaLabel="Identifiant"
            />
            <Bouton
              principal
              disabled={!identifiantValide || enCours}
              onClick={() => { void enregistrer({ identifiant }); }}
            >
              {enCours ? "…" : "Enregistrer"}
            </Bouton>
          </div>
          <p
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
              : `Les liens déjà partagés vers ${arobase(profil.identifiant)} suivront : l’ancienne adresse redirigera vers la nouvelle.`}
          </p>
        </Ligne>

        <Ligne
          icone={UserRound}
          libelle="Nom affiché"
          valeur={profil.nom}
          ouverte={ouverte === "nom"}
          onToggle={() => setOuverte(ouverte === "nom" ? null : "nom")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Champ
              value={nom}
              onChange={(v) => setNom(v.slice(0, 60))}
              disabled={enCours}
              ariaLabel="Nom affiché"
            />
            <Bouton
              principal
              disabled={nomPropre.length === 0 || nomPropre === profil.nom || enCours}
              onClick={() => { void enregistrer({ nom: nomPropre }); }}
            >
              {enCours ? "…" : "Enregistrer"}
            </Bouton>
          </div>
          <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            Il paraît sur votre page publique. Votre adresse électronique, elle, n’y paraît jamais.
          </p>
        </Ligne>

        <LigneBascule
          libelle="Page publique"
          detail={
            profil.visible
              ? `${SITE_ORIGIN.replace("https://", "")}${cheminProfil(profil.identifiant)}`
              : "Masquée : l’adresse répond comme une page inexistante."
          }
          mono={profil.visible}
          actif={profil.visible}
          disabled={enCours}
          onChange={() => { void basculerVisibilite(); }}
        />
      </Carte>
    </section>
  );
}

/**
 * Export CSV, puis suppression, dans cet ordre et dans la même carte.
 *
 * Les deux répondent à la même question, « et si je veux partir ». Le relevé du
 * 2 août 2026 met la perte de données au deuxième rang des griefs contre les
 * concurrents : des collections de sept à neuf cents titres effacées après une
 * mise à jour, sans récupération. Pouvoir tout emporter avant d'effacer est ce
 * qui rend la ligne rouge acceptable, et l'export doit donc rester au-dessus,
 * pas dans un autre bloc.
 *
 * **L'export est gratuit et le restera.** Movie Collector le réserve à sa
 * version Pro. Le grief numéro un dans ces avis n'est pas le fait de payer,
 * c'est le mur surgi en cours de route : gager l'export retournerait l'argument
 * de confiance.
 */
function Donnees() {
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
    <section className="pt-8">
      <Titre>Mes données</Titre>

      <Carte>
        <LigneAction
          icone={Download}
          libelle="Exporter mes listes"
          detail="CSV de la collection et des envies. Gratuit, et il le restera."
          action={enCours ? "Préparation…" : "Télécharger"}
          disabled={enCours}
          onClick={() => { void exporter(); }}
        />
        <SuppressionCompte />
      </Carte>
    </section>
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
 * explicite. La ligne repliée reste donc courte, mais **tout ce qu'elle déploie
 * a été conservé mot pour mot** : c'est le seul endroit de la page où raccourcir
 * le texte reviendrait à raccourcir l'avertissement.
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
    <Ligne
      icone={Trash2}
      libelle="Supprimer mon compte"
      valeur=""
      destructif
      ouverte={demande}
      onToggle={() => { setDemande(!demande); setSaisie(""); }}
    >
      <p style={{ fontSize: "14px", color: "var(--reel-muted)", lineHeight: "22px" }}>
        La suppression est immédiate et définitive. Le compte, la collection et les envies sont
        effacés dans le même mouvement, sans copie conservée : nous n’avons aucun moyen de les
        rétablir ensuite.
      </p>
      <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        Pour confirmer, recopiez <code style={{ color: "var(--reel-text)" }}>{PHRASE}</code>. La
        casse et la ponctuation n’ont pas d’importance.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Champ
          value={saisie}
          onChange={setSaisie}
          disabled={enCours}
          ariaLabel="Phrase de confirmation"
        />
        <Bouton
          destructif
          disabled={!confirme || enCours}
          onClick={() => { void supprimer(); }}
        >
          {enCours ? "Suppression…" : "Supprimer définitivement"}
        </Bouton>
      </div>
    </Ligne>
  );
}

/* ------------------------------------------------------------------ */
/* Briques d'interface                                                 */
/* ------------------------------------------------------------------ */

function Titre({ children }: { children: ReactNode }) {
  return (
    <h2 className="pb-3" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--reel-muted)" }}>
      {children}
    </h2>
  );
}

/**
 * Une carte de lignes, séparées par un filet et jamais par un espace.
 *
 * Le filet dit qu'elles appartiennent au même sujet ; des cartes distinctes
 * diraient l'inverse et rendraient la page deux fois plus haute pour la même
 * information.
 */
function Carte({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div className="[&>*+*]:border-t" style={{ borderColor: "var(--reel-border)" }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Ligne repliable : libellé et valeur courante, puis le formulaire au clic.
 *
 * Le chevron pivote plutôt que de changer de glyphe : deux icônes pour deux
 * états se lisent comme deux commandes différentes.
 */
function Ligne({
  icone: Icone,
  libelle,
  valeur,
  mono,
  destructif,
  ouverte,
  onToggle,
  children,
}: {
  icone: typeof AtSign;
  libelle: string;
  valeur: string;
  mono?: boolean;
  destructif?: boolean;
  ouverte: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const teinte = destructif ? "#ef6b6b" : "var(--reel-text)";

  return (
    <div style={{ borderColor: "var(--reel-border)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={ouverte}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition hover:bg-[var(--reel-surface-2)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--reel-accent)]"
      >
        <Icone size={17} style={{ color: destructif ? "#ef6b6b" : "var(--reel-muted)" }} />
        <span style={{ fontSize: "15px", fontWeight: 500, color: teinte }}>{libelle}</span>
        <span
          className="ml-auto truncate"
          style={{
            fontSize: "14px",
            color: "var(--reel-muted)",
            fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          }}
        >
          {valeur}
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform"
          style={{ color: "var(--reel-muted)", transform: ouverte ? "rotate(180deg)" : undefined }}
        />
      </button>

      {ouverte && (
        <div
          className="flex flex-col gap-3 px-4 pb-4"
          style={{ borderTop: "1px solid var(--reel-border)", paddingTop: "14px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Ligne qui déclenche une action au lieu d'ouvrir un formulaire. */
function LigneAction({
  icone: Icone,
  libelle,
  detail,
  action,
  disabled,
  onClick,
}: {
  icone: typeof Download;
  libelle: string;
  detail: string;
  action: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
      {/* Icône et texte dans un même bloc insécable : à 390 px, le `flex-wrap`
          du parent renvoyait le bouton à la ligne et laissait l'icône seule sur
          la sienne, ce qui se lit comme une puce orpheline. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icone size={17} className="shrink-0" style={{ color: "var(--reel-muted)" }} />
        <div className="min-w-0">
          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{libelle}</p>
          <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{detail}</p>
        </div>
      </div>
      <span className="ml-auto">
        <Bouton disabled={disabled} onClick={onClick}>{action}</Bouton>
      </span>
    </div>
  );
}

/** Ligne à interrupteur : l'état se lit et se change au même endroit. */
function LigneBascule({
  libelle,
  detail,
  mono,
  actif,
  disabled,
  onChange,
}: {
  libelle: string;
  detail: string;
  mono?: boolean;
  actif: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {actif ? (
        <Eye size={17} style={{ color: "var(--reel-accent-clair)" }} />
      ) : (
        <EyeOff size={17} style={{ color: "var(--reel-muted)" }} />
      )}
      <div className="min-w-0">
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{libelle}</p>
        <p
          className="truncate"
          style={{
            fontSize: "13px",
            color: "var(--reel-muted)",
            fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          }}
        >
          {detail}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={libelle}
        disabled={disabled}
        onClick={onChange}
        className="relative ml-auto h-[26px] w-[46px] shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
        style={{
          backgroundColor: actif ? "var(--reel-accent)" : "var(--reel-surface-2)",
          border: `1px solid ${actif ? "var(--reel-accent)" : "var(--reel-border)"}`,
        }}
      >
        <span
          className="absolute top-[2px] h-[20px] w-[20px] rounded-full transition-all"
          style={{ left: actif ? "22px" : "2px", backgroundColor: "#ffffff" }}
        />
      </button>
    </div>
  );
}

function Champ({
  value,
  onChange,
  disabled,
  mono,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  mono?: boolean;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      disabled={disabled}
      className="min-w-0 flex-1 rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: "var(--reel-bg)",
        border: "1px solid var(--reel-border)",
        color: "var(--reel-text)",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        fontSize: "14px",
      }}
    />
  );
}

function Lien({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        fontSize: "14px",
        fontWeight: 600,
        backgroundColor: "var(--reel-surface-2)",
        color: "var(--reel-text)",
        border: "1px solid var(--reel-border)",
      }}
    >
      {children}
    </Link>
  );
}

function Bouton({
  children,
  onClick,
  principal,
  destructif,
  disabled,
  titre,
}: {
  children: ReactNode;
  onClick: () => void;
  principal?: boolean;
  destructif?: boolean;
  disabled?: boolean;
  titre?: string;
}) {
  const fond = destructif ? "#b3261e" : principal ? "var(--reel-accent)" : "var(--reel-surface-2)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50 disabled:hover:brightness-100"
      style={{
        fontSize: "14px",
        fontWeight: 600,
        backgroundColor: fond,
        color: destructif || principal ? "#ffffff" : "var(--reel-text)",
        border: `1px solid ${destructif ? "#b3261e" : principal ? "var(--reel-accent)" : "var(--reel-border)"}`,
      }}
    >
      {children}
    </button>
  );
}
