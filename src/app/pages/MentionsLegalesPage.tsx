import { PageStatique, Section, Encadre } from "../components/PageStatique";

export function MentionsLegalesPage() {
  return (
    <PageStatique
      titre="Mentions légales"
      sousTitre="Dernière mise à jour : juillet 2026"
      description="Éditeur, hébergement, propriété intellectuelle et signalement pour le site Jaquette."
    >
      <Section titre="Éditeur du site">
        <p>
          Jaquette est un site personnel édité par <strong style={{ color: "var(--reel-text)" }}>Rayan
          Adamczak</strong>, designer, agissant à titre non professionnel.
        </p>
        <p>
          Contact : <a href="mailto:rayan.adamczak@gmail.com" style={{ color: "var(--reel-accent)" }}>
          rayan.adamczak@gmail.com</a>
        </p>
        <Encadre>
          Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l’économie numérique, une personne physique éditant un site à titre non professionnel peut
          ne pas rendre publiques ses coordonnées complètes, sous réserve d’avoir communiqué son
          identité à son hébergeur. Ces mentions seront complétées si le site venait à exercer une
          activité commerciale.
        </Encadre>
      </Section>

      <Section titre="Directeur de la publication">
        <p>Rayan Adamczak.</p>
      </Section>

      <Section titre="Hébergement">
        <p>
          Le site est hébergé par <strong style={{ color: "var(--reel-text)" }}>Cloudflare,
          Inc.</strong>, 101 Townsend St, San Francisco, CA 94107, États-Unis — <a
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

      <Section titre="Signalement">
        <p>
          Tout ayant droit estimant qu’un contenu porte atteinte à ses droits peut en demander le
          retrait à l’adresse ci-dessus. La demande sera traitée dans les meilleurs délais.
        </p>
      </Section>

      <Section titre="Nature du service">
        <p>
          Jaquette est un catalogue informatif d’éditions physiques de films. Le site ne vend aucun
          produit et ne réalise aucune transaction.
        </p>
        <Encadre>
          Le site ne comporte à ce jour aucun lien commercial ni partenariat rémunéré. Si des liens
          d’affiliation étaient mis en place, leur présence serait signalée de manière claire et
          visible, conformément aux obligations de transparence applicables.
        </Encadre>
      </Section>
    </PageStatique>
  );
}
