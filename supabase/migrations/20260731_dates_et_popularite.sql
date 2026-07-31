-- Deux colonnes pour classer : la date de parution des disques, la popularité
-- des films.
--
-- **`editions.date_parution`, et non un remplacement de `date_sortie`.**
-- Cette dernière est du texte, dans la langue de la source : « Sep 30, 2025 »,
-- « September 8, 2024 ». Un `order by` dessus est alphabétique, donc faux —
-- « Apr » passe avant « Sep » quelle que soit l'année. On garde la chaîne brute
-- telle que la source la publie, et on range à côté la date analysée : si le
-- parseur se trompe un jour, l'original permet de vérifier et de rejouer.
--
-- 2 543 éditions ont une date, toutes venant de blu-ray.com. Les 3 193 lignes
-- editioncollector n'en publient pas : la colonne restera nulle pour elles, et
-- un classement par parution ne montrera jamais que les disques blu-ray.com.
--
-- **`films.popularite`** vient du champ `popularity` de TMDB, recalculé chez eux
-- tous les jours à partir des consultations, des recherches et des votes
-- récents. C'est donc une mesure de ce qu'on regarde *en ce moment*, pas une
-- notoriété historique : trier par `nb_votes` mettrait Fight Club en tête pour
-- toujours, trier par `popularite` fait remonter la sortie du mois.
--
-- Corollaire : la valeur se périme. Sans repasse régulière, la page d'accueil
-- affichera indéfiniment les succès du jour de l'import.

alter table public.editions
  add column if not exists date_parution date;

alter table public.films
  add column if not exists popularite real;

comment on column public.editions.date_parution is
  'Date de parution du disque, analysée depuis `date_sortie` (texte, anglais).
   Nulle sur les éditions editioncollector, qui ne publient pas de date.';

comment on column public.films.popularite is
  'Champ `popularity` de TMDB, recalculé quotidiennement chez eux. Mesure ce
   qu''on regarde en ce moment ; se périme sans repasse.';

-- Les deux colonnes ne servent qu'à trier : sans index, chaque tri de la page
-- d'accueil scanne la table entière.
create index if not exists editions_date_parution_idx
  on public.editions (date_parution desc nulls last);

create index if not exists films_popularite_idx
  on public.films (popularite desc nulls last);
