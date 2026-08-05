/**
 * L'attente du site, aux couleurs du mot-symbole.
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
 *
 * **C'est le seul indicateur d'attente du site.** Le rouet `Loader2` de lucide
 * subsistait à sept endroits, dont l'attente de fragment de page et celle d'une
 * fiche film : un disque qui tourne aurait pu venir de n'importe quel site,
 * c'est précisément ce que ces tranches s'emploient à ne pas faire. Ne pas en
 * réintroduire.
 */

/**
 * Trois tranches animées, à poser à côté d'un libellé. Décoratif.
 *
 * `hauteur` est celle du bloc, les tranches la remplissent : 16 px auprès d'un
 * texte, 32 quand elles occupent seules le centre d'un écran d'attente. Elle est
 * posée en ligne plutôt que par une variante de classe, la règle CSS ne portant
 * qu'un défaut.
 *
 * **La largeur suit la hauteur**, au quart, comme la proportion du mot-symbole.
 * À 4 px fixes, trois barres au centre d'un écran vide se lisaient comme une
 * poussière ; c'est le rapport qui fait reconnaître le logo, pas la taille.
 */
export function TranchesChargement({ hauteur = 16 }: { hauteur?: number }) {
  return (
    <span
      className="reel-tranches"
      style={{ height: hauteur, "--reel-tranche-l": `${hauteur / 4}px` } as React.CSSProperties}
      aria-hidden
    >
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
 * L'attente qui occupe tout un écran : centrée, jamais dans le coin.
 *
 * C'est la forme à employer dès que le contenu n'est pas encore là, page,
 * panneau ou modale. Un indicateur posé en haut à gauche se lit comme une ligne
 * de plus dans une page vide ; au centre, il se lit comme ce qu'il est, la place
 * que le contenu prendra.
 *
 * `hauteur` est celle de la zone d'attente, pas des tranches : 320 px pour un
 * bloc de page, `"60vh"` quand c'est l'écran entier qui attend, moins pour une
 * modale, dont la boîte est déjà petite. Elle est *minimale* : le bloc grandit
 * si son conteneur est plus grand, sans quoi le centrage se ferait sur 320 px au
 * milieu d'un écran de 900. Une chaîne y passe telle quelle, pour les unités
 * relatives, qu'un `window.innerHeight` lu au rendu ne saurait pas suivre.
 *
 * Volontairement sans libellé visible. Trois tranches colorées et animées disent
 * déjà « ça charge » ; un « Chargement… » à côté ne fait que répéter, et il n'y a
 * rien à lire sur un écran qui n'a pas encore de contenu. Les lecteurs d'écran,
 * eux, l'obtiennent par le texte masqué, faute de quoi le `role="status"`
 * n'annoncerait rien, les tranches étant `aria-hidden`.
 */
export function AttentePleine({
  hauteur = 320,
  libelle = "Chargement…",
}: {
  hauteur?: number | string;
  libelle?: string;
}) {
  return (
    <div
      role="status"
      className="flex w-full flex-1 items-center justify-center"
      style={{ minHeight: hauteur }}
    >
      <TranchesChargement hauteur={32} />
      <span className="sr-only">{libelle}</span>
    </div>
  );
}
