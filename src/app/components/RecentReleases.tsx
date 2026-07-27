import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { MovieCover } from "./MovieCover";
import { releases } from "../data";

export function RecentReleases() {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, scroll: 0, moved: false });
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const scrollBy = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  };

  // Pointer-based drag-to-scroll (desktop). Touch devices swipe natively.
  const onPointerDown = (e: React.PointerEvent) => {
    const el = railRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, scroll: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = railRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scroll - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
  };

  return (
    <section
      aria-labelledby="recent-releases-heading"
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} color="var(--reel-accent)" />
        <h2 id="recent-releases-heading" style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>
          Recent Releases
        </h2>
        <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>new to the database</span>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto pb-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ cursor: drag.current.down ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {releases.map((r) => (
            <div key={r.id} className="w-[120px] shrink-0">
              <MovieCover
                cover={r.cover}
                title={r.movie}
                edition={r.edition}
                actionLabel={`${r.movie}, ${r.edition}. View title in database.`}
                onClick={() => {
                  // suppress click that ended a drag gesture
                  if (drag.current.moved) return;
                  navigate("/movie/neon-requiem");
                }}
              />
            </div>
          ))}
        </div>

        {/* Hover arrow controls — desktop only */}
        <RailArrow side="left" visible={hovered} onClick={() => scrollBy(-1)} />
        <RailArrow side="right" visible={hovered} onClick={() => scrollBy(1)} />
      </div>
    </section>
  );
}

function RailArrow({ side, visible, onClick }: { side: "left" | "right"; visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll releases left" : "Scroll releases right"}
      className={`absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-200 md:flex ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        [side]: -6,
        backgroundColor: "var(--reel-surface-2)",
        border: "1px solid var(--reel-border)",
        color: "var(--reel-text)",
      } as React.CSSProperties}
    >
      {side === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
