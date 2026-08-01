/**
 * Pages Function exécutée à la périphérie, avant que Cloudflare serve la page.
 *
 * Le site est une SPA : `public/_redirects` sert le même `index.html` pour
 * toutes les URL, et `useSeo` pose titre, description et `og:` une fois le
 * JavaScript exécuté. Un moteur qui ne rend pas le JavaScript (Bing, les
 * aperçus de Facebook, iMessage, Discord) ne voit donc jamais que la coquille
 * générique. Google, lui, rend, mais avec une file d'attente de plusieurs jours
 * qui se voit dans la Search Console sur un catalogue de 3 349 fiches.
 *
 * Ce fichier répond à quatre choses, dans cet ordre :
 *
 *   1. l'URL canonique d'une fiche est `/movies/<slug>/<id>` ; toute autre forme
 *      est redirigée en 301 vers elle ;
 *   2. un id qui n'existe pas répond un vrai 404, là où la réécriture SPA
 *      répondait 200 sur une page vide, un « soft 404 » aux yeux de Google ;
 *   3. le `<head>` est rempli au vol par `HTMLRewriter`, avec les mêmes valeurs
 *      que celles que `useSeo` posera ensuite côté client ;
 *   4. le corps est écrit dans `#root`, pour qu'un moteur qui n'exécute pas le
 *      JavaScript ait enfin du texte à lire (voir `corpsFilm`).
 *
 * Règle de conduite : **ce code ne doit jamais pouvoir casser le site.** Une
 * panne de Supabase, une réponse inattendue, une exception quelconque retombent
 * toutes sur `next()`, c'est-à-dire sur le comportement d'avant. Le §9 de
 * CLAUDE.md garde la trace de deux mises à terre en une seule journée ; on
 * n'ajoute pas un troisième point de rupture sur le chemin de consultation.
 */

/**
 * La table des slugs est **importée**, pas recopiée.
 *
 * `regroupements.ts` est généré et ne dépend de rien : ni React, ni navigateur.
 * Les Pages Functions passent par esbuild, donc l'import fonctionne, et
 * l'application comme la périphérie lisent la même liste. Une seconde copie ici
 * dériverait au premier ajout d'éditeur, et la dérive serait invisible.
 */
import { AXES, trouver, type NomAxe } from "../src/app/lib/regroupements";
/* Même module que l'application, pour que les adresses et la fenêtre de
   numéros servies soient exactement celles qu'elle rendra ensuite. */
import { PAR_PAGE, cheminPage, fenetrePages, nombreDePages } from "../src/app/lib/pagination";
/* Adresses en anglais depuis le 1er août 2026, et redirections depuis leurs
   anciennes formes françaises. Même module que l'application, pour que les
   301 pointent exactement là où elle sait aller. */
import { BASE_FILMS, redirectionDe } from "../src/app/lib/chemins";
/* Le contenu de `/about`. Même module que la page React, donc le corps servi
   et ce qu'elle affiche ne peuvent pas diverger. */
import { FAQ, toutesLesQuestions } from "../src/app/lib/faq";

/* Types minimaux : @cloudflare/workers-types n'est pas installé, et le
   `tsconfig.json` ne couvre pas ce dossier. Ce qui est déclaré ici est le peu
   qu'on utilise réellement. */
interface Contexte {
  request: Request;
  next: () => Promise<Response>;
}
declare const HTMLRewriter: {
  new (): {
    on(selecteur: string, gestionnaire: Record<string, unknown>): any;
    transform(reponse: Response): Response;
  };
};

const PROJET = "rndyusuyfkrojpazjsll";
/* Clé anon, publique par nature : elle est déjà dans le bundle servi au
   navigateur. Les policies RLS sont ce qui protège la base, pas son secret. */
const CLE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZHl1c3V5Zmtyb2pwYXpqc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzUyOTgsImV4cCI6MjEwMDY1MTI5OH0.-3icGSpc8-oms1B2NHaRN-HJl_iyd4x88kNf8IE8WeU";

const SITE_NOM = "jaquette.app";

/** Durée de cache de la lecture Supabase, à la périphérie. */
const CACHE_SECONDES = 3600;

interface EditionSeo {
  id: number;
  titre: string | null;
  ean: string | null;
  image_url: string | null;
  editeur: string | null;
  date_parution: string | null;
  formats_extraits: string[] | null;
}

interface FilmSeo {
  id: number;
  titre: string;
  titre_original: string | null;
  /** `film`, `serie` ou `coffret`. Décide entre Movie et TVSeries. */
  type: string | null;
  annee: string | number | null;
  duree: number | null;
  note: string | number | null;
  nb_votes: number | null;
  realisateur: string | null;
  scenariste: string | null;
  genres: string[] | null;
  pays: string[] | null;
  date_sortie: string | null;
  imdb_id: string | null;
  synopsis: string | null;
  affiche_url: string | null;
  slug: string | null;
  edition_films: { edition: EditionSeo | null }[];
}

/**
 * Tronque à la longueur utile en page de résultats, sur une frontière de mot.
 *
 * Recopié de `src/app/lib/seo.ts` plutôt qu'importé : ce module tire
 * `react-router`, qui n'a rien à faire dans un Worker. Les deux doivent rendre
 * le même texte, sinon le `<head>` servi et celui posé au rendu diffèrent.
 */
function extrait(texte: string | null | undefined, max = 160): string {
  if (!texte) return "";
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > max / 2 ? coupe.slice(0, espace) : coupe).replace(/[.,;:—-]$/, "")}…`;
}

/** Lit le film et les éditions qui lui sont rattachées, ou null. */
async function lireFilm(id: number): Promise<FilmSeo | null> {
  /* Les éditions passent par `edition_films` et non par `editions.film_id` : la
     colonne est un vestige, le rattachement vit dans la table de liens
     (cf. `getEditionsForFilm`). Les embarquer ici évite un second aller-retour,
     et le même appel sert au décompte de la description et au JSON-LD. */
  const champsFilm =
    "id,titre,titre_original,type,annee,duree,note,nb_votes,realisateur," +
    "scenariste,genres,pays,date_sortie,imdb_id,synopsis,affiche_url,slug";
  const champsEdition = "id,titre,ean,image_url,editeur,date_parution,formats_extraits";

  const url =
    `https://${PROJET}.supabase.co/rest/v1/films` +
    `?id=eq.${id}&limit=1` +
    `&select=${champsFilm},edition_films(edition:editions(${champsEdition}))`;

  const reponse = await fetch(url, {
    headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}` },
    /* Cache de périphérie : un crawler qui parcourt le catalogue ne doit pas
       déclencher une requête Supabase par page vue. */
    cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
  } as RequestInit);

  if (!reponse.ok) throw new Error(`films ${id} : HTTP ${reponse.status}`);
  const lignes = (await reponse.json()) as FilmSeo[];
  return lignes.length > 0 ? lignes[0] : null;
}

/** Les éditions réellement rattachées, jointures vides écartées. */
function editionsDe(film: FilmSeo): EditionSeo[] {
  return (film.edition_films ?? []).map((l) => l?.edition).filter(Boolean) as EditionSeo[];
}

/** Métadonnées d'une fiche film, alignées sur celles de `FilmDetailPage`. */
function metadonnees(film: FilmSeo) {
  /* Espace ordinaire, comme `FilmDetailPage.tsx:343` : ce titre-ci part dans
     `<title>` et dans la description, où `useSeo` écrit la même chaîne. Le
     `<h1>` du corps, lui, prend deux insécables (voir `corpsFilm`). */
  const annee = film.annee ? ` (${film.annee})` : "";
  const nb = editionsDe(film).length;

  const description = film.synopsis
    ? extrait(film.synopsis)
    : nb > 0
    ? `${nb} édition${nb > 1 ? "s" : ""} de ${film.titre}${annee} recensée${nb > 1 ? "s" : ""} : formats, zones, dates de sortie et codes-barres.`
    : `Les éditions Blu-ray, 4K et coffrets de ${film.titre}${annee}.`;

  return {
    titre: `${film.titre}${annee}, éditions Blu-ray, 4K et coffrets | ${SITE_NOM}`,
    description,
    image: film.affiche_url,
  };
}

/** Chemin canonique d'une fiche. Sans slug, la forme nue reste valable. */
function cheminCanonique(film: FilmSeo): string {
  return film.slug ? `${BASE_FILMS}/${film.slug}/${film.id}` : `${BASE_FILMS}/${film.id}`;
}

/** Texte vers HTML. `setInnerContent(..., {html:true})` n'échappe rien. */
function echapper(texte: unknown): string {
  return String(texte ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Contenu servi dans `#root`, avant que React démarre.
 *
 * Le `<head>` était rempli depuis le 31 juillet, mais le corps restait à
 * 48 octets : `<div id="root"></div>` et rien d'autre. Un moteur qui n'exécute
 * pas le JavaScript n'avait donc aucun texte à lire, et une fiche ne pouvait
 * pas répondre à « dune steelbook 4k » alors que la page porte la réponse.
 *
 * **Ce n'est pas du cloaking** : on écrit ce que React affiche, pas une version
 * enrichie pour les moteurs. `createRoot().render()` remplace ce contenu au
 * montage, donc le visiteur voit l'application habituelle.
 *
 * Les jetons de couleur viennent de la feuille de style, qui est bloquante et
 * donc déjà appliquée quand le corps peint : pas d'éclair blanc avant React.
 *
 * Écrit plutôt que rendu : construire ce HTML depuis les composants React
 * supposerait un rendu serveur, donc React dans le Worker. Le prix, c'est que
 * ce bloc et `FilmDetailPage` doivent dire la même chose. Il reste volontairement
 * pauvre pour que la dérive soit lente : titre, réalisation, note, synopsis,
 * liste des éditions. Rien qui demande une mise en forme.
 */
function corpsFilm(film: FilmSeo): string {
  const editions = editionsDe(film);
  const note = Number(film.note);
  const votes = Number(film.nb_votes);
  /* Deux espaces insécables et des parenthèses, comme le héros de
     `FilmDetailPage` : à cette taille l'espace ordinaire est trop serrée et
     l'année colle au dernier mot. Sur un titre qui est lui-même un nombre,
     « 1917 2019 », les parenthèses sont ce qui empêche de lire une seule
     valeur. */
  const annee = film.annee ? `\u00a0\u00a0(${film.annee})` : "";

  const lignes: string[] = [];
  if (film.realisateur) lignes.push(`Réalisé par ${echapper(film.realisateur)}`);
  if (Number.isFinite(note) && note > 0) {
    const arrondie = (Math.round(note * 100) / 100).toString().replace(".", ",");
    lignes.push(
      Number.isFinite(votes) && votes > 0
        ? `Note ${arrondie} sur 10, ${votes} votes`
        : `Note ${arrondie} sur 10`,
    );
  }
  if (film.duree) lignes.push(`${film.duree} minutes`);
  if (film.genres?.length) lignes.push(echapper(film.genres.join(", ")));

  /* Toutes les éditions, sans plafond : le plus fourni du catalogue en porte
     61, et deux films seulement dépassent 30. Tronquer coûterait plus en
     exactitude que ça ne gagnerait en octets. */
  const items = editions.map((e) => {
    const details = [
      e.formats_extraits?.length ? echapper(e.formats_extraits.join(", ")) : null,
      e.editeur ? echapper(e.editeur) : null,
      e.date_parution ? echapper(e.date_parution) : null,
      e.ean ? `EAN ${echapper(e.ean)}` : null,
    ].filter(Boolean);
    return (
      `<li style="margin:0 0 10px"><strong>${echapper(e.titre ?? film.titre)}</strong>` +
      (details.length ? `<br /><span style="opacity:.75">${details.join(" · ")}</span>` : "") +
      `</li>`
    );
  });

  const titreEditions = editions.length
    ? `${editions.length} édition${editions.length > 1 ? "s" : ""} recensée${editions.length > 1 ? "s" : ""}`
    : "Aucune édition recensée";

  return (
    `<main style="max-width:860px;margin:0 auto;padding:48px 24px;` +
    `background:var(--reel-bg,#101720);color:var(--reel-text,#e8e8e8);` +
    `font-family:var(--reel-font,Inter,system-ui,sans-serif);line-height:1.55">` +
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">` +
    `${echapper(film.titre)}` +
    (annee
      ? `<span style="font-weight:200;color:var(--reel-muted,#9aa4b2)">${echapper(annee)}</span>`
      : "") +
    `</h1>` +
    (lignes.length ? `<p style="margin:0 0 20px;opacity:.8">${lignes.join(" · ")}</p>` : "") +
    (film.synopsis ? `<p style="margin:0 0 32px">${echapper(film.synopsis)}</p>` : "") +
    `<h2 style="font-family:var(--reel-font-titre,inherit);font-size:22px;margin:0 0 16px">` +
    `${titreEditions}</h2>` +
    (items.length ? `<ul style="list-style:none;padding:0;margin:0">${items.join("")}</ul>` : "") +
    `</main>`
  );
}

/** Retire les clés nulles, vides ou à tableau vide d'un objet JSON-LD. */
function compacter<T extends Record<string, unknown>>(objet: T): T {
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(objet)) {
    if (valeur === null || valeur === undefined || valeur === "") continue;
    if (Array.isArray(valeur) && valeur.length === 0) continue;
    sortie[cle] = valeur;
  }
  return sortie as T;
}

/**
 * Description structurée de la page, au format JSON-LD.
 *
 * Ce que le texte de la page dit à un lecteur, ce bloc le dit à une machine :
 * que `7.901` est une note sur 10 portée par 29 867 votes, que `Chris Columbus`
 * est le réalisateur, et surtout que telle édition porte tel code-barres.
 *
 * **Pas de nœud `Product`, et ce n'est pas un oubli.** Un par édition à
 * code-barres a été posé le 31 juillet 2026, puis retiré le jour même : le test
 * en direct de la Search Console les a tous déclarés non valides, avec le
 * message « Il faut indiquer "offers", "review", ou "aggregateRating" ».
 *
 * Aucune de ces trois issues n'est honnête ici. On n'a pas d'avis. La note TMDB
 * porte sur l'œuvre, l'accrocher à un disque serait faux. Et `prix_editeur` est
 * un prix conseillé, pas une offre : le site ne vend rien, aucun programme Awin
 * n'est accepté, et déclarer une disponibilité qu'on ignore est exactement ce
 * que Google sanctionne.
 *
 * Un balisage qui ne peut produire aucun résultat enrichi et qui laisse une
 * erreur permanente dans la Search Console est un passif : elle masquerait les
 * vraies erreurs plus tard. **L'EAN reste dans le texte du corps injecté**
 * (cf. `corpsFilm`), donc lisible par un moteur, ce qui préserve l'essentiel.
 *
 * À rouvrir le jour où un flux Awin est accepté : les offres seront réelles, le
 * `Product` redeviendra valide, et `gtin13` est ce qui nous distingue, ni TMDB
 * ni SensCritique ne publiant cette donnée.
 */
function donneesStructurees(film: FilmSeo, canonical: string): string {
  const note = Number(film.note);
  const votes = Number(film.nb_votes);

  const oeuvre = compacter({
    "@type": film.type === "serie" ? "TVSeries" : "Movie",
    "@id": `${canonical}#oeuvre`,
    name: film.titre,
    alternateName: film.titre_original !== film.titre ? film.titre_original : null,
    url: canonical,
    image: film.affiche_url,
    description: film.synopsis,
    genre: film.genres ?? [],
    /* `duree` est un entier de minutes en base, quand ISO 8601 attend une
       durée. `PT153M` et non `PT2H33M` : les deux sont valides, la première
       n'oblige pas à convertir. */
    duration: film.duree ? `PT${film.duree}M` : null,
    datePublished: film.date_sortie,
    director: film.realisateur ? { "@type": "Person", name: film.realisateur } : null,
    author: film.scenariste ? { "@type": "Person", name: film.scenariste } : null,
    countryOfOrigin: (film.pays ?? []).map((nom) => ({ "@type": "Country", name: nom })),
    /* Le lien IMDb vaut réconciliation d'entité : il dit « cette page parle de
       l'œuvre que vous connaissez sous cet identifiant ». */
    sameAs: film.imdb_id ? `https://www.imdb.com/title/${film.imdb_id}/` : null,
    aggregateRating:
      Number.isFinite(note) && note > 0 && Number.isFinite(votes) && votes > 0
        ? {
            "@type": "AggregateRating",
            /* La note TMDB est sur 10 et arrive avec trois décimales. Deux
               suffisent : la troisième annonce une précision qu'elle n'a pas. */
            ratingValue: Math.round(note * 100) / 100,
            bestRating: 10,
            worstRating: 0,
            ratingCount: votes,
          }
        : null,
  });

  const filAriane = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalogue", item: new URL(canonical).origin + "/" },
      { "@type": "ListItem", position: 2, name: film.titre, item: canonical },
    ],
  };

  const graphe = { "@context": "https://schema.org", "@graph": [oeuvre, filAriane] };

  /* `</script>` dans un synopsis fermerait la balise par surprise. Échapper le
     chevron ouvrant suffit à l'empêcher, et reste du JSON valide. */
  return JSON.stringify(graphe).replace(/</g, "\\u003c");
}

/**
 * Réécrit le `<head>` du document servi.
 *
 * `HTMLRewriter` travaille sur le flux, sans charger la page en mémoire, et
 * échappe lui-même ce qu'on lui donne : ni `setInnerContent` ni `setAttribute`
 * n'ouvrent d'injection.
 */
function injecter(reponse: Response, film: FilmSeo, canonical: string) {
  const meta = metadonnees(film);
  const poserContenu = { element: (el: any) => el.setAttribute("content", meta.description) };
  const ogType = film.type === "serie" ? "video.tv_show" : "video.movie";

  return new HTMLRewriter()
    .on("title", { element: (el: any) => el.setInnerContent(meta.titre) })
    .on('meta[name="description"]', poserContenu)
    .on('meta[property="og:description"]', poserContenu)
    .on('meta[property="og:title"]', {
      element: (el: any) => el.setAttribute("content", meta.titre),
    })
    .on('meta[property="og:type"]', {
      element: (el: any) => el.setAttribute("content", ogType),
    })
    /* L'affiche du film **remplace** le visuel de partage par défaut plutôt que
       de s'y ajouter : deux `og:image` laisseraient chaque scraper choisir, et
       ils ne choisissent pas tous pareil. Les dimensions suivent, l'affiche
       TMDB étant servie en `w500`, donc 500×750 et non 1200×630. */
    .on('meta[property="og:image"]', {
      element: (el: any) => {
        if (meta.image) el.setAttribute("content", meta.image);
      },
    })
    .on('meta[property="og:image:width"]', {
      element: (el: any) => {
        if (meta.image) el.setAttribute("content", "500");
      },
    })
    .on('meta[property="og:image:height"]', {
      element: (el: any) => {
        if (meta.image) el.setAttribute("content", "750");
      },
    })
    .on('meta[property="og:image:alt"]', {
      element: (el: any) => {
        if (meta.image) el.setAttribute("content", `Affiche de ${film.titre}`);
      },
    })
    /* `index.html` ne porte ni canonical ni og:url : une valeur en dur y ferait
       passer les 4 400 fiches pour des doublons de la racine. On les ajoute
       donc, en se raccrochant à une balise qui existe à coup sûr. */
    .on('meta[property="og:site_name"]', {
      element: (el: any) => {
        el.after(`<link rel="canonical" href="${canonical}" />`, { html: true });
        el.after(`<meta property="og:url" content="${canonical}" />`, { html: true });
        el.after(
          `<script type="application/ld+json">${donneesStructurees(film, canonical)}</script>`,
          { html: true },
        );
      },
    })
    /* Le corps servi au crawler. React l'efface à son montage : `createRoot`
       remplace le contenu du conteneur, il ne l'hydrate pas. */
    .on("#root", {
      element: (el: any) => el.setInnerContent(corpsFilm(film), { html: true }),
    })
    .transform(reponse);
}

/* ------------------------------------------------------------------------ */
/* Pages de regroupement                                                      */
/* ------------------------------------------------------------------------ */

/** `/formats/steelbook` rend `formats`. Null hors des trois axes. */
function axeDeChemin(chemin: string): NomAxe | null {
  const premier = chemin.split("/").filter(Boolean)[0];
  return premier && premier in AXES ? (premier as NomAxe) : null;
}

interface LigneListe {
  /** Ce qui s'affiche. */
  libelle: string;
  /** Précisions en seconde ligne, déjà assemblées. */
  details: string;
  /** Destination, ou null quand l'édition n'est rattachée à aucun film. */
  lien: string | null;
}

/**
 * Charge une page de regroupement, et le total de la sélection entière.
 *
 * Le total vient de l'en-tête `content-range` que PostgREST renvoie avec
 * `Prefer: count=exact`. Il est indispensable : sans lui on ne sait pas
 * combien de pages existent, donc ni quoi mettre en pied de page, ni quand
 * répondre 404.
 *
 * Le tri secondaire par `id` n'est pas décoratif. Sans ordre total, `offset`
 * s'applique à un ensemble non ordonné et PostgREST répète et saute des lignes
 * d'une page à l'autre, piège déjà consigné au §9.
 */
async function lireListe(
  axe: NomAxe,
  libelle: string,
  page: number,
): Promise<{ lignes: LigneListe[]; total: number }> {
  const base = `https://${PROJET}.supabase.co/rest/v1`;
  const filtre = encodeURIComponent(`{"${libelle.replace(/"/g, '\\"')}"}`);
  const debut = (page - 1) * PAR_PAGE;
  const tranche = `&offset=${debut}&limit=${PAR_PAGE}`;

  let url: string;
  if (axe === "genres") {
    /* `edition_films!inner` écarte les films sans édition, comme le sitemap :
       un film sans jaquette au catalogue n'a rien à faire dans une liste
       d'éditions physiques. `nullslast` est indispensable, PostgreSQL classant
       les nuls en premier sur un `desc`.

       Le décompte reste juste malgré la jointure : PostgREST rend un film par
       ligne, ses liens dans un tableau imbriqué, pas un produit cartésien. */
    url =
      `${base}/films?genres=cs.${filtre}` +
      `&select=id,titre,slug,annee,realisateur,edition_films!inner(edition_id)` +
      `&order=popularite.desc.nullslast,id.asc${tranche}`;
  } else {
    const critere =
      axe === "formats"
        ? `formats_extraits=cs.${filtre}&order=image_url.asc.nullslast,id.desc`
        : `editeur=eq.${encodeURIComponent(libelle)}&order=date_parution.desc.nullslast,id.desc`;
    url =
      `${base}/editions?${critere}` +
      `&select=id,titre,editeur,formats_extraits,date_parution,ean,` +
      `edition_films(film:films(id,titre,slug,annee))${tranche}`;
  }

  const reponse = await fetch(url, {
    headers: {
      apikey: CLE_ANON,
      Authorization: `Bearer ${CLE_ANON}`,
      Prefer: "count=exact",
    },
    cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
  } as RequestInit);
  /* PostgREST répond **416** quand l'`offset` dépasse le total, et il met
     quand même le total dans `content-range`. Ce n'est pas une panne, c'est la
     réponse à « page 94 sur 93 » : on lit le total et on rend zéro ligne, ce
     qui fait répondre 404 à l'appelant. Traité comme une erreur, le repli
     servait la page générique en 200, soit un « soft 404 ». */
  if (!reponse.ok && reponse.status !== 416) {
    throw new Error(`${axe}/${libelle} : HTTP ${reponse.status}`);
  }
  // `content-range: 0-59/559`. Le total est après la barre, `*` s'il est inconnu.
  const total = Number((reponse.headers.get("content-range") ?? "").split("/")[1]) || 0;
  const lignes = reponse.status === 416 ? [] : ((await reponse.json()) as any[]);

  if (axe === "genres") {
    return {
      total,
      lignes: lignes.map((f) => ({
        libelle: f.titre,
        details: [f.annee, f.realisateur].filter(Boolean).join(" · "),
        lien: f.slug ? `${BASE_FILMS}/${f.slug}/${f.id}` : `${BASE_FILMS}/${f.id}`,
      })),
    };
  }

  const converties = lignes.map((e) => {
    const film = e.edition_films?.[0]?.film ?? null;
    return {
      libelle: e.titre ?? film?.titre ?? "Édition",
      details: [
        axe === "formats" ? e.editeur : null,
        (e.formats_extraits ?? []).join(", ") || null,
        e.date_parution,
        e.ean ? `EAN ${e.ean}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      lien: film ? (film.slug ? `${BASE_FILMS}/${film.slug}/${film.id}` : `${BASE_FILMS}/${film.id}`) : null,
    };
  });

  return { lignes: converties, total };
}

/**
 * Titre et description d'une page de regroupement, sommaire ou détail.
 *
 * `total` est l'effectif de la sélection entière, pas celui de la page servie.
 * Le numéro entre dans le titre à partir de la deuxième page : sans lui, les
 * 93 pages de `/formats/blu-ray` porteraient le même et Google les traiterait
 * en doublons. Doit rendre exactement ce que `RegroupementPage` rendra.
 */
function metaRegroupement(axe: NomAxe, libelle: string | null, total: number, page = 1, pages = 1) {
  const nom = AXES[axe].titre;
  if (libelle === null) {
    return {
      titre: `${nom} du catalogue | ${SITE_NOM}`,
      description:
        axe === "formats"
          ? "Blu-ray, 4K, steelbook, digipack, coffret. Le format est relevé sur la fiche de l'édition, jamais déduit du titre."
          : axe === "editeurs"
          ? "Les éditeurs vidéo présents au catalogue. L'information vient de la fiche technique du disque, elle qualifie donc l'objet et non l'œuvre."
          : "Les genres des films du catalogue, tels que TMDB les renseigne.",
    };
  }
  const description =
    axe === "formats"
      ? `${total} éditions ${libelle} recensées au catalogue, avec leur film, leur éditeur et leur code-barres quand il est connu.`
      : axe === "editeurs"
      ? `${total} éditions publiées par ${libelle} : formats, dates de parution et codes-barres.`
      : `${total} films de genre ${libelle.toLowerCase()} disponibles en édition physique : Blu-ray, 4K, steelbooks et coffrets.`;
  const suffixe = page > 1 ? `, page ${page} sur ${pages}` : "";
  return { titre: `${libelle}, ${nom.toLowerCase()}${suffixe} | ${SITE_NOM}`, description };
}

/** Corps servi pour un sommaire d'axe. Aucune requête, la table suffit. */
function corpsSommaire(axe: NomAxe): string {
  const { titre, tables, base } = AXES[axe];
  const items = tables
    .map(
      (e) =>
        `<li style="margin:0 0 8px"><a href="${base}/${e.slug}" ` +
        `style="color:var(--reel-accent-clair,#6ea8ff)">${echapper(e.libelle)}</a> ` +
        `<span style="opacity:.6">${e.compte}</span></li>`,
    )
    .join("");
  return enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">${echapper(titre)}</h1>` +
      `<p style="margin:0 0 28px">${echapper(metaRegroupement(axe, null, 0).description)}</p>` +
      `<ul style="list-style:none;padding:0;margin:0">${items}</ul>`,
  );
}

/** Liens de pagination, en `<a>` : un crawler suit des href, il ne clique pas. */
function paginationHtml(base: string, slug: string, page: number, pages: number): string {
  if (pages <= 1) return "";
  const style = "color:var(--reel-accent-clair,#6ea8ff);margin-right:10px";
  const morceaux: string[] = [];
  if (page > 1) {
    morceaux.push(`<a rel="prev" href="${cheminPage(base, slug, page - 1)}" style="${style}">← Précédent</a>`);
  }
  for (const n of fenetrePages(page, pages)) {
    if (n === 0) morceaux.push(`<span style="opacity:.5;margin-right:10px">…</span>`);
    else if (n === page) morceaux.push(`<strong style="margin-right:10px">${n}</strong>`);
    else morceaux.push(`<a href="${cheminPage(base, slug, n)}" style="${style}">${n}</a>`);
  }
  if (page < pages) {
    morceaux.push(`<a rel="next" href="${cheminPage(base, slug, page + 1)}" style="${style}">Suivant →</a>`);
  }
  return `<nav style="margin:32px 0 0">${morceaux.join("")}</nav>`;
}

/** Corps servi pour une page de regroupement. */
function corpsRegroupement(
  axe: NomAxe,
  entree: { slug: string; libelle: string },
  lignes: LigneListe[],
  total: number,
  page: number,
  pages: number,
): string {
  const libelle = entree.libelle;
  const items = lignes
    .map((l) => {
      const nom = echapper(l.libelle);
      const titre = l.lien
        ? `<a href="${l.lien}" style="color:var(--reel-accent-clair,#6ea8ff)">${nom}</a>`
        : `<strong>${nom}</strong>`;
      return (
        `<li style="margin:0 0 10px">${titre}` +
        (l.details ? `<br /><span style="opacity:.75">${echapper(l.details)}</span>` : "") +
        `</li>`
      );
    })
    .join("");

  const { base, titre: nomAxe } = AXES[axe];
  return enveloppe(
    `<nav style="opacity:.7;margin:0 0 12px"><a href="/" style="color:inherit">Catalogue</a> › ` +
      `<a href="${base}" style="color:inherit">${echapper(nomAxe)}</a></nav>` +
      `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">${echapper(libelle)}` +
      (page > 1 ? `<span style="font-weight:200;opacity:.7">\u00a0\u00a0page ${page}</span>` : "") +
      `</h1>` +
      `<p style="margin:0 0 28px">${echapper(metaRegroupement(axe, libelle, total, page, pages).description)}` +
      (pages > 1 ? ` Page ${page} sur ${pages}, ${PAR_PAGE} par page.` : "") +
      `</p>` +
      (items ? `<ul style="list-style:none;padding:0;margin:0">${items}</ul>` : "") +
      paginationHtml(AXES[axe].base, entree.slug, page, pages) +
      // Ce qui relie les 72 pages entre elles : sans ce bloc, chacune est une
      // impasse que seul le sitemap fait découvrir.
      `<nav style="margin:40px 0 0"><h2 style="font-size:20px;margin:0 0 12px">Autres ${echapper(nomAxe.toLowerCase())}</h2>` +
      AXES[axe].tables
        .map(
          (e) =>
            `<a href="${base}/${e.slug}" style="color:var(--reel-accent-clair,#6ea8ff);` +
            `margin-right:14px;display:inline-block">${echapper(e.libelle)}</a>`,
        )
        .join("") +
      `</nav>`,
  );
}

/** Coquille commune aux corps injectés, mêmes jetons que le site. */
function enveloppe(interieur: string): string {
  return (
    `<main style="max-width:860px;margin:0 auto;padding:48px 24px;` +
    `background:var(--reel-bg,#101720);color:var(--reel-text,#e8e8e8);` +
    `font-family:var(--reel-font,Inter,system-ui,sans-serif);line-height:1.55">` +
    interieur +
    `</main>`
  );
}

/**
 * JSON-LD d'une liste : `CollectionPage` portant un `ItemList` ordonné.
 *
 * `position` est le rang dans la sélection entière, pas dans la page : sur la
 * page 3, le premier élément est le 121ᵉ. Redémarrer à 1 à chaque page
 * décrirait dix listes qui commencent toutes au même rang.
 */
function donneesListe(
  titre: string,
  canonical: string,
  lignes: LigneListe[],
  origine: string,
  page: number,
  total: number,
) {
  const decalage = (page - 1) * PAR_PAGE;
  const elements = lignes
    .map((l, i) => ({ l, rang: decalage + i + 1 }))
    .filter(({ l }) => l.lien)
    .map(({ l, rang }) => ({
      "@type": "ListItem",
      position: rang,
      name: l.libelle,
      url: `${origine}${l.lien}`,
    }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: titre,
    url: canonical,
    mainEntity: { "@type": "ItemList", numberOfItems: total, itemListElement: elements },
  }).replace(/</g, "\\u003c");
}

/** Réécrit `<head>` et `<body>` d'une page de regroupement. */
function injecterListe(
  reponse: Response,
  meta: { titre: string; description: string },
  canonical: string,
  corps: string,
  jsonLd: string | null,
  /* `rel="prev"` et `rel="next"` ne servent plus à Google depuis 2019, mais
     Bing les lit encore et ils ne coûtent rien. */
  precedent: string | null = null,
  suivant: string | null = null,
) {
  const poserContenu = { element: (el: any) => el.setAttribute("content", meta.description) };
  return new HTMLRewriter()
    .on("title", { element: (el: any) => el.setInnerContent(meta.titre) })
    .on('meta[name="description"]', poserContenu)
    .on('meta[property="og:description"]', poserContenu)
    .on('meta[property="og:title"]', {
      element: (el: any) => el.setAttribute("content", meta.titre),
    })
    .on('meta[property="og:site_name"]', {
      element: (el: any) => {
        el.after(`<link rel="canonical" href="${canonical}" />`, { html: true });
        el.after(`<meta property="og:url" content="${canonical}" />`, { html: true });
        if (jsonLd) {
          el.after(`<script type="application/ld+json">${jsonLd}</script>`, { html: true });
        }
        if (precedent) el.after(`<link rel="prev" href="${precedent}" />`, { html: true });
        if (suivant) el.after(`<link rel="next" href="${suivant}" />`, { html: true });
      },
    })
    .on("#root", { element: (el: any) => el.setInnerContent(corps, { html: true }) })
    .transform(reponse);
}

/* ---- Accueil et page de bienvenue ---- */

/**
 * Les deux pages d'entrée du site ne servaient **aucun texte**.
 *
 * Le middleware ne traitait que les fiches films et les pages de regroupement ;
 * partout ailleurs, un client qui n'exécute pas le JavaScript recevait
 * `<div id="root"></div>` et rien d'autre. Mesuré le 1er août 2026 : 0 signe
 * dans le corps de `/` et de `/welcome`, contre 1 916 sur une fiche film.
 * Google rend, la plupart des autres non, et l'accueil est précisément l'URL
 * qu'on partage.
 *
 * Comme pour les fiches, le corps injecté et le composant React doivent dire la
 * même chose sans que rien ne le garantisse : le bloc reste donc volontairement
 * pauvre, pour que la dérive soit lente.
 */
async function lireVitrineAccueil(): Promise<{ films: LigneListe[]; films_total: number }> {
  const base = `https://${PROJET}.supabase.co/rest/v1`;
  const reponse = await fetch(
    `${base}/films?select=id,titre,slug,annee,realisateur,edition_films!inner(edition_id)` +
      `&order=popularite.desc.nullslast,id.asc&limit=24`,
    {
      headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}`, Prefer: "count=exact" },
      cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
    } as RequestInit,
  );
  if (!reponse.ok) throw new Error(`accueil : HTTP ${reponse.status}`);
  const total = Number((reponse.headers.get("content-range") ?? "").split("/")[1]) || 0;
  const lignes = (await reponse.json()) as any[];
  return {
    films_total: total,
    films: lignes.map((f) => ({
      libelle: f.titre,
      details: [f.annee, f.realisateur].filter(Boolean).join(" · "),
      lien: f.slug ? `${BASE_FILMS}/${f.slug}/${f.id}` : `${BASE_FILMS}/${f.id}`,
    })),
  };
}

/** Liens vers les trois sommaires, pour qu'un crawler descende dans le catalogue. */
function liensAxes(): string {
  return (
    `<nav style="margin:36px 0 0"><h2 style="font-size:20px;margin:0 0 12px">Parcourir</h2>` +
    (Object.keys(AXES) as NomAxe[])
      .map(
        (a) =>
          `<a href="${AXES[a].base}" style="color:var(--reel-accent-clair,#6ea8ff);` +
          `margin-right:14px;display:inline-block">${echapper(AXES[a].titre)}</a>`,
      )
      .join("") +
    `<a href="/welcome" style="color:var(--reel-accent-clair,#6ea8ff);display:inline-block">Comment ça marche</a>` +
    `</nav>`
  );
}

async function servirAccueil(url: URL, next: () => Promise<Response>): Promise<Response> {
  const { films, films_total } = await lireVitrineAccueil();
  const reponse = await next();
  if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

  const canonical = `${url.origin}/`;
  const meta = {
    titre: `${SITE_NOM}, le catalogue des éditions Blu-ray et 4K françaises`,
    description:
      `Les éditions physiques de ${films_total} films et séries publiées en France : Blu-ray, 4K, ` +
      `steelbooks et coffrets, avec leurs formats, leur éditeur et leur code-barres.`,
  };
  const corps = enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">` +
      `Le catalogue des éditions physiques de films</h1>` +
      `<p style="margin:0 0 28px">${echapper(meta.description)}</p>` +
      `<h2 style="font-size:20px;margin:0 0 12px">Films les plus consultés</h2>` +
      `<ul style="list-style:none;padding:0;margin:0">` +
      films
        .map(
          (f) =>
            `<li style="margin:0 0 10px"><a href="${f.lien}" ` +
            `style="color:var(--reel-accent-clair,#6ea8ff)">${echapper(f.libelle)}</a>` +
            (f.details ? ` <span style="opacity:.6">${echapper(f.details)}</span>` : "") +
            `</li>`,
        )
        .join("") +
      `</ul>` +
      liensAxes(),
  );

  return injecterListe(
    reponse,
    meta,
    canonical,
    corps,
    donneesListe(meta.titre, canonical, films, url.origin, 1, films_total),
  );
}

/**
 * `/welcome` : le mode d'emploi, en texte.
 *
 * Aucune requête. Ce que la page explique ne dépend pas de la base, et une
 * page d'entrée qui tomberait au moindre hoquet de Supabase serait un mauvais
 * échange. Les six intitulés reprennent ceux des étapes, ancres comprises.
 */
const ETAPES_BIENVENUE: [string, string, string][] = [
  ["posseder", "Dites-nous ce que vous possédez", "Sur la fiche d'un film, chaque édition publiée en France est listée. Marquez celles qui sont sur votre étagère, elles rejoignent votre collection."],
  ["envies", "Gardez la liste de ce qu'il vous manque", "Une édition repérée mais pas achetée va dans vos envies. La liste se consulte depuis le téléphone, en rayon."],
  ["comparer", "Comparez les éditions d'un même film", "Première édition, réédition anniversaire, steelbook d'un revendeur, coffret : la fiche film les rassemble toutes, avec leurs formats, leur date et leur zone."],
  ["fiche-technique", "Lisez la fiche du disque, pas seulement celle du film", "Définition, HDR, format d'image, pistes audio, sous-titres, éditeur. Une 4K en Dolby Vision et un Blu-ray 1080p du même film n'offrent pas la même chose."],
  ["coffrets", "Les coffrets comptent pour chacun de leurs films", "Un coffret apparaît sur la fiche de chaque film qu'il contient, et le cocher une fois suffit à le voir partout."],
  ["compte", "Votre compte, vos listes, effaçables", "La consultation ne demande rien. Le compte sert à ce que vos listes survivent à un vidage de cache et vous suivent d'un appareil à l'autre."],
];

/**
 * `/about` : les questions fréquentes, en texte.
 *
 * Aucune requête, le contenu est statique. C'est la page qui répond aux
 * questions qu'on tape en toutes lettres, « jaquette.app c'est quoi »,
 * « où sont hébergées mes données » : elle n'a d'intérêt que si un moteur peut
 * la lire, et elle servait 48 octets jusqu'ici.
 *
 * Pas de balisage `FAQPage` : Google a restreint ce résultat enrichi aux sites
 * gouvernementaux et de santé en août 2023, le déclarer ne produirait rien.
 */
async function servirAPropos(url: URL, next: () => Promise<Response>): Promise<Response> {
  const reponse = await next();
  if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

  const nombre = toutesLesQuestions().length;
  const canonical = `${url.origin}/about`;
  const meta = {
    titre: `À propos et questions fréquentes | ${SITE_NOM}`,
    description:
      `Ce qu'est ${SITE_NOM}, d'où viennent les données, ce que le site ne fait pas, ` +
      `et ce que devient un compte. ${nombre} questions.`,
  };

  const corps = enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">` +
      `À propos et questions fréquentes</h1>` +
      `<p style="margin:0 0 28px">${echapper(meta.description)}</p>` +
      FAQ.map(
        (section) =>
          `<section id="${section.ancre}" style="margin:0 0 32px">` +
          `<h2 style="font-size:22px;margin:0 0 14px">${echapper(section.titre)}</h2>` +
          section.questions
            .map(
              (q) =>
                `<div id="${q.ancre}" style="margin:0 0 18px">` +
                `<h3 style="font-size:16px;margin:0 0 4px">${echapper(q.question)}</h3>` +
                q.reponse
                  .map((par) => `<p style="margin:0 0 6px;opacity:.8">${echapper(par)}</p>`)
                  .join("") +
                `</div>`,
            )
            .join("") +
          `</section>`,
      ).join("") +
      liensAxes(),
  );

  return injecterListe(reponse, meta, canonical, corps, null);
}

async function servirBienvenue(url: URL, next: () => Promise<Response>): Promise<Response> {
  const reponse = await next();
  if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

  const canonical = `${url.origin}/welcome`;
  const meta = {
    titre: `Bienvenue | ${SITE_NOM}`,
    description:
      `${SITE_NOM} recense les éditions physiques de films sorties en France : Blu-ray, 4K, ` +
      `steelbooks et coffrets. Marquez ce que vous possédez, gardez la liste de ce qu'il vous manque.`,
  };
  const corps = enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">` +
      `Savoir quelle édition vous avez déjà</h1>` +
      `<p style="margin:0 0 28px">${echapper(meta.description)}</p>` +
      ETAPES_BIENVENUE.map(
        ([ancre, titre, texte], i) =>
          `<section id="${ancre}" style="margin:0 0 24px">` +
          `<h2 style="font-size:20px;margin:0 0 6px">${i + 1}. ${echapper(titre)}</h2>` +
          `<p style="margin:0">${echapper(texte)}</p></section>`,
      ).join("") +
      liensAxes(),
  );

  return injecterListe(reponse, meta, canonical, corps, null);
}

/**
 * Sert `/formats`, `/editeurs`, `/genres` et leurs pages.
 *
 * Ces pages captent la requête de navigation, mais leur premier rôle est de
 * donner au crawler un chemin vers les fiches profondes : sans elles, la
 * profondeur de clic du site est accueil, 50 films, mur, et le reste du
 * catalogue n'existe que par le sitemap.
 *
 * Elles doivent donc être lisibles sans JavaScript, sinon elles ne servent
 * précisément à rien.
 */
async function servirRegroupement(
  axe: NomAxe,
  url: URL,
  next: () => Promise<Response>,
): Promise<Response> {
  const segments = url.pathname.split("/").filter(Boolean);
  // `/formats/a/b/c` n'existe pas : vrai 404, sinon la réécriture SPA en fait
  // un 200 sur une page vide.
  if (segments.length > 3) return pageIntrouvable(next);

  const slug = segments[1] ?? null;
  // Un slug hors table est une adresse qui n'existe pas.
  const entree = slug === null ? null : trouver(axe, slug);
  if (slug !== null && !entree) return pageIntrouvable(next);

  const base = AXES[axe].base;
  const numero = segments[2] ?? null;

  if (numero !== null) {
    // Un sommaire n'est pas paginé, et un numéro non entier n'existe pas.
    if (!entree || !/^[0-9]+$/.test(numero)) return pageIntrouvable(next);
    /* `/x/y/1` redirige vers `/x/y` : deux adresses pour le même contenu sont
       deux doublons, et c'est la forme courte qui fait autorité. */
    if (Number(numero) === 1) {
      return Response.redirect(`${url.origin}${base}/${entree.slug}${url.search}`, 301);
    }
    if (Number(numero) < 1) return pageIntrouvable(next);
  }

  const page = numero === null ? 1 : Number(numero);
  const canonique = `${url.origin}${entree ? cheminPage(base, entree.slug, page) : base}`;

  try {
    const resultat = entree
      ? await lireListe(axe, entree.libelle, page)
      : { lignes: [] as LigneListe[], total: 0 };
    const pages = nombreDePages(resultat.total);

    // Une page au-delà de la dernière n'a pas de contenu à montrer.
    if (entree && page > pages) return pageIntrouvable(next);

    const meta = metaRegroupement(axe, entree?.libelle ?? null, resultat.total, page, pages);

    const reponse = await next();
    if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

    return injecterListe(
      reponse,
      meta,
      canonique,
      entree
        ? corpsRegroupement(axe, entree, resultat.lignes, resultat.total, page, pages)
        : corpsSommaire(axe),
      /* Le nom du `CollectionPage` est le libellé nu : le suffixe « | jaquette.app »
         appartient au `<title>` de l'onglet, pas au nom de l'entité. */
      entree
        ? donneesListe(entree.libelle, canonique, resultat.lignes, url.origin, page, resultat.total)
        : null,
      entree && page > 1 ? `${url.origin}${cheminPage(base, entree.slug, page - 1)}` : null,
      entree && page < pages ? `${url.origin}${cheminPage(base, entree.slug, page + 1)}` : null,
    );
  } catch {
    /* Même règle que pour les fiches : le référencement se dégrade, la
       consultation ne s'arrête pas. */
    return next();
  }
}

/** Sert la coquille SPA avec un vrai statut 404 et une consigne `noindex`. */
async function pageIntrouvable(next: () => Promise<Response>): Promise<Response> {
  const shell = await next();
  const reponse = new Response(shell.body, {
    status: 404,
    headers: new Headers(shell.headers),
  });

  return new HTMLRewriter()
    .on("title", { element: (el: any) => el.setInnerContent(`Page introuvable | ${SITE_NOM}`) })
    .on('meta[property="og:site_name"]', {
      element: (el: any) =>
        el.after('<meta name="robots" content="noindex, follow" />', { html: true }),
    })
    .transform(reponse);
}

export async function onRequest(context: Contexte): Promise<Response> {
  const { request, next } = context;

  /* Chemin rapide. Le middleware voit passer tout le trafic, assets compris :
     ce qui ne le concerne pas doit ressortir immédiatement. */
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const url = new URL(request.url);

  /*
   * Un asset ne doit jamais répondre du HTML, jamais.
   *
   * La réécriture SPA (`/* /index.html 200`) s'applique aussi à `/assets/*` et
   * `/fonts/*` quand le fichier n'est pas encore là, pendant la propagation
   * d'un déploiement. Le navigateur reçoit alors `index.html` sous un nom de
   * bundle, refuse d'exécuter un module en `text/html`, et la règle `/assets/*`
   * de `public/_headers` estampille cette réponse pour 24 h : **le site ne
   * démarre plus** tant que le cache n'expire pas.
   *
   * Arrivé trois fois, les 30 et 31 juillet 2026, la dernière sur le bundle
   * principal lui-même. Le §9 le décrit comme un mystère parce que `curl`
   * rendait les bons octets depuis une autre machine, donc un autre edge ; vu
   * depuis la page, `fetch` rendait bien `text/html` et 2 716 octets.
   *
   * On coupe la cause : si la réponse d'un chemin d'asset est du HTML, c'est
   * que le fichier manque, et un fichier manquant doit répondre 404. Le
   * `no-store` est essentiel, sinon on remplacerait un cache empoisonné par un
   * autre et le site resterait à terre après la propagation.
   */
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/")) {
    const reponse = await next();
    if ((reponse.headers.get("content-type") ?? "").includes("text/html")) {
      return new Response("Asset introuvable", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return reponse;
  }

  /*
   * Anciennes adresses françaises, en 301 vers leur forme anglaise.
   *
   * Placé avant tout le reste : `/films/…` et `/editeurs/…` ne doivent jamais
   * atteindre les gestionnaires, qui ne connaissent plus que `/movies/` et
   * `/publishers/`. Sans ce passage, ils tomberaient sur la réécriture SPA,
   * donc un 200 sur une page que React redirigerait ensuite côté client :
   * Google verrait deux adresses pour le même contenu au lieu d'une
   * redirection franche.
   *
   * La chaîne de recherche est conservée, elle porte parfois un paramètre de
   * campagne ou un `?liste=envies`.
   */
  const ancienne = redirectionDe(url.pathname);
  if (ancienne) return Response.redirect(`${url.origin}${ancienne}${url.search}`, 301);

  /* Les deux pages d'entrée. Comme partout ici, toute erreur retombe sur
     `next()` : mieux vaut une page sans texte injecté qu'une page morte. */
  if (url.pathname === "/") {
    try {
      return await servirAccueil(url, next);
    } catch {
      return next();
    }
  }
  if (url.pathname === "/welcome") {
    try {
      return await servirBienvenue(url, next);
    } catch {
      return next();
    }
  }
  if (url.pathname === "/about") {
    try {
      return await servirAPropos(url, next);
    } catch {
      return next();
    }
  }

  const axe = axeDeChemin(url.pathname);
  if (axe) return servirRegroupement(axe, url, next);

  if (!url.pathname.startsWith(`${BASE_FILMS}/`)) return next();

  const segments = url.pathname.split("/").filter(Boolean);
  // `/movies/<id>` ou `/movies/<slug>/<id>`, rien d'autre.
  if (segments.length < 2 || segments.length > 3) return next();

  const dernier = segments[segments.length - 1];
  if (!/^[0-9]+$/.test(dernier)) return next();
  const id = Number(dernier);

  try {
    const film = await lireFilm(id);
    if (!film) return pageIntrouvable(next);

    const canonique = cheminCanonique(film);
    if (url.pathname !== canonique) {
      /* 301 et non 302 : la forme canonique est stable, et c'est elle qui doit
         récupérer l'historique de l'ancienne URL. La chaîne de recherche est
         conservée, elle porte parfois un paramètre de campagne. */
      return Response.redirect(`${url.origin}${canonique}${url.search}`, 301);
    }

    const reponse = await next();
    /* Ne réécrire que du HTML : la même URL peut servir autre chose le jour où
       une règle change, et `HTMLRewriter` sur du binaire le corromprait. */
    if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

    return injecter(reponse, film, `${url.origin}${canonique}`);
  } catch {
    /* Supabase injoignable, réponse inattendue, n'importe quoi : on sert la
       page telle qu'elle l'était avant ce fichier. Le référencement se dégrade,
       la consultation ne s'arrête pas. */
    return next();
  }
}
