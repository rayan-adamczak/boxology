import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { Outlet, useLocation, useNavigate } from "react-router";
import { TopBar } from "./TopBar";
import { BottomTabBar } from "./BottomTabBar";
import { Footer } from "./Footer";
import { EcranIdentifiant } from "./EcranIdentifiant";
import { useSession } from "../lib/auth";
import { useProfil } from "../lib/profils";

type MobileTab = "home" | "collection" | "wishlist" | "profile";

/** Attente pendant le téléchargement d'un fragment de page. */
function AttentePage() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
    </div>
  );
}

/**
 * Les pages qu'un compte sans identifiant atteint quand même.
 *
 * `/account` d'abord, et ce n'est pas négociable : c'est là que se supprime un
 * compte, obligation du RGPD (article 17), et personne ne doit avoir à choisir
 * un pseudonyme public pour effacer ses données. Les trois autres sont des
 * pages de texte, sans rapport avec le compte, qu'on peut vouloir lire
 * précisément *avant* de décider.
 */
const HORS_GARDE_FOU = new Set(["/account", "/about", "/legal", "/privacy"]);

export function Layout() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const etatProfil = useProfil();

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

  /*
    Le compte existe, le profil n'a jamais été créé : on demande l'identifiant
    avant tout le reste. Ça n'arrive qu'une fois, au retour de Google.

    **Seul `absent` déclenche l'écran.** `erreur` laisse passer : une lecture de
    profil qui échoue est une panne réseau, pas un compte neuf, et la confondre
    avec l'un enfermerait quelqu'un hors du site pour un hoquet de Supabase
    (§9, la bibliothèque `auth-js` qui a mis le catalogue à terre le 30 juillet).
  */
  const gardeFou =
    session != null &&
    etatProfil.statut === "absent" &&
    !HORS_GARDE_FOU.has(location.pathname);

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
        {gardeFou && session ? <EcranIdentifiant session={session} /> : <Outlet />}
      </Suspense>

      <Footer />

      <BottomTabBar active={activeTab} onChange={onMobileTab} />

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
