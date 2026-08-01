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
 * **Les flèches se posent sur les jaquettes, sur un voile dégradé.** Elles ont
 * été essayées dans la marge, une fois celle-ci devenue assez large : rien ne
 * les recouvrait plus, mais elles s'éloignaient de la rangée qu'elles
 * commandent et le voile disparaissait avec elles. Une flèche qui flotte dans
 * le vide se lit moins bien qu'une flèche posée sur ce qu'elle fait défiler.
 *
 * Le voile n'est donc pas là pour dire « ça continue », il est le fond de la
 * flèche : sans lui elle se découpe sur une jaquette imprimée et le chevron
 * devient illisible.
 *
 * **Il doit donc être plus large que la flèche, plateau opaque compris.** En
 * 80 px de large avec une opacité pleine sur 55 %, il ne couvrait que 44 px
 * alors que la flèche s'étend jusqu'à 92 px du bord : la jaquette reparaissait
 * sous sa moitié droite, et le voile se lisait comme un dégradé qui s'arrête
 * au milieu. Les largeurs sont calées sur la position de la flèche à chaque
 * palier, plateau à 70 % :
 *
 *     mobile   voile 112, plateau 78, flèche jusqu'à 68
 *     sm       voile 128, plateau 90, flèche jusqu'à 76
 *     lg       voile 144, plateau 101, flèche jusqu'à 92
 *
 * Déplacer une flèche demande de reprendre la largeur du voile avec.
 *
 * Les voiles et les flèches ne paraissent que du côté où il reste quelque
 * chose. Une flèche qui ne fait rien est pire que pas de flèche.
 *
 * `pointer-events-none` sur les voiles : sans lui, ils intercepteraient le
 * glissement au doigt précisément à l'endroit où l'on attrape le rail.
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
  // Les flèches restent dans la colonne, donc par-dessus les voiles et les
  // jaquettes : elles doivent tomber là où l'œil les cherche, sur la rangée
  // qu'elles commandent. Sorties dans la marge, elles perdaient leur fond et
  // leur rapport à ce qu'elles font défiler.
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

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-28 transition-opacity sm:w-32 lg:w-36"
        style={{
          opacity: aGauche ? 1 : 0,
          background: "linear-gradient(to right, var(--reel-bg) 0%, var(--reel-bg) 70%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-28 transition-opacity sm:w-32 lg:w-36"
        style={{
          opacity: aDroite ? 1 : 0,
          background: "linear-gradient(to left, var(--reel-bg) 0%, var(--reel-bg) 70%, transparent 100%)",
        }}
      />

      {aGauche && (
        <button
          type="button"
          onClick={() => pousser(-1)}
          aria-label={`${ariaLabel}, précédent`}
          className={`${fleche} left-6 sm:left-8 lg:left-12`}
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
          className={`${fleche} right-6 sm:right-8 lg:right-12`}
          style={styleFleche}
        >
          <ChevronRight size={20} color="var(--reel-text)" />
        </button>
      )}
    </div>
  );
}
