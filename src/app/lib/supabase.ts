import { PostgrestClient } from "@supabase/postgrest-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * Client de lecture des tables du catalogue (films, editions, edition_films).
 *
 * On parle directement à PostgREST plutôt que de passer par `createClient` de
 * @supabase/supabase-js : celui-ci instancie aussi les clients auth, realtime
 * et storage, qu'aucune page n'utilise et que le build ne peut pas éliminer.
 * Ces trois-là pesaient 180 Ko bruts, soit près d'un tiers du bundle initial.
 *
 * Le site n'a ni compte, ni upload, ni abonnement temps réel : les statuts de
 * collection vivent dans localStorage (cf. lib/local-statuts.ts). Si l'un de
 * ces besoins apparaît, il faudra revenir à supabase-js — l'API de requête
 * `.from(...).select(...)` est identique, c'est la seule ligne à changer.
 */
export const supabase = new PostgrestClient(
  `https://${projectId}.supabase.co/rest/v1`,
  {
    headers: {
      apikey: publicAnonKey,
      // PostgREST attend le jeton en Authorization ; supabase-js posait les
      // deux en-têtes, la clé anon servant aussi de jeton porteur.
      Authorization: `Bearer ${publicAnonKey}`,
    },
  },
);
