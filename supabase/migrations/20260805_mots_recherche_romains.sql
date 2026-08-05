-- `mots_recherche` convertit les chiffres romains, et rend son exposant à Alien³.
--
-- **Le défaut se mesure côté visiteur.** Le banc d'essai du 5 août 2026 contre
-- des collections SensCritique a sorti `Retour vers le futur 2` comme absent du
-- catalogue, alors que le film y est avec ses éditions :
--
--     « Retour vers le futur 2 »   ->  AUCUN
--     « Retour vers le futur II »  ->  Retour vers le futur II (1989)
--
-- Nos titres viennent de TMDB, qui écrit `Gladiator II`, `La Reine des neiges
-- II`, `Blade II`, `Scream VI`, `Wicked : Partie II`. Personne ne tape ça. Le
-- §9 note que la conversion des chiffres romains est faite **côté scraping**
-- avant d'interroger TMDB ; elle manquait côté site.
--
-- **`i`, `v` et `x` seuls ne sont pas convertis**, et c'est le point qui décide
-- de la forme de cette fonction : `X-Men` deviendrait `10 men`, `V pour
-- Vendetta` `5 pour vendetta`, `I Am Legend` `1 am legend`. Seules les formes
-- à deux lettres et plus sont sans ambiguïté dans un titre de film.
--
-- **L'ordre des remplacements n'est pas décoratif** : `viii` avant `vii` avant
-- `vi`, `xiii` avant `xii` avant `xi`, `iii` avant `ii`. Dans l'autre sens,
-- `viii` deviendrait `v3` puis rien de lisible.
--
-- **Au passage, `Alien³` cesse de se replier sur `alien`.** L'exposant était
-- perdu par `unaccent` puis par la classe `[^a-z0-9]`, donc `Alien³` et `Alien`
-- devenaient indistinguables — le §9 le signale depuis juillet pour le
-- rapprochement TMDB, il valait aussi pour la recherche du site.
--
-- L'exposant devient un **mot séparé**, `alien 3` et non `alien3` : la première
-- forme reste distincte d'`alien` tout en correspondant à « Alien 3 », que
-- c'est ce qu'un visiteur tape. Coller le chiffre satisfaisait le §9 et
-- laissait la fiche introuvable, ce qui est le contraire du but.
--
-- **Les trois index GIN portent sur cette fonction**, donc ils contiennent des
-- valeurs calculées par l'ancienne définition. Les réindexer fait partie de la
-- migration : sans ça la recherche exacte serait fausse en silence, ce qui est
-- pire que le défaut qu'on corrige. Ils sont petits, 12 000 lignes.
--
-- Idempotent, rejouable sans effet de bord.

create or replace function public.mots_recherche(texte text) returns text
language sql immutable set search_path = '' as $fn$
  with base as (
    select trim(regexp_replace(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary,
              regexp_replace(texte, '([¹²³])', ' \1', 'g'))),
      '[^a-z0-9¹²³]+', ' ', 'g')) v0),
  sup as (select translate(v0, '¹²³', '123') v from base),
  r1  as (select regexp_replace(v, '(^| )xiii( |$)', '\1 13 \2', 'g') v from sup),
  r2  as (select regexp_replace(v, '(^| )xii( |$)',  '\1 12 \2', 'g') v from r1),
  r3  as (select regexp_replace(v, '(^| )xi( |$)',   '\1 11 \2', 'g') v from r2),
  r4  as (select regexp_replace(v, '(^| )viii( |$)', '\1 8 \2',  'g') v from r3),
  r5  as (select regexp_replace(v, '(^| )vii( |$)',  '\1 7 \2',  'g') v from r4),
  r6  as (select regexp_replace(v, '(^| )vi( |$)',   '\1 6 \2',  'g') v from r5),
  r7  as (select regexp_replace(v, '(^| )iv( |$)',   '\1 4 \2',  'g') v from r6),
  r8  as (select regexp_replace(v, '(^| )ix( |$)',   '\1 9 \2',  'g') v from r7),
  r9  as (select regexp_replace(v, '(^| )iii( |$)',  '\1 3 \2',  'g') v from r8),
  r10 as (select regexp_replace(v, '(^| )ii( |$)',   '\1 2 \2',  'g') v from r9)
  select trim(regexp_replace(v, '\s+', ' ', 'g')) from r10
$fn$;

reindex index public.films_mots_titre_trgm;
reindex index public.films_mots_titre_original_trgm;
reindex index public.films_mots_realisateur_trgm;
