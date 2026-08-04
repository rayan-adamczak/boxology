/**
 * L'attente d'une recherche, aux couleurs du mot-symbole.
 *
 * Trois tranches qui montent en décalé, dans l'ordre du logo : le dessin dit la
 * même chose que la marque, des boîtiers rangés sur une étagère.
 * Sur une page, elles paraissent au-dessus de la grille quand celle-ci est déjà
 * remplie et qu'on affine : la grille reste en place, sans quoi elle
 * clignoterait à chaque frappe.
 *
 * Un filet de 2 px en tête de grille a été essayé, comme dans le panneau, puis
 * retiré : sur toute la largeur d'une page il se lit comme un séparateur, pas
 * comme une attente.
 *
 * Sous `prefers-reduced-motion`, elles restent visibles et immobiles : c'est
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
