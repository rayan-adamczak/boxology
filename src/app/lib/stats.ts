import { supabase } from "./supabase";

export interface StatsCatalogue {
  films: number;
  editions: number;
}

/**
 * Compte les œuvres et les éditions du catalogue.
 * Lu à l'affichage plutôt que figé dans le texte : les chiffres restent justes
 * après chaque import, sans avoir à repasser sur les pages éditoriales.
 */
export async function getStatsCatalogue(): Promise<StatsCatalogue | null> {
  const [films, editions] = await Promise.all([
    supabase.from("films").select("*", { count: "exact", head: true }),
    supabase.from("editions").select("*", { count: "exact", head: true }),
  ]);
  if (films.error || editions.error) return null;
  return { films: films.count ?? 0, editions: editions.count ?? 0 };
}
