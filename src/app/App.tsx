import { lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from "react-router";
import { Layout } from "./components/Layout";
import { BrowsePage } from "./pages/BrowsePage";
import { FilmDetailPage } from "./pages/FilmDetailPage";
/*
 * Pages de regroupement et écran introuvable : embarqués, pas chargés à la
 * demande, et ça coûte 3,3 Ko compressés au bundle initial.
 *
 * Elles ont d'abord été posées en `lazy()`, comme les autres pages secondaires.
 * Le morceau `RegroupementPage` s'est retrouvé **empoisonné en cache dès le
 * premier déploiement** : demandé pendant la fenêtre de propagation, il n'était
 * pas encore là, la réécriture SPA a répondu `index.html` sous son nom, et la
 * règle `/assets/*` de `public/_headers` l'a estampillé pour 24 h. Les 72 pages
 * rendaient un écran vide sur `Failed to fetch dynamically imported module`.
 * Signature du §9, à l'identique.
 *
 * Le §9 en tire déjà la règle : **aucun chemin de consultation ne doit dépendre
 * d'un `import()` qui peut échouer.** Ces pages sont des portes d'entrée depuis
 * les moteurs, donc des chemins de consultation. 3,3 Ko contre une panne déjà
 * survenue, le compte est vite fait.
 *
 * `IntrouvablePage` suit, parce que `RegroupementPage` l'importe statiquement :
 * la garder en `lazy()` ne déplaçait plus rien et Vite le signalait.
 */
import { RegroupementPage } from "./pages/RegroupementPage";
import { IndexRegroupementsPage } from "./pages/IndexRegroupementsPage";
import { IntrouvablePage } from "./pages/IntrouvablePage";

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
          {/* L'adresse canonique porte le slug ; la forme nue reste servie
              parce qu'elle a été indexée et qu'un lien peut ne connaître que
              l'id. La Pages Function redirige la seconde vers la première en
              301, mais elle ne tourne qu'en production : les deux routes
              doivent fonctionner ici aussi. Le slug n'est jamais lu, seul l'id
              compte (cf. `lib/liens.ts`). */}
          <Route path="/films/:slug/:id" element={<FilmDetailPage />} />
          <Route path="/films/:id" element={<FilmDetailPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/compte" element={<ComptePage />} />

          {/* Pages de regroupement. Elles captent la requête de navigation
              (« steelbooks 4K », « éditions Carlotta ») et, surtout, donnent
              au crawler un chemin vers les fiches profondes : sans elles la
              profondeur de clic est accueil, 50 films, mur. Le slug est validé
              contre la table générée ; hors table, la page rend l'écran
              introuvable et la Pages Function répond 404. */}
          <Route path="/formats" element={<IndexRegroupementsPage axe="formats" />} />
          <Route path="/formats/:slug" element={<RegroupementPage axe="formats" />} />
          <Route path="/editeurs" element={<IndexRegroupementsPage axe="editeurs" />} />
          <Route path="/editeurs/:slug" element={<RegroupementPage axe="editeurs" />} />
          <Route path="/genres" element={<IndexRegroupementsPage axe="genres" />} />
          <Route path="/genres/:slug" element={<RegroupementPage axe="genres" />} />

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
