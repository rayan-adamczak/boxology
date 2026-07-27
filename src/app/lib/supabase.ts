import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * Singleton Supabase client used across the app to talk to Reelio's
 * user-owned tables (films, editions, statuts) via the public anon key.
 */
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);
