-- Collections utilisateurs : équivalent serveur de localStorage `jaquette_statuts`.
--
-- À exécuter dans l'éditeur SQL Supabase (aucune CLI n'est configurée sur ce
-- dépôt). Le script est idempotent : il peut être rejoué sans effet de bord.
--
-- La table existante `statuts` n'a pas de colonne `user_id` : elle datait du
-- prototype mono-utilisateur et n'est lue par aucune page. On ne la réutilise
-- pas, on en crée une nouvelle.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.collections (
  -- Le compte disparaît, ses listes avec : pas de ligne orpheline à purger
  -- pour honorer une demande d'effacement.
  user_id    uuid   not null references auth.users (id) on delete cascade,
  -- `editions.id` est un bigint (identity ajoutée en juillet 2026).
  edition_id bigint not null references public.editions (id) on delete cascade,
  statut     text   not null check (statut in ('envie', 'possede')),
  cree_le    timestamptz not null default now(),

  -- Clé primaire composite plutôt qu'un `id` identity : une édition ne peut
  -- porter qu'un statut par utilisateur, et `on conflict (user_id, edition_id)`
  -- s'appuie dessus sans dépendre d'un index partiel (cf. le piège documenté
  -- dans CLAUDE.md : `ON CONFLICT` ignore les index partiels).
  primary key (user_id, edition_id)
);

-- La clé primaire indexe déjà `user_id` en tête. L'index inverse sert aux
-- décomptes par édition (« 34 personnes possèdent cette édition »).
create index if not exists collections_edition_id_idx
  on public.collections (edition_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.collections enable row level security;

-- Aucune policy `anon` : la clé publique du front ne peut ni lire ni écrire
-- cette table. Seul un jeton de session émis par Supabase Auth y accède.
revoke all on table public.collections from anon;
grant select, insert, update, delete on table public.collections to authenticated;

drop policy if exists collections_select_own on public.collections;
create policy collections_select_own on public.collections
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists collections_insert_own on public.collections;
create policy collections_insert_own on public.collections
  for insert to authenticated
  with check (user_id = auth.uid());

-- `using` filtre les lignes modifiables, `with check` empêche de réattribuer
-- une ligne à un autre compte en la mettant à jour. Les deux sont nécessaires.
drop policy if exists collections_update_own on public.collections;
create policy collections_update_own on public.collections
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists collections_delete_own on public.collections;
create policy collections_delete_own on public.collections
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Suppression de compte (RGPD art. 17)
-- ---------------------------------------------------------------------------

-- Supprimer sa propre ligne dans `auth.users` demande normalement la clé
-- service_role, qui ne peut pas vivre dans un navigateur. Cette fonction
-- s'exécute avec les droits de son propriétaire et ne touche qu'à la ligne de
-- l'appelant ; les collections suivent par cascade.
create or replace function public.supprimer_mon_compte()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'aucune session';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
