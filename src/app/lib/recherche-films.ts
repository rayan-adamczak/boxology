import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { searchFilms, type Film } from "./reelio-db";
import { suggestionsPour } from "./suggestions";

/**
 * La recherche de films, partagée par l'accueil et la page Catalogue.
 *
 * Deux pages portent le même champ depuis le 3 août 2026, et deux copies de
 * cette logique auraient dérivé : la temporisation, la règle d'historique et le
 * repli approchant sont trois réglages qu'on ne veut pas voir diverger d'une
 * page à l'autre.
 *
 * **Règle d'historique** : on empile une entrée quand la recherche s'ouvre ou
 * se ferme, on remplace tant qu'on l'affine. Empiler à chaque frappe rendrait
 * le bouton retour inutilisable ; toujours remplacer ferait quitter le site
 * depuis une recherche.
 */
export interface Recherche {
  /** Ce qui est tapé, y compris pendant la temporisation. */
  query: string;
  setQuery: (valeur: string) => void;
  /** Vrai dès qu'il y a autre chose que des espaces. */
  active: boolean;
  films: Film[];
  /** Les résultats viennent du repli par trigrammes, la frappe était fautive. */
  approchante: boolean;
  chargement: boolean;
  erreur: string | null;
  /** Éditeurs, formats et genres qui correspondent à la frappe, sans requête. */
  suggestions: ReturnType<typeof suggestionsPour>;
}

export function useRechercheFilms(): Recherche {
  const [parametres, setParametres] = useSearchParams();
  const qUrl = parametres.get("q") ?? "";

  const [query, setQuery] = useState(qUrl);
  const [films, setFilms] = useState<Film[]>([]);
  const [approchante, setApprochante] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  /*
    L'URL redevient la source quand elle change sans qu'on ait tapé : retour
    arrière, lien collé, onglet rouvert. Sans ça, le bouton retour changerait
    l'adresse sans rien changer à l'écran.
  */
  useEffect(() => {
    setQuery((actuel) => (actuel === qUrl ? actuel : qUrl));
  }, [qUrl]);

  const avaitUneRecherche = useRef(qUrl !== "");

  useEffect(() => {
    let annule = false;
    setChargement(true);
    setErreur(null);
    const t = setTimeout(async () => {
      if (query !== qUrl) {
        const bascule = avaitUneRecherche.current !== (query !== "");
        setParametres(query ? { q: query } : {}, { replace: !bascule });
        avaitUneRecherche.current = query !== "";
      }
      try {
        const resultat = await searchFilms(query);
        if (!annule) {
          setFilms(resultat.films);
          setApprochante(resultat.approchante);
        }
      } catch (e) {
        console.error(e);
        if (!annule) setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!annule) setChargement(false);
      }
    }, 250);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [query]);

  const active = query.trim().length > 0;

  /*
    Les puces de regroupement sont lues dans la table générée au build, donc
    sans requête, et se recalculent à chaque frappe sans temporisation : c'est
    ce qui les fait apparaître avant les films.
  */
  return {
    query,
    setQuery,
    active,
    films,
    approchante,
    chargement,
    erreur,
    suggestions: active ? suggestionsPour(query) : [],
  };
}
