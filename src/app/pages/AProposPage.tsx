import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { getStatsCatalogue, type StatsCatalogue } from "../lib/stats";

const nb = (n: number) => n.toLocaleString("fr-FR");

export function AProposPage() {
  const [stats, setStats] = useState<StatsCatalogue | null>(null);
  useEffect(() => {
    getStatsCatalogue().then(setStats);
  }, []);

  return (
    <PageStatique
      titre="À propos de Boxology"
      sousTitre="Un catalogue des éditions physiques de films, pensé pour celles et ceux qui collectionnent."
    >
      <Section titre="L’idée">
        <p>
          Un même film existe en dizaines d’éditions : steelbook, coffret collector, 4K, édition
          limitée d’un revendeur, réédition anniversaire. Ces différences comptent pour qui
          collectionne — et aucune base ne les recense correctement en français.
        </p>
        <p>
          Boxology sert à ça : retrouver quelle édition existe, ce qu’elle contient, et garder trace
          de ce que l’on possède.
        </p>
      </Section>

      <Section titre="Ce que vous pouvez faire">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>parcourir les films et les éditions publiées en France ;</li>
          <li>comparer formats, contenus et packagings d’un même titre ;</li>
          <li>marquer une édition comme <em>possédée</em> pour construire votre collection ;</li>
          <li>constituer une liste d’<em>envies</em>.</li>
        </ul>
        <Encadre>
          Il n’y a pas encore de compte utilisateur. Vos listes sont enregistrées dans votre
          navigateur : elles restent privées, mais ne sont pas synchronisées entre appareils et
          disparaissent si vous videz vos données de navigation. L’authentification fait partie des
          évolutions prévues.
        </Encadre>
      </Section>

      <Section titre="D’où viennent les données">
        <p>
          Les informations sur les films — titres, années, synopsis, distribution, affiches —
          proviennent de <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener"
          style={{ color: "var(--reel-accent)" }}>The Movie Database</a>, base communautaire ouverte.
        </p>
        <p>
          Les données sur les éditions physiques (formats, dates, contenus, codes-barres) sont
          compilées et vérifiées à partir de sources publiques spécialisées. Il s’agit de données
          factuelles de catalogage.
        </p>
        {stats && (
          <p>
            Le catalogue compte aujourd’hui{" "}
            <strong style={{ color: "var(--reel-text)" }}>{nb(stats.films)} œuvres</strong> et{" "}
            <strong style={{ color: "var(--reel-text)" }}>{nb(stats.editions)} éditions</strong>,
            et s’enrichit régulièrement.
          </p>
        )}
      </Section>

      <Section titre="Ce que le site n’est pas">
        <p>
          Boxology ne vend rien et ne permet aucun achat. C’est un catalogue informatif, sans
          transaction ni intermédiation.
        </p>
        <p>
          Le site ne comporte à ce jour aucun partenariat commercial. Si des liens d’affiliation
          venaient à être ajoutés, ils seraient signalés clairement.
        </p>
      </Section>

      <Section titre="Qui est derrière">
        <p>
          Boxology est un projet personnel de Rayan Adamczak, designer. Il est né d’un besoin
          simple : savoir quelle édition d’un film on possède déjà avant d’en acheter une autre.
        </p>
        <p>
          Remarques, corrections, éditions manquantes :{" "}
          <a href="mailto:rayan.adamczak@gmail.com" style={{ color: "var(--reel-accent)" }}>
            rayan.adamczak@gmail.com
          </a>
        </p>
      </Section>

      <Section titre="En savoir plus">
        <p className="flex flex-wrap gap-4">
          <Link to="/mentions-legales" style={{ color: "var(--reel-accent)" }}>Mentions légales</Link>
          <Link to="/confidentialite" style={{ color: "var(--reel-accent)" }}>Politique de confidentialité</Link>
        </p>
      </Section>
    </PageStatique>
  );
}
