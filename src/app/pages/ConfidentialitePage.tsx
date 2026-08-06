import { Link } from "react-router";
import { PageStatique, Section, Encadre } from "../components/PageStatique";

export function ConfidentialitePage() {
  return (
    <PageStatique
      titre="Politique de confidentialité"
      sousTitre="Dernière mise à jour : août 2026"
      description="Aucune mesure d’audience, aucune publicité. Le catalogue se consulte sans compte ; un compte n’est demandé que pour garder des listes."
    >
      <Section titre="En résumé">
        <Encadre>
          Le catalogue se consulte librement, sans compte et sans que rien ne soit enregistré. Un
          compte, uniquement via Google, n’est demandé que pour garder des listes : votre
          collection et vos envies. Aucun outil de mesure d’audience, aucune régie publicitaire.
          Certains prix renvoient vers un marchand par un lien affilié : ce lien dépose un cookie
          de suivi <em>chez le marchand</em>, et seulement si vous cliquez.
        </Encadre>
      </Section>

      {/*
        Section ajoutée le 3 août 2026, jour du premier programme d'affiliation
        accepté (E.Leclerc via Awin).

        **Le déclencheur du dépôt est le clic, et c'est tout l'enjeu.** Un
        visiteur qui ne clique sur aucun prix ne rencontre jamais Awin : rien
        n'est chargé depuis leur domaine, la page ne porte aucun script tiers.
        C'est ce qui fait qu'aucun bandeau de consentement n'est requis ici,
        là où une régie publicitaire chargée au rendu en exigerait un.
      */}
      <Section titre="Liens affiliés">
        <p>
          Depuis août 2026, certaines éditions affichent un prix marchand. Ce prix est un lien
          affilié : si vous cliquez et que vous achetez, une commission nous est versée par le
          marchand. Le prix que vous payez est identique, avec ou sans ce lien.
        </p>
        {/*
          **La liste des marchands est nommée, pas résumée.** « Nos partenaires »
          serait plus commode à tenir et ne dirait rien : l'article L. 121-1 du
          code de la consommation demande que la nature commerciale du lien soit
          identifiable, et savoir chez qui l'on part en fait partie. momox shop
          s'ajoute le 6 août 2026, et il faut préciser qu'il vend de l'occasion :
          un prix bien plus bas que le neuf a une raison, et elle se dit.
        */}
        <p>
          Ces liens passent par <strong style={{ color: "var(--reel-text)" }}>Awin</strong>, une
          plateforme d’affiliation, et mènent aujourd’hui à deux marchands,{" "}
          <strong style={{ color: "var(--reel-text)" }}>E.Leclerc</strong> pour les disques neufs
          et <strong style={{ color: "var(--reel-text)" }}>momox shop</strong> pour l’occasion.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Rien n’est déposé tant que vous ne
          cliquez pas.</strong> Aucun script d’Awin n’est chargé par les pages du site, et la
          simple consultation d’une fiche ne les contacte jamais. Au clic, votre navigateur passe
          par Awin, qui dépose un cookie permettant au marchand d’attribuer la vente. Ce cookie est
          déposé par Awin et par le marchand, sous leurs domaines et selon leurs politiques,
          auxquelles nous n’avons pas accès.
        </p>
        <p>
          Nous ne recevons de leur part aucune donnée personnelle : ni votre identité, ni le détail
          de vos achats. Seuls des décomptes agrégés de clics et de commissions nous sont
          communiqués.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Le choix vous appartient</strong> : ne pas
          cliquer sur un prix suffit, et le catalogue reste entièrement consultable sans jamais en
          ouvrir un.
        </p>
      </Section>

      <Section titre="Sans compte">
        <p>
          Consulter le catalogue, parcourir, rechercher, ouvrir une fiche film, ne demande rien et
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
          suppression du compte. Celle-ci est immédiate et définitive, compte, collection et envies
          sont effacés dans le même mouvement, sans copie conservée.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Localisation</strong> : les comptes et les
          listes sont stockés sur des serveurs situés en Suède, au sein de l’Union européenne. Aucun
          transfert de vos données hors de l’Union n’a lieu.
        </p>
      </Section>

      <Section titre="Votre page publique">
        <p>
          À la création du compte, vous choisissez un identifiant, votre « @ ». Il donne son adresse
          à une page qui présente votre collection et vos envies, consultable{" "}
          <strong style={{ color: "var(--reel-text)" }}>sans compte</strong> par toute personne
          disposant du lien.
        </p>
        <p>
          Depuis le 3 août 2026, cette page est également{" "}
          <strong style={{ color: "var(--reel-text)" }}>
            indexée par les moteurs de recherche
          </strong>{" "}
          : elle peut donc être trouvée sans qu’on vous ait donné le lien, notamment en cherchant
          le nom que vous affichez ou votre identifiant. Seules les pages non masquées et portant au
          moins une édition sont déclarées à notre plan de site.
        </p>
        <p>
          Cette page affiche le nom que vous avez saisi, votre identifiant et les éditions que vous
          avez marquées. Elle n’affiche{" "}
          <strong style={{ color: "var(--reel-text)" }}>jamais</strong> votre adresse électronique ni
          votre identifiant Google : ces deux-là ne sortent pas des tables auxquelles la clé publique
          du site n’a aucun accès.
        </p>
        <p>
          Le nom affiché est repris de votre compte Google à l’inscription, puis modifiable :
          personne n’est tenu de publier son état civil pour avoir une page.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Vous pouvez la masquer</strong> à tout moment
          depuis la page Mon compte. L’adresse répond alors comme une page inexistante, et non
          « profil masqué » : un visiteur ne peut pas en déduire que le compte existe. Vos listes
          restent visibles pour vous seul, et rien n’est effacé.
        </p>
      </Section>

      <Section titre="Ce que le site ne fait pas">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>aucun outil de mesure d’audience ou d’analyse comportementale ;</li>
          <li>aucune régie publicitaire, aucun traceur de réseau social ;</li>
          <li>
            aucun script tiers chargé au rendu des pages, y compris pour l’affiliation : le suivi
            d’un lien affilié ne commence qu’au clic ;
          </li>
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
            <strong style={{ color: "var(--reel-text)" }}>TMDB</strong>, affiches et métadonnées des
            films.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Supabase</strong>, base de données du
            catalogue, et hébergement des comptes lorsqu’il en existe un. Serveurs situés en Suède
            (Union européenne).
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Google</strong>, uniquement au moment de
            la connexion, et seulement si vous choisissez de créer un compte.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Cloudflare Pages</strong>, hébergement
            des pages, et <strong style={{ color: "var(--reel-text)" }}>Cloudflare R2</strong>{" "}
            (<code style={{ color: "var(--reel-text)" }}>img.jaquette.app</code>) pour les visuels
            des boîtiers.
          </li>
          <li>
            <strong style={{ color: "var(--reel-text)" }}>Awin</strong> et les marchands{" "}
            <strong style={{ color: "var(--reel-text)" }}>E.Leclerc</strong> et{" "}
            <strong style={{ color: "var(--reel-text)" }}>momox shop</strong>, uniquement si vous
            cliquez sur un prix affiché.
          </li>
        </ul>
        {/*
          Google Fonts est sorti de cette liste le 3 août 2026 : les polices
          sont auto-hébergées depuis `public/fonts` depuis le 31 juillet, et la
          CSP n'autorise plus que `'self'` en `font-src`. La mention était donc
          fausse, et c'est exactement le genre de fausseté qui se retourne
          contre une politique de confidentialité, qui ne vaut que par son
          exactitude.
        */}
      </Section>

      <Section titre="Vos droits">
        <p>
          Le règlement (UE) 2016/679 (RGPD) vous garantit un droit d’accès, de rectification,
          d’effacement, de limitation, d’opposition et de portabilité.
        </p>
        <p>
          La suppression du compte est accessible depuis la page{" "}
          <Link to="/account" style={{ color: "var(--reel-accent)" }}>
            Mon compte
          </Link>{" "}
          et n’exige aucune démarche auprès de nous.
        </p>
        <p>
          Pour toute autre demande :{" "}
          <a href="mailto:contact@jaquette.app" style={{ color: "var(--reel-accent)" }}>
            contact@jaquette.app
          </a>
          . Vous pouvez également saisir la CNIL.
        </p>
      </Section>

      <Section titre="Évolutions">
        <p>
          Cette politique a été mise à jour en août 2026, à l’ouverture des premiers liens
          affiliés. Tout changement dans le traitement des données sera écrit ici avant sa mise en
          service, et non après.
        </p>
      </Section>
    </PageStatique>
  );
}
