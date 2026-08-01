import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Défilement vers l'ancre d'un lien entrant, `/about#compte-et-donnees`.
 *
 * Le navigateur ne le fait pas tout seul, pour deux raisons qui se cumulent :
 * la cible n'existe pas encore au moment où il lit le fragment, la page étant
 * rendue par React ; et `GestionDefilement` remet en haut à chaque navigation.
 * D'où l'attente d'une frame avant d'agir, puis les tentatives répétées jusqu'à
 * une seconde, le temps que la page prenne sa hauteur.
 *
 * `BienvenuePage` en porte encore sa propre copie, écrite avant ce hook. À y
 * remonter quand elle sera libre : deux implémentations du même défilement
 * finiront par diverger.
 */
export function useDefilementVersAncre() {
  const { hash } = useLocation();

  useEffect(() => {
    const ancre = hash.slice(1);
    if (!ancre) return;

    let annule = false;
    const debut = performance.now();
    const essayer = () => {
      if (annule) return;
      const cible = document.getElementById(ancre);
      if (cible) {
        cible.scrollIntoView({ block: "start" });
        return;
      }
      if (performance.now() - debut > 1000) return;
      requestAnimationFrame(essayer);
    };
    requestAnimationFrame(essayer);

    return () => {
      annule = true;
    };
  }, [hash]);
}
