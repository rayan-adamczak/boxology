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
 * Ce fichier répond à trois choses, dans cet ordre :
 *
 *   1. l'URL canonique d'une fiche est `/films/<slug>/<id>` ; toute autre forme
 *      est redirigée en 301 vers elle ;
 *   2. un id qui n'existe pas répond un vrai 404, là où la réécriture SPA
 *      répondait 200 sur une page vide, un « soft 404 » aux yeux de Google ;
 *   3. le `<head>` est rempli au vol par `HTMLRewriter`, avec les mêmes valeurs
 *      que celles que `useSeo` posera ensuite côté client.
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

interface FilmSeo {
  id: number;
  titre: string;
  annee: string | number | null;
  synopsis: string | null;
  affiche_url: string | null;
  slug: string | null;
  edition_films: { count: number }[];
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

/** Lit le film et le nombre d'éditions qui lui sont rattachées, ou null. */
async function lireFilm(id: number): Promise<FilmSeo | null> {
  /* Le décompte passe par `edition_films` et non par `editions.film_id` : la
     colonne est un vestige, le rattachement vit dans la table de liens
     (cf. `getEditionsForFilm`). L'embarquer ici évite un second aller-retour. */
  const url =
    `https://${PROJET}.supabase.co/rest/v1/films` +
    `?id=eq.${id}&limit=1` +
    `&select=id,titre,annee,synopsis,affiche_url,slug,edition_films(count)`;

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

/** Métadonnées d'une fiche film, alignées sur celles de `FilmDetailPage`. */
function metadonnees(film: FilmSeo) {
  const annee = film.annee ? ` (${film.annee})` : "";
  const nb = film.edition_films?.[0]?.count ?? 0;

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

/**
 * Réécrit le `<head>` du document servi.
 *
 * `HTMLRewriter` travaille sur le flux, sans charger la page en mémoire, et
 * échappe lui-même ce qu'on lui donne : ni `setInnerContent` ni `setAttribute`
 * n'ouvrent d'injection.
 */
function injecter(
  reponse: Response,
  meta: { titre: string; description: string; image: string | null },
  canonical: string,
) {
  const poserContenu = { element: (el: any) => el.setAttribute("content", meta.description) };

  return new HTMLRewriter()
    .on("title", { element: (el: any) => el.setInnerContent(meta.titre) })
    .on('meta[name="description"]', poserContenu)
    .on('meta[property="og:description"]', poserContenu)
    .on('meta[property="og:title"]', {
      element: (el: any) => el.setAttribute("content", meta.titre),
    })
    .on('meta[property="og:type"]', {
      element: (el: any) => el.setAttribute("content", "video.movie"),
    })
    /* `index.html` ne porte ni canonical ni og:url ni og:image : une valeur en
       dur y ferait passer les 3 349 fiches pour des doublons de la racine. On
       les ajoute donc au lieu de les modifier, en se raccrochant à une balise
       qui existe à coup sûr. */
    .on('meta[property="og:site_name"]', {
      element: (el: any) => {
        el.after(`<link rel="canonical" href="${canonical}" />`, { html: true });
        el.after(`<meta property="og:url" content="${canonical}" />`, { html: true });
        if (meta.image) {
          el.after(`<meta property="og:image" content="${meta.image}" />`, { html: true });
        }
      },
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

    return injecter(reponse, metadonnees(film), `${url.origin}${canonique}`);
  } catch {
    /* Supabase injoignable, réponse inattendue, n'importe quoi : on sert la
       page telle qu'elle l'était avant ce fichier. Le référencement se dégrade,
       la consultation ne s'arrête pas. */
    return next();
  }
}
