import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { Outlet, useLocation, useNavigate } from "react-router";
import { TopBar } from "./TopBar";
import { BottomTabBar } from "./BottomTabBar";
import { Footer } from "./Footer";

type MobileTab = "home" | "collection" | "wishlist" | "profile";

/** Attente pendant le téléchargement d'un fragment de page. */
function AttentePage() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
    </div>
  );
}

export function Layout() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * La barre du bas menait aux écrans du prototype : « Profil » ouvrait
   * /u/steelbook.marcus, un faux profil, et « Envies » /wishlist, des données
   * factices. Sur mobile, c'était la seule navigation disponible, elle mène
   * maintenant aux vraies pages.
   */
  const CHEMINS: Record<MobileTab, string> = {
    // Vers /catalogue et non / : connecté, l'accueil est le tableau de bord,
    // et l'onglet s'intitule « Catalogue ».
    home: "/catalogue",
    collection: "/profile",
    wishlist: "/profile?liste=envies",
    profile: "/profile",
  };

  const onMobileTab = (tab: MobileTab) => {
    setMobileTab(tab);
    navigate(CHEMINS[tab]);
  };

  // L'onglet actif se déduit de l'URL : arriver sur /profil par un lien du menu
  // doit allumer le bon onglet, pas celui du dernier appui.
  const activeTab: MobileTab = location.pathname.startsWith("/profile")
    ? location.search.includes("liste=envies")
      ? "wishlist"
      : mobileTab === "collection" || mobileTab === "profile"
      ? mobileTab
      : "profile"
    : location.pathname === "/" || location.pathname === "/catalogue"
    ? "home"
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
      <TopBar />

      {/* Les pages chargées à la demande passent par ici. La frontière est
          placée autour de l'Outlet et non autour du routeur, pour que la barre
          du haut et le pied de page restent affichés pendant le chargement du
          fragment plutôt que de laisser un écran vide. */}
      <Suspense fallback={<AttentePage />}>
        <Outlet />
      </Suspense>

      <Footer />

      <BottomTabBar active={activeTab} onChange={onMobileTab} />

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
