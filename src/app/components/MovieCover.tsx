import { useNavigate } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MovieCoverProps {
  cover: string;
  title: string;
  edition?: string;
  /** show the title/edition overlay on hover */
  showOverlay?: boolean;
  className?: string;
  /** describes where a click leads, for the aria-label */
  actionLabel?: string;
  /** route to navigate to on click (e.g. a movie detail page) */
  to?: string;
  onClick?: () => void;
}

/**
 * A movie cover always rendered in a 2:3 vertical ratio with 8px rounded corners.
 * On hover it lifts subtly (scale + brightness) and, when enabled, fades in a
 * gradient overlay carrying the title and edition.
 */
export function MovieCover({
  cover,
  title,
  edition,
  showOverlay = true,
  className = "",
  actionLabel,
  to,
  onClick,
}: MovieCoverProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    onClick?.();
    if (to) navigate(to);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={actionLabel ?? `${title}${edition ? ` — ${edition}` : ""}`}
      className={`group/cover relative block w-full overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] ${className}`}
      style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
    >
      <ImageWithFallback
        src={cover}
        alt={`${title} cover art`}
        className="h-full w-full object-cover transition duration-300 ease-out group-hover/cover:scale-[1.04] group-hover/cover:brightness-110"
      />
      {showOverlay && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-2 opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100"
          style={{
            background:
              "linear-gradient(to top, rgba(10,12,14,0.92) 0%, rgba(10,12,14,0.55) 55%, rgba(10,12,14,0) 100%)",
          }}
        >
          <span
            className="line-clamp-2 text-left"
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--reel-text)" }}
          >
            {title}
          </span>
          {edition && (
            <span
              className="text-left"
              style={{ fontSize: "11px", color: "var(--reel-muted)" }}
            >
              {edition}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
