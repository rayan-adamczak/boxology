-- Apparier une liste importée au catalogue, par lots.
--
-- **Pourquoi ça existe.** Une collection vide se remplit édition par édition, ce
-- qui condamne l'inscription : personne ne saisit huit cents titres à la main.
-- Or ces gens ont déjà leur liste ailleurs, et le §8 le dit en toutes lettres,
-- le banc d'essai du 2 août 2026 portait sur des listes SensCritique intitulées
-- « DVD / Blu-ray / Steelbook » et « vidéothèque UHD/BD/DVD ».
--
-- Ce que l'import apporte est un **titre et une année**, jamais un code-barres :
-- ni Letterboxd ni SensCritique n'en publient. C'est donc l'appariement du §9
-- qu'il faut refaire, avec ses pièges, et non une jointure.
--
-- **Mesuré avant d'écrire, sur 49 titres écrits à la main dans la graphie
-- Letterboxd**, c'est-à-dire en anglais là où `films.titre` est français :
--
--     41 appariés (83,7 %)   8 absents   0 faux positif   0 ambiguïté
--
--     Amelie 2001                  -> Le Fabuleux Destin d'Amélie Poulain
--     The Handmaiden 2016          -> Mademoiselle
--     Raising Arizona 1987         -> Arizona Junior
--     Assault on Precinct 13 1976  -> Assaut
--     Spirited Away 2001           -> Le Voyage de Chihiro
--     Enemy 2013                   -> Enemy (2014)   <- rattrapé par l'année ±1
--
-- Les 8 absents sont **exactement** les trous de fonds nommés au §8, `Broken
-- Arrow`, `Insidious`, `Alpha`, `Dark Water`, `The Black Dahlia`, `Come and
-- See`, `Stray Dog`, `BPM` : l'appariement est juste, c'est le catalogue qui
-- manque. Second contrôle, 300 films tirés par popularité et cherchés depuis
-- leur titre anglais : 300/300, zéro faux positif, 3 ambigus.
--
-- **Ce qui rend l'anglais possible est `mots_alternatifs`**, colonne générée
-- posée le 5 août 2026 pour la recherche. Sans elle, un export Letterboxd ne
-- rendrait presque rien : leur `Name` est le titre anglais ou original, et nos
-- deux colonnes de titre sont françaises une fois sur deux.

/*
  Deux index btree d'expression, et ils remplacent un mauvais usage des
  trigrammes.

  Les trois index de titre du 1er août 2026 sont en `gin_trgm_ops`, ce qu'il
  fallait pour `like '%…%'` et pour l'opérateur `<%` du repli approchant. Ici on
  ne fait que de l'**égalité**, et un GIN trigramme sait la servir mais
  chèrement : mesuré, 200 entrées coûtaient 1 699 ms, le plan passant l'essentiel
  de son temps dans deux `Bitmap Index Scan` suivis d'un recheck.

  Le trigramme reste indispensable au seul `mots_alternatifs like '%|…|%'`, qui
  est une vraie sous-chaîne et ne peut pas passer par un btree.

  `mots_recherche` est `immutable`, c'est ce qui autorise l'index d'expression ;
  `films_mots_titre_trgm` en dépendait déjà.
*/
create index if not exists films_mots_titre_btree
  on public.films (public.mots_recherche(titre));

create index if not exists films_mots_titre_original_btree
  on public.films (public.mots_recherche(titre_original));

/*
  Apparier un lot d'entrées.

  Entrée : `[{"i": 0, "t": "Amélie", "o": "Amélie", "a": 2001}, …]`, où `i` est
  le rang dans le fichier importé, `t` le titre, `o` le titre original s'il est
  connu, `a` l'année. `o` et `a` sont facultatifs.

  Sortie : **une ligne par candidat**, jusqu'à quatre par entrée, avec
  `nb_candidats` qui porte le vrai total. Le client lit donc trois cas :

      aucune ligne pour ce rang   absent du catalogue  -> /report
      nb_candidats = 1            apparié
      nb_candidats > 1            homonymes, à trancher

  **Les éditions partent dans la même réponse.** 61,9 % des films n'en ont
  qu'une, donc l'écrasante majorité des lignes se décide sans rien redemander ;
  aller les chercher film par film ferait mille allers-retours sur une
  collection de mille titres.

  `security invoker`, et c'est délibéré : la fonction ne lit que `films`,
  `editions` et `edition_films`, que `anon` lit déjà (§3). Il n'y a aucune
  barrière à traverser, donc aucune raison d'être `security definer`, et le §3
  garde cinq avis de linter sur celles qui le sont vraiment.
*/
create or replace function public.apparier_import(p_entrees jsonb)
returns table (
  rang integer,
  film_id bigint,
  titre text,
  titre_original text,
  annee integer,
  slug text,
  affiche_url text,
  realisateur text,
  nb_candidats integer,
  editions jsonb
)
language plpgsql
stable
set search_path = ''
as $$
declare
  n integer := jsonb_array_length(coalesce(p_entrees, '[]'::jsonb));
begin
  -- **Un refus franc, jamais une troncature.** Le §9 garde la trace de
  -- plusieurs passes qui ont rendu un résultat partiel sans le dire, et une
  -- lecture qui échoue doit s'interrompre plutôt que rendre du vide. Le client
  -- découpe en lots de 200, ce plafond est là pour qu'un client fautif le
  -- sache.
  if n > 200 then
    raise exception 'apparier_import : % entrées pour un plafond de 200', n
      using errcode = 'program_limit_exceeded';
  end if;

  return query
  with entree as (
    select
      (e.value ->> 'i')::integer as rang,
      public.mots_recherche(e.value ->> 't') as t,
      nullif(public.mots_recherche(e.value ->> 'o'), '') as o,
      (e.value ->> 'a')::integer as annee
    from jsonb_array_elements(coalesce(p_entrees, '[]'::jsonb)) as e
    -- Un titre qui se replie sur la chaîne vide est un titre non latin ou une
    -- ligne vide : il ne peut apparier personne, et le laisser passer ferait
    -- une jointure sur `''` contre les films eux-mêmes vides.
    where public.mots_recherche(e.value ->> 't') <> ''
  ),
  candidat as (
    select
      en.rang,
      f.id, f.titre, f.titre_original, f.annee, f.slug,
      f.affiche_url, f.realisateur,
      row_number() over (
        partition by en.rang order by f.popularite desc nulls last, f.id
      ) as rg,
      count(*) over (partition by en.rang) as total
    from entree en
    join public.films f
      on (
           public.mots_recherche(f.titre) = en.t
        or public.mots_recherche(f.titre_original) = en.t
        or f.mots_alternatifs like '%|' || en.t || '|%'
        -- Le titre original de la source est une seconde chance, pas un repli
        -- plus lâche : c'est le même contrôle d'égalité sur une autre chaîne.
        -- SensCritique le publie sur les films étrangers, Letterboxd non.
        or (en.o is not null and (
             public.mots_recherche(f.titre) = en.o
          or public.mots_recherche(f.titre_original) = en.o
          or f.mots_alternatifs like '%|' || en.o || '|%'))
      )
      -- **L'année à ±1, et jamais en filtre dur côté source.** Le §9 pose que
      -- l'année d'un boîtier est souvent celle de l'édition et non de l'œuvre,
      -- et la mesure l'a confirmé ici : `Enemy` daté 2013 chez la source est
      -- 2014 chez TMDB, `Perfect Blue` 1997 contre 1998. Sans année, on ne
      -- filtre rien, et c'est l'unicité du candidat qui tranchera côté client.
      and (en.annee is null or f.annee between en.annee - 1 and en.annee + 1)
      -- Un film sans édition n'a rien à faire dans un import : `collections`
      -- est indexée par édition, et le §8 rappelle qu'une œuvre n'existe ici
      -- que si un disque la porte.
      and exists (
        select 1 from public.edition_films ef where ef.film_id = f.id
      )
  )
  select
    c.rang, c.id, c.titre, c.titre_original, c.annee, c.slug,
    c.affiche_url, c.realisateur, c.total::integer,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'titre', e.titre,
          'formats', e.formats_extraits,
          'editeur', e.editeur,
          'ean', e.ean,
          'image_url', e.image_url,
          'url_source', e.url_source,
          'date_parution', e.date_parution
        )
        order by e.date_parution desc nulls last, e.id
      )
      from public.editions e
      where exists (
        select 1 from public.edition_films ef
        where ef.edition_id = e.id and ef.film_id = c.id
      )
    ), '[]'::jsonb)
  from candidat c
  -- Quatre candidats suffisent à trancher un homonyme à l'écran, et bornent la
  -- réponse : sans ce plafond, un titre d'un seul mot ramènerait ses vingt
  -- homonymes avec leurs éditions.
  where c.rg <= 4
  order by c.rang, c.rg;
end;
$$;

grant execute on function public.apparier_import(jsonb) to anon, authenticated;
