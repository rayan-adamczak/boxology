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
/* La forme de l'identifiant public et l'adresse qu'il ouvre. Même module que
   l'application, pour que `/u/<identifiant>` désigne ici exactement ce qu'elle
   sait résoudre. */
import { cheminProfil, normaliserIdentifiant } from "../src/app/lib/identifiant";

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
  /** Offres marchandes, jointure à gauche : vide sur 96 % du catalogue. */
  offres: OffreSeo[] | null;
}

interface OffreSeo {
  marchand: string;
  prix: string | number | null;
  devise: string;
  disponible: boolean | null;
  /** `neuf | tres_bon | bon | acceptable`, ou nul si le marchand ne le dit pas.
   *  Momox shop vend de l'occasion : sans ce champ, `Offer` annoncerait un
   *  disque d'occasion aux mêmes conditions qu'un neuf. */
  etat: string | null;
  releve_le: string;
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
  /*
   * On demande tout ce dont la **fiche** a besoin, pas seulement le `<head>`.
   *
   * Ces colonnes servaient au titre, à la description et au JSON-LD, donc une
   * poignée suffisait. Depuis le 3 août 2026 la réponse est aussi inlinée dans
   * la page (`donneesInlinees`) pour que React n'ait plus à la redemander : il
   * faut donc que ce que l'on lit ici couvre ce que `getFilm` et
   * `getEditionsForFilm` liraient côté client, sans quoi la fiche s'afficherait
   * amputée avant de se corriger, c'est-à-dire le défaut qu'on vient fermer.
   *
   * `films` en entier, c'est une ligne. Les éditions sont énumérées, elles :
   * `contenu_brut` porte le texte brut de la source, parfois des dizaines de
   * kilo-octets, et personne ne l'affiche ; `image_url_source` et ses voisines
   * ne servent qu'aux scripts d'import.
   */
  const champsFilm = "*";
  /* `offres(...)` est une jointure à gauche : une édition sans offre revient
     avec un tableau vide plutôt que de disparaître. C'est le cas de 96 % du
     catalogue, donc ce n'est pas un détail de forme. `url` est demandée pour la
     page, qui en fait le lien marchand ; le JSON-LD, lui, continue de pointer
     la fiche du site et jamais le lien de tracking (§7). */
  const champsEdition =
    "id,titre,url_source,image_url,images_secondaires,slug,type,ean,prix_editeur," +
    "univers,supports,langues,nb_commentaires,nb_wishlist,film_id,formats_extraits," +
    "prix_fnac_extrait,region,pays,date_sortie,source,codec,resolution,hdr,ratio," +
    "ratio_origine,pistes_audio,sous_titres,disques,packaging,editeur,date_parution," +
    "collection_editeur,numero_collection,distributeur," +
    "offres(marchand,prix,devise,disponible,url,releve_le,etat)";

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
    : `Les éditions Blu-ray, 4K, DVD et coffrets de ${film.titre}${annee}.`;

  return {
    titre: `${film.titre}${annee}, éditions Blu-ray, 4K, DVD et coffrets | ${SITE_NOM}`,
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
 * **Un nœud `Product` par édition qui porte une offre réelle**, et par elle
 * seule. Rétabli le 3 août 2026, après avoir été posé puis retiré le jour même
 * le 31 juillet : le test de la Search Console les avait alors tous déclarés
 * non valides, « Il faut indiquer "offers", "review", ou "aggregateRating" ».
 *
 * Aucune des trois issues n'était honnête à l'époque. On n'a pas d'avis. La
 * note TMDB porte sur l'œuvre, l'accrocher à un disque serait faux. Et
 * `prix_editeur` est un prix conseillé, pas une offre.
 *
 * **Ce qui a changé, c'est la troisième.** Le programme Awin d'E.Leclerc est
 * accepté, `public.offres` porte des prix marchands datés, donc `offers` cesse
 * d'être le champ qu'on ne peut pas remplir sans mentir. 724 éditions sur 658
 * films en portent une ; les autres n'ont **aucun** nœud `Product`, et c'est
 * la bonne réponse plutôt qu'un nœud incomplet qui laisserait une erreur
 * permanente dans la Search Console.
 *
 * Trois choix qui ne se devinent pas à la relecture :
 *
 *   - **deux types, `Product` et `CreativeWork`.** Le second est ce qui autorise
 *     `exampleOfWork` pour rattacher le disque à l'œuvre. `isRelatedTo` attend
 *     un `Product` ou un `Service` et ne peut pas désigner un film ;
 *   - **`offers.url` est la fiche du site, pas le lien d'affiliation.** Le lien
 *     de tracking a sa place dans la page, où il est déclaré `rel="sponsored"`,
 *     pas dans un balisage lu par une machine qui n'a pas à être redirigée ;
 *   - **`priceValidUntil` vaut le relevé plus un jour**, parce que la passe
 *     tourne tous les jours (`maj-awin.yml`). Annoncer une validité plus longue
 *     que la fréquence de rafraîchissement serait une promesse qu'on ne tient
 *     pas, et Google traite une offre périmée comme une erreur.
 *
 * `gtin13` est ce qui nous distingue : ni TMDB ni SensCritique ne publient
 * cette donnée. Et sur les éditions sans offre, **l'EAN reste dans le texte du
 * corps injecté** (cf. `corpsFilm`), donc lisible par un moteur, ce qui
 * préserve l'essentiel de ce que ce balisage apportait.
 */
/**
 * Un nœud `Product` par édition qui porte une offre exploitable.
 *
 * « Exploitable » veut dire un prix strictement positif : `public.offres`
 * autorise `prix` nul, et un `Offer` sans `price` est refusé par Google, ce qui
 * remettrait une erreur permanente dans la Search Console. Mieux vaut aucun
 * nœud qu'un nœud invalide, c'est toute la leçon du 31 juillet.
 *
 * Une édition peut porter plusieurs offres le jour où un deuxième programme est
 * accepté : `offers` prend alors le tableau, ce que schema.org accepte.
 */
/**
 * Description d'une édition, pour le nœud `Product`.
 *
 * Réclamée par la Search Console le 4 août 2026, avec `validFrom`,
 * `hasMerchantReturnPolicy` et `shippingDetails`. Les deux premières se
 * remplissent honnêtement, les deux autres non : elles décrivent les conditions
 * de retour et de livraison **du marchand**, que le site n'a nulle part, ni
 * dans le flux Awin ni ailleurs. Les déclarer ferait annoncer au nom
 * d'E.Leclerc des conditions qu'on ignore, sur un balisage que Google prend au
 * mot pour écrire « retours gratuits » dans ses résultats. Le §10 rappelle que
 * le site n'est ni marchand ni intermédiaire de vente, et c'est la même règle
 * que pour `review` et `aggregateRating` : un balisage qui ne peut pas être
 * honnête reste absent.
 *
 * Ce qu'on écrit ici ne dit donc que ce qu'on sait du **disque** : son format,
 * qui l'édite, l'œuvre qu'il porte, son code-barres. Même vocabulaire que la
 * ligne d'édition du corps injecté, pour que les deux ne dérivent pas.
 */
function descriptionEdition(film: FilmSeo, ed: EditionSeo): string | null {
  const annee = film.annee ? ` (${film.annee})` : "";
  const morceaux = [
    ed.formats_extraits?.length ? ed.formats_extraits.join(", ") : null,
    `édition de « ${film.titre}${annee} »`,
    ed.editeur ? `éditeur ${ed.editeur}` : null,
    ed.ean ? `code-barres ${ed.ean}` : null,
  ].filter(Boolean);
  /* Le format seul et le titre ne font pas une description : sans au moins une
     précision de plus, on n'écrit rien plutôt qu'une paraphrase du `name`. */
  return morceaux.length >= 3 ? `${morceaux.join(" — ")}.` : null;
}

/**
 * `offres.etat` vers `schema.org/OfferItemCondition`.
 *
 * **Obligatoire depuis Momox, pas décoratif.** Un `Offer` sans `itemCondition`
 * est lu comme du neuf par défaut : servir un prix d'occasion sans le dire
 * ferait annoncer un disque neuf à 3,49 € dans les résultats de Google, ce qui
 * est la pratique commerciale trompeuse que le §10 s'emploie à éviter. C'est
 * exactement le raisonnement qui refuse `hasMerchantReturnPolicy`, dans l'autre
 * sens : ici la donnée existe, donc elle s'écrit.
 *
 * Le barème du marchand ne se traduit pas plus finement. schema.org n'a que
 * quatre valeurs, et `tres_bon` comme `acceptable` sont deux occasions : les
 * distinguer demanderait `RefurbishedCondition` ou `DamagedCondition`, qui
 * disent tous deux autre chose. Le détail reste à l'écran, où il est lisible
 * par un humain.
 *
 * Un état nul rend `null`, donc la clé disparaît par `compacter` : on n'affirme
 * pas « neuf » sur un silence.
 */
function conditionSchema(etat: string | null): string | null {
  if (!etat) return null;
  return etat === "neuf"
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";
}

function produits(film: FilmSeo, canonical: string): Record<string, unknown>[] {
  const noeuds: Record<string, unknown>[] = [];

  for (const lien of film.edition_films ?? []) {
    const ed = lien.edition;
    if (!ed) continue;

    const offres = (ed.offres ?? [])
      .map((o) => {
        const prix = Number(o.prix);
        if (!Number.isFinite(prix) || prix <= 0) return null;
        /* Le relevé plus un jour : la passe tourne quotidiennement, annoncer
           plus long serait une promesse qu'on ne tient pas. `Date` accepte
           l'horodatage ISO de PostgREST, et `toISOString` le ramène en UTC. */
        const releve = new Date(o.releve_le);
        const valide = new Date(releve.getTime() + 86_400_000);
        return compacter({
          "@type": "Offer",
          price: prix.toFixed(2),
          priceCurrency: o.devise || "EUR",
          availability: o.disponible
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          /* Le prix vaut du relevé au lendemain. `validFrom` est la date du
             relevé elle-même : la borne haute était déjà écrite, il manquait
             la borne basse, et les deux sortent de la même colonne. */
          validFrom: Number.isNaN(releve.getTime()) ? null : releve.toISOString().slice(0, 10),
          priceValidUntil: Number.isNaN(valide.getTime())
            ? null
            : valide.toISOString().slice(0, 10),
          /* La fiche du site, jamais le lien d'affiliation : celui-ci est
             déclaré `rel="sponsored"` dans la page, et un balisage lu par une
             machine n'a pas à la faire passer par une redirection de tracking. */
          url: canonical,
          seller: { "@type": "Organization", name: o.marchand },
          itemCondition: conditionSchema(o.etat),
        });
      })
      .filter(Boolean);

    if (offres.length === 0) continue;

    noeuds.push(
      compacter({
        /* Deux types : `CreativeWork` est ce qui autorise `exampleOfWork`,
           `isRelatedTo` n'acceptant qu'un `Product` ou un `Service`. */
        "@type": ["Product", "CreativeWork"],
        "@id": `${canonical}#edition-${ed.id}`,
        name: ed.titre || `${film.titre} — édition`,
        description: descriptionEdition(film, ed),
        gtin13: ed.ean,
        image: ed.image_url,
        brand: ed.editeur ? { "@type": "Brand", name: ed.editeur } : null,
        releaseDate: ed.date_parution,
        exampleOfWork: { "@id": `${canonical}#oeuvre` },
        offers: offres.length === 1 ? offres[0] : offres,
      }),
    );
  }

  return noeuds;
}

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

  const graphe = {
    "@context": "https://schema.org",
    "@graph": [oeuvre, ...produits(film, canonical), filAriane],
  };

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
      element: (el: any) => {
        el.setInnerContent(corpsFilm(film), { html: true });
        el.after(donneesInlinees(film), { html: true });
      },
    })
    .transform(reponse);
}

/**
 * Les données de la fiche, posées dans la page pour que React n'ait pas à les
 * redemander.
 *
 * Le Worker vient de les lire pour écrire le `<head>`, le corps et le JSON-LD.
 * Sans ce bloc, le navigateur refaisait le même aller-retour une fois le bundle
 * chargé : mesuré en production, la fiche n'avait ses éditions qu'à 2 823 ms,
 * dont 300 ms pour cette seule requête, après avoir attendu le bundle.
 *
 * **Un bloc de données, pas un script.** `type="application/json"` n'est pas
 * exécuté par le navigateur, donc la CSP `script-src 'self'` le laisse passer
 * sans `unsafe-inline` et rien n'y est évalué. Le chevron ouvrant est échappé
 * pour la même raison que dans le JSON-LD : un `</script>` dans un synopsis
 * fermerait la balise par surprise.
 *
 * Posé **après** `#root` et non dedans : `createRoot` remplace le contenu du
 * conteneur au montage, ce qui effacerait le bloc avant que la page ait pu le
 * lire.
 *
 * Le contrat avec le client est l'identifiant du film, vérifié à la lecture :
 * une navigation interne vers une autre fiche ne doit pas ressortir ces
 * données-ci. Et la page s'en sert comme **état initial**, pas comme vérité
 * définitive : elle relit derrière, sans écran de chargement, pour qu'un onglet
 * resté ouvert ne fige pas un prix.
 */
function donneesInlinees(film: FilmSeo): string {
  /* `edition_films` porte les éditions imbriquées dans le film : les laisser
     écrirait deux fois la même liste, pour un bloc qui pèse déjà. */
  const { edition_films: _liens, ...fiche } = film as FilmSeo & Record<string, unknown>;
  const charge = { film: fiche, editions: editionsDe(film) };
  return (
    `<script type="application/json" id="donnees-fiche">` +
    `${JSON.stringify(charge).replace(/</g, "\\u003c")}` +
    `</script>`
  );
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
 *
 * **L'ordre est `id` croissant, et c'est ce qui rend les pages stables.** Les
 * tris d'origine, éditions illustrées d'abord, films les plus populaires
 * d'abord, faisaient changer le contenu d'une page numérotée à chaque import
 * et à chaque repasse de popularité : une édition indexée par Google en page 21
 * de `/formats/steelbook` se trouvait en page 27 trois jours plus tard, et la
 * requête qui l'y avait trouvée, un code-barres, n'y trouvait plus rien. `id`
 * croissant ajoute les nouvelles lignes à la fin et ne décale rien.
 *
 * Ce module et `src/app/lib/listes.ts` doivent trier **exactement pareil** :
 * une page servie et la même page rendue par l'application montreraient sinon
 * deux contenus différents.
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
      `&order=id.asc${tranche}`;
  } else {
    const critere =
      axe === "formats"
        ? `formats_extraits=cs.${filtre}&order=id.asc`
        : axe === "collections"
        ? /* Une série s'ordonne par son numéro de tranche, pas par date : c'est
             le rang imprimé sur le boîtier qui compte, et un collectionneur
             cherche le numéro qui lui manque. Les éditions sans numéro
             ferment la liste, ce qui est le cas de tout Criterion, dont
             aucune de nos sources ne publie le spine number. */
          `collection_editeur=eq.${encodeURIComponent(libelle)}` +
          `&order=numero_collection.asc.nullslast,date_parution.desc.nullslast,id.desc`
        : `editeur=eq.${encodeURIComponent(libelle)}&order=id.asc`;
    url =
      `${base}/editions?${critere}` +
      `&select=id,titre,editeur,formats_extraits,date_parution,ean,numero_collection,` +
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
        /* Le rang dans la série ouvre la ligne sur une page de collection :
           c'est ce qu'on y cherche, et il ne veut rien dire ailleurs. */
        axe === "collections" && e.numero_collection ? `N°${e.numero_collection}` : null,
        axe !== "publishers" ? e.editeur : null,
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
          ? "Blu-ray, 4K, DVD, steelbook, digipack, coffret. Le format vient de la fiche de l'édition quand la source le publie, et du nom du produit sinon."
          : /* `publishers` et non `editeurs` : la clé d'axe a été renommée
               avec les URL le 1er août 2026, et cette branche testait encore
               l'ancienne. Elle ne s'exécutait donc jamais, et les 44 pages
               d'éditeur servaient la description des genres, « 283 films de
               genre carlotta films ». */
          axe === "publishers"
          ? "Les éditeurs vidéo présents au catalogue. L'information vient de la fiche technique du disque, elle qualifie donc l'objet et non l'œuvre."
          : axe === "collections"
          ? "Les séries numérotées d'éditeur : Criterion, Make My Day!. Une collection n'est pas un éditeur, elle en est une ligne."
          : "Les genres des films du catalogue, tels que TMDB les renseigne.",
    };
  }
  const description =
    axe === "formats"
      ? `${total} éditions ${libelle} recensées au catalogue, avec leur film, leur éditeur et leur code-barres quand il est connu.`
      : axe === "publishers"
      ? `${total} éditions publiées par ${libelle} : formats, dates de parution et codes-barres.`
      : axe === "collections"
      ? `${total} éditions de la collection ${libelle}, dans l'ordre de la série quand le numéro est connu.`
      : `${total} films de genre ${libelle.toLowerCase()} disponibles en édition physique : Blu-ray, 4K, DVD, steelbooks et coffrets.`;
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
    titre: `${SITE_NOM}, le catalogue des éditions Blu-ray, 4K et DVD françaises`,
    description:
      `Les éditions physiques de ${films_total} films et séries publiées en France : Blu-ray, 4K, DVD, ` +
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

/**
 * `/ean/<code>` : le code-barres mène à la fiche du film, en 301.
 *
 * Un visiteur qui tape treize chiffres dans Google cherche **le disque**, et la
 * bonne réponse est la fiche du film qui le porte, pas une page de liste où il
 * figurait au moment du crawl. Mesuré le 1er août 2026 : Google servait
 * `/formats/steelbook/21` pour `5051889752028`, alors que l'édition avait
 * glissé en page 27 entre-temps.
 *
 * Cette route ne s'indexe pas et n'a pas à l'être : elle redirige, donc c'est
 * la fiche qui reçoit le classement. Elle sert aussi de cible au scan de
 * code-barres prévu au §8, qui n'aura rien d'autre à construire.
 *
 * Le code est validé avant d'atteindre PostgREST : treize chiffres, rien
 * d'autre. Un EAN inconnu répond un vrai 404, pas une page vide en 200.
 */
async function servirEan(code: string, url: URL, next: () => Promise<Response>): Promise<Response> {
  const reponse = await fetch(
    `https://${PROJET}.supabase.co/rest/v1/editions` +
      `?ean=eq.${code}&limit=1&select=id,edition_films(film:films(id,slug))`,
    {
      headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}` },
      cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
    } as RequestInit,
  );
  if (!reponse.ok) throw new Error(`ean ${code} : HTTP ${reponse.status}`);

  const lignes = (await reponse.json()) as {
    edition_films?: { film: { id: number; slug: string | null } | null }[];
  }[];
  const film = lignes[0]?.edition_films?.find((l) => l?.film)?.film ?? null;
  /* Un code qu'aucune édition ne porte, ou une édition orpheline : il n'y a
     aucune fiche où envoyer, donc 404 franc. Rediriger vers l'accueil ferait
     un « soft 404 » de plus, ce que le reste du fichier s'emploie à éviter. */
  if (!film) return pageIntrouvable(next);

  const cible = film.slug ? `${BASE_FILMS}/${film.slug}/${film.id}` : `${BASE_FILMS}/${film.id}`;
  return Response.redirect(`${url.origin}${cible}`, 301);
}

/**
 * `/legal` et `/privacy`, en texte.
 *
 * Elles servaient 48 octets et le titre générique du catalogue : une mention
 * légale partagée en lien s'annonçait « jaquette.app, le catalogue des éditions
 * Blu-ray et 4K françaises », et un client sans JavaScript n'y lisait rien. Ce
 * sont pourtant les deux pages qu'on cite quand on nous demande qui édite le
 * site ou ce que deviennent les données.
 *
 * **Le corps servi est un sommaire, pas le texte complet.** Le texte juridique
 * vit dans les composants React, en JSX, et le recopier ici en dur créerait deux
 * versions qui dériveraient sans que rien ne le signale, le piège déjà consigné
 * pour la fiche film. Un sommaire de sections avec une ligne chacune donne au
 * moteur de quoi comprendre la page et à un aperçu de quoi s'afficher, sans
 * prétendre remplacer ce que le visiteur lira.
 */
const PAGES_LEGALES: Record<
  string,
  { titre: string; description: string; sections: [string, string][] }
> = {
  /*
   * Aligné sur `MentionsLegalesPage.tsx` le 4 août 2026.
   *
   * Ce corps annonçait encore « site personnel édité à titre non
   * professionnel », trois fois, sans SIREN ni mention d'affiliation, alors que
   * l'activité est professionnelle depuis le 3 août et que la page React le dit
   * (§10). Un client sans JavaScript, un aperçu de lien, un moteur qui ne rend
   * pas, lisaient donc des mentions fausses là où la LCEN en exige d'exactes.
   *
   * L'adresse postale et le téléphone ne sont **pas** repris ici, à dessein :
   * la page les porte, ce qui satisfait l'obligation d'accessibilité, et le §7
   * rappelle que `/legal` est en `noindex` précisément pour qu'ils ne remontent
   * pas dans les résultats. Les recopier dans un corps servi à tout le monde
   * défairait ce choix.
   */
  "/legal": {
    titre: `Mentions légales | ${SITE_NOM}`,
    description:
      `Éditeur, hébergement, liens affiliés, propriété intellectuelle et signalement ` +
      `pour ${SITE_NOM}.`,
    sections: [
      ["Éditeur du site", "Rayan Adamczak, entrepreneur individuel, SIREN 852 258 680, SIRET 852 258 680 00028, inscrit au Registre national des entreprises. TVA non applicable, article 293 B du code général des impôts. Coordonnées complètes sur la page."],
      ["Directeur de la publication", "Rayan Adamczak."],
      ["Liens affiliés", "Certains liens vers les marchands sont des liens affiliés : une commande passée après un clic peut donner lieu à une commission, sans surcoût. Programme Awin, marchands partenaires à ce jour E.Leclerc pour les disques neufs et momox shop pour l’occasion. Ces liens sont déclarés comme tels dans la page."],
      ["Nature du service", "Catalogue informatif. Le site ne vend rien, n'encaisse rien et n'est pas intermédiaire de vente : toute commande se conclut chez le marchand, dont les conditions et le prix affiché au moment de la commande font seuls foi."],
      ["Hébergement", "Cloudflare Pages pour le site, Supabase pour la base, hébergée dans l'Union européenne."],
      ["Propriété intellectuelle", "Les visuels de jaquettes appartiennent à leurs éditeurs, les métadonnées de films viennent de TMDB."],
      ["Base de données", "Extraction substantielle interdite au titre des articles L. 341-1 et suivants du code de la propriété intellectuelle. Consultation, usage privé et citation avec lien restent libres."],
      ["Signalement", "Une erreur, une édition manquante, une demande de retrait : contact@jaquette.app."],
    ],
  },
  "/privacy": {
    titre: `Politique de confidentialité | ${SITE_NOM}`,
    description:
      `Ce que ${SITE_NOM} enregistre, ce qu'il n'enregistre pas, et comment effacer ` +
      `son compte. Aucun traceur, aucune publicité, hébergement dans l'Union européenne.`,
    sections: [
      ["Sans compte", "Aucun traceur, aucune publicité, aucun profilage. La consultation ne demande rien."],
      ["Avec un compte", "L'adresse et l'identifiant Google du compte, plus la liste des éditions marquées. Rien d'autre."],
      ["Votre page publique", "Votre identifiant ouvre une page présentant votre collection, consultable sans compte et indexée par les moteurs de recherche. Elle n'affiche jamais votre adresse électronique. Elle se masque depuis la page Mon compte."],
      ["Ce que le site ne fait pas", "Ni revente, ni partage à des tiers, ni mesure d'audience publicitaire."],
      ["Services tiers", "Google pour la connexion, Supabase pour la base, Cloudflare pour l'hébergement et les visuels, TMDB pour les métadonnées."],
      /* Le §10 veut la mention d'affiliation aux trois endroits, `/legal`,
         `/privacy` et `/about`. Elle manquait ici, dans le corps servi. */
      ["Liens affiliés", "Les liens vers les marchands passent par Awin, qui dépose un cookie de suivi lors du clic pour attribuer la commande. Aucun traceur n'est posé par le site lui-même, et rien n'est déposé tant qu'aucun lien marchand n'est cliqué."],
      ["Vos droits", "Accès, rectification et effacement (RGPD art. 17). La suppression du compte et des listes se fait depuis la page Mon compte."],
    ],
  },
};

async function servirLegale(
  chemin: string,
  url: URL,
  next: () => Promise<Response>,
): Promise<Response> {
  const page = PAGES_LEGALES[chemin];
  const reponse = await next();
  if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

  const canonical = `${url.origin}${chemin}`;
  const corps = enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 12px">` +
      `${echapper(page.titre.split(" | ")[0])}</h1>` +
      `<p style="margin:0 0 28px">${echapper(page.description)}</p>` +
      page.sections
        .map(
          ([titre, texte]) =>
            `<section style="margin:0 0 20px">` +
            `<h2 style="font-size:20px;margin:0 0 6px">${echapper(titre)}</h2>` +
            `<p style="margin:0;opacity:.8">${echapper(texte)}</p></section>`,
        )
        .join("") +
      `<p style="margin:28px 0 0">Contact : ` +
      `<a href="mailto:contact@jaquette.app" style="color:var(--reel-accent-clair,#6ea8ff)">` +
      `contact@jaquette.app</a></p>` +
      liensAxes(),
  );

  return injecterListe(reponse, { titre: page.titre, description: page.description }, canonical, corps, null);
}

async function servirBienvenue(url: URL, next: () => Promise<Response>): Promise<Response> {
  const reponse = await next();
  if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

  const canonical = `${url.origin}/welcome`;
  const meta = {
    titre: `Bienvenue | ${SITE_NOM}`,
    description:
      `${SITE_NOM} recense les éditions physiques de films sorties en France : Blu-ray, 4K, DVD, ` +
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

/* ------------------------------------------------------------------------ */
/* Profils publics                                                            */
/* ------------------------------------------------------------------------ */

interface ProfilSeo {
  identifiant: string;
  nom: string;
  possedees: number;
  envies: number;
}

/**
 * `decodeURIComponent` qui ne lève pas.
 *
 * Il jette `URIError` sur une séquence tronquée, `/u/%zz` par exemple, et
 * l'appel se fait hors de tout `try` : une adresse malformée dans une barre de
 * navigation suffirait à rendre 500 sur un chemin de consultation. Le repli
 * rend la chaîne telle quelle, qui sera de toute façon écartée par la
 * normalisation.
 */
function decoder(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Lit un profil public, ou rend `null`.
 *
 * `profil_public` est déclarée `stable`, donc PostgREST accepte le **GET** avec
 * les arguments en chaîne de requête. C'est ce qui permet le cache de
 * périphérie : en POST, la réponse ne serait jamais mise en cache, et chaque
 * aperçu de lien déclencherait une requête Supabase.
 *
 * La fonction rend `null` aussi bien pour un identifiant inconnu que pour un
 * profil masqué, et cette indistinction est voulue : elle empêche l'adresse de
 * devenir un oracle qui dit quels comptes existent. Le middleware ne la défait
 * pas, il répond 404 dans les deux cas.
 */
async function lireProfil(identifiant: string): Promise<ProfilSeo | null> {
  const url =
    `https://${PROJET}.supabase.co/rest/v1/rpc/profil_public` +
    `?p_identifiant=${encodeURIComponent(identifiant)}`;

  const reponse = await fetch(url, {
    headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}` },
    cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
  } as RequestInit);

  if (!reponse.ok) throw new Error(`profil ${identifiant} : HTTP ${reponse.status}`);
  const donnees = (await reponse.json()) as ProfilSeo | null;
  return donnees && donnees.identifiant ? donnees : null;
}

/**
 * L'identifiant du jour d'un compte qui portait `identifiant`, ou `null`.
 *
 * C'est ce qui fait qu'un lien partagé survit à un renommage. Elle n'est
 * appelée que lorsque `lireProfil` a déjà rendu `null`, donc sur le chemin du
 * 404 : les profils qui répondent ne paient pas cet aller-retour.
 *
 * `identifiant_courant` est `stable`, donc le GET est accepté et la réponse
 * entre dans le cache de périphérie, comme `profil_public`. Une panne rend
 * `null` : on sert alors la page introuvable, qui est la bonne réponse par
 * défaut, plutôt que de casser la requête.
 */
async function lireIdentifiantCourant(identifiant: string): Promise<string | null> {
  try {
    const url =
      `https://${PROJET}.supabase.co/rest/v1/rpc/identifiant_courant` +
      `?p_identifiant=${encodeURIComponent(identifiant)}`;

    const reponse = await fetch(url, {
      headers: { apikey: CLE_ANON, Authorization: `Bearer ${CLE_ANON}` },
      cf: { cacheTtl: CACHE_SECONDES, cacheEverything: true },
    } as RequestInit);

    if (!reponse.ok) return null;
    const courant = (await reponse.json()) as string | null;
    return typeof courant === "string" && courant.length > 0 ? courant : null;
  } catch {
    return null;
  }
}

/**
 * `/u/<identifiant>` : la page qu'on partage.
 *
 * Elle sert un `<head>` complet parce que **c'est tout ce que lit un aperçu de
 * lien** : ni Discord, ni iMessage, ni WhatsApp n'exécutent le JavaScript, et
 * un profil partagé qui s'annonce « jaquette.app, le catalogue des éditions
 * Blu-ray » ne dit pas de qui il s'agit. C'est la raison d'être de ce
 * gestionnaire, plus encore que pour les fiches films.
 *
 * **Indexable depuis le 3 août 2026**, après avoir été en `noindex` la journée
 * même. Le motif du `noindex` était le contenu mince, l'argument qui a fait
 * écarter les pages éditions au §7 : une grille d'affiches déjà servies par les
 * fiches films. Position renversée, parce qu'elle regardait la mauvaise chose :
 * le profil porte ce qu'aucune fiche ne dit, à savoir ce que telle personne
 * possède.
 *
 * **Le garde-fou a changé de place, il n'a pas disparu** : seuls les profils
 * visibles et **non vides** entrent au sitemap (`profils_au_sitemap`), comme
 * seuls les films rattachés à une édition y entrent. Un profil vide reste
 * servi, on ne le déclare simplement pas.
 *
 * **JSON-LD `ProfilePage` depuis le même jour.** Il était écarté au motif qu'on
 * ne décrit pas une personne réelle sur une page qu'on demande de ne pas
 * indexer ; l'objection tombe avec le `noindex`. Le nœud reste maigre à
 * dessein : un nom saisi par l'intéressé, son « @ » et l'adresse. Ni date de
 * naissance, ni réseau social, ni rien qu'on ne nous ait donné.
 *
 * **Pas de liste d'éditions dans le corps injecté**, contrairement aux fiches :
 * elle coûterait un second aller-retour Supabase, et le texte servi porte déjà
 * les décomptes. À rouvrir si la Search Console juge la page trop maigre.
 */
function corpsProfil(profil: ProfilSeo, description: string): string {
  return enveloppe(
    `<h1 style="font-family:var(--reel-font-titre,inherit);font-size:38px;margin:0 0 8px">` +
      `${echapper(profil.nom)}</h1>` +
      `<p style="margin:0 0 20px;font-family:ui-monospace,monospace;` +
      `color:var(--reel-accent-clair,#6ea8ff)">@${echapper(profil.identifiant)}</p>` +
      `<p style="margin:0 0 28px">${echapper(description)}</p>` +
      `<p style="margin:0"><a href="/" style="color:var(--reel-accent-clair,#6ea8ff)">` +
      `Parcourir le catalogue des éditions physiques</a></p>` +
      liensAxes(),
  );
}

/**
 * JSON-LD d'un profil : `ProfilePage` portant une `Person`.
 *
 * Volontairement maigre. Une `Person` invite à déclarer une date de naissance,
 * un employeur, des comptes sur d'autres réseaux ; on n'a rien de tout ça et on
 * ne le demandera pas. Restent le nom saisi par l'intéressé, son « @ » en
 * `alternateName`, et l'adresse.
 *
 * `interactionStatistic` porte le nombre d'éditions possédées : c'est la seule
 * mesure que la page avance, et la déclarer évite qu'un moteur la devine à
 * partir du texte.
 */
function donneesProfil(profil: ProfilSeo, canonical: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    mainEntity: compacter({
      "@type": "Person",
      "@id": `${canonical}#personne`,
      name: profil.nom,
      alternateName: `@${profil.identifiant}`,
      url: canonical,
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CollectAction",
        userInteractionCount: profil.possedees,
      },
    }),
  }).replace(/</g, "\\u003c");
}

async function servirProfil(url: URL, next: () => Promise<Response>): Promise<Response> {
  const segments = url.pathname.split("/").filter(Boolean);
  // `/u`, `/u/a/b` : rien d'autre que `/u/<identifiant>` n'existe.
  if (segments.length !== 2) return pageIntrouvable(next);

  const demande = segments[1];
  const identifiant = normaliserIdentifiant(decoder(demande));
  if (!identifiant) return pageIntrouvable(next);
  /* Une adresse en majuscules ou ponctuée désigne le même profil : on la ramène
     à sa forme canonique, sinon `/u/Rayan` et `/u/rayan` seraient deux
     adresses pour la même page. */
  if (identifiant !== demande) {
    return Response.redirect(`${url.origin}${cheminProfil(identifiant)}${url.search}`, 301);
  }

  try {
    const profil = await lireProfil(identifiant);
    if (!profil) {
      /* Personne ne porte cette adresse aujourd'hui : quelqu'un l'a peut-être
         portée hier. Une 301 plutôt qu'un 404, pour que le lien déjà partagé
         suive son propriétaire et que Google réattribue le classement de
         l'ancienne adresse à la nouvelle. */
      const courant = await lireIdentifiantCourant(identifiant);
      if (courant) {
        return Response.redirect(`${url.origin}${cheminProfil(courant)}${url.search}`, 301);
      }
      return pageIntrouvable(next);
    }

    const reponse = await next();
    if (!(reponse.headers.get("content-type") ?? "").includes("text/html")) return reponse;

    /* Doit dire la même chose que `descriptionProfil` dans
       `ProfilPublicPage.tsx` : les deux textes sont écrits séparément, comme le
       corps d'une fiche film et son composant, donc ils restent volontairement
       simples pour que la dérive soit lente. */
    const description =
      `La collection de ${profil.nom} sur ${SITE_NOM} : ` +
      `${profil.possedees} édition${profil.possedees > 1 ? "s" : ""} ` +
      `possédée${profil.possedees > 1 ? "s" : ""}, ` +
      `${profil.envies} envie${profil.envies > 1 ? "s" : ""}.`;
    const meta = {
      titre: `${profil.nom} (@${profil.identifiant}) | ${SITE_NOM}`,
      description,
    };

    const canonique = `${url.origin}${cheminProfil(identifiant)}`;
    return injecterListe(
      reponse,
      meta,
      canonique,
      corpsProfil(profil, description),
      donneesProfil(profil, canonique),
    );
  } catch {
    /* Même règle que partout ici : le partage se dégrade, la consultation ne
       s'arrête pas. React rendra la page côté client. */
    return next();
  }
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

/** Le seul hôte qui fait autorité. Tout le reste sert le même site. */
const HOTE_CANONIQUE = "jaquette.app";

/**
 * Point d'entrée. Il ne fait qu'une chose de plus que `servir` : refuser
 * l'indexation à tout hôte qui n'est pas `jaquette.app`.
 *
 * Cloudflare Pages publie chaque projet sur `<projet>.pages.dev` et chaque
 * déploiement sur `<hachage>.<projet>.pages.dev`. Ces adresses servaient le
 * site entier en 200, `robots.txt` compris, avec un `Allow: /` — et comme le
 * canonical est calculé depuis l'URL courante (§7), une fiche vue là-bas se
 * déclarait canonique **d'elle-même**. Soit 9 525 URL en double, indexables,
 * en concurrence avec jaquette.app sur ses propres requêtes. Tout le §7
 * s'emploie à écarter les doublons ; celui-ci passait par la porte d'à côté.
 *
 * **Un `noindex` et non une 301** : les déploiements de prévisualisation
 * servent à vérifier une mise en ligne avant qu'elle n'atteigne le domaine, et
 * une redirection les rendrait inutilisables, ce qui est précisément la façon
 * dont ce fichier se teste.
 *
 * La production ne reçoit rien de plus : l'égalité est testée en premier et la
 * réponse ressort telle quelle. Ailleurs, on reconstruit la réponse pour avoir
 * des en-têtes modifiables, `Response.redirect` rendant les siens figés.
 */
export async function onRequest(context: Contexte): Promise<Response> {
  const reponse = await servir(context);
  if (new URL(context.request.url).hostname === HOTE_CANONIQUE) return reponse;

  const marquee = new Response(reponse.body, reponse);
  marquee.headers.set("X-Robots-Tag", "noindex");
  return marquee;
}

async function servir(context: Contexte): Promise<Response> {
  const { request, next } = context;

  /* Chemin rapide. Le middleware voit passer tout le trafic, assets compris :
     ce qui ne le concerne pas doit ressortir immédiatement. */
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const url = new URL(request.url);

  /*
   * Sur le domaine, l'origine est une constante, pas une lecture de la requête.
   *
   * `url.origin` vient de l'en-tête `Host`, que le client écrit. Cloudflare
   * refuse tout hôte hors zone, `evil.example` comme `jaquette.app.evil.example`
   * rendent 403, mais **le port passe** :
   *
   *     curl -H 'Host: jaquette.app:8080' https://jaquette.app/movies/560
   *     301  https://jaquette.app:8080/movies/harry-potter-…/560
   *     <link rel="canonical" href="https://jaquette.app:8080/…" />
   *
   * Une quinzaine de `${url.origin}` en dépendent, canonical, `og:url` et le
   * `Location` des 301. On normalise donc une fois ici, plutôt que de reprendre
   * chaque ligne : les autres hôtes gardent leur origine réelle, `localhost`
   * sous `wrangler` et les déploiements de prévisualisation en ont besoin pour
   * rester testables, et ils sont de toute façon en `noindex`.
   */
  if (url.hostname === HOTE_CANONIQUE) {
    url.protocol = "https:";
    url.port = "";
  }

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

  /*
   * `/@rayan` vers `/u/rayan`.
   *
   * C'est la forme qu'on écrit à la main, celle qu'on tape après avoir lu un
   * « @ » quelque part. L'adresse canonique reste `/u/<identifiant>` : un
   * arobase dans un chemin se fait percent-encoder par une partie des clients,
   * et une adresse qui se copie sous deux formes n'en est pas une.
   */
  if (url.pathname.startsWith("/@")) {
    const identifiant = normaliserIdentifiant(decoder(url.pathname.slice(2)));
    if (identifiant) {
      return Response.redirect(`${url.origin}${cheminProfil(identifiant)}${url.search}`, 301);
    }
  }

  if (url.pathname === "/u" || url.pathname.startsWith("/u/")) {
    return servirProfil(url, next);
  }

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
  if (url.pathname.startsWith("/ean/")) {
    const code = url.pathname.slice(5).replace(/\/$/, "");
    if (!/^[0-9]{13}$/.test(code)) return pageIntrouvable(next);
    try {
      return await servirEan(code, url, next);
    } catch {
      return next();
    }
  }
  if (url.pathname === "/legal" || url.pathname === "/privacy") {
    try {
      return await servirLegale(url.pathname, url, next);
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
