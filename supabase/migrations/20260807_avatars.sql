-- Photo de profil : un objet dans un seau, une URL dans `profils`.
--
-- ---------------------------------------------------------------------------
-- Pourquoi Supabase Storage et pas R2
-- ---------------------------------------------------------------------------
--
-- Les 36 000 visuels du catalogue sont sur Cloudflare R2, servis par
-- `img.jaquette.app` (§2). Ce seau-là est écrit par des scripts Python qui
-- portent les clés `R2_*` ; **un navigateur ne peut pas y déposer**, il
-- faudrait qu'une Pages Function signe une URL, donc une liaison R2 sur le
-- projet Pages, donc un secret de plus et un chemin d'écriture de plus à
-- surveiller.
--
-- Le Storage de Supabase, lui, accepte le dépôt direct sous le **jeton de
-- session déjà en main**, et ses règles s'écrivent dans le même langage que
-- celles du reste du schéma. C'est la barrière du §3 appliquée aux fichiers :
-- une policy qui compare `auth.uid()` au premier dossier du chemin.
--
-- Le §2 relève par ailleurs que le seau R2 n'a aucun coût d'egress. Ici le
-- volume est sans commune mesure : une image de 512 px par compte.
--
-- Idempotent, rejouable sans effet de bord.

-- ---------------------------------------------------------------------------
-- La colonne
-- ---------------------------------------------------------------------------

alter table public.profils
  add column if not exists avatar_url text;

-- **L'URL est contrainte, et ce n'est pas décoratif.** Sans ce `check`, un
-- compte pourrait écrire n'importe quelle adresse dans sa propre ligne : la
-- page de profil ferait alors charger une image chez un tiers, qui relèverait
-- l'adresse IP de chaque visiteur. La CSP du site refuserait l'hôte (§3), donc
-- rien ne s'afficherait, mais compter sur elle serait faire d'un filet de
-- sécurité la seule serrure.
--
-- Le motif nomme le projet en toutes lettres. Il l'est déjà dans le bundle,
-- dans le middleware et dans la CSP : une variable de plus ne rendrait pas la
-- migration plus portable, elle rendrait la règle moins lisible.
alter table public.profils
  drop constraint if exists profils_avatar_url_forme;
alter table public.profils
  add constraint profils_avatar_url_forme check (
    avatar_url is null
    or avatar_url ~ '^https://rndyusuyfkrojpazjsll\.supabase\.co/storage/v1/object/public/avatars/[0-9a-f-]{36}/[a-z0-9]+\.webp$'
  );

-- ---------------------------------------------------------------------------
-- Le seau
-- ---------------------------------------------------------------------------

-- **Public en lecture.** Une page de profil se consulte sans compte, c'est ce
-- qui la rend partageable (§7) ; une photo servie par URL signée expirerait au
-- bout de quelques minutes et casserait les aperçus de lien.
--
-- Le plafond de taille et la liste de types sont posés **sur le seau** et non
-- seulement dans le navigateur : le contrôle côté client est une amabilité, il
-- se contourne avec un `curl` et le jeton de session. 2 Mio est large pour une
-- image de 512 px, et c'est voulu, le client réencode avant d'envoyer.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Qui peut écrire quoi
-- ---------------------------------------------------------------------------

-- Le chemin est `<user_id>/<jeton>.webp`, et **c'est le premier segment qui
-- porte toute la règle** : `storage.foldername(name)` le rend, on le compare à
-- `auth.uid()`. Personne ne peut donc déposer, remplacer ni effacer sous le
-- dossier d'un autre compte.
--
-- Le second segment est tiré au hasard à chaque dépôt plutôt que fixe. Un nom
-- constant obligerait à purger le cache de périphérie à chaque changement de
-- photo, et le §8 garde la trace de ce piège : une entrée déjà en cache garde
-- les en-têtes qu'elle avait à sa création, et l'ancienne image resterait
-- servie des heures. Une URL neuve n'a rien à purger.

drop policy if exists avatars_lecture_publique on storage.objects;
create policy avatars_lecture_publique on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists avatars_depot_proprietaire on storage.objects;
create policy avatars_depot_proprietaire on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- `using` filtre ce qu'on peut viser, `with check` ce qu'on peut écrire à la
-- place. Les deux sont nécessaires, sinon on renomme l'objet d'un autre.
drop policy if exists avatars_remplacement_proprietaire on storage.objects;
create policy avatars_remplacement_proprietaire on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_effacement_proprietaire on storage.objects;
create policy avatars_effacement_proprietaire on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Le compte disparaît, la photo avec
-- ---------------------------------------------------------------------------

-- `profils` est en cascade sur `auth.users`, donc la ligne part avec le compte.
-- Les objets du seau, eux, n'ont aucun lien de clé étrangère : sans ce
-- déclencheur, la photo de quelqu'un qui a effacé son compte resterait servie
-- publiquement. C'est une donnée personnelle, l'article 17 du RGPD ne connaît
-- pas la notion de fichier oublié dans un seau (§10).
--
-- `security definer` pour la même raison que `profils_consigner_identifiant` :
-- il écrit dans `storage.objects`, où le rôle qui efface son compte n'a de
-- droits que sur son propre dossier au moment où la policy s'évalue — et où il
-- n'en a plus du tout une fois la session close, cas de l'effacement par le
-- tableau de bord.
create or replace function public.profils_effacer_avatar()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  delete from storage.objects
   where bucket_id = 'avatars'
     and (storage.foldername(name))[1] = old.user_id::text;
  return old;
end;
$$;

drop trigger if exists profils_effacer_avatar_trg on public.profils;
create trigger profils_effacer_avatar_trg
  after delete on public.profils
  for each row execute function public.profils_effacer_avatar();

-- ---------------------------------------------------------------------------
-- Lecture publique
-- ---------------------------------------------------------------------------

-- Reprise de `20260803_profils.sql` avec une clé de plus. Recopiée en entier :
-- `create or replace` remplace le corps, donc une version tronquée effacerait
-- ce qu'elle ne répète pas.
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
    'avatar_url', p.avatar_url,
    'cree_le', p.cree_le,
    'possedees', count(*) filter (where c.statut = 'possede'),
    'envies', count(*) filter (where c.statut = 'envie')
  )
  from public.profils p
  left join public.collections c on c.user_id = p.user_id
  where p.identifiant = lower(btrim(coalesce(p_identifiant, '')))
    and p.visible
  group by p.identifiant, p.nom, p.avatar_url, p.cree_le;
$$;

revoke all on function public.profil_public(text) from public;
grant execute on function public.profil_public(text) to anon, authenticated;
