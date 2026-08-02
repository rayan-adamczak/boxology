-- Retire à `anon` et `authenticated` les privilèges d'écriture sur le
-- catalogue, et ferme complètement les tables qui n'ont jamais été publiques.
--
-- Pourquoi, alors que la RLS bloquait déjà. Vérifié le 2 août 2026, un `INSERT`
-- réel envoyé avec la clé anon rend bien :
--
--     42501  new row violates row-level security policy for table "films"
--
-- Mais c'était une barrière unique. Supabase donne par défaut
-- `insert, update, delete, truncate` à `anon` sur toute table du schéma
-- `public` ; seule l'absence de policy d'écriture retenait la clé publique du
-- bundle. Un `alter table … disable row level security` posé le temps d'une
-- migration, et le catalogue entier devient inscriptible par n'importe qui,
-- sans qu'aucun message ne le signale.
--
-- `collections` faisait déjà le bon geste (`revoke all … from anon`) : la
-- barrière tombe avant la RLS, et un refus s'y lit en 401 plutôt qu'en tableau
-- vide. On aligne le reste dessus.
--
-- Idempotent, rejouable sans effet de bord.

-- ---------------------------------------------------------------------------
-- Catalogue public : lecture seule, pour de bon
-- ---------------------------------------------------------------------------

-- `select` est conservé, c'est ce que le site consulte. Le reste part, y
-- compris `references` et `trigger`, qui permettraient d'accrocher du code ou
-- une contrainte à une table qu'on ne possède pas.
revoke insert, update, delete, truncate, references, trigger
  on table public.films, public.editions, public.edition_films
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables de travail et de sauvegarde : jamais publiques
-- ---------------------------------------------------------------------------

-- Elles rendaient `[]` en anon, ce qui ne se distingue pas d'un catalogue vide.
-- Après ce `revoke`, elles rendent 401 : un vrai refus, qui se voit.
revoke all on table
  public.bluray_import,
  public.kv_store_38e4ee68,
  public.editions_supprimees_20260728,
  public.editions_film_id_backup_20260728
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Les tables à venir
-- ---------------------------------------------------------------------------

-- Sans cette ligne, la prochaine table créée dans `public` repart avec les
-- privilèges d'écriture par défaut, et ce fichier n'aura protégé que l'état du
-- jour. `for role postgres` parce que c'est le rôle sous lequel les migrations
-- s'appliquent ; une table créée par un autre rôle échapperait à la règle, à
-- vérifier dans `pg_default_acl` si un jour une table neuve ressort avec des
-- droits d'écriture.
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate on tables from anon;
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate on tables from authenticated;
