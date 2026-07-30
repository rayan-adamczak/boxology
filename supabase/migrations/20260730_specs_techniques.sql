-- Specs techniques des editions, pour le bloc « Fiche technique » de la fiche film.
--
-- À exécuter dans l'éditeur SQL Supabase avant `specs_2_ecrire.py --apply` :
-- sans ces colonnes, le PATCH échoue avec « column does not exist ».
--
-- La donnée vient de blu-ray.com, déjà crawlée : les 3 100 pages sont dans
-- `~/Documents/jaquette-scraping/crawl/pages/`. Aucune requête réseau n'est
-- nécessaire, ce qui compte puisque le site répond 403 depuis juillet 2026.
-- Le parseur d'origine extrayait déjà ces champs mais l'écriture les aplatissait
-- dans `contenu_brut` ; `specs.py` les reprend depuis le HTML structuré.
--
-- Porté par `editions` et non par `films` : le ratio, le codec, le HDR et les
-- pistes audio sont des propriétés du disque. Un film peut avoir une 4K en
-- Dolby Vision et un Blu-ray en 1080p — les stocker au niveau du film
-- écraserait l'un par l'autre. La fiche film agrège à l'affichage.
--
-- Couverture attendue : 2 546 éditions blu-ray.com sur 5 739. Les 3 193 lignes
-- editioncollector n'ont aucune spec — le bloc doit rester conditionnel.

alter table public.editions
  add column if not exists codec          text,
  add column if not exists resolution     text,
  add column if not exists hdr            text[],
  add column if not exists ratio          text,
  add column if not exists ratio_origine  text,
  add column if not exists pistes_audio   jsonb,
  add column if not exists sous_titres    text[],
  add column if not exists disques        text,
  add column if not exists packaging      text;

comment on column public.editions.codec is
  'Codec vidéo du disque (MPEG-4 AVC, HEVC / H.265, VC-1…). Source blu-ray.com.';
comment on column public.editions.hdr is
  'Formats HDR du disque : {"Dolby Vision","HDR10"}. Vide sur un Blu-ray 1080p.';
comment on column public.editions.ratio is
  'Ratio de l''image sur le disque. `ratio_origine` porte le ratio de projection.';
comment on column public.editions.pistes_audio is
  'Pistes audio : [{"langue":"French","format":"DTS-HD Master Audio 5.1"}, …].';
