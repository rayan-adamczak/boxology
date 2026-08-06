import { supabase } from "./supabase";
import { idsParStatut } from "./collections";

/**
 * Estimation de la valeur d'une collection, à partir des prix d'occasion.
 *
 * **Deuxième fonction la plus demandée** par les gens qui cataloguent leur
 * collection, d'après le relevé du 2 août 2026 (§8), et impossible à écrire
 * honnêtement jusqu'au 6 août : les huit sources du catalogue vendaient du
 * neuf. Un prix neuf en rayon dit ce que coûte un disque aujourd'hui, pas ce
 * que vaut un steelbook épuisé, et le §8 écrivait en toutes lettres
 * qu'additionner les 724 prix E.Leclerc « donnerait un total qui se lit comme
 * une valeur de collection et n'en est pas une ».
 *
 * momox shop, accepté sur Awin le 6 août 2026, est la première source de
 * seconde main du catalogue. C'est ce qui rend ce calcul défendable, et c'est
 * aussi ce qui le borne : ce module ne somme **que** de l'occasion.
 *
 * ## Ce que le nombre veut dire, exactement
 *
 * « Ce qu'il coûterait de racheter ces disques d'occasion aujourd'hui, au moins
 * cher des exemplaires en vente. » Rien de plus.
 *
 *   - **ce n'est pas ce qu'on en tirerait.** Un revendeur achète bien moins
 *     cher qu'il ne vend, c'est son métier ; momox publie ses prix de vente,
 *     pas ses prix de rachat ;
 *   - **ce n'est pas une cote.** Un prix de vente d'un jour n'est pas une
 *     valeur de marché établie sur des transactions ;
 *   - **c'est un plancher.** Au moins cher, sur les seules éditions couvertes,
 *     donc le total réel est au-dessus. C'est le sens de l'erreur qu'on
 *     préfère : une estimation qui gonfle une collection est une promesse, une
 *     estimation basse est une mesure.
 *
 * D'où `estimees` **à côté** de `total`, et jamais l'un sans l'autre à l'écran :
 * 1 618 éditions portent un prix d'occasion sur 23 803, donc un total présenté
 * seul laisserait croire à une couverture qu'on n'a pas.
 */

/** PostgREST plafonne à 1 000 lignes, et une URL a une longueur maximale. */
const LOT = 200;

export interface ValeurCollection {
  /** Éditions marquées « possédé ». */
  possedees: number;
  /** Celles dont on connaît un prix d'occasion. Le reste n'est pas compté. */
  estimees: number;
  /** Somme, en euros, du prix d'occasion le moins cher de chaque édition. */
  total: number;
  /** Prix médian d'une édition estimée. Nul quand aucune ne l'est. */
  medianeUnitaire: number | null;
  /**
   * Le relevé le plus ancien parmi ceux retenus, en ISO.
   *
   * **Le plus ancien et non le plus récent** : c'est lui qui dit ce que vaut
   * l'estimation. Afficher la date la plus fraîche d'un lot à moitié périmé
   * serait exactement le prix daté trompeur que le §10 interdit.
   */
  releveLePlusAncien: string | null;
  /** Les marchands d'où viennent les prix retenus, pour pouvoir les nommer. */
  marchands: string[];
}

interface LigneOffre {
  edition_id: number;
  prix: number | null;
  devise: string;
  marchand: string;
  releve_le: string;
}

/**
 * L'estimation pour la collection du compte courant.
 *
 * Rend une valeur à zéro sans session : `idsParStatut` rend alors une liste
 * vide, et un écran qui affiche « 0 sur 0 » est plus honnête qu'un écran qui
 * tombe en panne.
 */
export async function valeurCollection(): Promise<ValeurCollection> {
  const ids = await idsParStatut("possede");
  const vide: ValeurCollection = {
    possedees: ids.length,
    estimees: 0,
    total: 0,
    medianeUnitaire: null,
    releveLePlusAncien: null,
    marchands: [],
  };
  if (ids.length === 0) return vide;

  /* `offres` est en lecture publique (`20260803_offres.sql`), donc le client
     anonyme suffit : c'est la liste des éditions possédées qui est privée, et
     elle est déjà passée par le jeton du compte dans `idsParStatut`. Demander
     ces prix sous le jeton n'ajouterait aucune barrière et masquerait d'où
     vient la cloison. */
  const lignes: LigneOffre[] = [];
  for (let debut = 0; debut < ids.length; debut += LOT) {
    const lot = ids.slice(debut, debut + LOT);
    /* Le filtre est **positif** : `etat` renseigné et différent de `neuf`. Un
       `neq` seul laisserait passer les états nuls, et un état nul veut dire
       « le marchand ne le dit pas », jamais « occasion ». Compter un état
       inconnu comme de la seconde main gonflerait le total avec des prix de
       neuf, sans que rien ne le signale. */
    const { data, error } = await supabase
      .from("offres")
      .select("edition_id,prix,devise,marchand,releve_le")
      .in("edition_id", lot)
      .not("etat", "is", null)
      .neq("etat", "neuf")
      .gt("prix", 0);
    if (error) throw new Error(`Estimation impossible : ${error.message}`);
    lignes.push(...((data ?? []) as LigneOffre[]));
  }

  /* Une édition peut porter plusieurs offres d'occasion le jour où un second
     marchand de seconde main est accepté. On garde la moins chère, ce qui fait
     du total un plancher assumé plutôt qu'un chiffre flatteur. */
  const parEdition = new Map<number, LigneOffre>();
  for (const l of lignes) {
    /* Seuls les euros. `lib/prix.ts` pose déjà qu'additionner des livres à des
       euros donne un nombre qui ne veut rien dire, et aucune conversion n'est
       possible sans taux daté, qu'on n'a pas et qu'on n'ira pas chercher pour
       une estimation. Les deux flux sont en euros aujourd'hui : ce filtre ne
       retire rien, il empêche qu'un troisième programme fausse le total. */
    if ((l.devise || "EUR") !== "EUR") continue;
    const prix = Number(l.prix);
    if (!Number.isFinite(prix) || prix <= 0) continue;
    const garde = parEdition.get(l.edition_id);
    if (!garde || prix < Number(garde.prix)) parEdition.set(l.edition_id, l);
  }

  const retenues = [...parEdition.values()];
  if (retenues.length === 0) return vide;

  const prix = retenues.map((l) => Number(l.prix)).sort((a, b) => a - b);
  const total = prix.reduce((a, b) => a + b, 0);

  return {
    possedees: ids.length,
    estimees: retenues.length,
    /* Arrondi au centime : la somme de flottants à deux décimales dérive
       (`3.49 + 15.77` rend des millièmes), et un total au millième d'euro se
       lit comme une précision qu'une estimation n'a pas. */
    total: Math.round(total * 100) / 100,
    medianeUnitaire: prix[Math.floor(prix.length / 2)],
    releveLePlusAncien: retenues
      .map((l) => l.releve_le)
      .sort()
      .at(0) ?? null,
    marchands: [...new Set(retenues.map((l) => l.marchand))].sort(),
  };
}

/** `1 234,56 €`. Les euros sont la seule monnaie que le total puisse porter. */
export function formaterEuros(montant: number): string {
  return montant.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  });
}
