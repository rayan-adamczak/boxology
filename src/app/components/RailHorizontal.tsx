import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Flèche posée sur la colonne, 12 px après le début du contenu. */
const DECALAGE_FLECHE = "calc(var(--reel-marge) + 12px)";

/*
  Le voile est opaque sur la seule marge de page, puis se dilue sur 180 px à
  l'intérieur de la colonne.

  Le plateau couvrait auparavant la flèche entière, jusqu'à `marge + 68` : la
  rangée s'éteignait d'un coup et le voile se voyait comme un bloc posé sur la
  page. Il n'a en fait pas besoin d'aller si loin, la flèche portant son propre
  fond plein, sa bordure et son ombre. Ce qu'il doit faire, c'est éteindre ce
  qui se trouve dans la marge, là où plus rien n'est aligné sur la page, et
  relâcher doucement ensuite.
*/
const FIN_PLATEAU = "var(--reel-marge)";
const LARGEUR_VOILE = "calc(var(--reel-marge) + 180px)";

/**
 * Distance de défilement sur laquelle voile et flèche montent de 0 à 1.
 *
 * Ils apparaissaient d'un coup, sur un simple `scrollLeft > 1` : un pixel de
 * défilement faisait surgir un disque de 44 px et un voile de 300. La course
 * les fait maintenant monter avec le geste.
 *
 * 140 px, soit à peu près une carte : le voile est plein quand la première
 * jaquette est entrée dans la marge, c'est-à-dire quand il a quelque chose à
 * cacher.
 */
const COURSE_APPARITION = 140;

/**
 * Rail horizontal : une rangée qui défile, deux flèches pour avancer.
 *
 * **La rangée va jusqu'au bord de l'écran, pas jusqu'à la colonne.** Le rail
 * sort de la gouttière et couvre toute la fenêtre (`.reel-rail` dans
 * `theme.css`), puis remet la marge de la page en rembourrage à l'intérieur,
 * de sorte que la première carte tombe quand même sur la verticale du titre.
 *
 * Le contraire a été essayé, rail arrêté sur la colonne : une jaquette tranchée
 * net au milieu de la page se lit comme un défaut d'affichage. La même jaquette
 * qui s'efface au bord de l'écran se lit comme une suite, et c'est tout l'objet
 * des voiles.
 *
 * **Les flèches se posent sur les jaquettes, sur ce voile.** Elles ont été
 * essayées dans la marge, une fois celle-ci devenue assez large : rien ne les
 * recouvrait plus, mais elles s'éloignaient de la rangée qu'elles commandent et
 * le voile disparaissait avec elles. Le voile n'est donc pas seulement un
 * signal de continuité, il est le fond de la flèche : sans lui le chevron se
 * découpe sur une jaquette imprimée et devient illisible.
 *
 * D'où les mesures ci-dessous, toutes tirées de `--reel-marge`, la marge de page
 * posée par `.reel-rail`. Elles doivent bouger ensemble : une valeur en dur
 * s'est déjà retrouvée plus étroite que la flèche, laissant reparaître la
 * jaquette sous le chevron.
 *
 * **Voile et flèche montent avec le défilement**, de 0 à 1 sur `COURSE_APPARITION`
 * et non d'un coup au premier pixel. Ils ne paraissent donc que du côté où il
 * reste quelque chose, et à la mesure de ce qui reste. Une flèche qui ne fait
 * rien est pire que pas de flèche.
 *
 * `pointer-events-none` sur les voiles : sans lui, ils intercepteraient le
 * glissement au doigt précisément à l'endroit où l'on attrape le rail.
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
    const part = (x: number) => Math.min(1, Math.max(0, x - 1) / COURSE_APPARITION);
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
  const fleche = "absolute z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]";
  const styleFleche = {
    top: centreVignette !== null ? `${Math.round(centreVignette)}px` : "34%",
    backgroundColor: "var(--reel-surface-2)",
    border: "1px solid var(--reel-border)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
  };

  return (
    <div className="reel-rail relative">
      <div
        ref={rail}
        className="reel-rail-piste flex gap-4 overflow-x-auto pt-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          opacity: aGauche,
          width: LARGEUR_VOILE,
          background: `linear-gradient(to right, var(--reel-bg) 0, var(--reel-bg) ${FIN_PLATEAU}, transparent 100%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          opacity: aDroite,
          width: LARGEUR_VOILE,
          background: `linear-gradient(to left, var(--reel-bg) 0, var(--reel-bg) ${FIN_PLATEAU}, transparent 100%)`,
        }}
      />

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
