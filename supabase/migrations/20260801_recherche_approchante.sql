-- Recherche tolérante aux fautes de frappe.
--
-- « Intrestellar » ne rendait rien : la recherche est un `ilike` sur le titre et
-- sur le slug, et un `ilike` ne rattrape aucune lettre intervertie. Or c'est la
-- faute la plus banale, et une page de résultats vide se lit comme un catalogue
-- qui n'a pas le film.
--
-- pg_trgm mesure la proximité de deux chaînes par leurs trigrammes. Le repli
-- s'appuie sur `word_similarity` et non sur `similarity` : la seconde compare
-- les deux chaînes entières, donc s'effondre dès que le titre est plus long que
-- la saisie. Mesuré sur le catalogue :
--
--   saisie                 titre                                    word   globale
--   « seigneur des aneaux » Le Seigneur des Anneaux : La Communauté  0,864   0,463
--   « amelie »              Le Fabuleux Destin d'Amélie Poulain      1,000   0,206
--
-- `word_similarity` cherche le meilleur passage du titre qui corresponde à la
-- saisie, c'est exactement ce qu'on veut d'une recherche : on tape un morceau de
-- titre, pas le titre entier.
--
-- Seuil retenu : 0,5. « Intrestellar » vaut 0,529 contre *Interstellar*, et le
-- bruit mesuré reste sous 0,2 (« inception » contre *Interstellar* : 0,200).
-- Le seuil par défaut de 0,6 laissait précisément le cas qui a motivé le
-- chantier hors du filet.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- `unaccent` n'est pas immutable dans sa forme à un argument : elle dépend de la
-- configuration de recherche plein texte courante, donc ne peut ni indexer ni
-- servir de colonne générée. La forme à deux arguments, elle, nomme son
-- dictionnaire et devient déterministe.
create or replace function public.sans_accents(texte text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texte)) $$;

create index if not exists films_titre_trgm
  on public.films using gin (public.sans_accents(titre) extensions.gin_trgm_ops);

create index if not exists films_titre_original_trgm
  on public.films using gin (public.sans_accents(titre_original) extensions.gin_trgm_ops);

-- Charge la bibliothèque pg_trgm dans la session. Sans elle,
-- `pg_trgm.word_similarity_threshold` n'est qu'un paramètre à préfixe inconnu,
-- et le poser dans un `create function` réclame les droits superutilisateur :
--   ERROR: 42501: permission denied to set parameter
select extensions.show_trgm('amorce');

/*
  Le seuil est posé sur la fonction et non par un `set` d'appelant : PostgREST
  n'exécute pas de SQL arbitraire, l'appelant n'a donc aucun moyen de le régler.

  Il est indispensable de passer par l'opérateur `<%` et non par une comparaison
  `word_similarity(...) >= 0.5` : seul l'opérateur emprunte l'index GIN. Mesuré
  sur les 4 939 films, la comparaison explicite balaie la table en 145 ms,
  l'opérateur rend la même ligne en 20 ms.

  `operator(extensions.<%)` en toutes lettres parce que `search_path` est vide :
  la résolution d'opérateur suit le chemin de recherche comme celle des
  fonctions, et un chemin vide ne trouverait pas l'opérateur de l'extension.

  `security invoker` (le défaut, écrit ici pour qu'il se voie) : la RLS de
  `films` continue de s'appliquer, la fonction n'ouvre aucune porte dérobée.
*/
create or replace function public.recherche_films_approchante(terme text, limite int default 50)
returns setof public.films
language sql
stable
security invoker
set search_path = ''
set pg_trgm.word_similarity_threshold = '0.5'
as $$
  select f.*
  from public.films f
  where public.sans_accents(terme) operator(extensions.<%) public.sans_accents(f.titre)
     or public.sans_accents(terme) operator(extensions.<%) public.sans_accents(f.titre_original)
  order by greatest(
             extensions.word_similarity(public.sans_accents(terme), public.sans_accents(f.titre)),
             coalesce(extensions.word_similarity(public.sans_accents(terme), public.sans_accents(f.titre_original)), 0)
           ) desc,
           -- La proximité départage mal les sagas : les six *Star Wars* se
           -- valent au millième près. La popularité tranche derrière elle, et
           -- `id` referme l'ordre, sans quoi la pagination répéterait des lignes.
           f.popularite desc nulls last,
           f.id
  limit least(greatest(limite, 1), 100);
$$;

comment on function public.recherche_films_approchante(text, int) is
  'Recherche tolérante aux fautes de frappe (pg_trgm, word_similarity >= 0.5). Repli de la recherche exacte, jamais son remplacement.';

revoke all on function public.recherche_films_approchante(text, int) from public;
grant execute on function public.recherche_films_approchante(text, int) to anon, authenticated;
