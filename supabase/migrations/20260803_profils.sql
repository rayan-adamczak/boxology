-- Profils publics : un identifiant @ par compte, et une page partageable.
--
-- Appliquée le 3 août 2026 par le serveur MCP Supabase, et non par l'éditeur
-- SQL du tableau de bord : la connexion MCP existe depuis que le §3 a été
-- écrit. Ce fichier reste la source. Idempotent : rejouable sans effet de bord.
--
-- ---------------------------------------------------------------------------
-- Ce que ça change à la promesse de confidentialité
-- ---------------------------------------------------------------------------
--
-- `collections` était lisible par son seul propriétaire, et la politique de
-- confidentialité le disait. Une page de profil partageable rend ces listes
-- lisibles par n'importe qui connaissant l'adresse. Trois garde-fous, dans
-- l'ordre où ils agissent :
--
--   1. `profils.visible` est un interrupteur porté par l'utilisateur. À faux,
--      la page répond comme un profil inexistant, et non « profil masqué » :
--      un 404 ne dit pas qu'un compte existe.
--   2. **`anon` ne reçoit aucun privilège sur `profils` ni sur `collections`.**
--      La lecture publique passe par deux fonctions `security definer` qui ne
--      rendent que ce qu'elles ont décidé de rendre. La barrière tombe donc
--      avant la RLS, comme le veut la doctrine du §3, et une policy mal écrite
--      ne peut pas ouvrir la table entière.
--   3. Aucune fonction ne rend jamais l'adresse électronique ni l'identifiant
--      Google. Le nom affiché est une colonne de `profils`, séparée de
--      `auth.users`, précisément pour qu'on puisse en mettre un autre.
--
-- La politique de confidentialité et la FAQ sont mises à jour dans le même
-- commit : une promesse qui ne correspond plus au code est pire que pas de
-- promesse du tout.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.profils (
  -- Le compte disparaît, son profil avec, comme `collections`.
  user_id     uuid not null primary key references auth.users (id) on delete cascade,

  -- L'identifiant public, sans son « @ » : celui-ci est un signe d'affichage,
  -- pas une partie de la valeur. Stocké **en minuscules**, imposé par le
  -- déclencheur : un @ se copie, se dicte et se tape, deux casses qui
  -- désignent deux personnes différentes seraient un piège permanent.
  identifiant text not null,

  -- Le nom montré sur la page publique. Recopié du compte Google à la
  -- création, puis modifiable : personne ne doit être obligé de publier son
  -- état civil pour avoir une page.
  nom         text not null,

  -- L'interrupteur. Vrai par défaut : la page publique est le sens même de
  -- l'identifiant, et l'écran de création l'annonce en toutes lettres.
  visible     boolean not null default true,

  cree_le     timestamptz not null default now(),
  maj_le      timestamptz not null default now(),

  -- 3 à 20 signes, minuscules, chiffres et souligné. Pas de tiret : il se
  -- confond avec le souligné à l'oral comme dans certaines polices, et un
  -- identifiant se dicte.
  constraint profils_identifiant_forme check (identifiant ~ '^[a-z0-9_]{3,20}$'),
  constraint profils_nom_longueur check (char_length(btrim(nom)) between 1 and 60)
);

-- L'unicité de l'identifiant est la garantie que l'URL désigne une personne.
-- Aucune fonction `lower()` dans l'index : la colonne est déjà normalisée à
-- l'écriture, donc une comparaison directe emprunte l'index.
create unique index if not exists profils_identifiant_idx
  on public.profils (identifiant);

-- ---------------------------------------------------------------------------
-- Identifiants réservés
-- ---------------------------------------------------------------------------

-- Un @ qui se fait passer pour le site est un problème d'usurpation, pas de
-- goût : « @support » ou « @jaquette » recevraient des signalements de bonne
-- foi. On réserve aussi les segments de chemin du site, non par nécessité,
-- l'adresse étant `/u/<identifiant>` et non `/<identifiant>`, mais parce que
-- ce préfixe pourrait disparaître un jour et que la liste, elle, restera.
--
-- **Cette liste est la seule autorité.** Le front ne la recopie pas : il
-- interroge `etat_identifiant` et affiche le motif rendu. Une seconde copie en
-- TypeScript dériverait au premier ajout sans que rien ne le signale.
create or replace function public.identifiant_reserve(p_identifiant text)
  returns boolean
  language sql
  immutable
  set search_path = ''
as $$
  select lower(btrim(coalesce(p_identifiant, ''))) = any (array[
    'admin', 'administrateur', 'root', 'systeme', 'system', 'api', 'www',
    'support', 'contact', 'aide', 'help', 'moderation', 'moderateur',
    'jaquette', 'jaquetteapp', 'equipe', 'team', 'officiel', 'official',
    'mail', 'email', 'noreply', 'no_reply', 'postmaster', 'abuse',
    'compte', 'account', 'profil', 'profile', 'reglages', 'settings',
    'films', 'movies', 'editions', 'formats', 'genres', 'publishers',
    'editeurs', 'collections', 'catalogue', 'lists', 'listes', 'search',
    'welcome', 'bienvenue', 'about', 'legal', 'privacy', 'sitemap', 'robots',
    'assets', 'fonts', 'static', 'null', 'undefined', 'anonyme', 'anonymous',
    'moi', 'me', 'new', 'nouveau', 'tous', 'all'
  ]);
$$;

-- ---------------------------------------------------------------------------
-- Normalisation à l'écriture
-- ---------------------------------------------------------------------------

-- Le déclencheur, et non une contrainte, parce qu'il doit *corriger* la
-- valeur et pas seulement la refuser : c'est lui qui garantit qu'aucune ligne
-- ne porte de majuscule, donc que l'index unique suffit.
--
-- La réservation est vérifiée ici, et pas dans un `check` : la liste évoluera,
-- et une contrainte de table aurait imposé de la revalider sur les lignes
-- existantes à chaque ajout.
create or replace function public.profils_normaliser()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.identifiant := lower(btrim(coalesce(new.identifiant, '')));
  new.nom := btrim(coalesce(new.nom, ''));
  if public.identifiant_reserve(new.identifiant) then
    -- 23514 : violation de contrainte. PostgREST le rend en 400, là où une
    -- exception sans code sortirait en 500, c'est-à-dire en « panne du site »
    -- pour une saisie que l'utilisateur peut corriger.
    raise exception 'identifiant réservé' using errcode = '23514';
  end if;
  new.maj_le := now();
  return new;
end;
$$;

drop trigger if exists profils_normaliser_trg on public.profils;
create trigger profils_normaliser_trg
  before insert or update on public.profils
  for each row execute function public.profils_normaliser();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profils enable row level security;

-- `revoke` et pas seulement l'absence de policy : le refus doit arriver avant
-- la RLS, donc se lire comme un 401 et non comme un 200 à tableau vide (§3).
revoke all on table public.profils from anon;
-- Pas de `delete` : un profil s'efface avec son compte, par cascade. Le
-- supprimer seul libérerait l'identifiant tout en laissant le compte sans
-- page, un état que rien dans l'application ne sait présenter.
grant select, insert, update on table public.profils to authenticated;

-- Chacun ne voit que le sien. La lecture d'un profil *tiers* passe par
-- `profil_public`, y compris pour un compte connecté : une seule porte, donc
-- un seul endroit où `visible` peut être oublié.
drop policy if exists profils_select_own on public.profils;
create policy profils_select_own on public.profils
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists profils_insert_own on public.profils;
create policy profils_insert_own on public.profils
  for insert to authenticated
  with check (user_id = auth.uid());

-- `using` filtre les lignes modifiables, `with check` empêche de réattribuer
-- la ligne à un autre compte. Les deux sont nécessaires (cf. `collections`).
drop policy if exists profils_update_own on public.profils;
create policy profils_update_own on public.profils
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Disponibilité d'un identifiant
-- ---------------------------------------------------------------------------

-- Rend un motif et non un booléen : « pris », « réservé » et « mal formé » ne
-- se corrigent pas de la même façon, et l'écran doit pouvoir le dire.
--
-- `security definer` parce qu'un compte ne peut pas lire les lignes des
-- autres. La fonction ne rend jamais *qui* détient l'identifiant, seulement
-- qu'il est pris.
--
-- Son propre identifiant courant rend « libre » : sans ce `is distinct from`,
-- rouvrir le formulaire sans rien changer afficherait « déjà pris ».
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
  if public.identifiant_reserve(v_id) then
    return 'reserve';
  end if;
  if exists (
    select 1 from public.profils p
     where p.identifiant = v_id
       and p.user_id is distinct from auth.uid()
  ) then
    return 'pris';
  end if;
  return 'libre';
end;
$$;

revoke all on function public.etat_identifiant(text) from public, anon;
grant execute on function public.etat_identifiant(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Lecture publique
-- ---------------------------------------------------------------------------

-- Le profil vu de l'extérieur : ce que la page partagée a le droit de montrer,
-- et rien de plus. Ni `user_id`, ni adresse, ni identifiant Google.
--
-- Rend `null` quand l'identifiant n'existe pas **ou** que le profil est
-- masqué : les deux cas doivent être indistinguables, sinon l'absence de
-- réponse devient un oracle qui dit quels comptes existent.
--
-- `returns jsonb` plutôt qu'un `returns table` : dans une fonction SQL, les
-- colonnes de sortie sont des paramètres nommés et entrent en conflit avec les
-- colonnes du corps (`identifiant`, `nom`). L'objet JSON évite la
-- désambiguïsation et PostgREST le rend tel quel.
create or replace function public.profil_public(p_identifiant text)
  returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select jsonb_build_object(
    'identifiant', p.identifiant,
    'nom', p.nom,
    'cree_le', p.cree_le,
    'possedees', count(*) filter (where c.statut = 'possede'),
    'envies', count(*) filter (where c.statut = 'envie')
  )
  from public.profils p
  left join public.collections c on c.user_id = p.user_id
  where p.identifiant = lower(btrim(coalesce(p_identifiant, '')))
    and p.visible
  group by p.identifiant, p.nom, p.cree_le;
$$;

revoke all on function public.profil_public(text) from public;
grant execute on function public.profil_public(text) to anon, authenticated;

-- Les éditions d'une liste publique, du geste le plus récent au plus ancien.
--
-- Rend des identifiants et non les lignes d'édition : le catalogue est déjà
-- lisible en anon, donc le front les recharge par le chemin ordinaire
-- (`getEditionsByIds`), et cette fonction n'a pas à savoir ce qu'une carte
-- affiche. Le jour où une colonne s'ajoute à `editions`, elle ne bouge pas.
--
-- Le tri porte sur deux colonnes : sans ordre total, `offset` s'applique à un
-- ensemble non ordonné et PostgREST répète et saute des lignes (§9).
--
-- Le plafond de 500 est celui de `getEditionsByIds` côté front, qui découpe
-- ses lectures par tranches de 500.
create or replace function public.editions_du_profil(
  p_identifiant text,
  p_statut text,
  p_debut integer default 0,
  p_limite integer default 500
)
  returns setof bigint
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select c.edition_id
  from public.profils p
  join public.collections c on c.user_id = p.user_id
  where p.identifiant = lower(btrim(coalesce(p_identifiant, '')))
    and p.visible
    -- Toute autre valeur ne correspond à rien et rend une liste vide, ce qui
    -- est le bon comportement : la fonction n'a pas à valider une saisie
    -- qu'elle n'utilise que comme filtre.
    and c.statut = p_statut
  order by c.cree_le desc, c.edition_id desc
  offset greatest(coalesce(p_debut, 0), 0)
  limit least(greatest(coalesce(p_limite, 500), 0), 500);
$$;

revoke all on function public.editions_du_profil(text, text, integer, integer) from public;
grant execute on function public.editions_du_profil(text, text, integer, integer)
  to anon, authenticated;
