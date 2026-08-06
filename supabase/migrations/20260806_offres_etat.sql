-- État du disque proposé par l'offre, 6 août 2026.
--
-- Momox shop FR (revente/outbound) accepté sur Awin le 6 août 2026, et c'est la
-- **première source de seconde main du catalogue**. Le §8 posait depuis le
-- 2 août que la valeur d'une collection, deuxième fonction la plus demandée,
-- était hors de portée sans un marchand d'occasion : aucune des huit sources
-- précédentes n'en était un.
--
-- **Sans cette colonne, les deux marchands seraient indistinguables et le prix
-- deviendrait un mensonge par omission.** Mesuré sur les deux flux du jour, la
-- colonne `condition` d'Awin, jamais devinée :
--
--     Leclerc   91 320 / 91 320   « new »
--     Momox     68 493            « D'occasion - Très bon état »
--               67 422            « D'occasion - bon état »
--               16 264            « D'occasion - acceptable »
--                2 708            « NewItem »
--
-- Un occasion « acceptable » à 3,49 € et un neuf à 19,99 € sont deux offres
-- légitimes du même disque, et rien dans `offres` ne permettait de les
-- distinguer : la fiche film affichait la première venue.
--
-- **Vocabulaire fermé, et fidèle au marchand plutôt que joli.** `tres_bon` et
-- non `comme_neuf` : momox écrit « Très bon état », et traduire son barème
-- inventerait une garantie qu'il ne donne pas. La contrainte est là pour qu'un
-- troisième marchand ne fasse pas entrer un cinquième mot par accident, ce qui
-- rendrait tout filtre par état silencieusement incomplet.
--
-- **Nullable, et le nul veut dire « le marchand ne le dit pas ».** Il ne veut
-- pas dire « neuf » : le supposer ferait entrer des disques d'occasion dans une
-- estimation de valeur sans que personne le voie. Une offre sans état est
-- exclue des totaux, jamais comptée par défaut.
--
-- Rejouable sans effet de bord.

alter table public.offres
  add column if not exists etat text;

comment on column public.offres.etat is
  'État du disque déclaré par le marchand : neuf, tres_bon, bon, acceptable. '
  'Nul quand le marchand ne le dit pas, ce qui n''est pas la même chose que neuf.';

-- Rétro-marquage mesuré, pas supposé : le flux Leclerc porte `condition: new`
-- sur ses 91 320 lignes. Sans lui, les 3 014 offres en base resteraient sans
-- état jusqu'à la prochaine passe, donc absentes de tout filtre.
update public.offres set etat = 'neuf'
 where marchand = 'E.Leclerc' and etat is null;

-- La contrainte vient **après** le rétro-marquage : posée avant, elle passerait
-- quand même (le nul est permis), mais l'ordre inverse est le bon réflexe le
-- jour où le vocabulaire se resserre.
alter table public.offres drop constraint if exists offres_etat_connu;
alter table public.offres add constraint offres_etat_connu
  check (etat is null or etat in ('neuf', 'tres_bon', 'bon', 'acceptable'));

-- L'estimation de collection lit les offres d'occasion des éditions possédées,
-- donc filtre sur l'état après avoir filtré sur l'édition. `offres_edition_idx`
-- porte déjà le premier ; celui-ci sert quand la sélection part de l'état, ce
-- que fait le décompte de couverture.
create index if not exists offres_etat_idx on public.offres (etat) where etat is not null;
