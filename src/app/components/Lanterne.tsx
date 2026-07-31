import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Visionneuse plein écran pour les jaquettes et les affiches.
 *
 * Le site montre des objets physiques dont le détail est l'intérêt : la
 * tranche d'un steelbook, le grain d'un digibook, la mention « édition limitée
 * à 500 exemplaires » imprimée en petit. La vignette de 56 px de la liste des
 * éditions ne permet rien de tout ça, et l'affiche du héros est plafonnée à
 * 280 px.
 *
 * `object-contain` et non `cover` : on agrandit pour regarder, donc rien ne doit
 * être rogné. Une jaquette de coffret n'a pas le rapport d'une affiche, et les
 * deux passent dans le même cadre.
 */
export function Lanterne({
  images,
  index,
  titre,
  onFermer,
  onChanger,
}: {
  images: string[];
  index: number;
  /** Sert de texte alternatif, donc décrit l'objet montré, pas « image ». */
  titre: string;
  onFermer: () => void;
  onChanger: (index: number) => void;
}) {
  const fermerRef = useRef<HTMLButtonElement>(null);
  const plusieurs = images.length > 1;
  /** Taille native de l'image affichée, connue seulement une fois chargée. */
  const [natif, setNatif] = useState<{ w: number; h: number } | null>(null);

  /*
    Chaque image a sa propre taille : le plafond doit être recalculé au
    changement d'index.

    La remise à zéro est explicitement sautée au montage. Un `useEffect([index])`
    tourne aussi la première fois, et une image déjà en cache peut déclencher son
    `load` avant que React ne vide ses effets : la taille relevée par `onLoad`
    était alors effacée juste après. L'image ne se rechargeant plus, `onLoad` ne
    repassait jamais et le plafond n'était plus jamais calculé, donc la vignette
    de 172 px restait à 172 px au lieu des 378 permis.
  */
  const indexVu = useRef(index);
  useEffect(() => {
    if (indexVu.current === index) return;
    indexVu.current = index;
    setNatif(null);
  }, [index]);

  useEffect(() => {
    // Le focus part sur la fermeture : au clavier comme au lecteur d'écran, on
    // doit pouvoir sortir sans traverser la boîte.
    fermerRef.current?.focus();

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      if (!plusieurs) return;
      if (e.key === "ArrowRight") onChanger((index + 1) % images.length);
      if (e.key === "ArrowLeft") onChanger((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", auClavier);

    /*
      Le défilement de la page est bloqué pendant l'ouverture. Sans cela, une
      molette au-dessus de la visionneuse fait défiler la fiche derrière, et on
      la retrouve ailleurs en fermant.

      La largeur de la barre de défilement est compensée : la masquer d'un coup
      élargit la page de quelques pixels et fait sauter tout le contenu.
    */
    const compensation = window.innerWidth - document.documentElement.clientWidth;
    const debordementAvant = document.body.style.overflow;
    const margeAvant = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (compensation > 0) document.body.style.paddingRight = `${compensation}px`;

    return () => {
      document.removeEventListener("keydown", auClavier);
      document.body.style.overflow = debordementAvant;
      document.body.style.paddingRight = margeAvant;
    };
  }, [index, images.length, plusieurs, onFermer, onChanger]);

  const bouton =
    "flex size-11 items-center justify-center rounded-full outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]";
  const styleBouton = {
    backgroundColor: "rgba(24,32,44,0.9)",
    border: "1px solid var(--reel-border)",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      {/* Le fond ferme au clic. L'image, elle, ne le fait pas : on clique
          souvent dessus pour la regarder de plus près. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(8,11,15,0.94)" }}
        onClick={onFermer}
        aria-hidden="true"
      />

      {/*
        L'agrandissement est plafonné à 2,2 fois la taille native.

        Les images principales d'editioncollector sont de vraies vignettes,
        172 x 233 pixels, et il n'existe pas de version pleine taille : le même
        chemin sans le préfixe `vignette-` renvoie 404. Les étirer à la hauteur
        de l'écran donnerait une bouillie. Les visuels secondaires, eux, font
        1024 pixels et atteignent le plafond de hauteur sans être touchés par
        cette limite.

        Le facteur est là pour que la vignette gagne quand même en lisibilité,
        de 233 à 512 pixels de haut : on distingue la mention « édition limitée »
        imprimée sur la tranche, ce que la liste ne permettait pas.
      */}
      {/*
        `z-10` et non `relative` : la figure doit passer devant le voile, mais
        rester non positionnée pour que les flèches en `sm:absolute` se calent
        sur le dialogue et non sur elle.

        Sans plan explicite, un bloc statique se peint avant les éléments
        positionnés du même contexte, donc le voile à 94 % d'opacité recouvrait
        l'image : visionneuse ouverte, écran noir. `z-index` s'applique bien à un
        élément flex même statique, ce qui règle l'empilement sans toucher au
        référentiel des flèches.
      */}
      <figure className="z-10 flex max-h-[90vh] flex-col items-center gap-3">
        <img
          src={images[index]}
          alt={titre}
          onLoad={(e) =>
            setNatif({
              w: e.currentTarget.naturalWidth,
              h: e.currentTarget.naturalHeight,
            })
          }
          className="min-h-0 rounded-[10px]"
          style={{
            /*
              Une seule dimension est imposée, la largeur ; la hauteur suit le
              rapport de l'image. **Aucune image n'est donc jamais déformée.**

              Les trois termes du `min()` sont les trois limites, exprimées en
              largeur pour pouvoir être comparées entre elles :

                92vw            la place horizontale disponible
                natif × 2,2     le plafond d'agrandissement, voir plus haut
                82vh × rapport  la largeur au-delà de laquelle l'image
                                dépasserait en hauteur

              Le troisième terme remplace un `max-height`, et c'est tout le
              sujet : un `max-height` rattrape la hauteur sans toucher à la
              largeur déjà imposée, et le navigateur écrase l'image. Les
              affiches de films, très hautes, en sortaient aplaties. En
              traduisant la contrainte de hauteur en contrainte de largeur, elle
              entre dans le même `min()` et le rapport est préservé par
              construction.
            */
            width: natif
              ? `min(92vw, ${Math.round(natif.w * 2.2)}px, calc(82vh * ${(natif.w / natif.h).toFixed(4)}))`
              : "auto",
            height: "auto",
            boxShadow: "0 30px 70px -20px rgba(0,0,0,0.8)",
          }}
        />

        {/*
          Barre de commande sous l'image : le nom de l'édition, encadré des
          flèches sur mobile.

          Sur un écran de 375 px, la jaquette occupe presque toute la largeur et
          il n'existe aucune marge où poser les flèches à côté : elles se
          superposaient au visuel, c'est-à-dire à ce qu'on est venu regarder.
          Sous l'image, elles ne cachent plus rien et restent à portée du pouce.

          À partir de `sm`, elles reprennent leur place sur les côtés, où le
          geste est plus direct. Le passage se fait par `position` et non par
          deux jeux de boutons : deux fois les mêmes commandes, ce sont deux
          fois les mêmes libellés pour un lecteur d'écran.
        */}
        <div className="flex items-center gap-4">
          {plusieurs && (
            <button
              type="button"
              onClick={() => onChanger((index - 1 + images.length) % images.length)}
              aria-label="Image précédente"
              className={`${bouton} shrink-0 sm:absolute sm:left-6 sm:top-1/2 sm:-translate-y-1/2`}
              style={styleBouton}
            >
              <ChevronLeft size={22} color="var(--reel-text)" />
            </button>
          )}

          <figcaption
            className="flex min-w-0 items-center gap-2 text-center [&>span+span]:before:mr-2 [&>span+span]:before:content-['·']"
            style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "18px" }}
          >
            <span className="truncate" style={{ color: "var(--reel-text)" }}>
              {titre}
            </span>
            {plusieurs && <span className="shrink-0">{index + 1} / {images.length}</span>}
          </figcaption>

          {plusieurs && (
            <button
              type="button"
              onClick={() => onChanger((index + 1) % images.length)}
              aria-label="Image suivante"
              className={`${bouton} shrink-0 sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2`}
              style={styleBouton}
            >
              <ChevronRight size={22} color="var(--reel-text)" />
            </button>
          )}
        </div>
      </figure>

      <button
        ref={fermerRef}
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        className={`absolute right-4 top-4 sm:right-6 sm:top-6 ${bouton}`}
        style={styleBouton}
      >
        <X size={20} color="var(--reel-text)" />
      </button>
    </div>
  );
}

/**
 * Affiche TMDB en pleine résolution.
 *
 * `films.affiche_url` est stockée en `w500`, la taille dont la fiche a besoin.
 * La visionneuse, elle, veut l'original : la taille fait partie du chemin chez
 * TMDB, il suffit donc de la remplacer. Une URL d'une autre origine, comme le
 * miroir d'images, passe sans être touchée.
 */
export function pleineResolution(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/\/t\/p\/w\d+\//, "/t/p/original/");
}
