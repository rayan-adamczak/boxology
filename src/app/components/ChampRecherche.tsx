import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { ApercuRecherche, elementsApercu } from "./ApercuRecherche";
import type { Film } from "../lib/reelio-db";
import type { Suggestion } from "../lib/suggestions";

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
 *
 * **Le panneau d'aperçu est facultatif et fourni de l'extérieur.** L'accueil et
 * `/catalogue` cherchent déjà pour leur grille : leur donner une seconde
 * requête doublerait chaque frappe. Le bandeau, lui, n'a pas de grille, il
 * apporte donc la sienne (`useApercuFilms`).
 */

export interface Apercu {
  films: Film[];
  suggestions: Suggestion[];
  chargement: boolean;
  approchante: boolean;
}

export function ChampRecherche({
  valeur,
  onChange,
  onValider,
  apercu,
  apercuPlafond,
  placeholder = "Rechercher un film…",
  taille = "grand",
  autoFocus = false,
  className = "",
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  /** Appelé sur Entrée sans sélection, et par « Voir tous les résultats ». */
  onValider?: (valeur: string) => void;
  /** Absent = pas de panneau, le champ se comporte comme avant. */
  apercu?: Apercu;
  /** Hauteur maximale du panneau. La feuille du téléphone la relève, elle n'a rien derrière. */
  apercuPlafond?: number;
  placeholder?: string;
  /** `grand` pour une page, `compact` pour le bandeau. */
  taille?: "grand" | "compact";
  autoFocus?: boolean;
  className?: string;
}) {
  const compact = taille === "compact";
  const idListe = useId();
  const navigate = useNavigate();

  const ancre = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  /** -1 = rien de sélectionné, Entrée vaut alors « voir tous les résultats ». */
  const [index, setIndex] = useState(-1);

  const terme = valeur.trim();
  const elements = apercu ? elementsApercu(apercu.suggestions, apercu.films) : [];
  const visible = Boolean(apercu) && ouvert && terme.length > 0;

  /*
    La sélection retombe à -1 dès que la liste change sous elle. Sans ça, le
    troisième élément d'un lot reste « sélectionné » pendant que la frappe
    suivante en amène d'autres, et Entrée ouvre une fiche que personne n'a
    désignée.
  */
  useEffect(() => setIndex(-1), [terme, elements.length]);

  const fermer = () => {
    setOuvert(false);
    setIndex(-1);
  };

  /*
    Le panneau prend la place qui reste sous le champ, il ne la suppose pas.

    Un plafond fixe ne peut pas marcher : le même composant sert un champ à
    250 px du haut sur `/catalogue` et un autre à 560 px dans le héros de
    l'accueil, et la fenêtre fait 760 px de haut sur un téléphone. Mesuré avec
    un plafond de `min(60vh, 480px)`, le bouton « voir tous les résultats »
    tombait 60 px sous le bord de l'écran, donc invisible et inatteignable.

    La mesure est refaite au défilement et au redimensionnement tant que le
    panneau est ouvert : le clavier logiciel d'un téléphone change la hauteur
    de la fenêtre en s'ouvrant, et c'est précisément le moment où le panneau
    est là.
  */
  const [place, setPlace] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const mesurer = () => {
      const boite = ancre.current?.getBoundingClientRect();
      if (boite) setPlace(window.innerHeight - boite.bottom - 16);
    };
    mesurer();
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      window.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, [visible]);

  /*
    **Faire remonter le champ sous le bandeau a été essayé, et c'est impossible
    ici.** L'accueil et `/catalogue` écrivent la frappe dans l'URL, chaque
    frappe produit donc une `location.key` neuve, et `GestionDefilement`
    (`App.tsx`) remet la page en haut à chaque navigation qui n'est pas un
    retour arrière. Le `scrollBy` était défait dans la foulée, sans rien
    signaler. Mesuré : le champ restait à 250 px du haut, exactement là où il
    était avant l'appel.

    Ce n'est pas un manque : puisque la page est ramenée en haut, le champ est
    toujours à sa position naturelle, et la mesure ci-dessus suffit.
  */

  const clavier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      /*
        `preventDefault` est indispensable ici, et il ne se devine pas :
        Chrome **vide** un `input type="search"` sur Échap, c'est son
        comportement natif. Mesuré, le champ repartait à zéro alors qu'on
        voulait seulement dégager le panneau de l'œil. Le ✕ du champ reste là
        pour ceux qui veulent effacer.
      */
      e.preventDefault();
      fermer();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (visible && index >= 0) {
        navigate(elements[index].href);
        fermer();
        return;
      }
      fermer();
      onValider?.(valeur);
      return;
    }
    if (!visible || elements.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Sinon le curseur file au début ou à la fin du texte pendant qu'on
      // parcourt la liste.
      e.preventDefault();
      const pas = e.key === "ArrowDown" ? 1 : -1;
      // On repasse par -1 en bout de liste : c'est ce qui rend le champ lui-même
      // atteignable au clavier, donc « chercher tout » de nouveau accessible.
      const total = elements.length + 1;
      setIndex((i) => ((i + 1 + pas + total) % total) - 1);
    }
  };

  return (
    <div ref={ancre} className={`relative w-full ${className}`}>
      <label className="reel-anneau-logo relative block w-full">
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
          onChange={(e) => {
            onChange(e.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          /*
            Le panneau neutralise le `mousedown`, donc cliquer dedans ne fait
            pas perdre le focus : ce `blur` ne se déclenche que pour un vrai
            clic à l'extérieur, et il n'y a aucun écouteur de document à poser.
          */
          onBlur={fermer}
          onKeyDown={clavier}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={visible}
          aria-controls={idListe}
          aria-autocomplete="list"
          aria-activedescendant={visible && index >= 0 ? `${idListe}-${index}` : undefined}
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

      {visible && apercu && (
        <ApercuRecherche
          idListe={idListe}
          terme={terme}
          films={apercu.films}
          suggestions={apercu.suggestions}
          chargement={apercu.chargement}
          approchante={apercu.approchante}
          place={place}
          plafond={apercuPlafond}
          indexActif={index}
          onSurvol={setIndex}
          onChoisir={fermer}
          onVoirTout={() => {
            fermer();
            onValider?.(valeur);
          }}
        />
      )}
    </div>
  );
}
