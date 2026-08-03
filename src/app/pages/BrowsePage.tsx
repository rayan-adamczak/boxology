import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Library, Bookmark, Disc3 } from "lucide-react";
import { RailHorizontal } from "../components/RailHorizontal";
import { ModaleConnexion } from "../components/ModaleConnexion";
import { CarteEdition } from "../components/CarteEdition";
import { ChampRecherche } from "../components/ChampRecherche";
import { GrilleFilms, PucesRegroupement } from "../components/GrilleFilms";
import { useSession } from "../lib/auth";
import { getDernieresEditions, type EditionWithFilm } from "../lib/reelio-db";
import { useRechercheFilms } from "../lib/recherche-films";
import { useSeo } from "../lib/seo";

/**
 * Chiffres du catalogue, écrits en dur et arrondis vers le bas.
 *
 * Les compter à l'exécution coûterait trois requêtes `count` avant le premier
 * pixel, pour une phrase d'accroche. Arrondis par le bas parce qu'ils ne font
 * que croître : « plus de 4 500 films » restera vrai sans qu'on y touche, là où
 * un chiffre exact serait faux dès le prochain import.
 *
 * **Le revers, c'est qu'ils vieillissent en silence.** Relevés le 31 juillet
 * 2026 sur 4 582 films, 8 471 éditions et 5 305 codes-barres, alors que la page
 * en annonçait encore 3 500, 5 700 et 3 400 : le catalogue avait grossi d'un
 * tiers sans que l'accroche bouge, et rien ne l'avait signalé. Les relire après
 * chaque grosse campagne d'import.
 *
 * Rebelote le 2 août 2026, et l'écart était pire : **8 664 films, 15 483
 * éditions, 5 460 codes-barres** pour une accroche restée à 4 500 et 8 400. Les
 * imports Metaluna, Le Chat qui fume, Zavvi et la clôture de blu-ray.com ont
 * doublé le fonds en deux jours. Le compte des codes-barres, lui, a à peine
 * bougé : ni Zavvi ni Metaluna n'en publient.
 *
 * Une ligne pour les recompter :
 *
 *     curl -sI -H "apikey: $CLE" -H "Prefer: count=exact" -H "Range: 0-0" \
 *       "https://<projet>.supabase.co/rest/v1/editions?select=id" | grep -i content-range
 */
const CATALOGUE = { films: "8 500", editions: "15 000", codesBarres: "5 400" };

/**
 * Libellé de section, calqué sur Letterboxd.
 *
 * Leur accueil ne titre pas ses rangées en gros : « Just Reviewed… » fait 13 px
 * en capitales, en gris, et c'est la jaquette qui porte le regard. Nos titres à
 * 20 px en graisse 600 se disputaient l'attention avec les visuels, sur une page
 * dont le sujet est justement de montrer des objets.
 *
 * L'interlettrage est ce qui rend des capitales lisibles à cette taille : sans
 * lui elles se referment et le mot devient un bloc.
 */
const LIBELLE_SECTION = {
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--reel-muted)",
} as const;

const ARGUMENTS_COMPTE = [
  {
    icone: Library,
    titre: "Votre collection, éditions comprises",
    texte:
      "Pas seulement « j’ai le film » : le steelbook Fnac, le digibook, la 4K. Deux éditions du même titre sont deux objets différents.",
  },
  {
    icone: Bookmark,
    titre: "Une liste d’envies qui sert en boutique",
    texte:
      "Le code-barres et la zone sont sur la fiche. De quoi vérifier en rayon que c’est bien l’édition que vous cherchez.",
  },
  {
    icone: Disc3,
    titre: "Ce qu’il y a vraiment sur le disque",
    texte:
      "Définition, HDR, pistes audio, sous-titres, éditeur. Relevé édition par édition, pas déduit du titre.",
  },
];

export function BrowsePage() {
  const session = useSession();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [dernieres, setDernieres] = useState<EditionWithFilm[]>([]);

  /*
    Recherche, temporisation et règle d'historique vivent dans
    `useRechercheFilms`, partagé avec la page Catalogue : deux copies auraient
    dérivé au premier réglage.
  */
  const recherche = useRechercheFilms();
  const navigate = useNavigate();
  const terme = recherche.query.trim();

  /*
    Une recherche est dans l'URL, `/?q=steelbook`.

    Ce n'est pas pour le référencement : Google a **supprimé la sitelinks
    searchbox en novembre 2023**. C'est pour l'usage : une recherche s'envoie,
    se met en favori, et le bouton retour cesse de faire quitter le site.

    D'où le `noindex` : une page de résultats de recherche interne est du
    contenu généré à la volée, et Google demande explicitement de ne pas la
    faire indexer. `follow` reste. Le canonical est calculé depuis le seul
    `pathname` (cf. `lib/seo.ts`), donc il vaut `/` quelle que soit la frappe.
  */
  useSeo(
    terme
      ? {
          titre: `Recherche : ${terme}`,
          description: `Résultats pour « ${terme} » dans le catalogue des éditions physiques.`,
          noindex: true,
        }
      : {
          titre: "jaquette.app, le catalogue des éditions Blu-ray et 4K françaises",
          description:
            "Retrouvez toutes les éditions physiques d’un film : steelbook, coffret collector, 4K, digibook. Comparez formats et contenus, et gardez la trace de votre collection.",
          racine: true,
        },
  );

  /*
    Les dernières éditions ne dépendent pas de la recherche : chargées une fois,
    elles restent en place pendant qu'on tape. L'échec est silencieux, c'est un
    bandeau d'illustration, pas une raison de barrer la page d'un message rouge.
  */
  useEffect(() => {
    let annule = false;
    getDernieresEditions(18)
      .then((eds) => { if (!annule) setDernieres(eds); })
      .catch(() => {});
    return () => { annule = true; };
  }, []);


  // `undefined` = session en cours de résolution. On n'affiche l'invitation
  // qu'une fois la réponse connue, sinon elle apparaît puis disparaît sous les
  // yeux d'un visiteur déjà connecté.
  const invite = session === null;

  return (
    <div className="w-full pb-24 md:pb-8">
      <ModaleConnexion ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} retourVers="/" />

      {/*
        Accroche. Une mosaïque d'affiches derrière le texte plutôt qu'un aplat :
        le sujet du site, ce sont les jaquettes, et une page d'accueil qui n'en
        montre aucune vend mal un catalogue de 15 000 objets.
      */}
      <section className="relative overflow-hidden">
        <MosaiqueAffiches editions={dernieres} />

        {/* Héros centré depuis le 3 août 2026 : la mosaïque d'affiches occupe
            toute la largeur, un bloc de texte aligné à gauche la déséquilibrait
            en laissant la moitié droite sans rien. */}
        <div className="reel-gouttiere relative flex flex-col items-center pb-16 pt-[124px] text-center sm:pb-24 sm:pt-[152px]">
          <h1
            className="max-w-[720px]"
            style={{
              fontFamily: "var(--reel-font-titre)",
              // Même échelle que le héros de /bienvenue : les deux pages
              // ouvrent le site, elles ne peuvent pas annoncer deux tailles.
              fontSize: "clamp(38px, 6vw, 68px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--reel-text)",
            }}
          >
            Le catalogue des éditions physiques
          </h1>
          <p
            className="mt-6 max-w-[660px]"
            style={{ fontSize: "17px", color: "var(--reel-text)", lineHeight: "26px" }}
          >
            Plus de {CATALOGUE.films} films et {CATALOGUE.editions} éditions françaises
            (steelbooks, coffrets, 4K, digibooks), avec leurs formats, leurs zones et{" "}
            {CATALOGUE.codesBarres} codes-barres.
          </p>

          <div className="mt-9 w-full max-w-[680px]">
            {/*
              L'aperçu réutilise les résultats de la page, il n'en demande pas
              d'autres. Tronqué à huit : la grille au-dessous porte déjà les
              cinquante, le panneau sert à atteindre un titre sans faire défiler.

              Entrée et « voir tous les résultats » emmènent vers /catalogue,
              qui a les filtres, plutôt que de laisser sur une page d'accueil
              dont la grille n'est qu'un aperçu du catalogue.
            */}
            <ChampRecherche
              valeur={recherche.query}
              onChange={recherche.setQuery}
              apercu={{
                films: recherche.films.slice(0, 8),
                suggestions: recherche.suggestions,
                chargement: recherche.chargement,
                approchante: recherche.approchante,
              }}
              onValider={(v) =>
                navigate(v.trim() ? `/catalogue?q=${encodeURIComponent(v.trim())}` : "/catalogue")
              }
            />
          </div>
        </div>
      </section>

      <div className="reel-gouttiere">
        {/*
          Pendant une recherche, tout le reste s'efface : quelqu'un qui tape un
          titre veut son résultat, pas une page d'accueil autour.
        */}
        {!recherche.active && (
          <>
            {dernieres.length > 0 && (
              <section className="pt-10">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 style={LIBELLE_SECTION}>
                    Dernières parutions
                  </h2>
                </div>
                <RailHorizontal ariaLabel="Dernières parutions">
                  {dernieres.map((ed) => (
                    <CarteEdition key={ed.id} edition={ed} />
                  ))}
                </RailHorizontal>
              </section>
            )}

            {invite && <EncartInscription onSInscrire={() => setModaleOuverte(true)} />}

            <section className="pt-12">
              <h2 style={LIBELLE_SECTION}>
                {invite ? "Pourquoi créer un compte" : "Ce que le compte apporte"}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ARGUMENTS_COMPTE.map(({ icone: Icone, titre, texte }) => (
                  <div
                    key={titre}
                    className="rounded-[12px] px-5 py-5"
                    style={{
                      backgroundColor: "var(--reel-surface)",
                      border: "1px solid var(--reel-border)",
                    }}
                  >
                    <Icone size={26} color="var(--reel-accent-clair)" strokeWidth={2} />
                    <h3
                      className="mt-3"
                      style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}
                    >
                      {titre}
                    </h3>
                    <p
                      className="mt-1.5"
                      style={{ fontSize: "15px", color: "var(--reel-muted)", lineHeight: "23px" }}
                    >
                      {texte}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/*
          Raccourcis vers les pages de regroupement. Au-dessus des films et non
          à leur place : « Warner » nomme un éditeur *et* apparaît dans des
          titres, et rien ne dit laquelle des deux intentions est la bonne.

          La capsule est ici dans son emploi d'origine, une valeur discrète qui
          se clique. Elle porte donc l'état de survol que les badges d'édition
          n'ont pas (cf. la règle du §8).
        */}
        {recherche.suggestions.length > 0 && (
          <section className="pt-12">
            <h2 style={LIBELLE_SECTION}>Parcourir</h2>
            <PucesRegroupement suggestions={recherche.suggestions} />
          </section>
        )}

        <section className="pt-12">
          <h2 style={LIBELLE_SECTION}>{recherche.active ? "Résultats" : "Parcourir le catalogue"}</h2>
          <GrilleFilms
            films={recherche.films}
            chargement={recherche.chargement}
            erreur={recherche.erreur}
            approchante={recherche.approchante}
            query={recherche.query}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * Fond d'accroche : une bande d'affiches, fondue au noir.
 *
 * Même traitement que le héros de la fiche film, opacité basse, flou léger,
 * dégradés, pour la même raison : l'image donne l'atmosphère, le texte reste
 * lisible. Sans les dégradés, le titre passait sur des affiches claires.
 *
 * `aria-hidden` : ces affiches sont déjà listées plus bas, les répéter au
 * lecteur d'écran n'apprendrait rien.
 */
function MosaiqueAffiches({ editions }: { editions: EditionWithFilm[] }) {
  const affiches = editions
    .map((e) => e.film?.affiche_url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 12);

  if (affiches.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="flex h-full w-full gap-2">
        {affiches.map((url, i) => (
          <div key={i} className="h-full flex-1 overflow-hidden">
            {/* Aucun filtre, ni ici ni sur un voile au-dessus.

                Deux tentatives ont laissé la page dédoublée et décalée d'une
                centaine de pixels : un `backdrop-filter` sur le voile d'abord,
                puis un `filter: blur()` sur ces images. Les deux forcent une
                couche de composition sur toute la largeur du héros, et le
                navigateur y laisse des tuiles périmées quand la mise en page
                se décale, apparition d'une barre de défilement, changement de
                largeur de fenêtre.

                L'atmosphère est donc obtenue sans filtre : opacité basse et
                deux dégradés, comme sur le héros de la fiche film. */}
            <img src={url} alt="" className="h-full w-full object-cover" style={{ opacity: 0.5 }} />
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(16,23,32,0.97) 0%, rgba(16,23,32,0.92) 45%, rgba(16,23,32,0.7) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(16,23,32,0.85) 0%, rgba(16,23,32,0.55) 40%, var(--reel-bg) 100%)",
        }}
      />
    </div>
  );
}

/**
 * L'invitation à créer un compte.
 *
 * Placée après les dernières éditions, pas avant : on demande un compte à
 * quelqu'un qui a déjà vu ce que le site contient. En tête de page, elle
 * réclame un engagement avant d'avoir rien montré.
 */
function EncartInscription({ onSInscrire }: { onSInscrire: () => void }) {
  return (
    <section
      className="mt-12 overflow-hidden rounded-[16px] px-6 py-7 sm:px-8 sm:py-9"
      style={{
        border: "1px solid var(--reel-border)",
        background:
          "linear-gradient(120deg, var(--reel-accent) 0%, #17408c 45%, var(--reel-surface) 100%)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[620px]">
          <h2
            style={{
              fontFamily: "var(--reel-font-titre)",
              fontSize: "clamp(21px, 2vw, 26px)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
            }}
          >
            Gardez la trace de ce que vous possédez
          </h2>
          <p className="mt-3" style={{ fontSize: "16px", color: "rgba(255,255,255,0.85)", lineHeight: "25px" }}>
            Cochez vos éditions, notez celles que vous cherchez, et retrouvez la liste en rayon.
            Compte gratuit avec Google, rien d’autre à remplir.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3">
          <button
            type="button"
            onClick={onSInscrire}
            className="rounded-full px-6 py-3 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white"
            style={{ backgroundColor: "#fff", color: "var(--reel-accent)", fontSize: "16px", fontWeight: 600 }}
          >
            Créer mon compte
          </button>
        </div>
      </div>
    </section>
  );
}
