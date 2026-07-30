import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";

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
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/compte" element={<ComptePage />} />

          <Route path="/a-propos" element={<AProposPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />

          {/* « Ma collection » et « Mes envies » ont fusionné dans le profil,
              qui montre les mêmes listes groupées par film. Redirections plutôt
              que suppression sèche : ces adresses ont été en ligne, et le pied
              de page comme la barre mobile y menaient. */}
          <Route path="/ma-collection" element={<Navigate to="/profil" replace />} />
          <Route path="/mes-envies" element={<Navigate to="/profil?liste=envies" replace />} />
          <Route path="/wishlist" element={<Navigate to="/profil?liste=envies" replace />} />

          <Route path="*" element={<IntrouvablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
