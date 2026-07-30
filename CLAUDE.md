# Jaquette — contexte projet

Catalogue des éditions physiques de films (Blu-ray, 4K, steelbooks, coffrets)
pour le marché français. Anciennement *Boxology*, renommé en juillet 2026.

---

## 1. Identité

| | |
|---|---|
| Nom | **Jaquette**. Le mot-symbole affiche `jaquette.app` en minuscules depuis juillet 2026 — décision assumée, l'adresse *est* la marque à l'écran |
| Domaine | `jaquette.app` — **en ligne**, apex et `www` |
| Dépôt | `github.com/rayan-adamczak/jaquette` (public) |
| Éditeur | Rayan Adamczak, designer, à titre non professionnel |
| Contact | rayan.adamczak@gmail.com |
| Compte Awin | `Boxology` (3006883) — 4 candidatures en attente |

**Ambition** : devenir commercial via liens d'affiliation. Aujourd'hui purement
informatif, aucun partenariat actif.

---

## 2. Stack

| Couche | Choix |
|---|---|
| Front | React 18 + Vite 6 + Tailwind 4 + react-router 7 |
| Données | Supabase (projet `rndyusuyfkrojpazjsll`) |
| Hébergement | **Cloudflare Pages**, projet `jaquette`, déploiement sur `main` |
| Images films | TMDB (attribution obligatoire, présente en pied de page) |

### Hébergement

GitHub Pages a été **supprimé** en juillet 2026 : il renvoyait 404 sur les
liens profonds, ce qui interdisait toute indexation, et publiait un doublon du
site. Le workflow et le site GitHub Pages sont retirés.

Cloudflare Pages sert `public/_redirects` (`/* /index.html 200`), donc
`/films/560` répond **200**. `vite.config.ts` garde une branche
`DEPLOY_TARGET=github` désormais morte — sous-chemin `/jaquette/` et copie
`404.html`. À supprimer un jour.

`public/_headers` marque `/assets/*` en `immutable` : Cloudflare revalidait à
chaque visite (`cf-cache-status: REVALIDATED` au lieu de `HIT`), soit un
aller-retour avant le premier octet. `index.html` reste volontairement hors de
la règle, sinon un déploiement ne serait pas vu des visiteurs déjà venus.

DNS géré par Cloudflare, domaine acheté chez Spaceship (nameservers
`anna`/`lloyd.ns.cloudflare.com`). Un enregistrement `TXT` valide la propriété
Google Search Console — **ne pas le supprimer**, la validation tomberait.

### Poids du bundle

Deux réductions successives, mesurées en production :

| | brut | compressé |
|---|---|---|
| départ | 580,9 Ko | 158,4 Ko |
| pages en `lazy()` | 494,8 Ko | 142,0 Ko |
| PostgREST au lieu de supabase-js | 294,6 Ko | 90,6 Ko |

`createClient` de `@supabase/supabase-js` instancie auth, realtime et storage
même inutilisés, et le build ne peut pas les éliminer : 180 Ko bruts. Le site
parle donc directement à `@supabase/postgrest-js`. L'API de requête est
identique, seul `lib/supabase.ts` change.

TTFB passé de 1 313 ms à ~210 ms, page prête de 2 621 ms à ~400 ms.

### Secrets

Dans `~/.config/boxology.env` (hors dépôt, à renommer un jour) :
`TMDB_READ_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

Chargement : `set -a; . ~/.config/boxology.env; set +a`

⚠️ `jaquette-scraping/import_supabase.py` et `export_transcript.py` contiennent
encore la clé `service_role` **en clair**. Le dossier n'est pas un dépôt git,
donc rien n'a fuité, mais cette clé contourne toute la RLS. À déplacer.

---

## 3. Modèle de données

### `films` — 2 354 lignes
`id` (identity), `tmdb_id` (unique), `titre`, `titre_original`, `annee`,
`duree`, `realisateur`, `scenariste`, `synopsis`, `note` (**/10**),
`nb_votes`, `affiche_url`, `backdrop_url`, `imdb_id`, `tagline`,
`genres` (text[]), `cast_principal` (jsonb), **`type`** (`film|serie|coffret`).

### `editions` — 5 739 lignes
`id` (identity **ajoutée en juillet 2026** — elle manquait, toute insertion
applicative échouait), `titre`, `ean`, `date_sortie`, `pays`, `region`,
`formats_extraits` (text[]), `url_source`, `contenu_brut`, `image_url`,
`images_secondaires`, `slug`, `type`, `prix_editeur`, `univers`, `supports`,
`langues`, `nb_commentaires`, `nb_wishlist`, `prix_fnac_extrait`,
`film_id` (film principal), **`source`**, **`source_id`**.

`source` vaut `editioncollector.fr` (3 193) ou `bluray.com` (2 546).

**Convention d'identifiant, changée en juillet 2026.** Les 3 180 premières
lignes editioncollector portent l'id de la fiche source. Ce n'est plus
possible : les ids 33994 à 36539 ont été attribués aux fiches blu-ray.com par
la séquence, et un id de fiche récente tomberait dedans. Les nouvelles lignes
laissent la séquence décider et rangent l'id source dans `source_id`.

### `edition_films` — 4 187 liens
Relation plusieurs-à-plusieurs : un coffret appartient à chacun de ses films.
`edition_id`, `film_id`, `source`.

Répartition : `film_id` 2 656, `bluray_tmdb` 1 037, `corrige_manuel` 227,
`collection_tmdb` 199, `corrige_annee` 68.

**L'app lit les éditions via cette table**, pas via `editions.film_id`
(cf. `getEditionsForFilm` dans `src/app/lib/reelio-db.ts`).

### `collections` — appliquée le 30 juillet 2026, vide
Listes utilisateur : `user_id`, `edition_id` (bigint), `statut`
(`envie|possede`), `cree_le`. Clé primaire composite `(user_id, edition_id)`
plutôt qu'un `id` identity, pour que `on conflict (user_id, edition_id)`
s'appuie dessus sans index partiel. Index inverse sur `edition_id` pour les
décomptes par édition.

Cascade sur `auth.users` **et** sur `editions` : la disparition d'un compte
emporte ses listes, sans ligne orpheline à purger pour honorer un effacement.

Contient aussi la fonction `public.supprimer_mon_compte()`, `security definer`,
`set search_path = ''`, réservée à `authenticated` : elle supprime la ligne
`auth.users` de l'appelant, ce qu'une clé de navigateur ne peut pas faire.

`supabase/migrations/20260730_collections.sql` reste la source, et il est
idempotent — rejouable sans effet de bord.

**Comment l'appliquer.** Par l'éditeur SQL du tableau de bord, seule voie
disponible : pas de `psql`, pas de CLI Supabase, et aucun mot de passe de base
ni jeton `sbp_` sur la machine. La clé `service_role` ne suffit pas — PostgREST
n'exécute pas de SQL arbitraire, donc aucun DDL. Coller par le presse-papiers
(`pbcopy < fichier.sql`) et non taper : l'éditeur auto-indente et ferme les
parenthèses, ce qui abîme un bloc `$$ ... $$`. Le tableau de bord annonce
« destructive operations » pour les `drop policy if exists` que le script
recrée trois lignes plus bas.

### `bluray_import` — table de transit
3 100 fiches crawlées, avec statut : `promu` (2 546), `a_verifier` (464),
`doublon` (90). Invisible du site, aucune policy anon.

### Tables de sauvegarde
`editions_film_id_backup_20260728`, `editions_supprimees_20260728`.

### Sécurité
RLS activé partout. Policies `anon` en **lecture seule** sur `films`,
`editions`, `edition_films`. `bluray_import`, `kv_store_38e4ee68` et les tables
de sauvegarde renvoient `[]` en anon. `collections` est plus fermée encore :
`revoke all` sur le rôle `anon`, donc **401** et non tableau vide.

La table `statuts` a été supprimée le 30 juillet 2026 (vestige mono-utilisateur
sans `user_id`, deux lignes de test, aucune référence) —
cf. `supabase/migrations/20260730_drop_statuts.sql`.

Attention en vérifiant : PostgREST répond **200 avec un tableau vide** quand une
policy bloque un SELECT, pas 401. Un 200 ne prouve rien.

`collections` échappe à ce piège, et c'est délibéré : plutôt qu'une policy
`anon` restrictive, la migration **révoque les privilèges de table** à `anon`.
La barrière tombe donc avant la RLS et se voit. Vérifié le 30 juillet 2026 :

    anon GET /collections  ->  401, 42501 permission denied for table collections

Un vrai refus, pas un tableau vide. Comme `revoke all` porte sur tous les
privilèges, une écriture bute sur la même barrière — mais seul le SELECT a été
réellement exercé.

La clé `anon` du bundle est publique par nature — ce n'est pas une fuite.
Vérifié : aucune `service_role` dans `dist/` ni dans l'historique git.

**Toujours non vérifié** : le refus d'écriture anon sur `films`, `editions` et
`edition_films`, protégées par des policies et non par un `revoke`. Un `PATCH`
sur un filtre vide renvoie 204 que la policy accepte ou refuse ; seul un
`INSERT` réel tranche. Le 42501 obtenu sur `collections` ne dit rien de ces
trois tables : ce n'est pas le même mécanisme.

**Non vérifié aussi** : `supprimer_mon_compte()`. Elle est exposée dans
l'OpenAPI et le DDL est passé, mais l'appeler pour confirmer son garde-fou
`auth.uid() is null` supposerait de risquer l'effacement d'un compte réel si le
jeton employé portait une revendication `sub`. Pas de test destructif pour
valider un garde-fou.

---

## 4. État du catalogue

| | |
|---|---|
| Films | 2 354 (2 032 films, 320 séries, 2 coffrets) |
| Éditions | 5 739 |
| Codes-barres | 3 428 |
| Éditions sans film | 1 685 |

---

## 5. Sources de données

### editioncollector.fr — 3 193 éditions
Source d'origine. **Seule à fournir des visuels** (`image_url` pointant vers
leur S3 — hotlink, donc fragile : ils peuvent couper à tout moment).

Leur `robots.txt` ne contient aucune règle `User-agent: *`, seulement deux
entrées SiteAuditBot. Rien n'interdit un crawl poli.

**Mise à jour incrémentale** : énumérer `/collectors?univers=films-series`
(89 pages, ~3 200 fiches), comparer aux `url_source` déjà en base. En juillet
2026 : 29 URL nouvelles, dont 10 liens de navigation et 6 produits dérivés,
soit 13 éditions réelles.

Ne pas se fier au sitemap : il annonçait 1 201 nouveautés, mais mêle figurines,
jeux et livres, et ne couvre que 1 477 URL sur 3 193.

### blu-ray.com — 2 546 éditions
Crawlé en juillet 2026. **Accès désormais bloqué (HTTP 403)** sur le
User-Agent du robot ; 3 100 fiches sur 5 486 récupérées avant blocage.

Méthode : cookie pays via `setcountry.php?country=fr`, puis pagination de
`movies.php`. Le sitemap seul ne donne pas le pays.

Apporte : EAN (72 %), date de sortie, zone, formats, **piste audio française
(77 %)**, packaging. **Pas de visuels** — copyright.

Ne pas contourner le blocage (proxy, VPN, changement d'UA, session du compte).
Le compte créé sur le site implique l'acceptation de leurs conditions.

### TMDB
Métadonnées films et séries. Rattachement par titre **et année**.

---

## 6. Scripts — `~/Documents/jaquette-scraping/`

### Import blu-ray.com (2026-07)

| Fichier | Rôle |
|---|---|
| `enum_fr.py` | Énumère le catalogue FR via les listings |
| `crawl_fr.py` | Crawl reprenable, verrou `flock`, tranches d'1 h |
| `parseur.py` | Extraction des fiches (séparé exprès du crawl) |
| `import_1_charger.py` | JSONL → `bluray_import` |
| `import_2_resoudre.py` | Résolution TMDB, **lecture seule** |
| `import_3_ecrire.py` | Création films + éditions + liens |
| `import_4_titres.py` | Nettoyage des titres (`--apply` pour écrire) |

### Mise à jour editioncollector (2026-07-30)

| Fichier | Rôle |
|---|---|
| `enum_ec.py` | Énumère le listing, sort le delta vs base |
| `tri_ec.py` | Sépare éditions disque et produits dérivés |
| `resoudre_ec.py` | Résolution TMDB, **lecture seule** |
| `ecrire_ec.py` | Écriture (`--apply`), décisions manuelles en dur |

### Rattachement des éditions orphelines (2026-07-30)

| Fichier | Rôle |
|---|---|
| `resoudre_orphelines3.py` | Appariement TMDB, deux niveaux de confiance |
| `controle_surs.py` | Six règles anti-faux-positifs sur le niveau « sûr » |
| `ecrire_orphelines.py` | Écriture (`--apply`), trois garde-fous |

Résultat : 1 893 → 1 685 orphelines, 208 rattachées, 118 films créés.

`crawl/pages/` — 3 100 pages gzippées (170 Mo). Permettent de rejouer un
parsing sans réseau. **Ne pas supprimer** tant que l'import n'est pas figé.

---

## 7. SEO

Chantier ouvert jusqu'en juillet 2026, désormais en place.

- **`src/app/lib/seo.ts`** — hook `useSeo`, pose titre, description, canonical
  et `og:` par page. Le canonical est **calculé depuis l'URL courante**, jamais
  passé en paramètre : une faute dans une page l'enverrait ailleurs.
- **`index.html` ne porte ni canonical ni `og:url`.** Une valeur en dur y
  ferait passer les 2 354 fiches pour des doublons de la racine. En l'absence
  de canonical, un crawler retient l'URL demandée — le bon repli.
- **`sitemap.xml`** généré au build par `scripts/generer-sitemap.mjs` depuis la
  base. 2 105 URL. Seuls les films rattachés à une édition y figurent. Le
  script casse le build s'il ne trouve aucun film.
- **Search Console** — propriété Domaine validée, sitemap soumis et lu.
- **Listes personnelles et écrans du prototype** en `noindex, follow`.

**Limite connue** : les scrapers de Facebook, iMessage et Discord n'exécutent
pas le JavaScript. Ils voient donc les `og:` génériques d'`index.html`, pas
ceux de la fiche. Le correctif serait une Pages Function injectant les balises
côté serveur — écartée pour l'instant.

---

## 8. Chantiers ouverts

### Décisions en attente sur les orphelines
Fichiers produits par `resoudre_orphelines3.py`, à trancher :

- **~330 coffrets multi-films** — plusieurs liens chacun
- **~158 homonymes** — la popularité ne départage pas
- **~227 à relire** — appariements par préfixe ou popularité
- **~914 sans correspondance** — le vrai gisement, non décomposé

### Fonctionnel
- **Authentification** — écrite et la table est en place, mais **non
  déployée** : le tout vit sur la branche `compte-google`, non poussée et non
  fusionnée dans `main`. Google uniquement, `auth-js` chargé à la demande.
  `/compte` porte la suppression du compte, `TopBar` y mène.
  La base est donc en avance sur le site en ligne, sans effet visible : le
  bundle déployé ne connaît pas `collections`. Sans compte, les listes restent
  en `localStorage` sous `jaquette_statuts`, ce qui reste le cas de tous les
  visiteurs jusqu'à la fusion.
  **Jamais exercé de bout en bout** : la connexion Google et la reprise des
  statuts `localStorage` vers `collections` à la première connexion n'ont pas
  été essayées.
- **Vestiges du prototype dans `BottomTabBar`** — libellés anglais (« Home »,
  « Collection », « Wishlist », « Profile ») et un onglet menant au faux profil
  `/u/:handle`. `TopBar` a été nettoyé, celui-ci pas.
- **Rapatrier les images** hébergées chez editioncollector
- **Supprimer la branche `DEPLOY_TARGET=github`** de `vite.config.ts`
- **Une quinzaine d'opéras** à écarter du catalogue. **Ne pas filtrer par
  mot-clé** : « Opération Dragon », « Opération Tonnerre » et « Nosferatu, une
  symphonie de l'horreur » sont des films. Les concerts, eux, sont gardés — TMDB
  les référence.

### Awin
4 programmes en attente : Fnac, E.Leclerc, Cultura, Zavvi — **tous avec flux
produits** (EAN + images + prix). Aucun accepté. Create-a-Feed inutilisable
tant qu'aucun n'a validé (« Feed not found »).

---

## 9. Pièges rencontrés

Documentés parce qu'ils se reproduiront.

### Parsing
- **Les titres blu-ray.com** suivent `Titre 4K Blu-ray (X) (France)` où `X`
  est **soit** le titre français, **soit** un qualificatif d'édition. Trancher
  sur un vocabulaire (steelbook, collector, digipack…), sinon on obtient
  `SteelBook → Titanic`.
- **19,7 % des titres d'édition portent l'année** entre parenthèses. La jeter
  fait perdre la désambiguïsation : `Dune (1985)` rattaché à Dune 2021.
  111 rattachements faux corrigés grâce à elle.
- **L'année n'est pas toujours seule dans sa parenthèse** : `(Mondwest 1974)`.
  Une regex `\((\d{4})\)` la manque et rattache le film de 1974 à la série.
- **Séparateurs** : les titres mélangent `-` et `–` (cadratin). Ne découper
  que sur l'un fausse tout.
- **Accents en majuscules** : `translate()` s'applique avant `lower()`.
- **Le champ `universes` d'editioncollector vaut « Films/Séries » pour tout**,
  y compris une figurine Amiibo et No Man's Sky. Inexploitable. `supports`
  (Blu-ray, 4K) est fiable quand il est renseigné, mais vide sur des disques
  réels : croiser avec un vocabulaire de formats relevé dans le titre.

### Appariement TMDB
- Exiger le **titre exact**. Un repli « année seule » donne
  `Ça (1990) → Living To Die`.
- Sur homonymes, la popularité départage mal quand elle est sous 1.
- **Ne pas supprimer les indices avant de chercher.** Une regex de « bruit »
  effaçait « Coffret 8 films » — précisément la preuve qu'il s'agit d'un
  coffret. Résultat : `Clint Eastwood - Coffret 8 films → « Clint Eastwood »`,
  un documentaire homonyme.
- **Un coffret dont le titre est un nom propre** tombe sur une fiche TMDB
  homonyme et confidentielle : Jean Vigo 0.1, Marcel Pagnol 0.2, Bruce Lee 0.4.
  Les rattachements corrects du même lot sont tous au-dessus de 1,3.
- **« Intégrale » n'a pas le même sens selon le type.** Sur une série, elle
  désigne l'œuvre entière — c'est juste. Sur un film, elle désigne la saga :
  `John Wick - L'intégrale` rattaché au seul premier épisode est faux.
- **Une saison annoncée dans le titre exclut un film.**
- **Le segment après deux-points ne peut pas chercher seul.** Il a donné
  `Star Trek 3 : Sans Limites → « Sans limites » (2022)`, une série sans
  rapport. À garder en second niveau, jamais en écriture directe.
- **Séparer les résultats en deux niveaux** — écriture directe et relecture — a
  attrapé 100 % des faux positifs connus. Sans ce tri, le taux d'erreur du lot
  « résolu » était de 20 %.

### Infrastructure
- **PostgREST plafonne à 1 000 lignes.** Paginer, toujours. Le piège s'est
  reproduit : un `limit=1893` a silencieusement traité 1 000 lignes.
- **`ON CONFLICT` ignore les index partiels.**
- **`editions.id` n'avait pas d'identity** — insertion impossible.
- **`noindex, nofollow`** traînait dans `index.html` depuis Figma Make.
- **La réécriture SPA masque les fichiers manquants.** `/* /index.html 200`
  fait répondre **200** à `/sitemap.xml` même absent : on reçoit du HTML avec
  un code de succès. Vérifier le contenu, pas le statut.
- **`_headers` estampille selon l'URL, pas selon ce qui est servi.** La règle
  `/assets/*` en `max-age=31536000, immutable` s'applique donc aussi à la
  réécriture SPA. Demander l'URL d'un asset avant qu'il soit servi met
  `index.html` en cache **pour un an** sous ce nom : le site ne démarre plus,
  un navigateur refusant d'exécuter un module en `text/html`, et le cache ne se
  répare pas de lui-même. Arrivé le 30 juillet 2026 juste après la mise en
  production de l'authentification, déclenché par une requête de vérification.
  Ne jamais valider un déploiement en interrogeant une URL d'asset — charger la
  page, qui demande ses assets au même déploiement. Signature : la même URL
  renvoie `text/html` sans paramètre et `application/javascript` avec `?x=1`,
  ce qui prouve que le fichier existe et que seul le cache est en cause.
  Correctif : purge du cache Cloudflare.
- **Basculer les nameservers casse DNSSEC.** Un enregistrement `DS` au registre
  signe la zone de l'ancien hébergeur ; si le nouveau répond à sa place, la
  validation échoue et le domaine devient injoignable — SERVFAIL, pas lent.
  Spaceship l'a retiré de lui-même, mais c'est à vérifier avant, pas après.
- **Cloudflare fusionne `robots.txt`**, il ne l'écrase pas : son bloc managed
  passe en premier, le fichier du dépôt suit.
- **Le résolveur DNS local garde en cache les échecs.** Après la bascule,
  `curl` répondait `Could not resolve host` alors que le site fonctionnait.
  Tester avec `--resolve` avant de conclure à une panne.
- Deux crawlers lancés en parallèle produisent des doublons exacts. Un test
  d'existence de fichier ne suffit pas : `flock`.

### Méthode
Ce qui a évité le plus d'erreurs :
1. **Séparer résolution et écriture.** Chaque passe en lecture seule a révélé
   un bug avant qu'il n'atteigne la base.
2. **Conserver les pages brutes.** Trois corrections de parseur rejouées sans
   une requête réseau.
3. **Vérifier qu'un scan qui renvoie « rien » fonctionne.** Un scan cassé
   ressemble à un scan négatif.
4. **Relire un échantillon avant d'écrire.** Chaque passe de relecture a
   révélé une famille de faux positifs que la précédente ne voyait pas.

---

## 10. Juridique

- Mentions légales, confidentialité et à propos en ligne
- Éditeur non professionnel (LCEN art. 6) — **à compléter dès que le site
  devient commercial**
- Attribution TMDB en pied de page (exigée par leur licence)
- Aucune image reprise de blu-ray.com
- **Clause « Base de données »** dans les mentions légales : articles L. 341-1
  et suivants du code de la propriété intellectuelle, interdiction d'extraction
  substantielle et d'extraction répétée de parties non substantielles, réserve
  explicite pour la consultation, l'usage privé et la citation avec lien.
  La clause ne crée pas le droit : c'est l'investissement de constitution qui
  le fonde, et il se documente.
- Le `Content-Signal: ai-train=no` posé par Cloudflare dans `robots.txt` vaut
  réservation de droits au titre de l'article 4 de la directive UE 2019/790.
- **Position asymétrique à connaître** : la base a été constituée par
  extraction chez editioncollector et blu-ray.com. Opposer la clause à un tiers
  exposerait à ce rappel.
- Données factuelles uniquement (EAN, dates, formats) — non protégeables
  individuellement, mais le droit *sui generis* protège l'extraction d'une
  partie substantielle d'une base
- Aucun tracker. Compte optionnel via Google uniquement.
- **`collections` existe depuis le 30 juillet 2026**, donc la phrase « aucune
  donnée personnelle serveur » ne tiendra plus dès la fusion de
  `compte-google` : un compte connecté fait vivre côté serveur son adresse et
  son identifiant Google dans `auth.users`, et la liste de ses éditions dans
  `collections`. Hébergement Supabase en Suède, dans l'Union — c'est ce
  qu'annonce `/compte`. Aujourd'hui la branche n'est pas déployée, donc aucun
  compte n'existe encore en pratique.
- **Effacement (RGPD art. 17)** tenu par `public.supprimer_mon_compte()`,
  atteignable depuis `/compte`, lui-même lié depuis le menu du bandeau et
  depuis la politique de confidentialité — laquelle annonçait déjà la
  suppression « accessible dans les réglages du compte ». Confirmation en deux
  temps avec un mot à recopier, et en cas de refus du serveur on ne prétend pas
  avoir supprimé.
