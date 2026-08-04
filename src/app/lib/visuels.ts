/**
 * Taille demandée aux visuels d'édition, à l'affichage.
 *
 * Le flux Awin d'E.Leclerc écrit ses `image_url` avec les paramètres du CDN
 * dedans, et il demande la pleine taille :
 *
 *     https://media.e.leclerc/LEN/fp/3388337129128_1?vh=1e168e&w=1000&h=1000&func=fit
 *
 * Mesuré en production, ça fait **928 636 octets** téléchargés pour une
 * vignette rendue dans un cadre de 56 × 84. Une fiche à dix éditions Leclerc
 * paie donc neuf mégaoctets pour des images qu'on ne voit qu'en timbre-poste.
 *
 * Leur CDN honore les paramètres, il suffit de les réécrire. Rien n'est touché
 * en base : la colonne garde l'URL pleine taille, qui reste la bonne pour la
 * visionneuse, et c'est l'affichage qui demande ce dont il a besoin. Même
 * principe que `pleineResolution` pour TMDB, dans l'autre sens.
 *
 * Les autres hôtes passent sans être touchés. `img.jaquette.app` sert des
 * fichiers déjà dimensionnés, `image.tmdb.org` met sa taille dans le chemin et
 * non dans la requête, `cdn.shopify.com` a sa propre grammaire : leur imposer
 * ces paramètres-ci ne ferait rien, ou pire, casserait l'URL.
 */
const HOTE_LECLERC = "media.e.leclerc";

export function vignette(url: string | null | undefined, largeur: number): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== HOTE_LECLERC) return url;
    /* `func=fit` est conservé : c'est lui qui garde le rapport et ajoute du
       blanc plutôt que de rogner, ce que la grille en 2/3 attend. */
    u.searchParams.set("w", String(largeur));
    u.searchParams.set("h", String(largeur));
    return u.toString();
  } catch {
    /* URL que l'analyseur refuse : on rend la chaîne telle quelle plutôt que
       de faire disparaître un visuel qui s'affichait peut-être très bien. */
    return url;
  }
}
