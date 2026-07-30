-- Titres étrangers des films, pour le référencement.
--
-- À exécuter dans l'éditeur SQL Supabase avant `enrichir_tmdb.py --apply` :
-- sans cette colonne, le PATCH échoue avec « column does not exist ».
--
-- Forme : {"en": "Harry Potter and the Philosopher's Stone",
--          "es": "Harry Potter y la piedra filosofal", ...}
-- Clé = langue ISO 639-1, pas pays : « es-ES » et « es-MX » donnent le même
-- titre, et les langues régionales espagnoles n'ont pas d'intérêt ici.
--
-- Le titre français n'y figure pas : il est déjà dans `films.titre`.
-- Le titre original non plus : `films.titre_original` existe.
--
-- jsonb et non une table dédiée : ces titres ne sont jamais interrogés seuls,
-- toujours lus avec le film. Une table imposerait une jointure pour rien.

alter table public.films
  add column if not exists titres_alternatifs jsonb;

comment on column public.films.titres_alternatifs is
  'Titres TMDB par langue ISO 639-1, hors français. Alimenté par enrichir_tmdb.py.';
