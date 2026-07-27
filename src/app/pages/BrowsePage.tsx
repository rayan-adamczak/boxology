import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, Loader2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { searchFilms, type Film } from "../lib/reelio-db";

export function BrowsePage() {
  const [query, setQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced live search of the films table by title.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const results = await searchFilms(query);
        if (!cancelled) setFilms(results);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-[88px] md:px-8 md:pb-8 lg:px-16">
      <header className="mb-6">
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--reel-text)" }}>Parcourir les films</h1>
        <p className="mt-1" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          Recherchez dans votre catalogue par titre.
        </p>
      </header>

      {/* Search bar */}
      <label className="relative mb-8 block w-full max-w-[560px]">
        <span className="sr-only">Rechercher un film par titre</span>
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          color="var(--reel-muted)"
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un film…"
          className="w-full rounded-full py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[var(--reel-accent)]"
          style={{
            backgroundColor: "var(--reel-surface)",
            border: "1px solid var(--reel-border)",
            color: "var(--reel-text)",
            fontSize: "15px",
          }}
        />
      </label>

      {error && (
        <p className="mb-6" style={{ fontSize: "14px", color: "#ff6b6b" }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: "var(--reel-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Chargement…</span>
        </div>
      ) : films.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>Aucun film trouvé.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {films.map((film) => (
            <Link
              key={film.id}
              to={`/films/${film.id}`}
              className="group block outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] rounded-[8px]"
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
      )}
    </div>
  );
}
