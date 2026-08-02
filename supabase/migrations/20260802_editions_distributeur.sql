-- `editions.distributeur`, le seul champ que dvdfr apporte et qu'aucune autre
-- source ne donne.
--
-- Le §8 le note comme manquant et destiné à le rester : TMDB ne publie pas le
-- distributeur, et `production_companies` liste les sociétés de production,
-- qui ne le sont que par coïncidence. dvdfr, lui, le nomme sur chaque fiche,
-- `Universal Music France`, `Metropolitan FilmExport`, `Gaumont`.
--
-- Il qualifie **le disque**, pas l'œuvre, d'où sa place dans `editions` à côté
-- d'`editeur` : Studiocanal presse, Universal distribue, et la même œuvre
-- change de distributeur d'un pays et d'une édition à l'autre.
--
-- Idempotent, rejouable sans effet de bord. À appliquer par l'éditeur SQL du
-- tableau de bord, seule voie disponible : pas de `psql`, pas de CLI, et la
-- clé `service_role` n'exécute pas de DDL par PostgREST.
--
--     pbcopy < supabase/migrations/20260802_editions_distributeur.sql
--
-- Coller plutôt que taper : l'éditeur auto-indente et ferme les parenthèses.

alter table public.editions
  add column if not exists distributeur text;

comment on column public.editions.distributeur is
  'Distributeur du disque, relevé chez dvdfr. Distinct de `editeur`, qui '
  'presse : Studiocanal édite, Universal distribue.';

-- Index sur la valeur non nulle : la colonne sera creuse longtemps, dvdfr ne
-- couvrant que les éditions à code-barres, et un index partiel ne porte que ce
-- qui existe. Il servira le jour où `/publishers` gagnera un axe distributeur.
create index if not exists editions_distributeur_idx
  on public.editions (distributeur)
  where distributeur is not null;
