import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Loader2, Star, CheckCircle2, Heart, ChevronDown, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PersonModal } from "../components/PersonModal";
import { toast } from "sonner";
import {
  getFilm,
  getEditionsForFilm,
  type Film,
  type Edition,
  type StatutValue,
} from "../lib/reelio-db";
import {
  getStatusForEditions,
  toggleStatutLocal,
  setStatutLocal,
  removeStatutLocal,
} from "../lib/local-statuts";

/* ---- helpers ---- */

function formatDuration(raw: string | null): string {
  if (!raw) return "";
  const total = parseInt(String(raw), 10);
  if (isNaN(total)) return String(raw);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return `${h}h ${String(min).padStart(2, "0")}min`;
}

function splitList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  return String(val).split(",").map((s) => s.trim()).filter(Boolean);
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

function GenrePill({ label }: { label: string }) {
  return (
    <div
      className="relative rounded-full shrink-0"
      style={{ backgroundColor: "#1f242a", border: "1px solid #2a3138" }}
    >
      <span
        className="block px-[11px] py-[5px] whitespace-nowrap"
        style={{ fontSize: "13px", color: "#e8e8e8", lineHeight: "19.5px" }}
      >
        {label}
      </span>
    </div>
  );
}

function FormatTag({ label }: { label: string }) {
  return (
    <div className="rounded-full shrink-0" style={{ backgroundColor: "#262c33" }}>
      <span
        className="block px-[8px] py-[2px] whitespace-nowrap"
        style={{ fontSize: "13px", color: "#8a8f98", lineHeight: "19.5px" }}
      >
        {label}
      </span>
    </div>
  );
}

interface CircleStatusButtonsProps {
  editionId: number;
  status: StatutValue | undefined;
  onChange: (editionId: number, status: StatutValue | null) => void;
}

function CircleStatusButtons({ editionId, status, onChange }: CircleStatusButtonsProps) {
  const handle = (value: StatutValue) => {
    const next = toggleStatutLocal(editionId, value);
    onChange(editionId, next);
    toast.success(
      next === null
        ? value === "possede" ? "Retiré de votre collection" : "Retiré de vos envies"
        : value === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies"
    );
  };

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
          ? <CheckCircle2 size={15} color="#fff" strokeWidth={2.2} />
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
        <Heart
          size={15}
          color={wishlistActive ? "#fff" : "#8a8f98"}
          fill={wishlistActive ? "#fff" : "none"}
          strokeWidth={2}
        />
      </button>
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [f, eds] = await Promise.all([getFilm(filmId), getEditionsForFilm(filmId)]);
        if (!cancelled) {
          setFilm(f);
          setEditions(eds);
          // Read statuts from localStorage (sync)
          setStatuts(getStatusForEditions(eds.map((e) => e.id)));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filmId]);

  const onStatusChange = (editionId: number, status: StatutValue | null) => {
    setStatuts((prev) => {
      const next = { ...prev };
      if (status === null) delete next[editionId];
      else next[editionId] = status;
      return next;
    });
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
    const current = statuts[editionId];
    if (current === value) {
      removeStatutLocal(editionId);
      onStatusChange(editionId, null);
      toast.success(value === "possede" ? "Retiré de votre collection" : "Retiré de vos envies");
    } else {
      setStatutLocal(editionId, value);
      onStatusChange(editionId, value);
      toast.success(value === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies");
    }
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
      <div className="relative w-full" style={{ minHeight: "520px" }}>
        {film.affiche_url && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={film.affiche_url}
              alt=""
              aria-hidden
              className="absolute w-full h-full object-cover pointer-events-none"
              style={{ filter: "blur(32px)", transform: "scale(1.15)", opacity: 0.4 }}
            />
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,24,28,0.5) 0%, rgba(20,24,28,0.85) 60%, #14181c 100%)",
          }}
        />

        <div className="relative mx-auto max-w-[1440px] px-8 lg:px-16 pb-10 pt-4 flex flex-col sm:flex-row gap-6 items-start">
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
              <span style={{ fontSize: "28px", fontWeight: 700, color: "#e8e8e8", lineHeight: "32.2px" }}>
                {film.titre}{" "}
              </span>
              {film.annee && (
                <span style={{ fontSize: "28px", fontWeight: 400, color: "#8a8f98", lineHeight: "32.2px" }}>
                  ({film.annee})
                </span>
              )}
            </div>

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
              {film.realisateur && durationFormatted && " · "}
              {durationFormatted}
            </p>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => <GenrePill key={g} label={g} />)}
              </div>
            )}

            {film.note != null && film.note !== "" && (
              <div className="flex items-center gap-[6px]">
                <Star size={18} color="#2e7dff" fill="#2e7dff" />
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#e8e8e8" }}>{film.note}</span>
                <span style={{ fontSize: "13px", color: "#8a8f98" }}>/ 5</span>
              </div>
            )}

            {film.synopsis && (
              <p className="max-w-[640px]" style={{ fontSize: "15px", color: "#e8e8e8", lineHeight: "24px" }}>
                {film.synopsis}
              </p>
            )}

            {castList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-[640px]">
                {castList.map((m) => (
                  <button
                    key={m.nom}
                    type="button"
                    onClick={() => setSelectedPerson(m.nom)}
                    className="rounded-full px-[10px] py-[4px] whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
                    style={{ fontSize: "13px", color: "#e8e8e8", backgroundColor: "#1f242a", border: "1px solid #2a3138", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2e7dff"; (e.currentTarget as HTMLElement).style.color = "#2e7dff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a3138"; (e.currentTarget as HTMLElement).style.color = "#e8e8e8"; }}
                  >
                    {m.nom}
                  </button>
                ))}
              </div>
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
                    <Plus size={16} color="#fff" strokeWidth={2} />
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
                          {active && <CheckCircle2 size={15} color="#2e7dff" strokeWidth={2.2} className="shrink-0" />}
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
                    <Heart size={16} color="#2e7dff" fill="none" strokeWidth={2} />
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
                          {active && <Heart size={15} color="#2e7dff" fill="#2e7dff" strokeWidth={2} className="shrink-0" />}
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
                              {fmtTags.map((tag) => <FormatTag key={tag} label={tag} />)}
                              {ed.region && <FormatTag label={ed.region} />}
                              {ed.pays && <FormatTag label={ed.pays} />}
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
                          onChange={onStatusChange}
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
          <div className="flex flex-col gap-0 max-w-[700px]">
            {([
              film.realisateur && { label: "Réalisateur", value: film.realisateur },
              scenaristes.length > 0 && { label: "Scénariste", value: scenaristes.join(", ") },
              castList.length > 0 && {
                label: "Cast principal",
                value: castList.map((m) => `${m.nom} (${m.role})`).join(", "),
              },
              film.annee && { label: "Année", value: String(film.annee) },
              film.duree && {
                label: "Durée",
                value: (() => {
                  const total = parseInt(String(film.duree), 10);
                  if (isNaN(total)) return String(film.duree);
                  const h = Math.floor(total / 60);
                  const min = total % 60;
                  return `${h}h ${String(min).padStart(2, "0")}min (${total} min)`;
                })(),
              },
              genres.length > 0 && { label: "Genres", value: genres.join(", ") },
            ] as const)
              .filter(Boolean)
              .map((row) => {
                const { label, value } = row as { label: string; value: string };
                return (
                  <div
                    key={label}
                    className="flex gap-4 items-start py-4"
                    style={{ borderBottom: "1px solid #2a3138" }}
                  >
                    <span className="shrink-0 w-[160px]" style={{ fontSize: "13px", color: "#8a8f98", lineHeight: "22px" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "15px", color: "#e8e8e8", lineHeight: "22px" }}>{value}</span>
                  </div>
                );
              })}
            {!film.realisateur && castList.length === 0 && !film.scenariste && genres.length === 0 && (
              <p style={{ fontSize: "14px", color: "#8a8f98" }}>Aucun détail disponible.</p>
            )}
          </div>
        )}

        {(activeTab === "Critiques" || activeTab === "Listes") && (
          <p style={{ fontSize: "14px", color: "#8a8f98" }}>Section bientôt disponible.</p>
        )}
      </div>

      {selectedPerson && (
        <PersonModal name={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
}
