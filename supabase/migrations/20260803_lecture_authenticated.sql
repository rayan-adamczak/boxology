-- Lecture du catalogue pour les comptes connectés.
--
-- Les trois tables publiques n'avaient qu'une policy `anon`. Une requête
-- portant un jeton de session arrive en rôle `authenticated`, aucune policy ne
-- la couvrait, et PostgREST rendait **200 avec zéro ligne** : le refus qui ne
-- ressemble pas à un refus, déjà consigné au §3.
--
-- Mesuré depuis le site le 3 août 2026, jeton en main :
--
--     editions       sous session  0 ligne    en anon  1 ligne
--     films          sous session  0 ligne
--     edition_films  sous session  0 ligne
--
-- Symptôme : le fil d'activité du tableau de bord affichait « Édition » et un
-- carré vide, et la valeur estimée restait à zéro, parce que l'embed
-- `collections -> editions` était filtré par la RLS.
--
-- Les privilèges de table, eux, étaient déjà bons : `authenticated` a `SELECT`
-- sur les trois, hérité du défaut Supabase et conservé par la migration
-- `20260802_revoquer_ecriture_anon.sql`, qui n'a retiré que l'écriture. Il ne
-- manquait donc que la policy.
--
-- **Lecture seule et rien de plus.** Aucune policy d'écriture n'est créée ici :
-- un compte connecté ne doit pas plus modifier le catalogue qu'un visiteur, et
-- les privilèges d'écriture restent révoqués, donc la barrière tomberait de
-- toute façon avant la RLS.
--
-- Idempotent, rejouable sans effet de bord.

drop policy if exists "authenticated lecture films" on public.films;
create policy "authenticated lecture films"
  on public.films for select
  to authenticated
  using (true);

drop policy if exists "authenticated lecture editions" on public.editions;
create policy "authenticated lecture editions"
  on public.editions for select
  to authenticated
  using (true);

drop policy if exists "authenticated lecture edition_films" on public.edition_films;
create policy "authenticated lecture edition_films"
  on public.edition_films for select
  to authenticated
  using (true);
