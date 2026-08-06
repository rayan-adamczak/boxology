import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  Bookmark,
  Check,
  Disc3,
  Layers,
  ScanBarcode,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { connexionGoogle, useSession } from "../lib/auth";
import {
  getEditionsByIds,
  splitList,
  type EditionWithFilm,
  type Film,
} from "../lib/reelio-db";
import { getStatsCatalogue, type StatsCatalogue } from "../lib/stats";
import {
  getAffichesHero,
  getFilmsByIds,
  getVitrineHebdo,
  type LigneVitrine,
} from "../lib/vitrine";
import { useSeo } from "../lib/seo";

/**
 * Page de bienvenue, ce que le site fait, avant d'avoir un compte.
 *
 * Le catalogue reste la page d'accueil : c'est lui qui s'indexe et c'est par une
 * fiche film qu'on entre réellement sur le site. Cette page est l'autre porte,
 * celle qu'on donne en lien quand on présente jaquette.app à quelqu'un, elle
 * explique le fonctionnement au lieu de le faire deviner.
 *
 * Structure calquée sur la page d'accueil de Letterboxd : un héros, une suite
 * d'étapes numérotées avec ancre propre, un tour des grandes sections, puis
 * l'invitation à créer un compte. L'ordre a une raison, on ne demande le
 * compte qu'après avoir montré ce qu'il sert à faire.
 *
 * **Les visuels d'étape sont de vraies vignettes, pas des captures.** Une
 * capture d'écran vieillit à la première retouche d'interface ; ces blocs sont
 * bâtis avec les mêmes jetons que le reste et alimentés par les dernières
 * éditions en base, donc ils suivent.
 */

const nb = (n: number) => n.toLocaleString("fr-FR");

/*
 * Les exemples des vignettes, désignés par identifiant.
 *
 * Seule la sélection est figée ici : titres, visuels et formats viennent de la
 * base, donc une jaquette rapatriée ou un titre corrigé suit tout seul. Des
 * identifiants plutôt que des titres, parce qu'un titre en base est un
 * instantané d'import et bouge (cf. la campagne de réalignement TMDB), là où
 * l'identité d'une ligne ne bouge pas.
 *
 * Les exemples se répondent d'une étape à l'autre : Blade Runner 2049 pour la
 * collection puis pour la comparaison, la saga Mad Max pour le coffret. Trois
 * films sans rapport auraient fait passer les vignettes pour des vitrines.
 */
const EX_COLLECTION = { edition: 20008, film: 263 }; // Blade Runner 2049, steelbook édition limitée
/** Trois éditions du même film : c'est le propos de l'étape, pas trois films. */
const EX_COMPARER = [9470, 6685, 9439, 9438];
/** Le coffret Petrol Tank et les films qu'il contient. */
const EX_COFFRET = 24420;
const EX_COFFRET_FILMS = [12955, 13719, 1001, 507]; // Mad Max, Mad Max 2, Fury Road, Furiosa

const TOUTES_EDITIONS = [EX_COLLECTION.edition, ...EX_COMPARER, EX_COFFRET];
const TOUS_FILMS = [EX_COLLECTION.film, ...EX_COFFRET_FILMS];

/**
 * Retire le titre du film en tête d'un nom d'édition.
 *
 * Les trois éditions comparées appartiennent au même film, donc le répéter sous
 * chaque jaquette n'apprend rien et pousse le nom utile hors du cadre :
 * « Blade Runner 2049 – Édition limitée » se lit « Édition limitée ».
 */
function nomEdition(titreEdition: string | null, titreFilm: string | undefined): string {
  const nom = (titreEdition ?? "").trim();
  if (!titreFilm) return nom;
  const sansFilm = nom
    .replace(new RegExp(`^${titreFilm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"), "")
    .replace(/^\s*[-–—:·]\s*/, "")
    .trim();
  return sansFilm || nom;
}

/**
 * Affiches en fond de héros.
 *
 * Même traitement que le héros de la fiche film et que celui du catalogue :
 * opacité basse, flou léger, deux dégradés. L'image donne l'atmosphère, le
 * texte reste lisible, sans le dégradé horizontal, le titre passait sur des
 * affiches claires.
 */
function MosaiqueHero({ affiches }: { affiches: string[] }) {
  if (affiches.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="flex h-full w-full gap-2">
        {affiches.map((url, i) => (
          <div key={i} className="h-full flex-1 overflow-hidden">
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(2px)",
          background:
            "linear-gradient(to right, rgba(16,23,32,0.97) 0%, rgba(16,23,32,0.9) 50%, rgba(16,23,32,0.68) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(16,23,32,0.8) 0%, rgba(16,23,32,0.5) 40%, var(--reel-bg) 100%)",
        }}
      />
    </div>
  );
}

/** Bouton plein, l'action principale de la page, répétée en bas. */
function BoutonPrincipal({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{ backgroundColor: "var(--reel-accent)", color: "#fff", fontSize: "17px", fontWeight: 600 }}
    >
      {children}
    </button>
  );
}

function BoutonSecondaire({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 outline-none transition hover:bg-[var(--reel-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{
        border: "1px solid var(--reel-border)",
        backgroundColor: "var(--reel-surface)",
        color: "var(--reel-text)",
        fontSize: "16px",
        fontWeight: 600,
      }}
    >
      {children}
    </Link>
  );
}

/**
 * Une étape du mode d'emploi : le texte d'un côté, la vignette de l'autre.
 *
 * Chaque étape porte une ancre, comme `#mark-watched` chez Letterboxd : on doit
 * pouvoir envoyer quelqu'un directement sur « comment marquer une édition »
 * sans lui faire lire le reste.
 */
function Etape({
  id,
  numero,
  titre,
  visuel,
  inverse,
  children,
}: {
  id: string;
  numero: number;
  titre: string;
  visuel: ReactNode;
  /** Inverse l'ordre des colonnes, pour que la page ne se lise pas en escalier. */
  inverse?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      /* `grid-cols-1` explicite : sans lui, la colonne implicite se dimensionne
         sur son contenu, et les vignettes prenaient chacune une largeur
         différente sur téléphone.

         C'est la colonne de texte qui porte une largeur fixe, et la vignette
         qui prend le reste : les six paragraphes se lisent alors sur la même
         mesure d'une étape à l'autre. La vignette est ensuite collée au texte
         plutôt qu'au bord de l'écran, ce qui rend l'écart constant lui aussi ;
         c'est le bord extérieur qui devient irrégulier, et il n'a rien à
         aligner. */
      className={`grid scroll-mt-28 grid-cols-1 items-center gap-8 lg:gap-12 ${
        inverse
          ? "lg:grid-cols-[minmax(0,1fr)_auto]"
          : "lg:grid-cols-[auto_minmax(0,1fr)]"
      }`}
    >
      <div className={`lg:w-[400px] xl:w-[440px] ${inverse ? "lg:order-2" : ""}`}>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            backgroundColor: "var(--reel-accent-soft)",
            color: "var(--reel-accent-clair)",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {numero}
        </span>
        <h3
          className="pt-3"
          style={{
            fontFamily: "var(--reel-font-titre)",
            fontSize: "clamp(24px, 2.5vw, 32px)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--reel-text)",
          }}
        >
          {titre}
        </h3>
        <div
          className="flex flex-col gap-3 pt-3"
          style={{ fontSize: "17px", lineHeight: "29px", color: "var(--reel-muted)" }}
        >
          {children}
        </div>
      </div>

      {/*
        La vignette est collée au texte, pas au bord de l'écran : c'est l'écart
        au texte qui doit être constant d'une étape à l'autre, et il se voit,
        alors que le bord extérieur, lui, n'a rien à aligner.

        Le corollaire est assumé : les cadres n'ayant pas la même largeur, ils ne
        finissent pas sur la même verticale. L'inverse, tout aligner au bord, a
        été essayé et donnait des écarts de 48 à 192 px pour la même colonne de
        texte, qu'aucune raison ne justifiait à l'œil.

        Le débordement de 80 px ne sert plus qu'aux cadres larges, qui passent
        alors la gouttière du conteneur. À partir de `xl` seulement : en dessous,
        cette gouttière est plus étroite que le débordement.
      */}
      <div
        className={
          inverse ? "flex justify-end lg:order-1 xl:-ml-20" : "flex justify-start xl:-mr-20"
        }
      >
        {visuel}
      </div>
    </section>
  );
}

/**
 * Cadre commun des vignettes : une surface, un filet, du rembourrage.
 *
 * **Ni hauteur ni largeur imposées.** Une hauteur commune de 360 px a été
 * essayée : elle donnait un rythme régulier, mais au prix de jaquettes réduites
 * pour tenir dedans et de cadres à moitié vides quand le contenu était court.
 * Chaque vignette prend donc la place que son contenu demande, et les visuels
 * sont dimensionnés pour se voir, pas pour rentrer.
 *
 * Reste de l'épisode : le cadre est en `overflow-hidden`, donc un contenu trop
 * grand se coupe sans rien signaler. Comparer `scrollHeight` et `clientHeight`
 * après une retouche vaut toujours.
 */
function Cadre({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex w-full max-w-full flex-col justify-center overflow-hidden rounded-[16px] p-5 sm:p-7 ${className ?? ""}`}
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      {children}
    </div>
  );
}

/** Visuel d'une édition ou, à défaut, affiche d'un film. */
function Jaquette({ src, className }: { src?: string | null; className?: string }) {
  return (
    <span
      className={`block w-full overflow-hidden rounded-[8px] ${className ?? ""}`}
      style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
    >
      {src && <ImageWithFallback src={src} alt="" className="h-full w-full object-cover" />}
    </span>
  );
}

/** Étape 1, les deux boutons d'une fiche, dans leur état posé. */
function VisuelPosseder({ edition, film }: { edition?: EditionWithFilm; film?: Film }) {
  return (
    <Cadre className="lg:w-[520px] xl:w-[600px]">
      <div className="flex items-center gap-6">
        <div className="w-[140px] shrink-0 sm:w-[228px]">
          <Jaquette src={edition?.image_url ?? film?.affiche_url} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <span style={{ fontSize: "18px", fontWeight: 600, color: "var(--reel-text)" }}>
            {film?.titre ?? "Blade Runner 2049"}
            <span className="block pt-1" style={{ fontSize: "13px", fontWeight: 400, color: "var(--reel-muted)" }}>
              {nomEdition(edition?.titre ?? null, film?.titre) || "Steelbook 4K"}
            </span>
          </span>
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2"
            style={{ backgroundColor: "var(--reel-accent)", color: "#fff", fontSize: "14px", fontWeight: 600 }}
          >
            <Check size={15} /> Dans ma collection
          </span>
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2"
            style={{
              border: "1px solid var(--reel-border)",
              color: "var(--reel-muted)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <Bookmark size={15} /> Ajouter aux envies
          </span>
        </div>
      </div>
    </Cadre>
  );
}

/**
 * Étape 2, une liste d'envies, telle qu'elle se lit en rayon.
 *
 * Les titres sont ceux de la vitrine hebdomadaire : des films récents que le
 * visiteur reconnaît, et qui changent chaque semaine (cf. `lib/vitrine.ts`).
 * Une liste d'envies figée sur trois exemples aurait vieilli en un mois.
 */
function VisuelEnvies({ lignes }: { lignes: LigneVitrine[] }) {
  return (
    <Cadre className="lg:w-[460px] xl:w-[540px]">
      <div className="flex items-center gap-2 pb-2" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        <Bookmark size={15} color="var(--reel-accent-clair)" />
        Mes envies · {lignes.length || 3} éditions
      </div>
      <ul className="flex flex-col">
        {lignes.map(({ film, edition }, i) => (
          <li
            key={film.id}
            className="flex items-center gap-4 py-4"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--reel-border)" }}
          >
            <span className="w-[60px] shrink-0">
              <Jaquette src={edition?.image_url ?? film.affiche_url} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate"
                style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}
              >
                {film.titre}
              </span>
              <span className="block truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                {splitList(edition?.formats_extraits).join(" · ") || "Édition"}
              </span>
            </span>
            <Bookmark size={16} color="var(--reel-accent-clair)" className="shrink-0" />
          </li>
        ))}
      </ul>
    </Cadre>
  );
}

/**
 * Étape 3, trois éditions du même film.
 *
 * Ce sont bien trois lignes du catalogue rattachées à Blade Runner 2049, et non
 * trois jaquettes prises au hasard : le propos de l'étape est la comparaison à
 * l'intérieur d'un titre, une vignette qui montrerait trois films différents le
 * contredirait à l'image.
 */
function VisuelComparer({ editions, film }: { editions: EditionWithFilm[]; film?: Film }) {
  return (
    <Cadre className="lg:w-[540px] xl:w-[640px]">
      <div className="flex items-center gap-2 pb-5" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        <Layers size={14} color="var(--reel-accent-clair)" />
        {film?.titre ?? "Blade Runner 2049"} · 4 éditions
      </div>
      {/* Quatre colonnes, alignées à gauche du cadre : centrée, la rangée
          flottait au milieu d'une surface vide. Quatre jaquettes plutôt que
          trois occupent aussi la largeur gagnée sans grandir en hauteur.

          Pas de ligne de formats sous les jaquettes : elle répétait souvent ce
          que le nom de l'édition dit déjà (« steelbook 4K »), et trois niveaux
          de texte sous une vignette de 124 px, c'est un de trop. */}
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {editions.map((ed) => (
          <div key={ed.id}>
            <Jaquette src={ed.image_url ?? film?.affiche_url} />
            <span
              className="mt-2 line-clamp-2 block"
              style={{ fontSize: "12px", lineHeight: "16px", fontWeight: 600, color: "var(--reel-text)" }}
            >
              {nomEdition(ed.titre, film?.titre)}
            </span>
          </div>
        ))}
      </div>
    </Cadre>
  );
}

/** Étape 4, la fiche technique du disque. */
function VisuelSpecs() {
  const lignes: [string, string][] = [
    ["Définition", "4K UHD · 1080p"],
    ["HDR", "Dolby Vision · HDR10"],
    ["Format d’image", "2.39:1"],
    ["Pistes audio", "DTS-HD MA 5.1 (VF) · Dolby Atmos (VO)"],
    ["Sous-titres", "Français · Anglais"],
    ["Éditeur", "Warner Bros."],
  ];
  return (
    <Cadre className="lg:w-[440px] xl:w-[500px]">
      <div className="flex items-center gap-2 pb-2" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        <Disc3 size={14} color="var(--reel-accent-clair)" />
        Image et son
      </div>
      <dl className="flex flex-col">
        {lignes.map(([cle, valeur]) => (
          <div
            key={cle}
            className="flex items-baseline justify-between gap-4 py-3"
            style={{ borderTop: "1px solid var(--reel-border)" }}
          >
            <dt className="shrink-0" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
              {cle}
            </dt>
            <dd
              className="text-right"
              style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}
            >
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
    </Cadre>
  );
}

/** Étape 5, un coffret et les films qu'il contient. */
function VisuelCoffret({ coffret, films }: { coffret?: EditionWithFilm; films: Film[] }) {
  return (
    <Cadre className="lg:w-[560px] xl:w-[660px]">
      {/* Le nom du coffret est en tête, sur une ligne tronquée, et non sous sa
          jaquette : « Mad Max Saga - Coffret Ultra Collector Petrol Tank » tenait
          sur quatre lignes dans une colonne de 92 px, et ces quatre lignes
          pesaient plus que le visuel qu'elles légendent. */}
      <span
        className="block truncate pb-4"
        style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}
      >
        {coffret?.titre ?? "Coffret Mad Max"}
      </span>
      {/* Le coffret domine, les films qu'il contient sont des vignettes : c'est
          le sens de l'étape, un boîtier qui se range dans plusieurs fiches. À
          taille égale, l'œil lisait cinq objets de même rang. */}
      <div className="flex items-center gap-6">
        <div className="w-[200px] shrink-0">
          <Jaquette src={coffret?.image_url} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block pb-3" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            se retrouve sur la fiche de chacun de ses films
          </span>
          <div className="grid grid-cols-4 gap-2">
            {films.map((f) => (
              <div key={f.id}>
                <Jaquette src={f.affiche_url} />
                <span
                  className="mt-1.5 line-clamp-2 block"
                  style={{ fontSize: "11px", lineHeight: "15px", color: "var(--reel-muted)" }}
                >
                  {f.titre}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Cadre>
  );
}

/** Étape 6, le compte, et ce qu'il garde. */
function VisuelCompte() {
  const points: [ReactNode, string][] = [
    [<User key="c" size={19} />, "Connexion avec Google, rien d’autre à remplir"],
    [<Layers key="l" size={19} />, "Vos listes suivent d’un appareil à l’autre"],
    [<ShieldCheck key="s" size={19} />, "Données hébergées dans l’Union européenne"],
    [<Check key="e" size={19} />, "Suppression du compte et des listes en deux clics"],
  ];
  return (
    <Cadre className="lg:w-[440px] xl:w-[520px]">
      <ul className="flex flex-col gap-7">
        {points.map(([icone, texte], i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent-clair)" }}
            >
              {icone}
            </span>
            <span style={{ fontSize: "16px", lineHeight: "23px", color: "var(--reel-text)" }}>{texte}</span>
          </li>
        ))}
      </ul>
    </Cadre>
  );
}

/** Une des grandes sections du site, présentée en carte cliquable. */
function CarteSection({
  to,
  icone,
  titre,
  children,
}: {
  to: string;
  icone: ReactNode;
  titre: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 rounded-[16px] p-6 outline-none transition hover:border-[var(--reel-accent-clair)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent-clair)" }}
      >
        {icone}
      </span>
      <span
        className="pt-1 transition-colors group-hover:text-[var(--reel-accent-clair)]"
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "19px",
          fontWeight: 700,
          color: "var(--reel-text)",
        }}
      >
        {titre}
      </span>
      <span style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>{children}</span>
    </Link>
  );
}

/** Titre de partie, avec son chapeau. */
function TitrePartie({ titre, chapeau }: { titre: string; chapeau?: string }) {
  return (
    <div className="max-w-[640px]">
      <h2
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "clamp(28px, 3.2vw, 40px)",
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: "var(--reel-text)",
        }}
      >
        {titre}
      </h2>
      {chapeau && (
        <p className="pt-4" style={{ fontSize: "18px", lineHeight: "29px", color: "var(--reel-muted)" }}>
          {chapeau}
        </p>
      )}
    </div>
  );
}

export function BienvenuePage() {
  const session = useSession();
  const location = useLocation();
  const [affiches, setAffiches] = useState<string[]>([]);
  const [exemples, setExemples] = useState<Map<number, EditionWithFilm>>(new Map());
  const [films, setFilms] = useState<Map<number, Film>>(new Map());
  const [vitrine, setVitrine] = useState<LigneVitrine[]>([]);
  const [stats, setStats] = useState<StatsCatalogue | null>(null);

  useSeo({
    titre: "Bienvenue",
    description:
      "jaquette.app recense les éditions physiques de films sorties en France : Blu-ray, 4K, DVD, steelbooks et coffrets. Marquez ce que vous possédez, gardez la liste de ce qu’il vous manque.",
  });

  useEffect(() => {
    // Les vignettes se contentent de ce qui existe : si un appel échoue, elles
    // restent des cadres vides et la page se lit quand même. Rien ici ne doit
    // retenir le texte.
    getAffichesHero(14).then(setAffiches).catch(() => {});
    getStatsCatalogue().then(setStats).catch(() => {});
    getEditionsByIds(TOUTES_EDITIONS)
      .then((liste) => setExemples(new Map(liste.map((e) => [e.id, e]))))
      .catch(() => {});
    getFilmsByIds(TOUS_FILMS)
      .then((liste) => setFilms(new Map(liste.map((f) => [f.id, f]))))
      .catch(() => {});
    getVitrineHebdo(3).then(setVitrine).catch(() => {});
  }, []);

  /*
   * Défilement vers l'ancre d'un lien entrant (`/bienvenue#fiche-technique`).
   *
   * Le navigateur ne le fait pas : la cible n'existe pas encore au moment où il
   * lit le fragment, la page est rendue par React. Et le gestionnaire de
   * défilement de l'application remet en haut à chaque navigation, donc on
   * attend une frame avant d'agir. On réessaie jusqu'à une seconde, le temps
   * que les affiches du héros donnent sa hauteur à la page.
   */
  useEffect(() => {
    const ancre = location.hash.slice(1);
    if (!ancre) return;

    let annule = false;
    const debut = performance.now();
    const essayer = () => {
      if (annule) return;
      const cible = document.getElementById(ancre);
      if (cible) {
        cible.scrollIntoView({ block: "start" });
        return;
      }
      if (performance.now() - debut > 1000) return;
      requestAnimationFrame(essayer);
    };
    requestAnimationFrame(essayer);

    return () => {
      annule = true;
    };
  }, [location.hash]);

  const connecte = session != null;

  const sInscrire = () => {
    // Retour sur le catalogue et non sur cette page : une fois le compte créé,
    // il n'y a plus rien à y lire.
    void connexionGoogle("/").catch(() => {});
  };

  return (
    <div className="pb-8">
      {/* Héros */}
      <header className="relative overflow-hidden">
        <MosaiqueHero affiches={affiches} />

        {/* Centré comme le héros de l'accueil : les deux pages ouvrent le site
            et ne peuvent pas annoncer deux compositions. */}
        <div className="relative mx-auto flex max-w-[1100px] flex-col items-center px-6 pb-20 pt-20 text-center sm:pb-32 sm:pt-32">
          <h1
            className="max-w-[760px]"
            style={{
              fontFamily: "var(--reel-font-titre)",
              fontSize: "clamp(38px, 6vw, 68px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--reel-text)",
            }}
          >
            Savoir quelle édition vous avez déjà.
          </h1>

          <p
            className="max-w-[660px] pt-6"
            style={{ fontSize: "19px", lineHeight: "31px", color: "var(--reel-muted)" }}
          >
            jaquette.app recense les éditions physiques de films et de séries publiées en France.
            Marquez ce que vous possédez, gardez la liste de ce qu’il vous manque, et comparez les
            éditions d’un même titre avant d’en acheter une de plus.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-10">
            {connecte ? (
              <>
                <BoutonSecondaire to="/">
                  Parcourir le catalogue <ArrowRight size={16} />
                </BoutonSecondaire>
                <BoutonSecondaire to="/profile">Voir ma collection</BoutonSecondaire>
              </>
            ) : (
              <>
                <BoutonPrincipal onClick={sInscrire}>
                  Créer mon compte <ArrowRight size={16} />
                </BoutonPrincipal>
                <BoutonSecondaire to="/">Parcourir sans compte</BoutonSecondaire>
              </>
            )}
          </div>

          {/* Le catalogue se compte à l'affichage : les chiffres restent justes
              après chaque import, sans repasser sur cette page. */}
          <dl className="flex flex-wrap gap-x-14 gap-y-6 pt-14">
            {[
              [stats ? nb(stats.films) : "—", "œuvres référencées"],
              [stats ? nb(stats.editions) : "—", "éditions physiques"],
              // « 0 traceur » n'est plus exact depuis les liens affiliés
              // d'août 2026 : rien n'est déposé au chargement d'une page, mais
              // un clic sur un prix passe par Awin. Le chiffre porte donc sur
              // ce qui est mesurable sans le visiteur, la publicité et la
              // mesure d'audience, et non sur une absence totale de suivi.
              ["0", "publicité, 0 mesure d’audience"],
            ].map(([valeur, libelle]) => (
              <div key={libelle}>
                <dt
                  style={{
                    fontFamily: "var(--reel-font-titre)",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "var(--reel-text)",
                  }}
                >
                  {valeur}
                </dt>
                <dd style={{ fontSize: "14px", color: "var(--reel-muted)" }}>{libelle}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Mode d'emploi */}
      <div className="mx-auto max-w-[1100px] px-6">
        <TitrePartie
          titre="Comment jaquette.app fonctionne"
          chapeau="Six gestes, dont les deux premiers suffisent à démarrer."
        />

        <div className="flex flex-col gap-20 pt-16 sm:gap-28">
          <Etape
            id="posseder"
            numero={1}
            titre="Dites-nous ce que vous possédez"
            visuel={
              <VisuelPosseder
                edition={exemples.get(EX_COLLECTION.edition)}
                film={films.get(EX_COLLECTION.film)}
              />
            }
          >
            <p>
              Sur la fiche d’un film, chaque édition publiée en France est listée. Marquez celles
              qui sont sur votre étagère : elles rejoignent votre collection.
            </p>
            <p>
              C’est le geste qui rend le reste utile. Une collection remplie répond seule à la
              question qu’on se pose en magasin.
            </p>
          </Etape>

          <Etape
            id="envies"
            numero={2}
            titre="Gardez la liste de ce qu’il vous manque"
            visuel={<VisuelEnvies lignes={vitrine} />}
            inverse
          >
            <p>
              Une édition repérée mais pas achetée va dans vos envies. La liste se consulte depuis
              le téléphone, en rayon, au moment où la question se pose.
            </p>
            <p>
              Marquer une envie comme possédée la fait passer d’une liste à l’autre.
            </p>
          </Etape>

          <Etape
            id="comparer"
            numero={3}
            titre="Comparez les éditions d’un même film"
            visuel={
              <VisuelComparer
                editions={EX_COMPARER.map((id) => exemples.get(id)).filter(
                  (e): e is EditionWithFilm => Boolean(e))}
                film={films.get(EX_COLLECTION.film)}
              />
            }
          >
            <p>
              Un même titre existe en dizaines de versions : première édition, réédition
              anniversaire, steelbook d’un revendeur, coffret. La fiche film les rassemble toutes,
              avec leurs formats, leur date et leur zone.
            </p>
            <p>
              Les filtres de format ne gardent que ce qui vous intéresse : 4K, Blu-ray, DVD.
            </p>
          </Etape>

          <Etape
            id="fiche-technique"
            numero={4}
            titre="Lisez la fiche du disque, pas seulement celle du film"
            visuel={<VisuelSpecs />}
            inverse
          >
            <p>
              Définition, HDR, format d’image, pistes audio, sous-titres, éditeur : l’onglet
              Détails sépare ce qui relève de l’œuvre de ce qui relève du support. Une 4K en Dolby
              Vision et un Blu-ray 1080p du même film n’offrent pas la même chose.
            </p>
            <p>
              Ces informations viennent des fiches d’édition, quand la source les publie : elles ne
              sont donc pas toutes remplies.
            </p>
          </Etape>

          <Etape
            id="coffrets"
            numero={5}
            titre="Les coffrets comptent pour chacun de leurs films"
            visuel={
              <VisuelCoffret
                coffret={exemples.get(EX_COFFRET)}
                films={EX_COFFRET_FILMS.map((id) => films.get(id)).filter(
                  (f): f is Film => Boolean(f))}
              />
            }
          >
            <p>
              Un coffret n’appartient pas à un seul titre. Il apparaît sur la fiche de chaque film
              qu’il contient, et le cocher une fois suffit à le voir partout.
            </p>
            <p>
              Le rattachement des coffrets est le chantier le plus long du catalogue : si l’un
              d’eux est incomplet ou mal rattaché, écrivez-nous.
            </p>
          </Etape>

          <Etape
            id="compte"
            numero={6}
            titre="Votre compte, vos listes, effaçables"
            visuel={<VisuelCompte />}
            inverse
          >
            <p>
              La consultation ne demande rien. Le compte n’existe que pour que vos listes survivent
              à un vidage de cache et vous suivent d’un appareil à l’autre.
            </p>
            <p>
              Aucun mot de passe à choisir, aucune publicité, aucune mesure d’audience. La page{" "}
              <Link to="/account" style={{ color: "var(--reel-accent-clair)" }}>
                Mon compte
              </Link>{" "}
              permet de tout supprimer, listes comprises.
            </p>
          </Etape>
        </div>
      </div>

      {/* Les grandes sections */}
      <div className="mx-auto max-w-[1100px] px-6 pt-28 sm:pt-36">
        <TitrePartie
          titre="Ce que vous trouverez dans chaque section"
          chapeau="Trois pages, et le reste en découle."
        />

        <div className="grid gap-5 pt-10 sm:grid-cols-3">
          <CarteSection to="/" icone={<Search size={22} />} titre="Catalogue">
            La recherche par titre, les dernières éditions parues et l’entrée vers toutes les
            fiches. C’est la page d’accueil du site.
          </CarteSection>
          <CarteSection to="/" icone={<Disc3 size={22} />} titre="Fiche film">
            Le film, sa distribution, ses éditions françaises et la fiche technique des disques.
            Ouvrez n’importe quelle jaquette du catalogue pour y arriver.
          </CarteSection>
          <CarteSection to="/profile" icone={<User size={22} />} titre="Profil">
            Votre collection et vos envies, groupées par film. Privées, et hors des moteurs de
            recherche.
          </CarteSection>
        </div>
      </div>

      {/* Bon à savoir */}
      <div className="mx-auto max-w-[1100px] px-6 pt-28 sm:pt-36">
        <TitrePartie titre="Bon à savoir" />

        <div className="grid gap-x-14 gap-y-9 pt-10 sm:grid-cols-2">
          {[
            [
              <ScanBarcode key="i" size={20} />,
              "Les codes-barres sont renseignés",
              "La plupart des éditions portent leur EAN, ce qui permet de lever un doute entre deux tirages presque identiques.",
            ],
            [
              <Layers key="i" size={20} />,
              "Films, séries et coffrets",
              "Le catalogue ne s’arrête pas au cinéma : les séries éditées en France y figurent aussi, saison par saison.",
            ],
            [
              <Sparkles key="i" size={20} />,
              "Les données viennent de TMDB et de sources spécialisées",
              "Affiches, synopsis et distribution proviennent de The Movie Database. Les éditions physiques sont compilées à partir de sources publiques de catalogage.",
            ],
            [
              <ShieldCheck key="i" size={20} />,
              "Rien ne se vend ici",
              "jaquette.app n’encaisse aucun paiement : les achats se font chez le marchand. Quand un prix porte un nom d’enseigne, c’est un lien affilié, dit comme tel, et il ne change ni le prix que vous payez ni l’ordre du catalogue.",
            ],
          ].map(([icone, titre, texte], i) => (
            <div key={i} className="flex gap-3">
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent-clair)" }}
              >
                {icone}
              </span>
              <div>
                <span style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}>
                  {titre}
                </span>
                <p className="pt-1.5" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
                  {texte}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitation finale, même bandeau que le catalogue, à la fin comme
          là-bas : on ne demande un compte qu'après avoir montré à quoi il sert. */}
      <div className="mx-auto max-w-[1100px] px-6 pt-28 sm:pt-36">
        <section
          className="overflow-hidden rounded-[18px] px-7 py-11 sm:px-12 sm:py-14"
          style={{
            border: "1px solid var(--reel-border)",
            background:
              "linear-gradient(120deg, var(--reel-accent) 0%, #17408c 45%, var(--reel-surface) 100%)",
          }}
        >
          <h2
            className="max-w-[640px]"
            style={{
              fontFamily: "var(--reel-font-titre)",
              fontSize: "clamp(27px, 3.4vw, 40px)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
            }}
          >
            {connecte
              ? "Votre collection vous attend"
              : "N’achetez pas deux fois la même édition"}
          </h2>
          <p
            className="max-w-[640px] pt-4"
            style={{ fontSize: "18px", lineHeight: "29px", color: "rgba(255,255,255,0.85)" }}
          >
            {connecte
              ? "Ouvrez une fiche film et marquez les éditions que vous avez déjà."
              : "Marquez ce qui est déjà sur votre étagère, notez ce que vous cherchez, et gardez la liste sur vous."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-9">
            {connecte ? (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white"
                style={{ backgroundColor: "#fff", color: "var(--reel-accent)", fontSize: "17px", fontWeight: 600 }}
              >
                Aller au catalogue <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={sInscrire}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white"
                  style={{ backgroundColor: "#fff", color: "var(--reel-accent)", fontSize: "17px", fontWeight: 600 }}
                >
                  Créer mon compte <ArrowRight size={16} />
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  style={{
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Parcourir sans compte
                </Link>
              </>
            )}
          </div>
        </section>

        <p className="pt-8" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
          Une édition manquante, un coffret mal rattaché, une erreur de fiche ?{" "}
          <a href="mailto:contact@jaquette.app" style={{ color: "var(--reel-accent-clair)" }}>
            contact@jaquette.app
          </a>
          . Pour le détail du projet et des sources, voir{" "}
          <Link to="/about" style={{ color: "var(--reel-accent-clair)" }}>
            À propos
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
