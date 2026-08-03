-- Signalement d'un profil, et énumération des profils pour le sitemap.
--
-- Appliquée le 3 août 2026 par le serveur MCP Supabase. Idempotent.
--
-- ---------------------------------------------------------------------------
-- Pourquoi un signalement, alors qu'il y a déjà une liste de mots
-- ---------------------------------------------------------------------------
--
-- `identifiants_interdits` attrape le cas courant, pas quelqu'un qui cherche :
-- une liste de mots est toujours en retard d'un contournement. Le signalement
-- est le seul mécanisme qui **apprenne** les mots qu'on n'a pas prévus, et il
-- couvre en plus ce qu'aucune liste ne peut voir, l'usurpation d'identité et
-- le nom affiché détourné.
--
-- ---------------------------------------------------------------------------
-- Une fonction, pas un privilège d'écriture
-- ---------------------------------------------------------------------------
--
-- Un visiteur sans compte doit pouvoir signaler : c'est par un lien partagé
-- qu'on tombe sur un profil, et exiger une inscription pour dire « ce
-- pseudonyme est une injure » reviendrait à ne pas vouloir le savoir.
--
-- Mais `anon` n'a **aucun privilège d'écriture** sur le schéma depuis le
-- 2 août 2026, et ce n'est pas négociable pour une fonctionnalité de confort.
-- L'écriture passe donc par une fonction `security definer` qui décide
-- elle-même de ce qu'elle insère : la barrière tombe avant la RLS, comme
-- partout ailleurs (§3).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.signalements (
  id bigint generated always as identity primary key,

  -- Le compte visé. Cascade : un compte supprimé emporte les signalements qui
  -- le concernent, il n'y a plus rien à modérer.
  cible_user_id uuid not null references auth.users (id) on delete cascade,

  -- Qui signale. Nul pour un visiteur sans compte, et `set null` plutôt que
  -- cascade si l'auteur s'efface : le signalement reste utile, c'est le profil
  -- visé qu'on modère, pas celui qui l'a remonté.
  auteur_user_id uuid references auth.users (id) on delete set null,

  motif text not null check (motif in ('injure', 'haine', 'usurpation', 'spam', 'autre')),

  -- Facultatif, borné. Un champ libre sans plafond est une invitation à y
  -- déverser ce qu'on prétend combattre.
  commentaire text check (commentaire is null or char_length(commentaire) <= 500),

  statut text not null default 'nouveau'
         check (statut in ('nouveau', 'traite', 'rejete')),

  cree_le timestamptz not null default now()
);

create index if not exists signalements_cible_idx
  on public.signalements (cible_user_id, statut);

-- Un compte ne signale un profil qu'une fois. Index **partiel**, les lignes
-- anonymes n'ayant pas d'auteur à dédoublonner.
--
-- Attention en le lisant : `on conflict` ignore les index partiels (§9). La
-- fonction ci-dessous teste donc l'existence explicitement, elle ne s'appuie
-- pas dessus pour trancher.
create unique index if not exists signalements_un_par_compte_idx
  on public.signalements (cible_user_id, auteur_user_id)
  where auteur_user_id is not null;

alter table public.signalements enable row level security;
-- Aucun privilège, aucune policy : la table n'est lisible que par le
-- propriétaire de la base. Un signalement nomme quelqu'un, il n'a rien à faire
-- dans une réponse d'API.
revoke all on table public.signalements from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Déposer un signalement
-- ---------------------------------------------------------------------------

-- Rend un motif plutôt qu'un booléen, pour que l'écran sache quoi dire :
--
--     enregistre   pris en compte
--     deja         ce compte a déjà signalé ce profil
--     soi          on ne se signale pas soi-même
--     inconnu      identifiant inexistant ou profil masqué
--     trop         plafond atteint sur ce profil
--
-- **`inconnu` ne distingue pas l'inexistant du masqué**, comme partout
-- ailleurs : les séparer ferait de l'adresse un oracle disant quels comptes
-- existent.
create or replace function public.signaler_profil(
  p_identifiant text,
  p_motif text,
  p_commentaire text default null
)
  returns text
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_cible uuid;
  v_auteur uuid := auth.uid();
  v_commentaire text := nullif(btrim(coalesce(p_commentaire, '')), '');
begin
  if p_motif not in ('injure', 'haine', 'usurpation', 'spam', 'autre') then
    raise exception 'motif inconnu' using errcode = '23514';
  end if;

  select p.user_id into v_cible
  from public.profils p
  where p.identifiant = lower(btrim(coalesce(p_identifiant, '')))
    and p.visible;

  if v_cible is null then
    return 'inconnu';
  end if;
  if v_auteur is not null and v_auteur = v_cible then
    return 'soi';
  end if;

  if v_auteur is not null and exists (
    select 1 from public.signalements s
    where s.cible_user_id = v_cible and s.auteur_user_id = v_auteur
  ) then
    return 'deja';
  end if;

  -- Plafond de flot. Sans compte, il n'y a rien à dédoublonner : n'importe qui
  -- peut rappeler la fonction. Cinquante signalements non traités sur un même
  -- profil, c'est déjà bien au-delà de ce qu'il faut pour aller regarder ;
  -- au-delà on n'apprend plus rien et on remplit une table.
  if (
    select count(*) from public.signalements s
    where s.cible_user_id = v_cible and s.statut = 'nouveau'
  ) >= 50 then
    return 'trop';
  end if;

  insert into public.signalements (cible_user_id, auteur_user_id, motif, commentaire)
  values (v_cible, v_auteur, p_motif, left(v_commentaire, 500));

  return 'enregistre';
end;
$$;

revoke all on function public.signaler_profil(text, text, text) from public;
grant execute on function public.signaler_profil(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Les profils à annoncer au sitemap
-- ---------------------------------------------------------------------------

-- Les profils visibles **et non vides**.
--
-- La condition d'existence n'est pas une coquetterie : un profil sans une
-- seule édition est une page qui ne porte qu'un nom, c'est-à-dire le contenu
-- mince que le §7 a refusé aux pages éditions. Il reste indexable si un lien y
-- mène, on ne le déclare simplement pas soi-même. Même règle que les films,
-- dont seuls ceux rattachés à une édition entrent au sitemap.
create or replace function public.profils_au_sitemap()
  returns setof text
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select p.identifiant
  from public.profils p
  where p.visible
    and exists (select 1 from public.collections c where c.user_id = p.user_id)
  order by p.identifiant;
$$;

revoke all on function public.profils_au_sitemap() from public;
grant execute on function public.profils_au_sitemap() to anon, authenticated;
