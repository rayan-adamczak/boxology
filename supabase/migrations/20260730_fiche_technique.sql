-- Champs de fiche technique repris de SensCritique, pris comme référence pour
-- la v1 du bloc « L'œuvre ».
--
-- À exécuter dans l'éditeur SQL Supabase avant `champs_tmdb.py --apply` et
-- `editeurs.py --apply` : sans ces colonnes, le PATCH échoue avec
-- « column does not exist ».
--
-- Leur fiche liste : titre original, titres alternatifs, genres, année, pays,
-- durée, dates de sortie, réalisateur, scénariste, producteurs, distributeur,
-- budget, bande originale. Tout était déjà là sauf ces six.
--
-- Cinq viennent de TMDB, dans l'appel que `champs_tmdb.py` fait déjà.
-- Le sixième, le distributeur, n'y est pas : `production_companies` liste les
-- sociétés de production, pas le distributeur, et les deux ne coïncident que
-- par accident. Il est donc remplacé par l'éditeur vidéo relevé sur
-- blu-ray.com — l'information qui a un sens sur un catalogue de disques, et
-- qui porte sur l'édition, pas sur l'œuvre : d'où sa place sur `editions`.

alter table public.films
  add column if not exists pays          text[],
  add column if not exists date_sortie   date,
  add column if not exists producteurs   text[],
  add column if not exists budget        bigint,
  add column if not exists musique       text;

alter table public.editions
  add column if not exists editeur       text;

comment on column public.films.pays is
  'Pays de production, noms français. Source TMDB `production_countries`.';
comment on column public.films.date_sortie is
  'Sortie salle française (TMDB `release_dates`, FR, type 3). À défaut, la
   sortie mondiale `release_date`, ou `first_air_date` pour une série.';
comment on column public.films.budget is
  'Budget en dollars. TMDB rend 0 quand il ne sait pas — stocké NULL dans ce
   cas, sinon la fiche afficherait « 0 $ » comme si c''était une mesure.';
comment on column public.films.musique is
  'Compositeur de la musique originale. TMDB, poste « Original Music Composer ».';
comment on column public.editions.editeur is
  'Éditeur vidéo du disque (20th Century Fox, Criterion…). Source blu-ray.com.';
