import { PageStatique, Section, Encadre } from "../components/PageStatique";

export function ConfidentialitePage() {
  return (
    <PageStatique
      titre="Politique de confidentialité"
      sousTitre="Dernière mise à jour : juillet 2026"
    >
      <Section titre="En résumé">
        <Encadre>
          Jaquette ne crée aucun compte, n’utilise aucun outil de mesure d’audience et ne transmet
          aucune donnée personnelle à un serveur. Votre collection et vos envies sont enregistrées
          uniquement dans votre navigateur.
        </Encadre>
      </Section>

      <Section titre="Données que nous ne collectons pas">
        <p>Le site ne comporte pas :</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>de création de compte ni d’authentification ;</li>
          <li>d’outil de mesure d’audience ou d’analyse comportementale ;</li>
          <li>de traceur publicitaire ou de réseau social ;</li>
          <li>de formulaire de collecte d’adresse électronique.</li>
        </ul>
        <p>
          Aucune donnée nominative n’est donc enregistrée sur nos serveurs, puisqu’aucune n’est
          demandée.
        </p>
      </Section>

      <Section titre="Données enregistrées dans votre navigateur">
        <p>
          Vos listes (collection, envies) sont conservées via le stockage local
          (<code>localStorage</code>) de votre navigateur, sous la clé{" "}
          <code style={{ color: "var(--reel-text)" }}>jaquette_statuts</code>. Ces informations
          restent sur votre appareil et ne sont jamais transmises.
        </p>
        <p>
          Conséquences : elles ne sont pas synchronisées entre vos appareils, et vider les données de
          navigation les supprime définitivement. Vous pouvez les effacer à tout moment depuis les
          réglages de votre navigateur.
        </p>
        <p>
          Un cookie technique est également utilisé pour mémoriser l’état d’affichage du menu
          latéral. Il ne permet aucune identification et ne nécessite pas de consentement.
        </p>
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
            catalogue, consultée en lecture seule.
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
          d’effacement et d’opposition sur vos données personnelles. Le site n’en détenant aucune,
          ces droits s’exercent directement depuis votre navigateur pour les données locales.
        </p>
        <p>
          Pour toute question :{" "}
          <a href="mailto:rayan.adamczak@gmail.com" style={{ color: "var(--reel-accent)" }}>
            rayan.adamczak@gmail.com
          </a>
          . Vous pouvez également saisir la CNIL.
        </p>
      </Section>

      <Section titre="Évolutions">
        <p>
          L’ajout de comptes utilisateurs ou de liens d’affiliation modifierait le traitement des
          données. Cette politique serait alors mise à jour avant toute mise en service, et le
          changement signalé sur le site.
        </p>
      </Section>
    </PageStatique>
  );
}
