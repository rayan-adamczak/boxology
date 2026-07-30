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
 * Le site n'a ni upload ni abonnement temps réel. L'authentification, elle, est
 * arrivée : elle passe par @supabase/auth-js seul (cf. lib/auth.ts), qui ne
 * tire ni realtime ni storage derrière lui.
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

const BASE = `https://${projectId}.supabase.co/rest/v1`;

let cacheJeton: string | null = null;
let cacheClient: PostgrestClient | null = null;

/**
 * Client portant le jeton de session, pour les tables soumises à RLS
 * (`collections`). Le client anon ci-dessus ne peut pas les lire : c'est voulu.
 *
 * `PostgrestClient` fixe ses en-têtes à la construction et n'expose pas de
 * `setAuth`. On le reconstruit donc à chaque nouveau jeton — l'objet ne fait
 * qu'assembler une URL et des en-têtes, c'est gratuit — et on le garde en cache
 * entre deux rafraîchissements pour ne pas le refaire à chaque requête.
 */
export function clientAuthentifie(accessToken: string): PostgrestClient {
  if (cacheClient !== null && cacheJeton === accessToken) return cacheClient;
  cacheJeton = accessToken;
  cacheClient = new PostgrestClient(BASE, {
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return cacheClient;
}
