import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { splitList, type Film } from "../lib/reelio-db";
import { getEditionsParEditeur, getEditionsParFormat, getFilmsParGenre, PLAFOND, type LigneEdition } from "../lib/listes";
import { AXES, trouver, type NomAxe } from "../lib/regroupements";
import { lienFilm } from "../lib/liens";
import { useSeo, type Seo } from "../lib/seo";
import { IntrouvablePage } from "./IntrouvablePage";

/**
 * Page de regroupement : `/formats/steelbook`, `/editeurs/carlotta-films`,
 * `/genres/horreur`.
 *
 * Elles existent pour deux raisons distinctes, et la seconde est la plus
 * importante :
 *
 *   - elles répondent à la requête de navigation, « steelbooks 4K français »,
 *     « éditions Carlotta », qu'aucune fiche film ne peut capter ;
 *   - **elles donnent au crawler un chemin vers les fiches profondes.** Sans
 *     elles la profondeur de clic du site est : accueil, 50 films, mur. Le
 *     reste du catalogue n'existe que par le sitemap, donc ne reçoit aucun jus
 *     de lien.
 *
 * Ce ne sont pas des pages éditions déguisées : une page édition aurait été un
 * doublon de la fiche film pour 58 % du catalogue (cf. §7). Une liste, elle, ne
 * duplique rien, elle n'existe nulle part ailleurs.
 */

const TEXTES: Record<NomAxe, { intro: (l: string, n: number) => string; vide: string }> = {
  formats: {
    intro: (libelle, n) =>
      `Les ${n} éditions ${libelle} les plus récemment recensées au catalogue, avec leur film, leur éditeur et leur code-barres quand il est connu.`,
    vide: "Aucune édition recensée dans ce format.",
  },
  editeurs: {
    intro: (libelle, n) =>
      `Les ${n} dernières éditions publiées par ${libelle} : formats, dates de parution et codes-barres.`,
    vide: "Aucune édition recensée pour cet éditeur.",
  },
  genres: {
    intro: (libelle, n) =>
      `${n} films de genre ${libelle.toLowerCase()} disponibles en édition physique : Blu-ray, 4K, steelbooks et coffrets.`,
    vide: "Aucun film de ce genre n'a d'édition recensée.",
  },
};

export function RegroupementPage({ axe }: { axe: NomAxe }) {
  const { slug } = useParams<{ slug: string }>();
  const entree = slug ? trouver(axe, slug) : null;

  const [editions, setEditions] = useState<LigneEdition[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!entree) return;
    let annule = false;
    setChargement(true);
    setErreur(null);

    const promesse =
      axe === "genres"
        ? getFilmsParGenre(entree.libelle).then((r) => !annule && (setFilms(r), setEditions([])))
        : (axe === "formats" ? getEditionsParFormat : getEditionsParEditeur)(entree.libelle).then(
            (r) => !annule && (setEditions(r), setFilms([])),
          );

    promesse
      .catch((e) => !annule && setErreur(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => !annule && setChargement(false));

    return () => {
      annule = true;
    };
  }, [axe, entree?.libelle]);

  const nombre = axe === "genres" ? films.length : editions.length;

  /* Tant que le chargement n'a rien rendu, on passe `null` : `useSeo` laisse
     alors le <head> intact plutôt que d'annoncer un décompte provisoire qu'un
     crawler pourrait capturer. */
  const seo = useMemo<Seo | null>(() => {
    if (!entree || chargement) return null;
    return {
      titre: `${entree.libelle}, ${AXES[axe].titre.toLowerCase()}`,
      description: nombre > 0 ? TEXTES[axe].intro(entree.libelle, nombre) : TEXTES[axe].vide,
    };
  }, [axe, entree?.libelle, chargement, nombre]);

  useSeo(seo);

  // Un slug hors table est une adresse qui n'existe pas. La Pages Function y
  // répond déjà 404 en production ; ici on rend l'écran correspondant.
  if (!entree) return <IntrouvablePage />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-[120px]">
      <nav style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <Link to="/" className="hover:text-[var(--reel-accent-clair)]">
          Catalogue
        </Link>
        {" › "}
        <Link to={AXES[axe].base} className="hover:text-[var(--reel-accent-clair)]">
          {AXES[axe].titre}
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
        {entree.libelle}
      </h1>

      {!chargement && nombre > 0 && (
        <p className="pt-3 max-w-[720px]" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
          {TEXTES[axe].intro(entree.libelle, nombre)}
          {nombre >= PLAFOND && (
            <>
              {" "}
              Le catalogue en compte davantage, cette page en montre {PLAFOND}.
            </>
          )}
        </p>
      )}

      {chargement ? (
        <div className="mt-8 flex items-center gap-2" style={{ color: "var(--reel-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Chargement…</span>
        </div>
      ) : erreur ? (
        <p className="mt-8" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          {erreur}
        </p>
      ) : nombre === 0 ? (
        <p className="mt-8" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          {TEXTES[axe].vide}
        </p>
      ) : axe === "genres" ? (
        <GrilleFilms films={films} />
      ) : (
        <GrilleEditions editions={editions} montrerEditeur={axe !== "editeurs"} />
      )}

      <AutresDeLAxe axe={axe} slugCourant={entree.slug} />
    </div>
  );
}

/** Grille d'affiches, même forme que le catalogue de l'accueil. */
function GrilleFilms({ films }: { films: Film[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {films.map((film) => (
        <Link
          key={film.id}
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
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--reel-text)" }}
          >
            {film.titre}
          </p>
          {film.annee && (
            <p style={{ fontSize: "12px", color: "var(--reel-muted)" }}>{film.annee}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

/**
 * Grille de jaquettes.
 *
 * Le visuel retombe sur l'affiche du film quand l'édition n'en a pas : les
 * jaquettes sont chez editioncollector et les specs chez blu-ray.com, sans
 * recouvrement (§3), donc une liste d'éditions blu-ray.com n'aurait aucune
 * image sans ce repli.
 */
function GrilleEditions({
  editions,
  montrerEditeur,
}: {
  editions: LigneEdition[];
  montrerEditeur: boolean;
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {editions.map((edition) => {
        const formats = splitList(edition.formats_extraits).slice(0, 2);
        const lien = lienFilm(edition.film);
        const contenu = (
          <>
            <span
              className="relative block w-full overflow-hidden rounded-[8px]"
              style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
            >
              <ImageWithFallback
                src={edition.image_url ?? edition.film?.affiche_url ?? ""}
                alt={edition.titre ?? "Édition"}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              />
            </span>
            <span
              className="mt-2 line-clamp-2 block text-[var(--reel-text)] transition-colors group-hover:text-[var(--reel-accent-clair)]"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              {edition.film?.titre ?? edition.titre}
            </span>
            <span className="block" style={{ fontSize: "12px", color: "var(--reel-muted)" }}>
              {[montrerEditeur ? edition.editeur : null, ...formats].filter(Boolean).join(" · ")}
            </span>
          </>
        );
        return lien ? (
          <Link
            key={edition.id}
            to={lien}
            className="group block rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          >
            {contenu}
          </Link>
        ) : (
          <div key={edition.id} className="group block">
            {contenu}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Les autres entrées du même axe, en pied de page.
 *
 * C'est ce qui relie les 72 pages entre elles : sans ce bloc, chacune est une
 * impasse que seul le sitemap fait découvrir.
 */
function AutresDeLAxe({ axe, slugCourant }: { axe: NomAxe; slugCourant: string }) {
  const autres = AXES[axe].tables.filter((e) => e.slug !== slugCourant);
  if (autres.length === 0) return null;

  return (
    <section className="mt-16 border-t pt-8" style={{ borderColor: "var(--reel-border)" }}>
      <h2
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--reel-text)",
        }}
      >
        Autres {AXES[axe].titre.toLowerCase()}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {autres.map((entree) => (
          <li key={entree.slug}>
            <Link
              to={`${AXES[axe].base}/${entree.slug}`}
              style={{ fontSize: "14px", color: "var(--reel-accent-clair)" }}
              className="hover:underline"
            >
              {entree.libelle}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
