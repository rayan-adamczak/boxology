import { Link } from "react-router";
import { TrendingDown, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { priceDrops, type PriceDrop } from "../data";

export function PriceDrops() {
  return (
    <section aria-labelledby="price-drops-heading">
      <div className="mb-3 flex items-center gap-2">
        <TrendingDown size={18} color="var(--reel-accent)" />
        <h2 id="price-drops-heading" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>
          Price Drops
        </h2>
        <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>on titles you follow</span>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {priceDrops.map((drop) => (
          <PriceDropCard key={drop.id} drop={drop} />
        ))}
      </div>
    </section>
  );
}

function PriceDropCard({ drop }: { drop: PriceDrop }) {
  return (
    <Link
      to="/movie/neon-requiem"
      aria-label={`${drop.movie}, ${drop.edition}, now ${drop.price}, ${drop.discount}% off on ${drop.source}. View product details.`}
      className="group flex w-[150px] shrink-0 snap-start flex-col gap-2 rounded-[10px] p-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--reel-surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--reel-surface)")}
    >
      <div className="relative overflow-hidden rounded-[8px]" style={{ aspectRatio: "2 / 3" }}>
        <ImageWithFallback
          src={drop.cover}
          alt={`${drop.movie} cover art`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <span
          className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5"
          style={{
            backgroundColor: "var(--reel-accent-soft)",
            color: "var(--reel-accent)",
            fontSize: "13px",
            fontWeight: 600,
            backdropFilter: "blur(4px)",
          }}
        >
          −{drop.discount}%
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="truncate" style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}>
          {drop.movie}
        </p>
        <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {drop.edition}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>{drop.price}</span>
          <span style={{ fontSize: "13px", color: "var(--reel-muted)", textDecoration: "line-through" }}>
            {drop.wasPrice}
          </span>
        </div>
        <span
          className="mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5"
          style={{ backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "13px" }}
        >
          <ExternalLink size={12} />
          View price · {drop.source}
        </span>
      </div>
    </Link>
  );
}
