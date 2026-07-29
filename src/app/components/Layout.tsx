import { useState } from "react";
import { X } from "lucide-react";
import { Toaster } from "sonner";
import { Outlet, useLocation, useNavigate } from "react-router";
import { TopBar } from "./TopBar";
import { RightSidebar } from "./RightSidebar";
import { BottomTabBar } from "./BottomTabBar";
import { Footer } from "./Footer";

type MobileTab = "home" | "collection" | "wishlist" | "profile";

export function Layout() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const onMobileTab = (tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === "profile") navigate("/u/steelbook.marcus");
    else if (tab === "wishlist") navigate("/wishlist");
    else navigate("/");
  };

  const activeTab: MobileTab = location.pathname.startsWith("/u/")
    ? "profile"
    : location.pathname.startsWith("/wishlist")
    ? "wishlist"
    : mobileTab;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: "var(--reel-bg)",
        color: "var(--reel-text)",
        fontFamily: "var(--reel-font)",
      }}
    >
      <TopBar showDiscoverButton onOpenDiscover={() => setDiscoverOpen(true)} />

      <Outlet />

      <Footer />

      {/* Discover slide-over — tablet fallback for the collapsed right sidebar */}
      {discoverOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Discover">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(10,12,14,0.6)" }}
            onClick={() => setDiscoverOpen(false)}
          />
          <div
            className="absolute right-0 top-0 h-full w-[320px] max-w-[85vw] overflow-y-auto p-4"
            style={{ backgroundColor: "var(--reel-bg)", borderLeft: "1px solid var(--reel-border)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--reel-text)" }}>Discover</h2>
              <button
                type="button"
                onClick={() => setDiscoverOpen(false)}
                aria-label="Close Discover"
                className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition hover:bg-[var(--reel-surface)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              >
                <X size={20} color="var(--reel-muted)" />
              </button>
            </div>
            <RightSidebar />
          </div>
        </div>
      )}

      <BottomTabBar active={activeTab} onChange={onMobileTab} />

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
