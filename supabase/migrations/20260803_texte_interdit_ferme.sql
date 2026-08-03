-- Ferme `texte_interdit` aux comptes connectés.
--
-- Le §3 pose la règle : la liste des identifiants interdits vit dans une table
-- sans aucun privilège pour `anon` ni `authenticated`, et `texte_interdit` ne
-- rend qu'un booléen, parce que « publier la liste, ce serait publier le mode
-- d'emploi du contournement ».
--
-- Un booléen interrogeable à volonté publie la liste tout aussi sûrement, un
-- mot à la fois. La fonction était exposée en RPC à `authenticated`, et la
-- création de comptes Google est ouverte par conception :
--
--     POST /rest/v1/rpc/texte_interdit  {"p_texte": "..."}   -> true | false
--
-- De quoi retrouver les entrées, et surtout distinguer celles en `sous_chaine`
-- de celles en `exact`, c'est-à-dire savoir exactement quelle graphie passe.
-- Le refus opaque d'`etat_identifiant`, qui rend `reserve` sans dire pourquoi,
-- perdait tout son sens.
--
-- Rien dans le site n'appelle cette fonction : `grep -rn texte_interdit src/
-- functions/` rend zéro occurrence. Le front passe par `etat_identifiant`.

-- ---------------------------------------------------------------------------
-- Le déclencheur doit continuer à l'appeler
-- ---------------------------------------------------------------------------

-- `profils_normaliser` était `security invoker`, donc il s'exécutait sous le
-- rôle qui écrit, `authenticated`, et vérifiait ses privilèges de fonction.
-- Révoquer sans cette ligne casserait la création de profil pour tout le monde,
-- avec un « permission denied for function texte_interdit » au moment où
-- quelqu'un choisit son @. Mesuré avant d'écrire, l'insertion sous
-- `authenticated` traverse bien le déclencheur avant de buter sur la RLS.
--
-- Le corps ne fait que réécrire `new` et lever : il ne lit ni n'écrit aucune
-- table, donc l'élever au propriétaire n'ouvre rien. `search_path` est déjà à
-- vide et les appels sont qualifiés, la condition pour que ce soit sans risque.
alter function public.profils_normaliser() security definer;

-- ---------------------------------------------------------------------------
-- La fonction n'est plus une API
-- ---------------------------------------------------------------------------

revoke execute on function public.texte_interdit(text) from public, anon, authenticated;

-- `etat_identifiant` continue de l'appeler : elle est `security definer` et
-- appartient au même propriétaire, donc elle ne passe pas par ce privilège.
-- C'est elle, et elle seule, qui reste la porte publique, et elle ne rend qu'un
-- motif, jamais la cause exacte du refus.
