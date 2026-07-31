-- Repli du slug sur le titre anglais quand le titre français n'en donne aucun.
--
-- `slug_titre` réduit tout ce qui n'est ni lettre ni chiffre à un tiret, puis
-- `nullif` renvoie NULL sur une chaîne vide. Un titre entièrement écrit dans une
-- autre écriture ne produit donc rien : « 憑物語 », « שלאגר », « స్పెషల్ ఆప్స్ »
-- n'ont pas une seule lettre latine à offrir. Ce n'est pas un défaut de la
-- fonction, c'est sa limite, et elle est correcte : mieux vaut pas de slug
-- qu'un slug vide.
--
-- 16 films étaient dans ce cas au 31 juillet 2026, tous en japonais, coréen,
-- chinois, télougou, tamoul, hébreu, arabe ou hindi. Leur fiche restait
-- accessible par l'adresse nue `/films/<id>`, mais sans le segment lisible qui
-- fait tout l'intérêt de la forme canonique.
--
-- Le repli va chercher `titres_alternatifs->>'en'`, déjà en base pour le
-- référencement. « 憑物語 » devient ainsi `tsukimonogatari-2014`, ce qui vaut
-- mieux qu'une translittération approximative faite ici, et mieux qu'un numéro.
--
-- Ce qui reste sans slug après ce repli, ce sont les films dont TMDB ne publie
-- aucun titre anglais. Ils gardent l'adresse nue, qui fonctionne : le slug est
-- décoratif, l'id fait autorité.
--
-- Rejouable sans effet de bord.

create or replace function public.films_poser_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := coalesce(
    public.slug_film(new.titre, new.annee::text),
    -- Le titre anglais est un repli, jamais un choix : un film au titre français
    -- lisible garde le sien, même si TMDB en connaît une traduction.
    public.slug_film(new.titres_alternatifs->>'en', new.annee::text)
  );
  return new;
end;
$$;

-- Recalcule les lignes concernées. L'écriture réveille le déclencheur, qui
-- applique la logique ci-dessus ; inutile de répéter le calcul ici.
update public.films set titre = titre where slug is null;
