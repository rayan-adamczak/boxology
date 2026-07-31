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
 *   1. l'URL canonique d'une fiche est `/films/<slug>/<id>` ; toute autre forme
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

/** Nombre d'éditions décrites en JSON-LD. Voir `donneesStructurees`. */
const MAX_PRODUITS = 20;

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
  return film.slug ? `/films/${film.slug}/${film.id}` : `/films/${film.id}`;
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
 * **`gtin13` est le champ qui nous distingue.** 3 379 films portent au moins une
 * édition dont l'EAN est connu ; c'est ce qui permet à un moteur de rapprocher
 * notre fiche du même disque ailleurs sur le web. Ni TMDB ni SensCritique ne
 * publient cette donnée.
 *
 * Pas d'`Offer`, et c'est délibéré : `prix_editeur` est un prix conseillé, pas
 * une offre de vente. Le site ne vend rien et n'a pour l'instant aucun lien
 * d'affiliation actif. Déclarer une offre serait faux, et Google sanctionne le
 * balisage qui ne correspond pas à ce que la page propose. À rouvrir le jour
 * où un programme Awin est accepté : le `Product` est déjà là, il n'y aura
 * qu'à lui accrocher ses offres.
 */
function donneesStructurees(film: FilmSeo, canonical: string): string {
  const editions = editionsDe(film);
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

  /* Seules les éditions à code-barres sont décrites : sans `gtin13`, un
     `Product` n'apprend rien à un moteur qu'il ne lise déjà dans la page.
     Le plafond protège les coffrets, qui portent parfois des dizaines de
     lignes ; au-delà, le bloc pèserait plus que le reste du document. */
  const produits = editions
    .filter((e) => e.ean)
    .slice(0, MAX_PRODUITS)
    .map((e) =>
      compacter({
        /* Deux types et non un : le disque est un objet qu'on achète, donc un
           `Product` qui porte le `gtin13`, et une édition de l'œuvre, donc un
           `CreativeWork`. Le second type est ce qui autorise `exampleOfWork`,
           dont le domaine et la portée sont tous deux `CreativeWork` ;
           `isRelatedTo`, essayé d'abord, attend un Product ou un Service et ne
           peut donc pas désigner un film. */
        "@type": ["Product", "CreativeWork"],
        "@id": `${canonical}#edition-${e.id}`,
        name: e.titre ?? film.titre,
        gtin13: e.ean,
        image: e.image_url,
        brand: e.editeur ? { "@type": "Brand", name: e.editeur } : null,
        category: (e.formats_extraits ?? []).join(", "),
        releaseDate: e.date_parution,
        /* « Ce disque est une édition de cette œuvre. » Sans ce lien, le moteur
           voit un code-barres et un film posés côte à côte sans rapport
           déclaré. */
        exampleOfWork: { "@id": `${canonical}#oeuvre` },
      }),
    );

  const filAriane = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalogue", item: new URL(canonical).origin + "/" },
      { "@type": "ListItem", position: 2, name: film.titre, item: canonical },
    ],
  };

  const graphe = { "@context": "https://schema.org", "@graph": [oeuvre, ...produits, filAriane] };

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
    /* `index.html` ne porte ni canonical ni og:url ni og:image : une valeur en
       dur y ferait passer les 4 400 fiches pour des doublons de la racine. On
       les ajoute donc au lieu de les modifier, en se raccrochant à une balise
       qui existe à coup sûr. */
    .on('meta[property="og:site_name"]', {
      element: (el: any) => {
        el.after(`<link rel="canonical" href="${canonical}" />`, { html: true });
        el.after(`<meta property="og:url" content="${canonical}" />`, { html: true });
        if (meta.image) {
          el.after(`<meta property="og:image" content="${meta.image}" />`, { html: true });
        }
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

/** Nombre de lignes servies, aligné sur `PLAFOND` de `src/app/lib/listes.ts`. */
const PLAFOND_LISTE = 60;

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

/** Charge les lignes d'une page de regroupement. */
async function lireListe(axe: NomAxe, libelle: string): Promise<LigneListe[]> {
  const base = `https://${PROJET}.supabase.co/rest/v1`;
  const filtre = encodeURIComponent(`{"${libelle.replace(/"/g, '\\"')}"}`);

  let url: string;
  if (axe === "genres") {
    /* `edition_films!inner` écarte les films sans édition, comme le sitemap :
       un film sans jaquette au catalogue n'a rien à faire dans une liste
       d'éditions physiques. `nullslast` est indispensable, PostgreSQL classant
       les nuls en premier sur un `desc`. */
    url =
      `${base}/films?genres=cs.${filtre}` +
      `&select=id,titre,slug,annee,realisateur,edition_films!inner(edition_id)` +
      `&order=popularite.desc.nullslast&limit=${PLAFOND_LISTE}`;
  } else {
    const critere =
      axe === "formats"
        ? `formats_extraits=cs.${filtre}&order=image_url.asc.nullslast,id.desc`
        : `editeur=eq.${encodeURIComponent(libelle)}&order=date_parution.desc.nullslast`;
    url =
      `${base}/editions?${critere}` +
      `&select=id,titre,editeur,formats_extraits,date_parution,ean,` +
      `edition_films(film:films(id,titre,slug,annee))&limit=${PLAFOND_LISTE}`;
  }

  const reponse = await fetch(url, {
    headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}` },
    cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
  } as RequestInit);
  if (!reponse.ok) throw new Error(`${axe}/${libelle} : HTTP ${reponse.status}`);
  const lignes = (await reponse.json()) as any[];

  if (axe === "genres") {
    const vus = new Set<number>();
    return lignes
      // Un film à plusieurs éditions ressort autant de fois que de liens.
      .filter((f) => !vus.has(f.id) && vus.add(f.id))
      .map((f) => ({
        libelle: f.titre,
        details: [f.annee, f.realisateur].filter(Boolean).join(" · "),
        lien: f.slug ? `/films/${f.slug}/${f.id}` : `/films/${f.id}`,
      }));
  }

  return lignes.map((e) => {
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
      lien: film ? (film.slug ? `/films/${film.slug}/${film.id}` : `/films/${film.id}`) : null,
    };
  });
}

/** Titre et description d'une page de regroupement, sommaire ou détail. */
function metaRegroupement(axe: NomAxe, libelle: string | null, nombre: number) {
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
      ? `Les ${nombre} éditions ${libelle} les plus récemment recensées au catalogue, avec leur film, leur éditeur et leur code-barres quand il est connu.`
      : axe === "editeurs"
      ? `Les ${nombre} dernières éditions publiées par ${libelle} : formats, dates de parution et codes-barres.`
      : `${nombre} films de genre ${libelle.toLowerCase()} disponibles en édition physique : Blu-ray, 4K, steelbooks et coffrets.`;
  return { titre: `${libelle}, ${nom.toLowerCase()} | ${SITE_NOM}`, description };
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

/** Corps servi pour une page de regroupement. */
function corpsRegroupement(axe: NomAxe, libelle: string, lignes: LigneListe[]): string {
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
      `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">${echapper(libelle)}</h1>` +
      `<p style="margin:0 0 28px">${echapper(metaRegroupement(axe, libelle, lignes.length).description)}` +
      (lignes.length >= PLAFOND_LISTE
        ? ` Le catalogue en compte davantage, cette page en montre ${PLAFOND_LISTE}.`
        : "") +
      `</p>` +
      (items ? `<ul style="list-style:none;padding:0;margin:0">${items}</ul>` : "") +
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

/** JSON-LD d'une liste : `CollectionPage` portant un `ItemList` ordonné. */
function donneesListe(titre: string, canonical: string, lignes: LigneListe[], origine: string) {
  const elements = lignes
    .filter((l) => l.lien)
    .map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: l.libelle,
      url: `${origine}${l.lien}`,
    }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: titre,
    url: canonical,
    mainEntity: { "@type": "ItemList", numberOfItems: elements.length, itemListElement: elements },
  }).replace(/</g, "\\u003c");
}

/** Réécrit `<head>` et `<body>` d'une page de regroupement. */
function injecterListe(
  reponse: Response,
  meta: { titre: string; description: string },
  canonical: string,
  corps: string,
  jsonLd: string | null,
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
      },
    })
    .on("#root", { element: (el: any) => el.setInnerContent(corps, { html: true }) })
    .transform(reponse);
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
  // `/formats/a/b` n'existe pas plus qu'un slug inconnu : même 404, sinon la
  // réécriture SPA en fait un 200 sur une page vide.
  if (segments.length > 2) return pageIntrouvable(next);

  const slug = segments[1] ?? null;
  // Un slug hors table est une adresse qui n'existe pas : vrai 404, pas un 200
  // sur une page vide.
  const entree = slug === null ? null : trouver(axe, slug);
  if (slug !== null && !entree) return pageIntrouvable(next);

  const canonique = `${url.origin}/${segments.join("/")}`;

  try {
    const lignes = entree ? await lireListe(axe, entree.libelle) : [];
    const meta = metaRegroupement(axe, entree?.libelle ?? null, lignes.length);

    const reponse = await next();
    if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

    return injecterListe(
      reponse,
      meta,
      canonique,
      entree ? corpsRegroupement(axe, entree.libelle, lignes) : corpsSommaire(axe),
      /* Le nom du `CollectionPage` est le libellé nu : le suffixe « | jaquette.app »
         appartient au `<title>` de l'onglet, pas au nom de l'entité. */
      entree ? donneesListe(entree.libelle, canonique, lignes, url.origin) : null,
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

  const axe = axeDeChemin(url.pathname);
  if (axe) return servirRegroupement(axe, url, next);

  if (!url.pathname.startsWith("/films/")) return next();

  const segments = url.pathname.split("/").filter(Boolean);
  // `/films/<id>` ou `/films/<slug>/<id>`, rien d'autre.
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
