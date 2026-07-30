import { Link } from "react-router";
import { PageStatique, Section, Encadre } from "../components/PageStatique";

export function ConfidentialitePage() {
  return (
    <PageStatique
      titre="Politique de confidentialité"
      sousTitre="Dernière mise à jour : juillet 2026"
      description="Aucun tracker, aucune publicité. Le catalogue se consulte sans compte ; un compte n’est demandé que pour garder des listes."
    >
      <Section titre="En résumé">
        <Encadre>
          Le catalogue se consulte librement, sans compte et sans que rien ne soit enregistré. Un
          compte — uniquement via Google — n’est demandé que pour garder des listes : votre
          collection et vos envies. Aucun outil de mesure d’audience, aucun traceur publicitaire.
        </Encadre>
      </Section>

      <Section titre="Sans compte">
        <p>
          Consulter le catalogue — parcourir, rechercher, ouvrir une fiche film — ne demande rien et
          n’enregistre rien vous concernant. Aucune liste n’est conservée dans votre navigateur.
        </p>
        <p>
          Un cookie technique mémorise l’état d’affichage du menu latéral. Il ne permet aucune
          identification et ne nécessite pas de consentement.
        </p>
        <p>
          Jusqu’en juillet 2026, les listes étaient conservées dans le navigateur sous la clé{" "}
          <code style={{ color: "var(--reel-text)" }}>jaquette_statuts</code>. Elles ne le sont plus.
          Si une telle liste existe encore sur votre appareil, elle est reprise dans votre compte à
          votre première connexion, puis effacée de votre navigateur.
        </p>
      </Section>

      <Section titre="Avec un compte">
        <p>
          La connexion se fait exclusivement par un compte Google. Ce choix est délibéré : aucun mot
          de passe ne circule ni n’est conservé par le site, et il n’existe aucun formulaire
          d’inscription à protéger.
        </p>
        <p>Google nous transmet alors, et rien de plus :</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>votre adresse électronique ;</li>
          <li>votre nom et votre photo de profil publics ;</li>
          <li>un identifiant technique propre à Google.</li>
        </ul>
        <p>
          Le site ne reçoit pas votre mot de passe et n’obtient aucun accès à vos autres services
          Google (messagerie, agenda, fichiers).
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Finalité</strong> : associer vos listes à
          votre compte pour les retrouver sur vos autres appareils, et rien d’autre. Ces données ne
          sont ni revendues, ni transmises à des tiers, ni utilisées pour vous adresser des messages.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Base légale</strong> : votre demande
          explicite, la création du compte étant l’unique moyen de fournir la synchronisation
          (article 6.1.b du RGPD).
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Conservation</strong> : jusqu’à la
          suppression du compte. Celle-ci est immédiate et définitive — compte, collection et envies
          sont effacés dans le même mouvement, sans copie conservée.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Localisation</strong> : les comptes et les
          listes sont stockés sur des serveurs situés en Suède, au sein de l’Union européenne. Aucun
          transfert de vos données hors de l’Union n’a lieu.
        </p>
      </Section>

      <Section titre="Ce que le site ne fait pas">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>aucun outil de mesure d’audience ou d’analyse comportementale ;</li>
          <li>aucun traceur publicitaire ou de réseau social ;</li>
          <li>aucune lettre d’information, aucun message promotionnel ;</li>
          <li>aucun profilage, aucune décision automatisée.</li>
        </ul>
      </Section>

      <Section titre="Services tiers">
        <p>
          Certaines ressources sont chargées depuis des services externes. Ces services reçoivent
          alors votre adresse IP, techniquement nécessaire à toute connexion.
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            <strong style={{ color: "var(--reel-text)" }}>TMDB</strong> — affiches et métadonnées des
            films.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Supabase</strong> — base de données du
            catalogue, et hébergement des comptes lorsqu’il en existe un. Serveurs situés en Suède
            (Union européenne).
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Google</strong> — uniquement au moment de
            la connexion, et seulement si vous choisissez de créer un compte.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Cloudflare Pages</strong> — hébergement
            des pages.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Google Fonts</strong> — polices de
            caractères.
          </li>
        </ul>
      </Section>

      <Section titre="Vos droits">
        <p>
          Le règlement (UE) 2016/679 (RGPD) vous garantit un droit d’accès, de rectification,
          d’effacement, de limitation, d’opposition et de portabilité.
        </p>
        <p>
          La suppression du compte est accessible depuis la page{" "}
          <Link to="/compte" style={{ color: "var(--reel-accent)" }}>
            Mon compte
          </Link>{" "}
          et n’exige aucune démarche auprès de nous.
        </p>
        <p>
          Pour toute autre demande :{" "}
          <a href="mailto:rayan.adamczak@gmail.com" style={{ color: "var(--reel-accent)" }}>
            rayan.adamczak@gmail.com
          </a>
          . Vous pouvez également saisir la CNIL.
        </p>
      </Section>

      <Section titre="Évolutions">
        <p>
          L’ajout de liens d’affiliation modifierait le traitement des données. Cette politique
          serait alors mise à jour avant toute mise en service, et le changement signalé sur le site.
        </p>
      </Section>
    </PageStatique>
  );
}
