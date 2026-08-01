import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Flèches posées sur la rangée, 12 px après chaque bord de la colonne. */
const DECALAGE_FLECHE = 12;


/**
 * Distance de défilement sur laquelle la flèche monte de 0 à 1.
 *
 * Elle apparaissait d'un coup, sur un simple `scrollLeft > 1` : un pixel de
 * défilement faisait surgir un disque de 44 px. La course la fait monter avec
 * le geste.
 *
 * 40 px se lisait comme un déclic, un cran de molette faisant tout le trajet en
 * une image. 90 px avec une sortie douce laisse le geste s'entendre sans que
 * rien ne claque.
 */
const COURSE_APPARITION = 90;

/**
 * Sortie douce, `1 - (1 - t)²`.
 *
 * Une rampe linéaire monte à vitesse constante puis s'arrête net à 1 : c'est
 * cette cassure qu'on lit comme de la brutalité, pas la durée. La courbe part
 * vite, ce qui couvre la jaquette dès le premier geste, et arrive à plat.
 */
const adoucir = (t: number) => 1 - (1 - t) ** 2;

/**
 * Rail horizontal : une rangée qui défile, deux flèches pour avancer.
 *
 * **La rangée tient dans la colonne, des deux côtés.** Les cartes sont donc
 * tranchées net sur la verticale du titre à gauche comme à droite, et rien ne
 * passe dans la marge.
 *
 * Le débordement a été essayé, d'abord des deux côtés puis à droite seulement,
 * avec un voile dégradé pour éteindre ce qui sortait. Aucune des deux variantes
 * ne tient : la marge est vide parce que la page est alignée dessus, et une
 * jaquette qui l'occupe, même à demi effacée, se lit comme une fuite. Le voile
 * lui-même posait le problème inverse dès qu'il mordait vers l'intérieur, en
 * laissant une carte fantôme au milieu du cadre.
 *
 * Il n'y a donc plus de voile du tout. La flèche porte son propre fond plein,
 * sa bordure et son ombre, elle n'a jamais eu besoin d'autre chose pour se
 * détacher d'une jaquette imprimée.
 *
 * **Flèche et opacité montent avec le défilement**, de 0 à 1 sur
 * `COURSE_APPARITION` et non d'un coup au premier pixel. Elles ne paraissent
 * donc que du côté où il reste quelque chose, et à la mesure de ce qui reste.
 * Une flèche qui ne fait rien est pire que pas de flèche.
 */
export function RailHorizontal({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const rail = useRef<HTMLDivElement | null>(null);
  /** Avancement de l'apparition, de 0 à 1, de chaque côté. */
  const [aGauche, setAGauche] = useState(0);
  const [aDroite, setADroite] = useState(0);
  /** Milieu de la vignette, en pixels depuis le haut du rail. */
  const [centreVignette, setCentreVignette] = useState<number | null>(null);

  const mesurer = () => {
    const el = rail.current;
    if (!el) return;
    /*
      Un pixel de marge sur le reste : les largeurs sont fractionnaires, et
      `scrollLeft` n'atteint jamais exactement son maximum sur un écran à
      densité non entière, la flèche de droite serait restée allumée en bout de
      course. Le `max(0, ...)` s'en charge, et la division par la course donne
      l'avancement.
    */
    const reste = el.scrollWidth - el.clientWidth - el.scrollLeft;
    const part = (x: number) => adoucir(Math.min(1, Math.max(0, x - 1) / COURSE_APPARITION));
    setAGauche(part(el.scrollLeft));
    setADroite(part(reste));

    /*
      Les flèches se centrent sur l'image de la première carte, mesurée, et non
      sur un pourcentage de la hauteur du rail.

      Un pourcentage ne tient que pour une forme de carte : `34 %` visait le
      milieu du portrait d'un acteur, image, nom, rôle. Sur le rail des
      parutions, la carte porte une jaquette plus haute et deux lignes de texte,
      et la même fraction tombait au-dessus de l'image. Mesurer libère le
      composant de la forme de ce qu'il transporte.
    */
    const image = el.querySelector("img");
    if (image) {
      const cadreRail = el.getBoundingClientRect();
      const cadreImage = image.getBoundingClientRect();
      if (cadreImage.height > 0) {
        setCentreVignette(cadreImage.top - cadreRail.top + cadreImage.height / 2);
      }
    }
  };

  useEffect(() => {
    mesurer();
    const el = rail.current;
    if (!el) return;
    el.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);

    // Le contenu du rail change de taille après le montage : les portraits
    // arrivent du réseau, et tant qu'ils ne sont pas là `scrollWidth` peut
    // valoir `clientWidth`. Sans cet observateur, la flèche de droite ne
    // paraîtrait qu'au premier défilement, c'est-à-dire une fois qu'on a
    // trouvé tout seul qu'il y avait une suite.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    for (const enfant of Array.from(el.children)) observateur.observe(enfant);

    return () => {
      el.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
      observateur.disconnect();
    };
  }, [children]);

  const pousser = (sens: -1 | 1) => {
    const el = rail.current;
    if (!el) return;
    // 80 % de la largeur visible plutôt que 100 % : laisser une carte en commun
    // d'un écran à l'autre évite de perdre le fil.
    el.scrollBy({ left: sens * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Taille 44 px, le minimum tactile recommandé : en 36 px, un clic à un pixel
  // près tombait sur la carte dessous et ouvrait la fiche au lieu de défiler.
  // Le `top` vient de la mesure ci-dessus ; `34 %` n'est qu'un repli pour le
  // premier rendu, avant que les images aient une hauteur.
  const fleche = "absolute z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]";
  const styleFleche = {
    top: centreVignette !== null ? `${Math.round(centreVignette)}px` : "34%",
    backgroundColor: "var(--reel-surface-2)",
    border: "1px solid var(--reel-border)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
  };

  return (
    <div className="relative">
      <div
        ref={rail}
        className="flex gap-4 overflow-x-auto pt-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>


      {aGauche > 0.01 && (
        <button
          type="button"
          onClick={() => pousser(-1)}
          aria-label={`${ariaLabel}, précédent`}
          className={fleche}
          style={{ ...styleFleche, left: DECALAGE_FLECHE, opacity: aGauche }}
        >
          <ChevronLeft size={20} color="var(--reel-text)" />
        </button>
      )}
      {aDroite > 0.01 && (
        <button
          type="button"
          onClick={() => pousser(1)}
          aria-label={`${ariaLabel}, suivant`}
          className={fleche}
          style={{ ...styleFleche, right: DECALAGE_FLECHE, opacity: aDroite }}
        >
          <ChevronRight size={20} color="var(--reel-text)" />
        </button>
      )}
    </div>
  );
}
