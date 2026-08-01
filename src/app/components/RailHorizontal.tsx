import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Rail horizontal : une rangée qui défile, deux flèches pour avancer.
 *
 * Sous `lg`, le rail mord sur la gouttière, marges négatives compensées par un
 * rembourrage égal, de sorte que les cartes s'alignent sur le reste au repos
 * mais courent jusqu'au bord de l'écran quand on fait défiler. À partir de `lg`
 * la gouttière n'a plus de rembourrage, elle pilote la proportion par sa
 * largeur : le rail commence et finit alors exactement sur la verticale du
 * reste de la page.
 *
 * Les flèches ne paraissent que du côté où il reste quelque chose. Une flèche
 * qui ne fait rien est pire que pas de flèche.
 */
export function RailHorizontal({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const rail = useRef<HTMLDivElement | null>(null);
  const [aGauche, setAGauche] = useState(false);
  const [aDroite, setADroite] = useState(false);
  /** Milieu de la vignette, en pixels depuis le haut du rail. */
  const [centreVignette, setCentreVignette] = useState<number | null>(null);

  const mesurer = () => {
    const el = rail.current;
    if (!el) return;
    // Un pixel de marge : les largeurs sont fractionnaires, et `scrollLeft`
    // n'atteint jamais exactement son maximum sur un écran à densité non
    // entière, la flèche de droite serait restée allumée en bout de course.
    setAGauche(el.scrollLeft > 1);
    setADroite(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);

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
  /*
    Les flèches sortent dans la marge à partir de `lg` : la gouttière laisse
    16 % de chaque côté, donc il y a la place, et elles ne recouvrent plus la
    première ni la dernière jaquette. En dessous elles restent posées sur le
    rail, faute de marge où aller.
  */
  const fleche = "absolute z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]";
  const styleFleche = {
    top: centreVignette !== null ? `${Math.round(centreVignette)}px` : "34%",
    backgroundColor: "var(--reel-surface-2)",
    border: "1px solid var(--reel-border)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
  };

  /*
    La marge négative annule la gouttière pour que le rail défile d'un bord à
    l'autre, et la remet en rembourrage à l'intérieur pour que la première carte
    s'aligne quand même sur le texte. Les deux valeurs doivent donc rester le
    miroir exact de `.reel-gouttiere` : à partir de `lg` celle-ci pilote la
    proportion par sa largeur et n'a plus de rembourrage, d'où le retour à zéro.
    Sans ça le rail dépassait de 40 px dans la marge.
  */
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
      <div
        ref={rail}
        className="flex gap-4 overflow-x-auto px-4 pt-4 pb-2 sm:px-6 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/*
        Les voiles dégradés aux deux bouts ont été retirés. Ils avaient un sens
        quand le rail débordait jusqu'au bord de l'écran : ils disaient que la
        rangée continuait. Depuis que la gouttière est proportionnelle, le rail
        s'arrête sur la même verticale que le reste de la page, et un voile de
        80 px mangeait la dernière jaquette à l'intérieur de la colonne. La
        rangée doit aller jusqu'au bord comme les autres éléments.
      */}

      {aGauche && (
        <button
          type="button"
          onClick={() => pousser(-1)}
          aria-label={`${ariaLabel}, précédent`}
          className={`${fleche} left-2 sm:left-4 lg:-left-14`}
          style={styleFleche}
        >
          <ChevronLeft size={20} color="var(--reel-text)" />
        </button>
      )}
      {aDroite && (
        <button
          type="button"
          onClick={() => pousser(1)}
          aria-label={`${ariaLabel}, suivant`}
          className={`${fleche} right-2 sm:right-4 lg:-right-14`}
          style={styleFleche}
        >
          <ChevronRight size={20} color="var(--reel-text)" />
        </button>
      )}
    </div>
  );
}
