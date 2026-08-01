/**
 * Contenu de la page `/about`, en questions et réponses.
 *
 * Structure reprise de la FAQ de Letterboxd : des sections, des questions à
 * ancre propre, un sommaire en tête. Leur page en compte cent quinze ; celle-ci
 * en compte vingt-neuf, et c'est délibéré. Un site d'un mois qui écrirait cent
 * questions les inventerait, et cent réponses creuses sont exactement le
 * contenu mince qu'on a passé la journée à écarter du reste du site.
 *
 * Module **sans aucune dépendance** : `functions/_middleware.ts` l'importe pour
 * écrire le corps servi aux moteurs, la page React l'importe pour l'affichage.
 * Une seule source, donc les deux disent forcément la même chose. C'est le
 * piège consigné au §7, le corps injecté et le composant qui dérivent sans que
 * rien ne le signale, et ici il est fermé pour de bon.
 *
 * **Pas de balisage `FAQPage`.** Google a restreint ce résultat enrichi aux
 * sites gouvernementaux et de santé en août 2023 ; le déclarer ne produirait
 * rien. Le texte, lui, reste parfaitement lisible par un moteur.
 *
 * Les chiffres sont arrondis par le bas, comme l'accroche de l'accueil : ils ne
 * font que croître, donc « plus de 8 400 » reste vrai sans qu'on y touche.
 * Relevés le 1er août 2026 sur 4 582 œuvres, 8 471 éditions, 5 305 codes-barres
 * et 712 séries.
 */

export interface Question {
  /** Ancre d'URL, `#comment-marquer-une-edition`. Figée : elle se partage. */
  ancre: string;
  question: string;
  /** Un paragraphe par entrée. */
  reponse: string[];
}

export interface SectionFaq {
  ancre: string;
  titre: string;
  questions: Question[];
}

export const FAQ: SectionFaq[] = [
  {
    ancre: "le-site",
    titre: "Le site",
    questions: [
      {
        ancre: "qu-est-ce-que-jaquette",
        question: "Qu’est-ce que jaquette.app ?",
        reponse: [
          "Un catalogue des éditions physiques de films sorties en France : Blu-ray, 4K, steelbooks, digibooks, coffrets. Plus de 8 400 éditions rattachées à plus de 4 500 œuvres.",
          "Un même film existe souvent en dizaines d’éditions, et ces différences comptent pour qui collectionne. Aucune base ne les recensait correctement en français.",
        ],
      },
      {
        ancre: "pourquoi-ce-nom",
        question: "Pourquoi « jaquette.app » ?",
        reponse: [
          "La jaquette est ce qui distingue une édition d’une autre sur une étagère, et c’est l’objet que le site montre en premier.",
          "Le « .app » fait partie du nom : « jaquette » seul est un nom commun, l’extension est ce qui en fait une marque.",
        ],
      },
      {
        ancre: "est-ce-gratuit",
        question: "Le site est-il gratuit ?",
        reponse: [
          "Oui, entièrement, et il n’y a pas d’abonnement payant prévu. Consulter le catalogue ne demande même pas de compte.",
        ],
      },
      {
        ancre: "qui-est-derriere",
        question: "Qui est derrière ?",
        reponse: [
          "Rayan Adamczak, designer, à titre personnel et non professionnel. Le projet est né d’un besoin simple : savoir quelle édition d’un film on possède déjà avant d’en acheter une autre.",
        ],
      },
      {
        ancre: "vendez-vous-quelque-chose",
        question: "Vendez-vous quelque chose ?",
        reponse: [
          "Non. Le site ne vend rien, ne permet aucun achat, et ne comporte à ce jour aucun partenariat commercial.",
          "Des liens d’affiliation pourraient être ajoutés un jour. Ils seraient signalés clairement, et les prix affichés aujourd’hui sont des prix conseillés par l’éditeur, pas des offres de vente.",
        ],
      },
    ],
  },
  {
    ancre: "le-catalogue",
    titre: "Le catalogue",
    questions: [
      {
        ancre: "d-ou-viennent-les-donnees",
        question: "D’où viennent les données ?",
        reponse: [
          "Les informations sur les œuvres, titres, années, synopsis, distribution, affiches, viennent de The Movie Database, base communautaire ouverte.",
          "Les données sur les éditions physiques, formats, dates, contenus, codes-barres, fiches techniques, sont compilées à partir de sources publiques spécialisées et de sites d’éditeurs. Ce sont des données factuelles de catalogage.",
        ],
      },
      {
        ancre: "quels-supports",
        question: "Quels supports sont couverts ?",
        reponse: [
          "Le Blu-ray, le Blu-ray 4K et le Blu-ray 3D, avec leurs variantes de boîtier : steelbook, digipack, digibook, coffret, slipcover.",
          "Le DVD n’est présent que lorsqu’il accompagne un Blu-ray dans un combo. Le catalogue ne vise pas le DVD seul.",
        ],
      },
      {
        ancre: "les-series",
        question: "Les séries sont-elles couvertes ?",
        reponse: [
          "Oui, plus de 700 séries figurent au catalogue, avec leurs coffrets de saisons et leurs intégrales. Elles sont traitées comme les films.",
        ],
      },
      {
        ancre: "pourquoi-pas-de-jaquette",
        question: "Pourquoi certaines éditions n’ont-elles pas de visuel ?",
        reponse: [
          "Parce que la source qui les décrit n’en publie pas. Le catalogue est assemblé à partir de plusieurs sources, et elles ne fournissent pas les mêmes choses.",
          "Dans ce cas la vignette retombe sur l’affiche du film, qui vient de TMDB.",
        ],
      },
      {
        ancre: "pourquoi-pas-de-fiche-technique",
        question: "Pourquoi certaines éditions n’ont-elles pas de fiche technique ?",
        reponse: [
          "Même raison, en miroir : les sources qui publient les jaquettes ne publient pas les spécifications du disque, et celles qui publient les spécifications ne publient pas les jaquettes.",
          "Environ 2 500 éditions portent une fiche technique complète, définition, HDR, ratio, pistes audio, sous-titres, éditeur.",
        ],
      },
      {
        ancre: "edition-manquante",
        question: "Une édition manque, ou une information est fausse. Que faire ?",
        reponse: [
          "Écrire à contact@jaquette.app. Les corrections sont bienvenues, en particulier sur les rattachements entre une édition et son film : c’est la partie la plus difficile à automatiser, et il en reste de faux.",
        ],
      },
      {
        ancre: "a-quelle-frequence",
        question: "À quelle fréquence le catalogue est-il mis à jour ?",
        reponse: [
          "Par campagnes, quand une nouvelle source est intégrée ou qu’une source existante est repassée. Il n’y a pas de mise à jour quotidienne automatique.",
        ],
      },
    ],
  },
  {
    ancre: "les-editions",
    titre: "Les éditions",
    questions: [
      {
        ancre: "qu-est-ce-qu-une-edition",
        question: "Qu’appelez-vous une « édition » ?",
        reponse: [
          "Un objet physique précis, pas un film. Le steelbook 4K d’un revendeur et le Blu-ray simple du même titre sont deux éditions distinctes, avec leur propre code-barres, leur propre date et souvent leur propre contenu.",
          "C’est toute la raison d’être du site : « j’ai Dune » ne dit pas laquelle des huit éditions vous avez.",
        ],
      },
      {
        ancre: "que-signifie-la-zone",
        question: "Que signifie la zone A, B ou C ?",
        reponse: [
          "Le verrouillage régional du disque. Un Blu-ray de zone A ne se lit pas sur un lecteur européen non dézoné, et la France est en zone B.",
          "La zone n’est indiquée que lorsque la source l’affirme. Les mentions marquées « untested » chez elle ne sont pas reprises : les afficher les ferait passer pour des garanties.",
        ],
      },
      {
        ancre: "a-quoi-sert-le-code-barres",
        question: "À quoi sert le code-barres affiché sur une édition ?",
        reponse: [
          "À identifier le disque sans ambiguïté, en boutique ou en occasion. Deux éditions au titre presque identique se distinguent par leur EAN.",
          "Plus de 5 300 éditions en portent un. C’est une donnée que ni TMDB ni les sites de critique ne publient.",
        ],
      },
      {
        ancre: "les-specs-du-disque",
        question: "Les spécifications décrivent-elles le film ou le disque ?",
        reponse: [
          "Le disque. Une 4K en Dolby Vision et un Blu-ray 1080p du même film n’ont ni la même définition ni les mêmes pistes audio.",
          "La fiche du film agrège ce qui existe quelque part au catalogue et se lit « disponible en Dolby Vision », jamais « ce film est en Dolby Vision ».",
        ],
      },
      {
        ancre: "les-coffrets",
        question: "Comment un coffret apparaît-il ?",
        reponse: [
          "Sur la fiche de chacun des films qu’il contient. Un coffret de quatre films apparaît donc quatre fois, et le marquer une seule fois suffit à le voir partout.",
        ],
      },
      {
        ancre: "prix",
        question: "Les prix affichés sont-ils à jour ?",
        reponse: [
          "Non, et ils ne prétendent pas l’être. Quand un prix est indiqué, c’est le prix conseillé par l’éditeur au moment du relevé, pas le prix d’un marchand aujourd’hui.",
        ],
      },
    ],
  },
  {
    ancre: "collection-et-envies",
    titre: "Collection et envies",
    questions: [
      {
        ancre: "comment-marquer-une-edition",
        question: "Comment marquer une édition comme possédée ?",
        reponse: [
          "Sur la fiche d’un film, chaque édition porte deux boutons ronds : l’un ajoute à votre collection, l’autre à vos envies. Un second clic retire.",
        ],
      },
      {
        ancre: "faut-il-un-compte",
        question: "Faut-il un compte ?",
        reponse: [
          "Pour consulter, non, et ça ne changera pas. Pour marquer une édition ou constituer une liste d’envies, oui.",
          "Le compte sert à ce que vos listes soient enregistrées côté serveur, donc retrouvées d’un appareil à l’autre et conservées après un vidage de cache.",
        ],
      },
      {
        ancre: "mes-listes-sont-elles-publiques",
        question: "Mes listes sont-elles visibles par d’autres ?",
        reponse: [
          "Non. Elles ne sont lisibles que par vous, et la base l’impose : aucun autre compte n’a le droit de les lire.",
          "Il n’existe pas de profil public à ce jour, et en créer un demanderait un choix explicite de votre part.",
        ],
      },
      {
        ancre: "exporter-mes-listes",
        question: "Puis-je exporter ou importer mes listes ?",
        reponse: [
          "Pas encore. Il n’y a ni import depuis un autre service ni export au format fichier. C’est une lacune connue.",
        ],
      },
    ],
  },
  {
    ancre: "compte-et-donnees",
    titre: "Compte et données",
    questions: [
      {
        ancre: "pourquoi-google",
        question: "Pourquoi la connexion se fait-elle uniquement avec Google ?",
        reponse: [
          "Pour n’avoir ni mot de passe à stocker, ni procédure de réinitialisation à tenir, ni formulaire d’inscription à remplir. C’est le choix le plus sobre pour un projet personnel.",
          "D’autres méthodes pourraient être ajoutées si le besoin se fait sentir.",
        ],
      },
      {
        ancre: "ou-sont-mes-donnees",
        question: "Où sont hébergées mes données ?",
        reponse: [
          "Sur Supabase, en Suède, donc dans l’Union européenne. Ce qui existe côté serveur se limite à votre adresse e-mail, votre identifiant Google, et la liste des éditions que vous avez marquées.",
        ],
      },
      {
        ancre: "supprimer-mon-compte",
        question: "Comment supprimer mon compte ?",
        reponse: [
          "Depuis la page Mon compte. La suppression est immédiate et définitive : elle efface le compte et toutes vos listes avec lui.",
          "Une confirmation en deux temps est demandée, avec un mot à recopier, précisément parce que l’action est irréversible.",
        ],
      },
      {
        ancre: "trackers",
        question: "Y a-t-il des traqueurs ou de la publicité ?",
        reponse: [
          "Aucun. Pas de régie publicitaire, pas de mesure d’audience tierce, pas de bandeau de consentement, parce qu’il n’y a rien à consentir.",
        ],
      },
    ],
  },
  {
    ancre: "technique",
    titre: "Questions techniques",
    questions: [
      {
        ancre: "api",
        question: "Existe-t-il une API ou une application mobile ?",
        reponse: [
          "Non, ni l’un ni l’autre. Le site est conçu pour être utilisable au téléphone, en rayon, mais ce n’est pas une application installable.",
        ],
      },
      {
        ancre: "reutiliser-les-donnees",
        question: "Puis-je réutiliser les données du catalogue ?",
        reponse: [
          "La consultation, l’usage privé et la citation avec lien sont libres. L’extraction massive de la base ne l’est pas : sa constitution représente un investissement protégé par le droit des bases de données.",
          "Pour un usage particulier, écrire à contact@jaquette.app.",
        ],
      },
      {
        ancre: "signaler-un-bug",
        question: "Comment signaler un problème sur le site ?",
        reponse: [
          "À contact@jaquette.app, avec l’adresse de la page concernée si possible.",
        ],
      },
    ],
  },
];

/** Toutes les questions, tous axes confondus. Sert aux décomptes. */
export function toutesLesQuestions(): Question[] {
  return FAQ.flatMap((s) => s.questions);
}
