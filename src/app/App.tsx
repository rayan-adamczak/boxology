import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { useSeo } from "./lib/seo";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";
import { StatusListPage } from "./pages/StatusListPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { WishlistPage } from "./pages/WishlistPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { AProposPage } from "./pages/AProposPage";
import { MentionsLegalesPage } from "./pages/MentionsLegalesPage";
import { ConfidentialitePage } from "./pages/ConfidentialitePage";

/**
 * Écrans du prototype d'origine : ils affichent des données factices. Les
 * laisser indexer donnerait des résultats de recherche pointant vers des faux
 * profils et des faux prix.
 */
function Prototype({ titre, children }: { titre: string; children: ReactNode }) {
  useSeo({ titre, description: "Écran de démonstration du prototype.", noindex: true });
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/films/:id" element={<FilmDetailPage />} />
          <Route path="/mes-envies" element={<StatusListPage statut="envie" />} />
          <Route path="/ma-collection" element={<StatusListPage statut="possede" />} />

          <Route path="/a-propos" element={<AProposPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />

          {/* Previous mock-data prototype screens, kept for reference */}
          <Route path="/dashboard" element={<Prototype titre="Tableau de bord"><HomePage /></Prototype>} />
          <Route path="/wishlist" element={<Prototype titre="Wishlist"><WishlistPage /></Prototype>} />
          <Route path="/movie/:id" element={<Prototype titre="Fiche film"><MovieDetailPage /></Prototype>} />
          <Route path="/u/:handle" element={<Prototype titre="Profil"><ProfilePage /></Prototype>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
