import { Link } from "react-router";
import { useSeo } from "../lib/seo";

/**
 * Repli pour toute URL inconnue.
 *
 * Il n'y en avait aucun : une adresse erronée affichait le bandeau, le pied de
 * page, et rien entre les deux. Le visiteur ne pouvait pas distinguer une page
 * cassée d'une page vide.
 *
 * Le serveur répond quand même 200 — c'est la contrepartie de la réécriture SPA
 * qui permet d'indexer les fiches films (cf. `public/_redirects`). D'où le
 * `noindex` : sans lui, un moteur enregistrerait ces pages comme du contenu
 * légitime au lieu de les écarter.
 */
export function IntrouvablePage() {
  useSeo({
    titre: "Page introuvable",
    description: "Cette adresse ne correspond à aucune page du catalogue.",
    noindex: true,
  });

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-[140px] text-center">
      <p style={{ fontSize: "48px", fontWeight: 700, color: "var(--reel-border)", lineHeight: 1 }}>
        404
      </p>
      <h1 className="pt-4" style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>
        Cette page n’existe pas
      </h1>
      <p
        className="mx-auto max-w-[460px] pt-3"
        style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}
      >
        L’adresse est peut-être erronée, ou la page a été retirée. Le catalogue, lui, est toujours
        là.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{
          fontSize: "14px",
          fontWeight: 600,
          backgroundColor: "var(--reel-accent)",
          color: "#ffffff",
          border: "1px solid var(--reel-accent)",
        }}
      >
        Retour au catalogue
      </Link>
    </div>
  );
}
