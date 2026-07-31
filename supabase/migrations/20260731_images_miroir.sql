-- Miroir des visuels sur Cloudflare R2 (31 juillet 2026).
--
-- Les 7 220 images du catalogue etaient en hotlink chez editioncollector :
-- une source unique, tierce, susceptible de couper sans preavis, et la seule
-- du site. Elles sont desormais servies par img.jaquette.app.
--
-- Ces deux colonnes gardent l'URL d'origine. La bascule reste donc reversible,
-- et un controle d'appariement reste possible sans repartir de zero.
--
-- Idempotent : rejouable sans effet de bord.

alter table public.editions
  add column if not exists image_url_source text,
  add column if not exists images_secondaires_source jsonb;

comment on column public.editions.image_url_source is
  'URL editioncollector d''origine, avant bascule vers img.jaquette.app le 31 juillet 2026.';

comment on column public.editions.images_secondaires_source is
  'Idem pour les visuels secondaires.';
