import { useNavigate } from "react-router";
import { Library, Heart, Film, DollarSign, Users, UserPlus } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { user } from "../data";

type NavKey = "collection" | "wishlist" | "following" | "followers";

interface LeftSidebarProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
}

export function LeftSidebar({ active, onNavigate }: LeftSidebarProps) {
  const navigate = useNavigate();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-5">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} size={44} />
        <div className="min-w-0">
          <p className="truncate" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
            {user.name}
          </p>
          <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            {user.handle}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-col gap-2.5">
        <StatCard icon={<Film size={16} />} label="Owned films" value={String(user.owned)} />
        <StatCard icon={<Heart size={16} />} label="Wishlist items" value={String(user.wishlist)} />
        <StatCard icon={<DollarSign size={16} />} label="Est. collection value" value={user.value} />
      </div>

      {/* Primary nav */}
      <div className="flex flex-col gap-1">
        <NavLink
          icon={<Library size={18} />}
          label="My Collection"
          active={active === "collection"}
          onClick={() => onNavigate("collection")}
        />
        <NavLink
          icon={<Heart size={18} />}
          label="My Wishlist"
          active={active === "wishlist"}
          onClick={() => {
            onNavigate("wishlist");
            navigate("/wishlist");
          }}
        />
      </div>

      <div style={{ borderTop: "1px solid var(--reel-border)" }} />

      {/* Secondary nav */}
      <div className="flex flex-col gap-1">
        <NavLink
          icon={<Users size={18} />}
          label="Following"
          count={user.following}
          active={active === "following"}
          onClick={() => onNavigate("following")}
        />
        <NavLink
          icon={<UserPlus size={18} />}
          label="Followers"
          count={user.followers}
          active={active === "followers"}
          onClick={() => onNavigate("followers")}
        />
      </div>
    </nav>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-[10px] p-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div className="mb-1 flex items-center gap-1.5" style={{ color: "var(--reel-muted)" }}>
        {icon}
        <span style={{ fontSize: "13px", fontWeight: 400 }}>{label}</span>
      </div>
      <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  );
}

function NavLink({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
        color: active ? "var(--reel-accent)" : "var(--reel-text)",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "var(--reel-surface)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={{ color: active ? "var(--reel-accent)" : "var(--reel-muted)" }}>{icon}</span>
      <span style={{ fontSize: "15px", fontWeight: 500 }}>{label}</span>
      {typeof count === "number" && (
        <span className="ml-auto" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {count}
        </span>
      )}
    </button>
  );
}
