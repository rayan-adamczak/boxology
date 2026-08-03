import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

const CONTACT = "contact@jaquette.app";

/** Titre d'une colonne du pied de page. */
function Colonne({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}>{titre}</h2>
      <ul className="flex flex-col gap-2" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        {children}
      </ul>
    </div>
  );
}

function LienInterne({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} style={{ color: "var(--reel-muted)" }}>{children}</Link>
    </li>
  );
}

/**
 * Pied de page.
 *
 * L'attribution TMDB est exigée par leur licence : elle doit rester visible
 * sur toutes les pages, d'où sa présence ici et non sur la seule page À propos.
 */
export function Footer() {
  return (
    <footer
      className="mt-16 py-12 pb-24 lg:pb-12"
      style={{ borderTop: "1px solid var(--reel-border)" }}
    >
      <div className="reel-gouttiere flex flex-col gap-10 lg:flex-row lg:justify-between">
        {/* Identité */}
        <div className="flex max-w-[320px] flex-col gap-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Accueil jaquette.app">
            {/* 19 px pour un nom à 20, la griffe dépassant le calage
                typographique comme au bandeau, où le couple est 24 et 27. */}
            <Logo hauteur={19} />
            <span style={{ fontFamily: "var(--reel-font-titre)", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--reel-text)" }}>
              jaquette.app
            </span>
          </Link>
          <p style={{ fontSize: "14px", lineHeight: "21px", color: "var(--reel-muted)" }}>
            Le catalogue des éditions physiques de films.
            <br />
            Blu-ray, 4K, steelbooks et coffrets, pour le marché français.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <Colonne titre="Sections">
            <LienInterne to="/catalogue">Catalogue</LienInterne>
            <LienInterne to="/welcome">Comment ça marche</LienInterne>
            <LienInterne to="/profile">Ma collection</LienInterne>
            <LienInterne to="/profile?liste=envies">Mes envies</LienInterne>
            <LienInterne to="/about">À propos</LienInterne>
          </Colonne>

          {/* Les trois sommaires de regroupement. Ils sont ici et non dans une
              page perdue : le pied de page est sur toutes les pages, donc c'est
              le seul endroit qui garantisse au crawler d'y arriver depuis
              n'importe quelle fiche. */}
          <Colonne titre="Parcourir">
            <LienInterne to="/formats">Formats</LienInterne>
            <LienInterne to="/publishers">Éditeurs</LienInterne>
            <LienInterne to="/genres">Genres</LienInterne>
            <LienInterne to="/collections">Collections</LienInterne>
          </Colonne>

          {/* Aucun compte de réseau social ouvert pour l'instant : de simples
              mentions, pas des liens morts. À remplacer par des <a> le jour où
              ils existent. Rien à voir avec les comptes utilisateurs, qui eux
              existent depuis juillet 2026. */}
          <Colonne titre="Réseaux">
            <li>Instagram</li>
            <li>Bluesky</li>
            <li>Letterboxd</li>
          </Colonne>

          <Colonne titre="Légal">
            <LienInterne to="/legal">Mentions légales</LienInterne>
            <LienInterne to="/privacy">Confidentialité</LienInterne>
          </Colonne>

          <a
            href={`mailto:${CONTACT}`}
            className="inline-flex h-fit items-center gap-1"
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--reel-text)",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            Nous écrire
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>

      <p
        className="reel-gouttiere pt-10"
        style={{ fontSize: "12px", lineHeight: "18px", color: "var(--reel-muted)" }}
      >
        Métadonnées et affiches fournies par{" "}
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: "var(--reel-muted)", textDecoration: "underline" }}
        >
          TMDB
        </a>
        . Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.
      </p>
    </footer>
  );
}
