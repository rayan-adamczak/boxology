import { Home, Library, ScanLine, Bookmark, User } from "lucide-react";

type Tab = "home" | "collection" | "scan" | "wishlist" | "profile";

interface BottomTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

/*
  Libellés en français comme le reste du site : ils venaient du prototype.

  **« Scanner » est au centre depuis le 7 août 2026**, et c'est la seule entrée
  de cette barre qui soit une *action* plutôt qu'une destination : le geste est
  « j'ai un boîtier dans la main », il se fait debout devant une étagère ou dans
  un rayon, et c'est la fonction la plus demandée du relevé du §8. La position
  centrale est celle qu'on atteint au pouce sans regarder.

  Cinq onglets tiennent à 375 px, 75 px chacun, l'icône faisant 22 et le libellé
  11. En dessous, il faudrait sacrifier un libellé, ce qui rendrait la barre
  illisible pour qui ne reconnaît pas les icônes.
*/
const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Catalogue", icon: Home },
  { key: "collection", label: "Collection", icon: Library },
  { key: "scan", label: "Scanner", icon: ScanLine },
  { key: "wishlist", label: "Envies", icon: Bookmark },
  { key: "profile", label: "Profil", icon: User },
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
