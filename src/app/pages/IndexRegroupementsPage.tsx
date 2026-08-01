import { Link } from "react-router";
import { AXES, type NomAxe } from "../lib/regroupements";
import { useSeo } from "../lib/seo";

/**
 * Sommaire d'un axe : `/formats`, `/publishers`, `/genres`.
 *
 * Trois pages qui ne coûtent rien et qui font beaucoup : elles donnent au
 * crawler une porte unique vers les 72 regroupements, et au visiteur la vue
 * d'ensemble que le catalogue ne montre nulle part.
 *
 * Les effectifs affichés sortent de la table générée, donc datent de la
 * dernière génération. C'est dit à l'écran plutôt que présenté comme un
 * décompte courant.
 */

const INTROS: Record<NomAxe, string> = {
  formats:
    "Blu-ray, 4K, steelbook, digipack, coffret. Le format est relevé sur la fiche de l'édition, jamais déduit du titre.",
  publishers:
    "Les éditeurs vidéo présents au catalogue. L'information vient de la fiche technique du disque, elle qualifie donc l'objet et non l'œuvre.",
  genres: "Les genres des films du catalogue, tels que TMDB les renseigne.",
};

export function IndexRegroupementsPage({ axe }: { axe: NomAxe }) {
  const { titre, tables, base } = AXES[axe];

  useSeo({
    titre: `${titre} du catalogue`,
    description: INTROS[axe],
  });

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pb-24 pt-[120px]">
      <nav style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <Link to="/" className="hover:text-[var(--reel-accent-clair)]">
          Catalogue
        </Link>
      </nav>

      <h1
        className="pt-2"
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "clamp(30px, 5vw, 44px)",
          fontWeight: 800,
          color: "var(--reel-text)",
          lineHeight: 1.1,
        }}
      >
        {titre}
      </h1>

      <p className="pt-3 max-w-[680px]" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
        {INTROS[axe]}
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((entree) => (
          <li key={entree.slug}>
            <Link
              to={`${base}/${entree.slug}`}
              className="flex items-baseline justify-between gap-3 rounded-[6px] py-2 outline-none hover:text-[var(--reel-accent-clair)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{ fontSize: "15px", color: "var(--reel-text)" }}
            >
              <span>{entree.libelle}</span>
              <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{entree.compte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
