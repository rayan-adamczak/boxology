-- Offres marchandes, 3 août 2026.
--
-- Premier programme d'affiliation accepté (E.Leclerc, Awin, 3 août 2026), donc
-- première fois que le site porte un prix qui est une *offre* et non un prix
-- conseillé.
--
-- **Table séparée, et surtout pas une colonne de plus sur `editions`.**
-- `editions.prix_editeur` est un prix conseillé, figé à la sortie du disque, et
-- `src/app/lib/prix.ts` documente déjà qu'il n'est même pas dans la même
-- monnaie selon la source. Une offre est datée, change tous les jours, et il y
-- en aura plusieurs par édition le jour où un deuxième programme est accepté.
-- Les mêler donnerait une colonne dont on ne saurait plus dire ce qu'elle
-- mesure.
--
-- **`releve_le` n'est pas décoratif.** Un prix affiché est une information
-- commerciale : il doit pouvoir se dater à l'écran, et une passe qui ne tourne
-- plus doit se voir plutôt que de servir indéfiniment le prix de la semaine
-- dernière.
--
-- **`url` est le lien de tracking, jamais l'URL marchande nue.** Sans lui la
-- visite n'est pas attribuée, donc la commission n'existe pas. C'est la seule
-- colonne dont une valeur fausse est silencieuse : le lien marche, il ne
-- rapporte simplement rien.
--
-- Rejouable sans effet de bord.

create table if not exists public.offres (
  id           bigint generated always as identity primary key,
  edition_id   bigint not null references public.editions (id) on delete cascade,
  marchand     text   not null,
  -- Référence produit chez le marchand. Avec `marchand`, c'est ce qui rend
  -- l'écriture idempotente : l'EAN ne suffirait pas, deux marchands vendant le
  -- même disque portent le même code-barres.
  reference    text   not null,
  ean          text,
  prix         numeric(10, 2),
  devise       text   not null default 'EUR',
  disponible   boolean,
  url          text   not null,
  image_url    text,
  releve_le    timestamptz not null default now(),
  unique (edition_id, marchand, reference)
);

-- La fiche film lit les offres par édition, c'est le seul accès du site.
create index if not exists offres_edition_idx on public.offres (edition_id);
-- Sert aux passes d'écriture, qui rapprochent le flux de l'existant par code.
create index if not exists offres_ean_idx on public.offres (ean) where ean is not null;

alter table public.offres enable row level security;

-- Lecture publique : une offre n'a de sens qu'affichée, et la consultation du
-- site est sans compte (cf. §8).
drop policy if exists "offres lisibles par tous" on public.offres;
create policy "offres lisibles par tous"
  on public.offres for select
  to anon, authenticated
  using (true);

-- **Révoquer avant de compter sur la RLS.** Supabase donne par défaut
-- `insert, update, delete, truncate` à `anon` sur tout `public`, et seule
-- l'absence de policy retenait la clé publique du bundle : une barrière unique,
-- qui tombe avec un `disable row level security` posé le temps d'une migration.
-- `collections` puis `20260802_revoquer_ecriture_anon.sql` ont établi la bonne
-- façon de faire, un refus qui se lit comme un refus.
revoke insert, update, delete, truncate on public.offres from anon, authenticated;
grant select on public.offres to anon, authenticated;
