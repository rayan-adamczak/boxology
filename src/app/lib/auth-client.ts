import { GoTrueClient } from "@supabase/auth-js";
import { CLE_STOCKAGE, EN_TETES_ANON, URL_AUTH } from "./auth-config";

/**
 * Client d'authentification. Ce module est le seul à importer
 * @supabase/auth-js, et il n'est chargé qu'à la demande (cf. lib/auth.ts) :
 * Vite en fait donc un morceau séparé, absent du bundle initial.
 *
 * On instancie `GoTrueClient` directement, sans passer par `createClient` de
 * @supabase/supabase-js : celui-ci embarquerait aussi realtime et storage, soit
 * les 180 Ko que le passage à postgrest-js venait de retirer (cf.
 * lib/supabase.ts).
 */
export const auth = new GoTrueClient({
  url: URL_AUTH,
  headers: EN_TETES_ANON,
  storageKey: CLE_STOCKAGE,
  persistSession: true,
  autoRefreshToken: true,
  // Le retour de Google arrive sur une URL portant le code d'autorisation.
  // Sans cette option, la session ne serait jamais établie.
  detectSessionInUrl: true,
  // PKCE plutôt que le flux implicite : le jeton ne transite pas dans le
  // fragment d'URL, donc ni dans l'historique ni dans les journaux du serveur.
  flowType: "pkce",
});
