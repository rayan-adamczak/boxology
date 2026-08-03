import { Link } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { lienFilm } from "../lib/liens";
import { splitList, type EditionWithFilm } from "../lib/reelio-db";

/**
 * Une jaquette de rail : le visuel du boîtier, le titre du film, les formats.
 *
 * Partagée par l'accueil et le tableau de bord depuis le 3 août 2026. Le visuel
 * retombe sur l'affiche TMDB quand l'édition n'a pas de jaquette : les dates
 * viennent de blu-ray.com et les images d'editioncollector, et les deux ne se
 * recouvrent pas (§3), donc un rail « récent » sans repli serait vide.
 */
export function CarteEdition({ edition, largeur = "rail" }: { edition: EditionWithFilm; largeur?: "rail" | "pleine" }) {
  const formats = splitList(edition.formats_extraits).slice(0, 2);
  const lien = lienFilm(edition.film);

  const contenu = (
    <>
      <span
        className="relative block w-full overflow-hidden rounded-[10px] ring-1 ring-transparent transition group-hover:ring-[var(--reel-accent-clair)]"
        style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
      >
        <ImageWithFallback
          src={edition.image_url ?? edition.film?.affiche_url ?? ""}
          secours={edition.film?.affiche_url}
          alt={edition.titre ?? "Édition"}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
        />
      </span>
      <span
        className="mt-2 line-clamp-2 block text-[var(--reel-text)] transition-colors group-hover:text-[var(--reel-accent-clair)]"
        style={{ fontSize: "15px", fontWeight: 600, lineHeight: "20px" }}
      >
        {edition.film?.titre ?? edition.titre}
      </span>
      {formats.length > 0 && (
        <span className="block" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {formats.join(" · ")}
        </span>
      )}
    </>
  );

  return (
    <div className={largeur === "rail" ? "w-[150px] shrink-0 sm:w-[186px]" : "w-full"}>
      {lien ? (
        <Link
          to={lien}
          className="group block rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
        >
          {contenu}
        </Link>
      ) : (
        <div className="group block">{contenu}</div>
      )}
    </div>
  );
}
