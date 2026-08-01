-- Collection numérotée d'éditeur, ajoutée le 1er août 2026.
--
-- Quatrième axe de regroupement, à côté de format, éditeur et genre (§7).
-- `editeur` dit qui presse le disque ; il ne dit pas dans quelle série
-- numérotée il rentre. Studiocanal édite « Make My Day! » et cent titres
-- hors collection.
--
-- La colonne s'appelle `collection_editeur` et non `collection` : la table
-- `collections` porte les listes utilisateur (envie / possède), et deux noms
-- proches sur deux notions sans rapport se lisent de travers.
--
-- Idempotent, rejouable sans effet de bord.

alter table public.editions
  add column if not exists collection_editeur text,
  add column if not exists numero_collection integer;

comment on column public.editions.collection_editeur is
  'Série numérotée de l''éditeur : Criterion, Ultra Collector, Make My Day!, Le Chat qui fume.';
comment on column public.editions.numero_collection is
  'Numéro imprimé sur le boîtier (spine Criterion, n° Ultra Collector). Null si la collection ne numérote pas.';

create index if not exists editions_collection_editeur_idx
  on public.editions (collection_editeur, numero_collection);
