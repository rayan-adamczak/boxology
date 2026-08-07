import { Link } from "react-router";
import { CornerDownLeft, Building2, Disc3, Tag, Layers } from "lucide-react";
import type { NomAxe } from "../lib/regroupements";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { lienFilm } from "../lib/liens";
import type { Film } from "../lib/reelio-db";
import type { Suggestion } from "../lib/suggestions";

/**
 * Le panneau de résultats qui tombe sous le champ de recherche.
 *
 * Structure reprise de SensCritique : on tape, la liste se remplit, on clique
 * un titre sans jamais valider. Ce que ça règle n'est pas cosmétique : le champ
 * du bandeau n'emmenait nulle part avant d'appuyer sur Entrée, donc chercher
 * depuis une fiche film coûtait une navigation avant même de savoir si le titre
 * existait au catalogue.
 *
 * **Le panneau ne fait aucune requête**, il rend ce qu'on lui passe. Sur
 * l'accueil et sur `/catalogue`, la page cherche déjà pour sa grille : lui
 * donner sa propre requête doublerait chaque frappe.
 *
 * Les puces de regroupement passent avant les films, contrairement à la page
 * où elles sont au-dessus de la grille pour la même raison : elles sont prêtes
 * sans requête, donc elles ne clignotent pas, et « Carlotta » n'a pas d'autre
 * réponse que sa page éditeur.
 */

/** Ce qu'un élément de la liste doit savoir pour être atteint au clavier. */
export interface ElementApercu {
  cle: string;
  href: string;
}

/**
 * La liste à plat, puces puis films, dans l'ordre où le clavier les parcourt.
 * Exportée pour que `ChampRecherche` compte les mêmes éléments que ceux rendus
 * ici : deux énumérations séparées se seraient décalées au premier changement
 * d'ordre.
 */
export function elementsApercu(suggestions: Suggestion[], films: Film[]): ElementApercu[] {
  return [
    ...suggestions.map((s) => ({ cle: `s:${s.href}`, href: s.href })),
    ...films.map((f) => ({ cle: `f:${f.id}`, href: lienFilm(f) ?? "/" })),
  ];
}

export function ApercuRecherche({
  idListe,
  terme,
  films,
  suggestions,
  chargement,
  approchante,
  place,
  plafond = 480,
  indexActif,
  onSurvol,
  onChoisir,
  onVoirTout,
}: {
  idListe: string;
  terme: string;
  films: Film[];
  suggestions: Suggestion[];
  chargement: boolean;
  approchante: boolean;
  /** Pixels disponibles sous le champ, mesurés. `null` avant la première mesure. */
  place: number | null;
  /**
   * Hauteur maximale du panneau. 480 sous un champ de page, où une liste plus
   * haute couvrirait tout ce qu'on est en train de lire ; la feuille du
   * téléphone, elle, n'a rien derrière et prend tout l'écran.
   */
  plafond?: number;
  /** -1 quand rien n'est sélectionné : Entrée vaut alors « voir tout ». */
  indexActif: number;
  onSurvol: (index: number) => void;
  onChoisir: () => void;
  onVoirTout: () => void;
}) {
  const elements = elementsApercu(suggestions, films);
  const vide = !chargement && elements.length === 0;

  return (
    <div
      /*
        Le `mousedown` est neutralisé sur tout le panneau, et c'est ce qui le
        fait fonctionner : sans ça le champ perd le focus au premier bouton de
        la souris, le panneau se démonte, et le `click` n'atteint jamais le lien
        qu'on visait. Neutraliser le `mousedown` garde le focus dans le champ,
        donc le panneau ouvert, et le clic suit son cours normalement.
      */
      onMouseDown={(e) => e.preventDefault()}
      className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-[14px]"
      style={{
        backgroundColor: "var(--reel-surface)",
        border: "1px solid var(--reel-border)",
        // Le panneau tombe sur la mosaïque d'affiches du héros : sans ombre
        // portée il flotte sans se détacher, et sans fond opaque il devient
        // illisible.
        boxShadow: "0 18px 48px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/*
        Le filet ne se monte que pendant une recherche, il n'est pas seulement
        masqué : une bande animée en permanence sous une opacité nulle fait
        repeindre le panneau pour rien, la même raison qui met l'animation de
        l'anneau de focus sur le seul état `focus-within`.
      */}
      {chargement && elements.length > 0 && (
        <div className="reel-filet-charge absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      )}

      {/*
        `place` est mesurée par le champ, jamais supposée : c'est ce qui garde
        le bouton du bas dans l'écran quel que soit l'endroit de la page où le
        champ se trouve. Les 52 px retirés sont la hauteur de ce bouton, qui ne
        défile pas avec la liste. Le plancher de 160 px borne le cas dégénéré
        d'une fenêtre très basse, où rien ne tiendrait de toute façon : la page
        défile alors, ce qui reste préférable à un panneau d'une seule ligne.
      */}
      <div
        id={idListe}
        role="listbox"
        aria-label="Résultats de la recherche"
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: Math.min(plafond, Math.max(160, (place ?? plafond) - 52)) }}
      >
        {chargement && elements.length === 0 && (
          /*
            L'attente porte les couleurs du mot-symbole plutôt qu'un rouet
            générique (`.reel-tranches` dans theme.css). Le `role="status"` la
            fait annoncer par un lecteur d'écran, que les trois barres, elles,
            n'atteignent pas : elles sont décoratives et rien d'autre.
          */
          <div
            role="status"
            className="flex items-center gap-3 px-4 py-5"
            style={{ color: "var(--reel-muted)", fontSize: "15px" }}
          >
            <span className="reel-tranches" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            Recherche…
          </div>
        )}

        {vide && (
          <p className="px-4 py-5" style={{ color: "var(--reel-muted)", fontSize: "15px" }}>
            Aucun résultat pour «&nbsp;{terme}&nbsp;».
          </p>
        )}

        {suggestions.length > 0 && (
          <Rubrique titre="Parcourir">
            {suggestions.map((s, i) => (
              <LigneApercu
                key={s.href}
                id={`${idListe}-${i}`}
                href={s.href}
                actif={indexActif === i}
                onSurvol={() => onSurvol(i)}
                onChoisir={onChoisir}
              >
                <IconeAxe axe={s.axe} />
                <span className="min-w-0">
                  <span className="block truncate" style={{ fontSize: "15px", color: "var(--reel-text)" }}>
                    {s.libelle}
                  </span>
                  <span className="block" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                    {s.intitule}
                  </span>
                </span>
              </LigneApercu>
            ))}
          </Rubrique>
        )}

        {films.length > 0 && (
          <Rubrique titre={approchante ? `Aucun titre exact, titres proches` : "Films et séries"}>
            {films.map((film, i) => {
              const index = suggestions.length + i;
              return (
                <LigneApercu
                  key={film.id}
                  id={`${idListe}-${index}`}
                  href={lienFilm(film) ?? "/"}
                  actif={indexActif === index}
                  onSurvol={() => onSurvol(index)}
                  onChoisir={onChoisir}
                >
                  {/*
                    56 × 84 et non 30 × 44 : c'est la jaquette qu'on cherche du
                    regard, pas le titre, et à 30 px de large elle ne montrait
                    ni le visage ni la typographie qui font reconnaître une
                    édition. C'est la taille employée par la liste d'éditions
                    d'une fiche film, donc une valeur déjà éprouvée du site.

                    **La hauteur du panneau ne bouge pas** : le plafond reste
                    calculé comme avant, ce sont les rangées qui grossissent,
                    donc il en tient moins à l'écran et la liste défile. C'est
                    l'arbitrage voulu, quatre résultats qu'on reconnaît valent
                    mieux que huit qu'on déchiffre.
                  */}
                  <span
                    className="h-[84px] w-[56px] shrink-0 overflow-hidden rounded-[6px]"
                    style={{ backgroundColor: "var(--reel-surface-2)" }}
                  >
                    <ImageWithFallback
                      src={film.affiche_url ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate" style={{ fontSize: "15px", color: "var(--reel-text)" }}>
                      {film.titre}
                    </span>
                    <span className="block truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                      {[film.annee, film.realisateur].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </LigneApercu>
              );
            })}
          </Rubrique>
        )}
      </div>

      {elements.length > 0 && (
        <button
          type="button"
          onClick={onVoirTout}
          className="flex w-full items-center justify-center gap-2 py-3 transition hover:brightness-125"
          style={{
            borderTop: "1px solid var(--reel-border)",
            backgroundColor: "var(--reel-surface-2)",
            color: "var(--reel-accent-clair)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Voir tous les résultats
          <CornerDownLeft size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * La vignette d'une puce, à la place de l'affiche qu'un film aurait.
 *
 * Une pastille de trois lettres avait été essayée d'abord, « Édi », « For » :
 * illisible, et surtout redondante avec l'intitulé écrit juste à côté. Un
 * rectangle **de la taille des affiches** garde l'alignement des deux
 * rubriques, sans quoi les puces et les films n'ont pas la même gouttière de
 * texte. Il suit donc les jaquettes quand elles changent de taille.
 */
function IconeAxe({ axe }: { axe: NomAxe }) {
  const Icone = { publishers: Building2, formats: Disc3, genres: Tag, collections: Layers }[axe];
  return (
    <span
      aria-hidden
      className="flex h-[84px] w-[56px] shrink-0 items-center justify-center rounded-[6px]"
      style={{ backgroundColor: "var(--reel-surface-2)" }}
    >
      <Icone size={20} color="var(--reel-muted)" />
    </span>
  );
}

function Rubrique({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <p
        className="px-4 pb-1 pt-2"
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--reel-muted)",
        }}
      >
        {titre}
      </p>
      <ul role="presentation">{children}</ul>
    </div>
  );
}

/**
 * `tabIndex={-1}` : la tabulation ne doit pas entrer dans la liste, c'est le
 * rôle des flèches (motif combobox). Le lien reste un vrai lien pour autant,
 * donc clic milieu, menu contextuel et annonce du lecteur d'écran fonctionnent.
 */
function LigneApercu({
  id,
  href,
  actif,
  onSurvol,
  onChoisir,
  children,
}: {
  id: string;
  href: string;
  actif: boolean;
  onSurvol: () => void;
  onChoisir: () => void;
  children: React.ReactNode;
}) {
  return (
    <li role="option" id={id} aria-selected={actif}>
      <Link
        to={href}
        tabIndex={-1}
        onMouseEnter={onSurvol}
        onClick={onChoisir}
        className="flex items-center gap-3 px-4 py-2"
        style={{ backgroundColor: actif ? "var(--reel-surface-2)" : "transparent" }}
      >
        {children}
      </Link>
    </li>
  );
}
