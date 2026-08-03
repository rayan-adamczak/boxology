import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { lienFilm } from "../lib/liens";
import type { Film } from "../lib/reelio-db";
import type { Recherche } from "../lib/recherche-films";

/**
 * La grille de résultats, partagée par l'accueil et la page Catalogue.
 *
 * Elle porte aussi les trois états qui l'entourent, chargement, erreur et repli
 * approchant : les séparer laisserait chaque page réinventer ses messages, et
 * c'est le message du repli qui compte. Rendre *Interstellar* sur
 * « Intrestellar » sans un mot laisse croire que le titre s'écrit ainsi.
 */
export function GrilleFilms({
  films,
  chargement,
  erreur,
  approchante,
  query,
}: Pick<Recherche, "films" | "chargement" | "erreur" | "approchante" | "query">) {
  return (
    <>
      {erreur && (
        <p className="mt-4" style={{ fontSize: "15px", color: "#ff6b6b" }}>
          {erreur}
        </p>
      )}

      {!chargement && approchante && films.length > 0 && (
        <p className="mt-4" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
          Aucun titre ne correspond exactement à «&nbsp;{query.trim()}&nbsp;». Voici les plus proches.
        </p>
      )}

      {chargement ? (
        <div className="mt-5 flex items-center gap-2" style={{ color: "var(--reel-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "15px" }}>Chargement…</span>
        </div>
      ) : films.length === 0 ? (
        <p className="mt-5" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
          Aucun film trouvé.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {films.map((film) => (
            <CarteFilm key={film.id} film={film} />
          ))}
        </div>
      )}
    </>
  );
}

function CarteFilm({ film }: { film: Film }) {
  return (
    <Link
      to={lienFilm(film)}
      className="group block rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
    >
      <div
        className="relative w-full overflow-hidden rounded-[8px]"
        style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
      >
        <ImageWithFallback
          src={film.affiche_url ?? ""}
          alt={`Affiche de ${film.titre}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-110"
        />
      </div>
      <p
        className="mt-2 line-clamp-2"
        style={{ fontSize: "14px", fontWeight: 500, color: "var(--reel-text)" }}
      >
        {film.titre}
      </p>
      {film.annee && <p style={{ fontSize: "12px", color: "var(--reel-muted)" }}>{film.annee}</p>}
    </Link>
  );
}

/**
 * Les puces de regroupement, au-dessus des films et jamais à leur place :
 * « Warner » nomme un éditeur *et* apparaît dans des titres, et rien ne dit
 * laquelle des deux intentions est la bonne.
 */
export function PucesRegroupement({ suggestions }: Pick<Recherche, "suggestions">) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <Link
          key={s.href}
          to={s.href}
          className="rounded-full px-3.5 py-2 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{
            backgroundColor: "var(--reel-surface-2)",
            border: "1px solid var(--reel-border)",
            fontSize: "13px",
            color: "var(--reel-text)",
          }}
        >
          <span style={{ color: "var(--reel-muted)" }}>{s.intitule}</span>
          {" · "}
          {s.libelle}
        </Link>
      ))}
    </div>
  );
}
