import { lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from "react-router";
import { Layout } from "./components/Layout";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";

/*
 * Pages chargées à la demande : rarement visitées, les embarquer dans le bundle
 * initial faisait payer leur poids à chaque visiteur d'une fiche film, qui est
 * le chemin d'entrée réel du site.
 */
const BienvenuePage = lazy(() =>
  import("./pages/BienvenuePage").then((m) => ({ default: m.BienvenuePage })));
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

/**
 * Position de défilement de chaque entrée d'historique, par `location.key`.
 *
 * En mémoire et non dans `sessionStorage` : ces positions ne survivent pas au
 * rechargement de toute façon, puisque react-router refabrique ses clés au
 * démarrage. Une `Map` évite d'écrire dans le stockage à chaque frame de
 * défilement.
 */
const positions = new Map<string, number>();

/*
 * Défilement à la navigation : en haut à l'aller, à sa place au retour.
 *
 * Le navigateur ne fait ni l'un ni l'autre dans une application à page unique.
 * Rien ne change de document, donc à l'aller la position reste celle de l'écran
 * précédent : en descendant le catalogue puis en ouvrant une fiche, on arrivait
 * au milieu du synopsis, parfois sous les onglets, sans rien pour comprendre
 * qu'il y avait quelque chose au-dessus.
 *
 * Au retour, la restauration native échoue pour une autre raison : le catalogue
 * recharge ses données, la page ne fait encore que la hauteur d'un écran au
 * moment où le navigateur essaie de rendre sa place, et le défilement est
 * plafonné à zéro. D'où `scrollRestoration = "manual"`, on lui retire un
 * travail qu'il fait mal, et une restauration qui attend que la page soit
 * assez haute, image par image, avec deux secondes de patience maximum. Passé
 * ce délai on descend aussi bas que possible : mieux vaut approcher la position
 * que rester en haut.
 *
 * `ScrollRestoration` de react-router ne convient pas ici : il demande un
 * routeur de données (`createBrowserRouter`), et l'application utilise
 * `BrowserRouter`.
 */
function GestionDefilement() {
  const location = useLocation();
  const typeNavigation = useNavigationType();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /*
    Mémorise la position de l'entrée courante. Une frame d'écart suffit : on n'a
    pas besoin du dernier pixel, seulement de l'endroit où on était.

    **Rien n'est relevé au démontage, et c'est délibéré.** C'était la première
    version, et elle enregistrait toujours zéro : quand le catalogue cède la
    place à une fiche qui charge, la page retombe à la hauteur d'un écran, le
    navigateur ramène lui-même le défilement en haut, et il l'a déjà fait quand
    React exécute le nettoyage. La dernière position vue pendant le défilement
    est la bonne ; la relire au moment de partir revient à lire zéro.

    Reste à annuler la frame en attente, pour la même raison en miroir : sans
    `cancelAnimationFrame`, elle s'exécute après la remise à zéro et réécrit
    zéro sous l'ancienne clé.
  */
  useEffect(() => {
    const cle = location.key;
    let frame = 0;
    const noter = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        positions.set(cle, window.scrollY);
      });
    };
    window.addEventListener("scroll", noter, { passive: true });
    return () => {
      window.removeEventListener("scroll", noter);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [location.key]);

  useEffect(() => {
    if (typeNavigation !== "POP") {
      window.scrollTo(0, 0);
      return;
    }

    const cible = positions.get(location.key) ?? 0;
    if (cible === 0) {
      window.scrollTo(0, 0);
      return;
    }

    let annule = false;
    const debut = performance.now();
    const essayer = () => {
      if (annule) return;
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maximum >= cible) {
        window.scrollTo(0, cible);
        return;
      }
      if (performance.now() - debut > 2000) {
        window.scrollTo(0, maximum);
        return;
      }
      requestAnimationFrame(essayer);
    };
    essayer();

    return () => {
      annule = true;
    };
  }, [location.key, typeNavigation]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GestionDefilement />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/films/:id" element={<FilmDetailPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/compte" element={<ComptePage />} />

          <Route path="/bienvenue" element={<BienvenuePage />} />
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
