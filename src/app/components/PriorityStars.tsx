import { Star } from "lucide-react";

interface PriorityStarsProps {
  value: 1 | 2 | 3;
  onChange: (value: 1 | 2 | 3) => void;
  size?: number;
}

const LABELS = ["Low", "Medium", "High"];

/** Three tappable stars that set acquisition priority instantly (no save step). */
export function PriorityStars({ value, onChange, size = 15 }: PriorityStarsProps) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Priority">
      {[1, 2, 3].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${LABELS[n - 1]} priority`}
            title={`${LABELS[n - 1]} priority`}
            onClick={() => onChange(n as 1 | 2 | 3)}
            className="rounded outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          >
            <Star
              size={size}
              color={filled ? "var(--reel-accent)" : "var(--reel-muted)"}
              fill={filled ? "var(--reel-accent)" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
