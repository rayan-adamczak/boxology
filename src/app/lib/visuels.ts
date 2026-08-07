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
 *
 * ---------------------------------------------------------------------------
 *
 * **Deux hôtes depuis le 7 août 2026, et c'est le même marchand.** Filerobot
 * est le CDN qui sert `media.e.leclerc` ; la passe Awin du 6 août a écrit 436
 * offres sous son nom brut plutôt que sous le nom de marque, et le §3 en garde
 * la trace, c'est aussi ce qui les faisait refuser par la CSP. Mesuré, les deux
 * hôtes rendent le même fichier à l'octet près à taille égale :
 *
 *     media.e.leclerc        w=200  67 438 o     w=400  247 632 o
 *     fgellaobb.filerobot    w=200  66 381 o     w=400  249 553 o
 *
 * Sans cette entrée, ces 436 offres tiraient l'original, **203 757 octets pour
 * un cadre de 56 × 84**, soit le défaut d'origine rouvert par un second nom.
 *
 * **128 des 436 n'ont pas de point d'interrogation**, le flux ayant écrit
 * `…/<EAN>_1&w=1000&h=1000&func=fit&org_if_sml=1` sans le premier séparateur.
 * Ces paramètres-là sont donc dans le **chemin**, et ils sont **inertes** :
 * vérifié, remplacer `w=1000` par `w=200` dedans rend le même fichier à l'octet
 * près, 203 757 o en 600 × 813. Le CDN les lit comme une partie du nom.
 *
 * Ce qui les rétrécit est d'ajouter une vraie chaîne de requête par-dessus, ce
 * que `searchParams.set` fait tout seul puisqu'il n'y en a aucune :
 *
 *     …&org_if_sml=1?w=200&h=200&func=fit   ->  200 × 200, 66 381 o
 *
 * D'où le `func=fit` posé **seulement quand il manque**, et jamais écrasé : il
 * est présent dans la requête des 2 973 autres, absent sur ces 128 exactement,
 * et l'imposer partout écraserait un jour un `func` que la source aurait voulu
 * autre. Sans lui on dépend d'un défaut de CDN non documenté ; avec lui le
 * rapport est gardé et le complément est du blanc, ce que la grille en 2/3
 * attend.
 */
const HOTES_LECLERC = new Set(["media.e.leclerc", "fgellaobb.filerobot.com"]);

export function vignette(url: string | null | undefined, largeur: number): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!HOTES_LECLERC.has(u.hostname)) return url;
    u.searchParams.set("w", String(largeur));
    u.searchParams.set("h", String(largeur));
    if (!u.searchParams.has("func")) u.searchParams.set("func", "fit");
    return u.toString();
  } catch {
    /* URL que l'analyseur refuse : on rend la chaîne telle quelle plutôt que
       de faire disparaître un visuel qui s'affichait peut-être très bien. */
    return url;
  }
}
