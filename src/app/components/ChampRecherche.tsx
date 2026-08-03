import { Search } from "lucide-react";

/**
 * Le champ de recherche, une seule fois pour tout le site.
 *
 * Il vit à trois endroits : le héros de l'accueil, la page Catalogue et le
 * bandeau. Trois copies auraient dérivé au premier réglage, et c'est déjà
 * arrivé sur la gouttière (§8) : le bandeau montait à `lg:px-16` là où le
 * contenu restait à `lg:px-10`.
 *
 * `reel-anneau-logo` porte l'anneau de focus aux couleurs du mot-symbole
 * (cf. theme.css). Ni `relative` ni `z-*` sur l'input : il passerait au-dessus
 * de la loupe, qui est en `absolute` sans empilement propre, et son fond opaque
 * l'effacerait.
 */
export function ChampRecherche({
  valeur,
  onChange,
  onValider,
  placeholder = "Rechercher un film…",
  taille = "grand",
  autoFocus = false,
  className = "",
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  /** Appelé sur Entrée. Sert au bandeau, qui emmène vers la page Catalogue. */
  onValider?: (valeur: string) => void;
  placeholder?: string;
  /** `grand` pour une page, `compact` pour le bandeau. */
  taille?: "grand" | "compact";
  autoFocus?: boolean;
  className?: string;
}) {
  const compact = taille === "compact";

  return (
    <label className={`reel-anneau-logo relative block w-full ${className}`}>
      <span className="sr-only">Rechercher un film par titre</span>
      <Search
        size={compact ? 18 : 22}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${compact ? "left-4" : "left-5"}`}
        color="var(--reel-muted)"
      />
      <input
        type="search"
        value={valeur}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onValider) {
            e.preventDefault();
            onValider(valeur);
          }
        }}
        placeholder={placeholder}
        className={`w-full rounded-full outline-none transition ${
          compact ? "py-2 pl-11 pr-4" : "py-4 pl-14 pr-5"
        }`}
        style={{
          backgroundColor: "var(--reel-surface)",
          border: "1px solid var(--reel-border)",
          color: "var(--reel-text)",
          fontSize: compact ? "15px" : "17px",
        }}
      />
    </label>
  );
}
