# Jaquette, contexte projet

Catalogue des éditions physiques de films (Blu-ray, 4K, steelbooks, coffrets)
pour le marché français. Anciennement *Boxology*, renommé en juillet 2026.

---

## 1. Identité

| | |
|---|---|
| Nom | **jaquette.app**, en minuscules, extension comprise. Depuis juillet 2026 : « jaquette » seul est un nom commun, le `.app` est ce qui démarque. Vaut partout : mot-symbole, `<title>`, `og:site_name` |
| Domaine | `jaquette.app`, **en ligne**, apex et `www` |
| Dépôt | `github.com/rayan-adamczak/jaquette` (public) |
| Éditeur | Rayan Adamczak, designer, à titre non professionnel |
| Contact | `contact@jaquette.app`, Cloudflare Email Routing, redirige vers rayan.adamczak@gmail.com. Réception seulement, pas d'envoi |
| Compte Awin | `Boxology` (3006883), 4 candidatures en attente |

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
`DEPLOY_TARGET=github` désormais morte, sous-chemin `/jaquette/` et copie
`404.html`. À supprimer un jour.

`public/_headers` marque `/assets/*` en `immutable` : Cloudflare revalidait à
chaque visite (`cf-cache-status: REVALIDATED` au lieu de `HIT`), soit un
aller-retour avant le premier octet. `index.html` reste volontairement hors de
la règle, sinon un déploiement ne serait pas vu des visiteurs déjà venus.

DNS géré par Cloudflare, domaine acheté chez Spaceship (nameservers
`anna`/`lloyd.ns.cloudflare.com`). Un enregistrement `TXT` valide la propriété
Google Search Console, **ne pas le supprimer**, la validation tomberait.

### Courrier

`contact@jaquette.app` posé le 30 juillet 2026 par **Cloudflare Email Routing**,
gratuit. Une règle redirige `contact@` vers `rayan.adamczak@gmail.com`, et le
**catch-all est actif** vers la même boîte : toute adresse du domaine arrive,
`bonjour@` comme `xyz@`. Aucune faute de frappe n'est perdue, mais rien ne
filtre non plus, si le spam monte, repasser le catch-all en « Supprimer » et
n'ouvrir que les adresses utiles.

Spaceship a été écarté : son transfert d'email et sa redirection d'URL supposent
que la zone soit chez lui, et elle est chez Cloudflare, l'écran affiche
d'ailleurs « Redirection d'URL » grisée pour cette raison. Spacemail n'a jamais
été souscrit.

Cinq enregistrements ajoutés à la zone, les quatre premiers **verrouillés** par
Email Routing : trois `MX` vers `route{1,2,3}.mx.cloudflare.net`, un `TXT` DKIM
sur `cf2024-1._domainkey`, un `TXT` SPF `v=spf1 include:_spf.mx.cloudflare.net
~all`. Puis, à la main, `_dmarc` en `v=DMARC1; p=none; rua=mailto:contact@…;
fo=1`, où `p=none` observe sans rien rejeter, à durcir une fois les rapports lus.

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
n'était pas concerné, il contient une regex `sb_secret_[A-Za-z0-9_\-]+` qui
*caviarde* la clé, motif qu'un grep confond avec la chose elle-même.

L'ancienne clé du script était déjà révoquée (401) ; celle en service, dans le
fichier d'environnement, a été remplacée par `import_scripts_2026_07` et
l'ancienne supprimée du tableau de bord.

---

## 3. Modèle de données

### `films`, 4 939 lignes
`id` (identity), `tmdb_id` (unique), `titre`, `titre_original`, `annee`,
`duree`, `realisateur`, `scenariste`, `synopsis`, `note` (**/10**),
`nb_votes`, `affiche_url`, `backdrop_url`, `imdb_id`, `tagline`,
`genres` (text[]), `cast_principal` (jsonb), **`type`** (`film|serie|coffret`).

Deux lignes seulement n'ont pas de `tmdb_id`, elles échappent donc à toutes
les passes d'enrichissement, qui énumèrent `tmdb_id=not.is.null`.

**134 œuvres sans aucune édition ont été supprimées le 31 juillet 2026**, en
deux lots. Les 103 premières :
C'était le résidu des corrections de genre : quand une édition passe du film
`Bleach` à la série `Bleach`, la fiche film reste, vide. Un catalogue d'éditions
physiques n'a rien à faire d'une œuvre qu'aucun disque ne porte, et le sitemap
ne les listait déjà pas. Sauvegarde complète dans
`films_supprimes_20260731.json`, c'est le seul retour arrière, la suppression
en base est définitive. Vérifié avant écriture : aucun lien, aucun
`editions.film_id`, aucune ligne de `collections` ne les référençait.

Trente et une de plus le 1er août 2026, vidées par la relecture des liens
`probable` : c'étaient les documentaires sur Bronson, Bogart ou Pagnol que les
coffrets à leur nom avaient attirés. Sauvegarde dans
`films_supprimes_20260801.json`.

Les 31 précédentes sont le miroir exact des 51 liens faux décrits au §9 : des
fiches TMDB créées uniquement pour porter un rattachement erroné, vidées dès
que le lien a sauté. C'est ainsi que `Pack`, `CD`, `Complete`, `Impossible` et
`A4` ont quitté le catalogue. Sauvegarde dans
`films_supprimes_20260731_lot2.json`.

**`titre` est un instantané pris à l'import, pas un miroir de TMDB.** Réaligné
le 30 juillet 2026 : 91 des 3 554 films alors en base avaient divergé, 89 réécrits
(`rafraichir_titres.py`, ancienne valeur conservée dans `titres_avant.json`).
Le rapprochement se fait sur `tmdb_id` et l'écriture est refusée si l'année de
TMDB ne colle plus à celle en base, c'est ce garde-fou qui aurait attrapé le
cas `Terminator 2` décrit plus bas.

**Fiche technique, ajoutée le 30 juillet 2026** :
`titres_alternatifs` (jsonb, `{"en": "…", "es": "…"}`), `pays` (text[]),
`date_sortie` (date), `producteurs` (text[]), `budget` (bigint), `musique`.
Migrations `20260730_titres_alternatifs.sql` et `20260730_fiche_technique.sql`.
Alimentées par `enrichir_tmdb.py` et `champs_tmdb.py`.

`cast_principal` porte désormais `{nom, role, photo}`, l'URL TMDB complète en
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
indéfiniment les succès du jour de l'import, d'où la tâche hebdomadaire
décrite au §6.

### `editions`, 8 925 lignes
`id` (identity **ajoutée en juillet 2026**, elle manquait, toute insertion
applicative échouait), `titre`, `ean`, `date_sortie`, `pays`, `region`,
`formats_extraits` (text[]), `url_source`, `contenu_brut`, `image_url`,
`images_secondaires`, `slug`, `type`, `prix_editeur`, `univers`, `supports`,
`langues`, `nb_commentaires`, `nb_wishlist`, `prix_fnac_extrait`,
`film_id` (film principal), **`source`**, **`source_id`**.

`source` vaut `editioncollector.fr` (3 193), `bluray.com` (5 278) ou
`lechatquifume.com` (212) ou `metalunastore.fr` (242).

**`collection_editeur` et `numero_collection`, ajoutées le 1er août 2026.**
Migration `20260801_collection_editeur.sql`, index sur le couple. La série
numérotée d'un éditeur, Criterion et ses spines, Ultra Collector, Make My
Day!, n'est pas la même chose que `editeur`, qui dit qui presse le disque :
Studiocanal édite « Make My Day! » **et** cent titres hors collection.

La colonne s'appelle `collection_editeur` et non `collection` : la table
`collections` porte les listes utilisateur, et deux noms proches sur deux
notions sans rapport se lisent de travers.

`numero_collection` est encore **vide partout**. Le Chat qui fume numérote son
`sku` de 013 à 271, mais ce compteur couvre aussi la revue *Nitrate* et les
badges : c'est une référence de boutique, pas un rang de collection.

**`date_parution` (date), ajoutée le 31 juillet 2026.** Migration
`20260731_dates_et_popularite.sql`, index décroissant, remplie par
`dates_editions.py`, **2 543 dates converties, zéro échec**.

`date_sortie` reste du **texte** dans la langue de la source : `Sep 30, 2025`,
`September 8, 2024`. Un `order by` dessus est alphabétique, donc faux : « Apr »
passe avant « Sep » quelle que soit l'année. La chaîne brute est conservée : elle
sert de preuve si la date analysée paraît fausse, sans retourner sur le site.

**Les dates et les visuels ne se recouvrent pas du tout.** Les 2 543 lignes
datées viennent toutes de blu-ray.com, qui ne publie aucune image ; les 3 193
`image_url` sont chez editioncollector, qui ne publie aucune date. Une requête
qui exige les deux rend **zéro ligne**, piège rencontré en construisant la page
d'accueil.

**Specs techniques, ajoutées le 30 juillet 2026** : `codec`, `resolution`,
`hdr` (text[]), `ratio`, `ratio_origine`, `pistes_audio` (jsonb
`[{langue, format}]`), `sous_titres` (text[]), `disques`, `packaging`,
`editeur`. Migration `20260730_specs_techniques.sql`, puis
`20260730_fiche_technique.sql` pour `editeur`.

Couverture, sur les 2 546 éditions blu-ray.com, les 3 193 lignes
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
fiche film agrège à l'affichage (`agregerSpecs` dans `reelio-db.ts`) et se lit
« disponible en Dolby Vision », pas « ce film est en Dolby Vision ».

**Convention d'identifiant, changée en juillet 2026.** Les 3 180 premières
lignes editioncollector portent l'id de la fiche source. Ce n'est plus
possible : les ids 33994 à 36539 ont été attribués aux fiches blu-ray.com par
la séquence, et un id de fiche récente tomberait dedans. Les nouvelles lignes
laissent la séquence décider et rangent l'id source dans `source_id`.

### `edition_films`, 10 801 liens
Relation plusieurs-à-plusieurs : un coffret appartient à chacun de ses films.
`edition_id`, `film_id`, `source`.

Répartition : `bluray_page` 2 838, `film_id` 2 619, `bluray_tmdb` 2 484,
`bluray_page_partiel` 1 710, `corrige_manuel` 660, `probable` 171,
`collection_tmdb` 199, `corrige_annee` 68.

10 801 liens pour **7 896 éditions rattachées** : l'écart, ce sont les coffrets,
qui portent un lien par film.

**`probable` marquait les rattachements écrits sans relecture**, le 30 juillet
2026, quand la file d'attente a été vidée d'un coup plutôt que validée ligne à
ligne. Les sondages estimaient 15 % de faux.

**Relus le 1er août 2026 par le bandeau blu-ray.com**, qui donne l'année de
l'œuvre sur le disque et sert donc de mesure indépendante : 161 confirmés,
**50 contredits et supprimés**, 10 non mesurables faute de bandeau. Le taux
réel était donc de 23 %, pas 15.

Le motif est constant et vaut pour la suite : **un coffret au nom propre tombe
sur un documentaire consacré à cette personne**.

    Charles Bronson, coffret n°2  ->  « Charles Bronson, le génie du mâle » (2020)
    Humphrey Bogart, 2 films      ->  « Biography: Humphrey Bogart »
    Coffret Marcel Pagnol         ->  « Marcel Pagnol »
    Peaky Blinders: Series 4      ->  un film nommé « Series 4 » (1972)
    The Meg + Meg 2: The Trench   ->  « La Tranchée » (1999)

Les 171 restants portent encore le label, alors qu'ils ont passé ce contrôle :
il garde la trace de leur origine, pas un doute actuel. Ils restent isolables :

    GET /edition_films?source=eq.probable

**L'app lit les éditions via cette table**, pas via `editions.film_id`
(cf. `getEditionsForFilm` dans `src/app/lib/reelio-db.ts`).

### `collections`, appliquée le 30 juillet 2026, 2 lignes
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
idempotent, rejouable sans effet de bord.

**Comment l'appliquer.** Par l'éditeur SQL du tableau de bord, seule voie
disponible : pas de `psql`, pas de CLI Supabase, et aucun mot de passe de base
ni jeton `sbp_` sur la machine. La clé `service_role` ne suffit pas, PostgREST
n'exécute pas de SQL arbitraire, donc aucun DDL. Coller par le presse-papiers
(`pbcopy < fichier.sql`) et non taper : l'éditeur auto-indente et ferme les
parenthèses, ce qui abîme un bloc `$$ ... $$`. Le tableau de bord annonce
« destructive operations » pour les `drop policy if exists` que le script
recrée trois lignes plus bas.

### `bluray_import`, table de transit
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
sans `user_id`, deux lignes de test, aucune référence),
cf. `supabase/migrations/20260730_drop_statuts.sql`.

Attention en vérifiant : PostgREST répond **200 avec un tableau vide** quand une
policy bloque un SELECT, pas 401. Un 200 ne prouve rien.

`collections` échappe à ce piège, et c'est délibéré : plutôt qu'une policy
`anon` restrictive, la migration **révoque les privilèges de table** à `anon`.
La barrière tombe donc avant la RLS et se voit. Vérifié le 30 juillet 2026 :

    anon GET /collections  ->  401, 42501 permission denied for table collections

Un vrai refus, pas un tableau vide. Comme `revoke all` porte sur tous les
privilèges, une écriture bute sur la même barrière, mais seul le SELECT a été
réellement exercé.

La clé `anon` du bundle est publique par nature, ce n'est pas une fuite.
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
| Films | 4 939 (4 217 films, 720 séries, 2 coffrets) |
| Éditions | 8 925 |
| Codes-barres | 5 383 |
| Éditions rattachées | 8 325 (93,3 %) |
| Éditions sans film | 600 |
| Éditions avec visuel | 8 893 (99,6 %) |
| URL au sitemap | 5 446 |

**Trois sources sont entrées le 1er août 2026**, +454 éditions et +377 films :

| source | éditions | rattachées | visuels sur R2 |
|---|---|---|---|
| Le Chat qui fume | 212 | 197 (93 %) | 473 |
| Make My Day! (Metaluna) | 94 | 86 (91 %) | 97 |
| Artus Films (Metaluna) | 148 | 114 (77 %) | 155 |

Artus est nettement plus bas, et la raison est mesurée : **TMDB ne publie pas
de `runtime` sur ce bis italien et espagnol**, donc le contrôle par durée,
le plus rentable ailleurs, n'a rien à mordre. Le réalisateur a pris le relais.

`editions.film_id` est `null` sur 858 lignes, ce qui ne veut plus rien dire :
la colonne est un vestige, le rattachement vit dans `edition_films`. Compter
les orphelines par `film_id is null` donne 858 au lieu de 416.

**Enrichissement TMDB du 30 juillet 2026.** 3 273 films portaient un `tmdb_id`
au lancement des passes ; les films créés depuis y échappent et devront être
repris. Titres étrangers : **3 093 films**, 180 sans, TMDB n'en propose aucun
dans les six langues retenues (`en`, `es`, `de`, `it`, `ja`, `pt`).

Le budget est le champ le moins couvert, et c'est normal : TMDB rend `0` quand
il l'ignore, et `0` est écrit `NULL` plutôt qu'affiché comme une mesure.

Trois campagnes : 1 893 → 1 256 puis **1 256 → 377** le 30 juillet 2026, puis
le crawl complet du 31 juillet, qui a fait entrer 2 732 éditions d'un coup et
laissé 751 orphelines sur 8 471, soit **91,1 % de rattachement**, contre 93,4 %
sur un catalogue deux fois plus petit la veille.

La seconde campagne est partie d'une relecture des pages blu-ray.com brutes
conservées dans `crawl/pages/`. Le parseur d'origine n'en gardait que le codec,
la résolution et les disques ; la page portait aussi un bandeau structuré
(studio, plage d'années, **nombre de films**, durée) et, sur les coffrets, la
liste de leur contenu avec un lien par film. C'est ce qui a débloqué le lot :
le nombre de films tranche entre édition simple et coffret sans avoir à
interpréter le titre, là où « Intégrale » ou « Collection » mentent une fois
sur deux.

Reste 530 orphelines après le 31 juillet : 365 blu-ray.com (surtout des
coffrets dont la page n'annonce pas le contenu) et 165 editioncollector.

---

## 5. Sources de données

### editioncollector.fr, 3 193 éditions
Source d'origine, et longtemps **seule à fournir des visuels**. Ce n'est plus
vrai : blu-ray.com en a donné 5 257 le 31 juillet 2026, et Le Chat qui fume
473 le 1er août.

**Les images ne sont plus en hotlink depuis le 31 juillet 2026.** Les 7 220 URL
distinctes ont été recopiées sur un bucket Cloudflare R2 et sont servies par
`img.jaquette.app` : 7 212 objets, 0,78 Go, egress gratuit et CDN devant le
bucket. Les huit manquantes étaient déjà mortes chez eux (trois 404, cinq 403),
donc cassées sur le site avant même la bascule ; leur `image_url` est passée à
`null`, une carte sans visuel se dégradant mieux qu'un visuel brisé.

**Une image qui répond 200 n'est pas forcément une image.** 328 éditions
pointaient vers `actularge.jpg`, un fichier de 3 155 octets, le même à l'octet
près sur les 328, empreinte SHA identique : c'est le visuel d'attente
d'editioncollector, recopié fidèlement par le miroir. À l'écran il donne un
appareil photo gris, indistinguable d'un bug. Le contrôle par code HTTP ne
suffit donc pas ; c'est le **poids répété à l'identique** qui trahit un fichier
d'attente.

326 de ces éditions portaient un vrai visuel dans `images_secondaires` :
`promouvoir_visuels.py` l'a promu en principal et retiré des secondaires. Les
deux sans rien sont passées à `null`.

**`image_url` et `images_secondaires` n'ont pas du tout la même taille.** La
principale est une vignette, 172 × 233 pixels, et il n'existe pas de version
plus grande : le même chemin sans le préfixe `vignette-` répond **404**. Les
secondaires, elles, sont les fichiers pleins, autour de 1 024 px. C'est ce qui
plafonne l'agrandissement de la visionneuse (cf. §8).

`editions.image_url_source` et `images_secondaires_source` gardent l'URL
d'origine, ligne à ligne : la bascule est réversible et l'appariement
vérifiable. Migration `20260731_images_miroir.sql`, scripts `miroir_images.py`
et `basculer_images.py`. Le site ne dépend donc plus d'un tiers pour ses
visuels, c'était le seul point où une décision extérieure pouvait tout casser
du jour au lendemain.

Leur `robots.txt` ne contient aucune règle `User-agent: *`, seulement deux
entrées SiteAuditBot. Rien n'interdit un crawl poli.

**Mise à jour incrémentale** : énumérer `/collectors?univers=films-series`
(89 pages, ~3 200 fiches), comparer aux `url_source` déjà en base. En juillet
2026 : 29 URL nouvelles, dont 10 liens de navigation et 6 produits dérivés,
soit 13 éditions réelles.

Ne pas se fier au sitemap : il annonçait 1 201 nouveautés, mais mêle figurines,
jeux et livres, et ne couvre que 1 477 URL sur 3 193.

### blu-ray.com, 2 546 éditions
Crawlé en juillet 2026, d'abord 3 100 fiches sur 5 486 seulement : le site
renvoyait **403** sur le User-Agent du robot. Blocage levé, vérifié à 200 avec
le même `Boxology-catalog-bot/1.0`, et **catalogue crawlé en entier le
31 juillet 2026, 5 917 fiches, zéro page abîmée**.

Méthode : cookie pays via `setcountry.php?country=fr`, puis pagination de
`movies.php`. Le sitemap seul ne donne pas le pays.

Apporte : EAN (72 %), date de sortie, zone, formats, **piste audio française
(77 %)**, packaging.

**Les visuels ont été récupérés le 31 juillet 2026**, alors que la note
précédente disait « pas de visuels, copyright ». 5 257 jaquettes sont dans le
bucket sous `bluray/covers/<bluray_id>_large.jpg`, appariées par
`editions.source_id`, le nom de l'objet porte l'identifiant, donc aucune table
de correspondance à tenir. Écrites par `basculer_visuels_bluray.py`, l'URL
d'origine conservée dans `image_url_source`.

C'est un changement de position assumé, pas un oubli : le §10 l'accompagne.

Ne pas contourner un blocage (proxy, VPN, changement d'UA, session du compte).
Le compte créé sur le site implique l'acceptation de leurs conditions.

**Leur `robots.txt` interdit nommément les agents Claude** : `ClaudeBot`,
`Claude-SearchBot`, `Claude-Web` et `Claude-Code`, tous en `Disallow: /`. Un
assistant ne doit donc pas récupérer leurs pages, quel que soit l'UA que le
script enverrait : c'est l'agent qui est visé, pas l'outil. Le crawl se lance à
la main. Le bloc `User-agent: *`, lui, n'interdit que `/cgi-bin/`,
`/community/*.php`, `/link/`, `/search/`, `/movies/search.php` et
`/news/search.php` : les fiches et `movies.php` restent ouverts, et aucun
`Crawl-delay` n'est imposé à `*` là où bingbot et Applebot en ont 10 s.

**`enum_fr.py` écrase `catalogue_fr.json`, il ne le fusionne pas.** Les deux
énumérations de juillet ne se recouvrent qu'à 5 050 sur ~5 480 : 436 fiches
connues sont sorties du listing, 431 y sont entrées. Le total presque identique
(5 486 contre 5 481) masquait complètement cette rotation, et prendre la
dernière aurait perdu une fiche sur huit. Le listing ne montre qu'une fenêtre ;
une fiche qui en sort n'est pas retirée du site. **Toujours fusionner, et
sauvegarder avant.** Union au 30 juillet 2026 : 5 917 ids.

Le script s'annonce par ailleurs comme Chrome, là où `crawl_fr.py` déclare le
robot. À aligner un jour : le 200 obtenu l'a été avec l'UA du robot.

### lechatquifume.com, 218 éditions, 1er août 2026

Boutique **Shopify**, donc le catalogue entier sort en JSON structuré, sans une
ligne de HTML à parser :

    /collections/all/products.json?limit=250&page=1

236 produits, une seule page. Leur `robots.txt` autorise `/collections/` et
`/products/` à `User-agent: *` et ne vise nommément aucun agent.

**C'est la première source à donner specs et visuel sur la même ligne.** Le
non-recouvrement total consigné plus haut, dates chez blu-ray.com contre images
chez editioncollector, ne vaut pas pour elle : `body_html` ouvre sur une ligne
technique et le produit porte ses packshots.

    36 Fillette - 1988 - 1h28 - Français - Format 1.66 - Version intégrale
    BLU-RAY - 1920x1080/24p
    Français en DTS-HD MA 2.0

Couverture sur les 222 disques : durée 90 %, année 85 %, résolution 84 %,
synopsis 86 %, ratio 39 %, EAN 37 %.

**L'EAN est dans `variants[0].sku`, pas dans la description.** 82 sku sont des
EAN 13, 127 des références de boutique à trois chiffres. Shopify n'expose pas
le champ `barcode` publiquement, ce qui fait croire à tort qu'il n'y a pas de
code-barres.

**`vendor` n'est pas l'éditeur, c'est l'ayant droit du film.** `36 Fillette` de
Breillat y est marqué `IMPEX`, `Blow Out` `MGM`, `Flaming Brothers`
`FORTUNE STAR`. Écrire `editeur = vendor` produirait 222 valeurs fausses. Les
vrais labels sont annoncés dans la description, en tête et **avant le RÉSUMÉ** :
`UNE ÉDITION BADLANDS`, `UNE ÉDITION INTERSECTIONS`, `DE L'ÉDITEUR NABAN`,
`MDC FILMS`. Quatre en tout, vocabulaire fermé relevé sur les 222 fiches.

`product_type` est vide sur 231 des 236 lignes, inexploitable, exactement comme
le champ `universes` d'editioncollector.

**Ils publient les captures d'écran du film dans le même tableau `images` que
les jaquettes.** Sur 1 044 images, 538 sont des photogrammes. Le tri se fait sur
le **nom de fichier**, jamais sur l'orientation : le packshot est carré
(1000×1000) et non portrait, tandis que `3D-OUVERTE` est paysage tout en étant
un vrai visuel produit. `IMAGEGRAB` et le ratio 1.78 en 1920×1080 signent la
capture ; `3D SIMPLE`, `OUVERTE`, `ETUI`, `SCANAVO` signent le boîtier.

Les 473 visuels retenus sont sur R2 sous `chat/<id produit>/<nom>`, 105 Mo,
`image_url_source` gardant l'URL Shopify.

**Le packshot carré passe dans le `object-cover` 2/3 du site sans rien changer
au code.** Le rognage est **latéral**, 16,7 % de chaque côté, et il mange la
marge blanche, pas le boîtier. Vérifié à l'image avant d'écrire. Un recadrage
automatique avait été envisagé puis écarté : leur fond est un **dégradé** gris
et non un aplat, donc la détection de contenu ne rogne rien sur les JPEG.

Cinq produits n'ont aucune image et aucune fiche : ce sont des titres à
paraître. `enum_chat.py` **fusionne** au lieu d'écraser, une repasse les
récupérera.

### metalunastore.fr, 242 éditions, 1er août 2026

Revendeur, pas éditeur, et c'est ce qui le rend utile : **il liste des
catalogues d'éditeurs entiers** que ces éditeurs ne vendent pas eux-mêmes.
Studiocanal n'a pas de boutique, Artus Films non plus.

Shopify, donc le même endpoint que Le Chat qui fume, plus
`/collections.json?limit=250` qui énumère les **154 collections**. Leur
`robots.txt` ne vise nommément aucun agent.

| collection | produits | état |
|---|---|---|
| Make My Day! | 94 | importée |
| Artus Films | 148 | importée |
| Criterion | 338 | marché US, région A |
| Carlotta, ESC, Rimini, Elephant, Sidonis, Potemkine, Extralucid | 1 284 | déclarées, jamais collectées |

**`store.potemkine.fr` a été écarté** pour le même besoin : leur `robots.txt`
met `ClaudeBot` en `Disallow: /`, comme blu-ray.com et dvdfr.

**Toutes les fiches suivent le même gabarit**, saisi par les mêmes gens, d'où
des scripts paramétrés et non un jeu par éditeur :

    Titre (année)
    de Réalisateur
    Éditeur - 16 juin 2026
    Titre Original :
    Durée : 243' ( 4h03 )
    Format : Combo Blu-ray + DVD
    Zone : B
    Genre : Drame

Couverture typique : réalisateur 99 %, durée 96 à 99 %, visuel 100 %. C'est la
**meilleure source du catalogue pour le rattachement**, parce qu'elle donne
d'emblée les deux mesures indépendantes qui valident un lien.

**`editeur` est déclaré dans `collectes.py`, jamais parsé.** La collection le
dit déjà, et le lire dans la fiche produisait `de Jess Franco Artus Films` :
quand réalisateur et éditeur tiennent sur une même ligne, un motif qui remonte
jusqu'au tiret avale les deux. Six lignes sur 148 étaient fausses.

**La durée s'écrit de deux façons**, `94 min` et `104' ( 1h44 )`, et n'en
connaître qu'une la fait passer pour absente : mesurée à 2 % avant correction,
99 % après.

**Le `sku` vaut `FILM` partout, il n'y a aucun EAN.** Le rapprochement avec
l'existant se fait donc sur `(source, source_id)` seulement : idempotent, mais
incapable de repérer un même disque déjà importé d'une autre source.

**Une fiche peut décrire un autre film que celui qu'elle vend.** `Navajeros`
d'Artus porte la description d'`El diputado`, deux films d'Eloy de la Iglesia.
Le nom du produit prime donc sur celui de la description.

Le **spine number** de Criterion, imprimé sur la tranche depuis 1984, n'est
pas publié par Metaluna : relevé sur 60 fiches, aucune ne le porte.

### TMDB
Métadonnées films et séries. Rattachement par titre **et année**.

Fournit aussi, dans le même appel que les crédits : titres traduits
(`translations`, et non `alternative_titles`, le second rend des variantes
d'écriture sans valeur pour la recherche), pays de production, budget,
compositeur, et la **sortie salle française** via `release_dates` filtré sur
`FR` et le type `3`. Ne pas prendre la première date française venue : sur
*3 Billboards*, le festival de La Roche-sur-Yon précède la sortie de trois mois.

Les noms de pays de `production_countries` sont en anglais quelle que soit la
langue demandée. `/configuration/countries?language=fr-FR` donne la table de
traduction.

### IMDb : écarté, et pourquoi
La question s'est posée le 30 juillet 2026 pour la page « technical » de leurs
fiches, qui porte ratio, HDR et pistes audio. **Trois voies, aucune ouverte :**

- **Scraper** : interdit noir sur blanc par leurs Conditions of Use, clause
  « Robots and Screen Scraping ».
- **Jeux de données gratuits** (`datasets.imdbws.com`) : licence *personal and
  non-commercial use only*, incompatible avec l'ambition d'affiliation. Et ils
  ne contiennent **aucune spec technique** : `title.basics`, `title.akas`,
  `title.ratings`, `title.crew`, `title.principals`, `name.basics`,
  `title.episode`, rien d'autre.
- **Licence commerciale** : tarification entreprise, hors de proportion.

Sans objet de toute façon : les specs sont déjà dans les 3 100 pages
blu-ray.com du cache, au niveau du disque, ce qu'IMDb ne donne pas. Ne pas
rouvrir le sujet sans raison neuve, et se rappeler qu'opposer une extraction à
IMDb, c'est la clause « Base de données » de nos propres mentions légales
retournée (cf. §10).

---

## 6. Scripts (`~/Documents/jaquette-scraping/`)

### Metaluna (`metaluna/`, 2026-08-01)

**Paramétrés par collection**, une seule chaîne pour 154 catalogues :

    python3 enum_metaluna.py artus-films
    python3 tri_metaluna.py artus-films
    python3 resoudre_metaluna.py artus-films
    python3 miroir_metaluna.py artus-films --apply
    python3 ecrire_metaluna.py artus-films --apply

| Fichier | Rôle |
|---|---|
| `collectes.py` | Table des collections : handle, éditeur, série numérotée |
| `enum_metaluna.py` | Énumère le JSON Shopify, **fusionne** |
| `tri_metaluna.py` | Relit le gabarit de fiche, mesure la couverture |
| `resoudre_metaluna.py` | TMDB **et contrôle**, en une seule passe |
| `miroir_metaluna.py` | Jaquettes vers `metaluna/<collection>/` sur R2 |
| `ecrire_metaluna.py` | Films, éditions et liens (`--apply`) |

**Une seule passe de résolution, contrôle compris**, là où Le Chat qui fume en
a demandé deux : la source donne réalisateur et durée dès la première
recherche, donc il n'y a pas à revenir plus tard chercher de quoi valider.

### Le Chat qui fume (`chat_qui_fume/`, 2026-08-01)

| Fichier | Rôle |
|---|---|
| `enum_chat.py` | Énumère le JSON Shopify, **fusionne** avec l'existant |
| `tri_chat.py` | Disques contre dérivés, packshots contre captures, relit la description |
| `resoudre_chat.py` | TMDB et doublons par EAN, **lecture seule** |
| `miroir_chat.py` | Visuels de boîtier vers R2, simulation par défaut |
| `ecrire_chat.py` | Films, éditions et liens (`--apply`), quatre garde-fous |
| `editeur_chat.py` | Renseigne `editeur` d'après les labels annoncés (`--apply`) |
| `relire_chat.py` | Reprend les orphelines par **contrôle de durée** (`--apply`) |

Résultat : 218 éditions, 197 rattachées (92,9 % hors dérivés), 194 films créés.

### Import blu-ray.com (2026-07)

| Fichier | Rôle |
|---|---|
| `enum_fr.py` | Énumère le catalogue FR via les listings |
| `crawl_fr.py` | Crawl reprenable, verrou `flock`, tranches d'1 h |
| `parseur.py` | Extraction des fiches (séparé exprès du crawl) |
| `import_1_charger.py` | JSONL → `bluray_import` |
| `import_1b_dedupliquer.py` | Classe `charge` en `a_creer` / `doublon` (`--apply`) |
| `import_2_resoudre.py` | Résolution TMDB, **lecture seule** |
| `import_3_ecrire.py` | Création films + éditions + liens |
| `import_4_titres.py` | Nettoyage des titres (`--apply` pour écrire) |

**L'étape 1b manquait**, et ne s'est vue qu'en rejouant la chaîne le 31 juillet
2026 : les fiches chargées restent en statut `charge`, que l'étape 2 ne lit pas.
Le tri avait été fait à la main en juillet. Elle écarte le rapprochement par
titre, qui avait produit 464 `a_verifier` jamais relus depuis, une édition en
double, visible et corrigeable, vaut mieux que deux produits fusionnés à tort.

Trois défauts silencieux corrigés dans la même reprise :

- **le détecteur de série ignorait les pluriels.** `\bseason\b` ne matche pas
  « Seasons 1 and 2 », ni `complete series` la mention « The Original TV
  Series ». `Defiance: Seasons 1 and 2` partait donc vers *Les Insurgés* (2008)
  et `Batman (The Original TV Series)` vers le film de 1989. 66 fiches remises
  dans le bon catalogue ;
- **`on_conflict=tmdb_id` ne correspondait à aucune contrainte** : l'unique
  index porte sur `(tmdb_id, type)` depuis juillet, et l'index des films
  existants, keyé sur `tmdb_id` seul, écrasait une série par un film du même
  numéro ;
- **une lecture qui échoue doit se voir.** `if st != 200: break` rendait une
  liste vide indistinguable d'un résultat vide, et a fait sortir un
  « editions a creer : 0 » sans un mot d'explication. La fonction sort
  désormais en erreur.

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

### Seconde campagne orphelines (`orphelines_2026_07_30/`)

1 256 → 377 orphelines, 879 rattachées, 920 films créés, en neuf passes de
résolution toutes en **lecture seule**, séparées de l'écriture.

| Fichier | Rôle |
|---|---|
| `extraire.py` | Relit les pages brutes : bandeau, nombre de films, liste de contenu |
| `resoudre.py` | Passe 1, normalisation, appariement par titre exact |
| `resoudre2.py` | Passe 2, mono-œuvres : deux catalogues, sous-titre français |
| `resoudre3.py` | Passe 3, coffrets sans liste : découpage du titre, collection TMDB |
| `reparer_genre.py` | Rejoue en série ce qui a été résolu en film à tort |
| `resoudre4.py` | Passe 4, troncature du titre par la tête, pour les séries |
| `resoudre5.py` | Passe 5, coffrets restants, contrainte d'années assouplie |
| `resoudre6.py` | Passe 6, découpage accepté même partiel, les deux sources |
| `resoudre_ec2.py` | editioncollector : bloc « Contenu : », préfixes d'édition |
| `resoudre7.py` | Passe 7, coffrets : `search/collection` par nom de saga |
| `resoudre8.py` | Passe 8, filmographie du réalisateur : **sans rendement**, gardé comme mesure |
| `jumelle.py` | Recopie les liens d'une édition jumelle, à compte égal |
| `contenu_ec.py` | Lit le bloc « Contenu : » d'editioncollector |
| `resoudre_ec3.py` | Passe 9, editioncollector : contenu relu, sagas développées |
| `filtrer_ec3.py` | Contrôle serré, faute de plage d'années sur ces fiches |
| `controler.py` | Trie en « sûr » et « à relire » avant écriture |
| `filtrer6.py` | Durcit la passe 6, la moins étayée |
| `ecrire.py` | Écriture (`--apply`), quatre garde-fous |

Les liens portent une source qui les rend isolables : `bluray_page` quand le
contenu du coffret est entièrement résolu, `bluray_page_partiel` sinon.

    GET /edition_films?source=eq.bluray_page_partiel

**La relecture s'est faite par lots de dix**, présentés dans des artifacts avec
le visuel du boîtier à gauche et l'affiche TMDB à droite. Le verdict revient
par un fichier que la page enregistre (`window.claude.downloads`) et non par
le presse-papiers, que l'iframe d'un artifact n'autorise pas de façon fiable.
Deux tentatives ont été perdues avant d'y arriver, dont une page de 2,6 Mo qui
a figé l'onglet : embarquer les images en base64 impose de les redimensionner.

`crawl/pages/` : 3 100 pages gzippées (170 Mo). Permettent de rejouer un
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
- Les sous-titres sortaient doublés : `French, English French, English`. La
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
`~/Library/LaunchAgents/app.jaquette.popularite.plist`, **lundi 10 h**, et
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

La passe repart de zéro à chaque fois, l'avancement sert à reprendre après une
coupure, pas à sauter les films vus la semaine d'avant. C'est bien tout le
catalogue qu'on veut réactualiser.

---

## 7. SEO

Chantier ouvert jusqu'en juillet 2026, désormais en place.

- **`src/app/lib/seo.ts`** : hook `useSeo`, pose titre, description, canonical
  et `og:` par page. Le canonical est **calculé depuis l'URL courante**, jamais
  passé en paramètre : une faute dans une page l'enverrait ailleurs.
- **`index.html` ne porte ni canonical ni `og:url`.** Une valeur en dur y
  ferait passer les 4 418 fiches pour des doublons de la racine. En l'absence
  de canonical, un crawler retient l'URL demandée, le bon repli. La Pages
  Function les ajoute par fiche au lieu de les modifier, en se raccrochant à
  `og:site_name`, une balise qui existe à coup sûr.
- **`sitemap.xml`** généré au build par `scripts/generer-sitemap.mjs` depuis la
  base. **5 446 URL** au 1er août 2026, contre 5 072 la veille et 2 105 avant
  les campagnes de rattachement du 30 juillet 2026. Seuls les films
  rattachés à une édition y figurent, en **adresse canonique avec slug**. Le
  script casse le build s'il ne trouve aucun film, et aussi si `films.slug`
  manque : voir plus bas pourquoi c'est le bon sens de la panne. Les pages fixes
  y sont listées à la main, `/bienvenue` comprise ; les regroupements sont lus
  dans la table générée.
- **Search Console** : propriété Domaine validée, sitemap soumis et lu.
- **Listes personnelles et écrans du prototype** en `noindex, follow`.

### Rendu du `<head>` à la périphérie, en place le 31 juillet 2026

`functions/_middleware.ts`, Pages Function Cloudflare. Elle lève la limite
consignée jusqu'ici : les scrapers de Facebook, iMessage et Discord
n'exécutant pas le JavaScript, ils ne voyaient que les `og:` génériques
d'`index.html`. Google rendait, mais avec une file d'attente de plusieurs jours
sur un catalogue de milliers de fiches.

Elle fait quatre choses, et **seulement sur `/films/`**. Tout le reste ressort
par `next()` au premier test :

1. l'adresse canonique d'une fiche est `/films/<slug>/<id>` ; toute autre forme
   part en **301** vers elle, chaîne de recherche conservée ;
2. un id inexistant répond un **vrai 404**, là où la réécriture SPA répondait
   200 sur une page vide, soit un « soft 404 » aux yeux de Google ;
3. `HTMLRewriter` remplit le `<head>` au vol, avec exactement les valeurs que
   `useSeo` posera ensuite côté client, plus le JSON-LD ;
4. **le corps est écrit dans `#root`**, depuis le 31 juillet 2026.

**Le corps, parce que le `<head>` ne suffisait pas.** Le corps servi faisait
48 octets, `<div id="root"></div>` et rien d'autre : un moteur qui n'exécute
pas le JavaScript n'avait aucun texte à lire, et une fiche ne pouvait pas
répondre à « dune steelbook 4k » alors qu'elle porte la réponse. On y écrit
titre, réalisation, note, durée, genres, synopsis, et la liste complète des
éditions avec formats, éditeur, date et EAN. De 48 octets à 2 000 en moyenne,
13 300 sur *Game of Thrones*.

**Ce n'est pas du cloaking** : c'est ce que React affiche, pas une version
enrichie pour les moteurs. `createRoot().render()` remplace le contenu du
conteneur au montage, il ne l'hydrate pas, donc le visiteur voit l'application
habituelle. Vérifié : un seul `<h1>` après montage, aucun reste du bloc injecté.

Pas de plafond sur la liste des éditions : le film le plus fourni en porte 61 et
deux seulement dépassent 30. Tronquer coûterait plus en exactitude que ça ne
gagnerait en octets.

**Le corps injecté et `FilmDetailPage` doivent dire la même chose**, et rien ne
le garantit : le rendre depuis les composants supposerait React dans le Worker.
Le bloc reste donc volontairement pauvre, pour que la dérive soit lente. Piège
déjà rencontré : l'année s'écrit `\u0020(2019)`, espace ordinaire, dans le
`<title>` et la description, et `\u00a0\u00a0(2019)`, deux insécables, en
graisse 200 dans le `<h1>`. Les deux formes existent dans le même fichier, à
quelques lignes d'écart, et les intervertir passe inaperçu.

**Toute erreur retombe sur `next()`.** Panne Supabase, réponse inattendue,
exception : on sert la page telle qu'elle était avant ce fichier. Éprouvé pour
de vrai avant la migration, colonne absente, PostgREST rendant 400 : la page
sort en 200. Le §9 garde la trace de deux mises à terre en une journée, on
n'ajoute pas un troisième point de rupture sur le chemin de consultation.

Contrepartie assumée : quand le repli joue, la page perd son enrichissement
**sans rien signaler**.

**Ne pas confondre le repli avec le déploiement en cours.** Après chacun des
trois déploiements du 31 juillet 2026, une requête sur quatre environ est
revenue sans la nouveauté du jour, pendant quelques minutes. Le réflexe est de
soupçonner le repli ; c'est faux, et la signature le prouve : ces réponses
portaient exactement l'état de la version **précédente**, jamais l'état de
départ. Après le déploiement du corps, elles avaient `<title>`, canonical et
JSON-LD, et un corps à 48 octets. Le repli, lui, aurait tout retiré d'un coup.

C'est donc la propagation d'une version à l'autre sur le réseau, et ça se
résorbe seul : mesuré `cf-cache-status: DYNAMIC` sans `age` sur les réponses
fautives, donc pas un cache à purger, puis 10 sur 10 et 12 fiches sur 12
quelques minutes plus tard. **Ne rien purger, ne rien corriger, attendre.**

Le vrai repli se reconnaît à ce qu'il retire tout : titre générique, ni
canonical, ni JSON-LD, corps vide. S'il apparaît à froid, longtemps après un
déploiement, c'est là qu'il faut regarder, et non du côté du rendu.

`wrangler pages dev dist` rejoue tout ça hors ligne, `functions/` compris.
C'est la seule façon d'éprouver ce fichier : le serveur Vite ne le voit pas, et
`tsconfig.json` ne couvre pas ce dossier, donc `tsc` ne le relit pas non plus.

### URL des fiches : `/films/<slug>/<id>`

Format repris de SensCritique. **Le slug est décoratif, l'id fait autorité.**
C'est ce qui règle trois choses d'un coup :

- `films.titre` est un instantané pris à l'import et il dérive, 89 titres
  réécrits le 30 juillet. Un slug seul aurait rendu ces URL caduques ; ici l'id
  continue de résoudre et la fonction redirige vers la forme courante ;
- les homonymes, deux *Dune*, deux *Nosferatu*, n'ont besoin d'aucun suffixe
  d'unicité bricolé, **donc aucune contrainte ni index sur la colonne** ;
- un titre qui ne produit aucun slug reste servable sous sa forme nue.

L'année est dans le slug : `dune-1984` et `dune-2021` se distinguent à l'œil
dans une page de résultats, `dune` et `dune` non.

`src/app/lib/liens.ts` est la seule fabrique d'URL de fiche. Un lien qui ne
connaît que l'id n'est pas une faute, il coûte une redirection ; passer l'objet
l'évite.

**La slugification est en SQL**, `public.slug_film`, posée par un déclencheur
`before insert or update`, si bien que les scripts d'import Python n'ont rien
à savoir. Migration `20260731_films_slug.sql`. Les pièges du §9 s'y appliquent
mot pour mot : l'apostrophe typographique de `L’Attaque des titans` doit se
replier comme la droite, et `Alien³` doit rendre `alien3` pour rester distinct
d'`Alien`. Vérifiée sur les 4 520 films : 4 504 slugs, aucun malformé, **16
vides** à titre non latin (japonais, chinois, hébreu, coréen) qui retombent sur
la forme nue.

**Ordre de déploiement, à ne pas inverser** : migration d'abord, code ensuite.
`reelio-db.ts` demande `slug` dans ses jointures ; déployé avant, le site
rendrait une erreur PostgREST sur le rail de l'accueil et sur la fiche film.
Le générateur de sitemap échoue exprès si la colonne manque, ce qui casse le
build et empêche le déploiement. C'est l'interlock voulu : mieux vaut un
déploiement qui ne part pas qu'un déploiement qui casse la consultation.

### JSON-LD, en place le 31 juillet 2026

Injecté par la même fonction. Le `<head>` servait du texte, ce bloc sert de la
donnée : que `7.901` est une note sur 10 portée par 29 867 votes, que Chris
Columbus est le réalisateur, et surtout que telle édition porte tel code-barres.

Deux natures de nœud dans un `@graph` : l'œuvre en `Movie` ou **`TVSeries`
selon `films.type`** (706 séries), et un `BreadcrumbList`. `og:type` suit le
même partage, `video.tv_show` ou `video.movie`. Un troisième, le `Product` par
édition, a été posé puis retiré le jour même : voir plus bas.

### Les nœuds `Product` ont été retirés, et il faut savoir pourquoi

Un nœud par édition à code-barres a été posé le 31 juillet 2026, puis **retiré
le jour même**. Le test en direct de la Search Console les a tous déclarés non
valides :

    Extraits de produits   3 éléments non valides
    « Il faut indiquer "offers", "review", ou "aggregateRating" »

Le reste du nœud était pourtant bien lu, `gtin13`, `image`, `brand`. C'est la
seule absence d'offre qui invalide.

**Aucune des trois issues n'est honnête ici.** On n'a pas d'avis. La note TMDB
porte sur l'œuvre, l'accrocher à un disque serait faux. Et `prix_editeur` est un
prix conseillé, pas une offre : le site ne vend rien, aucun programme Awin n'est
accepté, et déclarer une disponibilité qu'on ignore est exactement ce que Google
sanctionne.

Un balisage qui ne peut produire aucun résultat enrichi et qui laisse une erreur
permanente dans la Search Console est un passif : elle masquerait les vraies
erreurs plus tard. **L'EAN reste dans le texte du corps injecté**, donc lisible
par un moteur, ce qui préserve l'essentiel.

**Ne pas remettre de `Product` avant qu'un flux Awin soit accepté.** Ce jour-là
les offres seront réelles, le nœud redeviendra valide, et `gtin13` vaudra la
peine : 3 379 films sur 4 418 portent au moins un EAN, sur 5 305 au catalogue,
et ni TMDB ni SensCritique ne publient cette donnée. Détail à ne pas
reperdre : une édition doit porter **deux types**, `Product` et `CreativeWork`,
le second étant ce qui autorise `exampleOfWork` pour la rattacher à l'œuvre.
`isRelatedTo` attend un `Product` ou un `Service` et ne peut pas désigner un
film.

**Ce que le test valide aujourd'hui**, sur une fiche film :

    Google a accès à cette URL
    La page peut être indexée
    Fils d'Ariane      1 élément valide
    Extraits d'avis    1 élément valide

Le chevron ouvrant est échappé en `<` : un `</script>` dans un synopsis
fermerait la balise par surprise.

### Polices et visuel de partage, en place le 31 juillet 2026

Les polices sont **auto-hébergées** depuis `public/fonts`, quatre `woff2`,
sous-ensembles latin et latin-ext, sous SIL OFL 1.1. Elles venaient de Google
Fonts, et Inter par un `@import` CSS, le pire cas : la requête ne part qu'une
fois la feuille parsée, donc les allers-retours s'enchaînent au lieu de se
recouvrir.

Ce sont des **polices variables**, un fichier par sous-ensemble pour toute la
plage de graisses, d'où `font-weight: 200 800`. `unicode-range` est conservé tel
quel : c'est lui qui fait qu'un visiteur français télécharge 125 Ko et non 241.
Le `preload` ne porte que sur `latin`, avec `crossorigin`, **sans lequel le
préchargement ne correspond à rien et le fichier part deux fois**.

`public/og-jaquette.jpg`, 1200×630, 91 Ko. `twitter:card` promettait une grande
image depuis le début sans qu'aucune ne soit déclarée. Fabriquée par
`scripts/og/og-jaquette.html` et rendue par Chrome sans interface ; le source
est gardé, une capture d'écran aurait vieilli à la première retouche.

**Les fiches films remplacent ce visuel par leur affiche, elles ne l'ajoutent
pas.** Deux `og:image` sur la même page laisseraient chaque scraper choisir, et
ils ne choisissent pas tous pareil. Les dimensions suivent, l'affiche TMDB étant
servie en `w500`.

`/fonts/*` est couvert par le garde-fou du middleware au même titre que
`/assets/*` : mêmes chemins sans hachage, même réécriture SPA, donc même risque
d'empoisonnement pendant une propagation.

**Limites restantes** :

- **Pas de `lastmod` au sitemap.** Aucune colonne ne date une fiche film, et y
  mettre la date du build annoncerait à Google que 4 418 pages changent à
  chaque déploiement, ce qui est faux et se retourne contre nous. Demande une
  colonne `maj_le`.
- **`WebSite` + `SearchAction` : le sujet est clos, pas en attente.** Google a
  **supprimé la sitelinks searchbox en novembre 2023**. La déclarer ne produit
  plus rien, même maintenant que la recherche a son `?q=`. Ne pas rouvrir.

### Recherche dans l'URL, en place le 31 juillet 2026

`/?q=steelbook`. Posé pour l'usage et non pour le référencement : une recherche
s'envoie, se met en favori, et le bouton retour cesse de faire quitter le site.

**La page de résultats est en `noindex, follow`.** Une recherche interne est du
contenu généré à la volée, et Google demande explicitement de ne pas la faire
indexer ; `follow` reste, les liens vers les fiches doivent être suivis. Le
canonical est calculé depuis le seul `pathname` (`lib/seo.ts`), donc il vaut `/`
quelle que soit la recherche, sans rien à changer.

**Règle d'historique** : on empile une entrée quand la recherche s'ouvre ou se
ferme, on remplace tant qu'on l'affine. Empiler à chaque frappe rendrait le
bouton retour inutilisable ; toujours remplacer ferait quitter le site depuis
une recherche.

### Tolérance aux fautes de frappe, en place le 1er août 2026

« Intrestellar » rendait une page vide. Deux lettres interverties suffisent à
casser une sous-chaîne, et un `ilike` n'a aucun moyen de les rattraper, ni sur
le titre ni sur le slug.

`pg_trgm` et `unaccent` sont installés dans `extensions`, deux index GIN sur
`sans_accents(titre)` et `sans_accents(titre_original)`, et une fonction
`public.recherche_films_approchante(terme, limite)` exposée en RPC.
Migration `20260801_recherche_approchante.sql`.

**`word_similarity`, pas `similarity`.** La seconde compare les deux chaînes
entières, donc s'effondre dès que le titre est plus long que la saisie :

| saisie | titre | word | globale |
|---|---|---|---|
| seigneur des aneaux | Le Seigneur des Anneaux : La Communauté… | 0,864 | 0,463 |
| amelie | Le Fabuleux Destin d'Amélie Poulain | 1,000 | 0,206 |
| Intrestellar | Interstellar | 0,529 | 0,529 |

**Seuil à 0,5, et le défaut de 0,6 ne convenait pas** : il laissait justement
« Intrestellar », à 0,529, hors du filet. Le bruit mesuré reste loin dessous,
« inception » contre *Interstellar* vaut 0,200.

**Deux étages, l'exact d'abord, l'approchant en repli sur zéro résultat.** Une
recherche par trigrammes menée d'emblée reclasserait par proximité un lot que
l'utilisateur a désigné sans se tromper, et ferait passer *Matrix Reloaded*
devant *Matrix* sur une saisie parfaite. Le repli ne coûte donc rien tant que
la frappe est juste.

**Passer par l'opérateur `<%` et non par `word_similarity(...) >= 0.5`** : seul
l'opérateur emprunte l'index GIN. Mesuré sur les 4 939 films, la comparaison
explicite balaie la table en **145 ms**, l'opérateur rend la même ligne en
**20 ms**.

Deux pièges de déclaration, tous deux rencontrés :

- **`set pg_trgm.word_similarity_threshold` dans un `create function` échoue en
  `42501 permission denied to set parameter`** tant que la bibliothèque n'est
  pas chargée dans la session : le paramètre n'est alors qu'un préfixe inconnu,
  et poser un paramètre personnalisé demande le superutilisateur. Un
  `select extensions.show_trgm('amorce')` en tête de migration la charge.
- **`search_path` vide vaut aussi pour les opérateurs.** D'où
  `operator(extensions.<%)` en toutes lettres, sans quoi rien ne résout `<%`.

Le repli **se dit à l'écran**, « Aucun titre ne correspond exactement à… » :
rendre *Interstellar* sans un mot laisse croire que le titre s'écrit ainsi.

En dessous de **quatre caractères**, le repli ne se déclenche pas : une saisie
si courte n'est pas une faute, c'est un début de mot.

### Pages de regroupement, en place le 31 juillet 2026

78 pages : `/formats`, `/editeurs`, `/genres` et leurs 75 entrées.

**Elles existent d'abord pour le crawl, pas pour la requête.** La profondeur de
clic du site était : accueil, 50 films, mur. Le reste du catalogue n'existait
que par le sitemap, donc ne recevait aucun jus de lien. Accessoirement elles
répondent à « steelbooks 4K » ou « éditions Carlotta », qu'aucune fiche film ne
peut capter. Les trois sommaires sont liés du **pied de page**, qui est sur
toutes les pages : c'est le seul endroit qui garantisse au crawler d'y arriver
depuis n'importe quelle fiche, et chaque page liste les autres entrées de son
axe pour qu'aucune ne soit une impasse.

**Trois axes, après mesure.** Seuil à dix entrées, en dessous la page serait du
contenu mince, c'est-à-dire l'erreur qu'on vient d'écarter sur les éditions :

| axe | pages | tête |
|---|---|---|
| format | 9 | Blu-ray 5 950, Blu-ray 4K 2 632, Steelbook 1 766 |
| éditeur | 43 | Warner 310, Studio Canal 249, Le Chat qui fume 182, Artus Films 152 |
| genre | 23 | Drame 1 863 |

Le seuil écarte aussi le bruit de saisie sans qu'on ait à le lister : `4K Ultra
HD` à six lignes est un doublon de `Blu-ray 4K`, il tombe tout seul.

`packaging` et `resolution` sont **écartés**. Le premier compte 114 valeurs en
texte libre anglais, `Figure/replica/props/memorabilia included`, et recoupe les
formats ; le second n'a aucune intention de recherche derrière lui.

**La table slug vers libellé est générée puis commitée**, pas calculée au rendu :
`scripts/generer-regroupements.mjs` écrit `src/app/lib/regroupements.ts`. Trois
raisons : un slug d'URL doit être stable, la page d'index n'a alors aucune
requête à faire avant de s'afficher, et PostgREST ne sait pas rendre un
`distinct` sans vue dédiée. Elle se périme, c'est assumé et visible : un éditeur
qui arrive au catalogue n'a pas de page tant que le script n'a pas tourné.

**Le middleware importe cette table**, il n'en recopie pas une seconde. Les
Pages Functions passent par esbuild et `regroupements.ts` ne dépend de rien, ni
React ni navigateur, donc l'import fonctionne. Une copie dériverait au premier
ajout d'éditeur et la dérive serait invisible. Le sitemap, lui, lit le fichier
en texte pour la même raison : la liste des slugs a une seule source.

Ces pages reçoivent le même traitement que les fiches, head, corps et JSON-LD
`CollectionPage` avec son `ItemList`, plus un vrai 404 sur un slug hors table et
sur une profondeur excessive comme `/formats/a/b`. **Sans ça elles seraient
invisibles des moteurs, donc inutiles** : c'est toute leur raison d'être.

**Ces pages ne sont pas en `lazy()`, et ça a coûté une panne de l'apprendre.**
Posées en chargement à la demande comme les autres pages secondaires, le morceau
`RegroupementPage` s'est retrouvé **empoisonné en cache dans les minutes suivant
sa mise en ligne** : demandé pendant la fenêtre de propagation, il n'existait pas
encore à cet edge, la réécriture SPA a répondu `index.html` sous son nom, et la
règle `/assets/*` l'a estampillé pour 24 h. Les 72 pages rendaient un écran vide
sur `Failed to fetch dynamically imported module`.

Signature du §9 à l'identique, et vérifiée : la même URL rend `text/html` sans
paramètre et `application/javascript` avec `?x=1`, donc le fichier existe et
seul le cache est en cause. `cf-cache-status: HIT`, `max-age=86400` : il ne se
serait pas réparé avant le lendemain.

Les embarquer dans le bundle initial coûte **3,3 Ko compressés**, 92,63 à 95,86,
et c'est en même temps le correctif : le morceau cesse d'exister, il n'y a rien
à purger. **Toute page d'entrée depuis un moteur doit suivre cette règle** :
c'est un chemin de consultation, et le §9 interdit déjà qu'un chemin de
consultation dépende d'un `import()`.

À retenir pour la prochaine fois : **un morceau `lazy()` neuf est exposé à ce
piège à chaque déploiement qui l'introduit**, parce qu'il suffit d'une visite
pendant la propagation. Le risque ne concerne pas les morceaux déjà en ligne,
dont le nom ne change pas.

**Les éditions illustrées remontent en tête sur les pages de format**,
`order=image_url.asc.nullslast`. Ce n'est pas de la coquetterie : les visuels
sont chez editioncollector et les specs chez blu-ray.com sans recouvrement (§3),
donc sans ce tri `/formats/steelbook` s'ouvrait sur soixante lignes de texte nu.
Les pages d'éditeur étaient entièrement blu-ray.com, donc sans image, la
vignette retombant sur l'affiche du film. **Ce n'est plus vrai depuis le
1er août 2026** : `/editeurs/le-chat-qui-fume` porte 188 éditions, toutes
illustrées, et c'est la première page d'éditeur à montrer des boîtiers.

#### Pagination, en place le 31 juillet 2026

`/formats/blu-ray` couvre ses **93 pages**, `/genres/horreur` ses 10. Le sitemap
passe de 4 661 à **5 072 URL**, dont 411 pages suivantes, puis 5 446 après les
trois imports du 1er août 2026.

**Un quatrième axe `/collections` a été écarté le 1er août 2026**, alors même
que `collection_editeur` venait d'être remplie. Il n'aurait porté qu'une seule
entrée, or chaque page de regroupement doit lister les autres entrées de son
axe pour n'être pas une impasse, et le sommaire aurait tenu en un lien.
`editeur` faisait déjà le travail : remplir la colonne a suffi à créer
`/editeurs/le-chat-qui-fume` et `/editeurs/intersections` au build suivant,
sans une ligne de front. **Rouvrir le jour où une deuxième collection numérotée
entre au catalogue**, Criterion ou Make My Day!.

`/genres/horreur` pour la première page, `/genres/horreur/3` ensuite. **Pas de
`/1`** : deux adresses pour le même contenu sont deux doublons, et le middleware
redirige la forme longue vers la courte en 301. Le numéro entre dans le titre à
partir de la deuxième page, sinon 93 pages porteraient le même et Google les
traiterait en doublons. Canonical auto-référent, `rel="prev"` et `rel="next"`
posés pour Bing, que Google n'exploite plus depuis 2019.

Le total vient de `content-range` avec `Prefer: count=exact`. Il est
indispensable pour savoir combien de pages existent, donc quand répondre 404.
**Le décompte reste juste malgré `edition_films!inner`** : PostgREST rend un
film par ligne, ses liens dans un tableau imbriqué, jamais un produit
cartésien. Vérifié, il n'y avait aucun doublon à écarter.

Le JSON-LD compte en absolu : sur la page 3 le premier élément est le 121ᵉ, et
`numberOfItems` porte le total de la sélection, pas les 60 de la page.

**Deux pièges, tous deux rencontrés :**

- **PostgREST répond 416 quand l'`offset` dépasse le total**, en mettant quand
  même le total dans `content-range`. Traité comme une erreur, le repli servait
  la page générique en 200, soit un « soft 404 » sur `/formats/blu-ray/94`. Ce
  n'est pas une panne, c'est la réponse à « page 94 sur 93 ».
- **Le tri secondaire par `id` n'est pas décoratif.** Sans ordre total,
  `offset` s'applique à un ensemble non ordonné et PostgREST répète et saute des
  lignes, piège déjà consigné au §9. Vérifié sur trois pages consécutives :
  180 éditions distinctes, zéro répétition.

`src/app/lib/pagination.ts` porte le calcul des adresses et la fenêtre de
numéros, **sans aucune dépendance**, pour que le middleware l'importe au lieu
d'en recopier une version qui dériverait sans que ça se voie.

Limite restante : le sitemap enferme les effectifs au moment du build, donc une
page suivante peut disparaître entre deux déploiements et rendre 404 le temps
qu'il soit régénéré.

### Pages éditions : écarté, et pourquoi

L'idée revient naturellement, `editions.slug` existant déjà sans être lu nulle
part : une URL par édition, soit 8 471 pages neuves. **Mesuré le 31 juillet
2026, ça ne tient pas.**

| | |
|---|---|
| éditions | 8 471 |
| **sans rien de technique** | **5 925** (70 %) |
| avec specs (résolution, audio, ratio) | 2 530 |
| avec visuel | 3 188 |
| **avec specs *et* visuel** | **0** |

Trois raisons, dans l'ordre de gravité :

- **Le non-recouvrement du §3 est total, pas approximatif.** Zéro édition porte
  à la fois une jaquette et une fiche technique : les specs viennent de
  blu-ray.com qui ne publie aucune image, les visuels d'editioncollector qui ne
  publie aucune spec. Aucune page édition ne pourrait montrer les deux.
- **70 % seraient du contenu mince** : un titre, parfois une image, parfois un
  EAN. Six mille pages de ça, c'est ce que le système « contenu utile » de
  Google sanctionne, et la sanction porte sur le site entier.
- **2 583 films sur 4 418 n'ont qu'une seule édition** (58 %). Pour eux la page
  édition serait un doublon de la fiche film : deux URL faibles qui se disputent
  « dune steelbook 4k » au lieu d'une qui la gagne.

L'argument qui avait porté l'idée était « ×3 la surface indexable ». C'est du
raisonnement au volume, et depuis les mises à jour « contenu utile » le volume
de pages minces est un passif, pas un actif.

**Ce qu'il fallait faire à la place** était l'injection du corps : la fiche film
*contient déjà* ce qu'une page édition dirait, elle ne le montrait simplement
pas au crawler.

---

## 8. Chantiers ouverts

### Décisions en attente sur les orphelines
Il reste **751 éditions sans film** après le crawl complet du 31 juillet 2026 :
585 blu-ray.com et 166 editioncollector. Le catalogue ayant doublé, le nombre
absolu remonte alors que le taux de rattachement se tient à 91,1 %.

Ce que la relecture des cas ambigus a appris, le 31 juillet : **le sous-titre de
la page porte souvent la réponse.** `Train to Busan Blu-ray (SteelBook)` annonce
« 2 Movies » sur un disque unique de 118 min, ce qui paraissait absurde, son
sous-titre dit `incl. Seoul Station`, le préquel animé de la même année. Le
contrôle automatique avait bien refusé le candidat *Peninsula* (2020),
postérieur au disque, mais il ne savait pas quoi mettre à la place. Même leçon
qu'ailleurs : relire la page, pas le champ qu'on en avait extrait.

État de la campagne précédente, pour mémoire :

- **116 coffrets blu-ray.com sans liste de contenu** : `Ozu en 20 films`,
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
  résultat, et choisir un sous-ensemble reviendrait à deviner, c'est ce qui a
  produit le lot `probable`, faux à 15 %. Mesuré par `resoudre8.py`, gardé pour
  ne pas refaire l'essai.
- **166 editioncollector** : pas de page brute conservée, et `contenu_brut`
  mêle packaging et œuvres dans la même liste à puces. La neuvième passe en a
  repris 29 (111 liens) en lisant ce bloc autrement : voir le piège des lignes
  de contenu plus bas.
- **37 films et 25 séries** : surtout des opéras, des concerts et des captations
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
  `auth-js` seul et chargé à la demande, +0,75 Ko compressé au bundle initial,
  le reste dans un morceau séparé de 24,5 Ko. Parcours exercé de bout en bout en
  production : connexion, écriture, cloisonnement entre comptes, suppression.
- **Toute action demande un compte.** `collections.ts` lève `CompteRequis`,
  l'interface ouvre `ModaleConnexion`. Le site n'écrit plus rien dans
  localStorage : `local-statuts.ts` ne garde que lecture et effacement, pour
  reprendre une fois les listes d'avant à la première connexion.
- **La consultation reste publique** : c'est la condition de l'indexation, donc
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
  symphonie de l'horreur » sont des films. Les concerts, eux, sont gardés, TMDB
  les référence.

### Page de bienvenue, en ligne le 31 juillet 2026

`/bienvenue`, `src/app/pages/BienvenuePage.tsx`, **embarquée dans le bundle
initial** (6,6 Ko compressés). Liée du pied de page et du sitemap.

Elle a d'abord été posée en `lazy()`, et elle est tombée sur le piège du §9 comme
les pages de regroupement avant elle : un écran vide chez qui avait demandé son
morceau pendant la propagation. C'est une porte d'entrée, donc un chemin de
consultation, donc pas d'`import()` sur son chemin.

**Le catalogue reste l'accueil.** C'est lui qui s'indexe, et on entre sur le
site par une fiche film. `/bienvenue` est l'autre porte : celle qu'on donne en
lien quand on présente le site. Structure calquée sur la page d'accueil de
Letterboxd : héros, six étapes numérotées à ancre propre (`#posseder`,
`#envies`, `#comparer`, `#fiche-technique`, `#coffrets`, `#compte`), tour des
grandes sections, puis l'invitation à créer un compte. Elle vient en dernier :
on ne demande un compte qu'après avoir montré à quoi il sert.

**Vignettes bâties, pas capturées.** Une capture vieillit à la première retouche
d'interface. Les blocs emploient les jetons du site et lisent titres, visuels et
formats en base. Les exemples sont **désignés par identifiant** et non par
titre, un titre en base est un instantané d'import et bouge. Ils se répondent
d'une étape à l'autre : Blade Runner 2049 pour la collection puis la
comparaison, le coffret Petrol Tank et ses quatre Mad Max pour les coffrets.
Étiqueter des éditions réelles « steelbook » ou « coffret » au hasard serait
faux à l'écran même si le propos est juste.

**Colonne de texte fixe, vignette libre.** Le texte fait 400 px à partir de
`lg` et 440 à partir de `xl`, identique sur les six étapes : la mesure de
lecture se remarque d'un bloc à l'autre. La vignette prend le reste et porte sa
propre largeur, de 500 à 644 px, parce que ces blocs montrent des objets de
formats très différents, une jaquette, une liste de trois lignes, un tableau de
six, et qu'une largeur unique en étirait certains dans le vide.

**La vignette est collée au texte, pas au bord de l'écran.** L'écart vaut 48 px
partout. L'inverse a été essayé, cadres plaqués au bord extérieur : l'écart au
texte devenait le reste de la ligne et variait de 48 à 192 px sans raison
visible. Le corollaire est assumé, les cadres ne finissent pas sur la même
verticale, mais un bord extérieur irrégulier ne se lit pas, un écart au texte
qui saute d'une étape à l'autre si.

**Aucune hauteur imposée**, et c'est un revirement : une hauteur commune de
360 px a tenu quelques heures, elle donnait un beau rythme mais réduisait les
jaquettes pour les faire rentrer et laissait les blocs courts à moitié vides.
Les visuels sont maintenant dimensionnés pour se voir (jaquette de la collection
à 228 px, coffret à 200, vignettes d'envies à 60) et les hauteurs vont de 302 à
455 px.

Ce que l'épisode laisse : **élargir un cadre grandit ce qu'il contient.** La
comparaison d'éditions débordait dès que son cadre gagnait 40 px, ses quatre
jaquettes suivant la largeur. Le cadre étant en `overflow-hidden`, le
débordement se coupe sans rien signaler : comparer `scrollHeight` et
`clientHeight` sur les six après chaque retouche.

`grid-cols-1` est explicite pour le téléphone : sans lui la colonne implicite se
dimensionne sur son contenu, et chaque vignette prenait une largeur différente.

Les icônes qui ouvrent un bloc suivent la même échelle que l'accueil : 22 px
dans une pastille de 44 sur les cartes de section, 20 dans 40 sur « Bon à
savoir ». À 16 dans 32 elles se lisaient comme des puces de liste plutôt que
comme l'illustration du bloc.

**Les vignettes débordent de 80 px du côté opposé au texte**, à partir de `xl`
seulement. En dessous, la gouttière du conteneur est plus étroite que le
débordement et la vignette sortirait de l'écran. Une marge en pourcentage ne
convient pas : elle se résout sur le bloc conteneur, donc sur la colonne de
grille et non sur la page, et la vignette est sortie de 283 px hors cadre avant
qu'on le voie.

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

### Direction artistique, arrêtée le 30 juillet 2026

Le diagnostic de départ était « ça fait IA ». La cause n'était pas le nombre de
badges mais qu'**une seule forme servait à tout** : genres, acteurs, formats,
zones, filtres, tous la même capsule. L'œil ne pouvait plus distinguer ce qui se
clique de ce qui se lit.

**Règle, révisée le 1er août 2026 : la capsule dit une propriété relevée à la
source, pas seulement ce qui se clique.**

La règle d'origine réservait la capsule au cliquable, et rangeait genres,
distribution et métadonnées d'édition en texte à points médians. Elle a tenu un
jour et demi, puis les lignes d'édition sont repassées en badges : format, zone,
pays. Ce n'est pas un revirement de goût, c'est que la règle visait mal.

**Ce qui faisait « IA », c'était une forme unique pour des natures différentes**,
pas la capsule elle-même. Or `Blu-ray 4K`, `Zone B` et `France` sont bien de même
nature, trois valeurs discrètes tirées d'un champ de la source, et la capsule les
sépare mieux qu'un point médian, qui les fond en une phrase.

Ce qui reste en texte, et pourquoi :

| | |
|---|---|
| année de parution | c'est une date, pas une propriété du disque |
| code-barres | valeur unique, on la lit chiffre à chiffre |
| genres, distribution | appartiennent à l'œuvre, pas à l'édition |

**Le risque assumé** est que les badges d'une ligne d'édition tombent sous la
rangée de filtres de format, qui a la même forme et se clique, elle. Ils sont
donc plus petits, 12 px contre 13, et sans état de survol. Si la confusion se
voit à l'usage, c'est le filtre qu'il faudra changer, lui seul ayant un état
actif à montrer.

**Typographie.** Bricolage Grotesque (`--reel-font-titre`) sur les titres et le
mot-symbole, Inter pour le corps ; une grotesque à fort caractère fatigue sur un
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
couleur** : c'est ainsi qu'on a trouvé l'échec AA.

**L'image de l'œuvre porte l'identité.** Le héros de la fiche film affiche le
`backdrop_url` TMDB, traité en atmosphère et non en illustration : opacité 0,38,
léger flou, saturation réduite, plus deux dégradés : un horizontal qui donne au
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

Une fiche unique mélangeait ce qui relève de l'œuvre (réalisation, année,
genres, titres étrangers, identiques quel que soit le disque) et ce qui relève
du support (définition, HDR, pistes audio, qui changent d'une édition à
l'autre). Les séparer dit d'où vient chaque ligne.

L'ordre et le vocabulaire de « L'œuvre » sont calqués sur la fiche technique de
**SensCritique**, prise comme référence : titre original, titres alternatifs,
genres, année, pays, durée, dates de sortie, réalisateur, scénariste,
producteurs, distributeur, budget, bande originale. Leur page ne contient
**aucune spec technique** : leur « fiche technique » est notre bloc de gauche,
et le bloc de droite n'a pas d'équivalent chez eux.

Le distributeur manque et manquera : **TMDB ne le publie pas.**
`production_companies` liste les sociétés de production, qui ne sont le
distributeur que par coïncidence. L'éditeur vidéo de blu-ray.com le remplace, et
il est dans le bloc de droite, il qualifie le disque, pas l'œuvre.

La distribution est en grille de portraits et non en liste : empilée, elle
tenait dans une demi-colonne mais lisait comme un annuaire, et les visages se
réduisaient à des pastilles d'initiales de 36 px. Le rapport 2/3 est imposé même
sans photo, sinon les cartes sans image remontent et désalignent les noms.

**Page d'accueil déconnectée, refaite le 31 juillet 2026.** Elle ouvrait sur
« Parcourir les films » et une grille alphabétique : le premier écran d'un
catalogue de 5 700 éditions montrait *…Et pour quelques dollars de plus* et
*[REC]*. Structure reprise de **SensCritique** et de **Letterboxd** (accroche
illustrée, contenu, encart d'inscription, arguments), adaptée au sujet : ici
l'objet montré est la jaquette, pas la critique.

Cinq sections : accroche avec mosaïque d'affiches et recherche, dernières
parutions en rail, invitation à créer un compte, trois arguments, catalogue.

**Échelle revue le 1er août 2026.** Le premier réglage, calqué sur la sobriété
de Letterboxd, était descendu trop bas : à l'usage, les libellés de section et
les icônes se lisaient comme des notes de bas de page. Libellés à 15 px au lieu
de 13, icônes d'argument à 26 au lieu de 20, champ de recherche à 680 × 60 avec
son texte à 17 px et sa loupe à 22. Le rapport à la jaquette est préservé, c'est
elle qui porte toujours le regard.

La ligne « Consultation libre, sans compte » sous le bouton d'inscription a été
retirée : la page entière se consulte sans compte, le dire à cet endroit
soulevait un doute que rien n'avait installé.

**L'encart d'inscription vient après les parutions**, jamais avant : on demande
un compte à quelqu'un qui a déjà vu ce que le site contient. Il n'apparaît
qu'une fois la session résolue (`session === null`), sinon il s'affiche puis
disparaît sous les yeux d'un visiteur déjà connecté.

**Dès qu'on tape dans la recherche, tout le reste s'efface.** Quelqu'un qui
cherche un titre veut son résultat, pas une page d'accueil autour. Et la
recherche explicite reste **alphabétique** (on cherche un titre connu, l'ordre
attendu est celui du dictionnaire), là où le catalogue par défaut est classé par
`popularite`.

`nulls: "last"` est indispensable sur ce tri : PostgreSQL classe les nuls en
premier sur un `desc`, et la page se serait ouverte sur les fiches les moins
renseignées.

**Aucun filtre CSS dans le héros, et c'est délibéré.** Un `backdrop-filter` sur
le voile d'abord, puis un `filter: blur()` sur les affiches, ont tous deux laissé
la page **dédoublée et décalée d'une centaine de pixels** : les deux forcent une
couche de composition sur toute la largeur, où le navigateur laisse des tuiles
périmées quand la mise en page se décale, apparition d'une barre de défilement,
changement de largeur. L'atmosphère passe par l'opacité et deux dégradés, comme
sur la fiche film. Le titre reprend l'échelle de `/bienvenue`,
`clamp(38px, 6vw, 68px)` : deux pages qui ouvrent le site ne peuvent pas
annoncer deux tailles.

### Gouttière, arrêtée le 1er août 2026

`.reel-gouttiere` dans `theme.css`, une classe pour tout le site.

**La marge est une proportion, pas un nombre de pixels.** Un plafond en pixels
avec un rembourrage fixe, `max-w-[1440px] px-4 sm:px-6 lg:px-10`, donne une
marge généreuse sur grand écran, où le plafond mord, et presque rien juste en
dessous : à 1 440 px de fenêtre il restait 40 px de chaque côté, soit 2,8 % de
la largeur, et la page touchait les bords.

    clamp(880px, 68%, 1760px)

16 % de marge de chaque côté. Le plancher de 880 px évite qu'à 1 024 la
proportion ne laisse que 696 px de contenu, le plafond de 1 760 px évite la
ligne illisible au-delà de 2 588 px. En pourcentage et **non en `vw`**, qui
compte la barre de défilement et déborderait de quelques pixels. Sous `lg` la
gouttière reste en pixels : sur un téléphone la proportion mangerait la moitié
de l'écran.

Elle remplace une douzaine de conteneurs recopiés page par page, qui avaient
fini par diverger : le bandeau montait à `lg:px-16` là où le contenu restait à
`lg:px-10`, donc **le mot-symbole ne tombait pas sur la même verticale que le
titre juste dessous**.

### `RailHorizontal`

Partagé entre la distribution de la fiche film et les parutions de l'accueil.

Ses flèches se centrent sur **l'image mesurée** de la première carte, et non sur
un pourcentage de hauteur : le `34 %` d'origine visait le portrait d'un acteur
et tombait au-dessus des jaquettes, plus hautes. Mesurer libère le composant de
la forme de ce qu'il transporte.

**La rangée tient dans la colonne, des deux côtés.** Trois variantes ont été
essayées avant d'y revenir, et elles sont consignées parce que l'idée de faire
déborder un rail revient naturellement :

| variante | ce qui cloche |
|---|---|
| débord des deux côtés | une jaquette dans la marge se lit comme une fuite |
| débord à droite seulement | même défaut, à droite |
| voile dilué vers l'intérieur | carte fantôme à mi-teinte au milieu du cadre |

La marge est vide parce que toute la page est alignée dessus. Une jaquette qui
l'occupe, même à demi effacée, se voit. C'est le seul point qui compte, et il ne
se déduit pas d'un raisonnement sur le débordement : il s'est vu à l'écran.

Le débord coûtait par ailleurs `margin-inline: calc(50% - 50vw)`, donc une
mesure en `vw`, donc la gouttière en `vw` pour rester alignée, donc un
`overflow-x: clip` sur le corps pour rattraper la barre de défilement. Trois
réglages en cascade pour un effet qui ne tenait pas.

**Voile court aux deux bouts**, 88 px, plateau opaque de 32. Le rail étant
tranché net sur la verticale du titre, une jaquette coupée en plein milieu de
son image se lit comme un défaut d'affichage ; le voile lui rend une fin. Court,
parce que ce qu'il faut voiler est la tranche, pas la carte. Il n'a pas à servir
de fond à la flèche, qui porte le sien.

**Voile et flèche montent avec le défilement**, sur 90 px, en `1 - (1 - t)²`.
Ils apparaissaient sur un `scrollLeft > 1`, donc un pixel faisait surgir un
disque de 44 px. Deux valeurs écartées : 140 px laissait la jaquette à découvert
le temps que le voile monte, 40 px se lisait comme un déclic. **Le défaut n'était
pas la durée mais la rampe linéaire**, qui monte à vitesse constante puis
s'arrête net à 1.

### Visionneuse d'images, en place le 31 juillet 2026

`src/app/components/Lanterne.tsx`. L'affiche du héros et chaque vignette
d'édition s'ouvrent en grand. Le site montre des objets physiques dont le détail
est l'intérêt, la tranche d'un steelbook, la mention « édition limitée »
imprimée en petit, et la vignette de 56 px de la liste n'en montrait rien.

Une édition ouvre `image_url` puis ses `images_secondaires` (dos, tranche,
intérieur), avec flèches, clavier et compteur. 2 877 éditions en ont.

**Une seule dimension est pilotée, la largeur ; la hauteur suit le rapport.**
C'est ce qui rend la déformation impossible. Les trois limites entrent dans le
même `min()`, la contrainte verticale étant traduite en largeur :

    min(92vw, natif × 2,2, calc(82vh × rapport))

Un `max-height` avait été essayé d'abord et **écrasait les affiches** : il
rattrape la hauteur sans toucher à la largeur déjà imposée. Ne pas y revenir.

**Le plafond de 2,2 vient de la source, pas du goût.** Les `image_url`
d'editioncollector sont de vraies vignettes, 172 × 233, et il n'existe pas de
version pleine taille : le même chemin sans le préfixe `vignette-` répond
**404**. Les étirer à l'écran donnerait une bouillie. Les `images_secondaires`,
elles, font 1 024 px et ne sont pas concernées par ce plafond.

`max-width` seul ne suffit pas : une image se rend à sa taille native tant qu'on
ne lui impose pas une largeur, et la vignette restait à 180 px malgré la place.

Trois détails qui ne se devinent pas à la relecture :

- le défilement de la page est bloqué à l'ouverture, **avec compensation de la
  barre** (sans elle, la masquer élargit la page et tout le contenu saute) ;
- le fond ferme, l'image non : on clique dessus pour regarder de plus près ;
- le sous-titre donne le nom de l'édition, qu'une jaquette agrandie et sortie de
  sa liste ne dit plus.

#### Flèches sous l'image en mobile

Sur un écran de 375 px la jaquette occupe presque toute la largeur, et il
n'existe aucune marge où poser les flèches à côté : elles se superposaient au
visuel, c'est-à-dire à ce qu'on est venu regarder. Elles passent sous l'image,
de part et d'autre du nom de l'édition, et reprennent leur place sur les côtés
à partir de `sm`.

Le passage se fait par `position` et **non par deux jeux de boutons** : deux
fois les mêmes commandes, ce sont deux fois les mêmes libellés pour un lecteur
d'écran.

Ce déplacement a cassé deux choses, toutes deux invisibles à la relecture du
diff.

**La figure est en `z-10` et non en `relative`.** Retirer `relative` était la
condition pour que les flèches en `sm:absolute` se calent sur le dialogue, mais
la figure redevenait statique, donc **peinte avant les éléments positionnés du
même contexte** : le voile `absolute inset-0` à 94 % d'opacité recouvrait
l'image et la visionneuse ouvrait sur un écran noir. `z-index` s'applique à un
élément flex même non positionné, ce qui règle l'empilement sans toucher au
référentiel des flèches.

À reconnaître : la visionneuse s'ouvre, le compteur et le titre sont là, tout
est noir. Une capture le montre tout de suite, encore faut-il ne pas mettre
l'écran sombre sur le compte du panneau de prévisualisation. C'est l'erreur
commise ce jour-là, et la capture disait la vérité.

**La remise à zéro de la taille native est sautée au montage.** Un
`useEffect(() => setNatif(null), [index])` tourne aussi la première fois, et une
image déjà en cache peut déclencher son `load` **avant** que React ne vide ses
effets : la taille relevée par `onLoad` était effacée juste après. L'image ne se
rechargeant plus, `onLoad` ne repassait jamais et le plafond n'était plus jamais
calculé, donc une vignette de 172 px restait à 172 px au lieu des 378 permis.
Un `useRef` sur l'index garde la remise à zéro pour les seuls changements.

Le défaut est intermittent par nature : il ne se produit que si l'image est en
cache et que la course tombe du mauvais côté. Il ne se voit pas à l'œil, une
image trop petite ressemblant à une image qui n'a pas fini de charger. **Mesurer
`img.style.width`** : à `auto`, la taille native n'a pas été relevée.

Vérifié en ligne en 375 px sur trois images d'une même édition, 180 × 244,
960 × 648 et 960 × 648 : rapport natif conservé au millième, image bien
l'élément rendu au point central, flèches sous le visuel et dans l'écran à
chaque étape. En 1 280 px elles reviennent à 24 et 1 212, hors des bornes de
l'image.

`pleineResolution()` remplace `w500` par `original` dans une URL TMDB, la taille
faisant partie du chemin. Une URL d'une autre origine, comme le miroir
d'images, passe sans être touchée.

**Note à deux décimales** partout. TMDB rend `7.901` ; trois décimales suggèrent
une précision que la note n'a pas.

Le mot-symbole est le seul élément de marque : la pastille bleue à icône de
pellicule a été retirée, l'emplacement attend un vrai logo.

### Awin
4 programmes en attente : Fnac, E.Leclerc, Cultura, Zavvi, **tous avec flux
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
  invisible tant qu'aucun champ accentué n'était extrait, il est apparu le
  jour où la colonne `editeur` a existé. Lire le `charset` du document, ne pas
  le supposer.
- **Ne pas prendre `Mot: texte` pour une donnée.** Les blocs Audio et Subtitles
  contiennent des lignes qui en ont la forme sans être des pistes :
  `Note: Confirmed from disc on the player`, `Music:`, et des titres de films à
  deux-points, `X-Men: Days of Future Past`, `Mission: Impossible`. Sur
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
  effaçait « Coffret 8 films », précisément la preuve qu'il s'agit d'un
  coffret. Résultat : `Clint Eastwood - Coffret 8 films → « Clint Eastwood »`,
  un documentaire homonyme.
- **Un coffret dont le titre est un nom propre** tombe sur une fiche TMDB
  homonyme et confidentielle : Jean Vigo 0.1, Marcel Pagnol 0.2, Bruce Lee 0.4.
  Les rattachements corrects du même lot sont tous au-dessus de 1,3.
- **« Intégrale » n'a pas le même sens selon le type.** Sur une série, elle
  désigne l'œuvre entière, c'est juste. Sur un film, elle désigne la saga :
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
  `date_sortie` sert de plafond, couverture faible, 28 éditions sur 297, mais
  décisive quand elle existe.
- **Le titre retenu doit partager un mot significatif avec celui de
  l'édition.** Contrôle appliqué a posteriori sur 230 rattachements : quatre
  suspects, dont `Heroes: Season 3` → *Speed 2* et `Gremlins` → *Paris, Texas*.
  Les deux autres étaient des traductions correctes (`Ulysses` → *Ulysse*),
  d'où une relecture plutôt qu'un rejet automatique.
- **Séparer les résultats en deux niveaux** (écriture directe et relecture) a
  attrapé 100 % des faux positifs connus. Sans ce tri, le taux d'erreur du lot
  « résolu » était de 20 %.
- **L'article initial ne peut pas être effacé sans repli.** Le normaliser rend
  `Batman` et `The Batman` identiques : un coffret des quatre Batman des années
  90 s'est retrouvé sous *The Batman* (2022). L'égalité stricte passe d'abord,
  la variante sans article ne sert qu'en second, elle reste utile pour
  rapprocher un titre français d'un titre anglais.
- **Un exposant disparaît dans un repli ASCII.** `Alien³` devenait `alien`,
  donc *Alien* (1979), un doublon à l'intérieur du même coffret, ce qui est le
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
- **La virgule sépare les titres d'un coffret, mais elle en coupe aussi.**
  `La Trilogie Marseillaise : Marius, Fanny, César` ne livre sa liste que par
  elle, et `X-Men - La Prélogie` de même. En retour, `OSS 117 : Le Caire, nid
  d'espions` se scinde en deux moitiés qui trouvent chacune un film parasite,
  « Le Caire » (2002, popularité 0,01) et « Nid d'espions » (1943). Les
  contrôles les arrêtent, mais le découpage ne doit jamais porter sur « et »
  ni « and » : `Mon Ninja et moi 1 & 2` n'y survit pas.
- **Un filtre appliqué hors de la chaîne ne tient pas.** Le garde-fou du
  vocabulaire d'édition avait été passé à la main sur le fichier final ; au
  premier rejeu, `Edition Limitée` était de retour. Il vit désormais dans
  `controler.py`, où toutes les passes le traversent.
- **La popularité écarte des rattachements justes sur les films anciens.**
  `Beanpole` de Balagov, `City Girl` de Murnau, `La Femme du boulanger` de
  Pagnol sont tous corrects et tous rejetés : ils ont des homonymes et une
  popularité sous 1,3. Or quand le coffret annonce une plage d'années serrée,
  c'est elle qui a départagé, pas la popularité. Le contrôle l'ignore parce que
  la résolution ne conserve pas combien d'homonymes tombaient **dans la
  plage**. Une dizaine de coffrets attendent cette distinction.
- **Un candidat qui n'est que du vocabulaire d'édition n'est pas un titre.**
  La parenthèse de `The Da Vinci Code: Extended Version (Édition Limitée)` a
  trouvé une fiche TMDB nommée « Edition Limitée », popularité 0,13, synopsis
  vide, dont le vrai titre est `Geheimzeichen LB 17` (1938). Même famille que
  le morceau réduit à « DVD » : ce qui décrit le boîtier ne se cherche pas.
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
  symptôme visible était un rattachement au repli : `Le Seigneur des Anneaux –
  La Communauté de l'Anneau` tombait sur le dessin animé de Bakshi (1978), la
  correspondance exacte ayant échoué et le fragment de tête ayant gagné.
  Ramener `’ “ ” – — …` à leur équivalent ASCII **avant** de replier.
- **Dans un bloc « Contenu : », le support est le suffixe des lignes qui nomment
  une œuvre**, pas la marque des lignes à jeter : `La vie des morts (1991) en
  blu-ray`, `Steelbook blu-ray 2D+4K de Fog`. Rejeter les lignes contenant
  « blu-ray » revenait à jeter précisément ce qu'on cherchait. Retirer le
  vocabulaire de support en tête et en queue, puis regarder ce qui reste, et
  si rien ne reste sur aucune ligne, c'est une édition d'un seul film, que le
  titre de l'édition nomme.
- **Ne pas affiner indéfiniment un filtre à bruit.** Ce qu'un bloc « Contenu : »
  laisse passer (`une broche La Main du Roi`, `2 art cards`) ne trouvera aucun
  titre exact sur TMDB. La validation fait le tri ; la regex n'a qu'à
  dégrossir.
- **Une ligne de contenu peut nommer une saga et non un film.** Dans un coffret
  Hobbit, `Le Seigneur des Anneaux` désigne la trilogie. Résolu comme un titre,
  il rendait un seul film, et le mauvais. `search/collection` le développe,
  à condition que la collection tienne dans les places restantes du boîtier.
- **Le titre borne parfois lui-même le contenu** : `Sonic 1 & 2`, `Superman
  I-IV`. Sans cette borne, développer la saga Sonic dans un coffret de deux
  films y ajoutait les volets 3 et 4, dont un de 2026.
- **Une parenthèse jamais refermée signale une ligne coupée à l'extraction.**
  `Le Hobbit : Un voyage inattendu (1 Blu-ray du film en version longue + 3`
  laissait « (1 » collé au titre.
- **Un ordre par défaut ne vaut que si toutes les tables ont la même clé.**
  Après avoir imposé `order=id` aux paginations, trois scripts sont tombés en
  400 : `bluray_import` s'ordonne sur `bluray_id`, `edition_films` n'a pas de
  colonne `id` du tout. Et comme la fonction de lecture avalait l'erreur en
  rendant une liste vide, le premier symptôme a été un « editions a creer : 0 »
  sans un mot. Le correctif d'un piège en a donc créé un autre, plus
  silencieux : **une lecture qui échoue doit s'interrompre, pas rendre vide**.
- **Sans `order`, la pagination PostgREST répète et saute des lignes.** `offset`
  s'applique alors à un ensemble non ordonné. Symptôme silencieux : un comptage
  d'orphelines est ressorti à 811 au lieu de 406, une page d'`edition_films`
  ayant disparu de la lecture. Toujours passer `order=id`.
- **Un nettoyage de titre doit s'interdire de tout retirer.**
  `import_4_titres.py` ôte le nom du film quand l'édition est rattachée, la
  fiche film le porte déjà. Bonne intention, mais sans garde-fou : 375 éditions
  se sont retrouvées intitulées « Blu-ray » ou « 4K Ultra HD + Blu-ray », donc
  indistinguables les unes des autres sur une fiche film, ce qui se lit comme un
  doublon. Le titre d'origine étant intact dans `bluray_import`,
  `reparer_titres_plats.py` les a reconstruits. **Si la coupe ne laisse rien de
  substantiel, garder le titre complet** : un nom redondant vaut mieux que pas
  de nom.
- **Deux fiches blu-ray.com peuvent décrire le même disque.** 1917 en 4K existe
  sous les identifiants `261058` et `356715`, même slug. 567 slugs sont dans ce
  cas, soit 1 344 éditions, mais un slug partagé ne prouve rien, trois pressages
  d'un même film le partagent aussi. Le seul indice fiable est l'EAN, et il ne
  signale que **4 doublons réels**. À trancher au cas par cas, pas en masse.
- **Le suffixe de format se porte aussi sans le mot « Blu-ray ».** Les listes
  de contenu des coffrets écrivent `Bad Boys 4K`, `Men in Black II 4K` : une
  coupe qui exige « Blu-ray » laisse le `4K` collé au titre, qui ne correspond
  alors à rien sur TMDB. 79 coffrets à liste complète restaient orphelins pour
  cette seule raison. Et en corrigeant, attention aux frontières de mot :
  `\d?D` insensible à la casse mange le « d » de `Extended`.
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
  divergents tenaient dans les ids 11000-11193, soit 194 lignes, 40 % du lot,
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
- **Un disque ne peut pas porter un film sorti après lui, et ce contrôle est
  le plus rentable écrit à ce jour.** Passé sur tout le catalogue le 31 juillet
  2026, il a sorti **51 liens faux**, tous confirmés par TMDB : aucune des 51
  années en base n'était fausse, donc c'étaient bien les liens. Le motif est
  toujours celui du titre qui tombe sur un homonyme d'un seul mot, souvent
  confidentiel :

      Moonfall + Midway (Pack)          ->  un film nommé « Pack »
      Jacques Brel, Blu-ray + CD        ->  un film nommé « CD »
      Mission: Impossible 1-4 Boxset    ->  un film nommé « Impossible »
      Coffret James Bond, Roger Moore   ->  « జేమ్స్ బాండ్ », en télougou
      Engrenages, saisons 1 à 5         ->  « Spiral » (2017), pas la série

  Les liens sont supprimés sans en proposer d'autres : l'édition redevient
  orpheline, ce qui se voit et se corrige, là où un lien faux se lit comme une
  vérité. Le contrôle ne couvre que les éditions datées, 2 543 sur 8 471, donc
  tout editioncollector lui échappe.
- **Un homonyme absent du catalogue attire les éditions du présent.**
  `Ghost in the Shell` de 2017 n'était pas en base ; ses trois éditions sont
  donc tombées sur l'animé de 1995, par un titre exact, sans qu'aucun contrôle
  ne bronche. 125 films sont dans cette configuration (`homonymes_absents.json`),
  mais la configuration seule ne prouve rien.

  Ce qui a tranché, c'est **le réalisateur nommé dans le contenu de la fiche** :
  « 45 mn de masterclass de Rupert Sanders » sur une édition rattachée à Oshii.
  Passé sur les 125, ce contrôle a rendu deux cas de plus, `Dumbo` de Burton
  pris pour l'animé de 1941 et le `Lolita` d'un coffret Kubrick pris pour celui
  d'Adrian Lyne. Rendement faible, deux sur 8 471 éditions, mais nul ailleurs.

  **Le cas d'origine n'a été vu que par un humain regardant la page.** Ni la
  date, l'homonyme étant postérieur, ni le réalisateur, nommé dans une fiche sur
  trois, ne l'auraient signalé.
- **Le bandeau blu-ray.com donne l'année de l'œuvre portée par le disque**, et
  c'est le seul contrôle qui compare notre rattachement à une mesure
  **indépendante** plutôt qu'à nos propres données. Passé sur les 125 films à
  homonyme absent, il tranche seul : trois contaminés, cent vingt-deux sains.

      Women's Revenge, coffret 3 films  bandeau 1972  -> Craven, pas le remake 2009
      The Stand                         bandeau 2020  -> la minisérie de 2020
      Les Revenants, saisons 1-2        bandeau 2012  -> la série française, pas
                                                         le remake de Carlton Cuse

  Un faux positif à connaître : sur une série, le bandeau porte l'année de la
  **saison**. `Rent-A-Girlfriend - Saison 2` annonce 2022 alors que la série
  commence en 2020, et le rattachement était juste. C'est la règle déjà notée
  plus haut, l'année d'un bandeau est un plafond pour une série, pas un filtre.
- **Un contrôle par réalisateur ne vaut que sur un titre exact.** Sur un
  rapprochement approchant, il valide n'importe quel film d'un réalisateur
  prolifique : `Navajeros` (1980) s'est rattaché à `El diputado` (1978), tous
  deux d'Eloy de la Iglesia, parce que le titre n'était qu'un repli sans
  article. La durée, elle, reste recevable sur un repli : elle ne dépend pas
  du titre.
- **Comparer deux noms de réalisateur exige de la souplesse.** `Jess Franco`
  et `Jesús Franco` sont le même homme, les catalogues français créditant le
  pseudonyme et TMDB l'état civil. Comparer le nom de famille et l'initiale du
  prénom suffit, et ce contrôle ne servant jamais seul, le risque d'homonymie
  est couvert par l'exigence de titre exact.
- **L'année du boîtier est souvent la sortie française, pas la production.**
  `Eolomea` est annoncé 1976 pour un film de 1972, `Les Démons` 1978 pour
  1973, avec dans les deux cas la durée exacte et le bon réalisateur. Un écart
  d'années ne suffit donc pas à douter quand une mesure indépendante concorde.
- **Distinguer l'homonyme du doute, au lieu de tout envoyer en relecture.**
  Quand aucun contrôle ne confirme **et** que l'année diverge de plus de trois
  ans, ce n'est pas un cas à relire, c'est une erreur : `Le Prêtre` d'Eloy de
  la Iglesia (1978) tombait sur un film de 2021, `Danse macabre` de Margheriti
  (1964) sur vingt minutes de 2023. Sur Artus Films, ce seul tri a ramené la
  file de relecture de 17 à 2.
- **Le nom du produit prime sur celui de la description.** Une fiche marchande
  peut décrire un autre film que celui qu'elle vend, par copier-coller.
- **Le signal du tri d'images change d'une boutique à l'autre, et se vérifie.**
  Chez Le Chat qui fume le nom de fichier dit vrai (`IMAGEGRAB`) et
  l'orientation trompe, le packshot étant carré. Chez Metaluna c'est l'inverse :
  deux jaquettes s'appellent `Capture d'écran 2026-07-20 à 09.11.38.png`, le
  gestionnaire ayant photographié son écran, et un filtre par nom les refusait
  alors que c'était l'unique image du produit. **Trier sur ce qui se mesure,
  pas sur ce qui se lit.**
- **La durée du disque est une mesure indépendante, et la plus rentable du
  1er août 2026.** Le boîtier l'imprime (`1h28`), TMDB publie son `runtime` :
  les comparer ne rejoue pas notre rapprochement, ça le confronte à un chiffre
  venu d'ailleurs, comme le bandeau blu-ray.com plus haut. Sur les 87 orphelines
  du Chat qui fume, elle en a rattaché **66**, dont tous les titres que TMDB
  n'indexe qu'en langue originale : `Angel Guts` 78 contre 79, `Fat Choi Spirit`
  97 contre 96, `Histoire d'une femme yakuza` 86 contre 86, cette dernière
  trouvée sous `Yasagure anego den: Sôkatsu rinchi`. Le réalisateur nommé dans
  la description prend le relais quand la durée manque.
- **Une tolérance de durée doit être proportionnelle, jamais en minutes fixes.**
  Le speedup PAL vaut exactement **4,17 %** : un master de 92 minutes en rend
  88. Une marge de 4 minutes refusait donc `Justice sans sommation`, 92 contre
  87, alors que son titre original `皇家女將` correspondait. Marge retenue : 6 %
  avec un plancher de 4 minutes, rupture au-delà de 25 %.
- **La conversion des chiffres romains doit porter sur la requête envoyée à
  TMDB, pas seulement sur la comparaison.** TMDB ne la fait pas de son côté :
  chercher `EXTERMINATOR II` rendait `Class of 2001`, quand `Exterminator 2`
  rend le bon film à l'écart de durée zéro. Le défaut est **invisible**, la
  recherche renvoyant un résultat plausible plutôt qu'une absence.
- **`primary_release_year` est un filtre dur chez TMDB.** Le passer élimine
  l'œuvre au lieu de la classer : `Blue Sunshine`, annoncé 1978 sur le boîtier
  et daté 1977 chez eux, rendait zéro résultat, et `Cherry 2000` cherché en
  l'an 2000 aussi, l'année ayant été lue dans son propre titre. Chercher **sans
  année**, puis contrôler l'année sur des résultats qu'on a vus. L'année
  classe, elle n'élimine pas ; le plafond de date de sortie, lui, élimine.
- **Un catalogue mélange trois séparateurs, et n'en connaître qu'un donne des
  titres de ferraille.** Chez Le Chat qui fume, ` - `, ` / ` et ` | `
  cohabitent : `Fresh / 1994 / 1h54 / États-Unis` et
  `1983 | 105 MIN | USA | BD-50 | 1920x1080` partaient entiers vers TMDB.
- **`1920x1080` porte un millésime parfaitement valide.** Sans exclusion
  explicite, une extraction d'année date un disque sur deux de 1920.
- **Une durée en minutes n'est pas une œuvre.** Compter les lignes minutées
  d'un `body_html` faisait passer 159 disques sur 222 pour des coffrets,
  `36 Fillette` compris : ce sont les suppléments, `Entretien avec … 25 mn`.
  Une œuvre du catalogue s'écrit toujours en heures.
- **`Terminator 2` (1989) est un décalque italien de Bruno Mattei.** Deux
  éditions editioncollector y étaient rattachées au lieu du film de Cameron
  (1991), le titre d'exploitation français du décalque usurpe le sien.
  Corrigé le 30 juillet 2026. Même motif que Jean Vigo ou Bruce Lee : un titre
  exact tombant sur un homonyme confidentiel, ici invisible parce que l'année
  n'avait jamais été comparée.

### Infrastructure
- **`npm run build` lance `tsc --noEmit` d'abord.** Sans lui, rien ne relisait le
  code : esbuild ne vérifie pas les types, et un identifiant JSX dont l'import a
  été retiré devient une référence globale résolue à l'exécution. Un `Search`
  ainsi perdu a fait écran blanc sur tout le site sans que le build bronche.
  `strict` reste désactivé, les écrans hérités de Figma Make noieraient le
  signal sous des centaines d'erreurs de nullité.
- **Un `tsc` vert en local ne dit rien du build Cloudflare** quand plusieurs
  sessions travaillent dans le même répertoire. Le 31 juillet 2026, la page de
  bienvenue importait `getDernieresEditions` de `reelio-db.ts`, fonction qui
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
  servi ou compter les URL du sitemap, et lire le journal dans le tableau de
  bord Pages, seule source de la cause d'un échec.
- **Après un déploiement, la première visite peut rendre l'ancienne page.**
  L'`index.html` en cache navigateur pointe l'ancien bundle : sur une route
  neuve, on obtient la page « introuvable » alors que tout est en ligne. Un
  rechargement suffit, il n'y a rien à purger. Ne pas confondre avec l'incident
  d'asset estampillé `immutable`, qui, lui, ne se répare pas seul.
- **Le bundle d'un déploiement neuf peut répondre 404 plusieurs minutes**, et la
  page est alors blanche : `index.html` est servi, le CSS aussi, mais le script
  qu'il référence n'existe pas encore sur cet edge, donc `#root` reste vide et
  la console ne dit rien. Mesuré le 1er août 2026, sept minutes durant, avec un
  nom de bundle **stable** tout du long, ce qui écarte la bascule entre deux
  versions : c'est la propagation de l'asset lui-même. Se répare seul, ne rien
  purger. Signature à reconnaître dans la console de la page blanche :

      performance.getEntriesByType('resource')
        .filter(e => e.name.includes('/assets/'))
        .map(e => [e.name.split('/').pop(), e.responseStatus])

  Un `404` sur le `.js` et un `200` sur le `.css` disent tout.
- **PostgREST plafonne à 1 000 lignes.** Paginer, toujours. Le piège s'est
  reproduit : un `limit=1893` a silencieusement traité 1 000 lignes.
- **TMDB numérote films et séries séparément.** Le film 1639 est *Speed 2*, la
  série 1639 est *Heroes*. `films.tmdb_id` était unique à lui seul : les deux
  ne pouvaient pas coexister, et une recherche par `tmdb_id` seul renvoyait
  l'œuvre du mauvais catalogue, une édition de *Heroes* s'est retrouvée sous
  *Speed 2*. L'unicité porte désormais sur `(tmdb_id, type)`,
  cf. `supabase/migrations/20260730_tmdb_id_par_type.sql`. Le défaut est
  silencieux : il ne se voit qu'au moment où une série heurte un film existant.
- **`ON CONFLICT` ignore les index partiels.**
- **`editions.id` n'avait pas d'identity** : insertion impossible.
- **`gzip.open(...).read()` lève `zlib.error` sur une page tronquée**, et
  `zlib.error` n'est ni `EOFError` ni `OSError`. Une passe sur 3 100 fichiers
  est tombée à la 2 000ᵉ. Rattraper les trois, et garder ce qui a été lu.
- **Une reprise fondée sur le journal ne voit pas un cache abîmé.**
  `crawl_fr.py` écrit la page gzippée *puis* la ligne de `donnees.jsonl`, et
  reprend sur le second. Une coupure entre les deux est sans conséquence, la
  fiche est refaite. Mais une page tronquée dont la ligne a été écrite devient
  invisible : la reprise la croit faite, et elle le reste indéfiniment. Ce sont
  les 12 pages abîmées du crawl de juillet. Remises dans la file le 30 juillet
  2026 en retirant leur ligne et leur `.gz`. **Vérifier le cache, pas le
  journal.**
- **Tailwind 4 a changé son preflight** : les `<button>` reçoivent
  `cursor: default` là où Tailwind 3 posait `cursor: pointer`. Toute
  l'interface bâtie sur des boutons (onglets, capsules de format, cartes
  d'acteurs) a cessé de signaler qu'elle était cliquable, sans que rien ne
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
  Ne jamais valider un déploiement en interrogeant une URL d'asset, charger la
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
  même navigateur, donc ni le code, ni le bundle. La purge du cache a rétabli
  le CSS mais pas l'import. **Cause jamais établie.**

  Ce qui est établi, en revanche, c'est pourquoi ça a mis le site à terre :
  `useSession` attendait `auth-js` sans `catch`, `session` restait `undefined`,
  et la fiche film, qui ne lance ses requêtes qu'une fois la session résolue,
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
  validation échoue et le domaine devient injoignable (SERVFAIL, pas lent).
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
   parseur : le nombre de films et la liste de contenu des coffrets. **Avant de
   déclarer une donnée absente de la source, relire la page, pas le champ
   qu'on en avait extrait.**
3. **Vérifier qu'un scan qui renvoie « rien » fonctionne.** Un scan cassé
   ressemble à un scan négatif.
4. **Relire un échantillon avant d'écrire.** Chaque passe de relecture a
   révélé une famille de faux positifs que la précédente ne voyait pas.
5. **Un fichier d'extraction se périme dès qu'on écrit en base.** Les 42
   éditions dites « sans extrait » n'étaient pas un défaut de parseur : le
   fichier datait d'avant la suppression des 51 liens faux, donc ne connaissait
   pas les orphelines qu'elle venait de créer. Régénéré, il a rendu 40
   rattachements, dont ceux-là mêmes que les liens faux occupaient. Régénérer
   avant de conclure qu'une source est muette.
6. **Écrire par lots successifs plutôt qu'en une fois.** Six passes, trois
   écritures : chaque lot écrit a servi de mesure au suivant, et les passes
   tardives n'ont eu à traiter que ce qui restait vraiment.

---

## 10. Juridique

- Mentions légales, confidentialité et à propos en ligne
- Éditeur non professionnel (LCEN art. 6), **à compléter dès que le site
  devient commercial**
- Attribution TMDB en pied de page (exigée par leur licence)
- **Les visuels relevés chez Metaluna sont repris depuis le 1er août 2026**,
  252 jaquettes. Ce sont les visuels des éditeurs, Studiocanal, Artus Films,
  que Metaluna revend : le revendeur n'en est pas l'ayant droit, et `editeur`
  en base porte l'éditeur réel, jamais son nom. Même raisonnement que
  ci-dessous, et à réexaminer aux mêmes conditions.
- **Les visuels du Chat qui fume sont repris depuis le 1er août 2026**, 473
  packshots de boîtier miroités sur R2. Même raisonnement que pour blu-ray.com
  ci-dessous : ce sont des visuels d'éditeur, et l'usage vise l'affiliation,
  donc commercial. Les captures d'écran du film, elles, **n'ont pas été
  reprises** : 538 photogrammes laissés chez eux, refusés deux fois, au tri
  puis juste avant le transfert. La distinction n'est pas que technique, une
  jaquette identifie un produit là où un photogramme reproduit l'œuvre.
- **Les visuels de blu-ray.com sont repris depuis le 31 juillet 2026**, ce que
  la version précédente de ce document interdisait. Décision prise en connaissance
  de cause : ce sont pour l'essentiel des visuels d'éditeur, mais le site vise
  l'affiliation, donc l'usage est commercial. À réexaminer si un flux Awin est
  accepté, leurs images sont licenciées pour les affiliés et régleraient la
  question.
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
- Données factuelles uniquement (EAN, dates, formats), non protégeables
  individuellement, mais le droit *sui generis* protège l'extraction d'une
  partie substantielle d'une base
- Aucun tracker. Compte optionnel via Google uniquement.
- **`collections` n'est plus vide.** Elle porte deux lignes au 31 juillet 2026,
  un « possédé » et une « envie ». La phrase « aucune donnée personnelle
  serveur » est donc **fausse depuis qu'un compte a été utilisé** : un compte
  connecté fait vivre côté serveur son adresse et son identifiant Google dans
  `auth.users`, et la liste de ses éditions dans `collections`. Hébergement
  Supabase en Suède, dans l'Union, c'est ce qu'annonce `/compte`. À vérifier
  que les mentions publiées disent bien cela, et non l'inverse.
- **Effacement (RGPD art. 17)** tenu par `public.supprimer_mon_compte()`,
  atteignable depuis `/compte`, lui-même lié depuis le menu du bandeau et
  depuis la politique de confidentialité, laquelle annonçait déjà la
  suppression « accessible dans les réglages du compte ». Confirmation en deux
  temps avec un mot à recopier, et en cas de refus du serveur on ne prétend pas
  avoir supprimé.
