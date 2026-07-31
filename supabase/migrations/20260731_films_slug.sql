-- Segment lisible de l'URL d'une fiche film : /films/la-la-land-2016/11913569
--
-- Le slug est décoratif, l'id fait autorité. C'est ce qui permet de le
-- recalculer librement : une URL dont le slug a vieilli reste résoluble, et la
-- Pages Function la redirige en 301 vers la forme courante.
--
-- Corollaire : aucune contrainte d'unicité, et aucun index. Deux films peuvent
-- porter le même slug (les deux Dune, les deux Nosferatu) sans qu'aucune URL
-- devienne ambiguë, puisque l'id les sépare. Et on ne lit jamais la table par
-- son slug, seulement par son id : un index ne servirait personne.
--
-- Rejouable sans effet de bord.

-- --------------------------------------------------------------------------
-- 1. Repli ASCII
-- --------------------------------------------------------------------------

-- `translate` ne fait que du un pour un : les caractères qui doivent devenir
-- plusieurs lettres passent avant, par `replace`.
--
-- Tout ce qui n'est ni lettre ni chiffre finit en tiret, y compris la
-- ponctuation typographique, inutile donc de la lister ici. Ce qui doit
-- absolument être traduit, ce sont les caractères qui portent une lettre ou un
-- chiffre : sans eux, `Alien³` donnerait `alien` et deviendrait indistinguable
-- d'`Alien`, et `L'Odyssée` perdrait son accent au lieu de le replier.
--
-- Les invisibles de TMDB (espace insécable, marque de sens d'écriture) sont
-- couverts par la même règle : ils ne sont pas alphanumériques, donc ils
-- deviennent des tirets, que le nettoyage final absorbe.
create or replace function public.slug_titre(source text)
returns text
language sql
immutable
as $$
  select nullif(
    btrim(
      regexp_replace(
        regexp_replace(
          lower(
            translate(
              replace(replace(replace(replace(replace(
                coalesce(source, ''),
                'œ', 'oe'), 'Œ', 'OE'),
                'æ', 'ae'), 'Æ', 'AE'),
                'ß', 'ss'),
              'àáâãäåÀÁÂÃÄÅèéêëÈÉÊËìíîïÌÍÎÏòóôõöøÒÓÔÕÖØùúûüÙÚÛÜçÇñÑýÿÝ¹²³',
              'aaaaaaAAAAAAeeeeEEEEiiiiIIIIooooooOOOOOOuuuuUUUUcCnNyyY123'
            )
          ),
          '[^a-z0-9]+', '-', 'g'
        ),
        '-{2,}', '-', 'g'
      ),
      '-'
    ),
  '');
$$;

-- --------------------------------------------------------------------------
-- 2. Slug complet, année comprise
-- --------------------------------------------------------------------------

-- L'année désambiguïse pour l'œil ce que l'id désambiguïse pour la machine :
-- `dune-1984` et `dune-2021` se distinguent dans une page de résultats, pas
-- `dune` et `dune`.
--
-- Elle n'est pas ajoutée quand le titre la porte déjà (quelques titres
-- l'incluent), pour ne pas produire `terminator-2-1991-1991`.
create or replace function public.slug_film(titre text, annee text)
returns text
language sql
immutable
as $$
  select case
    when base is null then null
    when an is null then base
    when base like '%-' || an then base
    else base || '-' || an
  end
  from (
    select
      public.slug_titre(titre) as base,
      -- `annee` est du texte en base et n'est pas toujours une année nue.
      -- On ne retient que quatre chiffres plausibles, rien d'autre.
      (select m[1] from regexp_match(coalesce(annee, ''), '(1[89][0-9]{2}|20[0-9]{2})') as m) as an
  ) as parts;
$$;

-- --------------------------------------------------------------------------
-- 3. Colonne et tenue à jour
-- --------------------------------------------------------------------------

alter table public.films add column if not exists slug text;

comment on column public.films.slug is
  'Segment lisible de l''URL, dérivé de titre et annee. Décoratif : l''id fait '
  'autorité. Recalculé par déclencheur, jamais saisi à la main.';

-- Le déclencheur évite d'avoir à toucher aux scripts d'import : une ligne
-- écrite par `import_3_ecrire.py` ou `ecrire_ec.py` reçoit son slug sans que le
-- script le sache.
--
-- Il recalcule à chaque écriture, y compris quand `rafraichir_titres.py`
-- réaligne un titre sur TMDB. L'URL bouge alors, et c'est le comportement
-- voulu : l'ancienne reste résoluble par son id et se fait rediriger.
create or replace function public.films_poser_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slug_film(new.titre, new.annee::text);
  return new;
end;
$$;

drop trigger if exists films_slug on public.films;
create trigger films_slug
  before insert or update on public.films
  for each row execute function public.films_poser_slug();

-- --------------------------------------------------------------------------
-- 4. Reprise de l'existant
-- --------------------------------------------------------------------------

update public.films
   set slug = public.slug_film(titre, annee::text)
 where slug is distinct from public.slug_film(titre, annee::text);
