import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Loader2, Star, Bookmark, Library, ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PersonModal } from "../components/PersonModal";
import { UserAvatar } from "../components/UserAvatar";
import { toast } from "sonner";
import {
  getFilm,
  getEditionsForFilm,
  splitList,
  agregerSpecs,
  type Film,
  type Edition,
  type StatutValue,
} from "../lib/reelio-db";
import { basculerStatut, chargerStatuts, CompteRequis } from "../lib/collections";
import { ModaleConnexion } from "../components/ModaleConnexion";
import { useSession } from "../lib/auth";
import { useSeo, extrait, type Seo } from "../lib/seo";

/* ---- helpers ---- */

/**
 * Langues des titres étrangers. Ce sont les six que `enrichir_tmdb.py` retient
 * — TMDB en propose une centaine, dont beaucoup ne sont qu'une translittération
 * du titre original et n'apprennent rien à un lecteur francophone.
 */
const LANGUES_TITRES: Record<string, string> = {
  en: "Anglais",
  de: "Allemand",
  es: "Espagnol",
  it: "Italien",
  ja: "Japonais",
  pt: "Portugais",
};

/** « 2018-01-17 » → « 17 janvier 2018 ». Date nue, jamais reformatée en UTC. */
function formatDateSortie(raw: string | null): string {
  if (!raw) return "";
  // `new Date("2018-01-17")` est interprété en UTC et recule d'un jour dans les
  // fuseaux négatifs. On construit la date en local, à partir des trois nombres.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Budget TMDB, en dollars — leur champ n'est pas converti et ne porte pas de
 * devise, mais c'est du dollar. Arrondi au million au-dessus de dix millions :
 * « 15 000 000 $ » donne une précision que la donnée n'a pas.
 */
function formatBudget(raw: number | null): string {
  if (!raw || raw <= 0) return "";
  if (raw >= 10_000_000) return `${Math.round(raw / 1_000_000)} M$`;
  return `${raw.toLocaleString("fr-FR")} $`;
}

function formatDuration(raw: string | null): string {
  if (!raw) return "";
  const total = parseInt(String(raw), 10);
  if (isNaN(total)) return String(raw);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return `${h}h ${String(min).padStart(2, "0")}min`;
}

/** `photo` est une URL TMDB complète, posée par `enrichir_tmdb.py --cast-seul`.
 *  Absente sur les seconds rôles que TMDB n'illustre pas. */
interface CastMember { nom: string; role: string; photo?: string }

function parseCast(val: unknown): CastMember[] {
  if (!val) return [];
  try {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return (arr as CastMember[]).filter((m) => m && m.nom);
  } catch {
    return [];
  }
}

/* ---- sub-components ---- */

interface CircleStatusButtonsProps {
  editionId: number;
  status: StatutValue | undefined;
  /** La page tient la bascule : elle écrit en base, ou ouvre la modale de
   *  connexion s'il n'y a pas de compte. Ce composant n'a pas à le savoir. */
  onToggle: (editionId: number, value: StatutValue) => void;
}

function CircleStatusButtons({ editionId, status, onToggle }: CircleStatusButtonsProps) {
  const handle = (value: StatutValue) => onToggle(editionId, value);

  const collectionActive = status === "possede";
  const wishlistActive = status === "envie";

  return (
    <div className="flex gap-[6px] shrink-0 items-center">
      <button
        type="button"
        onClick={() => handle("possede")}
        aria-pressed={collectionActive}
        title={collectionActive ? "Retirer de la collection" : "Ajouter à la collection"}
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
        style={{
          backgroundColor: collectionActive ? "var(--reel-accent)" : "var(--reel-surface-2)",
          border: "none",
        }}
      >
        {collectionActive
          ? <Library size={15} color="#fff" strokeWidth={2.2} />
          : <Plus size={15} color="var(--reel-muted)" strokeWidth={2} />}
      </button>

      <button
        type="button"
        onClick={() => handle("envie")}
        aria-pressed={wishlistActive}
        title={wishlistActive ? "Retirer des envies" : "Ajouter aux envies"}
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
        style={{
          backgroundColor: wishlistActive ? "var(--reel-accent)" : "var(--reel-surface-2)",
          border: "none",
        }}
      >
        <Bookmark
          size={15}
          color={wishlistActive ? "#fff" : "var(--reel-muted)"}
          fill={wishlistActive ? "#fff" : "none"}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}>{children}</h2>
  );
}

type LigneFiche = { label: string; value: React.ReactNode } | false | null | undefined | "";

/**
 * Carte libellé/valeur, reprise de la maquette : un filet sous chaque ligne, le
 * libellé en gris à gauche sur une colonne fixe, la valeur plus grande à
 * droite. Les filets font le travail que les capsules faisaient mal — ils
 * séparent sans ajouter d'objet visuel.
 *
 * La carte disparaît entièrement quand aucune ligne n'est renseignée. Un bloc
 * technique vide n'apprendrait rien, et il serait vide sur les 3 193 éditions
 * editioncollector, qui ne publient pas de fiche technique.
 */
function BlocFiche({
  titre,
  lignes,
  note,
}: {
  titre: string;
  lignes: LigneFiche[];
  note?: string;
}) {
  const visibles = lignes.filter(Boolean) as { label: string; value: React.ReactNode }[];
  if (visibles.length === 0) return null;

  return (
    <section
      className="rounded-[12px] px-5 py-4"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <TitreSection>{titre}</TitreSection>
      <dl className="pt-2">
        {visibles.map(({ label, value }, i) => (
          <div
            key={label}
            className="flex gap-5 py-3"
            style={{
              // Pas de filet sous la dernière ligne : il doublerait le bord de
              // la carte.
              borderBottom: i < visibles.length - 1 ? "1px solid var(--reel-border)" : "none",
            }}
          >
            <dt
              className="shrink-0 w-[120px]"
              style={{ fontSize: "14px", color: "var(--reel-muted)", lineHeight: "24px" }}
            >
              {label}
            </dt>
            <dd style={{ fontSize: "16px", color: "var(--reel-text)", lineHeight: "24px" }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {note && (
        <p className="pt-1" style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "20px" }}>
          {note}
        </p>
      )}
    </section>
  );
}

/**
 * Une carte d'acteur : portrait, nom, rôle. En grille et non en liste — la
 * liste empilée tenait dans une colonne étroite, mais elle lisait comme un
 * annuaire, et les portraits se réduisaient à des pastilles d'initiales de
 * 36 px où l'on ne reconnaissait personne.
 *
 * Le portrait garde le rapport 2/3 de l'affiche, même sans image : sans
 * hauteur imposée, les cartes sans photo remontaient et cassaient l'alignement
 * des noms d'une colonne à l'autre.
 */
function CarteActeur({ membre, onClick }: { membre: CastMember; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] rounded-[10px]"
    >
      <span
        className="relative block w-full overflow-hidden rounded-[10px] ring-1 ring-transparent transition group-hover:ring-[var(--reel-accent-clair)]"
        style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface)" }}
      >
        {membre.photo ? (
          // Zoom léger plutôt qu'un voile : assombrir un portrait déjà sombre
          // ne se voyait pas, alors que le mouvement se remarque tout de suite.
          <ImageWithFallback
            src={membre.photo}
            alt={membre.nom}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <UserAvatar name={membre.nom} size={48} />
          </span>
        )}
      </span>
      {/* La couleur passe par une classe et non par `style` : une couleur en
          ligne l'emporte sur toute règle CSS, y compris sur le survol. */}
      <span
        className="block text-[var(--reel-text)] transition-colors group-hover:text-[var(--reel-accent-clair)]"
        style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19px" }}
      >
        {membre.nom}
      </span>
      {membre.role && (
        <span className="block" style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "18px" }}>
          {membre.role}
        </span>
      )}
    </button>
  );
}

/**
 * Rail horizontal : voiles aux deux bouts, flèches pour avancer.
 *
 * Le rail mord sur la gouttière de la page — marges négatives compensées par un
 * rembourrage égal, de sorte que les cartes s'alignent sur le reste au repos
 * mais courent jusqu'au bord de l'écran quand on fait défiler. **Les voiles
 * partent du même bord**, et c'est là tout l'intérêt : une carte coupée net par
 * le bord de l'écran se lit comme un défaut d'affichage, une carte qui s'efface
 * se lit comme une suite. Un voile qui s'arrêterait à la colonne laisserait une
 * bande de portrait à vif dans la gouttière.
 *
 * Les flèches sont dans la colonne, donc par-dessus les voiles. C'est voulu :
 * elles doivent tomber là où l'œil les cherche, pas là où le dégradé finit.
 *
 * Les voiles et les flèches ne paraissent que du côté où il reste quelque
 * chose. Une flèche qui ne fait rien est pire que pas de flèche.
 *
 * `pointer-events-none` sur les voiles : sans lui, ils intercepteraient le
 * glissement au doigt précisément à l'endroit où l'on attrape le rail.
 */
function RailHorizontal({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const rail = useRef<HTMLDivElement | null>(null);
  const [aGauche, setAGauche] = useState(false);
  const [aDroite, setADroite] = useState(false);

  const mesurer = () => {
    const el = rail.current;
    if (!el) return;
    // Un pixel de marge : les largeurs sont fractionnaires, et `scrollLeft`
    // n'atteint jamais exactement son maximum sur un écran à densité non
    // entière — la flèche de droite serait restée allumée en bout de course.
    setAGauche(el.scrollLeft > 1);
    setADroite(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    mesurer();
    const el = rail.current;
    if (!el) return;
    el.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);

    // Le contenu du rail change de taille après le montage : les portraits
    // arrivent du réseau, et tant qu'ils ne sont pas là `scrollWidth` peut
    // valoir `clientWidth`. Sans cet observateur, la flèche de droite ne
    // paraîtrait qu'au premier défilement — c'est-à-dire une fois qu'on a
    // trouvé tout seul qu'il y avait une suite.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    for (const enfant of Array.from(el.children)) observateur.observe(enfant);

    return () => {
      el.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
      observateur.disconnect();
    };
  }, [children]);

  const pousser = (sens: -1 | 1) => {
    const el = rail.current;
    if (!el) return;
    // 80 % de la largeur visible plutôt que 100 % : laisser une carte en commun
    // d'un écran à l'autre évite de perdre le fil.
    el.scrollBy({ left: sens * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // `top-[34%]` vise le milieu du portrait et non celui du rail : la carte
  // porte aussi le nom et le rôle sous l'image, et un centrage sur la hauteur
  // totale posait la flèche sur le texte. Taille 44 px, le minimum tactile
  // recommandé — en 36 px, un clic à un pixel près tombait sur la carte
  // dessous et ouvrait la filmographie de l'acteur au lieu de faire défiler.
  const fleche = "absolute top-[34%] z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]";
  const styleFleche = {
    backgroundColor: "var(--reel-surface-2)",
    border: "1px solid var(--reel-border)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-10">
      <div
        ref={rail}
        className="flex gap-4 overflow-x-auto px-4 pt-4 pb-2 sm:px-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 transition-opacity sm:w-20"
        style={{
          opacity: aGauche ? 1 : 0,
          background: "linear-gradient(to right, var(--reel-bg) 0%, var(--reel-bg) 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 transition-opacity sm:w-20"
        style={{
          opacity: aDroite ? 1 : 0,
          background: "linear-gradient(to left, var(--reel-bg) 0%, var(--reel-bg) 55%, transparent 100%)",
        }}
      />

      {aGauche && (
        <button
          type="button"
          onClick={() => pousser(-1)}
          aria-label={`${ariaLabel} — précédent`}
          className={`${fleche} left-6 sm:left-8 lg:left-12`}
          style={styleFleche}
        >
          <ChevronLeft size={20} color="var(--reel-text)" />
        </button>
      )}
      {aDroite && (
        <button
          type="button"
          onClick={() => pousser(1)}
          aria-label={`${ariaLabel} — suivant`}
          className={`${fleche} right-6 sm:right-8 lg:right-12`}
          style={styleFleche}
        >
          <ChevronRight size={20} color="var(--reel-text)" />
        </button>
      )}
    </div>
  );
}

const TABS = ["Editions", "Détails", "Critiques", "Listes"] as const;
type Tab = (typeof TABS)[number];

/* ---- main page ---- */

export function FilmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const filmId = Number(id);

  const [film, setFilm] = useState<Film | null>(null);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [statuts, setStatuts] = useState<Record<number, StatutValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Editions");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [synopsisOuvert, setSynopsisOuvert] = useState(false);
  /** Vrai quand le synopsis déborde de ses quatre lignes — mesuré, pas deviné
   *  sur une longueur de chaîne : quatre lignes de 375 px et quatre lignes de
   *  640 px n'accueillent pas le même nombre de signes. */
  const [synopsisDeborde, setSynopsisDeborde] = useState(false);
  const synopsisRef = useRef<HTMLParagraphElement | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const session = useSession();

  /*
    Le « voir plus » n'apparaît que si le texte est vraiment coupé. Un synopsis
    de deux lignes n'a pas de suite à montrer, et le bouton mentirait.

    Remesuré au redimensionnement : la troncature dépend de la largeur, et une
    rotation d'écran fait passer un texte de cinq lignes à trois.
  */
  useEffect(() => {
    const el = synopsisRef.current;
    if (!el) return;
    const mesurer = () => {
      if (synopsisOuvert) return;      // déplié, il ne déborde plus par construction
      setSynopsisDeborde(el.scrollHeight > el.clientHeight + 1);
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
  }, [film?.synopsis, synopsisOuvert]);

  useEffect(() => {
    // Tant que la session n'est pas résolue, on ne charge pas les statuts : on
    // les lirait vides pour les remplacer aussitôt par ceux du compte, et les
    // boutons changeraient d'état sous le curseur.
    if (session === undefined) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [f, eds] = await Promise.all([getFilm(filmId), getEditionsForFilm(filmId)]);
        if (cancelled) return;
        setFilm(f);
        setEditions(eds);
        // Vide sans compte (cf. lib/collections.ts).
        const st = await chargerStatuts(eds.map((e) => e.id));
        if (!cancelled) setStatuts(st);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // `session?.user.id` et non `session` : l'objet est recréé à chaque
    // rafraîchissement de jeton, ce qui rechargerait la page toutes les heures.
  }, [filmId, session === undefined, session?.user.id]);

  /*
   * Titre et description propres à la fiche. Tant que le film n'est pas chargé
   * on passe null : useSeo laisse alors le <head> intact plutôt que d'écrire un
   * canonical sur une page qui n'existe peut-être pas.
   */
  const seo = useMemo<Seo | null>(() => {
    if (!film) return null;

    const annee = film.annee ? ` (${film.annee})` : "";
    const nb = editions.length;
    // Le synopsis décrit le film ; à défaut on décrit ce que la page apporte
    // vraiment, c'est-à-dire le nombre d'éditions recensées.
    const description = film.synopsis
      ? extrait(film.synopsis)
      : nb > 0
      ? `${nb} édition${nb > 1 ? "s" : ""} de ${film.titre}${annee} recensée${nb > 1 ? "s" : ""} : formats, zones, dates de sortie et codes-barres.`
      : `Les éditions Blu-ray, 4K et coffrets de ${film.titre}${annee}.`;

    return {
      titre: `${film.titre}${annee} — éditions Blu-ray, 4K et coffrets`,
      description,
      image: film.affiche_url,
      type: "video.movie",
    };
  }, [film, editions.length]);

  useSeo(seo);

  const onStatusChange = (editionId: number, status: StatutValue | null) => {
    setStatuts((prev) => {
      const next = { ...prev };
      if (status === null) delete next[editionId];
      else next[editionId] = status;
      return next;
    });
  };

  /**
   * Unique point de bascule d'un statut. On attend la confirmation avant de
   * bouger l'interface : avec un compte, l'écriture passe par le réseau, et
   * afficher « Ajouté » sur un enregistrement qui a échoué serait un mensonge.
   */
  const basculer = async (editionId: number, value: StatutValue) => {
    try {
      const next = await basculerStatut(editionId, value);
      onStatusChange(editionId, next);
      toast.success(
        next === null
          ? value === "possede" ? "Retiré de votre collection" : "Retiré de vos envies"
          : value === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies"
      );
    } catch (e) {
      // Sans compte, on explique au lieu d'afficher une erreur : le visiteur
      // n'a rien fait de mal, il lui manque juste un compte.
      if (e instanceof CompteRequis) setModaleOuverte(true);
      else toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  /* Dropdown state for edition picker */
  const [openDropdown, setOpenDropdown] = useState<StatutValue | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  /* Toggle a specific edition for a given statut value */
  const handleEditionStatut = (editionId: number, value: StatutValue) => {
    void basculer(editionId, value);
    setOpenDropdown(null);
  };

  /* Main button click: if single edition, toggle directly; if multiple, open picker */
  const handleMainCta = (value: StatutValue) => {
    if (editions.length === 0) return;
    if (editions.length === 1) {
      handleEditionStatut(editions[0].id, value);
    } else {
      setOpenDropdown((prev) => (prev === value ? null : value));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-16 pt-[120px]" style={{ color: "var(--reel-muted)" }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: "14px" }}>Chargement…</span>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="px-16 pt-[120px]">
        <Link to="/" className="inline-flex items-center gap-1.5 mb-6" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <p style={{ fontSize: "14px", color: error ? "#ff6b6b" : "var(--reel-muted)" }}>
          {error ?? "Film introuvable."}
        </p>
      </div>
    );
  }

  const genres = splitList(film.genres);
  const castList = parseCast(film.cast_principal);
  const scenaristes = splitList(film.scenariste);

  const allFormats = Array.from(
    new Set(editions.flatMap((ed) => splitList(ed.formats_extraits)).filter(Boolean))
  );

  const filteredEditions = formatFilter
    ? editions.filter((ed) =>
        splitList(ed.formats_extraits).some((f) => f.toLowerCase() === formatFilter.toLowerCase())
      )
    : editions;

  const durationFormatted = formatDuration(film.duree);
  const paysList = splitList(film.pays);
  const producteurs = splitList(film.producteurs);
  const dateSortieFr = formatDateSortie(film.date_sortie);
  const budgetFormate = formatBudget(film.budget);
  const specs = agregerSpecs(editions);

  // Un titre déjà affiché ailleurs sur la carte n'apprend rien : le titre
  // anglais est le titre original dans la plupart des cas, et le répéter deux
  // lignes plus bas donne à la fiche l'air de bégayer.
  const dejaVus = new Set(
    [film.titre, film.titre_original].filter(Boolean).map((t) => String(t).toLowerCase())
  );
  const titresEtrangers = Object.entries(film.titres_alternatifs || {})
    .filter(([code, titre]) => titre && LANGUES_TITRES[code] && !dejaVus.has(titre.toLowerCase()))
    .sort((a, b) => LANGUES_TITRES[a[0]].localeCompare(LANGUES_TITRES[b[0]], "fr"));

  return (
    <div className="w-full" style={{ backgroundColor: "var(--reel-bg)", minHeight: "100vh" }}>
      {/* Hero */}
      {/* Pas de hauteur minimale : elle laissait un vide sous les boutons quand
          le film avait un synopsis court. Le héros épouse son contenu. */}
      <div className="relative w-full">
        {/*
          Le site s'appelle Jaquette : l'image de l'œuvre porte l'identité, pas
          le chrome. On prend le backdrop TMDB quand il existe — une vraie image
          large, nette — et on retombe sur l'affiche floutée sinon, faute de
          mieux. Chaque fiche a donc sa propre couleur dominante.
        */}
        {(film.backdrop_url || film.affiche_url) && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={film.backdrop_url ?? film.affiche_url ?? ""}
              alt=""
              aria-hidden
              className="absolute w-full h-full object-cover pointer-events-none"
              style={
                film.backdrop_url
                  // Atmosphère, pas illustration : un léger flou empêche l'image
                  // de disputer l'attention au texte, et un contraste réduit
                  // l'empêche de produire des zones claires sous les lettres.
                  ? {
                      opacity: 0.38,
                      objectPosition: "50% 22%",
                      filter: "blur(3px) saturate(0.85) contrast(0.9)",
                      transform: "scale(1.04)",
                    }
                  : { filter: "blur(32px)", transform: "scale(1.15)", opacity: 0.35 }
              }
            />
          </div>
        )}
        {/*
          Deux dégradés, pas un. Le vertical seul laissait le texte sur une
          image nette : lisible sur un fond sombre, illisible sur un ciel clair
          ou un visage. L'horizontal donne au texte un fond franc à gauche et
          laisse l'image respirer à droite, où il n'y a rien à lire.
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(16, 23, 32,1) 0%, rgba(16, 23, 32,0.99) 40%, rgba(16, 23, 32,0.9) 58%, rgba(16, 23, 32,0.55) 78%, rgba(16, 23, 32,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(16, 23, 32,0.7) 0%, rgba(16, 23, 32,0.35) 30%, rgba(16, 23, 32,0.8) 80%, var(--reel-bg) 100%)",
          }}
        />

        {/*
          Le lien de retour est passé à l'intérieur du héros. Dehors, il occupait
          une bande de 120 px que le backdrop ne couvrait pas : l'image
          commençait sous lui, et le haut de la page montrait un aplat gris avec
          une arête nette. Le héros part maintenant du filet de l'en-tête.

          `pt-[88px]` reste : c'est ce qui dégage l'en-tête fixe.
        */}
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 pt-[88px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] rounded-full"
            style={{ fontSize: "14px", color: "var(--reel-muted)" }}
          >
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>

        {/*
          Grille et non pile, pour que le mobile et le bureau puissent ranger
          les mêmes blocs dans deux ordres différents sans dupliquer le balisage.

          Sur mobile, l'affiche et le titre partagent la première ligne, puis
          les boutons, puis le synopsis. Empilé — affiche centrée, titre,
          réalisation, note, synopsis, boutons — le premier écran s'arrêtait
          au milieu du synopsis : on arrivait sur la fiche sans voir une seule
          action. Le synopsis passe donc sous les boutons ; il se lit toujours,
          mais après avoir eu le choix d'agir.

          Sur écran large l'ordre d'origine tient — synopsis puis boutons — et
          l'affiche court sur les trois rangées.
        */}
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 pb-8 sm:pb-14 pt-4 sm:pt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-4 sm:gap-x-6 items-start">
          {/* Poster */}
          <div
            className="col-start-1 row-start-1 sm:row-span-3 shrink-0 rounded-[8px] overflow-hidden self-start"
            style={{
              width: "clamp(120px, 22vw, 280px)",
              aspectRatio: "2 / 3",
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <ImageWithFallback
              src={film.affiche_url ?? ""}
              alt={`Affiche de ${film.titre}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Titre, réalisation, note — la colonne à droite de l'affiche */}
          <div className="col-start-2 row-start-1 min-w-0 flex flex-col gap-2 sm:gap-3 sm:pt-2">
            <div>
              <h1
                style={{
                  // Les variables ne sont posées que par le sélecteur d'essai,
                  // en développement. En production, les replis s'appliquent.
                  fontFamily: "var(--reel-font-titre)",
                  // 22 px au plancher : à 30 px, le titre occupait trois lignes
                  // à côté d'une affiche de 120 px et repoussait tout le reste.
                  fontSize: "clamp(22px, 3.4vw, 44px)",
                  fontWeight: 800,
                  color: "var(--reel-text)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  textTransform: "none",
                }}
              >
                {film.titre}
                {film.annee && (
                  // Espace insécable large plutôt qu'une espace ordinaire : à
                  // 44 px, l'espace du titre est trop serrée et l'année colle
                  // au dernier mot. Graisse 200, le plus fin que Bricolage
                  // Grotesque propose : contre un titre en 800, plus l'écart
                  // est large, moins l'année se lit comme un morceau du titre.
                  <span style={{ fontWeight: 200, color: "var(--reel-muted)" }}>
                    {"  "}({film.annee})
                  </span>
                )}
              </h1>
            </div>

            {/*
              Le héros s'en tient à ce qui situe le film : titre, auteur, note,
              récit, action. Accroche, durée, genres et distribution vivent dans
              l'onglet Détails — les empiler ici repoussait les boutons hors de
              vue sans rien apprendre d'essentiel.
            */}
            <p style={{ fontSize: "15px", color: "var(--reel-muted)", lineHeight: "22.5px" }}>
              {film.realisateur && (
                <>
                  {/* « Réalisé par » saute sur mobile : dans une colonne de
                      200 px, ces trois mots prennent une ligne entière pour
                      annoncer ce que la position dit déjà. */}
                  <span className="hidden sm:inline">Réalisé par </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(film.realisateur)}
                    className="outline-none transition"
                    style={{ color: "var(--reel-text)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "rgba(232,232,232,0.3)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--reel-text)")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "rgba(232,232,232,0.3)")}
                  >
                    {film.realisateur}
                  </button>
                </>
              )}
            </p>



            {film.note != null && film.note !== "" && (
              <div className="flex items-center gap-[6px]">
                <Star size={18} color="#d9a441" fill="#d9a441" />
                {/* TMDB rend 7.901 : trois décimales suggèrent une précision
                    que la note n'a pas. Deux suffisent. */}
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
                  {Number(film.note).toFixed(2)}
                </span>
                <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>/ 10</span>
              </div>
            )}
          </div>

          {film.synopsis && (
            /*
              Quatre lignes sur mobile, tout sur écran large. Un synopsis TMDB
              fait souvent quinze lignes à 375 px : déplié, il repoussait la
              barre d'onglets si loin qu'on ne soupçonnait plus son existence.

              `line-clamp` et non une troncature de la chaîne : couper le texte
              en JavaScript demanderait de deviner combien de signes tiennent
              sur quatre lignes, ce qui dépend de la largeur et de la police.
            */
            <div className="col-span-2 row-start-3 sm:col-span-1 sm:col-start-2 sm:row-start-2 max-w-[640px]">
              <p
                ref={synopsisRef}
                className={synopsisOuvert ? "" : "line-clamp-4 sm:line-clamp-none"}
                style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: "24px" }}
              >
                {film.synopsis}
              </p>
              {synopsisDeborde && (
                <button
                  type="button"
                  onClick={() => setSynopsisOuvert((o) => !o)}
                  className="mt-1 sm:hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] rounded-[6px]"
                  style={{ fontSize: "14px", fontWeight: 500, color: "var(--reel-accent-clair)" }}
                >
                  {synopsisOuvert ? "Voir moins" : "Voir plus"}
                </button>
              )}
            </div>
          )}

          {/* Global CTA buttons */}
          <div
            ref={dropdownRef}
            className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-3 relative flex flex-wrap gap-[10px] items-center"
          >
              {/* Add to Collection split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleMainCta("possede")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "var(--reel-accent)", fontSize: "15px", fontWeight: 500, color: "#fff" }}
                  >
                    <Library size={16} color="#fff" strokeWidth={2} />
                    Ajouter à la collection
                  </button>
                  <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.3)" }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "possede" ? null : "possede"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "var(--reel-accent)" }}
                    title="Choisir une édition"
                  >
                    <ChevronDown
                      size={16}
                      color="#fff"
                      style={{ transform: openDropdown === "possede" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                </div>

                {openDropdown === "possede" && (
                  <div
                    className="absolute left-0 mt-2 z-50 rounded-[12px] overflow-hidden py-2"
                    style={{
                      backgroundColor: "var(--reel-surface)",
                      border: "1px solid var(--reel-border)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "var(--reel-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Choisir une édition
                    </p>
                    {editions.map((ed) => {
                      const active = statuts[ed.id] === "possede";
                      return (
                        <button
                          key={ed.id}
                          type="button"
                          onClick={() => handleEditionStatut(ed.id, "possede")}
                          className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 transition"
                          style={{
                            fontSize: "14px",
                            color: active ? "var(--reel-accent-clair)" : "var(--reel-text)",
                            backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--reel-accent-soft)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Library size={15} color="var(--reel-accent-clair)" strokeWidth={2.2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add to Wishlist split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden" style={{ border: "1px solid var(--reel-border)" }}>
                  <button
                    type="button"
                    onClick={() => handleMainCta("envie")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "transparent", fontSize: "15px", fontWeight: 500, color: "var(--reel-accent-clair)" }}
                  >
                    <Bookmark size={16} color="var(--reel-accent-clair)" fill="none" strokeWidth={2} />
                    Ajouter aux envies
                  </button>
                  <div style={{ width: "1px", backgroundColor: "var(--reel-accent)", opacity: 0.3 }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "envie" ? null : "envie"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "transparent" }}
                    title="Choisir une édition"
                  >
                    <ChevronDown
                      size={16}
                      color="var(--reel-accent-clair)"
                      style={{ transform: openDropdown === "envie" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                </div>

                {openDropdown === "envie" && (
                  <div
                    className="absolute left-0 mt-2 z-50 rounded-[12px] overflow-hidden py-2"
                    style={{
                      backgroundColor: "var(--reel-surface)",
                      border: "1px solid var(--reel-border)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "var(--reel-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Choisir une édition
                    </p>
                    {editions.map((ed) => {
                      const active = statuts[ed.id] === "envie";
                      return (
                        <button
                          key={ed.id}
                          type="button"
                          onClick={() => handleEditionStatut(ed.id, "envie")}
                          className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 transition"
                          style={{
                            fontSize: "14px",
                            color: active ? "var(--reel-accent-clair)" : "var(--reel-text)",
                            backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--reel-accent-soft)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Bookmark size={15} color="var(--reel-accent-clair)" fill="var(--reel-accent-clair)" strokeWidth={2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="sticky top-[64px] z-10"
        style={{ backgroundColor: "var(--reel-bg)", borderBottom: "1px solid var(--reel-border)" }}
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-3 outline-none transition"
              style={{
                fontSize: "15px",
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? "var(--reel-text)" : "var(--reel-muted)",
              }}
            >
              {tab}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: "var(--reel-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6 pb-24">

        {activeTab === "Editions" && (
          <div className="flex flex-col gap-4">
            {allFormats.length > 0 && (
              /*
                Une seule ligne, qui défile latéralement au besoin.

                En `flex-wrap`, sept formats passaient sur trois lignes en
                mobile et poussaient la première édition sous le pli. Une barre
                de filtres est un rail : elle doit tenir sur sa ligne, quitte à
                ce qu'on la fasse glisser. Les capsules gardent `shrink-0`,
                sinon flex les comprime au lieu de déborder, et les marges
                négatives font mordre le rail sur le rembourrage de la page —
                sans elles, le défilement s'arrêterait avant le bord et laisserait
                croire qu'il n'y a plus rien.
              */
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setFormatFilter(null)}
                  className="shrink-0 whitespace-nowrap rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                  style={{
                    backgroundColor: formatFilter === null ? "var(--reel-accent)" : "var(--reel-surface)",
                    border: `1px solid ${formatFilter === null ? "var(--reel-accent-clair)" : "var(--reel-border)"}`,
                    fontSize: "13px", fontWeight: 500,
                    color: formatFilter === null ? "#fff" : "var(--reel-muted)",
                    padding: "7px 13px",
                  }}
                >
                  Tous
                </button>
                {allFormats.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormatFilter(fmt === formatFilter ? null : fmt)}
                    className="shrink-0 whitespace-nowrap rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                    style={{
                      backgroundColor: formatFilter === fmt ? "var(--reel-accent)" : "var(--reel-surface)",
                      border: `1px solid ${formatFilter === fmt ? "var(--reel-accent-clair)" : "var(--reel-border)"}`,
                      fontSize: "13px", fontWeight: 500,
                      color: formatFilter === fmt ? "#fff" : "var(--reel-muted)",
                      padding: "7px 13px",
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}

            {filteredEditions.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>Aucune édition pour ce film.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEditions.map((ed) => {
                  const fmtTags = splitList(ed.formats_extraits);
                  return (
                    <div
                      key={ed.id}
                      className="rounded-[12px] w-full"
                      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
                    >
                      <div className="flex gap-3 items-center p-[13px]">
                        <div
                          className="rounded-[8px] overflow-hidden shrink-0"
                          style={{ width: 56, height: 84, backgroundColor: "var(--reel-bg)" }}
                        >
                          <ImageWithFallback
                            src={ed.image_url ?? ""}
                            alt={ed.titre ?? "Édition"}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                          <p
                            className="truncate"
                            style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)", lineHeight: "22.5px" }}
                          >
                            {ed.titre ?? "Édition sans titre"}
                          </p>

                          {/* Format + région + pays + année */}
                          {(fmtTags.length > 0 || ed.region || ed.pays || ed.date_sortie) && (
                            <div className="flex flex-wrap gap-[6px]">
                              {/*
                                Quatre capsules par ligne — format, zone, pays,
                                parfois l'année — faisaient quarante objets sur
                                une fiche à dix éditions, pour ce qui tient en
                                une phrase. En texte, ça se lit d'un coup d'œil
                                et la capsule redevient le signal d'un contrôle.
                              */}
                              <span style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "19.5px" }}>
                                {[...fmtTags, ed.region, ed.pays].filter(Boolean).join(" · ")}
                              </span>
                              {ed.date_sortie && (
                                <span style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "19.5px" }}>
                                  {ed.date_sortie}
                                </span>
                              )}
                            </div>
                          )}

                          {ed.prix_fnac_extrait && (
                            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)", lineHeight: "22.5px" }}>
                              {ed.prix_fnac_extrait}
                            </p>
                          )}
                        </div>

                        <CircleStatusButtons
                          editionId={ed.id}
                          status={statuts[ed.id]}
                          onToggle={handleEditionStatut}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Détails" && (
          /*
            Distribution en tête, pleine largeur, puis les deux fiches côte à
            côte. Les visages passent avant les tableaux : c'est ce qu'on
            reconnaît d'un coup d'œil, et une grille de portraits a besoin de
            toute la largeur — dans une demi-colonne elle retombait à trois
            cartes par ligne.

            Pas de synopsis ici : il est déjà en entier dans le héros, au-dessus
            des onglets. Le répéter deux fois sur le même écran ne renseignait
            personne.
          */
          <div className="flex flex-col gap-10">
            {castList.length > 0 && (
              <section>
                <TitreSection>Distribution</TitreSection>
                {/*
                  Un rail qui défile, et non une grille qui se replie. À douze
                  acteurs la grille faisait deux rangées sur écran large et
                  quatre sur mobile, repoussant les deux fiches techniques hors
                  de vue — alors que la distribution est un accessoire de la
                  page, pas son sujet. Sur une ligne, elle occupe la même
                  hauteur quel que soit le nombre d'acteurs.

                  Largeur de carte fixe plutôt qu'une fraction du conteneur :
                  dans un conteneur qui défile, un pourcentage se calcule sur la
                  largeur visible et toutes les cartes se tasseraient pour tenir
                  dedans. La demi-carte qui dépasse à droite est le seul indice
                  qu'il y a une suite, elle est donc voulue.
                */}
                <RailHorizontal ariaLabel="Distribution">
                  {castList.map((m) => (
                    <div key={m.nom} className="w-[116px] shrink-0 sm:w-[132px]">
                      <CarteActeur membre={m} onClick={() => setSelectedPerson(m.nom)} />
                    </div>
                  ))}
                </RailHorizontal>
              </section>
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-8">
              {/*
                Deux blocs et non un. L'ancienne fiche unique mélangeait ce qui
                relève de l'œuvre — réalisation, année, genres, titres étrangers,
                identiques quel que soit le disque — et ce qui relève du support
                — définition, HDR, pistes audio, qui changent d'une édition à
                l'autre. Les séparer dit d'où vient chaque ligne.

                Ordre et vocabulaire calqués sur la fiche technique de
                SensCritique, prise comme référence pour cette v1 : titre
                original, titres alternatifs, genres, année, pays, durée, dates
                de sortie, réalisateur, scénariste, producteurs, distributeur,
                budget, bande originale.

                Le distributeur n'y figure pas : TMDB ne publie que les sociétés
                de production, qui ne sont le distributeur que par accident.
                L'éditeur vidéo relevé sur blu-ray.com le remplace, et il est
                dans l'autre bloc — il qualifie le disque, pas l'œuvre.

                La note n'est pas de leur liste non plus. Gardée quand même,
                pour le nombre de votes, que le héros n'affiche pas.
              */}
              <BlocFiche
                titre="L'œuvre"
                lignes={[
                  film.titre_original && film.titre_original !== film.titre &&
                    { label: "Titre original", value: film.titre_original },
                  titresEtrangers.length > 0 && {
                    label: "Autres titres",
                    // Une ligne par langue : sur un seul paragraphe, les titres
                    // se confondaient entre eux dès qu'il y en avait trois.
                    value: (
                      <span className="flex flex-col gap-1">
                        {titresEtrangers.map(([code, titre]) => (
                          <span key={code}>
                            <span style={{ color: "var(--reel-muted)" }}>{LANGUES_TITRES[code]}</span>
                            {" · "}
                            {titre}
                          </span>
                        ))}
                      </span>
                    ),
                  },
                  // L'accroche d'affiche TMDB. Elle a d'abord ouvert la colonne
                  // de droite, hors carte : elle y flottait sans rien qualifier.
                  // Ici elle suit les titres, ce qu'elle prolonge — mais elle
                  // reste en italique, parce que c'est une phrase d'affiche et
                  // non une donnée relevée comme les lignes qui suivent. En
                  // blanc comme les autres valeurs : le gris la faisait passer
                  // pour un libellé alors qu'elle est du contenu.
                  film.tagline && { label: "Accroche", value: <em>{film.tagline}</em> },
                  genres.length > 0 && { label: "Genres", value: genres.join(", ") },
                  film.annee && { label: "Année", value: String(film.annee) },
                  paysList.length > 0 && { label: "Pays", value: paysList.join(", ") },
                  durationFormatted && { label: "Durée", value: durationFormatted },
                  dateSortieFr && { label: "Sortie", value: dateSortieFr },
                  film.realisateur && { label: "Réalisateur", value: film.realisateur },
                  scenaristes.length > 0 && { label: "Scénariste", value: scenaristes.join(", ") },
                  producteurs.length > 0 && { label: "Producteurs", value: producteurs.join(", ") },
                  film.musique && { label: "Bande originale", value: film.musique },
                  budgetFormate && { label: "Budget", value: budgetFormate },
                  film.note != null && film.note !== "" && {
                    label: "Note TMDB",
                    // Deux décimales comme dans le héros : la même note ne peut
                    // pas s'afficher différemment à deux endroits.
                    value: film.nb_votes
                      ? `${Number(film.note).toFixed(2)} / 10 (${film.nb_votes.toLocaleString("fr-FR")} votes)`
                      : `${Number(film.note).toFixed(2)} / 10`,
                  },
                ]}
              />

            </div>

            <div className="flex flex-col gap-8">
              {/*
                Ce bloc réunit les specs de toutes les éditions du film, pas
                celles d'un disque. Il se lit « disponible en Dolby Vision », et
                non « ce film est en Dolby Vision » — d'où la mention du nombre
                d'éditions dépouillées, qui dit sur quoi la liste s'appuie.

                Aucune donnée n'en vient d'IMDb : leurs conditions interdisent
                l'extraction, et leurs jeux gratuits sont réservés à un usage non
                commercial et ne contiennent de toute façon aucune spec. Tout
                vient des fiches blu-ray.com déjà en cache.
              */}
              <BlocFiche
                titre="Image et son"
                lignes={[
                  specs.definitions.length > 0 && {
                    label: "Définition",
                    value: specs.definitions.join(" · "),
                  },
                  specs.hdr.length > 0 && { label: "HDR", value: specs.hdr.join(" · ") },
                  specs.ratios.length > 0 && { label: "Format", value: specs.ratios.join(" · ") },
                  specs.codecs.length > 0 && { label: "Codec", value: specs.codecs.join(" · ") },
                  specs.languesAudio.length > 0 && {
                    label: "Audio",
                    value: specs.languesAudio.join(", "),
                  },
                  specs.sousTitres.length > 0 && {
                    label: "Sous-titres",
                    value: specs.sousTitres.join(", "),
                  },
                  specs.editeurs.length > 0 && { label: "Éditeur", value: specs.editeurs.join(" · ") },
                  specs.zones.length > 0 && { label: "Zone", value: specs.zones.join(" · ") },
                ]}
                note={
                  specs.sources > 0
                    ? `Relevé sur ${specs.sources} édition${specs.sources > 1 ? "s" : ""} du catalogue.`
                    : undefined
                }
              />

              {/*
                Ce que Jaquette apporte que TMDB n'a pas : le recensement des
                éditions physiques. C'est l'information la plus rare de la page,
                elle mérite une place et pas une ligne de tableau.
              */}
              {editions.length > 0 && (
                <section>
                  <TitreSection>Au catalogue</TitreSection>
                  <p className="pt-3" style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: "25px" }}>
                    {editions.length} édition{editions.length > 1 ? "s" : ""} recensée
                    {editions.length > 1 ? "s" : ""}
                    {allFormats.length > 0 && <> en {allFormats.join(", ")}</>}.
                    {(() => {
                      const avecEan = editions.filter((e) => e.ean).length;
                      return avecEan > 0 ? ` ${avecEan} avec code-barres.` : "";
                    })()}
                  </p>
                </section>
              )}
            </div>
            </div>
          </div>
        )}

        {(activeTab === "Critiques" || activeTab === "Listes") && (
          <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>Section bientôt disponible.</p>
        )}
      </div>

      {selectedPerson && (
        <PersonModal name={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}

      <ModaleConnexion
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        retourVers={`/films/${filmId}`}
      />

    </div>
  );
}
