-- Fixe le `search_path` des trois fonctions de slug.
--
-- Signalé par le linter Supabase (`function_search_path_mutable`). Le risque est
-- faible ici, aucune des trois n'est `security definer` : elles s'exécutent avec
-- les droits de l'appelant, donc un `search_path` détourné ne donne rien de plus
-- que ce que l'appelant a déjà. Mais `films_poser_slug` est un déclencheur posé
-- sur `films`, donc il tourne aussi sous les rôles d'import, et la correction
-- tient en une clause.
--
-- Les corps ne changent pas : les appels internes sont déjà qualifiés
-- (`public.slug_titre`, `public.slug_film`), et `regexp_replace`, `translate`,
-- `lower`, `btrim`, `nullif` viennent de `pg_catalog`, toujours dans le chemin
-- implicite. Seule la clause `set search_path = ''` est ajoutée.

alter function public.slug_titre(text) set search_path = '';
alter function public.slug_film(text, text) set search_path = '';
alter function public.films_poser_slug() set search_path = '';
