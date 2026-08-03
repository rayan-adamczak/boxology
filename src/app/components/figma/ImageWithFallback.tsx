import React, { useState } from "react";

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

/**
 * Une image et ses deux replis.
 *
 * `secours` sert quand la première source échoue : sur une carte d'édition,
 * c'est l'affiche TMDB du film. Le cas n'est pas théorique, il est arrivé le
 * 3 août 2026 : 2 242 éditions portent un `image_url` sur `cdn.shopify.com`,
 * que la CSP de production n'autorise pas (`img-src` ne connaît que
 * `img.jaquette.app` et `image.tmdb.org`). Sans ce repli, la carte affichait un
 * carré vide alors que l'affiche du film, elle, était disponible.
 *
 * Le carré d'erreur reste, mais il est **aux couleurs du site** : il était en
 * `bg-gray-100`, hérité du prototype, donc un rectangle blanc au milieu d'une
 * page sombre, ce qui se lit comme un bug d'affichage plutôt que comme une
 * absence de visuel.
 */
export function ImageWithFallback({
  secours,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { secours?: string | null }) {
  const [etape, setEtape] = useState<0 | 1 | 2>(0);
  const { src, alt, style, className, ...rest } = props;

  // On repasse à la première source quand elle change : sans ça, une carte
  // recyclée par React garderait l'échec de la précédente.
  const [derniereSrc, setDerniereSrc] = useState(src);
  if (src !== derniereSrc) {
    setDerniereSrc(src);
    setEtape(0);
  }

  const source = etape === 0 ? src : etape === 1 ? secours ?? undefined : undefined;

  if (etape === 2 || !source) {
    return (
      <div
        className={`inline-block text-center align-middle ${className ?? ""}`}
        style={{ ...style, backgroundColor: "var(--reel-surface-2)" }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <img src={ERROR_IMG_SRC} alt="" {...rest} data-original-url={src} />
        </div>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setEtape((e) => (e === 0 && secours ? 1 : 2))}
    />
  );
}
