import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Métadonnées de référencement, appliquées au <head> à chaque changement de route.
 *
 * Le site est une SPA : un seul index.html sert toutes les URL. Sans ce hook,
 * les 2 227 fiches films héritent du titre, de la description et du canonical
 * de la page d'accueil, et Google les traite comme des doublons de la racine.
 *
 * Le canonical est calculé depuis l'URL courante, pas passé par l'appelant :
 * une faute de frappe dans une page enverrait le signal sur la mauvaise URL.
 */

export const SITE_ORIGIN = "https://jaquette.app";
/* Le `.app` fait partie du nom, ce n'est pas seulement l'adresse : « jaquette »
   seul est un nom commun, l'extension est ce qui distingue la marque. Le
   suffixe des titres et le mot-symbole disent donc la même chose. */
export const SITE_NAME = "jaquette.app";

export interface Seo {
  /** Contenu de <title>. Le suffixe « | jaquette.app » est ajouté sauf sur l'accueil. */
  titre: string;
  description: string;
  /** Image de partage (og:image). Absolue. */
  image?: string | null;
  /** og:type, « website » par défaut, « video.movie » pour une fiche film. */
  type?: string;
  /** Retire la page des moteurs : listes personnelles, écrans de prototype. */
  noindex?: boolean;
  /** true sur l'accueil, pour ne pas produire « jaquette.app | jaquette.app ». */
  racine?: boolean;
}

/** Crée la balise si elle manque, sinon met à jour celle qui existe. */
function baliseMeta(cle: "name" | "property", valeur: string, contenu: string | null) {
  const selecteur = `meta[${cle}="${valeur}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selecteur);

  if (contenu === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(cle, valeur);
    document.head.appendChild(el);
  }
  el.setAttribute("content", contenu);
}

function baliseCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Tronque proprement une description à la longueur utile en SERP (~160 signes),
 * sur une frontière de mot, sans couper au milieu.
 */
export function extrait(texte: string | null | undefined, max = 160): string {
  if (!texte) return "";
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > max / 2 ? coupe.slice(0, espace) : coupe).replace(/[.,;:—-]$/, "")}…`;
}

export function useSeo(seo: Seo | null) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Pendant le chargement des données, on laisse le <head> tel quel plutôt
    // que d'afficher un titre provisoire qu'un crawler pourrait capturer.
    if (!seo) return;

    // Le canonical ignore query et hash : ?page=2 ou #cast ne sont pas des
    // pages distinctes, et une URL sans slash final évite un second doublon.
    const chemin = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const canonical = `${SITE_ORIGIN}${chemin}`;

    const titre = seo.racine ? seo.titre : `${seo.titre} | ${SITE_NAME}`;

    document.title = titre;
    baliseCanonical(canonical);

    baliseMeta("name", "description", seo.description);
    baliseMeta("name", "robots", seo.noindex ? "noindex, follow" : null);

    baliseMeta("property", "og:title", titre);
    baliseMeta("property", "og:description", seo.description);
    baliseMeta("property", "og:url", canonical);
    baliseMeta("property", "og:type", seo.type ?? "website");
    baliseMeta("property", "og:image", seo.image ?? null);
    baliseMeta("name", "twitter:card", seo.image ? "summary_large_image" : "summary");
  }, [seo?.titre, seo?.description, seo?.image, seo?.type, seo?.noindex, seo?.racine, pathname]);
}
