import { Home, Library, Heart, User } from "lucide-react";

type Tab = "home" | "collection" | "wishlist" | "profile";

interface BottomTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "collection", label: "Collection", icon: Library },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "profile", label: "Profile", icon: User },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex md:hidden"
      style={{
        backgroundColor: "var(--reel-bg)",
        borderTop: "1px solid var(--reel-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 outline-none"
            style={{ color: isActive ? "var(--reel-accent)" : "var(--reel-muted)" }}
          >
            <Icon size={22} />
            <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
