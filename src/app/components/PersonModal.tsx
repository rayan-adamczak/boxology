import { useEffect, useState } from "react";
import { Link } from "react-router";
import { X, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { searchFilmsByPerson, type Film } from "../lib/reelio-db";

interface PersonModalProps {
  name: string;
  onClose: () => void;
}

export function PersonModal({ name, onClose }: PersonModalProps) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchFilmsByPerson(name)
      .then((rows) => { if (!cancelled) setFilms(rows); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [name]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[860px] max-h-[80vh] flex flex-col rounded-[16px] overflow-hidden"
        style={{ backgroundColor: "#1f242a", border: "1px solid #2a3138", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid #2a3138" }}
        >
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Filmographie
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#e8e8e8", marginTop: "2px" }}>
              {name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff]"
            style={{ backgroundColor: "#262c33" }}
          >
            <X size={16} color="#8a8f98" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center gap-2" style={{ color: "#8a8f98" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "14px" }}>Chargement…</span>
            </div>
          ) : error ? (
            <p style={{ fontSize: "14px", color: "#ff6b6b" }}>{error}</p>
          ) : films.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#8a8f98" }}>Aucun film trouvé pour cette personne.</p>
          ) : (
            <>
              <p className="mb-4" style={{ fontSize: "13px", color: "#8a8f98" }}>
                {films.length} film{films.length > 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {films.map((film) => (
                  <Link
                    key={film.id}
                    to={`/films/${film.id}`}
                    onClick={onClose}
                    className="group block outline-none focus-visible:ring-2 focus-visible:ring-[#2e7dff] rounded-[8px]"
                  >
                    <div
                      className="w-full overflow-hidden rounded-[8px]"
                      style={{ aspectRatio: "2 / 3", backgroundColor: "#14181c" }}
                    >
                      <ImageWithFallback
                        src={film.affiche_url ?? ""}
                        alt={`Affiche de ${film.titre}`}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-110"
                      />
                    </div>
                    <p
                      className="mt-2 line-clamp-2"
                      style={{ fontSize: "12px", fontWeight: 500, color: "#e8e8e8", lineHeight: "16px" }}
                    >
                      {film.titre}
                    </p>
                    {film.annee && (
                      <p style={{ fontSize: "11px", color: "#8a8f98", marginTop: "2px" }}>{film.annee}</p>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
