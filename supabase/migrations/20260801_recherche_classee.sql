-- Recherche classée par pertinence, et non plus par ordre alphabétique.
--
-- « Star » ouvrait sur *A Star for Two* et *Star Crystal* : la recherche exacte
-- triait par titre, et le plafond de 50 lignes tombait bien avant *Star Wars*.
-- Trier par popularité seule ne vaut pas mieux, elle ferait remonter un film
-- très consulté qui ne porte le mot qu'au milieu de son titre.
--
-- Le classement est donc à deux étages : d'abord la nature de la correspondance
-- (titre entier, début de titre, début d'un mot du titre, n'importe où), la
-- popularité ne départageant que les ex æquo. « Star » rend *Star Wars* avant
-- *A Star Is Born*, et *A Star Is Born* avant *Star Crystal*.
--
-- Le réalisateur entre dans la recherche par la même occasion, au dernier rang :
-- taper « Nolan » doit rendre ses films, mais un film qui porte « nolan » dans
-- son titre passerait devant, ce qui est l'ordre attendu.

/*
  Normalisation unique de tout ce qui se cherche.

  `mots_recherche` remplace `sans_accents` de la migration précédente, qui ne
  repliait que les accents : la ponctuation interne restait, donc « mission
  impossible » n'atteignait pas *Mission : Impossible* et il fallait interroger
  le slug en plus du titre. Ici toute suite de caractères non alphanumériques
  devient une espace, ce qui aligne d'un coup les deux-points, les tirets
  cadratins, les apostrophes typographiques et les points de *S.O.S. Fantômes*.

  Effet de bord voulu : `%` et `_` disparaissent de la saisie, donc aucune
  chaîne utilisateur ne peut piloter un `like`.
*/
create or replace function public.mots_recherche(texte text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
           lower(extensions.unaccent('extensions.unaccent'::regdictionary, texte)),
           '[^a-z0-9]+', ' ', 'g'))
$$;

-- `gin_trgm_ops` couvre `like '%…%'` autant que les opérateurs de proximité :
-- ces trois index servent donc la recherche exacte et son repli approchant.
create index if not exists films_mots_titre_trgm
  on public.films using gin (public.mots_recherche(titre) extensions.gin_trgm_ops);

create index if not exists films_mots_titre_original_trgm
  on public.films using gin (public.mots_recherche(titre_original) extensions.gin_trgm_ops);

create index if not exists films_mots_realisateur_trgm
  on public.films using gin (public.mots_recherche(realisateur) extensions.gin_trgm_ops);

/*
  Recherche exacte, classée.

  Elle vit en base et non côté client parce que le plafond de lignes s'applique
  **avant** le classement : trier 50 lignes déjà tirées alphabétiquement ne
  ferait pas revenir *Star Wars*, qui n'y était pas.

  Le rang 2 place un titre original exact avant un mot trouvé au milieu d'un
  titre français : « Jaws » doit rendre *Les Dents de la mer* avant *Jaws of
  Satan*.
*/
create or replace function public.recherche_films(terme text, limite int default 50)
returns setof public.films
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.mots_recherche(terme) as t)
  select f.*
  from public.films f, q
  where q.t <> ''
    and (public.mots_recherche(f.titre) like '%' || q.t || '%'
      or public.mots_recherche(f.titre_original) like '%' || q.t || '%'
      or public.mots_recherche(f.realisateur) like '%' || q.t || '%')
  order by
    case
      when public.mots_recherche(f.titre) = q.t then 0
      when public.mots_recherche(f.titre) like q.t || '%' then 1
      when public.mots_recherche(f.titre_original) = q.t then 2
      when ' ' || public.mots_recherche(f.titre) like '% ' || q.t || '%' then 3
      when public.mots_recherche(f.titre) like '%' || q.t || '%' then 4
      when public.mots_recherche(f.titre_original) like '%' || q.t || '%' then 5
      else 6
    end,
    f.popularite desc nulls last,
    f.id
  limit least(greatest(limite, 1), 100);
$$;

comment on function public.recherche_films(text, int) is
  'Recherche exacte sur titre, titre original et réalisateur, classée par nature de correspondance puis par popularité.';

revoke all on function public.recherche_films(text, int) from public;
grant execute on function public.recherche_films(text, int) to anon, authenticated;

-- Charge pg_trgm dans la session, sans quoi le `set` ci-dessous réclame le
-- superutilisateur (cf. 20260801_recherche_approchante.sql).
select extensions.show_trgm('amorce');

/*
  Le repli approchant passe à `mots_recherche` lui aussi. Deux normalisations
  pour un même catalogue finiraient par diverger sans que ça se voie ; c'est
  pour ça que `sans_accents` disparaît plus bas au lieu de cohabiter.

  **Le réalisateur n'entre pas dans ce repli**, alors qu'il entre dans la
  recherche exacte. Mesuré, aucun seuil ne sépare la faute de frappe du nom
  d'un tiers :

    tarentino  ->  Quentin Tarantino   0,571   vraie faute
    carlotta   ->  Carlos Saldanha     0,556   deux personnes différentes

  Quinze millièmes d'écart, et le mauvais côté du classement : « carlotta »,
  qui désigne un éditeur, ouvrait sur *Rio* et *L'Âge de glace*. Un nom propre
  est court et partage ses trigrammes avec tous ses homographes, la mesure n'y
  discrimine rien. La bonne réponse à « carlotta » est la page éditeur, que la
  recherche propose par ailleurs.
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
  where public.mots_recherche(terme) operator(extensions.<%) public.mots_recherche(f.titre)
     or public.mots_recherche(terme) operator(extensions.<%) public.mots_recherche(f.titre_original)
  order by greatest(
             extensions.word_similarity(public.mots_recherche(terme), public.mots_recherche(f.titre)),
             coalesce(extensions.word_similarity(public.mots_recherche(terme), public.mots_recherche(f.titre_original)), 0)
           ) desc,
           f.popularite desc nulls last,
           f.id
  limit least(greatest(limite, 1), 100);
$$;

-- `sans_accents` n'a plus d'appelant : ses deux index tombent d'abord, la
-- fonction ensuite.
drop index if exists public.films_titre_trgm;
drop index if exists public.films_titre_original_trgm;
drop function if exists public.sans_accents(text);
