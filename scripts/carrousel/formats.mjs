/**
 * Les cinq formats de carrousel, un par intention éditoriale.
 *
 * Chacun rend une liste de **descripteurs** de planche, pas du HTML : c'est
 * l'orchestrateur qui attribue le rang, la couleur et le total, sans quoi
 * chaque format aurait sa propre façon de compter et les couleurs cesseraient
 * de se suivre d'un carrousel à l'autre.
 *
 * Tous sont en **lecture seule**. Rien ici n'écrit en base ni ne poste quoi que
 * ce soit : la publication reste un geste manuel, c'est-à-dire une relecture.
 *
 * Chaque format rend aussi sa légende. Elle porte le nom de l'éditeur du
 * disque, systématiquement et pas quand on y pense : c'est ce qui transforme
 * la reprise d'un packshot en promotion à ses yeux, et le §10 rappelle que les
 * visuels des cinq sources non licenciées sont repris en connaissance de cause.
 */

import {
  lire, compter, visuel, zonesDe, dateFr, jourFr, moisFr, finDeMois,
  titreEdition, estFormatSeul, filmDe,
} from "./donnees.mjs";

const COLONNES = [
  "id", "titre", "ean", "date_parution", "editeur", "distributeur", "formats_extraits",
  "region", "resolution", "hdr", "disques", "packaging", "image_url", "images_secondaires",
  "collection_editeur", "numero_collection", "source",
].join(",");

const AVEC_FILM = `${COLONNES},edition_films(films(id,titre,annee,slug))`;

/** Aujourd'hui en ISO, sans passer par `new Date().toISOString()` qui bascule en UTC. */
function aujourdhui() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function ilYA(jours) {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Badges d'une édition : format, zone, définition.
 *
 * Le premier prend la couleur de la planche, d'où l'ordre : c'est le format qui
 * dit ce qu'on regarde, pas la zone. Le titre de source porte déjà le format
 * mais il porte aussi le reste, on ne s'en sert pas comme d'une donnée (§9).
 */
function badgesDe(edition) {
  const formats = Array.isArray(edition.formats_extraits) ? edition.formats_extraits : [];
  const badges = [...formats.slice(0, 3), ...zonesDe(edition.region).slice(0, 1)];
  if (edition.resolution && !formats.some((f) => /4k/i.test(f))) {
    badges.push(edition.resolution.split(/[,/]/)[0].trim());
  }
  return [...new Set(badges.filter(Boolean))].slice(0, 3);
}

/**
 * La ligne de pied, réduite à la date.
 *
 * Le premier jet en posait quatre, éditeur, collection, date et code-barres,
 * illisibles à la taille d'un fil. Puis deux, éditeur et date. Puis celle-ci.
 *
 * **L'éditeur est sorti de la planche le 5 août 2026.** `Warner Bros.` ou
 * `20th Century Studios` sur une image ne dit rien à qui la croise : ce n'est
 * pas ce qui fait choisir un disque, et sur un post d'annonce ça occupait la
 * dernière ligne pour une information de catalogue. Il reste dans la légende,
 * où `mentionEditeurs` le cite, et le compte l'identifie mieux en l'étiquetant
 * sur l'image : une étiquette notifie l'éditeur, une ligne de texte non.
 *
 * La collection, le nombre de disques et le code-barres se lisent sur la fiche,
 * ce que la dernière planche invite à faire. Aucun prix, jamais, voir
 * `gabarit.fin`.
 */
function lignesDe(edition) {
  const date = dateFr(edition.date_parution);
  if (date) return [`Paru le <b>${date}</b>`];
  if (edition.disques) return [`<b>${edition.disques}</b> disques`];
  return [];
}

/**
 * Le nom de l'édition, ou rien quand il ne fait que répéter le titre du film.
 *
 * Les sources qui ne qualifient pas leur produit, Leclerc en tête, recopient le
 * titre du film dans `editions.titre`. La planche affichait alors « The Batman »
 * deux fois de suite, une fois en titre et une fois en sous-titre coloré, ce qui
 * se lit comme un défaut d'affichage.
 *
 * Les diacritiques sont écrites en points de code et non en clair : un caractère
 * combinant recopié dans un fichier source est invisible à la relecture, et une
 * classe qui a perdu ses bornes ne replie plus rien sans le dire (§9).
 */
function replier(s) {
  return (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function nomEdition(edition, titreFilm) {
  const nom = titreEdition(edition);
  if (!nom) return null;
  if (estFormatSeul(nom)) return null;
  if (replier(nom) === replier(titreFilm)) return null;

  /* Le titre du film est retiré, puis on reteste : les sources qui le recopient
     lui accolent souvent le format, « Les Spécialistes BLU-RAY DISC ». Ni le
     test d'égalité ni celui de vocabulaire ne l'attrapent seuls, et le
     sous-titre répétait alors le titre juste au-dessus en y ajoutant ce que les
     capsules disent déjà. */
  const i = nom.toLowerCase().indexOf((titreFilm ?? "").toLowerCase());
  if (titreFilm && i !== -1) {
    const reste = (nom.slice(0, i) + nom.slice(i + titreFilm.length)).trim();
    if (!reste || estFormatSeul(reste)) return null;
  }
  return nom;
}

/**
 * Attache son visuel à chaque édition et **écarte celles qui n'en ont pas
 * d'exploitable**.
 *
 * C'est le seul endroit qui décide de la qualité du carrousel. Une planche
 * floue ne lève aucune erreur et ne se voit qu'une fois publiée ; la sortir ici
 * coûte une édition et sauve la série.
 */
async function avecVisuels(editions, options = {}) {
  const sorties = [];
  for (const edition of editions) {
    const v = await visuel(edition, options);
    if (v) sorties.push({ ...edition, visuel: v });
  }
  return sorties;
}

/** Les éditeurs cités dans un lot, pour la légende. */
function editeursDe(editions) {
  return [...new Set(editions.map((e) => e.editeur).filter(Boolean))];
}

function mentionEditeurs(editions) {
  const noms = editeursDe(editions);
  if (!noms.length) return "";
  return `\n\nVisuels : ${noms.join(", ")}.`;
}

const MOTS_CLES =
  "#bluray #4kultrahd #steelbook #collectionbluray #cinephile #filmcollection " +
  "#physicalmedia #jaquetteapp";

/* ================================================================ comparatif */

/**
 * Toutes les éditions d'un même film, une par planche.
 *
 * C'est le format qui vaut le plus, et pour une raison structurelle : personne
 * d'autre ne peut le produire. My Movies compte un coffret comme un seul film,
 * SensCritique n'a pas de couche édition, et l'utilisateur y dédouble l'œuvre à
 * la main pour distinguer une Ultimate Edition de la version cinéma (§8). Ici
 * c'est le modèle de données qui répond.
 */
async function comparatif(argument, { max = 8 } = {}) {
  if (!argument) throw new Error("comparatif : donner un id de film ou un slug");

  const filtre = /^\d+$/.test(argument)
    ? `id=eq.${argument}`
    : `slug=eq.${encodeURIComponent(argument)}`;
  const [film] = await lire(
    `films?select=id,titre,annee,realisateur,slug,type&${filtre}&limit=1`);
  if (!film) throw new Error(`comparatif : aucun film pour « ${argument} »`);

  const liens = await lire(
    `edition_films?film_id=eq.${film.id}&select=editions(${COLONNES})&limit=200`);
  const brutes = liens.map((l) => l.editions).filter(Boolean);
  if (!brutes.length) throw new Error(`comparatif : « ${film.titre} » n'a aucune édition`);

  /* Les éditions datées d'abord, la plus récente en tête : sur une fiche à
     dix-huit éditions, c'est ce que quelqu'un cherche. `date_parution` est nulle
     sur les sources qui ne datent pas, elles passent derrière plutôt que
     devant. */
  brutes.sort((a, b) => (b.date_parution ?? "").localeCompare(a.date_parution ?? ""));

  const editions = (await avecVisuels(brutes)).slice(0, max);
  if (!editions.length) {
    throw new Error(`comparatif : aucune édition de « ${film.titre} » n'a de visuel net`);
  }

  const total = brutes.length;
  const planches = [
    {
      type: "couverture",
      surtitre: `${total} éditions`,
      titre: film.titre,
      annee: film.annee,
      sous: "Laquelle as-tu&nbsp;?",
      mosaique: editions.map((e) => e.visuel),
    },
    ...editions.map((e) => {
      const nom = nomEdition(e, film.titre);
      return {
        type: "edition",
        titre: nom ?? film.titre,
        annee: nom ? null : film.annee,
        badges: badgesDe(e),
        lignes: lignesDe(e),
        visuel: e.visuel,
      };
    }),
    {
      type: "fin",
      titre: `Les ${total} éditions de ${film.titre}`,
      chemin: `/movies/${film.slug ?? film.id}${film.slug ? `/${film.id}` : ""}`,
    },
  ];

  const legende =
    `${film.titre}${film.annee ? ` (${film.annee})` : ""} existe en ${total} éditions ` +
    `physiques différentes. On les a toutes recensées.\n\n` +
    `Format, zone, éditeur, code-barres : tout est sur la fiche, lien en bio.` +
    `${mentionEditeurs(editions)}\n\n${MOTS_CLES}`;

  return { nom: `comparatif-${film.slug ?? film.id}`, planches, legende };
}

/* =================================================================== sorties */

/**
 * Les parutions récentes, rendez-vous hebdomadaire.
 *
 * Les dates françaises viennent de l'enrichissement dvdfr ; `date_sortie` reste
 * du texte anglais dont un `order by` serait alphabétique, donc faux (§3). On
 * borne à aujourd'hui : la colonne porte aussi des dates à venir, et annoncer
 * comme paru un disque qui ne l'est pas serait le même défaut qu'un prix
 * périmé.
 */
/**
 * Les parutions d'une fenêtre, triées et dédoublonnées. Partagée par les deux
 * formats calendaires, `sorties` qui regarde en arrière et `aparaitre` qui
 * regarde devant : la sélection est la même, seuls les mots changent.
 *
 * **C'est le classement qui décide, pas la date.** Trier par `date_parution`
 * seule rendait les six plus récentes, c'est-à-dire six lignes tirées au hasard
 * dans la fenêtre. Un rendez-vous doit ouvrir sur ce que les gens attendent, et
 * `films.popularite` est exactement cette mesure : recalculée tous les jours
 * chez TMDB à partir des consultations récentes (§3).
 *
 * **Une édition par film.** Un titre sorti le même jour en Blu-ray et en 4K
 * prendrait deux places pour une seule nouvelle.
 */
async function parutions(quoi, debut, fin, max) {
  const brutes = await lire(
    `editions?select=${AVEC_FILM}&date_parution=gte.${debut}&date_parution=lte.${fin}` +
    `&image_url=not.is.null&order=date_parution.asc,id.asc&limit=600`);
  if (!brutes.length) {
    throw new Error(`${quoi} : aucune parution datée entre ${debut} et ${fin}`);
  }

  const idsFilms = [...new Set(brutes.map((e) => filmDe(e)?.id).filter(Boolean))];
  const popularites = new Map();
  for (let i = 0; i < idsFilms.length; i += 200) {
    const lot = await lire(
      `films?id=in.(${idsFilms.slice(i, i + 200).join(",")})&select=id,popularite`);
    for (const f of lot) popularites.set(f.id, f.popularite ?? 0);
  }

  const classees = [...brutes].sort((a, b) =>
    (popularites.get(filmDe(b)?.id) ?? -1) - (popularites.get(filmDe(a)?.id) ?? -1));

  const vus = new Set();
  const candidats = classees.filter((e) => {
    const id = filmDe(e)?.id ?? `sans-film-${e.id}`;
    if (vus.has(id)) return false;
    vus.add(id);
    return true;
  });

  const editions = (await avecVisuels(candidats.slice(0, max * 3))).slice(0, max);
  if (!editions.length) throw new Error(`${quoi} : aucun visuel net sur la période`);
  return { brutes, editions };
}

async function sorties(argument, { max = 6, jours = 30 } = {}) {
  const debut = argument || ilYA(jours);
  const fin_ = aujourdhui();
  const { brutes, editions } = await parutions("sorties", debut, fin_, max);

  /* Le libellé suit la fenêtre réelle et non le mot employé à l'appel : une
     passe lancée avec une date de début quelconque ne doit pas annoncer une
     semaine si elle en couvre cinq. */
  const jourMs = 24 * 3600 * 1000;
  const etendue = Math.round((Date.parse(fin_) - Date.parse(debut)) / jourMs);
  const periode = etendue <= 9 ? "semaine" : etendue <= 40 ? "mois" : "recentes";
  const TITRES = {
    semaine: "Sorties de la semaine",
    mois: "Sorties du mois",
    recentes: "Sorties récentes",
  };

  const planches = [
    {
      type: "couverture",
      surtitre: `Du ${dateFr(debut).replace(/ \d{4}$/, "")} au ${dateFr(fin_)}`,
      titre: TITRES[periode],
      sous: `${brutes.length} parutions recensées.`,
      mosaique: editions.map((e) => e.visuel),
    },
    ...editions.map((e) => {
      const film = filmDe(e);
      return {
        type: "edition",
        titre: film?.titre ?? titreEdition(e),
        annee: film?.annee,
        edition: film ? nomEdition(e, film.titre) : null,
        badges: badgesDe(e),
        lignes: lignesDe(e),
        visuel: e.visuel,
      };
    }),
    {
      type: "fin",
      titre: "Toutes les parutions",
      chemin: "/catalogue",
    },
  ];

  const legende =
    `${TITRES[periode]} : ${brutes.length} parutions recensées ` +
    `du ${dateFr(debut)} au ${dateFr(fin_)}.\n\n` +
    `En voici ${editions.length}. Laquelle rejoint ta collection ? ` +
    `Fiches complètes, lien en bio.` +
    `${mentionEditeurs(editions)}\n\n${MOTS_CLES}`;

  return { nom: `sorties-${periode}-${fin_}`, planches, legende };
}

/* ================================================================ aparaitre */

/**
 * Les parutions **à venir**, post d'annonce.
 *
 * `sorties` borne à aujourd'hui parce qu'annoncer comme paru un disque qui ne
 * l'est pas serait le défaut du prix périmé. Ici c'est l'inverse qui est vrai :
 * un post d'annonce parle du futur, et c'est la **date qui est la nouvelle**.
 * Elle passe donc en surtitre, en couleur et en capitales, là où `sorties` la
 * range en pied de planche à côté de l'éditeur.
 *
 * Par défaut, d'aujourd'hui à la fin du mois courant. Une date de début donnée
 * en argument décale la fenêtre sans changer la borne haute : c'est le cas
 * « annonce le 5 pour le reste du mois ».
 */
async function aparaitre(argument, { max = 8, jusqu = null } = {}) {
  const debut = argument || aujourdhui();
  const fin_ = jusqu || finDeMois(debut);
  if (fin_ < debut) throw new Error(`aparaitre : ${fin_} est avant ${debut}`);

  const { brutes, editions } = await parutions("aparaitre", debut, fin_, max);

  /**
   * La popularité choisit **lesquelles**, la date décide de **l'ordre**.
   *
   * Les deux tris ne répondent pas à la même question. Prendre huit disques sur
   * cent quarante et un demande de savoir lesquels valent la place, et c'est la
   * popularité ; les montrer demande un fil à suivre, et sur une annonce ce fil
   * est le calendrier. Trié par popularité, le carrousel sautait du 26 au 7 puis
   * au 19, et il fallait relire chaque surtitre pour se situer.
   *
   * `sorties` garde l'ordre par popularité, et ce n'est pas une incohérence :
   * il raconte ce qui vient de paraître, où l'on ouvre sur le plus gros titre,
   * pas un agenda qu'on parcourt.
   */
  editions.sort((a, b) => a.date_parution.localeCompare(b.date_parution));

  /* Le mois n'est nommé que si la fenêtre tient dedans. Une fenêtre à cheval
     dirait « Sorties d'août » en montrant des disques de septembre. */
  const memeMois = debut.slice(0, 7) === fin_.slice(0, 7);
  const titre = memeMois ? `Sorties d'${moisFr(debut)}` : "À paraître";
  const complet = memeMois && debut.endsWith("-01");

  const planches = [
    {
      type: "couverture",
      surtitre: complet
        ? `Tout le mois d'${moisFr(debut)}`
        : `Du ${jourFr(debut)} au ${jourFr(fin_)}`,
      titre,
      sous: `${brutes.length} disques annoncés.`,
      mosaique: editions.map((e) => e.visuel),
    },
    ...editions.map((e) => {
      const film = filmDe(e);
      return {
        type: "edition",
        /* La date en surtitre, et l'éditeur seul en pied : sur une annonce,
           c'est le quand qu'on retient, pas qui presse le disque. */
        surtitre: `Le ${jourFr(e.date_parution)}`,
        titre: film?.titre ?? titreEdition(e),
        annee: film?.annee,
        edition: film ? nomEdition(e, film.titre) : null,
        badges: badgesDe(e),
        /* Rien en pied : la date est en surtitre et l'éditeur est sorti des
           planches. Une annonce tient en quatre lignes, date, film, édition,
           format. */
        lignes: [],
        visuel: e.visuel,
      };
    }),
    {
      type: "fin",
      titre: memeMois ? `Toutes les sorties d'${moisFr(debut)}` : "Toutes les sorties à venir",
      chemin: "/catalogue",
    },
  ];

  const legende =
    `${titre} : ${brutes.length} disques annoncés ` +
    `du ${dateFr(debut)} au ${dateFr(fin_)}.\n\n` +
    `En voici ${editions.length}. Laquelle tu attends ? Dis-le en commentaire.\n\n` +
    `Dates de parution françaises, fiches complètes : lien en bio.` +
    `${mentionEditeurs(editions)}\n\n${MOTS_CLES}`;

  return { nom: `aparaitre-${debut}`, planches, legende };
}

/* ================================================================ collection */

/**
 * Une collection d'éditeur en cases à cocher.
 *
 * `numero_collection` n'est renseigné que par Make My Day!, de 1 à 98 : c'est la
 * seule série du catalogue dont le rang est publié par la source (§3). Les
 * autres collections n'ont pas de numéro, la grille les range alors par date.
 * Le sens de la planche est le décompte : le lecteur compte les siennes.
 */
async function collection(argument, { parPlanche = 9, max = 6 } = {}) {
  if (!argument) {
    const toutes = await lire(
      "editions?select=collection_editeur&collection_editeur=not.is.null&limit=1000");
    const noms = [...new Set(toutes.map((e) => e.collection_editeur))];
    throw new Error(`collection : donner un nom parmi\n  ${noms.join("\n  ")}`);
  }

  const nom = argument;
  const brutes = await lire(
    `editions?select=${AVEC_FILM}&collection_editeur=eq.${encodeURIComponent(nom)}` +
    `&order=numero_collection.asc.nullslast,date_parution.asc.nullslast&limit=200`);
  if (!brutes.length) throw new Error(`collection : « ${nom} » ne rend aucune édition`);

  /* La vignette de grille fait 210 px de large : le seuil de netteté descend
     avec elle, sinon on écarterait des éditions qui passeraient très bien. */
  const editions = (await avecVisuels(brutes, { minLargeur: 220 }))
    .slice(0, parPlanche * max);

  const lots = [];
  for (let i = 0; i < editions.length; i += parPlanche) {
    lots.push(editions.slice(i, i + parPlanche));
  }

  const planches = [
    {
      type: "couverture",
      surtitre: "Collection",
      titre: nom,
      sous: `${brutes.length} disques recensés.<br />Combien en as-tu&nbsp;?`,
      mosaique: editions.map((e) => e.visuel),
    },
    ...lots.map((lot, i) => ({
      type: "grille",
      titre: nom,
      cases: lot.map((e) => ({
        rang: e.numero_collection ? String(e.numero_collection) : null,
        nom: filmDe(e)?.titre ?? titreEdition(e),
        visuel: e.visuel,
      })),
    })),
    {
      type: "fin",
      titre: `La collection ${nom} au complet`,
      chemin: `/collections/${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    },
  ];

  const legende =
    `La collection ${nom}, ${brutes.length} disques recensés.\n\n` +
    `Combien en as-tu&nbsp;? Dis-le en commentaire.` +
    `${mentionEditeurs(editions)}\n\n${MOTS_CLES}`;

  return { nom: `collection-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, planches, legende };
}

/* =================================================================== éditeur */

/**
 * Le catalogue d'un éditeur.
 *
 * C'est le format qui rapporte le plus de portée à zéro abonné : les petits
 * éditeurs repartagent. Il suppose que `editeur` porte la forme canonique, ce
 * qui est le cas depuis la normalisation du 3 août 2026, 478 écritures ramenées
 * à 70 familles (§7).
 */
async function editeur(argument, { parPlanche = 9, max = 4 } = {}) {
  if (!argument) throw new Error("editeur : donner un nom, par exemple « Carlotta Films »");

  const nom = argument;
  const total = await compter(`editions?select=id&editeur=eq.${encodeURIComponent(nom)}`);
  if (!total) throw new Error(`editeur : « ${nom} » ne rend aucune édition`);

  const brutes = await lire(
    `editions?select=${AVEC_FILM}&editeur=eq.${encodeURIComponent(nom)}` +
    `&image_url=not.is.null&order=date_parution.desc.nullslast,id.desc&limit=120`);

  const editions = (await avecVisuels(brutes, { minLargeur: 220 }))
    .slice(0, parPlanche * max);
  if (!editions.length) throw new Error(`editeur : aucun visuel net chez « ${nom} »`);

  /* Deux planches en gros plan avant la grille : une grille seule se lit comme
     une planche-contact, elle ne donne envie d'aucun disque en particulier. */
  const vedettes = editions.slice(0, 2);
  const reste = editions.slice(2);

  const lots = [];
  for (let i = 0; i < reste.length; i += parPlanche) {
    lots.push(reste.slice(i, i + parPlanche));
  }

  const planches = [
    {
      type: "couverture",
      surtitre: "Éditeur",
      titre: nom,
      sous: `${total} éditions au catalogue.`,
      mosaique: editions.map((e) => e.visuel),
    },
    ...vedettes.map((e) => {
      const film = filmDe(e);
      return {
        type: "edition",
        titre: film?.titre ?? titreEdition(e),
        annee: film?.annee,
        edition: film ? nomEdition(e, film.titre) : null,
        badges: badgesDe(e),
        lignes: lignesDe(e),
        visuel: e.visuel,
      };
    }),
    ...lots.slice(0, max).map((lot) => ({
      type: "grille",
      titre: nom,
      cases: lot.map((e) => ({
        rang: null,
        nom: filmDe(e)?.titre ?? titreEdition(e),
        visuel: e.visuel,
      })),
    })),
    {
      type: "fin",
      titre: `Tout ${nom}`,
      chemin: `/publishers/${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    },
  ];

  const legende =
    `${nom}, ${total} éditions recensées sur jaquette.app.\n\n` +
    `Le catalogue complet est en bio. Laquelle manque à ta collection&nbsp;?` +
    `\n\nVisuels : ${nom}.\n\n${MOTS_CLES}`;

  return { nom: `editeur-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, planches, legende };
}

/* ===================================================================== faces */

/**
 * Le dos, la tranche, l'intérieur d'un même boîtier.
 *
 * 2 877 éditions portent des `images_secondaires`, autour de 1 024 px, et
 * aucune boutique ne les montre. C'est précisément ce que regarde l'acheteur de
 * steelbook, et c'est le seul format dont la matière n'existe nulle part
 * ailleurs.
 */
async function faces(argument, { max = 7 } = {}) {
  if (!argument) throw new Error("faces : donner un id d'édition");

  const [edition] = await lire(`editions?select=${AVEC_FILM}&id=eq.${argument}&limit=1`);
  if (!edition) throw new Error(`faces : aucune édition ${argument}`);

  const secondaires = Array.isArray(edition.images_secondaires)
    ? edition.images_secondaires : [];
  if (!secondaires.length) {
    throw new Error(`faces : l'édition ${argument} n'a pas d'images secondaires`);
  }

  /* Chaque face est traitée comme une édition à visuel unique : c'est le seul
     moyen de réutiliser le contrôle de netteté sans le redire. */
  const vues = await avecVisuels(
    [edition.image_url, ...secondaires].filter(Boolean)
      .map((url) => ({ image_url: url, images_secondaires: [] })));
  if (!vues.length) throw new Error(`faces : aucun visuel net sur l'édition ${argument}`);

  const film = filmDe(edition);
  const titre = film?.titre ?? titreEdition(edition);
  const vuesGardees = vues.slice(0, max);

  const planches = [
    {
      type: "couverture",
      surtitre: "Sous toutes les faces",
      titre,
      sous: `${titreEdition(edition)}<br />${vuesGardees.length} vues du boîtier.`,
      mosaique: vuesGardees.map((v) => v.visuel),
    },
    ...vuesGardees.map((v, i) => ({
      type: "edition",
      titre,
      annee: film?.annee,
      edition: nomEdition(edition, titre),
      /* Badges et ligne de pied sur la première seule : les cinq vues décrivent
         le même disque, les répéter n'ajoute rien et vole la place au visuel,
         qui est tout le propos de ce format. */
      badges: i === 0 ? badgesDe(edition) : [],
      lignes: i === 0 ? lignesDe(edition) : [],
      visuel: v.visuel,
    })),
    {
      type: "fin",
      titre: `${titre}, toutes les éditions`,
      chemin: film?.slug ? `/movies/${film.slug}/${film.id}` : "/catalogue",
    },
  ];

  const legende =
    `${titre} : le boîtier sous toutes ses faces.\n\n` +
    `${titreEdition(edition)}${edition.editeur ? `, ${edition.editeur}` : ""}. ` +
    `Fiche complète en bio.${mentionEditeurs([edition])}\n\n${MOTS_CLES}`;

  return { nom: `faces-${edition.id}`, planches, legende };
}

export const FORMATS = {
  comparatif: {
    construire: comparatif,
    usage: "comparatif <id film | slug>",
    quoi: "Toutes les éditions d'un même film, une par planche.",
  },
  sorties: {
    construire: sorties,
    usage: "sorties [AAAA-MM-JJ de début]",
    quoi: "Les parutions datées des trente derniers jours.",
  },
  aparaitre: {
    construire: aparaitre,
    usage: "aparaitre [AAAA-MM-JJ de début]",
    quoi: "Les parutions à venir, d'une date à la fin du mois. Post d'annonce.",
  },
  collection: {
    construire: collection,
    usage: "collection <nom exact>",
    quoi: "Une collection d'éditeur en cases à cocher.",
  },
  editeur: {
    construire: editeur,
    usage: "editeur <nom exact>",
    quoi: "Le catalogue d'un éditeur, deux gros plans puis la grille.",
  },
  faces: {
    construire: faces,
    usage: "faces <id édition>",
    quoi: "Dos, tranche et intérieur d'un même boîtier.",
  },
};
