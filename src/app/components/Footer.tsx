import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Instagram } from "lucide-react";
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

          {/*
            Les réseaux sont ici, sous l'identité, et non dans une colonne à eux :
            une colonne de titre « Réseaux » réclamait la même largeur que
            « Sections » ou « Parcourir » pour un seul compte ouvert.

            Seul Instagram existe. Bluesky et Letterboxd étaient de simples
            mentions en texte, ce qui se lisait comme « bientôt » ; une icône,
            elle, ne sait pas dire ça, elle se lit comme un lien mort. Elles
            reviendront le jour où les comptes existent, une ligne chacune.
          */}
          <ul className="flex items-center gap-2 pt-1">
            <li>
              <a
                href="https://www.instagram.com/jaquette.app/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="jaquette.app sur Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full outline-none transition hover:text-[var(--reel-text)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                style={{ border: "1px solid var(--reel-border)", color: "var(--reel-muted)" }}
              >
                <Instagram size={17} />
              </a>
            </li>
          </ul>
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
            {/* Le signalement est ici et non dans « Légal » : c'est une
                contribution au catalogue, pas une formalité, et c'est dans
                cette colonne que regardera quelqu'un qui n'a pas trouvé son
                disque. */}
            <LienInterne to="/report">Signaler une édition</LienInterne>
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
