-- Un lien partagé survit au changement d'identifiant.
--
-- ---------------------------------------------------------------------------
-- Ce que ça corrige
-- ---------------------------------------------------------------------------
--
-- `20260803_profils.sql` a posé que l'identifiant n'a **pas** d'id stable
-- derrière lui, contrairement à une fiche film où le slug est décoratif et où
-- l'id continue de résoudre. Conséquence assumée à l'époque, et écrite en
-- toutes lettres à l'écran : « les liens déjà partagés cesseront de
-- fonctionner ».
--
-- C'est le mauvais arbitrage, et pour une raison qui n'a rien de théorique :
-- l'adresse d'un profil est faite pour être **donnée**. Elle part dans un
-- message, un forum, une signature, une capture d'écran. La personne qui la
-- reçoit n'a aucun moyen de savoir qu'elle a changé, et le site n'a aucun
-- moyen de la prévenir. Une page qui répond 404 parce que son propriétaire a
-- corrigé une faute de frappe dans son pseudonyme est une panne, pas une
-- conséquence.
--
-- D'où cette table : l'ancienne adresse redirige vers la nouvelle, en 301,
-- exactement comme `/films/560` redirige vers `/movies/<slug>/560` (§7).
--
-- ---------------------------------------------------------------------------
-- Le prix à payer, et il est réel
-- ---------------------------------------------------------------------------
--
-- **Un identifiant, une fois porté, n'est plus jamais rendu à la circulation.**
-- Le §3 posait l'inverse, « l'ancien identifiant redevient libre : le garder en
-- réserve n'aiderait personne ». Les deux ne peuvent pas coexister : si
-- quelqu'un d'autre reprend `@rayan`, un lien partagé vers `@rayan` mènerait à
-- **la collection d'une autre personne**, ce qui est bien pire qu'un 404.
--
-- Le choix est donc : quelques mots gelés d'un côté, des liens qui tiennent de
-- l'autre. Et il se déjuge sans migration le jour où l'on changerait d'avis,
-- un `delete` sur la table suffit à tout rendre.
--
-- Idempotent, rejouable sans effet de bord.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.identifiants_precedents (
  -- La clé primaire est l'identifiant lui-même : c'est ce qu'on cherche, et
  -- son unicité *est* la règle. Deux comptes ne peuvent pas avoir porté le
  -- même, l'index unique de `profils` l'ayant toujours interdit.
  identifiant text not null primary key,

  -- Le compte disparaît, ses anciens identifiants avec, comme son profil et
  -- ses listes. C'est aussi ce qui les remet en circulation : un compte effacé
  -- n'a plus de lien à protéger.
  user_id     uuid not null references auth.users (id) on delete cascade,

  libere_le   timestamptz not null default now(),

  -- Même forme que `profils.identifiant`. Une ligne mal formée ne serait
  -- jamais trouvée par la recherche, qui normalise sa saisie : elle ne
  -- protégerait donc aucun lien tout en bloquant un mot.
  constraint identifiants_precedents_forme check (identifiant ~ '^[a-z0-9_]{3,20}$')
);

-- Pour le sens inverse : tous les anciens noms d'un compte. Sert au ménage de
-- la cascade et à un éventuel écran d'historique ; la lecture courante, elle,
-- passe par la clé primaire.
create index if not exists identifiants_precedents_user_idx
  on public.identifiants_precedents (user_id);

-- ---------------------------------------------------------------------------
-- Consignation automatique
-- ---------------------------------------------------------------------------

-- `security definer`, et c'est le point à ne pas rater. Le déclencheur écrit
-- dans une table que ni `anon` ni `authenticated` n'a le droit de toucher : en
-- `security invoker`, il s'exécuterait sous le rôle qui met à jour son profil
-- et buterait sur ce refus. Le §9 garde la trace du piège symétrique, où l'on
-- avait cru qu'un déclencheur tournait sous le propriétaire alors qu'il
-- s'exécutait sous l'appelant.
--
-- La table reste donc en `revoke all` : le déclencheur est la seule porte
-- d'écriture, comme les fonctions publiques sont la seule porte de lecture.
create or replace function public.profils_consigner_identifiant()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  -- On reprend un de ses propres anciens identifiants : il cesse d'être
  -- « précédent ». Sans cette ligne, `@rayan` renvoyé vers lui-même
  -- redirigerait `/u/rayan` vers `/u/rayan`, soit une boucle.
  delete from public.identifiants_precedents
   where identifiant = new.identifiant;

  if tg_op = 'UPDATE' and new.identifiant is distinct from old.identifiant then
    insert into public.identifiants_precedents (identifiant, user_id)
    values (old.identifiant, new.user_id)
    -- Le seul conflit possible est le même compte relâchant deux fois le même
    -- mot, en faisant l'aller-retour a → b → a → b. On rafraîchit la date.
    on conflict (identifiant) do update
      set user_id = excluded.user_id,
          libere_le = now();
  end if;

  return new;
end;
$$;

-- **Après** l'écriture, pas avant : `profils_normaliser` est un déclencheur
-- `before` qui corrige la casse, et consigner une valeur non normalisée
-- rangerait `Rayan` là où la recherche cherche `rayan`.
drop trigger if exists profils_consigner_identifiant_trg on public.profils;
create trigger profils_consigner_identifiant_trg
  after insert or update on public.profils
  for each row execute function public.profils_consigner_identifiant();

-- ---------------------------------------------------------------------------
-- Reprise des identifiants déjà relâchés
-- ---------------------------------------------------------------------------

-- Rien à reprendre : jusqu'ici aucun ancien identifiant n'était conservé, donc
-- il n'existe aucune trace des renommages antérieurs à cette migration. Les
-- liens partagés avant ce jour restent cassés, et c'est irrattrapable. Écrit
-- ici pour qu'on ne cherche pas la passe de rattrapage qui n'existe pas.

-- ---------------------------------------------------------------------------
-- Barrières
-- ---------------------------------------------------------------------------

alter table public.identifiants_precedents enable row level security;

-- Doctrine du §3 : `revoke` plutôt qu'une simple absence de policy, pour que
-- le refus arrive **avant** la RLS et se lise comme un 401 et non comme un 200
-- à tableau vide. Aucune policy, donc aucun accès direct : la table ne se lit
-- que par la fonction ci-dessous, qui ne rend qu'un identifiant courant.
revoke all on table public.identifiants_precedents from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Résolution
-- ---------------------------------------------------------------------------

-- L'identifiant courant du compte qui portait `p_identifiant`, ou `null`.
--
-- **Elle ne rend rien pour un profil masqué**, alors même que la ligne existe.
-- Le §3 pose qu'un identifiant inconnu et un profil masqué doivent rendre la
-- même chose, sans quoi l'adresse devient un oracle qui dit quels comptes
-- existent ; une redirection qui ne partirait que pour les profils masqués
-- serait exactement cet oracle, à un saut près.
--
-- Un seul saut suffit quelle que soit la chaîne de renommages : toutes les
-- lignes d'un compte pointent le même `user_id`, et c'est `profils` qui donne
-- le nom du jour. `a → b → c` résout `a` en `c` directement.
--
-- `stable`, donc PostgREST accepte le GET avec les arguments en chaîne de
-- requête, ce qui rend la réponse cachable à la périphérie (cf. `lireProfil`
-- dans le middleware).
create or replace function public.identifiant_courant(p_identifiant text)
  returns text
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select p.identifiant
  from public.identifiants_precedents ip
  join public.profils p on p.user_id = ip.user_id
  where ip.identifiant = lower(btrim(coalesce(p_identifiant, '')))
    and p.visible
    -- Un compte qui aurait repris ce mot n'a rien à rediriger vers lui-même.
    -- Le déclencheur retire déjà la ligne, cette garde est une ceinture.
    and p.identifiant is distinct from lower(btrim(coalesce(p_identifiant, '')));
$$;

revoke all on function public.identifiant_courant(text) from public;
grant execute on function public.identifiant_courant(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Disponibilité : un ancien identifiant reste pris
-- ---------------------------------------------------------------------------

-- Reprise de `20260803_profils.sql`, avec un test de plus. Recopiée en entier
-- plutôt que modifiée en place : `create or replace` remplace le corps, donc
-- la dernière migration jouée fait foi, et une version tronquée effacerait les
-- règles qu'elle ne répète pas.
--
-- Le motif rendu reste `pris` et non un troisième mot : du point de vue de qui
-- saisit, il n'y a rien à corriger différemment, et dire « cet identifiant a
-- appartenu à quelqu'un » publierait un fait sur un tiers.
create or replace function public.etat_identifiant(p_identifiant text)
  returns text
  language plpgsql
  stable
  security definer
  set search_path = ''
as $$
declare
  v_id text := lower(btrim(coalesce(p_identifiant, '')));
begin
  if auth.uid() is null then
    raise exception 'aucune session';
  end if;
  if v_id !~ '^[a-z0-9_]{3,20}$' then
    return 'invalide';
  end if;
  if public.identifiant_reserve(v_id) or public.texte_interdit(v_id) then
    return 'reserve';
  end if;
  if exists (
    select 1 from public.profils p
     where p.identifiant = v_id
       and p.user_id is distinct from auth.uid()
  ) then
    return 'pris';
  end if;
  -- Les siens restent disponibles : revenir en arrière après un renommage est
  -- le cas normal, et c'est même la manœuvre qu'on veut rendre sans risque.
  if exists (
    select 1 from public.identifiants_precedents ip
     where ip.identifiant = v_id
       and ip.user_id is distinct from auth.uid()
  ) then
    return 'pris';
  end if;
  return 'libre';
end;
$$;

revoke all on function public.etat_identifiant(text) from public, anon;
grant execute on function public.etat_identifiant(text) to authenticated;
