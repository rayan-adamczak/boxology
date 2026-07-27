import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";
import { StatusListPage } from "./pages/StatusListPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { WishlistPage } from "./pages/WishlistPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/films/:id" element={<FilmDetailPage />} />
          <Route path="/mes-envies" element={<StatusListPage statut="envie" />} />
          <Route path="/ma-collection" element={<StatusListPage statut="possede" />} />

          {/* Previous mock-data prototype screens, kept for reference */}
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/u/:handle" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
