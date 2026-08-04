/**
 * L'attente d'une recherche, aux couleurs du mot-symbole.
 *
 * Deux formes, parce qu'il y a deux situations et qu'une seule ne couvre pas
 * les deux — c'est la règle déjà retenue pour le panneau d'aperçu (§7) :
 *
 *   `TranchesChargement`  rien à l'écran, première recherche. Trois tranches
 *                         qui montent en décalé, dans l'ordre du logo : le
 *                         dessin dit la même chose que la marque, des boîtiers
 *                         rangés sur une étagère.
 *   `FiletChargement`     une liste est déjà affichée et on l'affine. Sans lui,
 *                         affiner ne montrerait **rien** : les tranches ne
 *                         paraissent que tant que rien n'est affiché, et la
 *                         liste précédente resterait à l'écran comme si elle
 *                         était à jour.
 *
 * Sous `prefers-reduced-motion`, les deux restent visibles et immobiles : c'est
 * leur présence qui dit qu'on cherche, pas leur mouvement (cf. `theme.css`).
 */

/** Trois tranches animées, à poser à côté d'un libellé. Décoratif. */
export function TranchesChargement() {
  return (
    <span className="reel-tranches" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

/**
 * Le bloc d'attente d'une page : tranches et mot, annoncé aux lecteurs d'écran.
 *
 * `role="status"` porte l'annonce ; les barres sont `aria-hidden`, elles ne
 * sont que décoratives.
 */
export function AttenteRecherche({ libelle = "Recherche…" }: { libelle?: string }) {
  return (
    <div
      role="status"
      className="mt-5 flex items-center gap-3"
      style={{ color: "var(--reel-muted)", fontSize: "15px" }}
    >
      <TranchesChargement />
      {libelle}
    </div>
  );
}

/**
 * Le filet de 2 px, à poser en tête de la zone qui se rafraîchit.
 *
 * Il ne se monte que pendant une recherche, il n'est pas seulement masqué : une
 * bande animée en permanence sous une opacité nulle fait repeindre la page pour
 * rien, la même raison qui met l'animation de l'anneau de focus sur le seul
 * état `focus-within`.
 */
export function FiletChargement() {
  return <div className="reel-filet-charge absolute inset-x-0 top-0 h-[2px]" aria-hidden />;
}
