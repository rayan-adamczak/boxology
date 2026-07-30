import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * Constantes partagées entre le module d'authentification (lib/auth.ts) et le
 * client qu'il charge à la demande (lib/auth-client.ts).
 *
 * Ce fichier existe pour qu'on puisse lire la clé de stockage sans tirer
 * @supabase/auth-js dans le bundle initial : c'est ce test qui décide s'il faut
 * charger la bibliothèque ou non.
 */

/**
 * Même clé que celle qu'emploierait supabase-js. Si l'on y revenait un jour,
 * les sessions déjà ouvertes seraient reprises au lieu d'être perdues.
 */
export const CLE_STOCKAGE = `sb-${projectId}-auth-token`;

export const URL_AUTH = `https://${projectId}.supabase.co/auth/v1`;

export const EN_TETES_ANON = {
  apikey: publicAnonKey,
  Authorization: `Bearer ${publicAnonKey}`,
};
