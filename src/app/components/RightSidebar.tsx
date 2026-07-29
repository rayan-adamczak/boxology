import { useState } from "react";
import { Link } from "react-router";
import { Users, Check } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { collectors as initial, type Collector } from "../data";

export function RightSidebar() {
  const [list, setList] = useState<Collector[]>(initial);

  const toggle = (id: string) =>
    setList((prev) => prev.map((c) => (c.id === id ? { ...c, following: !c.following } : c)));

  return (
    <aside aria-labelledby="collectors-heading">
      <div
        className="rounded-[12px] p-4"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} color="var(--reel-muted)" />
          <h2 id="collectors-heading" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
            Collectors to follow
          </h2>
        </div>

        <ul className="flex flex-col gap-3">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5">
              <Link to="/u/steelbook.marcus" aria-label={`View ${c.name}'s profile`}>
                <UserAvatar name={c.name} size={36} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/u/steelbook.marcus"
                  className="block truncate hover:underline"
                  style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}
                >
                  {c.name}
                </Link>
                <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                  {c.shared} shared titles
                </p>
              </div>
              <FollowButton following={c.following} onClick={() => toggle(c.id)} name={c.name} />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 px-1" style={{ fontSize: "11px", color: "var(--reel-muted)", lineHeight: 1.5 }}>
        Price links may be affiliate links. Jaquette may earn a commission on purchases made through
        marketplaces. Prices are indicative and set by third-party sellers.
      </p>
    </aside>
  );
}

function FollowButton({
  following,
  onClick,
  name,
}: {
  following: boolean;
  onClick: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={
        following
          ? { backgroundColor: "var(--reel-surface-2)", color: "var(--reel-muted)", fontSize: "13px", fontWeight: 500 }
          : { backgroundColor: "transparent", color: "var(--reel-accent)", border: "1px solid var(--reel-accent)", fontSize: "13px", fontWeight: 500 }
      }
    >
      {following ? (
        <>
          <Check size={13} /> Following
        </>
      ) : (
        "Follow"
      )}
    </button>
  );
}
