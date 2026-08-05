-- La recherche atteint les titres étrangers.
--
-- *House* de Nobuhiko Obayashi ne répondait pas à « Hausu », son titre
-- d'exploitation hors du Japon, et *野のなななのか* du même auteur ne répondait à
-- rien du tout : `recherche_films` n'interroge que `titre`, `titre_original` et
-- `realisateur`, or `titres_alternatifs` porte la réponse depuis l'import TMDB
-- du 30 juillet 2026, en six langues, sans que rien ne la lise.
--
-- Mesuré avant d'écrire, sur les 12 129 films :
--
--     10 848  portent au moins un titre alternatif exploitable
--      7 414  gagnent un titre qu'aucune colonne cherchée ne contient  (61 %)
--         56  n'avaient aucun titre latin, donc étaient introuvables
--
-- Les 56 sont le cas extrême et le plus net : `titre` et `titre_original` y sont
-- en japonais, en chinois ou en coréen, `mots_recherche` les replie tous deux sur
-- la chaîne vide, et aucune saisie ne pouvait les rendre. Ce sont les mêmes 56
-- que le §7 relève comme slugs vides.

/*
  Les alternatifs d'un film, repliés et mis bout à bout.

  `titres_alternatifs` est un objet `{"en": "…", "de": "…"}` : on ne garde que les
  valeurs, la langue n'ayant pas à se chercher, et chacune passe par
  `mots_recherche`, la normalisation unique du §7.

  **Le séparateur est une barre verticale, et il fait le travail du reste.**
  `mots_recherche` ne rend que `[a-z0-9 ]`, donc aucune saisie ne peut en
  contenir une : une correspondance ne peut jamais enjamber deux titres, et
  `like '%|' || t || '|%'` teste l'égalité avec l'un d'eux. Le champ porte sa
  barre aux deux bouts pour que le premier et le dernier titre se testent comme
  les autres. Concaténer sur une espace aurait fait que « usu hou » trouve
  « hausu house ».

  `order by` et `distinct` ne sont pas décoratifs : sans l'ordre, `string_agg`
  ne rend pas deux fois la même chaîne pour les mêmes données, et la fonction
  n'aurait d'`immutable` que la déclaration, ce qu'une colonne générée ne
  pardonne pas. Le dédoublonnage, lui, évite `|house|house|house|`, TMDB
  publiant souvent le même libellé dans trois langues.

  Les valeurs non latines retombent sur la chaîne vide et sont écartées, sinon
  le champ se remplirait de `||` qui ne servent rien.
*/
create or replace function public.mots_alternatifs(titres jsonb)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    '|' || (
      select string_agg(m, '|' order by m)
      from (
        select distinct public.mots_recherche(v.value) as m
        from jsonb_each_text(coalesce(titres, '{}'::jsonb)) as v
        where public.mots_recherche(v.value) <> ''
      ) s
    ) || '|',
    ''
  )
$$;

/*
  Colonne générée, et non un calcul au vol.

  Le calcul déplie un jsonb et agrège : le faire pour 12 129 lignes à chaque
  frappe interdirait tout index et rendrait la recherche linéaire. Stockée, elle
  coûte 684 ko en base et se réindexe seule à chaque écriture de
  `titres_alternatifs`, donc les passes d'enrichissement n'ont rien à savoir.

  C'est le même partage que `films.slug`, calculé en base pour que les scripts
  Python n'aient pas à connaître la règle.
*/
alter table public.films
  drop column if exists mots_alternatifs;

alter table public.films
  add column mots_alternatifs text
  generated always as (public.mots_alternatifs(titres_alternatifs)) stored;

-- `gin_trgm_ops` sert les deux usages, `like '%…%'` de la recherche exacte comme
-- l'opérateur `<%` du repli approchant, exactement comme les trois index de
-- titre posés le 1er août 2026.
create index if not exists films_mots_alternatifs_trgm
  on public.films using gin (mots_alternatifs extensions.gin_trgm_ops);

/*
  Recherche exacte, un rang de plus par étage.

  Les alternatifs entrent **sous** les colonnes propres du film et non à leur
  place : « House » doit rendre le film dont c'est le titre avant celui dont ce
  n'est qu'une traduction. Le classement passe donc de sept rangs à neuf,
  l'alternatif entier juste après le titre original entier, et l'alternatif
  quelconque juste après le titre original quelconque.

      0  titre entier
      1  début du titre
      2  titre original entier
      3  titre alternatif entier          <- neuf
      4  début d'un mot du titre
      5  n'importe où dans le titre
      6  n'importe où dans le titre original
      7  n'importe où dans un titre alternatif   <- neuf
      8  réalisateur seul

  Le réalisateur reste au dernier rang, inchangé.

  **Coût mesuré, « star » passe de 50 à 74 ms.** Ce ne sont pas les deux `like`
  ajoutés, qui portent sur une colonne stockée : c'est que l'index rend 98 lignes
  de plus, et que chacune traverse un `case` qui rappelle `mots_recherche` six
  fois. Le `explain` confirme que `films_mots_alternatifs_trgm` entre bien dans
  le `BitmapOr`, la sélection seule tenant en 4,9 ms.

  Le jour où ça gêne, le levier est de calculer `mots_recherche(titre)` une fois
  par ligne au lieu de six, pas de retirer une colonne cherchée. Il n'a pas été
  pris ici : sortir ce calcul du `case` demande une sous-requête, donc de
  reprojeter vers `films` pour garder le `setof`, et le risque est d'y perdre
  l'usage des index du `where`.
*/
create or replace function public.recherche_films(terme text, limite integer default 50)
returns setof public.films
language sql
stable
set search_path = ''
as $$
  with q as (select public.mots_recherche(terme) as t)
  select f.*
  from public.films f, q
  where q.t <> ''
    and (public.mots_recherche(f.titre) like '%' || q.t || '%'
      or public.mots_recherche(f.titre_original) like '%' || q.t || '%'
      or f.mots_alternatifs like '%' || q.t || '%'
      or public.mots_recherche(f.realisateur) like '%' || q.t || '%')
  order by
    case
      when public.mots_recherche(f.titre) = q.t then 0
      when public.mots_recherche(f.titre) like q.t || '%' then 1
      when public.mots_recherche(f.titre_original) = q.t then 2
      when f.mots_alternatifs like '%|' || q.t || '|%' then 3
      when ' ' || public.mots_recherche(f.titre) like '% ' || q.t || '%' then 4
      when public.mots_recherche(f.titre) like '%' || q.t || '%' then 5
      when public.mots_recherche(f.titre_original) like '%' || q.t || '%' then 6
      when f.mots_alternatifs like '%' || q.t || '%' then 7
      else 8
    end,
    f.popularite desc nulls last,
    f.id
  limit least(greatest(limite, 1), 100);
$$;

/*
  Le repli approchant, lui, ne prend pas les alternatifs. Il est **inchangé**,
  et cette section n'existe que pour dire pourquoi.

  L'idée était de rattraper « Hausou » comme le repli rattrape « Intrestellar ».
  Mesurée, elle ne tient pas : un champ qui porte jusqu'à six titres est six
  fois plus de mots courts à faire correspondre, et `word_similarity` retient la
  meilleure étendue de mots, donc les égalités deviennent la règle.

      hausou   Lion                   0,571   « der lange weg nach hause »
               Les Filles de joie     0,571   « harlots haus der huren »
               Le Sous-sol de la peur 0,571   « das haus der vergessenen »
               House                  0,571   « hausu »

  Quatre films au même score exact, départagés par la popularité, et le bon
  arrive quatrième. C'est mot pour mot ce que le §7 reproche au réalisateur dans
  le repli, aucun seuil ne séparant la faute de frappe du mot d'un tiers, et la
  mesure le dit ici aussi.

  Les alternatifs restent donc dans la recherche **exacte**, qui est ce que
  demandait le besoin : taper le titre étranger, correctement écrit, doit rendre
  le film. Une faute de frappe sur un titre étranger reste hors de portée, et
  c'est un manque assumé, pas un oubli.
*/
