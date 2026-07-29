import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Star, ChevronDown, X, Plus, Heart, Check, ExternalLink, Bookmark, PenLine, ListPlus,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UserAvatar } from "../components/UserAvatar";
import {
  movieMaster as mockFilm, editions, reviews as seedReviews, curatedLists, FORMAT_OPTIONS,
  type Edition, type Review, type MovieMaster,
} from "../data";
import {
  fetchMovieFull, posterUrl, backdropUrl, formatRuntime,
  type TmdbMovieFull,
} from "../lib/tmdb";

type TabKey = "editions" | "details" | "reviews" | "lists";
type SortKey = "priceAsc" | "owned" | "newest";

const TABS: { key: TabKey; label: string }[] = [
  { key: "editions", label: "Editions" },
  { key: "details", label: "Details" },
  { key: "reviews", label: "Reviews" },
  { key: "lists", label: "Lists" },
];

const money = (n: number) => `$${n.toFixed(2)}`;

/* ---- Normalise TMDB data into the same shape as our mock ---- */
function tmdbToFilm(data: TmdbMovieFull): MovieMaster {
  const { movie, credits } = data;
  const director = credits.crew.find((c) => c.job === "Director")?.name ?? "Unknown";
  const cast = credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map((c) => ({ actor: c.name, role: c.character }));

  return {
    id: String(movie.id),
    title: movie.title,
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
    director,
    runtime: formatRuntime(movie.runtime),
    genres: movie.genres.map((g) => g.name),
    rating: Math.round((movie.vote_average / 2) * 10) / 10,
    ratingCount: movie.vote_count,
    own: 0,
    want: 0,
    cover: posterUrl(movie.poster_path, "w500"),
    backdrop: backdropUrl(movie.backdrop_path, "w1280"),
    synopsis: movie.overview,
    theatrical: movie.tagline || "",
    cast,
    specs: mockFilm.specs,
  };
}

/* ---- Hook: resolve film data (TMDB if numeric id, mock otherwise) ---- */
type LoadState = "idle" | "loading" | "done" | "error";

function useFilmData(id: string | undefined): { film: MovieMaster; state: LoadState } {
  const [tmdb, setTmdb] = useState<TmdbMovieFull | null>(null);
  const [state, setState] = useState<LoadState>("idle");

  const isNumeric = id !== undefined && /^\d+$/.test(id);

  useEffect(() => {
    if (!isNumeric) return;
    let cancelled = false;
    setState("loading");
    fetchMovieFull(Number(id))
      .then((data) => { if (!cancelled) { setTmdb(data); setState("done"); } })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [id, isNumeric]);

  const film = useMemo(
    () => (tmdb ? tmdbToFilm(tmdb) : mockFilm),
    [tmdb],
  );

  return { film, state: isNumeric ? state : "done" };
}

/* ================================================================
   Page component
   ================================================================ */

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { film, state } = useFilmData(id);
  const [tab, setTab] = useState<TabKey>("editions");
  const [drawerEdition, setDrawerEdition] = useState<Edition | null>(null);

  if (state === "loading") return <PageSkeleton />;
  if (state === "error") return <ErrorState id={id} />;

  return (
    <div className="pb-24 md:pb-10">
      <Hero film={film} />

      {/* Sticky tab navigation */}
      <div
        className="sticky top-[72px] z-30"
        style={{ backgroundColor: "var(--reel-bg)", borderBottom: "1px solid var(--reel-border)" }}
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className="relative shrink-0 px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                  style={{ fontSize: "15px", fontWeight: active ? 600 : 500, color: active ? "var(--reel-text)" : "var(--reel-muted)" }}
                >
                  {t.label}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: "var(--reel-accent)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 lg:px-16">
        {tab === "editions" && <EditionsTab onOpen={setDrawerEdition} />}
        {tab === "details" && <DetailsTab film={film} />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "lists" && <ListsTab />}
      </div>

      {drawerEdition && <EditionDrawer edition={drawerEdition} onClose={() => setDrawerEdition(null)} />}
    </div>
  );
}

/* ------------------------------ Loading / error states ------------------- */

function PageSkeleton() {
  return (
    <div className="pt-[72px] pb-24 animate-pulse">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10 lg:px-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="mx-auto w-[200px] md:mx-0 md:w-[280px] overflow-hidden rounded-[8px]"
            style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface)" }} />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-8 w-2/3 rounded-lg" style={{ backgroundColor: "var(--reel-surface)" }} />
            <div className="h-5 w-1/3 rounded-lg" style={{ backgroundColor: "var(--reel-surface)" }} />
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => <div key={i} className="h-7 w-20 rounded-full" style={{ backgroundColor: "var(--reel-surface)" }} />)}
            </div>
            <div className="h-24 w-full max-w-[640px] rounded-lg" style={{ backgroundColor: "var(--reel-surface)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ id }: { id?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-[72px]">
      <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--reel-text)" }}>Could not load movie</p>
      <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
        TMDB ID <code style={{ fontFamily: "monospace" }}>{id}</code> not found, or the API key is invalid.
      </p>
    </div>
  );
}

/* ------------------------------ Hero ------------------------------------- */

function Hero({ film }: { film: MovieMaster }) {
  return (
    <div className="relative pt-[72px]">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <ImageWithFallback
          src={film.backdrop || film.cover}
          alt=""
          className="h-full w-full object-cover"
          style={{ filter: "blur(28px)", transform: "scale(1.15)", opacity: 0.4 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(20,24,28,0.5) 0%, rgba(20,24,28,0.85) 60%, var(--reel-bg) 100%)" }} />
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10 lg:px-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Primary cover */}
          <div className="mx-auto w-[200px] shrink-0 md:mx-0 md:w-[280px]">
            <div className="overflow-hidden rounded-[8px] shadow-2xl" style={{ aspectRatio: "2 / 3", border: "1px solid var(--reel-border)" }}>
              <ImageWithFallback src={film.cover} alt={`${film.title} cover art`} className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Master info */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.15 }}>
                {film.title}{" "}
                {film.year > 0 && <span style={{ fontWeight: 400, color: "var(--reel-muted)" }}>({film.year})</span>}
              </h1>
              <p className="mt-1" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
                Directed by <span style={{ color: "var(--reel-text)" }}>{film.director}</span>
                {film.runtime && <> · {film.runtime}</>}
              </p>
            </div>

            {film.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {film.genres.map((g) => (
                  <span key={g} className="rounded-full px-2.5 py-1" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "13px" }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Rating + have/want counters */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5">
                <Star size={18} color="var(--reel-accent)" fill="var(--reel-accent)" />
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{film.rating.toFixed(1)}</span>
                <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>/ 5 · {film.ratingCount.toLocaleString()} ratings</span>
              </span>
              {film.own > 0 && (
                <span className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                  <Bookmark size={16} color="var(--reel-muted)" />
                  <span style={{ color: "var(--reel-text)", fontWeight: 600 }}>{film.own.toLocaleString()}</span> own this
                </span>
              )}
              {film.want > 0 && (
                <span className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                  <Heart size={16} color="var(--reel-muted)" />
                  <span style={{ color: "var(--reel-text)", fontWeight: 600 }}>{film.want.toLocaleString()}</span> want this
                </span>
              )}
            </div>

            {film.synopsis && (
              <p className="max-w-[640px]" style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: 1.6 }}>
                {film.synopsis}
              </p>
            )}

            {film.theatrical && (
              <p style={{ fontSize: "13px", color: "var(--reel-muted)", fontStyle: "italic" }}>
                {film.theatrical}
              </p>
            )}

            {/* Primary actions */}
            <div className="mt-1 flex flex-wrap gap-2.5">
              <SplitButton label="Add to Collection" filled />
              <SplitButton label="Add to Wishlist" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitButton({ label, filled = false }: { label: string; filled?: boolean }) {
  const [open, setOpen] = useState(false);
  const base = filled
    ? { backgroundColor: "var(--reel-accent)", color: "#ffffff", border: "1px solid var(--reel-accent)" }
    : { backgroundColor: "transparent", color: "var(--reel-accent)", border: "1px solid var(--reel-accent)" };
  return (
    <div className="relative flex">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-l-full py-2 pl-4 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ ...base, fontSize: "15px", fontWeight: 500 }}
      >
        {filled ? <Plus size={16} /> : <Heart size={16} />}
        {label}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label} — choose a specific edition`}
        className="flex items-center rounded-r-full border-l-0 px-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ ...base, borderLeftColor: filled ? "rgba(255,255,255,0.3)" : "var(--reel-accent)" }}
      >
        <ChevronDown size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-[10px] py-1 shadow-xl" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
            <p className="px-3 py-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Pick an edition</p>
            {editions.map((e) => (
              <button key={e.id} type="button" role="menuitem" onClick={() => setOpen(false)} className="block w-full truncate px-3 py-2 text-left outline-none transition hover:bg-[var(--reel-surface-2)]" style={{ fontSize: "13px", color: "var(--reel-text)" }}>
                {e.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------- Editions tab ------------------------------- */

function EditionsTab({ onOpen }: { onOpen: (e: Edition) => void }) {
  const [formats, setFormats] = useState<string[]>([]);
  const [region, setRegion] = useState("All");
  const [year, setYear] = useState("All");
  const [sort, setSort] = useState<SortKey>("priceAsc");

  const regions = useMemo(() => ["All", ...Array.from(new Set(editions.map((e) => e.region)))], []);
  const years = useMemo(() => ["All", ...Array.from(new Set(editions.map((e) => String(e.year)))).sort()], []);

  const toggleFormat = (f: string) =>
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const visible = useMemo(() => {
    let list = editions.filter((e) => {
      if (formats.length && !formats.includes(e.format)) return false;
      if (region !== "All" && e.region !== region) return false;
      if (year !== "All" && String(e.year) !== year) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "owned") return b.owners - a.owners;
      if (sort === "newest") return b.year - a.year;
      return a.price - b.price;
    });
    return list;
  }, [formats, region, year, sort]);

  return (
    <section aria-label="Editions">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter by format">
          {FORMAT_OPTIONS.map((f) => {
            const active = formats.includes(f);
            return (
              <button key={f} type="button" onClick={() => toggleFormat(f)} aria-pressed={active}
                className="shrink-0 rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={active
                  ? { backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent)", fontSize: "13px", fontWeight: 500 }
                  : { backgroundColor: "var(--reel-surface)", color: "var(--reel-muted)", border: "1px solid var(--reel-border)", fontSize: "13px" }}>
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown label="Region" value={region} onChange={setRegion} options={regions} />
          <Dropdown label="Year" value={year} onChange={setYear} options={years} />
          <div className="ml-auto">
            <Dropdown label="Sort" value={sort} onChange={(v) => setSort(v as SortKey)}
              options={[["priceAsc", "Price ascending"], ["owned", "Most owned"], ["newest", "Newest"]]} />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[12px] px-6 py-12 text-center" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
          <p style={{ fontSize: "15px", color: "var(--reel-muted)" }}>No editions match these filters.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((e) => <EditionCard key={e.id} edition={e} onOpen={() => onOpen(e)} />)}
        </ul>
      )}
    </section>
  );
}

function EditionCard({ edition, onOpen }: { edition: Edition; onOpen: () => void }) {
  const [owned, setOwned] = useState(false);
  const [wished, setWished] = useState(false);
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), onOpen())}
        className="group flex cursor-pointer items-center gap-3 rounded-[12px] p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
        aria-label={`${edition.name}. Open edition details.`}
      >
        <div className="w-[56px] shrink-0 overflow-hidden rounded-[8px]" style={{ aspectRatio: "2 / 3" }}>
          <ImageWithFallback src={edition.cover} alt={`${edition.name} packaging`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.06]" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate" style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{edition.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag>{edition.format}</Tag>
            <Tag>{edition.region}</Tag>
            <Tag>{edition.country}</Tag>
            <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{edition.year}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-baseline gap-1.5">
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{money(edition.price)}</span>
              <span className="inline-flex items-center gap-0.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                <ExternalLink size={11} /> {edition.source}
              </span>
              <span style={{ fontSize: "11px", color: "var(--reel-muted)" }}>· affiliate link</span>
            </span>
            <span className="flex items-center gap-1.5">
              <StackedAvatars names={edition.ownerNames} />
              <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{edition.owners} own this</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <ToggleIcon on={owned} onClick={() => setOwned((v) => !v)} label={owned ? "Owned" : "Add to collection"}>
            {owned ? <Check size={16} /> : <Plus size={16} />}
          </ToggleIcon>
          <ToggleIcon on={wished} onClick={() => setWished((v) => !v)} label={wished ? "On wishlist" : "Add to wishlist"}>
            <Heart size={16} fill={wished ? "#ffffff" : "none"} />
          </ToggleIcon>
        </div>
      </div>
    </li>
  );
}

/* --------------------------- Edition drawer ------------------------------ */

function EditionDrawer({ edition, onClose }: { edition: Edition; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${edition.name} details`}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,12,14,0.6)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[420px] max-w-[92vw] overflow-y-auto p-5" style={{ backgroundColor: "var(--reel-bg)", borderLeft: "1px solid var(--reel-border)" }}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)", lineHeight: 1.3 }}>{edition.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close edition details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none transition hover:bg-[var(--reel-surface)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]">
            <X size={20} color="var(--reel-muted)" />
          </button>
        </div>

        <div className="mx-auto mb-4 w-[180px] overflow-hidden rounded-[8px]" style={{ aspectRatio: "2 / 3", border: "1px solid var(--reel-border)" }}>
          <ImageWithFallback src={edition.cover} alt={`${edition.name} packaging`} className="h-full w-full object-cover" />
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <Tag>{edition.format}</Tag><Tag>{edition.region}</Tag><Tag>{edition.country}</Tag><Tag>{edition.year}</Tag>
        </div>

        <h3 className="mb-2" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>Price history · last 90 days</h3>
        <PriceChart data={edition.priceHistory} />

        <h3 className="mb-2 mt-5" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>Available listings</h3>
        <ul className="flex flex-col gap-2">
          {edition.listings.map((l, i) => (
            <li key={i} className="flex items-center gap-3 rounded-[10px] p-3" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{l.source}</p>
                <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{l.condition}</p>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{money(l.price)}</span>
              <a href="#" onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{ border: "1px solid var(--reel-accent)", color: "var(--reel-accent)", fontSize: "13px", fontWeight: 500 }}>
                <ExternalLink size={13} /> View price
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2" style={{ fontSize: "11px", color: "var(--reel-muted)" }}>
          Prices are set by third-party sellers. Links out are affiliate links; Jaquette may earn a commission.
        </p>

        <div className="mt-5 flex gap-2.5">
          <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}>
            <Plus size={16} /> Add to Collection
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            style={{ border: "1px solid var(--reel-accent)", color: "var(--reel-accent)", fontSize: "15px", fontWeight: 500 }}>
            <Heart size={16} /> Add to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceChart({ data }: { data: number[] }) {
  const w = 360, h = 90, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <div className="rounded-[10px] p-3" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Price ranged from ${money(min)} to ${money(max)} over the last 90 days`}>
        <polygon points={area} fill="var(--reel-accent-soft)" />
        <polyline points={line} fill="none" stroke="var(--reel-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between" style={{ fontSize: "11px", color: "var(--reel-muted)" }}>
        <span>Low {money(min)}</span>
        <span>High {money(max)}</span>
      </div>
    </div>
  );
}

/* ---------------------------- Details tab -------------------------------- */

function DetailsTab({ film }: { film: MovieMaster }) {
  return (
    <section aria-label="Details" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        {film.cast.length > 0 && (
          <div>
            <h2 className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Cast</h2>
            <ul className="flex flex-col gap-2">
              {film.cast.map((c) => (
                <li key={c.actor} className="flex items-center gap-3">
                  <UserAvatar name={c.actor} size={32} />
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{c.actor}</p>
                    <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{c.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-[12px] p-4" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
          <h2 className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Technical specs</h2>
          <SpecRow label="Aspect ratio" value={film.specs.aspectRatio} />
          <SpecRow label="HDR format" value={film.specs.hdr} />
          <SpecRow label="Audio" value={film.specs.audio.join(" · ")} />
          <SpecRow label="Subtitles" value={film.specs.subtitles.join(", ")} />
          <div className="mt-3">
            <p className="mb-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Special features</p>
            <ul className="flex list-disc flex-col gap-1 pl-5" style={{ fontSize: "15px", color: "var(--reel-text)" }}>
              {film.specs.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {film.synopsis && (
          <div>
            <h2 className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Synopsis</h2>
            <p style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: 1.7 }}>{film.synopsis}</p>
          </div>
        )}
        {film.theatrical && (
          <div>
            <h2 className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Original theatrical release</h2>
            <p style={{ fontSize: "15px", color: "var(--reel-muted)", lineHeight: 1.6 }}>{film.theatrical}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--reel-border)" }}>
      <span className="shrink-0" style={{ fontSize: "13px", color: "var(--reel-muted)", width: 100 }}>{label}</span>
      <span style={{ fontSize: "15px", color: "var(--reel-text)" }}>{value}</span>
    </div>
  );
}

/* ---------------------------- Reviews tab -------------------------------- */

function ReviewsTab() {
  const [list, setList] = useState<Review[]>(seedReviews);
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Reviews" className="max-w-[720px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Community reviews</h2>
        <button type="button" onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}>
          <PenLine size={16} /> Write a review
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {list.map((r) => (
          <li key={r.id}>
            <article className="rounded-[12px] p-4" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
              <div className="mb-2 flex items-center gap-2.5">
                <UserAvatar name={r.user} size={32} />
                <div className="flex-1">
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{r.user}</p>
                  <time style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{r.time}</time>
                </div>
                <Stars value={r.rating} />
              </div>
              <p style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: 1.6 }}>{r.body}</p>
            </article>
          </li>
        ))}
      </ul>

      {open && <ReviewModal onClose={() => setOpen(false)} onSubmit={(rating, body) => {
        setList((prev) => [{ id: `new-${Date.now()}`, user: "Ava Delgado", rating, time: "just now", body }, ...prev]);
        setOpen(false);
      }} />}
    </section>
  );
}

function ReviewModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (rating: number, body: string) => void }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  return (
    <ModalShell title="Write a review" onClose={onClose}>
      <div className="mb-4">
        <p className="mb-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}
              className="outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]">
              <Star size={26} color={n <= rating ? "var(--reel-accent)" : "var(--reel-muted)"} fill={n <= rating ? "var(--reel-accent)" : "none"} />
            </button>
          ))}
        </div>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Share your thoughts on this edition…"
        className="w-full resize-none rounded-[10px] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ backgroundColor: "var(--reel-surface-2)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "15px" }} />
      <div className="mt-4 flex justify-end gap-2.5">
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 outline-none" style={{ color: "var(--reel-muted)", fontSize: "15px", fontWeight: 500 }}>Cancel</button>
        <button type="button" disabled={!rating || !body.trim()} onClick={() => onSubmit(rating, body.trim())}
          className="rounded-full px-4 py-2 outline-none transition disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}>Post review</button>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- Lists tab --------------------------------- */

function ListsTab() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Lists">
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Featured in lists</h2>
        <button type="button" onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}>
          <ListPlus size={16} /> Add to a list
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {curatedLists.map((l) => (
          <div key={l.id} className="rounded-[12px] p-3 outline-none transition hover:border-[var(--reel-surface-2)]" style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}>
            <div className="mb-3 flex gap-1.5">
              {l.covers.map((c, i) => (
                <div key={i} className="w-1/3 overflow-hidden rounded-[6px]" style={{ aspectRatio: "2 / 3" }}>
                  <ImageWithFallback src={c} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{l.title}</p>
            <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>by @{l.curator} · {l.count} films</p>
          </div>
        ))}
      </div>

      {open && <AddToListModal onClose={() => setOpen(false)} />}
    </section>
  );
}

function AddToListModal({ onClose }: { onClose: () => void }) {
  const [newName, setNewName] = useState("");
  const myLists = ["Watchlist Steelbooks", "4K Upgrades", "To Trade"];
  return (
    <ModalShell title="Add to a list" onClose={onClose}>
      <p className="mb-2" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Select a list</p>
      <ul className="mb-4 flex flex-col gap-1.5">
        {myLists.map((n) => (
          <li key={n}>
            <button type="button" onClick={onClose} className="flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left outline-none transition hover:bg-[var(--reel-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{ backgroundColor: "var(--reel-surface-2)", fontSize: "15px", color: "var(--reel-text)" }}>
              {n}<Plus size={16} color="var(--reel-muted)" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mb-2" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Or create a new list</p>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New list name"
          className="flex-1 rounded-[10px] px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-surface-2)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "15px" }} />
        <button type="button" disabled={!newName.trim()} onClick={onClose}
          className="rounded-full px-4 outline-none transition disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}>Create</button>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- Shared bits ------------------------------- */

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,12,14,0.65)" }} onClick={onClose} />
      <div className="relative w-full max-w-[480px] rounded-[14px] p-5 shadow-2xl" style={{ backgroundColor: "var(--reel-bg)", border: "1px solid var(--reel-border)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition hover:bg-[var(--reel-surface)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]">
            <X size={20} color="var(--reel-muted)" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "13px" }}>
      {children}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={15} color="var(--reel-accent)" fill={n <= value ? "var(--reel-accent)" : "none"} />
      ))}
    </span>
  );
}

function StackedAvatars({ names }: { names: string[] }) {
  return (
    <span className="flex items-center" aria-hidden="true">
      {names.slice(0, 3).map((n, i) => (
        <span key={n} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: "9999px", boxShadow: "0 0 0 2px var(--reel-surface)" }}>
          <UserAvatar name={n} size={20} />
        </span>
      ))}
    </span>
  );
}

function ToggleIcon({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label} title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={on
        ? { backgroundColor: "var(--reel-accent)", color: "#ffffff" }
        : { backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)" }}>
      {children}
    </button>
  );
}

function Dropdown({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: (string | [string, string])[];
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
        className="appearance-none rounded-full py-1.5 pl-3.5 pr-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "13px" }}>
        {options.map((o) => {
          const [val, lbl] = Array.isArray(o) ? o : [o, o];
          return <option key={val} value={val}>{label}: {lbl}</option>;
        })}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5" color="var(--reel-muted)" />
    </label>
  );
}
