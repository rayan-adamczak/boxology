-- L'appariement dit combien de films chaque édition porte.
--
-- **Un coffret est le pire défaut possible**, et le premier import réel l'a
-- montré tout de suite. `choisirEdition` désigne une édition représentative
-- quand rien ne permet de trancher, et la classait sur la complétude de la
-- fiche, code-barres, visuel et date. Or c'est exactement ce qu'un coffret a de
-- mieux renseigné que les autres : il gagnait donc systématiquement.
--
-- Mesuré sur les 23 lignes non précisées du premier import réel, le 7 août
-- 2026 : **4 pointaient un coffret**, soit 17,4 %. Les quatre *Alien* du fichier
-- avaient tous reçu « Alien 1-6 – Intégrale 6 Films », et les quatre Iñárritu
-- « Intégrale Alejandro G. Iñárritu ».
--
-- Ce n'est pas une imprécision, c'est une affirmation fausse d'un autre ordre :
-- « je ne sais pas quel pressage d'*Alien* vous avez » est vrai, « vous possédez
-- l'intégrale six films » ne l'est pas. Le §9 interdit d'écrire ce qu'on ne sait
-- pas vrai, et ici on écrivait cinq disques de plus que ce que la personne a
-- dit avoir.
--
-- La colonne existait déjà, dans `edition_films` : il suffisait de la compter et
-- de la rendre, pour que le classement puisse préférer une édition simple.

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
  if n > 200 then
    raise exception 'apparier_import : % entrees pour un plafond de 200', n
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
        or (en.o is not null and (
             public.mots_recherche(f.titre) = en.o
          or public.mots_recherche(f.titre_original) = en.o
          or f.mots_alternatifs like '%|' || en.o || '|%'))
      )
      and (en.annee is null or f.annee between en.annee - 1 and en.annee + 1)
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
          'date_parution', e.date_parution,
          -- Le nombre de films que porte le disque. À 1 c'est une édition
          -- simple, au-delà un coffret, et le client s'en sert pour ne jamais
          -- désigner un coffret par défaut.
          'nb_films', (
            select count(*) from public.edition_films ef3
            where ef3.edition_id = e.id
          )
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
  where c.rg <= 4
  order by c.rang, c.rg;
end;
$$;

grant execute on function public.apparier_import(jsonb) to anon, authenticated;
