import { identiteCourante } from "./auth";
import { clientAuthentifie, supabase } from "./supabase";
import type { EditionWithFilm, Film, StatutValue } from "./reelio-db";
import { prixEnEuros } from "./prix";

/**
 * Données de l'accueil connecté.
 *
 * Trois lectures indépendantes, et volontairement séparées : le résumé de la
 * collection passe par le client porteur du jeton (table `collections`, sous
 * RLS), les sorties à venir par le client anon (catalogue public). Les mêler
 * dans une requête ferait dépendre une donnée publique d'une session.
 *
 * Chacune échoue pour son compte : une panne sur les sorties à venir ne doit
 * pas vider les compteurs de collection, qui sont la raison d'être de la page.
 */

/** PostgREST plafonne à 1 000 lignes, cf. §9. */
const PAGE = 1000;

export interface ResumeCollection {
  /** Éditions marquées « possédée ». */
  possedees: number;
  /** Éditions marquées « envie ». */
  envies: number;
  /** Somme des prix conseillés **en euros**, sur les seules possédées. */
  valeur: number;
  /** Combien de possédées portent un prix en euros : ce qui qualifie `valeur`. */
  valorisees: number;
}

/** Une ligne du journal : ce que l'utilisateur a marqué, et quand. */
export interface ActiviteLigne {
  editionId: number;
  statut: StatutValue;
  creeLe: string;
  titre: string | null;
  imageUrl: string | null;
  film: Pick<Film, "id" | "titre" | "slug" | "annee" | "affiche_url"> | null;
}

/**
 * Compteurs et valeur estimée.
 *
 * Rend `null` sans session : la page appelante affiche alors le catalogue
 * public, elle ne montre pas un tableau de bord vide.
 *
 * La valeur est une **estimation par le prix conseillé**, pas une cote : au
 * 3 août 2026, 10 089 éditions sur 16 923 portent un `prix_editeur`, dont
 * 4 446 en livres chez Zavvi, écartées du total (cf. `lib/prix.ts`).
 * D'où `valorisees`, que l'écran affiche à côté du montant. Un total qui
 * ignorerait la moitié du catalogue sans le dire se lirait comme une valeur
 * réelle, et c'est exactement le grief relevé au §8 contre les concurrents.
 */
export async function getResumeCollection(): Promise<ResumeCollection | null> {
  const identite = await identiteCourante();
  if (!identite) return null;

  const client = clientAuthentifie(identite.jeton);
  const resume: ResumeCollection = { possedees: 0, envies: 0, valeur: 0, valorisees: 0 };

  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await client
      .from("collections")
      .select("statut, editions(prix_editeur, source)")
      .eq("user_id", identite.userId)
      .range(debut, debut + PAGE - 1);
    // Une lecture qui échoue doit se voir, pas rendre du vide (§9).
    if (error) throw new Error(`Résumé de collection indisponible : ${error.message}`);

    const lignes = (data ?? []) as {
      statut: StatutValue;
      editions?: { prix_editeur?: string | null; source?: string | null } | null;
    }[];
    for (const ligne of lignes) {
      if (ligne.statut === "possede") {
        resume.possedees += 1;
        // Les prix Zavvi sont en livres : `prixEnEuros` les écarte plutôt que
        // de les additionner à des euros, ce qui ne voudrait rien dire.
        const prix = prixEnEuros(ligne.editions?.prix_editeur, ligne.editions?.source);
        if (prix !== null) {
          resume.valeur += prix;
          resume.valorisees += 1;
        }
      } else if (ligne.statut === "envie") {
        resume.envies += 1;
      }
    }
    if (lignes.length < PAGE) break;
  }

  return resume;
}

/**
 * Les derniers gestes de l'utilisateur, du plus récent au plus ancien.
 *
 * C'est le journal d'activité de la maquette, réduit à ce que la base sait
 * dire aujourd'hui : `collections.cree_le`. Les actions des autres comptes
 * attendent le volet social, qui n'existe pas encore.
 */
export async function getActiviteRecente(limite = 12): Promise<ActiviteLigne[]> {
  const identite = await identiteCourante();
  if (!identite) return [];

  const { data, error } = await clientAuthentifie(identite.jeton)
    .from("collections")
    .select(
      "edition_id, statut, cree_le, editions(id, titre, image_url, edition_films(film:films(id, titre, slug, annee, affiche_url)))",
    )
    .eq("user_id", identite.userId)
    .order("cree_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Activité indisponible : ${error.message}`);

  type Brut = {
    edition_id: number;
    statut: StatutValue;
    cree_le: string;
    editions?: {
      titre?: string | null;
      image_url?: string | null;
      edition_films?: { film: ActiviteLigne["film"] }[];
    } | null;
  };

  return ((data ?? []) as Brut[]).map((ligne) => ({
    editionId: ligne.edition_id,
    statut: ligne.statut,
    creeLe: ligne.cree_le,
    titre: ligne.editions?.titre ?? null,
    imageUrl: ligne.editions?.image_url ?? null,
    // Un coffret porte plusieurs films : le premier suffit à l'illustrer, comme
    // dans `getDernieresEditions`.
    film: ligne.editions?.edition_films?.[0]?.film ?? null,
  }));
}

/**
 * Les éditions dont la date de parution est encore devant nous.
 *
 * Mesuré le 3 août 2026 avant d'en faire un panneau : 42 lignes à venir, dont
 * 41 illustrées, la première au lendemain et la dernière début octobre. C'est
 * peu, et c'est structurel : `date_parution` ne vient que de blu-ray.com (§3),
 * les autres sources ne datent rien. Le panneau se cache donc de lui-même
 * quand la liste est vide, plutôt que d'afficher un cadre creux.
 */
export async function getSortiesAVenir(limite = 6): Promise<EditionWithFilm[]> {
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("editions")
    .select("*, edition_films!inner(film:films!inner(id, titre, affiche_url, slug))")
    .gt("date_parution", aujourdhui)
    .order("date_parution", { ascending: true })
    .limit(limite);
  if (error) throw new Error(`Sorties à venir indisponibles : ${error.message}`);

  return (data ?? []).map((ligne) => {
    const { edition_films: liens, ...edition } = ligne as Record<string, unknown> & {
      edition_films?: { film: Pick<Film, "id" | "titre" | "affiche_url"> }[];
    };
    return { ...edition, film: liens?.[0]?.film ?? null } as EditionWithFilm;
  });
}
