import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

/*
 * Montage de l'application, avec le démarrage raté rendu bruyant.
 *
 * Le 31 juillet 2026, le bundle principal servi sous son nom d'asset était en
 * réalité `index.html`, cache empoisonné par la fenêtre de propagation d'un
 * déploiement. Le module ne s'exécutait pas, React ne montait jamais, et **rien
 * ne le disait** : la page affichait le corps injecté par la Pages Function,
 * donc elle avait l'air de marcher. Il a fallu comparer `fetch` et `import` sur
 * le même fichier pour comprendre.
 *
 * Ce qui suit ne répare rien, ça n'en a pas le pouvoir : si le module ne
 * s'exécute pas, ce code ne s'exécute pas non plus. Mais dès que le module
 * démarre et que le montage échoue pour une autre raison, la console le dit, et
 * le corps servi reste à l'écran plutôt que d'être remplacé par du vide.
 */
const racine = document.getElementById("root");

if (!racine) {
  console.error("jaquette : #root introuvable, l'application ne peut pas démarrer");
} else {
  try {
    createRoot(racine).render(<App />);
  } catch (erreur) {
    // On ne vide pas `#root` : le contenu écrit par la périphérie est la
    // dernière chose lisible qui reste au visiteur.
    console.error("jaquette : montage impossible", erreur);
  }
}
