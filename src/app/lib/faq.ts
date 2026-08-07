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
 * Relevés le 2 août 2026 sur 8 664 œuvres, 15 483 éditions, 5 460 codes-barres
 * et 741 séries, après les imports Metaluna, Le Chat qui fume et Zavvi et la
 * clôture du fonds blu-ray.com. Les relire après chaque grosse campagne : la
 * péremption ne se signale nulle part.
 */

export interface Question {
  /**
   * Ancre d'URL, `#marking-an-edition`.
   *
   * En anglais comme les chemins (cf. `lib/chemins.ts`) : une ancre fait partie
   * de l'adresse, `/about#delete-my-account` se copie et se partage, donc elle
   * suit la même langue. Figée une fois publiée.
   */
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
    ancre: "about-the-site",
    titre: "Le site",
    questions: [
      {
        ancre: "what-is-jaquette",
        question: "Qu’est-ce que jaquette.app ?",
        reponse: [
          "Un catalogue des éditions physiques de films sorties en France : Blu-ray, 4K, DVD, steelbooks, digibooks, coffrets. Plus de 23 000 éditions rattachées à plus de 12 000 œuvres.",
          "Un même film existe souvent en dizaines d’éditions, et ces différences comptent pour qui collectionne. Aucune base ne les recensait correctement en français.",
        ],
      },
      {
        ancre: "why-this-name",
        question: "Pourquoi « jaquette.app » ?",
        reponse: [
          "La jaquette est ce qui distingue une édition d’une autre sur une étagère, et c’est l’objet que le site montre en premier.",
          "Le « .app » fait partie du nom : « jaquette » seul est un nom commun, l’extension est ce qui en fait une marque.",
        ],
      },
      {
        ancre: "is-it-free",
        question: "Le site est-il gratuit ?",
        reponse: [
          "Oui, entièrement, et il n’y a pas d’abonnement payant prévu. Consulter le catalogue ne demande même pas de compte.",
        ],
      },
      {
        ancre: "who-is-behind",
        question: "Qui est derrière ?",
        reponse: [
          "Rayan Adamczak, designer. Le projet est né d’un besoin simple : savoir quelle édition d’un film on possède déjà avant d’en acheter une autre.",
          "C’est une personne seule, pas une équipe ni une société. Depuis août 2026 le site est déclaré comme activité professionnelle, ce qu’impose le fait de percevoir des commissions d’affiliation ; l’identité complète de l’éditeur figure dans les mentions légales.",
        ],
      },
      {
        ancre: "do-you-sell-anything",
        question: "Vendez-vous quelque chose ?",
        reponse: [
          "Non. Le site ne vend rien et n’encaisse aucun paiement : tout achat se conclut chez le marchand, sous ses propres conditions.",
          "Certaines éditions affichent en revanche un prix accompagné du nom d’un marchand, depuis août 2026. Ce sont des liens affiliés : si vous achetez après avoir cliqué, une commission nous est versée. Le prix que vous payez, lui, ne change pas.",
          "Deux marchands aujourd’hui : E.Leclerc pour les disques neufs, momox shop pour l’occasion. Une offre d’occasion porte la mention de son état à côté du prix, et c’est ce qui explique un montant parfois très inférieur au neuf.",
          "Un prix affiché sans nom de marchand est un prix conseillé par l’éditeur du disque, relevé à sa sortie. Ce n’est pas une offre de vente.",
        ],
      },
      {
        ancre: "how-is-it-funded",
        question: "Comment le site est-il financé ?",
        reponse: [
          "Par l’affiliation, et par rien d’autre. Aucune publicité, aucun abonnement, aucune donnée revendue.",
          "La rémunération n’influence ni le contenu du catalogue ni l’ordre des éditions. Une édition est là parce qu’un disque existe, jamais parce qu’elle rapporte : la très grande majorité du catalogue ne porte aucune offre et y figure aux mêmes conditions.",
          "La consultation restera libre et gratuite, sans compte. C’est la contrepartie de ce modèle : ce qui est gratuit aujourd’hui ne se ferme pas demain.",
        ],
      },
    ],
  },
  {
    ancre: "catalogue",
    titre: "Le catalogue",
    questions: [
      {
        ancre: "where-the-data-comes-from",
        question: "D’où viennent les données ?",
        reponse: [
          "Les informations sur les œuvres, titres, années, synopsis, distribution, affiches, viennent de The Movie Database, base communautaire ouverte.",
          "Les données sur les éditions physiques, formats, dates, contenus, codes-barres, fiches techniques, sont compilées à partir de sources publiques spécialisées et de sites d’éditeurs. Ce sont des données factuelles de catalogage.",
        ],
      },
      {
        ancre: "which-formats",
        question: "Quels supports sont couverts ?",
        reponse: [
          "Le Blu-ray, le Blu-ray 4K, le Blu-ray 3D et le DVD, avec leurs variantes de boîtier : steelbook, digipack, digibook, coffret, slipcover.",
          "Le DVD a longtemps été écarté, et il est entré au catalogue en août 2026 : les collections qu’on nous décrit mêlent les deux, et un disque qu’on possède n’a pas à être haute définition pour figurer sur son étagère.",
        ],
      },
      {
        ancre: "tv-series",
        question: "Les séries sont-elles couvertes ?",
        reponse: [
          "Oui, plus de 700 séries figurent au catalogue, avec leurs coffrets de saisons et leurs intégrales. Elles sont traitées comme les films.",
        ],
      },
      {
        ancre: "missing-artwork",
        question: "Pourquoi certaines éditions n’ont-elles pas de visuel ?",
        reponse: [
          "Parce que la source qui les décrit n’en publie pas. Le catalogue est assemblé à partir de plusieurs sources, et elles ne fournissent pas les mêmes choses.",
          "Dans ce cas la vignette retombe sur l’affiche du film, qui vient de TMDB.",
        ],
      },
      {
        ancre: "missing-specs",
        question: "Pourquoi certaines éditions n’ont-elles pas de fiche technique ?",
        reponse: [
          "Même raison, en miroir : les sources qui publient les jaquettes ne publient pas les spécifications du disque, et celles qui publient les spécifications ne publient pas les jaquettes.",
          "Environ 2 700 éditions portent des spécifications de disque, dont 1 800 la fiche complète : définition, HDR, ratio, pistes audio, sous-titres, éditeur.",
        ],
      },
      {
        ancre: "missing-edition",
        question: "Une édition manque, ou une information est fausse. Que faire ?",
        reponse: [
          "Écrire à contact@jaquette.app. Les corrections sont bienvenues, en particulier sur les rattachements entre une édition et son film : c’est la partie la plus difficile à automatiser, et il en reste de faux.",
        ],
      },
      {
        ancre: "update-frequency",
        question: "À quelle fréquence le catalogue est-il mis à jour ?",
        reponse: [
          "Par campagnes, quand une nouvelle source est intégrée ou qu’une source existante est repassée. Il n’y a pas de mise à jour quotidienne automatique.",
        ],
      },
    ],
  },
  {
    ancre: "editions",
    titre: "Les éditions",
    questions: [
      {
        ancre: "what-is-an-edition",
        question: "Qu’appelez-vous une « édition » ?",
        reponse: [
          "Un objet physique précis, pas un film. Le steelbook 4K d’un revendeur et le Blu-ray simple du même titre sont deux éditions distinctes, avec leur propre code-barres, leur propre date et souvent leur propre contenu.",
          "C’est toute la raison d’être du site : « j’ai Dune » ne dit pas laquelle des huit éditions vous avez.",
        ],
      },
      {
        ancre: "region-codes",
        question: "Que signifie la zone A, B ou C ?",
        reponse: [
          "Le verrouillage régional du disque. Un Blu-ray de zone A ne se lit pas sur un lecteur européen non dézoné, et la France est en zone B.",
          "La zone n’est indiquée que lorsque la source l’affirme. Les mentions marquées « untested » chez elle ne sont pas reprises : les afficher les ferait passer pour des garanties.",
        ],
      },
      {
        ancre: "barcodes",
        question: "À quoi sert le code-barres affiché sur une édition ?",
        reponse: [
          "À identifier le disque sans ambiguïté, en boutique ou en occasion. Deux éditions au titre presque identique se distinguent par leur EAN.",
          "Plus de 14 000 éditions en portent un, soit près d’une sur deux. C’est une donnée que ni TMDB ni les sites de critique ne publient, et c’est elle qui rend le scan possible.",
        ],
      },
      {
        ancre: "disc-specs",
        question: "Les spécifications décrivent-elles le film ou le disque ?",
        reponse: [
          "Le disque. Une 4K en Dolby Vision et un Blu-ray 1080p du même film n’ont ni la même définition ni les mêmes pistes audio.",
          "La fiche du film agrège ce qui existe quelque part au catalogue et se lit « disponible en Dolby Vision », jamais « ce film est en Dolby Vision ».",
        ],
      },
      {
        ancre: "box-sets",
        question: "Comment un coffret apparaît-il ?",
        reponse: [
          "Sur la fiche de chacun des films qu’il contient. Un coffret de quatre films apparaît donc quatre fois, et le marquer une seule fois suffit à le voir partout.",
        ],
      },
      {
        ancre: "prices",
        question: "Les prix affichés sont-ils à jour ?",
        reponse: [
          "Non, et ils ne prétendent pas l’être. Quand un prix est indiqué, c’est le prix conseillé par l’éditeur au moment du relevé, pas le prix d’un marchand aujourd’hui.",
        ],
      },
    ],
  },
  {
    ancre: "collection-and-watchlist",
    titre: "Collection et envies",
    questions: [
      {
        ancre: "marking-an-edition",
        question: "Comment marquer une édition comme possédée ?",
        reponse: [
          "Sur la fiche d’un film, chaque édition porte deux boutons ronds : l’un ajoute à votre collection, l’autre à vos envies. Un second clic retire.",
        ],
      },
      {
        ancre: "do-i-need-an-account",
        question: "Faut-il un compte ?",
        reponse: [
          "Pour consulter, non, et ça ne changera pas. Pour marquer une édition ou constituer une liste d’envies, oui.",
          "Le compte sert à ce que vos listes soient enregistrées côté serveur, donc retrouvées d’un appareil à l’autre et conservées après un vidage de cache.",
        ],
      },
      {
        ancre: "list-privacy",
        question: "Mes listes sont-elles visibles par d’autres ?",
        reponse: [
          "Oui, si votre page publique est active, et elle l’est par défaut. Votre collection et vos envies s’affichent alors sur jaquette.app/u/votre-identifiant, consultable sans compte et référencée par les moteurs de recherche.",
          "Ce que cette page ne montre jamais : votre adresse électronique et votre identifiant Google. Seuls y paraissent le nom que vous avez saisi, votre « @ » et les éditions marquées.",
          "Vous pouvez la masquer à tout moment depuis « Mon compte ». Elle répond alors comme une page inexistante, et non « profil masqué » : personne ne peut déduire de l’adresse que le compte existe.",
        ],
      },
      {
        ancre: "public-profile",
        question: "À quoi sert mon « @ » ?",
        reponse: [
          "Il donne son adresse à votre page de collection : jaquette.app/u/votre-identifiant. C’est le lien qu’on partage, il s’ouvre sans compte, et il est indexé par les moteurs.",
          "Il se choisit à la création du compte et se change ensuite depuis « Mon compte ». Les liens déjà partagés continuent de fonctionner : l’ancienne adresse redirige vers la nouvelle. En contrepartie, un identifiant que vous avez porté n’est jamais rendu à quelqu’un d’autre, sans quoi un lien partagé mènerait un jour vers la collection d’une autre personne.",
        ],
      },
      {
        ancre: "import-and-export",
        question: "Puis-je exporter ou importer mes listes ?",
        reponse: [
          "Les deux, depuis les réglages du compte, et gratuitement. L’export produit un fichier CSV de votre collection et de vos envies, une ligne par édition, avec le film, l’éditeur, le code-barres et le lien vers la fiche.",
          "L’import lit un export Letterboxd, l’archive telle qu’elle est téléchargée, ou n’importe quel fichier CSV portant une colonne de titre. Il lit aussi directement une collection ou une liste SensCritique à partir de votre pseudo.",
          "Rien n’est écrit avant que vous ayez vu le résultat, et rien n’est jamais retiré de vos listes : un import ne peut qu’ajouter, et le refaire deux fois ne crée pas de doublon.",
        ],
      },
      {
        ancre: "import-senscritique",
        question: "Comment fonctionne l’import depuis SensCritique ?",
        reponse: [
          "Votre pseudo suffit, ou l’adresse d’une de vos listes. Nous vous montrons vos envies et vos listes, vous choisissez ce que vous voulez reprendre.",
          "La lecture se fait dans votre navigateur, directement chez eux, via leur interface publique. Nos serveurs n’adressent aucune requête à SensCritique, et nous ne conservons que les éditions que vous décidez d’importer.",
          "Pour Letterboxd, il n’existe pas d’équivalent : leur site interdit les robots, mais ils proposent un export officiel dans Settings, Data, Export your data. C’est cette archive qu’on lit.",
        ],
      },
      {
        ancre: "import-which-edition",
        question: "L’import sait-il quelle édition je possède ?",
        reponse: [
          "Pas toujours, et il le dit plutôt que de choisir à votre place. Un fichier importé donne un titre et une année, donc un film ; or un film populaire a souvent dix éditions, et personne ne se souvient duquel des pressages il a.",
          "Quand une seule édition existe, ou une seule dans le format que vous déclarez, elle est écrite telle quelle. Sinon la ligne est importée sans affirmer le pressage : le film et le format sont justes, et vous pourrez préciser plus tard.",
          "Quand deux films portent le même titre à un an près, rien n’est importé tant que vous n’avez pas tranché. Un rattachement faux se lit comme une vérité, une absence se corrige.",
        ],
      },
      {
        ancre: "barcode-scan",
        question: "Puis-je scanner le code-barres d’un boîtier ?",
        reponse: [
          "Oui, depuis un téléphone, sur jaquette.app/scan. Visez le code au dos du boîtier : la fiche du disque s’ouvre et vous l’ajoutez à votre collection ou à vos envies d’un geste.",
          "Le code désigne le disque exact, pas seulement le film : c’est le seul moyen de marquer le bon pressage sans avoir à le reconnaître dans une liste.",
          "Environ un disque sur deux du catalogue porte son code-barres. Quand le vôtre n’y est pas, l’écran propose de le signaler, et il entre à la passe suivante.",
        ],
      },
      {
        ancre: "collection-value",
        question: "Combien vaut ma collection ?",
        reponse: [
          "Les réglages du compte donnent une estimation, sur demande. Elle additionne, pour chaque édition que vous possédez, le prix d’occasion le moins cher relevé chez nos partenaires.",
          "C’est un plancher, pas une cote. Elle ne compte que les éditions dont un partenaire publie un prix d’occasion, soit une sur quinze du catalogue aujourd’hui, et elle retient le moins cher des exemplaires en vente.",
          "Et ce n’est pas ce qu’on vous en donnerait : un marchand d’occasion achète bien moins cher qu’il ne revend. L’estimation dit ce qu’il coûterait de racheter vos disques, pas ce que vous en tireriez.",
          "Elle n’apparaît jamais sur votre page publique, et rien de chiffré n’y est publié.",
        ],
      },
    ],
  },
  {
    ancre: "account-and-data",
    titre: "Compte et données",
    questions: [
      {
        ancre: "why-google-sign-in",
        question: "Pourquoi la connexion se fait-elle uniquement avec Google ?",
        reponse: [
          "Pour n’avoir ni mot de passe à stocker, ni procédure de réinitialisation à tenir, ni formulaire d’inscription à remplir. C’est le choix le plus sobre pour un projet personnel.",
          "D’autres méthodes pourraient être ajoutées si le besoin se fait sentir.",
        ],
      },
      {
        ancre: "where-my-data-lives",
        question: "Où sont hébergées mes données ?",
        reponse: [
          "Sur Supabase, en Suède, donc dans l’Union européenne. Ce qui existe côté serveur se limite à votre adresse e-mail, votre identifiant Google, et la liste des éditions que vous avez marquées.",
        ],
      },
      {
        ancre: "delete-my-account",
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
          "Pas de régie publicitaire, pas de mesure d’audience, aucun script tiers chargé quand une page s’affiche. Pas de bandeau de consentement non plus, parce qu’il n’y a rien à consentir pour consulter.",
          "Un seul cas de suivi existe, et il dépend entièrement de vous : cliquer sur un prix marchand vous fait passer par la plateforme d’affiliation Awin, qui dépose alors un cookie chez elle pour attribuer la vente. Tant que vous ne cliquez pas, rien ne part.",
        ],
      },
    ],
  },
  {
    ancre: "technical",
    titre: "Questions techniques",
    questions: [
      {
        ancre: "api-and-apps",
        question: "Existe-t-il une API ou une application mobile ?",
        reponse: [
          "Non, ni l’un ni l’autre. Le site est conçu pour être utilisable au téléphone, en rayon, mais ce n’est pas une application installable.",
        ],
      },
      {
        ancre: "reusing-the-data",
        question: "Puis-je réutiliser les données du catalogue ?",
        reponse: [
          "La consultation, l’usage privé et la citation avec lien sont libres. L’extraction massive de la base ne l’est pas : sa constitution représente un investissement protégé par le droit des bases de données.",
          "Pour un usage particulier, écrire à contact@jaquette.app.",
        ],
      },
      {
        ancre: "reporting-a-problem",
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
