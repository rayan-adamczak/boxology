# Jaquette — contexte projet

Catalogue des éditions physiques de films (Blu-ray, 4K, steelbooks, coffrets)
pour le marché français. Anciennement *Boxology*, renommé en juillet 2026.

---

## 1. Identité

| | |
|---|---|
| Nom | **jaquette.app**, en minuscules, extension comprise. Depuis juillet 2026 : « jaquette » seul est un nom commun, le `.app` est ce qui démarque. Vaut partout — mot-symbole, `<title>`, `og:site_name` |
| Domaine | `jaquette.app` — **en ligne**, apex et `www` |
| Dépôt | `github.com/rayan-adamczak/jaquette` (public) |
| Éditeur | Rayan Adamczak, designer, à titre non professionnel |
| Contact | `contact@jaquette.app` — Cloudflare Email Routing, redirige vers rayan.adamczak@gmail.com. Réception seulement, pas d'envoi |
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

### Courrier

`contact@jaquette.app` posé le 30 juillet 2026 par **Cloudflare Email Routing**,
gratuit. Une règle redirige `contact@` vers `rayan.adamczak@gmail.com`, et le
**catch-all est actif** vers la même boîte : toute adresse du domaine arrive,
`bonjour@` comme `xyz@`. Aucune faute de frappe n'est perdue, mais rien ne
filtre non plus — si le spam monte, repasser le catch-all en « Supprimer » et
n'ouvrir que les adresses utiles.

Spaceship a été écarté : son transfert d'email et sa redirection d'URL supposent
que la zone soit chez lui, et elle est chez Cloudflare — l'écran affiche
d'ailleurs « Redirection d'URL » grisée pour cette raison. Spacemail n'a jamais
été souscrit.

Cinq enregistrements ajoutés à la zone, les quatre premiers **verrouillés** par
Email Routing : trois `MX` vers `route{1,2,3}.mx.cloudflare.net`, un `TXT` DKIM
sur `cf2024-1._domainkey`, un `TXT` SPF `v=spf1 include:_spf.mx.cloudflare.net
~all`. Puis, à la main, `_dmarc` en `v=DMARC1; p=none; rua=mailto:contact@…;
fo=1` — `p=none` observe sans rien rejeter, à durcir une fois les rapports lus.

**Email Routing ne fait que recevoir.** Répondre depuis l'adresse demanderait un
SMTP et un « Envoyer en tant que » dans Gmail.

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

La clé `service_role` a été **retirée du code et tournée** le 30 juillet 2026.
`import_supabase.py` la lisait en dur ; il lit désormais l'environnement et
sort avec un message d'aide si la variable manque. `export_transcript.py`
n'était pas concerné — il contient une regex `sb_secret_[A-Za-z0-9_\-]+` qui
*caviarde* la clé, motif qu'un grep confond avec la chose elle-même.

L'ancienne clé du script était déjà révoquée (401) ; celle en service, dans le
fichier d'environnement, a été remplacée par `import_scripts_2026_07` et
l'ancienne supprimée du tableau de bord.

---

## 3. Modèle de données

### `films` — 3 606 lignes
`id` (identity), `tmdb_id` (unique), `titre`, `titre_original`, `annee`,
`duree`, `realisateur`, `scenariste`, `synopsis`, `note` (**/10**),
`nb_votes`, `affiche_url`, `backdrop_url`, `imdb_id`, `tagline`,
`genres` (text[]), `cast_principal` (jsonb), **`type`** (`film|serie|coffret`).

Deux lignes seulement n'ont pas de `tmdb_id` — elles échappent donc à toutes
les passes d'enrichissement, qui énumèrent `tmdb_id=not.is.null`.

**`titre` est un instantané pris à l'import, pas un miroir de TMDB.** Réaligné
le 30 juillet 2026 : 91 des 3 554 films alors en base avaient divergé, 89 réécrits
(`rafraichir_titres.py`, ancienne valeur conservée dans `titres_avant.json`).
Le rapprochement se fait sur `tmdb_id` et l'écriture est refusée si l'année de
TMDB ne colle plus à celle en base — c'est ce garde-fou qui aurait attrapé le
cas `Terminator 2` décrit plus bas.

**Fiche technique, ajoutée le 30 juillet 2026** :
`titres_alternatifs` (jsonb, `{"en": "…", "es": "…"}`), `pays` (text[]),
`date_sortie` (date), `producteurs` (text[]), `budget` (bigint), `musique`.
Migrations `20260730_titres_alternatifs.sql` et `20260730_fiche_technique.sql`.
Alimentées par `enrichir_tmdb.py` et `champs_tmdb.py`.

`cast_principal` porte désormais `{nom, role, photo}` — l'URL TMDB complète en
`w185`, comme `affiche_url` stocke une URL en `w500`. La taille fait partie de
l'URL chez TMDB ; la fixer à l'import évite que chaque page la recompose.

**`popularite` (real), ajoutée le 31 juillet 2026.** Le champ `popularity` de
TMDB, recalculé chez eux tous les jours à partir des consultations, recherches
et votes récents. Migration `20260731_dates_et_popularite.sql`, index
décroissant.

C'est une mesure de ce qu'on regarde **en ce moment**, pas une notoriété
historique : trier par `nb_votes` mettrait les mêmes classiques en tête pour
toujours. Au 31 juillet 2026 la tête de liste est *L'Odyssée* (1 167),
*Spider-Man : Brand New Day* (912), *Supergirl* (630).

**Elle se périme, et c'est sa nature.** Sans repasse, la page d'accueil affiche
indéfiniment les succès du jour de l'import — d'où la tâche hebdomadaire
décrite au §6.

### `editions` — 5 739 lignes
`id` (identity **ajoutée en juillet 2026** — elle manquait, toute insertion
applicative échouait), `titre`, `ean`, `date_sortie`, `pays`, `region`,
`formats_extraits` (text[]), `url_source`, `contenu_brut`, `image_url`,
`images_secondaires`, `slug`, `type`, `prix_editeur`, `univers`, `supports`,
`langues`, `nb_commentaires`, `nb_wishlist`, `prix_fnac_extrait`,
`film_id` (film principal), **`source`**, **`source_id`**.

`source` vaut `editioncollector.fr` (3 193) ou `bluray.com` (2 546).

**`date_parution` (date), ajoutée le 31 juillet 2026.** Migration
`20260731_dates_et_popularite.sql`, index décroissant, remplie par
`dates_editions.py` — **2 543 dates converties, zéro échec**.

`date_sortie` reste du **texte** dans la langue de la source : `Sep 30, 2025`,
`September 8, 2024`. Un `order by` dessus est alphabétique, donc faux — « Apr »
passe avant « Sep » quelle que soit l'année. La chaîne brute est conservée : elle
sert de preuve si la date analysée paraît fausse, sans retourner sur le site.

**Les dates et les visuels ne se recouvrent pas du tout.** Les 2 543 lignes
datées viennent toutes de blu-ray.com, qui ne publie aucune image ; les 3 193
`image_url` sont chez editioncollector, qui ne publie aucune date. Une requête
qui exige les deux rend **zéro ligne** — piège rencontré en construisant la page
d'accueil.

**Specs techniques, ajoutées le 30 juillet 2026** : `codec`, `resolution`,
`hdr` (text[]), `ratio`, `ratio_origine`, `pistes_audio` (jsonb
`[{langue, format}]`), `sous_titres` (text[]), `disques`, `packaging`,
`editeur`. Migration `20260730_specs_techniques.sql`, puis
`20260730_fiche_technique.sql` pour `editeur`.

Couverture, sur les 2 546 éditions blu-ray.com — les 3 193 lignes
editioncollector n'ont aucune spec, la source n'en publie pas :

| | |
|---|---|
| `resolution` | 2 513 |
| `editeur` | 2 512 |
| `pistes_audio` | 2 135 |
| `ratio` | 1 982 |
| `hdr` | 277 |

Elles portent sur le **disque**, pas sur l'œuvre : une 4K en Dolby Vision et un
Blu-ray 1080p du même film n'ont ni la même définition ni les mêmes pistes. La
fiche film agrège à l'affichage — `agregerSpecs` dans `reelio-db.ts` — et se lit
« disponible en Dolby Vision », pas « ce film est en Dolby Vision ».

**Convention d'identifiant, changée en juillet 2026.** Les 3 180 premières
lignes editioncollector portent l'id de la fiche source. Ce n'est plus
possible : les ids 33994 à 36539 ont été attribués aux fiches blu-ray.com par
la séquence, et un id de fiche récente tomberait dedans. Les nouvelles lignes
laissent la séquence décider et rangent l'id source dans `source_id`.

### `edition_films` — 6 898 liens
Relation plusieurs-à-plusieurs : un coffret appartient à chacun de ses films.
`edition_id`, `film_id`, `source`.

Répartition : `film_id` 2 622, `bluray_page` 1 153, `bluray_tmdb` 1 037,
`bluray_page_partiel` 933, `corrige_manuel` 650, `probable` 236,
`collection_tmdb` 199, `corrige_annee` 68.

6 898 liens pour **5 362 éditions rattachées** : l'écart, ce sont les coffrets,
qui portent un lien par film.

**`probable` marque les rattachements écrits sans relecture**, le 30 juillet
2026, quand la file d'attente a été vidée d'un coup plutôt que validée ligne à
ligne. Environ 15 % sont faux d'après les sondages. Ils sont isolables en une
requête, ce qui permet de les corriger au fil des signalements :

    GET /edition_films?source=eq.probable

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
| Films | 3 606 (3 099 films, 505 séries, 2 coffrets) |
| Éditions | 5 739 |
| Codes-barres | 3 428 |
| Éditions rattachées | 5 362 |
| Éditions sans film | 377 |
| URL au sitemap | 3 349 |

`editions.film_id` est `null` sur 858 lignes, ce qui ne veut plus rien dire :
la colonne est un vestige, le rattachement vit dans `edition_films`. Compter
les orphelines par `film_id is null` donne 858 au lieu de 416.

**Enrichissement TMDB du 30 juillet 2026.** 3 273 films portaient un `tmdb_id`
au lancement des passes ; les films créés depuis y échappent et devront être
repris. Titres étrangers : **3 093 films**, 180 sans — TMDB n'en propose aucun
dans les six langues retenues (`en`, `es`, `de`, `it`, `ja`, `pt`).

Le budget est le champ le moins couvert, et c'est normal : TMDB rend `0` quand
il l'ignore, et `0` est écrit `NULL` plutôt qu'affiché comme une mesure.

Deux campagnes le 30 juillet 2026 : 1 893 → 1 256, puis **1 256 → 377**. Au
total 1 516 éditions rendues visibles et 920 films créés.

La seconde campagne est partie d'une relecture des pages blu-ray.com brutes
conservées dans `crawl/pages/`. Le parseur d'origine n'en gardait que le codec,
la résolution et les disques ; la page portait aussi un bandeau structuré —
studio, plage d'années, **nombre de films**, durée — et, sur les coffrets, la
liste de leur contenu avec un lien par film. C'est ce qui a débloqué le lot :
le nombre de films tranche entre édition simple et coffret sans avoir à
interpréter le titre, là où « Intégrale » ou « Collection » mentent une fois
sur deux.

Reste 377 orphelines : 166 editioncollector, 149 coffrets blu-ray.com sans
liste de contenu, 37 films et 25 séries — ces derniers surtout des opéras et
des concerts que TMDB ne référence pas.

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
Crawlé en juillet 2026, puis 3 100 fiches sur 5 486 seulement : le site
renvoyait **403** sur le User-Agent du robot. **Blocage levé le 30 juillet
2026**, vérifié à 200 sur une fiche avec le même `Boxology-catalog-bot/1.0`.

Méthode : cookie pays via `setcountry.php?country=fr`, puis pagination de
`movies.php`. Le sitemap seul ne donne pas le pays.

Apporte : EAN (72 %), date de sortie, zone, formats, **piste audio française
(77 %)**, packaging. **Pas de visuels** — copyright.

Ne pas contourner un blocage (proxy, VPN, changement d'UA, session du compte).
Le compte créé sur le site implique l'acceptation de leurs conditions.

**Leur `robots.txt` interdit nommément les agents Claude** — `ClaudeBot`,
`Claude-SearchBot`, `Claude-Web` et `Claude-Code`, tous en `Disallow: /`. Un
assistant ne doit donc pas récupérer leurs pages, quel que soit l'UA que le
script enverrait : c'est l'agent qui est visé, pas l'outil. Le crawl se lance à
la main. Le bloc `User-agent: *`, lui, n'interdit que `/cgi-bin/`,
`/community/*.php`, `/link/`, `/search/`, `/movies/search.php` et
`/news/search.php` — les fiches et `movies.php` restent ouverts, et aucun
`Crawl-delay` n'est imposé à `*` là où bingbot et Applebot en ont 10 s.

**`enum_fr.py` écrase `catalogue_fr.json`, il ne le fusionne pas.** Les deux
énumérations de juillet ne se recouvrent qu'à 5 050 sur ~5 480 : 436 fiches
connues sont sorties du listing, 431 y sont entrées. Le total presque identique
— 5 486 contre 5 481 — masquait complètement cette rotation, et prendre la
dernière aurait perdu une fiche sur huit. Le listing ne montre qu'une fenêtre ;
une fiche qui en sort n'est pas retirée du site. **Toujours fusionner, et
sauvegarder avant.** Union au 30 juillet 2026 : 5 917 ids.

Le script s'annonce par ailleurs comme Chrome, là où `crawl_fr.py` déclare le
robot. À aligner un jour : le 200 obtenu l'a été avec l'UA du robot.

### TMDB
Métadonnées films et séries. Rattachement par titre **et année**.

Fournit aussi, dans le même appel que les crédits : titres traduits
(`translations`, et non `alternative_titles` — le second rend des variantes
d'écriture sans valeur pour la recherche), pays de production, budget,
compositeur, et la **sortie salle française** via `release_dates` filtré sur
`FR` et le type `3`. Ne pas prendre la première date française venue : sur
*3 Billboards*, le festival de La Roche-sur-Yon précède la sortie de trois mois.

Les noms de pays de `production_countries` sont en anglais quelle que soit la
langue demandée. `/configuration/countries?language=fr-FR` donne la table de
traduction.

### IMDb — écarté, et pourquoi
La question s'est posée le 30 juillet 2026 pour la page « technical » de leurs
fiches, qui porte ratio, HDR et pistes audio. **Trois voies, aucune ouverte :**

- **Scraper** — interdit noir sur blanc par leurs Conditions of Use, clause
  « Robots and Screen Scraping ».
- **Jeux de données gratuits** (`datasets.imdbws.com`) — licence *personal and
  non-commercial use only*, incompatible avec l'ambition d'affiliation. Et ils
  ne contiennent **aucune spec technique** : `title.basics`, `title.akas`,
  `title.ratings`, `title.crew`, `title.principals`, `name.basics`,
  `title.episode`, rien d'autre.
- **Licence commerciale** — tarification entreprise, hors de proportion.

Sans objet de toute façon : les specs sont déjà dans les 3 100 pages
blu-ray.com du cache, au niveau du disque, ce qu'IMDb ne donne pas. Ne pas
rouvrir le sujet sans raison neuve — et se rappeler qu'opposer une extraction à
IMDb, c'est la clause « Base de données » de nos propres mentions légales
retournée (cf. §10).

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

| `auto_corriger.py` | Applique les règles évidentes sans relecture |
| `relire.py` | Relecture au clavier, verdict sauvegardé à chaque touche |
| `corriger_prefixes.py` | Redresse les éditions rattachées au mauvais film |
| `coffrets.py` | Découpe un coffret et résout chaque film |
| `ecrire_coffrets.py` | Pose plusieurs liens par édition (`--apply`) |

Résultat cumulé : 1 893 → 1 256 orphelines, 637 rattachées, 332 films créés.

### Seconde campagne orphelines — `orphelines_2026_07_30/`

1 256 → 377 orphelines, 879 rattachées, 920 films créés, en neuf passes de
résolution toutes en **lecture seule**, séparées de l'écriture.

| Fichier | Rôle |
|---|---|
| `extraire.py` | Relit les pages brutes : bandeau, nombre de films, liste de contenu |
| `resoudre.py` | Passe 1 — normalisation, appariement par titre exact |
| `resoudre2.py` | Passe 2 — mono-œuvres : deux catalogues, sous-titre français |
| `resoudre3.py` | Passe 3 — coffrets sans liste : découpage du titre, collection TMDB |
| `reparer_genre.py` | Rejoue en série ce qui a été résolu en film à tort |
| `resoudre4.py` | Passe 4 — troncature du titre par la tête, pour les séries |
| `resoudre5.py` | Passe 5 — coffrets restants, contrainte d'années assouplie |
| `resoudre6.py` | Passe 6 — découpage accepté même partiel, les deux sources |
| `resoudre_ec2.py` | editioncollector : bloc « Contenu : », préfixes d'édition |
| `resoudre7.py` | Passe 7 — coffrets : `search/collection` par nom de saga |
| `resoudre8.py` | Passe 8 — filmographie du réalisateur : **sans rendement**, gardé comme mesure |
| `jumelle.py` | Recopie les liens d'une édition jumelle, à compte égal |
| `contenu_ec.py` | Lit le bloc « Contenu : » d'editioncollector |
| `resoudre_ec3.py` | Passe 9 — editioncollector : contenu relu, sagas développées |
| `filtrer_ec3.py` | Contrôle serré, faute de plage d'années sur ces fiches |
| `controler.py` | Trie en « sûr » et « à relire » avant écriture |
| `filtrer6.py` | Durcit la passe 6, la moins étayée |
| `ecrire.py` | Écriture (`--apply`), quatre garde-fous |

Les liens portent une source qui les rend isolables : `bluray_page` quand le
contenu du coffret est entièrement résolu, `bluray_page_partiel` sinon.

    GET /edition_films?source=eq.bluray_page_partiel

**La relecture s'est faite par lots de dix**, présentés dans des artifacts avec
le visuel du boîtier à gauche et l'affiche TMDB à droite. Le verdict revient
par un fichier que la page enregistre — `window.claude.downloads` — et non par
le presse-papiers, que l'iframe d'un artifact n'autorise pas de façon fiable.
Deux tentatives ont été perdues avant d'y arriver, dont une page de 2,6 Mo qui
a figé l'onglet : embarquer les images en base64 impose de les redimensionner.

`crawl/pages/` — 3 100 pages gzippées (170 Mo). Permettent de rejouer un
parsing sans réseau. **Ne pas supprimer** tant que l'import n'est pas figé.

### Fiche technique et specs (2026-07-30)

Alimente les deux blocs de l'onglet Détails. Encore une fois sans une seule
requête vers blu-ray.com : tout sort de `crawl/pages/`.

| Fichier | Rôle |
|---|---|
| `specs.py` | Parseur des specs, sur le **HTML** et non le texte aplati |
| `specs_1_relire.py` | Rejoue le parseur sur les 3 100 pages → `crawl/specs.jsonl` |
| `specs_2_ecrire.py` | Écrit dans `editions` (`--apply`), apparie par `source_id` |
| `champs_tmdb.py` | Pays, date de sortie, producteurs, budget, musique (`--apply`) |
| `enrichir_tmdb.py` | Titres étrangers et photos d'acteurs (`--titres-seuls`, `--cast-seul`) |

3 088 fiches relues sur 3 100, 12 pages gzip abîmées. 2 536 éditions écrites.

**Pourquoi un second parseur** plutôt qu'étendre `parseur.py` : celui-ci
travaille sur le texte aplati, et l'aplatissement perd la structure. Deux
défauts mesurés sur les 3 100 fiches, invisibles jusqu'à ce qu'on regarde les
valeurs une par une :

- `Codec: MPEG-4 AVC` rendait `MPEG-4` sur **1 899 fiches**. Le lookahead
  `[A-Z][A-Za-z ]{2,20}:` acceptait « AVC Resolution: » comme début de champ
  suivant, donc coupait juste avant.
- Les sous-titres sortaient doublés — `French, English French, English`. La
  page écrit la liste deux fois, une version courte visible et une longue
  masquée (`#shortsubs` / `#longsubs`), et l'aplatissement les colle. On lit
  maintenant le bloc `long*`, qui porte la liste entière.

**`--titres-seuls` et `--cast-seul` existent pour ne pas écraser.**
`enrichir_tmdb.py` produit distribution *et* titres d'un même appel, mais
`cast_principal` porte des lignes parfois corrigées à la main. Écrire les deux
d'un bloc quand on ne veut qu'une colonne est irréversible.

**`AVANCEMENT` est paramétrable par l'environnement.** Deux passes du même
script peuvent tourner de front sur des colonnes différentes ; avec un fichier
d'avancement partagé, la seconde saute tout ce que la première a déjà noté.
`champs_tmdb.py` accepte aussi `SORTIE`, pour la même raison.

### Classement (2026-07-31)

| Fichier | Rôle |
|---|---|
| `dates_editions.py` | `date_sortie` (texte anglais) → `date_parution` (`--apply`) |
| `maj_popularite.sh` | Rafraîchit `films.popularite`, lancé par launchd |

**Piège de locale dans `dates_editions.py`** : `%b` et `%B` de `strptime`
dépendent de la locale du système. Sous une locale française, « Sep » n'est pas
reconnu et la passe rendrait **zéro date sans rien signaler**. Les mois passent
donc par une table explicite.

**La popularité se rafraîchit toute seule, une fois par semaine.**
`~/Library/LaunchAgents/app.jaquette.popularite.plist`, **lundi 10 h** — et
non la nuit : à 4 h la machine dort, launchd remettrait la passe au réveil et
l'heure inscrite ne serait pas l'heure réelle.

    launchctl load   ~/Library/LaunchAgents/app.jaquette.popularite.plist
    launchctl unload ~/Library/LaunchAgents/app.jaquette.popularite.plist
    launchctl start  app.jaquette.popularite        # forcer une passe
    tail ~/Documents/jaquette-scraping/maj_popularite.log

`StartCalendarInterval` et non `StartInterval` : launchd rattrape un rendez-vous
manqué au réveil suivant, ce qu'un intervalle en secondes ne fait pas. Un Mac
éteint le lundi décale la passe, il ne la saute pas.

**Sur la machine et non dans un cron GitHub**, alors que le dépôt s'y prêterait.
La clé `service_role` donne un accès total à la base ; la poser dans les secrets
d'un dépôt **public** l'exposerait à quiconque obtiendrait un jour un droit
d'écriture dessus. Elle ne quitte pas `~/.config/boxology.env`. La contrepartie
est assumée : la passe ne tourne que si le Mac est allumé.

La passe repart de zéro à chaque fois — l'avancement sert à reprendre après une
coupure, pas à sauter les films vus la semaine d'avant. C'est bien tout le
catalogue qu'on veut réactualiser.

---

## 7. SEO

Chantier ouvert jusqu'en juillet 2026, désormais en place.

- **`src/app/lib/seo.ts`** — hook `useSeo`, pose titre, description, canonical
  et `og:` par page. Le canonical est **calculé depuis l'URL courante**, jamais
  passé en paramètre : une faute dans une page l'enverrait ailleurs.
- **`index.html` ne porte ni canonical ni `og:url`.** Une valeur en dur y
  ferait passer les 3 345 fiches pour des doublons de la racine. En l'absence
  de canonical, un crawler retient l'URL demandée — le bon repli.
- **`sitemap.xml`** généré au build par `scripts/generer-sitemap.mjs` depuis la
  base. 3 500 URL, dont 3 495 fiches films — contre 2 105 avant les campagnes
  de rattachement du 30 juillet 2026. Seuls les films rattachés à une édition y
  figurent. Le script casse le build s'il ne trouve aucun film. Les pages fixes
  y sont listées à la main, `/bienvenue` comprise.
- **Search Console** — propriété Domaine validée, sitemap soumis et lu.
- **Listes personnelles et écrans du prototype** en `noindex, follow`.

**Limite connue** : les scrapers de Facebook, iMessage et Discord n'exécutent
pas le JavaScript. Ils voient donc les `og:` génériques d'`index.html`, pas
ceux de la fiche. Le correctif serait une Pages Function injectant les balises
côté serveur — écartée pour l'instant.

---

## 8. Chantiers ouverts

### Décisions en attente sur les orphelines
Il reste **377 éditions sans film**, après la campagne du 30 juillet 2026 :

- **116 coffrets blu-ray.com sans liste de contenu** — `Ozu en 20 films`,
  `Douglas Sirk - Les Mélodrames allemands`. La page annonce le nombre de films
  mais ne les nomme pas, et le titre ne les nomme pas non plus. Trois leviers
  ont été essayés sur les 126 de départ ; deux ont donné, le troisième est
  mort et la raison est mesurée :

  | levier | rendement |
  |---|---|
  | `search/collection` par nom de saga | 9 coffrets, 43 liens |
  | édition jumelle (même titre nu, même compte) | 1 coffret, 2 liens |
  | filmographie du réalisateur | 0 |

  **La filmographie ne peut pas marcher.** Restreinte à la plage d'années du
  bandeau, elle n'égale jamais le compte annoncé : John Hughes 6 contre 5,
  Buster Keaton 11 contre 5, Fassbinder 39 contre 7, Kiarostami 14 contre 18,
  Lamberto Bava 16 contre 2. Sans égalité, aucun contrôle ne valide le
  résultat, et choisir un sous-ensemble reviendrait à deviner — c'est ce qui a
  produit le lot `probable`, faux à 15 %. Mesuré par `resoudre8.py`, gardé pour
  ne pas refaire l'essai.
- **166 editioncollector** — pas de page brute conservée, et `contenu_brut`
  mêle packaging et œuvres dans la même liste à puces. La neuvième passe en a
  repris 29 (111 liens) en lisant ce bloc autrement : voir le piège des lignes
  de contenu plus bas.
- **37 films et 25 séries** — surtout des opéras, des concerts et des captations
  que TMDB ne référence pas. Recoupe le chantier « une quinzaine d'opéras à
  écarter » : ces fiches n'ont pas d'œuvre à laquelle se rattacher.
- **236 rattachements `probable`** à vérifier au fil de la navigation, plus
  **845 liens `bluray_page_partiel`** : coffrets rattachés à une partie
  seulement de leur contenu. Chaque lien est exact, c'est la liste qui est
  incomplète.

Les scripts trouvent des candidats pour la plupart ; ce qui manque est la
validation, pas la détection.

### Fonctionnel
- **Authentification en ligne depuis le 30 juillet 2026.** Google uniquement,
  `auth-js` seul et chargé à la demande — +0,75 Ko compressé au bundle initial,
  le reste dans un morceau séparé de 24,5 Ko. Parcours exercé de bout en bout en
  production : connexion, écriture, cloisonnement entre comptes, suppression.
- **Toute action demande un compte.** `collections.ts` lève `CompteRequis`,
  l'interface ouvre `ModaleConnexion`. Le site n'écrit plus rien dans
  localStorage : `local-statuts.ts` ne garde que lecture et effacement, pour
  reprendre une fois les listes d'avant à la première connexion.
- **La consultation reste publique** — c'est la condition de l'indexation, donc
  de la migration Cloudflare. Ne pas fermer le catalogue.
- **Rapatrier les images** hébergées chez editioncollector
- **Supprimer la branche `DEPLOY_TARGET=github`** de `vite.config.ts`
- **Cinq acteurs par film au maximum**, limite de l'import TMDB et non de
  l'affichage. La passe photos du 30 juillet 2026 a réinterrogé les crédits
  sans lever la limite : `NB_ACTEURS` vaut 5 par défaut dans `enrichir_tmdb.py`
  et se règle par l'environnement. Passer à 12 est une commande, plus un
  chantier :

      NB_ACTEURS=12 AVANCEMENT=cast12.avancement.json \
        python3 enrichir_tmdb.py --apply --cast-seul
- **Une quinzaine d'opéras** à écarter du catalogue. **Ne pas filtrer par
  mot-clé** : « Opération Dragon », « Opération Tonnerre » et « Nosferatu, une
  symphonie de l'horreur » sont des films. Les concerts, eux, sont gardés — TMDB
  les référence.

### Page de bienvenue — en ligne le 31 juillet 2026

`/bienvenue`, `src/app/pages/BienvenuePage.tsx`, chargée en `lazy()` (23 Ko,
6,6 Ko compressé, bundle initial inchangé). Liée du pied de page et du sitemap.

**Le catalogue reste l'accueil.** C'est lui qui s'indexe, et on entre sur le
site par une fiche film. `/bienvenue` est l'autre porte : celle qu'on donne en
lien quand on présente le site. Structure calquée sur la page d'accueil de
Letterboxd — héros, six étapes numérotées à ancre propre (`#posseder`,
`#envies`, `#comparer`, `#fiche-technique`, `#coffrets`, `#compte`), tour des
grandes sections, puis l'invitation à créer un compte. Elle vient en dernier :
on ne demande un compte qu'après avoir montré à quoi il sert.

**Vignettes bâties, pas capturées.** Une capture vieillit à la première retouche
d'interface. Les blocs emploient les jetons du site et lisent titres, visuels et
formats en base. Les exemples sont **désignés par identifiant** et non par
titre — un titre en base est un instantané d'import et bouge. Ils se répondent
d'une étape à l'autre : Blade Runner 2049 pour la collection puis la
comparaison, le coffret Petrol Tank et ses quatre Mad Max pour les coffrets.
Étiqueter des éditions réelles « steelbook » ou « coffret » au hasard serait
faux à l'écran même si le propos est juste.

**La liste d'envies tourne chaque semaine**, sans tâche planifiée
(`src/app/lib/vitrine.ts`) : le numéro de semaine décale une fenêtre de trois
films dans un vivier des vingt-quatre plus populaires sortis en salle depuis
dix-huit mois et déjà édités. La page change même les semaines sans import.

**Le tri ne peut pas partir des éditions.** `editions.date_parution` n'existe
que sur les lignes blu-ray.com, sans visuel ; les visuels sont chez
editioncollector, qui ne date rien. Recouvrement **exactement nul** : une
requête « récent *et* illustré » rend zéro ligne. Le classement part donc de
`films.popularite`, avec la sortie salle pour fenêtre, et les vignettes retombent
sur l'affiche TMDB quand l'édition n'a pas de jaquette. Même raison pour la
mosaïque du héros, qui prend des affiches et non des boîtiers.

**Le défilement vers une ancre entrante est repris à la main** : la cible
n'existe pas encore quand le navigateur lit le fragment, et `GestionDefilement`
remet en haut à chaque navigation. On réessaie en `requestAnimationFrame`
jusqu'à une seconde.

`getFilmsByIds` et `getAffichesHero` vivent dans `vitrine.ts` et non dans
`reelio-db.ts` : le module partagé était retouché par une autre session, et
mêler les deux aurait emporté son travail dans le commit. À y remonter le jour
où un second appelant apparaît.

### Direction artistique — arrêtée le 30 juillet 2026

Le diagnostic de départ était « ça fait IA ». La cause n'était pas le nombre de
badges mais qu'**une seule forme servait à tout** : genres, acteurs, formats,
zones, filtres, tous la même capsule. L'œil ne pouvait plus distinguer ce qui se
clique de ce qui se lit.

**Règle : la capsule est réservée à ce qui se clique.** Les filtres de format la
gardent ; genres, distribution et métadonnées d'édition sont du texte à points
médians. Ne pas la réintroduire pour décorer.

**Typographie.** Bricolage Grotesque (`--reel-font-titre`) sur les titres et le
mot-symbole, Inter pour le corps — une grotesque à fort caractère fatigue sur un
synopsis. Space Grotesk a été écartée : c'est devenue la police par défaut du
branding des produits d'IA, exactement ce qu'on fuyait.

**Deux bleus, pas un.** Un seul ne peut pas faire les deux métiers : rempli avec
du blanc dessus il doit être sombre, en texte sur fond sombre il doit être clair.
L'ancien `#2e7dff` tentait les deux et donnait 3,82:1 sur le bouton principal,
sous le seuil AA.

    --reel-accent        #1f5fd0   blanc dessus 5,82:1
    --reel-accent-clair  #6ea8ff   sur le fond 7,40:1

Surfaces en bleu nuit (`#101720`, `#18202c`, `#1f2836`) et non charbon neutre :
le bleu cesse d'être un accent posé sur du gris. **Mesurer avant de changer une
couleur** — c'est ainsi qu'on a trouvé l'échec AA.

**L'image de l'œuvre porte l'identité.** Le héros de la fiche film affiche le
`backdrop_url` TMDB, traité en atmosphère et non en illustration : opacité 0,38,
léger flou, saturation réduite, plus deux dégradés — un horizontal qui donne au
texte un fond franc à gauche, un vertical qui fond le bas. Un seul dégradé
vertical laissait le texte illisible sur un ciel clair.

**Héros de la fiche film : cinq éléments.** Titre avec l'année en graisse fine,
réalisation, note, synopsis, boutons. Accroche, durée, genres et distribution
sont dans l'onglet Détails. Empilés dans le héros, ils repoussaient les boutons
hors du premier écran.

L'année est en graisse **300** et séparée du titre par deux espaces insécables :
à 44 px, l'espace ordinaire du titre est trop serrée et l'année colle au dernier
mot. Plus l'écart de graisse est net, moins elle se lit comme un morceau du
titre.

**Onglet Détails, arrêté le 30 juillet 2026.** Distribution en grille pleine
largeur en tête, puis deux fiches côte à côte : « L'œuvre » à gauche,
« Image et son » à droite.

Une fiche unique mélangeait ce qui relève de l'œuvre — réalisation, année,
genres, titres étrangers, identiques quel que soit le disque — et ce qui relève
du support — définition, HDR, pistes audio, qui changent d'une édition à
l'autre. Les séparer dit d'où vient chaque ligne.

L'ordre et le vocabulaire de « L'œuvre » sont calqués sur la fiche technique de
**SensCritique**, prise comme référence : titre original, titres alternatifs,
genres, année, pays, durée, dates de sortie, réalisateur, scénariste,
producteurs, distributeur, budget, bande originale. Leur page ne contient
**aucune spec technique** — leur « fiche technique » est notre bloc de gauche,
et le bloc de droite n'a pas d'équivalent chez eux.

Le distributeur manque et manquera : **TMDB ne le publie pas.**
`production_companies` liste les sociétés de production, qui ne sont le
distributeur que par coïncidence. L'éditeur vidéo de blu-ray.com le remplace, et
il est dans le bloc de droite — il qualifie le disque, pas l'œuvre.

La distribution est en grille de portraits et non en liste : empilée, elle
tenait dans une demi-colonne mais lisait comme un annuaire, et les visages se
réduisaient à des pastilles d'initiales de 36 px. Le rapport 2/3 est imposé même
sans photo, sinon les cartes sans image remontent et désalignent les noms.

**Page d'accueil déconnectée, refaite le 31 juillet 2026.** Elle ouvrait sur
« Parcourir les films » et une grille alphabétique : le premier écran d'un
catalogue de 5 700 éditions montrait *…Et pour quelques dollars de plus* et
*[REC]*. Structure reprise de **SensCritique** et de **Letterboxd** — accroche
illustrée, contenu, encart d'inscription, arguments — adaptée au sujet : ici
l'objet montré est la jaquette, pas la critique.

Cinq sections : accroche avec mosaïque d'affiches et recherche, dernières
parutions en rail, invitation à créer un compte, trois arguments, catalogue.

**L'encart d'inscription vient après les parutions**, jamais avant : on demande
un compte à quelqu'un qui a déjà vu ce que le site contient. Il n'apparaît
qu'une fois la session résolue (`session === null`), sinon il s'affiche puis
disparaît sous les yeux d'un visiteur déjà connecté.

**Dès qu'on tape dans la recherche, tout le reste s'efface.** Quelqu'un qui
cherche un titre veut son résultat, pas une page d'accueil autour. Et la
recherche explicite reste **alphabétique** — on cherche un titre connu, l'ordre
attendu est celui du dictionnaire — là où le catalogue par défaut est classé par
`popularite`.

`nulls: "last"` est indispensable sur ce tri : PostgreSQL classe les nuls en
premier sur un `desc`, et la page se serait ouverte sur les fiches les moins
renseignées.

**Aucun filtre CSS dans le héros, et c'est délibéré.** Un `backdrop-filter` sur
le voile d'abord, puis un `filter: blur()` sur les affiches, ont tous deux laissé
la page **dédoublée et décalée d'une centaine de pixels** : les deux forcent une
couche de composition sur toute la largeur, où le navigateur laisse des tuiles
périmées quand la mise en page se décale — apparition d'une barre de défilement,
changement de largeur. L'atmosphère passe par l'opacité et deux dégradés, comme
sur la fiche film. Le titre reprend l'échelle de `/bienvenue`,
`clamp(38px, 6vw, 68px)` : deux pages qui ouvrent le site ne peuvent pas
annoncer deux tailles.

**`RailHorizontal`** (`src/app/components/`) est partagé entre la distribution
de la fiche film et les parutions de l'accueil. Ses flèches se centrent sur
**l'image mesurée** de la première carte, et non sur un pourcentage de hauteur :
le `34 %` d'origine visait le portrait d'un acteur et tombait au-dessus des
jaquettes, plus hautes. Mesurer libère le composant de la forme de ce qu'il
transporte.

**Note à deux décimales** partout. TMDB rend `7.901` ; trois décimales suggèrent
une précision que la note n'a pas.

Le mot-symbole est le seul élément de marque : la pastille bleue à icône de
pellicule a été retirée, l'emplacement attend un vrai logo.

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
- **blu-ray.com sert de l'ISO-8859-1**, comme l'annonce son `<meta charset>`.
  Décodé en UTF-8, `TF1 Vidéo` devient `TF1 Vid<?>o`. Le défaut est resté
  invisible tant qu'aucun champ accentué n'était extrait — il est apparu le
  jour où la colonne `editeur` a existé. Lire le `charset` du document, ne pas
  le supposer.
- **Ne pas prendre `Mot: texte` pour une donnée.** Les blocs Audio et Subtitles
  contiennent des lignes qui en ont la forme sans être des pistes :
  `Note: Confirmed from disc on the player`, `Music:`, et des titres de films à
  deux-points — `X-Men: Days of Future Past`, `Mission: Impossible`. Sur
  107 « langues » audio relevées, une trentaine étaient de ce genre. Filtrer
  par un vocabulaire de langues, pas par la forme.
- **Un champ peut porter plusieurs valeurs dans une seule chaîne** :
  `2.41:1, 2.40:1, 1.85:1` sur un coffret à trois montages,
  `MPEG-4 AVC, VC-1` sur un disque à deux encodages. Sans découpage, chaque
  combinaison devient une valeur distincte et l'agrégat affiche
  `1.85:1 · 2.41:1, 2.40:1, 1.85:1`, où la même valeur paraît deux fois. Le
  débit entre parenthèses produit le même effet :
  `HEVC / H.265` et `HEVC / H.265 (50.53 Mbps)` sont le même codec.

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
- **Ne pas effacer les mots qui portent le sens.** `le film`, `la série`,
  `saison`, `N films` ont d'abord été rangés dans le vocabulaire d'édition à
  retirer, alors qu'ils sont le seul indice du type de l'œuvre. Résultats :
  `South Park, le film` rattaché à la série, `Sword Art Online – The Movie`
  aussi. Même faute que « Coffret 8 films » effacé par la regex de bruit.
- **`Open Season - Trilogy` devenu « Open »** parce que la regex de saison a
  mangé le mot « Season » du titre. Il s'agissait des *Rebelles de la forêt*,
  la recherche a rendu *Open House*.
- **Une année dans le titre de l'édition est une contrainte, pas un ornement.**
  `Thelma et Louise (1991)` a été proposé vers un documentaire de 2025.
- **Un disque ne peut pas contenir une œuvre postérieure à sa sortie.**
  `date_sortie` sert de plafond — couverture faible, 28 éditions sur 297, mais
  décisive quand elle existe.
- **Le titre retenu doit partager un mot significatif avec celui de
  l'édition.** Contrôle appliqué a posteriori sur 230 rattachements : quatre
  suspects, dont `Heroes: Season 3` → *Speed 2* et `Gremlins` → *Paris, Texas*.
  Les deux autres étaient des traductions correctes — `Ulysses` → *Ulysse* —
  d'où une relecture plutôt qu'un rejet automatique.
- **Séparer les résultats en deux niveaux** — écriture directe et relecture — a
  attrapé 100 % des faux positifs connus. Sans ce tri, le taux d'erreur du lot
  « résolu » était de 20 %.
- **L'article initial ne peut pas être effacé sans repli.** Le normaliser rend
  `Batman` et `The Batman` identiques : un coffret des quatre Batman des années
  90 s'est retrouvé sous *The Batman* (2022). L'égalité stricte passe d'abord,
  la variante sans article ne sert qu'en second — elle reste utile pour
  rapprocher un titre français d'un titre anglais.
- **Un exposant disparaît dans un repli ASCII.** `Alien³` devenait `alien`,
  donc *Alien* (1979) — un doublon à l'intérieur du même coffret, ce qui est le
  signe qu'il faut chercher. Traduire `¹²³` en chiffres avant de normaliser.
- **La popularité ne départage que des homonymes.** Employée comme seuil
  absolu, elle vide précisément les coffrets qu'on veut sauver : un Tavernier
  ou un Iosseliani est fait de films à 0,4. Elle ne s'applique que si plusieurs
  titres exacts se disputaient le rattachement.
- **L'année d'un bandeau est celle du contenu du disque, pas de l'œuvre.** Sur
  un coffret « saison 4 » elle vaut 2008 quand la série a commencé en 2005 : la
  poser en `first_air_date_year` élimine la bonne réponse. Pour une série
  l'année est un plafond, pas un filtre.
- **Tronquer par la tête, jamais par la queue.** `Sword Art Online II - Arc 1 :
  Phantom Bullet` se résout en gardant le début ; chercher la queue seule avait
  donné `Star Trek 3 : Sans Limites` → « Sans limites » (2022). Mais garder la
  tête ne vaut que si la queue retirée nomme un lot d'épisodes : sans cette
  condition, `Puccini: Tosca` devient *Puccini* (1973) et
  `The Fantastic Four: First Steps` la série animée de 1994.
- **Un morceau de titre découpé peut n'être qu'un support.**
  `Evolution + Innocence – DigiPack` se découpait en cinq, dont « DVD », qui a
  trouvé un *Where is my DVD?* (2013).
- **Une parenthèse en tête de titre est une enseigne, pas un titre d'origine.**
  `(Leclerc) Aquaman 2 et le Royaume perdu` s'est rattaché au film *Leclerc*
  (1949). En fin de titre, en revanche, elle porte bien l'original :
  `Stalingrad (Enemy At The Gates)`.
- **Une normalisation ASCII *efface* la ponctuation non-ASCII au lieu de la
  séparer.** `encode("ascii", "ignore")` réduisait `l’Anneau` à `lanneau` quand
  `l'anneau` donnait `l anneau` : les deux cessaient d'être comparables, et
  **tout titre français à apostrophe typographique échouait en silence**. Le
  symptôme visible était un rattachement au repli — `Le Seigneur des Anneaux –
  La Communauté de l'Anneau` tombait sur le dessin animé de Bakshi (1978), la
  correspondance exacte ayant échoué et le fragment de tête ayant gagné.
  Ramener `’ “ ” – — …` à leur équivalent ASCII **avant** de replier.
- **Dans un bloc « Contenu : », le support est le suffixe des lignes qui nomment
  une œuvre**, pas la marque des lignes à jeter : `La vie des morts (1991) en
  blu-ray`, `Steelbook blu-ray 2D+4K de Fog`. Rejeter les lignes contenant
  « blu-ray » revenait à jeter précisément ce qu'on cherchait. Retirer le
  vocabulaire de support en tête et en queue, puis regarder ce qui reste — et
  si rien ne reste sur aucune ligne, c'est une édition d'un seul film, que le
  titre de l'édition nomme.
- **Ne pas affiner indéfiniment un filtre à bruit.** Ce qu'un bloc « Contenu : »
  laisse passer — `une broche La Main du Roi`, `2 art cards` — ne trouvera aucun
  titre exact sur TMDB. La validation fait le tri ; la regex n'a qu'à
  dégrossir.
- **Une ligne de contenu peut nommer une saga et non un film.** Dans un coffret
  Hobbit, `Le Seigneur des Anneaux` désigne la trilogie. Résolu comme un titre,
  il rendait un seul film — et le mauvais. `search/collection` le développe,
  à condition que la collection tienne dans les places restantes du boîtier.
- **Le titre borne parfois lui-même le contenu** : `Sonic 1 & 2`, `Superman
  I-IV`. Sans cette borne, développer la saga Sonic dans un coffret de deux
  films y ajoutait les volets 3 et 4, dont un de 2026.
- **Une parenthèse jamais refermée signale une ligne coupée à l'extraction.**
  `Le Hobbit : Un voyage inattendu (1 Blu-ray du film en version longue + 3`
  laissait « (1 » collé au titre.
- **Sans `order`, la pagination PostgREST répète et saute des lignes.** `offset`
  s'applique alors à un ensemble non ordonné. Symptôme silencieux : un comptage
  d'orphelines est ressorti à 811 au lieu de 406, une page d'`edition_films`
  ayant disparu de la lecture. Toujours passer `order=id`.
- **editioncollector met le vocabulaire d'édition devant, blu-ray.com derrière.**
  Des coupes en fin de chaîne ne mordent sur rien côté editioncollector, et
  celle qui part d'« Intégrale » emporte tout le titre :
  `Coffret intégrale de The Big Bang Theory`.
- **TMDB est communautaire, donc ses titres bougent.** `! SOS Fantômes` a
  longtemps été notre titre du film de 1984 : le point d'exclamation est une
  astuce de contributeur pour faire remonter une fiche dans les listes, et TMDB
  l'a corrigé depuis en `S.O.S. Fantômes`. Un titre en base est daté de son
  import ; ne pas le prendre pour la vérité courante.
- **La dérive s'était concentrée sur un seul lot** : 77 des 91 titres
  divergents tenaient dans les ids 11000-11193, soit 194 lignes — 40 % du lot,
  contre 0,4 % ailleurs. Ces titres avaient été écrits avec une normalisation
  d'affichage appliquée au passage (tirets et deux-points changés en ` : `,
  `&` changé en `and`, casse de titre forcée), donc n'avaient jamais
  correspondu à TMDB. **Ne pas normaliser un titre à l'écriture** : la mise en
  forme appartient à l'affichage, et un titre retouché ne se rapproche plus de
  rien.
- **Les caractères invisibles de TMDB cassent toute comparaison exacte.**
  Espace insécable avant les deux-points (`X-Men : Apocalypse`, 31 lignes)
  et marque de sens d'écriture en tête de titre (`‎Avatar Aang…`). Sans
  effet à l'œil, mais deux titres identiques à la lecture deviennent
  impossibles à rapprocher. `nettoyer_invisibles.py` les retire.
- **`Terminator 2` (1989) est un décalque italien de Bruno Mattei.** Deux
  éditions editioncollector y étaient rattachées au lieu du film de Cameron
  (1991) — le titre d'exploitation français du décalque usurpe le sien.
  Corrigé le 30 juillet 2026. Même motif que Jean Vigo ou Bruce Lee : un titre
  exact tombant sur un homonyme confidentiel, ici invisible parce que l'année
  n'avait jamais été comparée.

### Infrastructure
- **`npm run build` lance `tsc --noEmit` d'abord.** Sans lui, rien ne relisait le
  code : esbuild ne vérifie pas les types, et un identifiant JSX dont l'import a
  été retiré devient une référence globale résolue à l'exécution. Un `Search`
  ainsi perdu a fait écran blanc sur tout le site sans que le build bronche.
  `strict` reste désactivé — les écrans hérités de Figma Make noieraient le
  signal sous des centaines d'erreurs de nullité.
- **Un `tsc` vert en local ne dit rien du build Cloudflare** quand plusieurs
  sessions travaillent dans le même répertoire. Le 31 juillet 2026, la page de
  bienvenue importait `getDernieresEditions` de `reelio-db.ts` — fonction qui
  n'existait que dans l'arbre de travail, l'autre session ne l'ayant pas encore
  poussée. Build local vert, déploiement rouge sur
  `error TS2305: has no exported member`. Le serveur de build ne voit que ce qui
  est commité. **Vérifier dans un worktree détaché sur HEAD** avec ses seuls
  fichiers copiés par-dessus, c'est la situation exacte du serveur :

      git worktree add --detach /tmp/verif HEAD
      cp src/app/pages/MaPage.tsx /tmp/verif/src/app/pages/
      ln -s "$PWD/node_modules" /tmp/verif/node_modules
      cd /tmp/verif && npx tsc --noEmit

  Corollaire : ne commiter que ses propres fichiers, et si une fonction commune
  manque, la poser dans un module à soi plutôt que d'emporter le travail en
  cours d'une autre session.
- **Un déploiement Cloudflare n'écrit rien dans GitHub.** Ni check, ni
  `deployments` : `gh api .../deployments` ne rend que les vieux `github-pages`
  de juillet. Pour savoir si un push est parti, comparer le hachage du bundle
  servi ou compter les URL du sitemap — et lire le journal dans le tableau de
  bord Pages, seule source de la cause d'un échec.
- **Après un déploiement, la première visite peut rendre l'ancienne page.**
  L'`index.html` en cache navigateur pointe l'ancien bundle : sur une route
  neuve, on obtient la page « introuvable » alors que tout est en ligne. Un
  rechargement suffit, il n'y a rien à purger. Ne pas confondre avec l'incident
  d'asset estampillé `immutable`, qui, lui, ne se répare pas seul.
- **PostgREST plafonne à 1 000 lignes.** Paginer, toujours. Le piège s'est
  reproduit : un `limit=1893` a silencieusement traité 1 000 lignes.
- **TMDB numérote films et séries séparément.** Le film 1639 est *Speed 2*, la
  série 1639 est *Heroes*. `films.tmdb_id` était unique à lui seul : les deux
  ne pouvaient pas coexister, et une recherche par `tmdb_id` seul renvoyait
  l'œuvre du mauvais catalogue — une édition de *Heroes* s'est retrouvée sous
  *Speed 2*. L'unicité porte désormais sur `(tmdb_id, type)`,
  cf. `supabase/migrations/20260730_tmdb_id_par_type.sql`. Le défaut est
  silencieux : il ne se voit qu'au moment où une série heurte un film existant.
- **`ON CONFLICT` ignore les index partiels.**
- **`editions.id` n'avait pas d'identity** — insertion impossible.
- **`gzip.open(...).read()` lève `zlib.error` sur une page tronquée**, et
  `zlib.error` n'est ni `EOFError` ni `OSError`. Une passe sur 3 100 fichiers
  est tombée à la 2 000ᵉ. Rattraper les trois, et garder ce qui a été lu.
- **Une reprise fondée sur le journal ne voit pas un cache abîmé.**
  `crawl_fr.py` écrit la page gzippée *puis* la ligne de `donnees.jsonl`, et
  reprend sur le second. Une coupure entre les deux est sans conséquence — la
  fiche est refaite. Mais une page tronquée dont la ligne a été écrite devient
  invisible : la reprise la croit faite, et elle le reste indéfiniment. Ce sont
  les 12 pages abîmées du crawl de juillet. Remises dans la file le 30 juillet
  2026 en retirant leur ligne et leur `.gz`. **Vérifier le cache, pas le
  journal.**
- **Tailwind 4 a changé son preflight** : les `<button>` reçoivent
  `cursor: default` là où Tailwind 3 posait `cursor: pointer`. Toute
  l'interface bâtie sur des boutons — onglets, capsules de format, cartes
  d'acteurs — a cessé de signaler qu'elle était cliquable, sans que rien ne
  casse. Réglé une fois dans `theme.css`, pas composant par composant.
- **Une couleur en `style` inline gagne contre toute règle de survol.** Un
  `group-hover:text-…` posé à côté d'un `style={{ color }}` ne s'applique
  jamais. Passer la couleur par une classe dès qu'un état la fait changer.
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
- **Un morceau `lazy()` peut échouer à l'import en servant pourtant 200 et les
  bons octets.** Second incident du 30 juillet 2026, distinct du précédent : le
  site rendait une page sans style bloquée sur « Chargement… ». Relevé sur
  `auth-client` :

  | | |
  |---|---|
  | `curl` | 200, `application/javascript`, octets identiques au build |
  | `fetch()` dans la page | 200, fichier entier, fin de fichier correcte |
  | `import()` | `Failed to fetch dynamically imported module` |

  Le même build servi depuis `localhost` s'importait sans broncher, dans le
  même navigateur — donc ni le code, ni le bundle. La purge du cache a rétabli
  le CSS mais pas l'import. **Cause jamais établie.**

  Ce qui est établi, en revanche, c'est pourquoi ça a mis le site à terre :
  `useSession` attendait `auth-js` sans `catch`, `session` restait `undefined`,
  et la fiche film — qui ne lance ses requêtes qu'une fois la session résolue —
  ne sortait jamais de son écran de chargement. **Un catalogue public entier
  inaccessible faute d'une bibliothèque dont il n'a pas besoin.** Le correctif
  est dans `auth.ts` : à l'échec, on tranche à « pas de session » et la page
  s'affiche.

  À retenir pour le reste : **aucun chemin de consultation ne doit dépendre
  d'un `import()` qui peut échouer.** Un chargement à la demande est un pari sur
  le réseau ; il se rattrape, il ne se suppose pas.

  Signature à reconnaître : page blanche ou sans style, `#root` vide ou bloqué
  sur un écran de chargement, alors que `curl` trouve tout normal. Comparer
  `fetch()` et `import()` sur le même morceau tranche en une commande.
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
   une requête réseau. Et surtout : la seconde campagne orphelines n'a rien
   crawlé du tout. Ce qui manquait était déjà dans `crawl/pages/`, jeté par le
   parseur — le nombre de films et la liste de contenu des coffrets. **Avant de
   déclarer une donnée absente de la source, relire la page, pas le champ
   qu'on en avait extrait.**
3. **Vérifier qu'un scan qui renvoie « rien » fonctionne.** Un scan cassé
   ressemble à un scan négatif.
4. **Relire un échantillon avant d'écrire.** Chaque passe de relecture a
   révélé une famille de faux positifs que la précédente ne voyait pas.
5. **Écrire par lots successifs plutôt qu'en une fois.** Six passes, trois
   écritures : chaque lot écrit a servi de mesure au suivant, et les passes
   tardives n'ont eu à traiter que ce qui restait vraiment.

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
