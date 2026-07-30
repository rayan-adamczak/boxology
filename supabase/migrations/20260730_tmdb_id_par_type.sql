-- `films.tmdb_id` était unique à lui seul, alors que TMDB numérote séparément
-- ses films et ses séries : le film 1639 est « Speed 2 », la série 1639 est
-- « Heroes ». Les deux ne pouvaient pas coexister, et une recherche par
-- tmdb_id seul renvoyait l'œuvre du mauvais catalogue — c'est ainsi qu'une
-- édition de Heroes s'est retrouvée rattachée à Speed 2.
--
-- L'unicité porte désormais sur le couple (tmdb_id, type).
--
-- À exécuter dans l'éditeur SQL du tableau de bord : ni psql ni CLI Supabase
-- ne sont configurés. Idempotent, rejouable sans effet de bord.

-- Le nom de la contrainte d'origine n'est pas connu d'avance : on la retrouve
-- par sa définition plutôt que de deviner « films_tmdb_id_key ».
do $$
declare nom text;
begin
  select con.conname into nom
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
   where con.conrelid = 'public.films'::regclass
     and con.contype = 'u'
     and array_length(con.conkey, 1) = 1
     and att.attname = 'tmdb_id';

  if nom is not null then
    execute format('alter table public.films drop constraint %I', nom);
  end if;
end $$;

-- `type` peut être nul sur d'anciennes lignes : deux nuls ne s'égalent pas en
-- SQL, donc l'index ne les contraint pas. Acceptable, ces lignes sont rares et
-- la protection vise les écritures futures, qui renseignent toujours le type.
create unique index if not exists films_tmdb_id_type_key
  on public.films (tmdb_id, type);
