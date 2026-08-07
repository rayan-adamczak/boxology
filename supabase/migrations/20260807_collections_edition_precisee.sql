-- Une ligne de collection peut désigner le film sans désigner le pressage.
--
-- **Ce que la mesure a démenti.** Le plan d'import tablait sur l'ambiguïté
-- d'édition mesurée sur le catalogue entier : 61,9 % des films n'ont qu'une
-- édition, et déclarer un format en levait 58,5 % du reste, soit 84 %
-- d'auto-résolution. Rejoué sur une **vraie liste**, les 1 005 envies d'un
-- compte SensCritique réel, le 7 août 2026 :
--
--     527 films appariés, dont 390 à plusieurs éditions   -> 74 %, pas 38 %
--     déclarer « Blu-ray » n'en lève que 51              -> 35,7 % au total
--
-- L'écart n'est pas une erreur de mesure, c'est un biais de population : une
-- liste réelle est faite de films **populaires**, et un film populaire a
-- quatorze Blu-ray, steelbook, digibook, réédition, coffret. `300` en porte
-- vingt, dont quatorze Blu-ray. La moyenne du catalogue est tirée vers le bas
-- par les milliers de titres à édition unique que personne ne collectionne.
--
-- **Le plan d'origine importait donc 26 % d'une liste et jetait le reste.**
--
-- Les deux issues habituelles sont mauvaises. Faire choisir parmi quatorze
-- pressages, trois cent quarante fois de suite, personne ne le fera ; et
-- personne ne s'en souvient. Choisir à sa place et se taire, c'est écrire un
-- lien faux, ce que le §9 interdit en toutes lettres : une orpheline se voit et
-- se corrige, un lien faux se lit comme une vérité.
--
-- **La troisième issue est de le dire.** « J'ai *300* en Blu-ray » est une
-- vérité que les gens savent énoncer ; « j'ai le steelbook Zavvi de 2013 » non.
-- La ligne existe, elle pointe une édition représentative pour avoir une
-- jaquette et une fiche, et elle porte la marque de ce qu'elle n'affirme pas.

/*
  `true` par défaut, et c'est ce qui rend la migration sans effet sur l'existant.

  Toute ligne écrite avant aujourd'hui vient d'un clic sur une édition précise,
  fiche film ou page de regroupement : elle est précisée par construction. Seul
  l'import écrit `false`, et seulement quand il n'a pas su trancher.

  `not null` plutôt que nullable : trois états n'auraient aucun sens ici, et un
  `null` se lirait « on ne sait pas si on sait », ce qui ne se corrige pas.
*/
alter table public.collections
  add column if not exists edition_precisee boolean not null default true;

comment on column public.collections.edition_precisee is
  'Faux quand la ligne vient d''un import qui n''a pas su choisir entre '
  'plusieurs éditions du même film : elle affirme le film et le format, '
  'pas le pressage. Vrai partout ailleurs.';

/*
  Index partiel sur ce qui reste à préciser.

  L'écran « à préciser » ne demande que ces lignes-là, et elles sont minoritaires
  chez qui n'a jamais importé : un index partiel coûte quelques pages plutôt que
  d'en indexer une colonne entière presque toujours vraie.
*/
create index if not exists collections_a_preciser
  on public.collections (user_id)
  where not edition_precisee;
