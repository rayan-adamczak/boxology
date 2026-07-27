import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  LayoutGrid, List as ListIcon, X, Plus, ChevronDown, ExternalLink, TrendingDown, Bell, Search, Heart,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PriorityStars } from "../components/PriorityStars";
import { wishlistItems as seed, type WishlistItem, type EditionType } from "../data";

type ViewMode = "grid" | "list";
type SortKey = "added" | "priceAsc" | "priceDesc" | "priority";
type EditionFilter = "All" | EditionType;

const EDITION_FILTERS: EditionFilter[] = ["All", "4K UHD", "Blu-ray", "Steelbook", "Box Set"];
const VIEW_PREF_KEY = "reelio.wishlist.view";

const money = (n: number) => `$${n.toFixed(2)}`;
const discountPct = (i: WishlistItem) =>
  i.price < i.addedPrice ? Math.round((1 - i.price / i.addedPrice) * 100) : 0;

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(seed);
  const [view, setView] = useState<ViewMode>("grid");
  const [isPublic, setIsPublic] = useState(false);
  const [sort, setSort] = useState<SortKey>("added");
  const [edition, setEdition] = useState<EditionFilter>("All");
  const [onlyDrops, setOnlyDrops] = useState(false);

  // Persist the grid/list preference.
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_PREF_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);
  const changeView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_PREF_KEY, v);
  };

  const visible = useMemo(() => {
    let list = edition === "All" ? items : items.filter((i) => i.editionType === edition);
    if (onlyDrops) list = list.filter((i) => discountPct(i) > 0);
    list = [...list].sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "priority") return b.priority - a.priority;
      return b.addedTs - a.addedTs;
    });
    return list;
  }, [items, edition, onlyDrops, sort]);

  const totalCost = items.reduce((s, i) => s + i.price, 0);
  const dropsCount = items.filter((i) => discountPct(i) > 0).length;

  const setPriority = (id: string, p: 1 | 2 | 3) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, priority: p } : i)));

  const removeItem = (id: string) => {
    const it = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (it) toast(`Removed "${it.movie}" from wishlist`);
  };

  const moveToCollection = (id: string) => {
    const it = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (it) toast.success(`Moved "${it.movie}" to your collection`);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-[88px] md:px-8 md:pb-10 lg:px-16">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>My Wishlist</h1>
            <span
              className="rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: "var(--reel-surface)", color: "var(--reel-muted)", fontSize: "13px" }}
            >
              {items.length} items
            </span>

            <div className="ml-auto flex items-center gap-3">
              {/* Make public toggle */}
              <ToggleSwitch
                checked={isPublic}
                onChange={setIsPublic}
                label="Make public"
                ariaLabel="Make wishlist public"
              />
              {/* View toggle */}
              <div
                className="flex items-center rounded-full p-0.5"
                style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
                role="group"
                aria-label="View mode"
              >
                <ViewButton active={view === "grid"} onClick={() => changeView("grid")} label="Grid view">
                  <LayoutGrid size={16} />
                </ViewButton>
                <ViewButton active={view === "list"} onClick={() => changeView("list")} label="List view">
                  <ListIcon size={16} />
                </ViewButton>
              </div>
            </div>
          </div>

          {/* Summary banner — tablet/mobile only */}
          <div className="mt-4 lg:hidden">
            <SummaryContent totalCost={totalCost} dropsCount={dropsCount} compact />
          </div>

          {/* Filter / sort bar */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="relative flex items-center">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort by"
                className="appearance-none rounded-full py-1.5 pl-3.5 pr-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)", color: "var(--reel-text)", fontSize: "13px" }}
              >
                <option value="added">Sort by: Date added</option>
                <option value="priceAsc">Sort by: Price (low → high)</option>
                <option value="priceDesc">Sort by: Price (high → low)</option>
                <option value="priority">Sort by: Priority</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5" color="var(--reel-muted)" />
            </label>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by edition format">
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

            <div className="ml-auto">
              <ToggleSwitch
                checked={onlyDrops}
                onChange={setOnlyDrops}
                label="Only show price drops"
                ariaLabel="Only show items on a price drop"
                icon={<TrendingDown size={14} />}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mt-5">
            {visible.length === 0 ? (
              items.length === 0 ? (
                <EmptyState />
              ) : (
                <NoMatches />
              )
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visible.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    onPriority={(p) => setPriority(item.id, p)}
                    onMove={() => moveToCollection(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((item) => (
                  <WishlistRow
                    key={item.id}
                    item={item}
                    onPriority={(p) => setPriority(item.id, p)}
                    onMove={() => moveToCollection(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Summary sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky top-[88px]">
            <SummaryContent totalCost={totalCost} dropsCount={dropsCount} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function WishlistCard({
  item, onPriority, onMove, onRemove,
}: {
  item: WishlistItem;
  onPriority: (p: 1 | 2 | 3) => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const pct = discountPct(item);
  return (
    <div
      className="group flex flex-col gap-2 rounded-[10px] p-2"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div className="relative overflow-hidden rounded-[8px]" style={{ aspectRatio: "2 / 3" }}>
        <Link to="/movie/neon-requiem" aria-label={`${item.movie}. View title.`} className="absolute inset-0 z-0 block">
          <ImageWithFallback src={item.cover} alt={`${item.movie} cover art`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        </Link>
        {pct > 0 && (
          <span
            className="absolute left-1.5 top-1.5 z-10 rounded-full px-2 py-0.5"
            style={{ backgroundColor: "var(--reel-accent-soft)", color: "var(--reel-accent)", fontSize: "13px", fontWeight: 600, backdropFilter: "blur(4px)" }}
          >
            −{pct}%
          </span>
        )}
        {/* Hover actions */}
        <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <IconAction label={`Remove ${item.movie} from wishlist`} onClick={onRemove}>
            <X size={15} />
          </IconAction>
        </div>
        <div className="absolute inset-x-1.5 bottom-1.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onMove}
            className="flex w-full items-center justify-center gap-1 rounded-[8px] py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "13px", fontWeight: 500 }}
          >
            <Plus size={14} /> Move to Collection
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="truncate" style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{item.movie}</p>
        <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{item.edition}</p>
        <PriceLine item={item} />
        <div className="mt-0.5 flex items-center justify-between">
          <PriorityStars value={item.priority} onChange={onPriority} />
        </div>
      </div>
    </div>
  );
}

function WishlistRow({
  item, onPriority, onMove, onRemove,
}: {
  item: WishlistItem;
  onPriority: (p: 1 | 2 | 3) => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const pct = discountPct(item);
  return (
    <li
      className="flex items-center gap-3 rounded-[10px] p-2.5"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div className="relative w-[44px] shrink-0 overflow-hidden rounded-[6px]" style={{ aspectRatio: "2 / 3" }}>
        <ImageWithFallback src={item.cover} alt={`${item.movie} cover art`} className="h-full w-full object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate" style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>{item.movie}</p>
        <span
          className="mt-0.5 w-fit rounded-full px-2 py-0.5"
          style={{ backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "13px" }}
        >
          {item.edition}
        </span>
      </div>

      <div className="hidden shrink-0 flex-col items-end sm:flex" style={{ minWidth: 130 }}>
        <PriceLine item={item} align="right" />
        {pct > 0 && (
          <span style={{ color: "var(--reel-accent)", fontSize: "13px", fontWeight: 600 }}>−{pct}%</span>
        )}
      </div>

      <div className="hidden shrink-0 md:block">
        <PriorityStars value={item.priority} onChange={onPriority} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onMove}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "13px", fontWeight: 500 }}
        >
          <Plus size={14} /> <span className="hidden sm:inline">Move</span>
        </button>
        <IconAction label={`Remove ${item.movie} from wishlist`} onClick={onRemove} bordered>
          <X size={15} />
        </IconAction>
      </div>
    </li>
  );
}

function PriceLine({ item, align = "left" }: { item: WishlistItem; align?: "left" | "right" }) {
  const dropped = item.price < item.addedPrice;
  return (
    <div className={`flex items-baseline gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{money(item.price)}</span>
      {dropped && (
        <span style={{ fontSize: "13px", color: "var(--reel-muted)", textDecoration: "line-through" }}>
          {money(item.addedPrice)}
        </span>
      )}
      <span className="inline-flex items-center gap-0.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <ExternalLink size={11} /> {item.source}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SummaryContent({
  totalCost, dropsCount, compact = false,
}: {
  totalCost: number;
  dropsCount: number;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-[12px] p-4"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <h2 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
        Wishlist summary
      </h2>
      <div className={compact ? "flex flex-wrap gap-6" : "flex flex-col gap-4"}>
        <div>
          <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.1 }}>{money(totalCost)}</p>
          <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Est. cost to complete</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5" style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-accent)", lineHeight: 1.1 }}>
            <TrendingDown size={20} /> {dropsCount}
          </p>
          <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>Currently on a price drop</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex items-start gap-2 rounded-[8px] p-3" style={{ backgroundColor: "var(--reel-surface-2)" }}>
          <Bell size={16} color="var(--reel-accent)" className="mt-0.5 shrink-0" />
          <p style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: 1.5 }}>
            <span style={{ color: "var(--reel-text)", fontWeight: 500 }}>Set price alert.</span> Get notified when
            any wishlist title drops below your target price across tracked marketplaces.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-[12px] px-6 py-16 text-center"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--reel-surface-2)" }}>
        <Heart size={28} color="var(--reel-muted)" />
      </span>
      <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)", maxWidth: 340 }}>
        Your wishlist is empty — browse recent releases or search for a title
      </p>
      <Link
        to="/"
        className="flex items-center gap-1.5 rounded-full px-4 py-2 outline-none transition focus-visible:ring-2"
        style={{ backgroundColor: "var(--reel-accent)", color: "#ffffff", fontSize: "15px", fontWeight: 500 }}
      >
        <Search size={16} /> Browse titles
      </Link>
    </div>
  );
}

function NoMatches() {
  return (
    <div
      className="rounded-[12px] px-6 py-12 text-center"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <p style={{ fontSize: "15px", color: "var(--reel-muted)" }}>No wishlist items match these filters.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
        color: active ? "var(--reel-accent)" : "var(--reel-muted)",
      }}
    >
      {children}
    </button>
  );
}

function IconAction({ label, onClick, children, bordered = false }: { label: string; onClick: () => void; children: React.ReactNode; bordered?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: bordered ? "transparent" : "rgba(10,12,14,0.75)",
        border: bordered ? "1px solid var(--reel-border)" : "none",
        color: "var(--reel-text)",
        backdropFilter: bordered ? undefined : "blur(4px)",
      }}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  checked, onChange, label, ariaLabel, icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  ariaLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <span className="inline-flex items-center gap-1" style={{ fontSize: "13px", color: checked ? "var(--reel-accent)" : "var(--reel-muted)" }}>
        {icon}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ backgroundColor: checked ? "var(--reel-accent)" : "var(--reel-surface-2)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </label>
  );
}
