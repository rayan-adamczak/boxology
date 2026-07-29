import { Link } from "react-router";

/** Pied de page : accès aux pages éditoriales et attribution TMDB (exigée par leur licence). */
export function Footer() {
  return (
    <footer
      className="mt-16 px-6 py-8 pb-24 lg:pb-8"
      style={{ borderTop: "1px solid var(--reel-border)" }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-6 gap-y-2" style={{ fontSize: "14px" }}>
          <Link to="/a-propos" style={{ color: "var(--reel-muted)" }}>À propos</Link>
          <Link to="/mentions-legales" style={{ color: "var(--reel-muted)" }}>Mentions légales</Link>
          <Link to="/confidentialite" style={{ color: "var(--reel-muted)" }}>Confidentialité</Link>
          <a href="mailto:rayan.adamczak@gmail.com" style={{ color: "var(--reel-muted)" }}>Contact</a>
        </nav>

        <p style={{ fontSize: "12px", color: "var(--reel-muted)", maxWidth: "460px" }}>
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
      </div>
    </footer>
  );
}
