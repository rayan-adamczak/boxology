import { identiteCourante } from "./auth";
import { clientAuthentifie, supabase } from "./supabase";
import type { EditionWithFilm, Film, StatutValue } from "./reelio-db";

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
 *
 * **Le catalogue ne se lit jamais avec le jeton de session**, et ce n'est pas
 * un détail de style : les policies de `films`, `editions` et `edition_films`
 * sont écrites pour le rôle `anon` seul. Une requête portant un JWT arrive en
 * rôle `authenticated`, aucune policy ne la couvre, et PostgREST rend **200
 * avec zéro ligne** — le piège du §3, un refus qui ne ressemble pas à un refus.
 *
 * Mesuré le 3 août 2026 : `collections` embarquant `editions(...)` rendait
 * `editions: null` sur chaque ligne, d'où un fil sans titre ni visuel et une
 * valeur estimée à zéro. On lit donc les identifiants avec le jeton, puis les
 * éditions avec le client anon.
 */

/** PostgREST plafonne à 1 000 lignes, cf. §9. */
const PAGE = 1000;

export interface ResumeCollection {
  /** Éditions marquées « possédée ». */
  possedees: number;
  /** Éditions marquées « envie ». */
  envies: number;
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
 * Les deux compteurs de la colonne : possédées et envies.
 *
 * Rend `null` sans session : la page appelante affiche alors le catalogue
 * public, elle ne montre pas un tableau de bord vide.
 *
 * **Il portait aussi une valeur, retirée le 6 août 2026, et ce n'était pas le
 * bon nombre.** Elle sommait les `prix_editeur`, c'est-à-dire des prix
 * conseillés **neufs** figés à la sortie du disque. Le §8 posait déjà qu'un
 * total de prix neufs « se lit comme une valeur de collection et n'en est pas
 * une » : ce que vaut un steelbook épuisé n'a rien à voir avec ce qu'il coûtait
 * en rayon. La vraie mesure existe depuis l'acceptation de momox shop, elle
 * somme de l'occasion, et elle vit dans `lib/valeur.ts`.
 *
 * Le retrait fait aussi gagner une lecture : ce résumé interrogeait `editions`
 * par lots de 500 à chaque ouverture de l'accueil, pour un chiffre que
 * personne n'avait demandé.
 */
export async function getResumeCollection(): Promise<ResumeCollection | null> {
  const identite = await identiteCourante();
  if (!identite) return null;

  const client = clientAuthentifie(identite.jeton);
  const resume: ResumeCollection = { possedees: 0, envies: 0 };

  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await client
      .from("collections")
      .select("statut, edition_id")
      .eq("user_id", identite.userId)
      .range(debut, debut + PAGE - 1);
    // Une lecture qui échoue doit se voir, pas rendre du vide (§9).
    if (error) throw new Error(`Résumé de collection indisponible : ${error.message}`);

    const lignes = (data ?? []) as { statut: StatutValue; edition_id: number }[];
    for (const ligne of lignes) {
      if (ligne.statut === "possede") {
        resume.possedees += 1;
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
    .select("edition_id, statut, cree_le")
    .eq("user_id", identite.userId)
    .order("cree_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Activité indisponible : ${error.message}`);

  const lignes = (data ?? []) as { edition_id: number; statut: StatutValue; cree_le: string }[];
  if (lignes.length === 0) return [];

  // Second appel, en anon : le catalogue n'est pas lisible sous le jeton.
  const { data: editions, error: erreurEditions } = await supabase
    .from("editions")
    .select("id, titre, image_url, edition_films(film:films(id, titre, slug, annee, affiche_url))")
    .in("id", lignes.map((l) => l.edition_id));
  if (erreurEditions) throw new Error(`Éditions du fil indisponibles : ${erreurEditions.message}`);

  type BrutEdition = {
    id: number;
    titre: string | null;
    image_url: string | null;
    edition_films?: { film: ActiviteLigne["film"] }[];
  };
  const parId = new Map<number, BrutEdition>(
    ((editions ?? []) as unknown as BrutEdition[]).map((e) => [e.id, e]),
  );

  return lignes.map((ligne) => {
    const edition = parId.get(ligne.edition_id);
    return {
      editionId: ligne.edition_id,
      statut: ligne.statut,
      creeLe: ligne.cree_le,
      titre: edition?.titre ?? null,
      imageUrl: edition?.image_url ?? null,
      // Un coffret porte plusieurs films : le premier suffit à l'illustrer,
      // comme dans `getDernieresEditions`.
      film: edition?.edition_films?.[0]?.film ?? null,
    };
  });
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
