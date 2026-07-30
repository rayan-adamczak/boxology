import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Loader2, Star, Bookmark, Library, ChevronDown, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PersonModal } from "../components/PersonModal";
import { UserAvatar } from "../components/UserAvatar";
import { toast } from "sonner";
import {
  getFilm,
  getEditionsForFilm,
  splitList,
  type Film,
  type Edition,
  type StatutValue,
} from "../lib/reelio-db";
import { basculerStatut, chargerStatuts, CompteRequis } from "../lib/collections";
import { ModaleConnexion } from "../components/ModaleConnexion";
import { useSession } from "../lib/auth";
import { useSeo, extrait, type Seo } from "../lib/seo";

/* ---- helpers ---- */

function formatDuration(raw: string | null): string {
  if (!raw) return "";
  const total = parseInt(String(raw), 10);
  if (isNaN(total)) return String(raw);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return `${h}h ${String(min).padStart(2, "0")}min`;
}

interface CastMember { nom: string; role: string }

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
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
        style={{
          backgroundColor: collectionActive ? "#2e7dff" : "#262c33",
          border: collectionActive ? "1px solid #2e7dff" : "none",
        }}
      >
        {collectionActive
          ? <Library size={15} color="#fff" strokeWidth={2.2} />
          : <Plus size={15} color="#8a8f98" strokeWidth={2} />}
      </button>

      <button
        type="button"
        onClick={() => handle("envie")}
        aria-pressed={wishlistActive}
        title={wishlistActive ? "Retirer des envies" : "Ajouter aux envies"}
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
        style={{
          backgroundColor: wishlistActive ? "#2e7dff" : "#262c33",
          border: wishlistActive ? "1px solid #2e7dff" : "none",
        }}
      >
        <Bookmark
          size={15}
          color={wishlistActive ? "#fff" : "#8a8f98"}
          fill={wishlistActive ? "#fff" : "none"}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#e8e8e8" }}>{children}</h2>
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
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const session = useSession();

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
      <div className="flex items-center gap-2 px-16 pt-[120px]" style={{ color: "#8a8f98" }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: "14px" }}>Chargement…</span>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="px-16 pt-[120px]">
        <Link to="/" className="inline-flex items-center gap-1.5 mb-6" style={{ fontSize: "14px", color: "#8a8f98" }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <p style={{ fontSize: "14px", color: error ? "#ff6b6b" : "#8a8f98" }}>
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

  return (
    <div className="w-full" style={{ backgroundColor: "#14181c", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="mx-auto max-w-[1440px] px-8 lg:px-16 pt-[88px]">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mb-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff] rounded-full"
          style={{ fontSize: "14px", color: "#8a8f98" }}
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>

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
              "linear-gradient(to right, rgba(20,24,28,1) 0%, rgba(20,24,28,0.99) 40%, rgba(20,24,28,0.9) 58%, rgba(20,24,28,0.55) 78%, rgba(20,24,28,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,24,28,0.7) 0%, rgba(20,24,28,0.35) 30%, rgba(20,24,28,0.8) 80%, #14181c 100%)",
          }}
        />

        <div className="relative mx-auto max-w-[1440px] px-8 lg:px-16 pb-14 pt-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Poster */}
          <div
            className="shrink-0 rounded-[8px] overflow-hidden self-center sm:self-start"
            style={{
              width: "clamp(160px, 18vw, 280px)",
              aspectRatio: "2 / 3",
              backgroundColor: "#1f242a",
              border: "1px solid #2a3138",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <ImageWithFallback
              src={film.affiche_url ?? ""}
              alt={`Affiche de ${film.titre}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 pt-2">
            <div>
              <h1
                style={{
                  // Les variables ne sont posées que par le sélecteur d'essai,
                  // en développement. En production, les replis s'appliquent.
                  fontFamily: "var(--titre-famille, inherit)",
                  fontSize: "calc(clamp(30px, 3.4vw, 44px) * var(--titre-echelle, 1))",
                  fontWeight: "var(--titre-graisse, 700)" as unknown as number,
                  color: "#e8e8e8",
                  lineHeight: "var(--titre-interligne, 1.08)" as unknown as number,
                  letterSpacing: "var(--titre-approche, -0.02em)",
                  textTransform: "var(--titre-casse, none)" as unknown as "none",
                }}
              >
                {film.titre}
              </h1>
              {/* L'accroche vient de TMDB et manque souvent : jamais inventée. */}
              {film.tagline && (
                <p
                  className="pt-2"
                  style={{ fontSize: "16px", fontStyle: "italic", color: "#8a8f98", lineHeight: "22px" }}
                >
                  {film.tagline}
                </p>
              )}
            </div>

            {/*
              Année, durée et genres sur une seule ligne séparée par des points
              médians. En capsules, « Aventure » devenait un objet visuel de
              même poids qu'un filtre cliquable — l'œil ne pouvait plus
              distinguer ce qui se clique de ce qui se lit.
            */}
            <p style={{ fontSize: "15px", color: "#8a8f98", lineHeight: "22.5px" }}>
              {[film.annee, durationFormatted, genres.join(", ")].filter(Boolean).join(" · ")}
            </p>

            <p style={{ fontSize: "15px", color: "#8a8f98", lineHeight: "22.5px" }}>
              {film.realisateur && (
                <>
                  Réalisé par{" "}
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(film.realisateur)}
                    className="outline-none transition"
                    style={{ color: "#e8e8e8", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "rgba(232,232,232,0.3)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "#e8e8e8")}
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
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#e8e8e8" }}>{film.note}</span>
                <span style={{ fontSize: "13px", color: "#8a8f98" }}>/ 10</span>
              </div>
            )}

            {film.synopsis && (
              <p className="max-w-[640px]" style={{ fontSize: "15px", color: "#e8e8e8", lineHeight: "24px" }}>
                {film.synopsis}
              </p>
            )}

            {/*
              Une distribution est une liste de noms, pas d'étiquettes. En
              capsules, cinq acteurs faisaient cinq objets visuels sous le
              synopsis, du même poids que les filtres. Les noms restent
              cliquables — le lien souligné le dit mieux qu'une bulle.
            */}
            {castList.length > 0 && (
              <p className="max-w-[640px]" style={{ fontSize: "15px", color: "#8a8f98", lineHeight: "24px" }}>
                Avec{" "}
                {castList.map((m, i) => (
                  <span key={m.nom}>
                    {i > 0 && ", "}
                    <button
                      type="button"
                      onClick={() => setSelectedPerson(m.nom)}
                      className="outline-none transition focus-visible:ring-2 focus-visible:ring-[#2e7dff] rounded"
                      style={{
                        color: "#e8e8e8",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        textDecorationColor: "rgba(232,232,232,0.25)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "#e8e8e8")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "rgba(232,232,232,0.25)")}
                    >
                      {m.nom}
                    </button>
                  </span>
                ))}
              </p>
            )}

            {/* Global CTA buttons */}
            <div ref={dropdownRef} className="relative flex flex-wrap gap-[10px] items-center mt-1">
              {/* Add to Collection split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden" style={{ border: "1px solid #2e7dff" }}>
                  <button
                    type="button"
                    onClick={() => handleMainCta("possede")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "#2e7dff", fontSize: "15px", fontWeight: 500, color: "#fff" }}
                  >
                    <Library size={16} color="#fff" strokeWidth={2} />
                    Ajouter à la collection
                  </button>
                  <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.3)" }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "possede" ? null : "possede"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "#2e7dff" }}
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
                      backgroundColor: "#1f242a",
                      border: "1px solid #2a3138",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                            color: active ? "#2e7dff" : "#e8e8e8",
                            backgroundColor: active ? "rgba(46,125,255,0.08)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "rgba(46,125,255,0.08)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Library size={15} color="#2e7dff" strokeWidth={2.2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add to Wishlist split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden" style={{ border: "1px solid #2e7dff" }}>
                  <button
                    type="button"
                    onClick={() => handleMainCta("envie")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "transparent", fontSize: "15px", fontWeight: 500, color: "#2e7dff" }}
                  >
                    <Bookmark size={16} color="#2e7dff" fill="none" strokeWidth={2} />
                    Ajouter aux envies
                  </button>
                  <div style={{ width: "1px", backgroundColor: "#2e7dff", opacity: 0.3 }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "envie" ? null : "envie"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "transparent" }}
                    title="Choisir une édition"
                  >
                    <ChevronDown
                      size={16}
                      color="#2e7dff"
                      style={{ transform: openDropdown === "envie" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                </div>

                {openDropdown === "envie" && (
                  <div
                    className="absolute left-0 mt-2 z-50 rounded-[12px] overflow-hidden py-2"
                    style={{
                      backgroundColor: "#1f242a",
                      border: "1px solid #2a3138",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                            color: active ? "#2e7dff" : "#e8e8e8",
                            backgroundColor: active ? "rgba(46,125,255,0.08)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "rgba(46,125,255,0.08)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Bookmark size={15} color="#2e7dff" fill="#2e7dff" strokeWidth={2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="sticky top-[64px] z-10"
        style={{ backgroundColor: "#14181c", borderBottom: "1px solid #2a3138" }}
      >
        <div className="mx-auto max-w-[1440px] px-8 lg:px-16 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-3 outline-none transition"
              style={{
                fontSize: "15px",
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? "#e8e8e8" : "#8a8f98",
              }}
            >
              {tab}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: "#2e7dff" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-[1440px] px-8 lg:px-16 py-6 pb-24">

        {activeTab === "Editions" && (
          <div className="flex flex-col gap-4">
            {allFormats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormatFilter(null)}
                  className="rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
                  style={{
                    backgroundColor: formatFilter === null ? "#2e7dff" : "#1f242a",
                    border: `1px solid ${formatFilter === null ? "#2e7dff" : "#2a3138"}`,
                    fontSize: "13px", fontWeight: 500,
                    color: formatFilter === null ? "#fff" : "#8a8f98",
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
                    className="rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
                    style={{
                      backgroundColor: formatFilter === fmt ? "#2e7dff" : "#1f242a",
                      border: `1px solid ${formatFilter === fmt ? "#2e7dff" : "#2a3138"}`,
                      fontSize: "13px", fontWeight: 500,
                      color: formatFilter === fmt ? "#fff" : "#8a8f98",
                      padding: "7px 13px",
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}

            {filteredEditions.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#8a8f98" }}>Aucune édition pour ce film.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEditions.map((ed) => {
                  const fmtTags = splitList(ed.formats_extraits);
                  return (
                    <div
                      key={ed.id}
                      className="rounded-[12px] w-full"
                      style={{ backgroundColor: "#1f242a", border: "1px solid #2a3138" }}
                    >
                      <div className="flex gap-3 items-center p-[13px]">
                        <div
                          className="rounded-[8px] overflow-hidden shrink-0"
                          style={{ width: 56, height: 84, backgroundColor: "#14181c" }}
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
                            style={{ fontSize: "15px", fontWeight: 500, color: "#e8e8e8", lineHeight: "22.5px" }}
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
                              <span style={{ fontSize: "13px", color: "#8a8f98", lineHeight: "19.5px" }}>
                                {[...fmtTags, ed.region, ed.pays].filter(Boolean).join(" · ")}
                              </span>
                              {ed.date_sortie && (
                                <span style={{ fontSize: "13px", color: "#8a8f98", lineHeight: "19.5px" }}>
                                  {ed.date_sortie}
                                </span>
                              )}
                            </div>
                          )}

                          {ed.prix_fnac_extrait && (
                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8e8e8", lineHeight: "22.5px" }}>
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
            Distribution à gauche, fiche technique à droite. L'ancienne version
            empilait tout dans une liste libellé/valeur, distribution comprise,
            ce qui écrasait des noms de personnes dans des lignes de tableau.

            Pas de synopsis ici : il est déjà en entier dans le héros, au-dessus
            des onglets. Le répéter deux fois sur le même écran ne renseignait
            personne.
          */
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-8">
              {castList.length > 0 && (
                <section>
                  <TitreSection>Distribution</TitreSection>
                  <ul className="flex flex-col gap-3 pt-4">
                    {castList.map((m) => (
                      <li key={m.nom}>
                        <button
                          type="button"
                          onClick={() => setSelectedPerson(m.nom)}
                          className="flex w-full items-center gap-3 rounded-[8px] px-2 py-1.5 text-left outline-none transition hover:bg-[#1f242a] focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
                        >
                          <UserAvatar name={m.nom} size={36} />
                          <span className="min-w-0">
                            <span className="block truncate" style={{ fontSize: "15px", color: "#e8e8e8" }}>
                              {m.nom}
                            </span>
                            {m.role && (
                              <span className="block truncate" style={{ fontSize: "13px", color: "#8a8f98" }}>
                                {m.role}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>

            <div className="flex flex-col gap-8">
              <section
                className="rounded-[10px] p-5"
                style={{ backgroundColor: "#1f242a", border: "1px solid #2a3138" }}
              >
                <TitreSection>Fiche technique</TitreSection>
                <dl className="pt-3">
                  {([
                    film.titre_original && film.titre_original !== film.titre &&
                      { label: "Titre original", value: film.titre_original },
                    film.realisateur && { label: "Réalisation", value: film.realisateur },
                    scenaristes.length > 0 && { label: "Scénario", value: scenaristes.join(", ") },
                    film.annee && { label: "Année", value: String(film.annee) },
                    durationFormatted && { label: "Durée", value: durationFormatted },
                    genres.length > 0 && { label: "Genres", value: genres.join(", ") },
                    film.note != null && film.note !== "" && {
                      label: "Note TMDB",
                      value: film.nb_votes
                        ? `${film.note} / 10 (${film.nb_votes.toLocaleString("fr-FR")} votes)`
                        : `${film.note} / 10`,
                    },
                  ] as const)
                    .filter(Boolean)
                    .map((row) => {
                      const { label, value } = row as { label: string; value: string };
                      return (
                        <div key={label} className="flex gap-4 py-2">
                          <dt className="shrink-0 w-[130px]" style={{ fontSize: "13px", color: "#8a8f98", lineHeight: "21px" }}>
                            {label}
                          </dt>
                          <dd style={{ fontSize: "14px", color: "#e8e8e8", lineHeight: "21px" }}>{value}</dd>
                        </div>
                      );
                    })}
                </dl>
              </section>

              {/*
                Ce que Jaquette apporte que TMDB n'a pas : le recensement des
                éditions physiques. C'est l'information la plus rare de la page,
                elle mérite une place et pas une ligne de tableau.
              */}
              {editions.length > 0 && (
                <section>
                  <TitreSection>Au catalogue</TitreSection>
                  <p className="pt-3" style={{ fontSize: "15px", color: "#e8e8e8", lineHeight: "25px" }}>
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
        )}

        {(activeTab === "Critiques" || activeTab === "Listes") && (
          <p style={{ fontSize: "14px", color: "#8a8f98" }}>Section bientôt disponible.</p>
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
