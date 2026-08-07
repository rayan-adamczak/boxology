/**
 * Les promotions d'un marchand affilié, bornées dans le temps.
 *
 * Une promo n'est pas une offre : `public.offres` porte un prix par édition,
 * relevé chaque jour, et vaut jusqu'au relevé suivant. Ce qui suit est un code
 * de réduction qui s'applique au panier, sur un seul jour, et qui ne concerne
 * aucune édition en particulier.
 *
 * ## Elle doit s'éteindre seule
 *
 * C'est la contrainte qui décide de tout le module. Un code périmé affiché
 * comme actif est une pratique commerciale trompeuse au sens du §10, au même
 * titre qu'un prix périmé, et personne ne sera là pour déployer un correctif le
 * lendemain à minuit.
 *
 * **La fenêtre est donc évaluée en heure de Paris, jamais sur l'horloge du
 * visiteur.** `new Date()` rend un instant absolu, mais le comparer à une date
 * écrite sans fuseau la ferait interpréter dans le fuseau du navigateur : un
 * visiteur à Tokyo verrait la promo commencer huit heures trop tôt, un visiteur
 * à Los Angeles la verrait courir jusqu'au 10 août. Les bornes portent donc leur
 * décalage en toutes lettres, `+02:00`, l'heure d'été française, ce qui en fait
 * deux instants absolus que n'importe quelle horloge juste situe pareil.
 *
 * Une horloge locale fausse reste hors de portée, et c'est assumé : le remède
 * serait de lire l'heure du serveur, donc un aller-retour sur le chemin de
 * rendu pour une bannière.
 *
 * ## Ce qu'on écrit, et ce qu'on n'écrit pas
 *
 * `conditions` reprend **mot pour mot** ce que le marchand annonce, et rien de
 * plus. Le §10 pose que le site n'est ni marchand ni intermédiaire de vente :
 * on relaie une offre, on ne la formule pas. Résumer « dès 20 € » en « offre
 * exceptionnelle » ferait annoncer au nom de momox une chose qu'il n'a pas
 * dite.
 *
 * **Le courriel de momox se contredisait sur les dates**, et c'est le genre de
 * chose qui se consigne plutôt que se corrige en silence : son visuel annonçait
 * « Jusqu'au 09/08 », un paragraphe « uniquement le 09/08/2025 », ses conditions
 * « uniquement le 09/08/2026 ». La seule ligne non ambiguë est celle des bornes,
 * `Beginnt: 09.08.26 00:00. Endet: 09.08.26 23:59 (Europa/Paris)`, et c'est elle
 * qui fait foi ici. « Jusqu'au » aurait laissé croire à une plage de plusieurs
 * jours.
 */

export interface Promotion {
  /** Le marchand tel qu'il est écrit dans `offres.marchand`, pour rapprocher. */
  marchand: string;
  /** Le code à recopier dans le panier. */
  code: string;
  /** Ce que la réduction vaut, en une ligne, telle qu'on l'affiche. */
  resume: string;
  /**
   * Le même, resserré, pour la première ligne du bandeau.
   *
   * L'étiquette dit déjà le taux et ce sur quoi il porte : la phrase n'a pas à
   * le redire au long. Avec `resume` entier, la ligne passait à deux dès 820 px
   * de fenêtre, donc le bandeau à trois lignes.
   *
   * **Le pourcentage reste dans le texte**, il ne se délègue pas à l'étiquette :
   * celle-ci est `aria-hidden`, un lecteur d'écran n'entendrait rien du taux.
   */
  resumeCourt: string;
  /** Les conditions du marchand, reprises telles quelles. */
  conditions: string;
  /**
   * Les seules conditions qui décident d'un achat, pour le bandeau du bas.
   *
   * Le bandeau tient sur deux lignes, les conditions entières en prenaient
   * trois. On garde ce qui change la décision, le montant minimum et le fait
   * que la remise ne porte que sur l'occasion ; le reste, une fois par personne
   * et non cumulable, se lit en entier sur la fiche film et chez le marchand.
   *
   * **Ce n'est pas une troncature**, c'est un second texte relu : couper
   * `conditions` à la longueur ferait un jour disparaître le montant minimum,
   * qui est justement ce qu'il ne faut pas taire.
   */
  conditionsCourtes: string;
  /** Lien de tracking Awin de la campagne, **jamais** l'URL marchande nue. */
  url: string;
  /**
   * Le jour de la promotion en toutes lettres, pour l'annoncer avant qu'elle
   * n'ouvre : « dimanche 9 août ».
   *
   * Écrit à la main plutôt que calculé de `debut` : `toLocaleDateString` rendrait
   * la date dans le fuseau du visiteur, donc « samedi 8 août » à Los Angeles pour
   * un instant qui est bien le 9 à Paris. Le jour est une donnée du marchand, pas
   * une conversion.
   */
  libelleJour: string;
  /** Bornes absolues, décalage compris. */
  debut: string;
  fin: string;
}

/**
 * Où en est une promotion.
 *
 *   - `annonce` : elle n'a pas commencé, on la dit **au futur**. C'est ce qui
 *     permet d'afficher le bandeau avant le jour J sans mentir : « le code
 *     marche dimanche » est vrai, « le code marche aujourd'hui » ne l'est pas,
 *     et le §10 traite le second comme un prix périmé affiché comme actuel ;
 *   - `active` : elle court, on la dit au présent ;
 *   - `passee` : plus rien, jamais.
 */
export type EtatPromotion = "annonce" | "active" | "passee";

export function etatPromotion(promo: Promotion, maintenant = new Date()): EtatPromotion {
  const t = maintenant.getTime();
  if (t < Date.parse(promo.debut)) return "annonce";
  if (t <= Date.parse(promo.fin)) return "active";
  return "passee";
}

/**
 * Les promotions connues.
 *
 * Une liste en dur, et non une table : le §3 pose qu'une table se justifie
 * quand la donnée bouge sans qu'on déploie, ce qui est le cas des prix. Une
 * promo arrive par un courriel qu'il faut de toute façon lire, et son texte
 * demande une relecture avant publication. Le jour où elles s'enchaînent, le
 * gabarit est là et la table se posera en une migration.
 *
 * **Les entrées passées ne se suppriment pas.** Elles ne s'affichent plus
 * d'elles-mêmes, et elles disent quel code a couru quel jour, ce qu'aucune
 * autre trace ne garde.
 */
export const PROMOTIONS: Promotion[] = [
  {
    marchand: "momox shop",
    code: "ETE12",
    resume: "12 % de réduction sur les disques d'occasion",
    resumeCourt: "12 % sur l'occasion",
    conditions:
      "Dès 20 € d'achat, une fois par personne, sur les seuls articles d'occasion. " +
      "Non cumulable, aucun remboursement en espèces.",
    conditionsCourtes: "Dès 20 € d'achat.",
    /* Le lien de tracking du courriel de momox, **recopié tel quel et sur une
       seule ligne**. `awinaffid=3006883` est notre identifiant d'éditeur Awin
       (§1) : c'est lui qui fait qu'une vente nous est attribuée, et le §3 pose
       que c'est la seule valeur dont une faute est silencieuse, le lien
       marchant toujours mais ne rapportant plus rien. Ne pas le recomposer, ne
       pas le couper, ne pas y ajouter de paramètre. */
    url: "https://www.awin1.com/cread.php?awinmid=7481&awinaffid=3006883&campaign=&ued=https%3A%2F%2Fwww.momox-shop.fr%2Fete%2F",
    libelleJour: "dimanche 9 août",
    debut: "2026-08-09T00:00:00+02:00",
    fin: "2026-08-09T23:59:59+02:00",
  },
];

/**
 * La promotion en cours pour un marchand, ou `null`.
 *
 * `maintenant` est injectable pour que la fenêtre s'éprouve sans attendre le
 * 9 août : c'est la seule façon de vérifier les trois cas, avant, pendant et
 * après, et une fonction qu'on ne peut pas éprouver est un passif (§7).
 */
export function promotionActive(marchand: string, maintenant = new Date()): Promotion | null {
  return (
    PROMOTIONS.find(
      (p) => p.marchand === marchand && etatPromotion(p, maintenant) !== "passee",
    ) ?? null
  );
}

/**
 * Les promotions à montrer, annoncées ou en cours, avec leur état.
 *
 * Une promotion passée n'y figure jamais : c'est la seule règle que ce module
 * ne négocie pas.
 */
export function promotionsAAfficher(
  maintenant = new Date(),
): { promo: Promotion; etat: Exclude<EtatPromotion, "passee"> }[] {
  return PROMOTIONS.map((promo) => ({ promo, etat: etatPromotion(promo, maintenant) }))
    .filter((x): x is { promo: Promotion; etat: "annonce" | "active" } => x.etat !== "passee");
}

/**
 * Le moment de la promotion, tel qu'on l'écrit dans une phrase.
 *
 * « aujourd'hui » ou « dimanche 9 août ». C'est le seul endroit qui décide du
 * temps employé, pour que le bandeau et l'encart de fiche ne puissent pas
 * diverger : le §7 garde la trace de ce qui arrive quand deux textes disent la
 * même chose à deux endroits.
 */
export function quand(promo: Promotion, etat: EtatPromotion): string {
  return etat === "active" ? "aujourd’hui" : promo.libelleJour;
}
