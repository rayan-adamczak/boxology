import { useState } from "react";
import { Link } from "react-router";
import { Search, Bell, MessageSquare, ChevronDown, Compass, Film, Settings, LogOut, User as UserIcon, Heart, CheckCircle2 } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { user } from "../data";

interface TopBarProps {
  /** shown only on tablet to open the collapsed right ("Discover") sidebar */
  onOpenDiscover?: () => void;
  showDiscoverButton?: boolean;
}

export function TopBar({ onOpenDiscover, showDiscoverButton }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center"
      style={{
        height: 72,
        backgroundColor: "var(--reel-bg)",
        borderBottom: "1px solid var(--reel-border)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 md:px-8 lg:px-16">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Accueil Jaquette"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[8px]"
            style={{ backgroundColor: "var(--reel-accent)" }}
          >
            <Film size={18} color="#ffffff" strokeWidth={2.2} />
          </span>
          <span
            className="hidden sm:block"
            style={{ fontSize: "18px", fontWeight: 700, color: "var(--reel-text)" }}
          >
            Jaquette
          </span>
        </Link>

        {/* Global search */}
        <div className="mx-auto flex w-full max-w-[520px] flex-1 items-center">
          <label className="relative block w-full">
            <span className="sr-only">Search movies, editions, or users</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              color="var(--reel-muted)"
            />
            <input
              type="search"
              placeholder="Search movies, editions, or users"
              className="w-full rounded-full py-2 pl-9 pr-4 outline-none transition focus:ring-2"
              style={{
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
                fontSize: "14px",
                fontWeight: 400,
              }}
            />
          </label>
        </div>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {showDiscoverButton && (
            <IconButton label="Open Discover" onClick={onOpenDiscover} className="hidden md:flex lg:hidden">
              <Compass size={20} color="var(--reel-muted)" />
            </IconButton>
          )}
          <IconButton label="Notifications" badge>
            <Bell size={20} color="var(--reel-muted)" />
          </IconButton>
          <IconButton label="Messages" badge>
            <MessageSquare size={20} color="var(--reel-muted)" />
          </IconButton>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-1 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            >
              <UserAvatar name={user.name} size={34} />
              <ChevronDown size={16} color="var(--reel-muted)" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[10px] py-1 shadow-xl"
                  style={{
                    backgroundColor: "var(--reel-surface)",
                    border: "1px solid var(--reel-border)",
                  }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--reel-border)" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>{user.name}</p>
                    <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{user.handle}</p>
                  </div>
                  <MenuItem icon={<Heart size={16} />} to="/mes-envies">Mes envies</MenuItem>
                  <MenuItem icon={<CheckCircle2 size={16} />} to="/ma-collection">Ma collection</MenuItem>
                  <MenuItem icon={<UserIcon size={16} />} to="/u/steelbook.marcus">Profile</MenuItem>
                  <MenuItem icon={<Settings size={16} />}>Settings</MenuItem>
                  <MenuItem icon={<LogOut size={16} />}>Sign out</MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  badge,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  badge?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full outline-none transition hover:bg-[var(--reel-surface)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] ${className}`}
    >
      {children}
      {badge && (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--reel-accent)", boxShadow: "0 0 0 2px var(--reel-bg)" }}
        />
      )}
    </button>
  );
}

function MenuItem({ children, icon, to }: { children: React.ReactNode; icon: React.ReactNode; to?: string }) {
  const className =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left outline-none transition hover:bg-[var(--reel-surface-2)]";
  const inner = (
    <>
      <span style={{ color: "var(--reel-muted)" }}>{icon}</span>
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} role="menuitem" className={className} style={{ fontSize: "14px", color: "var(--reel-text)" }}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" className={className} style={{ fontSize: "14px", color: "var(--reel-text)" }}>
      {inner}
    </button>
  );
}
