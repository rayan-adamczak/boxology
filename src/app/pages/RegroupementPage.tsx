import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { AttentePleine } from "../components/AttenteRecherche";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { splitList, type Film } from "../lib/reelio-db";
import {
  getEditionsParCollection,
  getEditionsParEditeur,
  getEditionsParFormat,
  getFilmsParGenre,
  nombreDePages,
  PAR_PAGE,
  type LigneEdition,
} from "../lib/listes";
import { AXES, trouver, type NomAxe } from "../lib/regroupements";
import { lienFilm } from "../lib/liens";
import { cheminPage, fenetrePages } from "../lib/pagination";
import { useSeo, type Seo } from "../lib/seo";
import { IntrouvablePage } from "./IntrouvablePage";

/**
 * Page de regroupement : `/formats/steelbook`, `/publishers/carlotta-films`,
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

/**
 * Textes de la page. `total` est l'effectif entier de la sélection, pas celui
 * de la page affichée : annoncer « 60 éditions » quand il y en a 5 572 était
 * faux, et c'est précisément ce que la pagination vient corriger.
 */
const TEXTES: Record<NomAxe, { intro: (l: string, total: number) => string; vide: string }> = {
  formats: {
    intro: (libelle, total) =>
      `${total} éditions ${libelle} recensées au catalogue, avec leur film, leur éditeur et leur code-barres quand il est connu.`,
    vide: "Aucune édition recensée dans ce format.",
  },
  publishers: {
    intro: (libelle, total) =>
      `${total} éditions publiées par ${libelle} : formats, dates de parution et codes-barres.`,
    vide: "Aucune édition recensée pour cet éditeur.",
  },
  genres: {
    intro: (libelle, total) =>
      `${total} films de genre ${libelle.toLowerCase()} disponibles en édition physique : Blu-ray, 4K, steelbooks et coffrets.`,
    vide: "Aucun film de ce genre n'a d'édition recensée.",
  },
  collections: {
    intro: (libelle, total) =>
      `${total} éditions de la collection ${libelle}, dans l'ordre de la série quand le numéro est connu.`,
    vide: "Aucune édition recensée dans cette collection.",
  },
};

export function RegroupementPage({ axe }: { axe: NomAxe }) {
  const { slug, page: pageBrute } = useParams<{ slug: string; page?: string }>();
  const entree = slug ? trouver(axe, slug) : null;

  /* Une page non numérique, nulle ou négative n'existe pas. `/x/y/1` non plus :
     la première page est `/x/y`, et la Pages Function y redirige en 301 pour
     qu'une seule adresse porte ce contenu. */
  const page = pageBrute === undefined ? 1 : Number(pageBrute);
  const pageValide = Number.isInteger(page) && page >= 2 || pageBrute === undefined;

  const [editions, setEditions] = useState<LigneEdition[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!entree || !pageValide) return;
    let annule = false;
    setChargement(true);
    setErreur(null);

    /* `annule` couvre le changement d'axe et de page autant que le démontage :
       passer de `/genres/horreur` à `/genres/horreur/2` relance l'effet, et sans
       ce garde la réponse de la première requête écraserait celle de la seconde
       si elle arrivait en retard. */
    async function charger(libelle: string) {
      try {
        if (axe === "genres") {
          const resultat = await getFilmsParGenre(libelle, page);
          if (annule) return;
          setFilms(resultat.lignes);
          setEditions([]);
          setTotal(resultat.total);
        } else {
          const lire =
            axe === "formats"
              ? getEditionsParFormat
              : axe === "collections"
              ? getEditionsParCollection
              : getEditionsParEditeur;
          const resultat = await lire(libelle, page);
          if (annule) return;
          setEditions(resultat.lignes);
          setFilms([]);
          setTotal(resultat.total);
        }
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : "Chargement impossible");
      } finally {
        if (!annule) setChargement(false);
      }
    }

    charger(entree.libelle);

    return () => {
      annule = true;
    };
  }, [axe, entree?.libelle, page, pageValide]);

  const nombre = axe === "genres" ? films.length : editions.length;
  const pages = nombreDePages(total);

  /* Tant que le chargement n'a rien rendu, on passe `null` : `useSeo` laisse
     alors le <head> intact plutôt que d'annoncer un décompte provisoire qu'un
     crawler pourrait capturer.

     Le numéro entre dans le titre à partir de la deuxième page : sans lui, dix
     pages porteraient le même titre et Google les traiterait en doublons. */
  const seo = useMemo<Seo | null>(() => {
    if (!entree || chargement) return null;
    const suffixe = page > 1 ? `, page ${page} sur ${pages}` : "";
    return {
      titre: `${entree.libelle}, ${AXES[axe].titre.toLowerCase()}${suffixe}`,
      description: total > 0 ? TEXTES[axe].intro(entree.libelle, total) : TEXTES[axe].vide,
    };
  }, [axe, entree?.libelle, chargement, total, page, pages]);

  useSeo(seo);

  // Un slug hors table, ou un numéro de page invalide, sont des adresses qui
  // n'existent pas. La Pages Function y répond déjà 404 en production ; ici on
  // rend l'écran correspondant.
  if (!entree || !pageValide) return <IntrouvablePage />;
  // Page au-delà de la dernière : même traitement, une fois le total connu.
  if (!chargement && !erreur && page > pages) return <IntrouvablePage />;

  return (
    <div className="reel-gouttiere pb-24 pt-[120px]">
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
        {page > 1 && (
          <span style={{ fontWeight: 200, color: "var(--reel-muted)" }}>
            {"  "}page {page}
          </span>
        )}
      </h1>

      {!chargement && total > 0 && (
        <p className="pt-3 max-w-[720px]" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
          {TEXTES[axe].intro(entree.libelle, total)}
          {pages > 1 && (
            <>
              {" "}
              Page {page} sur {pages}, {PAR_PAGE} par page.
            </>
          )}
        </p>
      )}

      {chargement ? (
        <AttentePleine />
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
        <GrilleEditions
          editions={editions}
          montrerEditeur={axe !== "publishers"}
          montrerNumero={axe === "collections"}
        />
      )}

      {!chargement && !erreur && pages > 1 && (
        <Pagination base={AXES[axe].base} slug={entree.slug} page={page} pages={pages} />
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
  montrerNumero,
}: {
  editions: LigneEdition[];
  montrerEditeur: boolean;
  /** Affiche le rang dans la série : vrai sur une page de collection seule. */
  montrerNumero: boolean;
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
              {[
                /* Le numéro de tranche passe devant sur une page de
                   collection : c'est ce qu'on y cherche, et il ne veut rien
                   dire ailleurs. */
                montrerNumero && edition.numero_collection
                  ? `N°${edition.numero_collection}`
                  : null,
                montrerEditeur ? edition.editeur : null,
                ...formats,
              ]
                .filter(Boolean)
                .join(" · ")}
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
 * Navigation entre les pages.
 *
 * Des `<Link>` et non des boutons : un crawler ne clique pas, il suit des
 * `href`. Une pagination en JavaScript pur laisserait les 92 pages suivantes
 * de `/formats/blu-ray` aussi invisibles qu'avant.
 *
 * `rel="prev"` et `rel="next"` ne servent plus à Google depuis 2019, mais Bing
 * les lit encore, et ils ne coûtent rien.
 */
function Pagination({
  base,
  slug,
  page,
  pages,
}: {
  base: string;
  slug: string;
  page: number;
  pages: number;
}) {
  const lien = (n: number) => cheminPage(base, slug, n);
  const styleLien = {
    fontSize: "14px",
    color: "var(--reel-accent-clair)",
    padding: "6px 10px",
    borderRadius: "6px",
  } as const;

  return (
    <nav
      className="mt-12 flex flex-wrap items-center gap-1"
      aria-label={`Pages de ${slug}`}
    >
      {page > 1 && (
        <Link to={lien(page - 1)} rel="prev" style={styleLien} className="hover:underline">
          ← Précédent
        </Link>
      )}

      {fenetrePages(page, pages).map((n, i) =>
        n === 0 ? (
          <span key={`coupure-${i}`} style={{ ...styleLien, color: "var(--reel-muted)" }}>
            …
          </span>
        ) : n === page ? (
          <span
            key={n}
            aria-current="page"
            style={{
              ...styleLien,
              color: "var(--reel-text)",
              fontWeight: 700,
              backgroundColor: "var(--reel-surface-2)",
            }}
          >
            {n}
          </span>
        ) : (
          <Link key={n} to={lien(n)} style={styleLien} className="hover:underline">
            {n}
          </Link>
        ),
      )}

      {page < pages && (
        <Link to={lien(page + 1)} rel="next" style={styleLien} className="hover:underline">
          Suivant →
        </Link>
      )}
    </nav>
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
