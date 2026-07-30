-- Retire la table `statuts`, vestige du prototype mono-utilisateur.
--
-- À exécuter dans l'éditeur SQL Supabase (aucune CLI n'est configurée sur ce
-- dépôt).
--
-- Elle n'avait pas de colonne `user_id` : elle datait d'avant les comptes et ne
-- pouvait rattacher un statut à personne. Depuis juillet 2026, les collections
-- vivent dans `public.collections`, avec pour clé primaire (user_id,
-- edition_id) et RLS par compte — cf. 20260730_collections.sql.
--
-- Vérifié avant suppression : aucune référence dans le code applicatif ni dans
-- les scripts d'import, et deux lignes de test datées du 26 juillet 2026
-- (éditions 33934 et 7611). Rien à conserver.
--
-- La laisser en place coûtait plus que de l'espace : une table nommée `statuts`
-- à côté de `collections` invite à se tromper de cible.

drop table if exists public.statuts;
