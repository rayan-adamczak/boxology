/**
 * Mot-symbole de jaquette.app.
 *
 * Trois « j » décalés, lus comme les tranches d'une étagère : cyan, ambre,
 * rouge. Dessiné dans Figma (node 54:145), tracés identiques à ceux de
 * `public/logo.svg` et `public/favicon.svg`. Toute retouche vaut pour les
 * trois : il n'y a pas de source unique, un `<img>` ne pouvant pas hériter de
 * la taille de texte du bandeau aussi simplement.
 *
 * **Le « j » blanc de tête a été retiré le 3 août 2026.** Il portait le seul
 * point du dessin, donc la variante à trois tranches n'a plus de point du
 * tout : le cadrage part du haut des fûts, pas du haut du point, et le
 * `viewBox` est recadré en conséquence plutôt que de garder du vide à gauche
 * et en haut. Un `viewBox` inchangé aurait laissé le motif décalé dans sa
 * boîte, ce qui se voit dès qu'on l'aligne sur du texte.
 *
 * En SVG en ligne et non en `<img src="/logo.svg">` : le fichier n'est pas
 * haché, donc il traverserait le cache d'un déploiement à l'autre, et une
 * requête de plus sur le chemin de rendu du bandeau se voit au premier écran.
 *
 * Les couleurs sont en dur, jamais en jetons du thème : un logo ne suit pas la
 * couleur d'accent du site, il la précède.
 *
 * `aria-hidden` par défaut : les deux appelants (bandeau, pied de page) sont des
 * liens qui portent déjà `aria-label="Accueil jaquette.app"`, et le mot-symbole
 * est écrit en toutes lettres juste à côté. Le nommer une troisième fois ferait
 * répéter « jaquette.app » trois fois à un lecteur d'écran.
 */
export function Logo({ hauteur = 18, className }: { hauteur?: number; className?: string }) {
  /* Une seule dimension pilotée, la hauteur ; la largeur suit le rapport natif,
     92,3604 × 111,8802. Même règle que la visionneuse : c'est ce qui rend la
     déformation impossible. */
  const largeur = (hauteur * 92.3604) / 111.8802;

  return (
    <svg
      viewBox="28.5596 33.7028 92.3604 111.8802"
      width={largeur}
      height={hauteur}
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path fill="#FB4412" d="M91.5269 145.583C90.9114 145.583 90.2445 145.531 89.5263 145.429C88.9107 145.429 88.2439 145.326 87.5257 145.121L85.679 126.192C90.3984 126.192 93.7327 125.423 95.682 123.884C97.7339 122.345 98.7599 119.267 98.7599 114.65V33.7028H120.92V115.266C120.92 120.601 120.254 125.166 118.92 128.962C117.689 132.861 115.842 135.99 113.38 138.35C110.917 140.812 107.84 142.607 104.146 143.736C100.555 144.967 96.3489 145.583 91.5269 145.583Z" />
      <path fill="#FFB000" d="M62.9672 145.583C62.3517 145.583 61.6848 145.531 60.9666 145.429C60.3511 145.429 59.6842 145.326 58.966 145.121L57.1193 126.192C61.8387 126.192 65.173 125.423 67.1223 123.884C69.1742 122.345 70.2002 119.267 70.2002 114.65V33.7028H92.3607V115.266C92.3607 120.601 91.6938 125.166 90.3601 128.962C89.129 132.861 87.2823 135.99 84.82 138.35C82.3577 140.812 79.2798 142.607 75.5864 143.736C71.9956 144.967 67.7892 145.583 62.9672 145.583Z" />
      <path fill="#00BCED" d="M34.4075 145.583C33.792 145.583 33.1251 145.531 32.4069 145.429C31.7914 145.429 31.1245 145.326 30.4063 145.121L28.5596 126.192C33.279 126.192 36.6133 125.423 38.5626 123.884C40.6145 122.345 41.6405 119.267 41.6405 114.65V33.7028H63.801V115.266C63.801 120.601 63.1342 125.166 61.8004 128.962C60.5693 132.861 58.7226 135.99 56.2603 138.35C53.798 140.812 50.7201 142.607 47.0267 143.736C43.4359 144.967 39.2295 145.583 34.4075 145.583Z" />
    </svg>
  );
}
