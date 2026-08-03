import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ChampRecherche } from "./ChampRecherche";
import { useApercuFilms } from "../lib/recherche-films";

/**
 * La recherche du bandeau, sur téléphone.
 *
 * Sous `lg` le champ du bandeau n'a pas la place et cède à une loupe. Elle
 * emmenait sur `/catalogue`, ce qui coûtait une navigation, un chargement de
 * grille et un second geste pour atteindre le champ, là où le même geste sur
 * un écran large ouvre une liste sous le curseur sans quitter la page.
 *
 * La feuille rend ce geste identique : le champ s'ouvre en haut de l'écran, la
 * liste tombe dessous, et on reste où on était si on la referme.
 *
 * **Aucun composant de recherche n'est refait ici.** C'est le `ChampRecherche`
 * du bandeau, avec son panneau et son clavier : une seconde liste de résultats
 * écrite pour le téléphone aurait dérivé de celle du bureau au premier
 * réglage, ce que le §7 reproche déjà au corps injecté par le middleware.
 */
export function FeuilleRecherche({ onFermer }: { onFermer: () => void }) {
  const [saisie, setSaisie] = useState("");
  const apercu = useApercuFilms(saisie);
  const navigate = useNavigate();
  const location = useLocation();

  /*
    Ouvrir une fiche depuis la liste change l'adresse : la feuille se retire
    alors d'elle-même, sans que chaque ligne ait à penser à la fermer.

    **L'adresse d'ouverture est mémorisée, sinon la feuille se referme au
    montage** : un effet de ce genre tourne aussi au premier rendu, donc la
    loupe ouvrait puis fermait dans la même frame et il ne se passait
    visiblement rien.
  */
  const cleOuverture = useRef(location.key);
  useEffect(() => {
    if (location.key !== cleOuverture.current) onFermer();
  }, [location.key, onFermer]);

  /*
    Le défilement de la page est bloqué le temps de la feuille, comme pour la
    visionneuse (§8). Pas de compensation de barre ici : sur les écrans
    concernés elle est en surimpression et ne prend aucune largeur, la
    compenser décalerait la mise en page de quelques pixels pour rien.
  */
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher un film"
      className="fixed inset-0 z-50 lg:hidden"
      style={{ backgroundColor: "var(--reel-bg)" }}
      onKeyDown={(e) => {
        /*
          Échap est déjà pris par le champ, qui referme son panneau : la feuille
          ne se retire donc qu'à la seconde pression, quand plus rien n'est
          ouvert dessous. Une seule touche pour deux fermetures ferait
          disparaître la feuille alors qu'on voulait seulement dégager la liste.
        */
        if (e.key === "Escape" && !document.querySelector("[role=listbox]")) onFermer();
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <ChampRecherche
          valeur={saisie}
          onChange={setSaisie}
          onValider={(v) => {
            const terme = v.trim();
            navigate(terme ? `/catalogue?q=${encodeURIComponent(terme)}` : "/catalogue");
          }}
          apercu={apercu}
          /* Rien derrière la feuille : la liste prend l'écran plutôt que de
             laisser deux tiers de vide sous elle. */
          apercuPlafond={2000}
          taille="compact"
          autoFocus
        />
        <button
          type="button"
          onClick={onFermer}
          className="shrink-0 rounded-full px-1 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ fontSize: "15px", color: "var(--reel-muted)" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
