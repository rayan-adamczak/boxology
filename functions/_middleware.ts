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
     ce qui ne concerne pas une fiche film doit ressortir immédiatement. */
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const url = new URL(request.url);
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
