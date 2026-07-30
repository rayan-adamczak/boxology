import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";
import { StatusListPage } from "./pages/StatusListPage";

/*
 * Pages chargées à la demande : rarement visitées, les embarquer dans le bundle
 * initial faisait payer leur poids à chaque visiteur d'une fiche film, qui est
 * le chemin d'entrée réel du site.
 */
const AProposPage = lazy(() =>
  import("./pages/AProposPage").then((m) => ({ default: m.AProposPage })));
const MentionsLegalesPage = lazy(() =>
  import("./pages/MentionsLegalesPage").then((m) => ({ default: m.MentionsLegalesPage })));
const ConfidentialitePage = lazy(() =>
  import("./pages/ConfidentialitePage").then((m) => ({ default: m.ConfidentialitePage })));
const ComptePage = lazy(() =>
  import("./pages/ComptePage").then((m) => ({ default: m.ComptePage })));
const ProfilPage = lazy(() =>
  import("./pages/ProfilPage").then((m) => ({ default: m.ProfilPage })));
const IntrouvablePage = lazy(() =>
  import("./pages/IntrouvablePage").then((m) => ({ default: m.IntrouvablePage })));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/films/:id" element={<FilmDetailPage />} />
          <Route path="/mes-envies" element={<StatusListPage statut="envie" />} />
          <Route path="/ma-collection" element={<StatusListPage statut="possede" />} />

          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/compte" element={<ComptePage />} />

          <Route path="/a-propos" element={<AProposPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />

          {/* `/wishlist` était l'écran du prototype vers lequel pointait la
              barre mobile ; l'équivalent réel est `/mes-envies`. */}
          <Route path="/wishlist" element={<Navigate to="/mes-envies" replace />} />

          <Route path="*" element={<IntrouvablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
