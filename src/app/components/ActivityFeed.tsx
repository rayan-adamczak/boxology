import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import { Plus, Heart, UserPlus, Inbox } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { UserAvatar } from "./UserAvatar";
import { fetchActivityPage, type ActivityItem } from "../data";

const MAX_PAGES = 4;

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>(() => fetchActivityPage(0));
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (loading || page >= MAX_PAGES) return;
    setLoading(true);
    // Simulate a network fetch so the skeleton is visible.
    window.setTimeout(() => {
      const next = page + 1;
      setItems((prev) => [...prev, ...fetchActivityPage(next)]);
      setPage(next);
      setLoading(false);
    }, 900);
  }, [loading, page]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // Empty state (kept for reference — flip the initial state to [] to preview)
  if (items.length === 0) {
    return <FeedEmptyState />;
  }

  return (
    <section aria-labelledby="feed-heading" aria-busy={loading}>
      <h2 id="feed-heading" className="mb-3" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>
        Activity Feed
      </h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <ActivityCard item={item} />
          </li>
        ))}
      </ul>

      {/* Infinite-scroll skeletons */}
      {loading && (
        <div className="mt-2.5 flex flex-col gap-2.5" aria-hidden="true">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {page >= MAX_PAGES && !loading && (
        <p className="py-6 text-center" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          You're all caught up.
        </p>
      )}

      <div ref={sentinel} className="h-px w-full" aria-hidden="true" />
    </section>
  );
}

const VERB_ICON = {
  added: <Plus size={13} />,
  wishlisted: <Heart size={13} />,
  "started following": <UserPlus size={13} />,
} as const;

function ActivityCard({ item }: { item: ActivityItem }) {
  const isFollow = item.action === "started following";
  return (
    <article
      className="flex gap-3 rounded-[12px] p-3 transition"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--reel-surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--reel-border)")}
    >
      {!isFollow && item.cover && (
        <Link
          to="/movie/neon-requiem"
          aria-label={`${item.movie}, ${item.edition}. View title.`}
          className="group/cover relative block w-[64px] shrink-0 overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ aspectRatio: "2 / 3" }}
        >
          <ImageWithFallback
            src={item.cover}
            alt={`${item.movie} cover art`}
            className="h-full w-full object-cover transition duration-300 group-hover/cover:scale-[1.05]"
          />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <Link to="/u/steelbook.marcus" aria-label={`View ${item.user}'s profile`}>
            <UserAvatar name={item.user} size={24} />
          </Link>
          <p className="min-w-0" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            <Link to="/u/steelbook.marcus" className="hover:underline" style={{ fontWeight: 600, color: "var(--reel-text)" }}>
              {item.user}
            </Link>{" "}
            <span
              className="mx-0.5 inline-flex items-center gap-1 align-middle"
              style={{ color: "var(--reel-muted)" }}
            >
              {VERB_ICON[item.action]}
              {item.action}
            </span>
          </p>
        </div>

        {isFollow ? (
          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>
            <Link to="/u/steelbook.marcus" className="hover:underline">
              {item.targetUser}
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/movie/neon-requiem"
              className="hover:underline"
              style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}
            >
              {item.movie}
            </Link>
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

function SkeletonCard() {
  return (
    <div
      className="flex gap-3 rounded-[12px] p-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div className="w-[64px] shrink-0 animate-pulse rounded-[8px]" style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }} />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-3 w-1/3 animate-pulse rounded-full" style={{ backgroundColor: "var(--reel-surface-2)" }} />
        <div className="h-4 w-2/3 animate-pulse rounded-full" style={{ backgroundColor: "var(--reel-surface-2)" }} />
        <div className="h-3 w-16 animate-pulse rounded-full" style={{ backgroundColor: "var(--reel-surface-2)" }} />
      </div>
    </div>
  );
}

function FeedEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-[12px] px-6 py-16 text-center"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--reel-surface-2)" }}
      >
        <Inbox size={28} color="var(--reel-muted)" />
      </span>
      <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)", maxWidth: 320 }}>
        No activity yet — follow collectors or add your first title
      </p>
      <button
        type="button"
        className="rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}
      >
        Add your first title
      </button>
    </div>
  );
}
