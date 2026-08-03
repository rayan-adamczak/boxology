import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { searchFilms, type Film } from "./reelio-db";
import { suggestionsPour } from "./suggestions";
import {
  chercherCatalogue,
  ecrireFiltres,
  lireFiltres,
  filtresActifs,
  type Filtres,
} from "./catalogue-filtres";

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
  /** Filtres lus dans l'URL. Vides sur les pages qui n'en proposent pas. */
  filtres: Filtres;
  /** Pose ou retire un filtre, et le reporte dans l'URL. */
  setFiltre: <K extends keyof Filtres>(cle: K, valeur: Filtres[K]) => void;
  effacerFiltres: () => void;
  nbFiltres: number;
  /** Le filtre par édition a buté sur le plafond de 1 000 lignes de PostgREST. */
  tronque: boolean;
}

/**
 * @param avecFiltres la page porte-t-elle la barre de filtres ? L'accueil ne
 * l'a pas : ses paramètres d'URL ne doivent pas se mettre à filtrer sa grille
 * parce qu'un lien collé traînait un `?genre=`.
 */
/**
 * Recherche autonome, pour le champ du bandeau.
 *
 * `useRechercheFilms` ne convient pas là : il écrit la frappe dans l'URL, ce
 * qui remplacerait le `?q=` de la page qu'on est en train de lire, et il porte
 * l'état d'une grille que le bandeau n'a pas.
 *
 * Même temporisation que la recherche de page, à dessein : deux cadences
 * différentes pour le même geste se remarquent d'un champ à l'autre.
 *
 * Le plafond est à huit lignes, pas cinquante : le panneau tombe sous le champ
 * et doit tenir à l'écran, et personne ne fait défiler une liste d'aperçu
 * jusqu'à sa cinquantième entrée.
 */
export function useApercuFilms(saisie: string) {
  const terme = saisie.trim();
  const [films, setFilms] = useState<Film[]>([]);
  const [approchante, setApprochante] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!terme) {
      setFilms([]);
      setApprochante(false);
      setChargement(false);
      return;
    }
    let annule = false;
    setChargement(true);
    const t = setTimeout(async () => {
      try {
        const resultat = await searchFilms(terme, 8);
        if (!annule) {
          setFilms(resultat.films);
          setApprochante(resultat.approchante);
        }
      } catch (e) {
        // L'échec est muet : un panneau d'aperçu qui affiche une erreur rouge
        // sous le bandeau serait plus alarmant qu'utile, et la page de
        // résultats, elle, dira ce qui ne va pas.
        console.warn("Aperçu de recherche indisponible", e);
        if (!annule) setFilms([]);
      } finally {
        if (!annule) setChargement(false);
      }
    }, 250);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [terme]);

  return { films, approchante, chargement, suggestions: terme ? suggestionsPour(terme) : [] };
}

export function useRechercheFilms(avecFiltres = false): Recherche {
  const [parametres, setParametres] = useSearchParams();
  const qUrl = parametres.get("q") ?? "";

  const [query, setQuery] = useState(qUrl);
  const [films, setFilms] = useState<Film[]>([]);
  const [approchante, setApprochante] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tronque, setTronque] = useState(false);

  const filtres = avecFiltres ? lireFiltres(parametres) : {};
  const nbFiltres = filtresActifs(filtres);
  // Sérialisés pour servir de dépendance d'effet : un objet neuf à chaque rendu
  // relancerait la requête en boucle.
  const cleFiltres = JSON.stringify(filtres);

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
        const resultat = avecFiltres
          ? await chercherCatalogue(query, filtres)
          : { ...(await searchFilms(query)), tronque: false };
        if (!annule) {
          setFilms(resultat.films);
          setApprochante(resultat.approchante);
          setTronque(resultat.tronque);
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
  }, [query, cleFiltres]);

  const active = query.trim().length > 0;

  /*
    Les puces de regroupement sont lues dans la table générée au build, donc
    sans requête, et se recalculent à chaque frappe sans temporisation : c'est
    ce qui les fait apparaître avant les films.
  */
  const setFiltre: Recherche["setFiltre"] = (cle, valeur) => {
    // `replace` : affiner un filtre n'est pas une nouvelle page, et empiler une
    // entrée par sélection rendrait le bouton retour inutilisable, même règle
    // que pour la frappe.
    setParametres(ecrireFiltres({ ...filtres, [cle]: valeur }, query.trim()), { replace: true });
  };

  return {
    query,
    setQuery,
    filtres,
    setFiltre,
    effacerFiltres: () => setParametres(ecrireFiltres({}, query.trim()), { replace: true }),
    nbFiltres,
    tronque,
    active,
    films,
    approchante,
    chargement,
    erreur,
    suggestions: active ? suggestionsPour(query) : [],
  };
}
