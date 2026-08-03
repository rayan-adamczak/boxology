-- Le signalement d'un profil demande désormais un compte.
--
-- Appliquée le 3 août 2026 par le serveur MCP Supabase. Idempotent.
--
-- ---------------------------------------------------------------------------
-- Ce qui change, et ce qui ne change pas
-- ---------------------------------------------------------------------------
--
-- La version du matin acceptait un signalement anonyme, au motif qu'on tombe
-- sur un profil par un lien partagé et qu'exiger une inscription reviendrait à
-- ne pas vouloir le savoir. L'argument inverse l'emporte : sans compte, il n'y
-- a **rien à dédoublonner**, donc un seul plafond de flot pour toute défense,
-- et un signalement qui n'engage personne se prête au harcèlement d'un profil
-- par répétition. Avec un compte, la règle « un signalement par personne et par
-- profil » redevient exécutoire.
--
-- **La colonne `auteur_user_id` reste nullable**, et ce n'est pas une
-- négligence. Elle porte `on delete set null` : si quelqu'un signale puis
-- efface son compte, la ligne survit sans auteur, et c'est ce qu'on veut, le
-- signalement porte sur le profil visé, pas sur celui qui l'a remonté. La
-- rendre `not null` obligerait à passer la cascade en `delete`, donc à perdre
-- ces signalements. L'obligation vit donc dans la fonction, à l'écriture, là où
-- elle a un sens, et pas dans le type de la colonne.
--
-- L'index unique reste partiel pour la même raison : deux lignes devenues
-- orphelines sur un même profil ne doivent pas se heurter. Rappel du §9,
-- `on conflict` ignore les index partiels, la fonction teste donc l'existence
-- explicitement.

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
  -- Première barrière **applicative**. La vraie est le privilège, révoqué à
  -- `anon` juste en dessous : un appel sans session est refusé en 401 avant
  -- d'arriver ici. Ce garde-fou couvre le jour où un `grant` serait rendu par
  -- mégarde, comme celui de `supprimer_mon_compte`.
  if v_auteur is null then
    return 'connexion';
  end if;

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
  if v_auteur = v_cible then
    return 'soi';
  end if;

  if exists (
    select 1 from public.signalements s
    where s.cible_user_id = v_cible and s.auteur_user_id = v_auteur
  ) then
    return 'deja';
  end if;

  -- Le plafond reste, alors que « un par compte » borne déjà le flot. Il ne
  -- vise plus le même abus : il tient contre la création de comptes en série,
  -- que l'inscription Google rend coûteuse mais pas impossible.
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

-- La barrière qui compte : le refus arrive avant la fonction, donc il se lit
-- comme un 401 et non comme une réponse applicative (§3).
revoke all on function public.signaler_profil(text, text, text) from public, anon;
grant execute on function public.signaler_profil(text, text, text) to authenticated;
