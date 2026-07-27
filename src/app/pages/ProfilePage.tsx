import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MessageSquare, Check, MapPin, CalendarDays, Star, Layers, ChevronDown } from "lucide-react";
import { MovieCover } from "../components/MovieCover";
import { UserAvatar } from "../components/UserAvatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  profile as baseProfile,
  fetchCollectionPage,
  fetchProfileActivity,
  type CollectionItem,
  type EditionType,
  type ActivityItem,
} from "../data";

type TabKey = "collection" | "wishlist" | "activity" | "about";
type SortKey = "added" | "title" | "value";
type EditionFilter = "All" | EditionType;

const TABS: { key: TabKey; label: string }[] = [
  { key: "collection", label: "Collection" },
  { key: "wishlist", label: "Wishlist" },
  { key: "activity", label: "Activity" },
  { key: "about", label: "About" },
];

const EDITION_FILTERS: EditionFilter[] = ["All", "4K UHD", "Blu-ray", "Steelbook", "Box Set"];

export function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("collection");
  const [following, setFollowing] = useState(baseProfile.isFollowing);

  return (
    <div className="pb-24 pt-[72px] md:pb-10">
      {/* ---- Banner + header ---- */}
      <ProfileHeader following={following} onToggleFollow={() => setFollowing((v) => !v)} />

      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
        {/* ---- Stats row ---- */}
        <StatsRow onJump={(t) => setTab(t)} />

        {/* ---- Tab nav ---- */}
        <div
          className="mt-6 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Profile sections"
          style={{ borderBottom: "1px solid var(--reel-border)" }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className="relative shrink-0 px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{
                  fontSize: "15px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--reel-text)" : "var(--reel-muted)",
                }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--reel-accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ---- Tab panels ---- */}
        <div className="mt-6">
          {tab === "collection" && <CollectionTab />}
          {tab === "wishlist" && <CollectionTab wishlist />}
          {tab === "activity" && <ActivityTab />}
          {tab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ProfileHeader({ following, onToggleFollow }: { following: boolean; onToggleFollow: () => void }) {
  return (
    <div className="relative">
      {/* Banner */}
      <div
        className="w-full"
        style={{
          height: 220,
          background:
            "linear-gradient(135deg, #1a2740 0%, #14181c 55%, #241a2e 100%)",
        }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(46,125,255,0.25), transparent 45%), radial-gradient(circle at 80% 60%, rgba(120,60,200,0.18), transparent 40%)",
          }}
        />
      </div>

      {/* Header content overlapping banner */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" style={{ marginTop: -48 }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <span
              className="shrink-0 rounded-full"
              style={{ padding: 4, backgroundColor: "var(--reel-bg)", width: "fit-content" }}
            >
              <UserAvatar name={baseProfile.avatarName} size={96} />
            </span>
            <div className="pb-1">
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.2 }}>
                {baseProfile.name}
              </h1>
              <p style={{ fontSize: "15px", color: "var(--reel-muted)" }}>@{baseProfile.handle}</p>
              {baseProfile.bio && (
                <p className="mt-2 max-w-[560px]" style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: 1.5 }}>
                  {baseProfile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <button
              type="button"
              onClick={onToggleFollow}
              aria-pressed={following}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={
                following
                  ? { backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "15px", fontWeight: 500 }
                  : { backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }
              }
            >
              {following ? (
                <>
                  <Check size={16} /> Following
                </>
              ) : (
                "Follow"
              )}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 outline-none transition hover:bg-[var(--reel-surface)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{ border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "15px", fontWeight: 500 }}
            >
              <MessageSquare size={16} /> Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ onJump }: { onJump: (tab: TabKey) => void }) {
  const stats: { label: string; value: number; tab: TabKey }[] = [
    { label: "Owned films", value: baseProfile.owned, tab: "collection" },
    { label: "Wishlist items", value: baseProfile.wishlist, tab: "wishlist" },
    { label: "Followers", value: baseProfile.followers, tab: "about" },
    { label: "Following", value: baseProfile.following, tab: "about" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {stats.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onJump(s.tab)}
          className="rounded-[10px] p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--reel-surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--reel-border)")}
        >
          <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.1 }}>
            {s.value.toLocaleString()}
          </p>
          <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{s.label}</p>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CollectionTab({ wishlist = false }: { wishlist?: boolean }) {
  const [sort, setSort] = useState<SortKey>("added");
  const [edition, setEdition] = useState<EditionFilter>("All");
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const raw = useMemo(() => {
    const all: CollectionItem[] = [];
    for (let p = 0; p < pages; p++) all.push(...fetchCollectionPage(p));
    // Wishlist shows a smaller distinct slice.
    return wishlist ? all.slice(0, 12).map((i) => ({ ...i, copies: 1 })) : all;
  }, [pages, wishlist]);

  const items = useMemo(() => {
    let list = edition === "All" ? raw : raw.filter((i) => i.editionType === edition);
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.movie.localeCompare(b.movie);
      if (sort === "value") return b.value - a.value;
      return b.addedTs - a.addedTs;
    });
    return list;
  }, [raw, edition, sort]);

  const loadMore = useCallback(() => {
    if (wishlist || loading || pages >= 5) return;
    setLoading(true);
    window.setTimeout(() => {
      setPages((p) => p + 1);
      setLoading(false);
    }, 700);
  }, [wishlist, loading, pages]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <section aria-label={wishlist ? "Wishlist" : "Collection"}>
      {/* Filter / sort bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex items-center">
          <span className="sr-only">Sort by</span>
          <Layers size={14} className="pointer-events-none absolute left-2.5" color="var(--reel-muted)" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort by"
            className="appearance-none rounded-full py-1.5 pl-8 pr-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
              fontSize: "13px",
            }}
          >
            <option value="added">Sort by: Date added</option>
            <option value="title">Sort by: Title</option>
            <option value="value">Sort by: Value</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5" color="var(--reel-muted)" />
        </label>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by edition type">
          {EDITION_FILTERS.map((f) => {
            const active = edition === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setEdition(f)}
                aria-pressed={active}
                className="rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={
                  active
                    ? { backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent)", fontSize: "13px", fontWeight: 500 }
                    : { backgroundColor: "var(--reel-surface)", color: "var(--reel-muted)", border: "1px solid var(--reel-border)", fontSize: "13px" }
                }
              >
                {f}
              </button>
            );
          })}
        </div>

        <span className="ml-auto" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {items.length} titles
        </span>
      </div>

      {/* Grid: 2 cols mobile · 4 tablet · 6 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <MovieCover
              cover={item.cover}
              title={item.movie}
              edition={item.edition}
              to="/movie/neon-requiem"
              actionLabel={`${item.movie}, ${item.edition}. View title.`}
            />
            {item.copies > 1 && (
              <span
                className="pointer-events-none absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5"
                style={{
                  backgroundColor: "rgba(10,12,14,0.8)",
                  color: "var(--reel-text)",
                  fontSize: "11px",
                  fontWeight: 600,
                  backdropFilter: "blur(4px)",
                }}
                title={`${item.copies} copies owned`}
              >
                ×{item.copies}
              </span>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[8px]"
              style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
            />
          ))}
        </div>
      )}

      <div ref={sentinel} className="h-px w-full" aria-hidden="true" />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ActivityTab() {
  const items = fetchProfileActivity();
  return (
    <section aria-label={`${baseProfile.name}'s activity`}>
      <ul className="flex max-w-[640px] flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <ProfileActivityCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileActivityCard({ item }: { item: ActivityItem }) {
  const isFollow = item.action === "started following";
  return (
    <article
      className="flex gap-3 rounded-[12px] p-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      {!isFollow && item.cover && (
        <div className="w-[64px] shrink-0 overflow-hidden rounded-[8px]" style={{ aspectRatio: "2 / 3" }}>
          <ImageWithFallback src={item.cover} alt={`${item.movie} cover art`} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--reel-text)" }}>{item.user}</span> {item.action}
        </p>
        {isFollow ? (
          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{item.targetUser}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{item.movie}</span>
            <span
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "13px" }}
            >
              {item.edition}
            </span>
          </div>
        )}
        <time style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{item.time}</time>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

function AboutTab() {
  return (
    <section aria-label="About" className="flex max-w-[720px] flex-col gap-6">
      <div
        className="rounded-[12px] p-4"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      >
        <div className="flex flex-col gap-2.5">
          <InfoRow icon={<CalendarDays size={16} />} label="Joined" value={baseProfile.joined} />
          {baseProfile.location && (
            <InfoRow icon={<MapPin size={16} />} label="Location" value={baseProfile.location} />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>
          Favorite genres
        </h2>
        <div className="flex flex-wrap gap-2">
          {baseProfile.favoriteGenres.map((g) => (
            <span
              key={g}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "13px" }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Star size={18} color="var(--reel-accent)" />
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Top 5 collection highlights</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {baseProfile.highlights.map((cover, i) => (
            <MovieCover key={i} cover={cover} title={`Highlight ${i + 1}`} showOverlay={false} to="/movie/neon-requiem" actionLabel="View highlighted title" />
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--reel-muted)" }}>{icon}</span>
      <span style={{ fontSize: "13px", color: "var(--reel-muted)", width: 80 }}>{label}</span>
      <span style={{ fontSize: "15px", color: "var(--reel-text)" }}>{value}</span>
    </div>
  );
}
