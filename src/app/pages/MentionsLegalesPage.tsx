import { PageStatique, Section, Encadre } from "../components/PageStatique";

/**
 * Identité de l'éditeur, rassemblée ici et nulle part ailleurs.
 *
 * Le site est passé en activité professionnelle le 3 août 2026, premier
 * programme d'affiliation accepté (E.Leclerc via Awin). L'article 6 III de la
 * LCEN impose alors des mentions que le régime non professionnel dispensait de
 * publier : adresse de l'établissement, téléphone, numéro d'immatriculation.
 *
 * **Un seul endroit à corriger**, parce que ces valeurs se recopient
 * naturellement dans le corps de la page, dans la FAQ et dans un `og:`, et
 * qu'une identité légale qui diverge d'un endroit à l'autre est pire que pas
 * d'identité du tout.
 *
 * `TVA` porte la mention de franchise en base : un micro-entrepreneur sous les
 * seuils ne facture pas la TVA et **doit** l'écrire (art. 293 B du CGI).
 * Le jour où l'assujettissement arrive, elle est remplacée par le numéro
 * intracommunautaire.
 *
 * **`immatriculation` dit RNE et non RCS, et ce n'est pas un raccourci.**
 * L'entreprise est inscrite au Registre national des entreprises sous le code
 * APE 74.10Z, activités spécialisées de design, qui n'est ni commercial ni
 * artisanal : il n'y a donc ni numéro RCS ni numéro au répertoire des métiers
 * à publier. L'article 6 III de la LCEN n'exige ces numéros que lorsqu'ils
 * existent ; écrire « RCS de Nevers » sans inscription au RCS serait une
 * mention fausse, ce qui est pire que l'absence.
 */
const EDITEUR = {
  nom: "Rayan Adamczak",
  qualite: "entrepreneur individuel",
  adresse: "32 D passage privé du Maupas, 58000 Nevers",
  telephone: "06 19 60 00 63",
  siren: "852 258 680",
  siret: "852 258 680 00028",
  immatriculation: "inscrit au Registre national des entreprises (RNE)",
  tva: "TVA non applicable, article 293 B du code général des impôts",
  directeurPublication: "Rayan Adamczak",
};

/** Vrai tant qu'un champ obligatoire porte encore son marqueur. */
const IDENTITE_INCOMPLETE = Object.values(EDITEUR).some((v) => v === "À COMPLÉTER");

export function MentionsLegalesPage() {
  return (
    <PageStatique
      titre="Mentions légales"
      sousTitre="Dernière mise à jour : août 2026"
      description="Éditeur, hébergement, liens affiliés, propriété intellectuelle et signalement pour jaquette.app."
      /*
        `noindex, follow` depuis le 3 août 2026, jour où cette page a cessé
        d'être anonyme : elle porte désormais une adresse personnelle et un
        numéro de portable, que l'article 6 III de la LCEN oblige à publier.

        **L'obligation est de rendre accessible, pas de faire indexer.** Rien
        n'impose qu'une adresse de domicile remonte dans les résultats de
        recherche sur le nom de l'éditeur, et une page atteignable depuis le
        pied de page de tout le site est accessible au sens de la loi. Google
        lui-même n'attend pas ces pages dans son index.

        `follow` est conservé : les liens sortants doivent continuer d'être
        suivis, c'est le même arbitrage que sur la page de résultats de
        recherche.

        Ce qui **n'est pas** fait, et volontairement : masquer le numéro
        derrière un bouton, l'écrire en image, ou le composer en JavaScript.
        Ces trois procédés gênent d'abord les lecteurs d'écran et fragilisent
        l'accessibilité de la mention, ce qui est exactement ce que la loi
        exige. Le retrait de l'index est la seule protection qui ne coûte rien
        à personne.
      */
      noindex
    >
      <Section titre="Éditeur du site">
        <p>
          jaquette.app est édité par{" "}
          <strong style={{ color: "var(--reel-text)" }}>{EDITEUR.nom}</strong>,{" "}
          {EDITEUR.qualite}.
        </p>
        <ul className="flex list-none flex-col gap-1">
          <li>Adresse : {EDITEUR.adresse}</li>
          <li>Téléphone : {EDITEUR.telephone}</li>
          <li>
            SIREN : {EDITEUR.siren} — SIRET : {EDITEUR.siret}, {EDITEUR.immatriculation}
          </li>
          <li>{EDITEUR.tva}</li>
          <li>
            Courriel :{" "}
            <a href="mailto:contact@jaquette.app" style={{ color: "var(--reel-accent)" }}>
              contact@jaquette.app
            </a>
          </li>
        </ul>
        {/*
          Bandeau de garde, jamais destiné à être vu en ligne : il n'apparaît
          que si un champ obligatoire porte encore son marqueur. Publier des
          mentions légales trouées est une infraction à l'article 6 VI de la
          LCEN, et l'omission est silencieuse par nature, une page incomplète
          ressemblant trait pour trait à une page complète.
        */}
        {IDENTITE_INCOMPLETE && (
          <Encadre>
            <strong style={{ color: "var(--reel-text)" }}>Mentions incomplètes.</strong> Des
            informations obligatoires manquent encore sur cette page. Elles seront complétées sans
            délai ; en attendant, toute demande peut être adressée à contact@jaquette.app.
          </Encadre>
        )}
      </Section>

      <Section titre="Directeur de la publication">
        <p>{EDITEUR.directeurPublication}.</p>
      </Section>

      <Section titre="Hébergement">
        <p>
          Le site est hébergé par <strong style={{ color: "var(--reel-text)" }}>Cloudflare,
          Inc.</strong>, 101 Townsend St, San Francisco, CA 94107, États-Unis. <a
            href="https://www.cloudflare.com" target="_blank" rel="noreferrer noopener"
            style={{ color: "var(--reel-accent)" }}>cloudflare.com</a>.
        </p>
        <p>
          Les données du catalogue sont hébergées par <strong style={{ color: "var(--reel-text)" }}>
          Supabase</strong> (infrastructure située dans l’Union européenne).
        </p>
      </Section>

      <Section titre="Propriété intellectuelle">
        <p>
          Les affiches, visuels et éléments graphiques des œuvres restent la propriété de leurs
          ayants droit respectifs (studios, éditeurs, distributeurs). Ils sont affichés à titre
          d’illustration dans un but informatif, sans revendication de droits.
        </p>
        <p>
          Les métadonnées des films (titres, synopsis, distribution, affiches) proviennent de
          l’API <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener"
          style={{ color: "var(--reel-accent)" }}>The Movie Database (TMDB)</a>. Ce produit utilise
          l’API TMDB mais n’est ni approuvé ni certifié par TMDB.
        </p>
        <p>
          Les informations relatives aux éditions physiques (formats, dates de sortie, codes-barres)
          sont des données factuelles compilées à des fins de catalogage.
        </p>
      </Section>

      <Section titre="Base de données">
        <p>
          Prise isolément, une donnée factuelle, un code-barres, une date de sortie, un format,
          n’est protégée par aucun droit. Le catalogue dans son ensemble, lui, constitue une base de
          données dont la constitution a demandé un investissement substantiel : collecte et
          recoupement de plusieurs milliers de fiches, rattachement de chaque édition au film
          correspondant, vérification manuelle des cas ambigus et correction des rattachements
          erronés.
        </p>
        <p>
          À ce titre, l’éditeur bénéficie du droit du producteur de base de données prévu aux
          articles L. 341-1 et suivants du code de la propriété intellectuelle. Sont en conséquence
          interdites, sans autorisation préalable :
        </p>
        <p>
          • l’extraction de la totalité ou d’une partie qualitativement ou quantitativement
          substantielle du contenu, par transfert sur un autre support, quel qu’en soit le moyen ;<br />
          • la réutilisation, par mise à disposition du public, de tout ou partie substantielle du
          contenu ;<br />
          • l’extraction ou la réutilisation répétée et systématique de parties non substantielles,
          lorsqu’elle excède manifestement les conditions d’utilisation normale du site.
        </p>
        <p>
          Cette interdiction vise la copie du catalogue, y compris par moyen automatisé. Elle ne
          restreint ni la consultation, ni l’usage privé, ni la citation d’une fiche accompagnée
          d’un lien vers la page correspondante.
        </p>
        <Encadre>
          Un accès aux données à des fins de recherche, de conservation ou de réutilisation peut
          être demandé à l’adresse indiquée en tête de page. Les demandes motivées reçoivent une
          réponse.
        </Encadre>
      </Section>

      <Section titre="Signalement">
        <p>
          Tout ayant droit estimant qu’un contenu porte atteinte à ses droits peut en demander le
          retrait à l’adresse ci-dessus. La demande sera traitée dans les meilleurs délais.
        </p>
      </Section>

      <Section titre="Nature du service">
        <p>
          jaquette.app est un catalogue informatif d’éditions physiques de films.{" "}
          <strong style={{ color: "var(--reel-text)" }}>Le site ne vend aucun produit et
          n’encaisse aucun paiement.</strong> Il n’est ni un marchand, ni un intermédiaire de
          vente : toute commande se conclut sur le site du marchand, sous ses propres conditions.
        </p>
        <p>
          La consultation du catalogue est libre et gratuite, sans compte. Elle le restera : la
          rémunération du site ne repose pas sur l’accès à ses pages.
        </p>
      </Section>

      {/*
        Section ajoutée le 3 août 2026, premier programme d'affiliation accepté.

        **Elle est écrite au présent et nommément.** La rédaction précédente
        disait « si des liens d'affiliation étaient mis en place, leur présence
        serait signalée » : une promesse au conditionnel devient un mensonge le
        jour où le lien existe, et c'est précisément le manquement que
        l'article L. 121-1 du code de la consommation sanctionne. Nommer la
        plateforme et le marchand est ce qui rend la mention vérifiable.
      */}
      <Section titre="Liens affiliés">
        <p>
          Certaines éditions du catalogue affichent un prix accompagné du nom d’un marchand. Ces
          liens sont des <strong style={{ color: "var(--reel-text)" }}>liens affiliés</strong> :
          si vous les suivez et effectuez un achat, l’éditeur du site perçoit une commission versée
          par le marchand.
        </p>
        <p>
          <strong style={{ color: "var(--reel-text)" }}>Le prix que vous payez est le même</strong>,
          que vous passiez par ce lien ou que vous vous rendiez directement chez le marchand. La
          commission est prélevée sur la marge du vendeur, jamais ajoutée à votre facture.
        </p>
        <p>
          Ces liens sont gérés par la plateforme{" "}
          <a href="https://www.awin.com" target="_blank" rel="noreferrer noopener"
            style={{ color: "var(--reel-accent)" }}>Awin</a>. Marchand partenaire à ce jour :{" "}
          <strong style={{ color: "var(--reel-text)" }}>E.Leclerc</strong>. Cette liste sera tenue
          à jour ici.
        </p>
        <Encadre>
          La rémunération n’influence ni le contenu du catalogue, ni l’ordre d’affichage des
          éditions. Une édition est référencée parce qu’un disque existe, jamais parce qu’elle
          rapporte : le catalogue a été constitué avant tout partenariat et les éditions sans offre
          y figurent aux mêmes conditions. Aucun classement, aucune mise en avant n’est vendue.
        </Encadre>
        <p>
          Les prix affichés sont relevés automatiquement chez le marchand et datés au survol. Ils
          peuvent avoir changé depuis :{" "}
          <strong style={{ color: "var(--reel-text)" }}>seul le prix affiché sur le site du
          marchand au moment de la commande fait foi.</strong>
        </p>
        <p>
          Les prix présentés sans nom de marchand sont des prix conseillés par l’éditeur du disque,
          relevés à sa sortie. Ce ne sont pas des offres de vente.
        </p>
      </Section>
    </PageStatique>
  );
}
