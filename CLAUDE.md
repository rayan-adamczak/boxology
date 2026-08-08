# Jaquette, contexte projet

Catalogue des éditions physiques de films (Blu-ray, 4K, DVD, steelbooks,
coffrets) pour le marché français. Anciennement *Boxology*, renommé en
juillet 2026.

**Le DVD est entré le 6 août 2026**, et c'est le premier élargissement du
périmètre depuis l'origine. Ce qui l'a emporté n'est pas le volume :

- **le code-barres.** Les DVD Leclerc en portent 100 %, là où Zavvi et Metaluna
  n'en publient aucun. C'est la couverture EAN qui bloque le scan, fonction la
  plus demandée du §8, et le DVD est la première vague à la faire monter ;
- **les collections réelles.** Le banc d'essai du 2 août portait sur des listes
  intitulées « DVD / Blu-ray / Steelbook » et « vidéothèque UHD/BD/DVD ». Les
  gens rangent leurs DVD sur la même étagère.

**Ce n'est pas le trou 2000-2014 qui l'a motivé, et il ne faut pas le vendre
comme tel.** Cherchés dans les 3 478 DVD Leclerc, les 19 absents nommés du banc
d'essai rendent 4 titres, exactement ceux que le Blu-ray apportait déjà. Le trou
est un trou de **fonds**, pas de format.

**Le périmètre était déjà entamé sans que personne le sache** : 1 647 fiches
Zavvi `/p/dvd/` étaient en base depuis le 2 août, sans étiquette de format, et
la FAQ promettait encore que « le catalogue ne vise pas le DVD seul ». C'est ce
qui a fait de l'étiquetage (§6) le préalable, et non une finition.

---

## 1. Identité

| | |
|---|---|
| Nom | **jaquette.app**, en minuscules, extension comprise. Depuis juillet 2026 : « jaquette » seul est un nom commun, le `.app` est ce qui démarque. Vaut partout : mot-symbole, `<title>`, `og:site_name` |
| Domaine | `jaquette.app`, **en ligne**, apex et `www` |
| Dépôt | `github.com/rayan-adamczak/jaquette` (public) |
| Éditeur | Rayan Adamczak, **entrepreneur individuel**, SIREN 852 258 680, SIRET 852 258 680 00028, RNE. Siège 32 D passage privé du Maupas, 58000 Nevers. Franchise en base, art. 293 B du CGI |
| Contact | `contact@jaquette.app`, Cloudflare Email Routing, redirige vers rayan.adamczak@gmail.com. Réception seulement, pas d'envoi |
| Compte Awin | `Jaquette.app` (3006883), **E.Leclerc accepté le 3 août 2026, Momox shop FR le 6**. Fnac, Cultura, Zavvi et Cdiscount en attente. L'espace publicitaire déclarait encore le prototype `boxology.figma.site` jusqu'au 5 août (§8) |

**Le site est commercial depuis le 3 août 2026.** L'ambition du §1 d'origine est
atteinte : le premier programme d'affiliation est accepté, 724 offres sont en
ligne, et les pages légales ont basculé en régime professionnel (§10).

**Le compte Awin ne s'appelle plus `Boxology`.** Le renommage a suivi celui du
site ; l'identifiant 3006883, lui, n'a pas bougé.

**L'APE est `74.10Z`, activités spécialisées de design, et il ne couvre pas
l'apport d'affaires.** Le code APE est statistique et n'interdit rien, mais la
nature du revenu, BIC ou BNC, change le taux URSSAF et la ligne de déclaration.
Question ouverte au 3 août 2026, à trancher avec l'URSSAF **avant le premier
virement Awin**, pas avant une mise en ligne : rien de tout cela ne bloque le
site. C'est aussi ce qui fait écrire « RNE » et non « RCS » dans les mentions,
un APE ni commercial ni artisanal n'ouvrant aucun de ces deux registres.

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

`public/_headers` met `/assets/*` en cache un jour, avec
`stale-while-revalidate` : Cloudflare revalidait à chaque visite
(`cf-cache-status: REVALIDATED` au lieu de `HIT`), soit un aller-retour avant le
premier octet. **Jamais `immutable`**, et le fichier dit pourquoi en toutes
lettres : une entrée empoisonnée par la réécriture SPA doit pouvoir se réparer.
`index.html` reste volontairement hors de la règle, sinon un déploiement ne
serait pas vu des visiteurs déjà venus.

Le même fichier porte les en-têtes de sécurité depuis le 2 août 2026, CSP
comprise (§3). **HSTS et « Toujours utiliser HTTPS » n'y sont pas** : ces deux-là
se règlent dans le tableau de bord Cloudflare, SSL/TLS puis Certificats de
périphérie, et rien dans le dépôt n'en garde trace. Voir le §3 pour les valeurs
et l'ordre à respecter pour revenir en arrière.

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

**Le fichier était en `0644`, donc lisible par tout processus du Mac**, relevé
le 3 août 2026 par le second audit. Il porte aussi les quatre `R2_*` depuis, et
la clé `service_role` porte `rolbypassrls`, c'est-à-dire qu'elle traverse
d'un coup toutes les barrières décrites au §3. Le contraste était net sur la
même machine, `~/.config/gh/hosts.yml` et le fichier de wrangler étaient en
`0600`. **Ce dernier est en `~/Library/Preferences/.wrangler/config/default.toml`
et non `~/.wrangler/`**, chemin relevé le 5 août 2026 en cherchant le jeton
OAuth : `~/.wrangler/` n'existe pas sur la machine.

    chmod 600 ~/.config/boxology.env

**Un secret qui a été lisible doit être tenu pour lu.** La rotation de la clé
`service_role` et du couple R2 reste donc à faire, comme celle du secret du
client OAuth Google, dont le fichier `client_secret_*.json` traînait dans
`~/Downloads`, en `0644` lui aussi, depuis le 30 juillet. Sa correspondance
avec la production a été établie **sans l'ouvrir** : `/auth/v1/authorize` rend
un `client_id` identique à celui que porte le nom du fichier.

Ordre pour le secret Google, à ne pas inverser : régénérer dans la console
Google Cloud **puis** reporter dans Supabase, Authentication, Providers. Le
faire dans l'autre sens coupe la connexion le temps de l'écart.

---

## 3. Modèle de données

### `films`, 12 129 lignes (5 août 2026)
`id` (identity), `tmdb_id` (unique), `titre`, `titre_original`, `annee`,
`duree`, `realisateur`, `scenariste`, `synopsis`, `note` (**/10**),
`nb_votes`, `affiche_url`, `backdrop_url`, `imdb_id`, `tagline`,
`genres` (text[]), `cast_principal` (jsonb), **`type`** (`film|serie|coffret`),
`mots_alternatifs` (générée, cf. plus bas).

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

**`mots_alternatifs` (text), ajoutée le 5 août 2026, et c'est la première
colonne *générée* du schéma.** Elle vaut
`public.mots_alternatifs(titres_alternatifs)`, soit les valeurs de ce jsonb
repliées par `mots_recherche`, dédoublonnées, triées et jointes par une barre
verticale, `|hausu|house|`. Migration
`20260805_recherche_titres_alternatifs.sql`, index GIN trigrammes. Détail du
séparateur et du classement au §7.

**Générée et non calculée au vol** : déplier un jsonb et agréger pour 12 129
lignes à chaque frappe interdirait tout index. 684 ko en base, et elle se
recalcule seule à chaque écriture de `titres_alternatifs`, donc les passes
d'enrichissement n'ont rien à en savoir. Même partage que `films.slug`, calculé
en base pour que les scripts Python ignorent la règle.

Contrepartie à connaître : `recherche_films` rend `setof films`, donc elle part
dans chaque réponse de recherche, 58 octets en moyenne et 299 au pire.

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

### `editions`, 20 698 lignes (3 août 2026)
`id` (identity **ajoutée en juillet 2026**, elle manquait, toute insertion
applicative échouait), `titre`, `ean`, `date_sortie`, `pays`, `region`,
`formats_extraits` (text[]), `url_source`, `contenu_brut`, `image_url`,
`images_secondaires`, `slug`, `type`, `prix_editeur`, `univers`, `supports`,
`langues`, `nb_commentaires`, `nb_wishlist`, `prix_fnac_extrait`,
`film_id` (film principal), **`source`**, **`source_id`**.

`source` vaut `bluray.com` (6 017), `zavvi.com` (4 446),
`editioncollector.fr` (3 193), `metalunastore.fr` (1 615) ou
`lechatquifume.com` (212).

**`collection_editeur` et `numero_collection`, ajoutées le 1er août 2026.**
Migration `20260801_collection_editeur.sql`, index sur le couple. La série
numérotée d'un éditeur, Criterion et ses spines, Ultra Collector, Make My
Day!, n'est pas la même chose que `editeur`, qui dit qui presse le disque :
Studiocanal édite « Make My Day! » **et** cent titres hors collection.

La colonne s'appelle `collection_editeur` et non `collection` : la table
`collections` porte les listes utilisateur, et deux noms proches sur deux
notions sans rapport se lisent de travers.

**Ces deux colonnes sont remplies et invisibles.** 644 éditions portent une
`collection_editeur`, 93 un `numero_collection`, et `grep` sur `src/`,
`functions/` et `scripts/` n'en rend **aucune occurrence** : rien ne les
affiche, rien ne les indexe, aucun axe `/collections` n'existe. Elles sont
prêtes, pas exploitées.

L'axe avait été écarté le 1er août parce qu'il n'aurait porté qu'une entrée.
Cette raison **ne tient plus** : Make My Day!, son hors-série et The Criterion
Collection en font trois. À rouvrir.

**Six entrées depuis le 4 août 2026**, Coin de Mire écrivant `Collection
Prestige`, `Collection Sélection` et `Collection Premium` sur ses 124 éditions.
C'est le seuil que le §7 s'était fixé, et c'est aussi la première fois que la
colonne se remplit toute seule, par une source qui la publie plutôt que par une
table déclarée dans un script.

`numero_collection` n'est renseigné que par Make My Day!, de 1 à 98. Le spine
number de Criterion n'est publié par aucune de nos sources, et Le Chat qui
fume numérote son `sku` de 013 à 271 en y mêlant la revue *Nitrate* et les
badges : c'est une référence de boutique, pas un rang de collection.

**`distributeur` et `editeur_source`, ajoutées les 2 et 3 août 2026.**
La première porte le distributeur du disque, relevé chez dvdfr et nulle part
ailleurs : TMDB ne le publie pas, et `production_companies` liste les sociétés
de production, qui ne le sont que par coïncidence. Elle qualifie le **disque**,
d'où sa place à côté d'`editeur` : Studiocanal presse, Universal distribue.

La seconde garde le libellé d'éditeur tel que la source l'a écrit, `editeur`
portant désormais la forme canonique. Même montage qu'`image_url_source` en
face d'`image_url` : la normalisation est réversible et vérifiable ligne à
ligne. 2 794 lignes renseignées.

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

### `edition_films`, 21 688 liens
Relation plusieurs-à-plusieurs : un coffret appartient à chacun de ses films.
`edition_id`, `film_id`, `source`.

Répartition : `zavvi` 4 446, `bluray_tmdb` 3 106, `bluray_page` 2 891,
`film_id` 2 619, `bluray_page_partiel` 1 710, `corrige_manuel` 692,
`metaluna_*` 1 322, `collection_tmdb` 199, `probable` 171,
`chat_qui_fume` 134, `make_my_day` 86, `corrige_annee` 68,
`chat_qui_fume_duree` 66, `metaluna_relecture` 76 et
`metaluna_relecture_partiel` 2, `fusion_doublon` 3.

21 055 liens pour **18 110 éditions rattachées** sur 20 602, soit 87,9 % au
3 août 2026 : l'écart entre liens et éditions, ce sont les coffrets, qui portent
un lien par film.

Le taux était à 94,2 % la veille. Il baisse parce que les vagues Metaluna font
entrer des catalogues d'éditeurs que TMDB indexe mal, et c'est le mouvement
normal décrit juste en dessous : **un taux qui ne baisse jamais est le signe
qu'on force les liens, pas qu'on les mesure.**

**Le taux a monté en absorbant 4 446 éditions**, ce qui paraît contre-intuitif
et ne l'est pas : l'import Zavvi du 2 août 2026 n'a écrit **que des éditions
rattachées**, les 7 049 orphelines qu'il aurait pu créer ayant été refusées à
l'entrée. Ajouter du rattaché relève la moyenne.

**Puis il est redescendu de 94,7 à 94,2 %, et c'est sain.** Les 739 éditions
blu-ray.com entrées le 2 août (§4) sont arrivées avec 623 liens seulement : les
ambiguës sont écrites **sans** rattachement plutôt que liées au hasard. Une
orpheline se voit et se corrige, un lien faux se lit comme une vérité. Un taux
qui ne baisse jamais est le signe qu'on force les liens, pas qu'on les mesure.

**La source d'un lien dit comment il a été obtenu, pas seulement d'où.** C'est
ce qui rend chaque campagne isolable et annulable sans toucher aux autres :

    GET /edition_films?source=eq.metaluna_relecture

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

### `profils`, appliquée le 3 août 2026

Un identifiant public par compte, et la page qu'il ouvre. `user_id` (clé
primaire, cascade sur `auth.users`), `identifiant`, `nom`, `visible`,
`cree_le`, `maj_le`. Migration `20260803_profils.sql`, appliquée par le serveur
MCP Supabase et non par l'éditeur SQL, contrairement à ce que dit le §3 plus
haut : la connexion MCP existe depuis, et le fichier reste la source.

**L'identifiant est stocké en minuscules**, imposé par un déclencheur et non
par une contrainte, parce qu'il doit *corriger* la valeur : c'est ce qui rend
l'index unique suffisant. Forme `^[a-z0-9_]{3,20}$`, pas de tiret, il se
confond avec le souligné à l'oral et un @ se dicte.

**Le nom affiché est une colonne de `profils`, pas une lecture d'`auth.users`.**
Deux raisons, et la seconde est la vraie : `anon` ne peut pas lire
`auth.users`, et surtout personne ne doit être obligé de publier son état civil
pour avoir une page. Il est recopié de Google à la création, puis modifiable.

**La photo de Google non plus n'est pas reprise**, pour la même raison : elle
existe dans `user_metadata`, et l'afficher publierait un portrait que personne
n'a choisi de publier ici. `avatar_url` est vide tant qu'on ne dépose rien, et
`UserAvatar` retombe sur les initiales.

#### `profils.avatar_url` et le seau `avatars`, le 7 août 2026

Migration `20260807_avatars.sql`. Une colonne nullable, un seau Supabase
Storage public en lecture, et quatre policies sur `storage.objects`.

**Storage plutôt que R2, et ce n'est pas un revirement du §2.** Les 36 000
visuels du catalogue restent sur R2 : ce seau-là est écrit par des scripts
Python qui portent les clés `R2_*`, et **un navigateur ne peut pas y déposer**
sans qu'une Pages Function signe une URL, donc sans une liaison R2 et un secret
de plus. Le Storage accepte le dépôt sous le jeton de session déjà en main, et
ses règles s'écrivent dans le même langage que le reste du schéma.

**Le chemin porte toute la règle**, `<user_id>/<jeton>.webp` :
`(storage.foldername(name))[1] = auth.uid()::text` sur l'insertion, la mise à
jour et l'effacement. Personne ne dépose ni n'efface sous le dossier d'un autre.

**Le second segment est tiré au hasard à chaque dépôt.** Un nom fixe obligerait
à purger le cache de périphérie à chaque changement, et le §8 garde la trace de
ce piège : une entrée déjà en cache garde les en-têtes qu'elle avait à sa
création, et l'ancienne image resterait servie des heures. Une URL neuve n'a
rien à purger.

**`avatar_url` est contrainte par un `check` sur le préfixe.** Sans lui, un
compte pourrait écrire n'importe quelle adresse dans sa propre ligne, et la
page de profil ferait charger une image chez un tiers qui relèverait l'IP de
chaque visiteur. La CSP refuserait l'hôte, mais compter sur elle serait faire
d'un filet la seule serrure.

**Le navigateur réencode avant d'envoyer**, 512 px en WebP à 0,85, jamais le
fichier choisi. Mesuré sur une image bruitée de 12 Mpx, proche d'une photo, un
dégradé plat se compressant de façon irréaliste :

    entree   6,53 Mo   12 Mpx (4000 x 3000)
    sortie   10,8 Ko   512 x 512, image/webp
    facteur  619x

Effet de bord voulu, les métadonnées EXIF disparaissent, **et avec elles les
coordonnées GPS** que les appareils y écrivent : publier une photo est une
chose, publier l'endroit où elle a été prise en est une autre.

#### Trois plafonds, et ils ne mesurent pas la même chose

    accept       amabilite    filtre la fenetre du systeme, se contourne d'un clic
    type MIME    10 Mo        JPEG, PNG, WebP, AVIF, GIF, verifie en JS
    pixels       50 Mpx       verifie **au decodage**, pas au choix du fichier
    seau         2 Mio        image/webp seulement, cote serveur

**Le plafond en pixels est le seul qui compte vraiment, et le poids ne le
remplace pas.** Mesuré : un PNG de **1 Mo** peut faire 8 000 × 7 000, soit
56 Mpx et 224 Mo une fois décompressé en mémoire. C'est comme ça qu'on fait
tomber un onglet, et une page qui meurt en silence est pire qu'un refus qui
s'explique. Il se pose **à l'`onload` de l'image**, les dimensions n'étant
connues qu'une fois l'en-tête lu.

**`verifierFichier` rend une phrase et non un booléen**, comme
`etat_identifiant` en base : « trop lourd » et « pas une image » ne se corrigent
pas de la même façon.

**Le type produit par le canevas est vérifié.** Un navigateur qui ne sait pas
encoder en WebP ne lève pas d'erreur, il rend un PNG sous le même appel, et le
seau opposerait un refus de stockage incompréhensible à quelqu'un qui vient de
recadrer. L'encodage redescend aussi en qualité si le résultat dépasse 2 Mio,
ce qui ne se produira sans doute jamais à 512 px : le plafond est côté serveur,
et l'envoi est le pire endroit pour le découvrir.

**Le compte disparaît, la photo avec**, par un déclencheur `after delete on
profils` en `security definer` : `storage.objects` n'a aucune clé étrangère
vers `auth.users`, donc sans lui la photo de quelqu'un qui a effacé son compte
resterait servie publiquement (§10, article 17).

Mesuré à l'application, le 7 août 2026 :

    depot anon                          400 / RLS  new row violates policy
    effacement anon                     400        objet invisible pour lui
    lecture publique sans jeton         200        6 566 o, image/webp
    profil_public                       rend avatar_url
    retrait depuis /account             storage.objects vide, colonne nulle

**Piège de vérification à connaître** : juste après l'effacement, l'URL publique
répond encore **200**. C'est le CDN, pas un échec — `storage.objects` est déjà
vide, et la même URL avec un paramètre rend 400. Lire la table, pas l'URL.

**`anon` ne reçoit aucun privilège, ni sur `profils` ni sur `collections`.** La
lecture publique passe par deux fonctions `security definer` :

    profil_public(identifiant)                  -> jsonb, ou null
    editions_du_profil(identifiant, statut, …)  -> setof bigint

Elles sont la seule porte, y compris pour un compte connecté, donc `visible`
n'est testé qu'à un endroit. Vérifié le 3 août 2026 avec la clé anon du
bundle : `GET /profils` rend **401**, `INSERT` aussi, `rpc/etat_identifiant`
**401**, et les deux fonctions publiques 200 avec `null` et `[]`.

**Un identifiant inconnu et un profil masqué rendent la même chose.** Les
distinguer ferait de l'adresse un oracle disant quels comptes existent. La
fonction rend `null` dans les deux cas, le middleware répond 404 dans les deux
cas, et l'écran de réglages le dit en toutes lettres.

`etat_identifiant` rend un motif (`libre`, `pris`, `reserve`, `invalide`) et
non un booléen : les trois refus ne se corrigent pas de la même façon. Réservée
à `authenticated`. **La liste des identifiants réservés n'existe qu'en SQL**,
dans `identifiant_reserve` : le front interroge la fonction et affiche le motif
rendu, une seconde copie en TypeScript aurait dérivé au premier ajout.

Ce qui existe en double, et rien d'autre : la **forme** de l'identifiant, dans
la contrainte de table et dans `src/app/lib/identifiant.ts`, pour que le champ
réponde à la frappe sans un aller-retour.

### `identifiants_interdits`, le 3 août 2026

Injures, injures racistes, antisémites, homophobes, apologie nazie. Migration
`20260803_identifiants_interdits.sql`. **Une table et non un tableau en dur** :
`identifiant_reserve` porte sa liste dans son corps parce qu'elle ne bougera
plus, celle-ci bougera à chaque contournement trouvé, et une liste qui s'étend
par migration ne s'étend pas.

Aucun privilège pour `anon` ni `authenticated`, aucune policy. `texte_interdit`
est `security definer` et ne rend qu'un booléen : publier la liste, ce serait
publier le mode d'emploi du contournement.

**Le contrôle porte sur deux replis, et il faut les deux.** `repli_brut` retire
accents, souligné et ponctuation, donc `s_a_l_o_p_e` et `Sale Juif` tombent
juste. `repli_lettres` replie en plus les chiffres sur les lettres qu'ils
imitent, `n1gg3r` vers `nigger`. Le second détruit ce que le premier attrape :
`1488`, code néonazi, devient `iabb` et ne ressemble plus à rien.

**Deux modes, et le second est le vrai travail.** `sous_chaine` pour les mots
qu'aucun mot légitime ne contient, `exact` pour les autres, et il y en a plus
qu'on ne croit : « salope » est dans **salopette**, « pute » dans **dispute**
et **réputé**, « nazi » dans le prénom **Nazim**, « pédo » dans **pédologie**,
« batard » est aussi un pain, « 88 » une année de naissance. Une correspondance
en sous-chaîne sur ces mots-là refuserait des pseudonymes innocents. La colonne
`note` dit pourquoi chaque entrée est dans le mode où elle est.

Mesuré à l'application, 53 cas, **zéro écart** : les évasions passent
(`n1gg3r`, `n_i_g_g_e_r`, `m0rtauxju1fs`, `s4l0p3`, `xX_nigga_Xx`), et
`niger`, `nigel`, `salopette`, `dispute`, `nazim`, `pedologie`, `technique`,
`unique_toi`, `heilmann`, `anne1988`, `José Ramírez` passent aussi.

**Le nom affiché est filtré comme l'identifiant.** Il est libre, plus long, et
paraît juste à côté sur la page : ne filtrer que le premier aurait fait un
garde-fou décoratif.

**Le refus ne dit jamais pourquoi.** `etat_identifiant` rend `reserve` pour les
deux causes et l'écran affiche « Cet identifiant n'est pas disponible ».
Distinguer « réservé » d'« interdit » désignerait la mutation qui a échoué,
donc apprendrait à contourner une entrée à la fois. Le message de la base
distingue en revanche les deux **colonnes**, pour que l'écran sache lequel des
deux champs montrer en rouge.

**Une liste de mots est toujours en retard**, elle attrape le cas courant et
pas quelqu'un qui cherche. C'est pourquoi elle ne va pas seule : le
signalement, ci-dessous, est le mécanisme qui apprend les mots qu'on n'a pas
prévus.

### `signalements`, le 3 août 2026

Migration `20260803_signalements.sql`. `cible_user_id`, `auteur_user_id`
(**nul** pour un visiteur sans compte), `motif`, `commentaire`, `statut`,
`cree_le`.

**Signaler demande un compte**, depuis `20260803_signalement_compte_requis.sql`.

La première version l'ouvrait aux visiteurs sans compte, au motif qu'on tombe
sur un profil par un lien partagé et qu'exiger une inscription reviendrait à ne
pas vouloir le savoir. **L'argument inverse l'emporte** : sans compte il n'y a
rien à dédoublonner, donc un seul plafond de flot pour toute défense, et un
signalement qui n'engage personne se prête au harcèlement d'un profil par
répétition. Avec un compte, « un signalement par personne et par profil »
redevient exécutoire.

`anon` a perdu l'`EXECUTE` : le refus arrive donc en **401**, avant la
fonction, et se lit comme un refus (§3). Vérifié.

    anon POST rpc/signaler_profil  ->  401 permission denied for function

**`auteur_user_id` reste nullable, et ce n'est pas une négligence.** La colonne
porte `on delete set null` : qui signale puis efface son compte laisse la ligne
en place, sans auteur, ce qui est voulu, le signalement porte sur le profil
visé. La rendre `not null` obligerait à passer la cascade en `delete`, donc à
perdre ces signalements. L'obligation vit dans la fonction, à l'écriture, pas
dans le type de la colonne. L'index unique reste partiel pour la même raison,
deux lignes devenues orphelines sur un même profil ne doivent pas se heurter.

La fonction rend un motif et non un booléen, `enregistre`, `deja`, `soi`,
`inconnu`, `trop`, `connexion`, chacun ayant sa phrase à l'écran. `inconnu` ne
distingue toujours pas l'inexistant du masqué.

**Le plafond de 50 non traités reste**, alors que « un par compte » borne déjà
le flot : il ne vise plus le même abus, il tient contre la création de comptes
en série, que l'inscription Google rend coûteuse mais pas impossible. Attention
en relisant : `on conflict` ignore les index partiels (§9), la fonction teste
donc l'existence explicitement.

**La modale s'ouvre quand même sans session**, et propose la connexion plutôt
que de laisser remplir un formulaire qui sera refusé. Le retour de Google
ramène sur le profil.

**Aucun accusé de réception par courriel.** `contact@jaquette.app` ne fait que
recevoir (§2), il n'y a pas de SMTP pour répondre. Les signalements s'empilent
dans une table qu'on relit à la main, et le message de confirmation ne promet
rien d'autre que la prise en compte. Le commentaire est borné à 500 signes à
l'écran **et** en base : un champ libre sans plafond est une invitation à y
déverser ce qu'on prétend combattre.

La table ne rend rien à personne, `revoke all` pour `anon` et `authenticated` :
un signalement nomme quelqu'un, il n'a rien à faire dans une réponse d'API.

### `bluray_import`, table de transit
6 201 fiches crawlées, avec statut : `promu` (6 017), `doublon` (184).
Invisible du site, aucune policy anon.

**Rien n'est plus en attente depuis le 2 août 2026**, et c'est le premier jour
où c'est vrai : `a_verifier` et `a_creer` sont à zéro, 6 017 + 184 = 6 201.

Les 464 `a_verifier` étaient un résidu de la passe manuelle de juillet, jugés
par un rapprochement **de titre** que `import_1b_dedupliquer.py` a depuis
abandonné, et qu'il ne mesure plus que pour mémoire. Leur repasser la règle
actuelle, l'EAN seul, a rendu **463 `a_creer` pour un seul vrai doublon**
(`reprendre_a_verifier.py`).

Ce qui a fait la décision n'est pas le rendement mais la nature des cibles :
les 464 visaient 206 éditions editioncollector, dont **une seule en a attiré
210**, intitulée `Steelbook – X-Men : La prélogie`, qui avait ramassé
`Halo Legends`, `Avatar 3D`, `Titanic 3D`, `Ghostbusters 1 and 2`. Une autre
s'appelle littéralement `Blu-ray 4K`. Le §9 dit déjà qu'un candidat réduit à du
vocabulaire d'édition n'est pas un titre ; **la règle vaut dans les deux sens,
la cible comme le candidat**. Second indice, décisif : sur les 130 paires où
les deux côtés portaient un EAN, **aucune** ne concordait.

### `offres`, posée le 3 août 2026, 724 lignes

Offres marchandes : `edition_id`, `marchand`, `reference`, `ean`, `prix`
(numeric), `devise`, `disponible`, `url`, `image_url`, `releve_le`. Unicité sur
`(edition_id, marchand, reference)`, index sur `edition_id` et sur `ean`.
Migration `20260803_offres.sql`, cascade sur `editions`.

**Table séparée, et surtout pas une colonne de plus sur `editions`.**
`prix_editeur` est un prix conseillé figé à la sortie du disque, dont la devise
dépend même de la source (§5, Zavvi en livres). Une offre est datée, change tous
les jours, et il y en aura plusieurs par édition dès le deuxième programme
accepté. Les mêler donnerait une colonne dont on ne saurait plus dire ce qu'elle
mesure.

`releve_le` n'est pas décoratif : un prix affiché est une information
commerciale, il doit se dater à l'écran, et une passe qui ne tourne plus doit se
voir plutôt que servir indéfiniment le prix de la semaine dernière.

`url` est le lien de tracking Awin, **jamais l'URL marchande nue**. C'est la
seule colonne dont une valeur fausse est silencieuse : le lien marche, il ne
rapporte simplement rien.

**Barrière posée comme `collections`, pas comme le catalogue.** `revoke insert,
update, delete, truncate` à `anon` **et** `authenticated`, policy `select` pour
tous. Vérifié par un vrai `INSERT` anon, pas par un `PATCH` sur filtre vide :

    42501  permission denied for table offres

**`etat` (text), ajoutée le 6 août 2026**, migration `20260806_offres_etat.sql`,
contrainte sur un vocabulaire fermé, `neuf | tres_bon | bon | acceptable`, index
partiel. 4 698 offres au 6 août, 3 014 E.Leclerc en neuf et 1 684 momox shop
dont **1 618 d'occasion** ; 413 éditions portent les deux marchands.

Elle existe parce que Momox vend de l'occasion : un « acceptable » à 3,49 € et un
neuf à 19,99 € sont deux offres légitimes du même disque, et rien ne les
distinguait. Les deux relevés viennent de la colonne `condition` du flux Awin,
jamais devinés, `new` sur les 91 320 lignes Leclerc et quatre valeurs chez Momox.

**`tres_bon` et non `comme_neuf`** : momox écrit « Très bon état », et traduire
son barème inventerait une garantie qu'il ne donne pas.

**Nullable, et le nul veut dire « le marchand ne le dit pas ».** Il ne veut pas
dire « neuf » : le supposer ferait entrer des disques d'occasion dans une
estimation de valeur sans que personne le voie. D'où un filtre **positif** dans
`lib/valeur.ts`, `etat` renseigné **et** différent de `neuf` ; un `neq` seul
laisserait passer les nuls.

**Le vocabulaire est fermé par contrainte, et c'est le garde-fou qui compte** :
un troisième marchand qui ferait entrer un cinquième mot rendrait tout filtre par
état silencieusement incomplet. `offres_awin.py` sort d'ailleurs **en erreur** sur
une valeur de `condition` inconnue plutôt que de retomber sur `null`.

### `editions_signalees`, posée le 3 août 2026

Signalement d'un disque absent du catalogue : `user_id`, `ean`, `note`,
`statut` (`nouveau|traite|refuse|doublon`), `cree_le`. Unicité sur
`(user_id, ean)`, un même code signalé deux fois par la même personne
n'apprenant rien. Cascade sur `auth.users`.

**`editions_signalees` et non `signalements`** : ce dernier nom porte déjà les
signalements de **profil**, et deux notions sans rapport sous un nom proche se
lisent de travers. Même raison qui a fait nommer `collection_editeur` la
colonne des séries d'éditeur.

**Barrière de `collections`, pas celle du catalogue.** `revoke all` pour
`anon` **et** `authenticated`, aucune policy : le refus arrive avant la RLS et
se lit comme un refus. Vérifié avec la clé anon du bundle :

    GET  editions_signalees        401  42501 permission denied
    POST rpc/signaler_edition      401  42501 permission denied
    rpc/mes_signalements_edition   404  pas exposée à anon

**Deux fonctions `security definer`, seules portes.** `signaler_edition`
porte **toutes** les règles qui décident : forme du code, refus des préfixes
`2`, quota journalier, présence au catalogue. `mes_signalements_edition` rend
les siens et rien d'autre.

**Elle rend un motif, jamais un booléen**, comme `etat_identifiant` :
`enregistre`, `deja_au_catalogue`, `ean_invalide`, `ean_magasin`,
`quota_atteint`. Les quatre refus ne se corrigent pas de la même façon, et
l'écran doit pouvoir le dire.

**Le quota est journalier et par compte**, vingt. Sans lui, un envoi
automatisé remplirait la table en une nuit ; vingt laisse largement la place à
quelqu'un qui saisit sa collection.

**Ce qui existe en double, et rien d'autre** : la *forme* du code, treize
chiffres, dans la fonction et dans `lib/signalements.ts`, pour que le champ
réponde à la frappe sans aller-retour. Exactement le partage retenu pour
l'identifiant public.

### Tables de sauvegarde
`editions_film_id_backup_20260728`, `editions_supprimees_20260728`.

### Sécurité
RLS activé partout. Policies `anon` en **lecture seule** sur `films`,
`editions`, `edition_films`. `bluray_import`, `kv_store_38e4ee68` et les tables
de sauvegarde répondent **401**, et `collections` aussi.

**Les privilèges d'écriture ont été retirés à `anon` le 2 août 2026**,
migration `20260802_revoquer_ecriture_anon.sql`. Ils étaient là depuis
toujours : Supabase donne par défaut `insert, update, delete, truncate` à
`anon` sur tout le schéma `public`, et seule l'absence de policy d'écriture
retenait la clé publique du bundle. La RLS faisait bien son travail, mesuré
avant la migration par un vrai `INSERT` :

    42501  new row violates row-level security policy for table "films"

**Mais c'était une barrière unique**, et elle tombe avec un
`disable row level security` posé le temps d'une migration. `collections`
montrait déjà la bonne façon de faire depuis le 30 juillet : révoquer les
privilèges, pour que le refus arrive avant la RLS. Les quatre tables de
travail et de sauvegarde sont passées en `revoke all` au même moment, donc
elles rendent 401 au lieu de `[]`, et un refus se lit enfin comme un refus.

Le `alter default privileges` de la même migration vise les tables à venir,
sinon la prochaine créée repart avec les droits d'écriture par défaut. Il porte
`for role postgres` : une table créée par un autre rôle y échapperait, à
vérifier dans `pg_default_acl` si une table neuve ressort inscriptible.

Après migration, l'écriture anon ne parle même plus de RLS :

    42501  permission denied for table films

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

**Le refus d'écriture anon est vérifié depuis le 2 août 2026**, par un `INSERT`
réel et non par un `PATCH` sur filtre vide, qui rend 200 que la policy accepte
ou refuse. Contrôlé après coup : `films.id=1` intacte, aucune ligne de test en
base. `rpc/supprimer_mon_compte` en anon rend **42501 permission denied for
function**, l'`EXECUTE` n'étant pas donné à ce rôle ; le garde-fou
`auth.uid() is null` n'est donc même pas atteint.

**En-têtes de sécurité posés le 2 août 2026** dans `public/_headers` : CSP,
`X-Frame-Options`, `Permissions-Policy`. Le jeton de session vivant dans
`localStorage`, une XSS quelconque vaut prise de compte, et rien n'empêchait un
script injecté d'exfiltrer où il voulait. Deux contraintes du site s'y lisent :
`style-src 'unsafe-inline'`, parce que le corps injecté par le middleware pose
ses styles en attribut, et un `img-src` à deux hôtes, mesurés en base sur les
36 031 URL de visuels, `img.jaquette.app` et `image.tmdb.org`. Le JSON-LD
n'exige rien, un `<script type="application/ld+json">` étant un bloc de données
que le navigateur n'exécute pas. Éprouvé sous `wrangler pages dev dist`, seule
façon de servir `_headers` et `functions/` ensemble : fiche film, accueil et
`/about` rendus sans une violation en console, morceau `lazy()` chargé en 200.

**`img-src` en porte sept depuis le 7 août 2026**, et la directive est un
**instantané** : chaque source qui apporte ses propres visuels ajoute un hôte,
et l'oubli ne casse rien de bruyant. `cdn.shopify.com` est entré le 3 août,
provisoire le temps de miroiter les visuels Metaluna ; `media.e.leclerc` le 4,
et celui-là est définitif, le §5 posant qu'E.Leclerc est la seule source dont
les visuels sont **licenciés pour l'usage affilié**. Le sixième est le projet
Supabase lui-même, qui sert les photos de profil, et **`blob:` est arrivé avec**
pour que la fenêtre de recadrage affiche le fichier choisi avant tout réseau.

**Le septième est `fgellaobb.filerobot.com`, et c'est E.Leclerc une seconde
fois.** Filerobot est le CDN qui sert `media.e.leclerc` ; la passe Awin du
6 août a écrit 436 offres sous le nom d'hôte brut du CDN plutôt que sous le nom
de marque, avec la même grammaire d'URL au caractère près,
`/LEN/fp/<EAN>_1?vh=…&w=1000&h=1000&func=fit`. Vérifié avant d'ouvrir, et pas
supposé : **436 lignes sur 436 portent `marchand = E.Leclerc`**, zéro chez
momox, et le fichier répond 200 en `image/jpeg`. Même statut que le quatrième
hôte, donc, flux Awin et visuels licenciés.

**Ce qu'aucune des six entrées précédentes ne disait : un même marchand peut
servir ses visuels sous deux noms d'hôte, sans que rien ne l'annonce.**
Autoriser le nom de marque ne suffit donc pas, et la source de vérité n'est pas
le nom du marchand mais la colonne `image_url`, à recompter après chaque passe
de flux.

    select split_part(split_part(image_url, '//', 2), '/', 1), count(*)
    from offres group by 1 order by 2 desc

#### L'audit complet des hôtes, le 8 août 2026, et quatre restent dehors

La question a été posée une bonne fois sur **toutes** les colonnes affichées, et
non sur `offres` seule : `films.affiche_url`, `backdrop_url`, les `photo` de
`cast_principal`, `editions.image_url`, `images_secondaires`,
`offres.image_url`, `profils.avatar_url`. Les colonnes `*_source` en sont
exclues, elles gardent la provenance et ne sont jamais rendues.

    image.tmdb.org           157 597    autorisé
    img.jaquette.app          19 657    autorisé
    images2.medimops.eu       10 834    autorisé
    media.e.leclerc            6 982    autorisé
    cdn.shopify.com            5 523    autorisé
    fgellaobb.filerobot.com    1 370    autorisé   dont 934 en éditions
    ------------------------------------------------------------------
    www.coindemirecinema.com     191    BLOQUÉ
    diaphana.fr                  142    BLOQUÉ
    thejokers-shop.com            43    BLOQUÉ
    www.solaris-distribution…      4    BLOQUÉ

**Deux choses que le décompte par `offres` seule ne pouvait pas dire.** Filerobot
porte 934 lignes de plus dans `editions.image_url`, donc l'ouverture de la CSP
sert au-delà des 436 offres qui l'ont motivée ; et les quatre boutiques
d'éditeur du 4 août sont bloquées **depuis leur import**, sans que rien ne l'ait
signalé pendant quatre jours. C'est l'instantané du §3 pris en défaut une
seconde fois, et cette fois sur une source de catalogue et non de prix.

**Ce n'est pas du lien mort**, les quatre répondent 200. Mesuré à l'écran sur
`/movies/adorables-creatures-1952/22239` : sonde `Image()` en `ECHEC`, et la
ligne d'édition affiche le **SVG d'image cassée** en data: URI, pas l'affiche
TMDB, le repli de `CarteEdition` ne jouant que sur une URL nulle.

**Décision du 8 août 2026 : miroir R2 en septembre, pas d'ouverture de CSP.**
Même arbitrage que pour Metaluna au §5, et pour la raison du §10, le site est
sorti de toute dépendance à un tiers pour ses visuels et `cdn.shopify.com`
traîne déjà cette dette sous l'étiquette « provisoire ». S'y ajoute une raison
propre à ces quatre-là : **aucune n'a de grammaire de redimensionnement
utilisable**, là où Leclerc honore `w` et `h`.

    diaphana.fr             1 625 353 o   PNG, WordPress, aucun paramètre
    thejokers-shop.com      2 583 205 o   PNG, Shopify, `width=` existe
    coindemirecinema.com       48 260 o   Shopify, `_1024x` dans le nom
    solaris-distribution.com   99 459 o   WordPress, aucun paramètre

Ouvrir la directive telle quelle ferait donc tirer 2,5 Mo pour un cadre de
56 × 84, soit le défaut que le §5 vient de refermer chez Leclerc. Le miroir
règle les deux d'un coup, l'hôte et la taille.

**Ce qui reste visible d'ici là** : 380 éditions montrent un glyphe d'image
cassée. Le repli sur l'affiche du film à l'`onError` de la balise coûterait
trois lignes et vaudrait mieux qu'un glyphe, mais il masquerait aussi les vrais
404 : à décider avec le miroir, pas avant.

**Le contrôle qui tranche est une sonde `Image()`, pas le Resource Timing**, et
c'est la correction du 7 août poussée jusqu'au bout. Mesuré sur la fiche 15119
en production : `transferSize 0, status 0` sur **les trois** hôtes de la page,
`image.tmdb.org` et `img.jaquette.app` compris, alors que leurs images
affichaient 1 280 et 1 000 pixels. La signature du §3 ne dit donc rien du tout
dès qu'aucun hôte ne pose `Timing-Allow-Origin`. Ce qui tranche est de charger
les deux hôtes depuis la page, sous la CSP qu'on soupçonne :

    new Image().src = '…filerobot…'   -> onerror   bloque
    new Image().src = '…e.leclerc…'   -> onload    naturalWidth 200

**La taille est réglée dans la foulée**, `lib/visuels.ts` ne réécrivant `w` et
`h` que pour `media.e.leclerc` : ces 436 offres tiraient l'original pour un
cadre de 56 × 84. Mesuré sur dix lignes réelles, avant puis après :

    forme requête   792 Ko à 1 013 Ko   ->  49 à 67 Ko    200 × 200
    forme chemin     91 Ko à  228 Ko    ->  24 à 66 Ko    200 × 200

**Ma crainte sur la forme sans point d'interrogation était fausse, et la mesure
l'a dite.** J'avais écrit que `searchParams.set` accolerait un second jeu de `w`
et `h` au premier ; il n'y a pas de premier jeu. Les paramètres écrits dans le
chemin, `…/<EAN>_1&w=1000&h=1000&func=fit&org_if_sml=1`, sont **inertes** :
remplacer `w=1000` par `w=200` dedans rend le même fichier à l'octet près,
203 757 o en 600 × 813, le CDN lisant tout cela comme une partie du nom. Ce qui
rétrécit est d'ajouter une vraie chaîne de requête par-dessus, ce que
`searchParams.set` fait tout seul puisqu'il n'y en a aucune.

**Le seul vrai piège de ces 128 est que `func` manque**, la requête n'existant
pas. Il est donc posé quand il est absent et jamais écrasé : mesuré, `func=fit`
est présent sur les 2 973 autres et absent sur ces 128 exactement. L'imposer
partout écraserait un jour un `func` que la source aurait voulu autre.

**Retenir la forme du raisonnement fautif** : « le paramètre est écrit dans
l'URL, donc il compte ». Un CDN décide seul de ce qu'il lit, et deux URL qui se
ressemblent ne se comportent pas forcément pareil. Une requête `curl` valait
mieux qu'une lecture de la chaîne.

**La signature d'un blocage CSP est à connaître, elle ne ressemble à rien
d'autre** : les 2 312 éditions Leclerc rendaient un cadre gris alors que la
colonne était remplie et que le fichier répondait.

    transferSize 0, status 0     -> CSP, la requête ne part pas
    transferSize 0, status 404   -> le fichier n'existe pas
    aucune requête du tout       -> `image_url` vide en base

Zéro octet **et** zéro statut, c'est la CSP. La console, elle, ne dit rien
d'exploitable.

**Correction du 7 août 2026 : cette signature a un faux positif, et il est
courant.** Une image **d'un autre domaine** qui ne renvoie pas d'en-tête
`Timing-Allow-Origin` rend elle aussi `transferSize 0` et `responseStatus 0`,
alors qu'elle a parfaitement chargé — c'est le cas de toutes celles du Storage
Supabase. Relevé en éprouvant les photos de profil sous `wrangler` : la mesure
annonçait un blocage, `naturalWidth` valait 512.

    naturalWidth > 0   ->  l'image a chargé, quoi que dise le Resource Timing
    naturalWidth === 0 ->  là seulement, chercher du côté de la CSP

**Trancher sur `naturalWidth`, pas sur le Resource Timing**, dès que l'hôte
n'est pas le nôtre. Le tableau ci-dessus ne vaut que pour les images de même
origine, ou pour celles dont l'hôte pose `Timing-Allow-Origin`.

**HSTS activé le 2 août 2026**, et **« Toujours utiliser HTTPS » avec lui**.
Les deux se règlent dans Cloudflare, SSL/TLS puis Certificats de périphérie, et
non dans `_headers` : le tableau de bord est la seule source de ces deux-là.

    strict-transport-security: max-age=15552000; includeSubDomains

180 jours, sous-domaines compris, **sans préchargement**. Vérifié sur l'apex,
sur `www`, sur une fiche film et sur `img.jaquette.app`.

**Ce que HSTS gagne n'est pas de la sécurité seule, c'est aussi un aller-retour.**
Le 301 de `http://` vers `https://` voyage en clair et arrive trop tard pour
empêcher quoi que ce soit ; une fois l'en-tête vu, le navigateur réécrit
l'adresse chez lui, avant d'ouvrir la moindre connexion. Le visiteur qui arrive
déjà en `https://`, c'est-à-dire presque tout le monde puisqu'ils viennent de
Google, ne paie rien : une cinquantaine d'octets d'en-tête, aucune requête.

**Le préchargement reste à Off, et ce n'est pas un oubli.** Il inscrit le
domaine dans une liste embarquée dans le code des navigateurs, appliquée dès la
première visite ; en sortir prend des mois et une mise à jour de navigateur. À
rouvrir quand les six mois auront tourné sans incident.

**Ce qui se défait mal, c'est le retour en arrière**, pas le réglage : il faut
d'abord couper HSTS, puis attendre l'expiration du `max-age` chez les visiteurs
déjà venus, avant de pouvoir retirer HTTPS du domaine. Sans cet ordre, le site
est injoignable le temps restant. Trois hôtes servent en HTTPS valide, apex,
`www` et `img`, donc rien ne l'exige aujourd'hui.

**« Toujours utiliser HTTPS » comblait un trou réel**, mesuré avant de le
cocher : l'apex et `www` redirigeaient déjà, mais `img.jaquette.app` servait
ses jaquettes **en clair, code 200, sans redirection**. La redirection Pages ne
couvre pas le bucket R2 ; celle-ci, posée à la périphérie, couvre toute la zone.

L'encadré Cloudflare avertit d'une boucle de redirection quand l'origine
redirige elle aussi vers HTTPS. Vérifié après coup, il n'y en a pas : un saut
sur l'apex, sur une fiche et sur une image, deux sur `www` qui passe par
l'apex, 200 au bout à chaque fois, suivi jusqu'à cinq sauts.

**Non vérifié** : `supprimer_mon_compte()` sous une vraie session. Elle est exposée dans
l'OpenAPI et le DDL est passé, mais l'appeler pour confirmer son garde-fou
`auth.uid() is null` supposerait de risquer l'effacement d'un compte réel si le
jeton employé portait une revendication `sub`. Pas de test destructif pour
valider un garde-fou.

### Audit du 2 août 2026

Passé deux fois, la seconde après correction. Ce qui suit est l'état mesuré, pas
l'état supposé : chaque ligne a été exercée avec la clé `anon` du bundle, celle
que n'importe quel visiteur possède.

**Six défauts trouvés, six corrigés.** Aucun n'était exploité, tous étaient à
barrière unique, ce qui est le vrai motif de les avoir traités :

| | corrigé par |
|---|---|
| privilèges d'écriture `anon` sur le catalogue | `20260802_revoquer_ecriture_anon.sql` |
| aucun en-tête de sécurité, pas de CSP | `public/_headers` |
| pas de HSTS, `img` servi en clair | tableau de bord Cloudflare |
| inscription par email ouverte côté projet | tableau de bord Supabase |
| `jaquette.pages.dev` indexable et autocanonique | `functions/_middleware.ts` |
| redirection ouverte possible dans `connexionGoogle` | `cheminInterne()` dans `lib/auth.ts` |

Chacun est décrit à sa place, ici ou au §7, avec ce qui a été mesuré avant et
après. Les deux réglages de tableau de bord n'ont **aucune trace dans le
dépôt**, c'est la raison d'être de ces notes.

**Ce qui ressort propre, et comment ça a été établi** :

    INSERT / PATCH / DELETE anon sur films, edition_films   401
    collections, bluray_import, kv_store, sauvegardes       401
    films, editions, edition_films en lecture               200
    rpc/supprimer_mon_compte en anon                        401
    storage/v1/bucket                                       200 mais []
    graphql/v1                                              200 mais extension absente
    R2 : listing 404, PUT et DELETE anonymes                401

Les sept fonctions de `public` ont `search_path = ''`, une seule est
`security definer` et `anon` n'a pas son `EXECUTE`. Aucun cookie n'est posé par
le site, donc rien à voler et pas de CSRF à monter. Le code ne porte ni `eval`,
ni `innerHTML`, ni `http://` en dur ; les trois liens `target="_blank"` ont leur
`rel="noreferrer noopener"` ; le middleware compte 36 appels à `echapper()` et
ne passe `{html:true}` qu'à du contenu qui en sort. Aucun secret dans `dist/`
ni dans l'historique git.

**Deux pièges de méthode, tous deux rencontrés ce jour-là.** Ils sont la
version « surface HTTP » du §9, un scan cassé se lit comme un scan négatif :

- **un 200 ne dit rien tant qu'on n'a pas lu le corps.** `storage/v1/bucket` et
  `graphql/v1` répondent tous deux 200 en anon ; le premier rend `[]`, aucun
  bucket, le second une **erreur** disant que `pg_graphql` n'est pas activé.
  Conclure sur le code aurait inventé deux surfaces qui n'existent pas ;
- **un avis de vulnérabilité se lit sur le mode employé, pas sur le paquet**,
  cf. react-router au §9.

**Ce qui reste ouvert, et pourquoi c'est un choix** :

- **`npm audit` garde un `high`**, « RSC Mode CSRF Bypass », qui ne se corrige
  qu'en react-router 8 et ne concerne pas un `BrowserRouter` déclaratif ;
- **quatre avis Supabase en `INFO`**, « RLS activée sans policy » sur les tables
  fermées : c'est l'état voulu depuis qu'elles sont en `revoke all`, le linter
  ne sait pas que la barrière est ailleurs ;
- **cinq avis `WARN` « Can Execute SECURITY DEFINER Function » depuis le 3 août
  2026**, sur `profil_public`, `editions_du_profil`, `etat_identifiant` et
  `supprimer_mon_compte`. C'est leur raison d'être : ces fonctions *sont* la
  porte contrôlée, et le linter signale la catégorie, pas un défaut. Chacune
  filtre ce qu'elle rend, et `profils` comme `collections` restent en
  `revoke all` pour `anon` (§3). Ce qu'il faudra vraiment relire un jour, c'est
  leur corps, pas leur existence ;
- **`supprimer_mon_compte` reste exécutable par `authenticated`**, c'est sa
  raison d'être, et son garde-fou n'est toujours pas éprouvé sous une vraie
  session, voir juste au-dessus ;
- **le préchargement HSTS reste à Off**, à rouvrir après six mois sans
  incident ;
- **la création de comptes Google reste ouverte à tous**, et doit l'être : c'est
  le parcours du site. Fermer l'inscription par email retire l'adresse jetable,
  pas le compte Google. Si l'abus arrive, le levier suivant est Supabase,
  Authentication puis Rate Limits, et non le code.

**Ce que l'audit n'a pas couvert** : les workflows GitHub Actions et leurs sept
secrets, qui vivent dans le dépôt privé `jaquette-scraping` (§6), et le contenu
de `auth.users` au-delà d'un décompte par fournisseur.

### Second audit, le 3 août 2026

Repassé en six domaines parallèles, chaque constat confié ensuite à un relecteur
chargé de le **réfuter** plutôt que de le confirmer. **Cinq des huit constats
les plus graves sont tombés à cette relecture**, dont deux qui décrivaient un
état déjà corrigé : l'arbre a bougé trois fois pendant l'audit, et le
signalement anonyme a été fermé dix minutes après avoir été introduit. Un
rapport rendu sans cette étape aurait annoncé des failles inexistantes.

**Le défaut le plus grave n'était pas sur le site mais sur la machine**, et
aucun contrôle du dépôt ne pouvait le voir : voir §2, le fichier de secrets en
`0644`. Le reste est mineur et corrigé :

- **`cheminInterne()` se contournait par une tabulation.** Le garde-fou posé la
  veille inspectait la chaîne brute, or l'analyseur d'URL retire tabulations et
  sauts de ligne **avant** de résoudre : `"/\t/evil.example"` passait le test
  puis devenait absolu. Il résout maintenant d'abord et compare l'origine
  ensuite, forme qui n'a rien à énumérer donc rien à oublier. Un garde-fou qui
  se contourne est pire qu'aucun, il éteint la vigilance ;
- **`offres.url` partait dans un `href` sans contrôle de schéma**, seul `href`
  dynamique du site, et rien en aval ne filtre `javascript:` : React n'avertit
  qu'en développement, et le filtre de react-router ne couvre que `<Link to>`.
  Contrôlé au rendu, `lienMarchand()` dans `FilmDetailPage`, parce que
  l'affichage est le seul endroit qui voie toutes les sources ;
- **l'en-tête `Host` pilotait `url.origin`**, donc le canonical, `og:url` et le
  `Location` des 301. Cloudflare refuse les hôtes hors zone, `evil.example`
  rend 403, mais le **port** passait : `Host: jaquette.app:8080` produisait un
  canonical vers `https://jaquette.app:8080`. L'origine est normalisée une fois
  à l'entrée du middleware plutôt que sur quinze lignes ; les autres hôtes
  gardent la leur, `localhost` et les prévisualisations en ont besoin ;
- **`texte_interdit` était appelable par tout compte connecté**, migration
  `20260803_texte_interdit_ferme.sql`. Un booléen interrogeable à volonté publie
  la liste aussi sûrement que la table elle-même, un mot à la fois, et surtout
  il dit quelle **graphie** passe.

  Le piège, et il aurait cassé la création de profil : `profils_normaliser` est
  un déclencheur **`security invoker`**, donc il s'exécute sous le rôle qui
  écrit et vérifie ses privilèges de fonction. Le relecteur affirmait le
  contraire, « le déclencheur tourne sous le propriétaire ». Mesuré avant
  d'écrire, puis après : sous `authenticated`, l'insertion traverse bien le
  déclencheur, un identifiant interdit rend toujours `23514 identifiant
  indisponible`, l'appel direct rend `42501 permission denied for function`, et
  `etat_identifiant` répond encore. **Un verdict de relecture se vérifie comme
  le reste.**

#### Les quatre points mineurs, fermés le 4 août 2026

**La liste blanche de redirection ne porte plus d'adresse locale.**
`http://localhost:5173` y était, et **une seconde que l'audit n'avait pas vue**,
`http://localhost:50405`, parce qu'il n'avait sondé que le port qu'il
connaissait. Une sonde qui cherche une valeur précise ne trouve que celle-là :
regarder la liste entière valait mieux que l'interroger. Restent trois entrées,
le domaine et les deux formes `pages.dev`, nécessaires aux prévisualisations.

    redirect_to=http://localhost:5173/x   ->  https://jaquette.app   (refusé)
    redirect_to=https://jaquette.app/x    ->  https://jaquette.app/x (honoré)

Contrepartie assumée : la connexion Google ne fonctionne plus depuis un serveur
de développement local pointant sur le projet de production. Pour la retrouver,
réajouter l'entrée dans Supabase, Authentication puis URL Configuration, ou
faire pointer le développement sur une branche du projet.

**`/legal` et `/privacy` servis sans JavaScript disent enfin la même chose que
la page.** Le corps injecté annonçait « site personnel édité à titre non
professionnel », trois fois, sans SIREN ni mention d'affiliation. Mesuré en
production après correction : zéro occurrence de « non professionnel », SIREN,
franchise en base, liens affiliés et « n'est pas intermédiaire de vente »
présents. **L'adresse et le téléphone n'y sont pas**, et c'est délibéré : la
page les porte, ce qui satisfait l'obligation d'accessibilité, et `/legal` est
en `noindex` justement pour qu'ils ne remontent pas dans les résultats (§7).

**14 dépendances directes retirées**, celles qu'aucun fichier n'importe, pas
même les `ui/` : MUI et emotion, react-dnd, react-slick, recharts, date-fns,
motion, et le reste du bac à sable Figma Make. Les 37 autres des 51 relevées
sont importées par les `ui/` eux-mêmes ; les retirer suppose de supprimer ces
47 composants, ce qui ne se fait pas pendant que d'autres écrans s'écrivent.

**Le retrait a révélé une fragilité que l'audit n'avait pas vue** :
`@types/react` et `@types/react-dom` n'étaient déclarés nulle part et
n'arrivaient que par transitivité, sans doute par MUI. Sans eux, `tsc` ne trouve
plus le namespace React et le build casse. Ils sont désormais des
devDependencies explicites. **Une dépendance qu'on n'a jamais déclarée est une
dépendance qu'on perdra sans comprendre pourquoi.**

**La file de `signalements` a une sortie**, `signalements.yml` dans le dépôt de
collecte (§6). Rien de nominatif n'entre dans l'issue, ni le compte visé, ni
l'auteur, ni le commentaire : un signalement nomme quelqu'un et une issue garde
son texte pour toujours. Le triage reste manuel, par l'éditeur SQL, et c'est
voulu, décider qu'un signalement est fondé n'est pas une opération de script.

---

## 4. État du catalogue

Mesuré le 3 août 2026 en fin de journée. **Ces chiffres bougent plusieurs fois
par jour** depuis que les cinq passes tournent sur Actions et que les vagues
Metaluna s'enchaînent : les relever plutôt que les recopier.

### 6 août 2026, l'entrée du DVD

| | 5 août | 6 août |
|---|---|---|
| Éditions | 23 803 | **26 754** |
| Films | 12 129 | **13 234** |
| **Codes-barres** | 8 090 (34,0 %) | **41,1 %** |
| Éditions rattachées | 92,0 % | **92,9 %** |
| Éditions portant un support connu | 19 027 (79,9 %) | **97,9 %** |
| dont `DVD` | 1 553 | **6 219** |
| Sitemap | 13 623 URL | **14 857 URL** |

    étiquetage des formats          7 418 éditions complétées, 0 créée
    Leclerc, DVD qualifiés dvdfr    2 750 éditions,  1 087 films créés
    coffrets Leclerc, découpés         65 éditions,    149 liens
    boutiques d'éditeur               136 éditions
    Zavvi                               0, filon épuisé (§5)

**La couverture EAN franchit 40 % pour la première fois**, et c'est le vrai
résultat de la journée. Toutes les vagues depuis Zavvi la faisaient baisser,
le dénominateur montant plus vite que le numérateur ; celle-ci la relève de
**6,9 points** parce que les DVD Leclerc portent un code-barres à 100 %. C'est
elle qui bloquait le scan du §8, fonction la plus demandée.

**Le taux de rattachement monte, et pour la raison habituelle** : ces lots
n'écrivent que du rattaché. Un taux qui monte dit ce qu'on a écrit, pas ce
qu'on a mesuré (§4, 4 août).

**Ce que la journée n'a pas réglé**, et c'était mesuré d'avance : le creux
2000-2014. Les 19 absents nommés du banc d'essai rendent 4 titres dans les
3 478 DVD Leclerc, exactement ceux que le Blu-ray apportait déjà. Le DVD
élargit le catalogue, il ne comble pas le fonds.

**Les 1 154 refus de la passe DVD sont des coffrets, pas des ratés.** Le motif
dominant, 517 sur 1 154, est « titre exact, aucun contrôle ne confirme », ce qui
se lit comme un contrôle trop strict. En regardant les fiches, c'en est un autre
qui parle : `realisateur` y vaut `Coffret trilogie`, `L'Intégrale 8 films`,
`Coffret anthologie 4 f`, `Vol. 2`, et les durées sont des totaux de boîtier,
264 ou 362 minutes. C'est le piège du champ `realisateur` de dvdfr consigné au
§6, et il fait ici office de **signal** : là où il porte du vocabulaire de
coffret, la fiche en est un.

`coffrets_leclerc.py` rejoué sur ces 668 refus neufs rend **65 coffrets validés
et 149 liens**, à la somme des durées. 436 échecs et 167 à relire restent, et
c'est le même plafond qu'au 4 août : sans durée par film, aucune des deux
mesures concordantes n'est disponible.

Relevé à nouveau le **4 août 2026** après les imports Leclerc et The Jokers,
puis en fin de journée, les écritures Leclerc s'étant poursuivies entre les deux.

| | 4 août, après-midi | 4 août, soir |
|---|---|---|
| Films | 11 710, dont 751 séries | 11 749 |
| Éditions | 23 028 | 23 246 |
| dont source `leclerc` | 2 301 | 2 400 |
| Codes-barres | **7 790 (33,8 %)** | — |
| Éditions rattachées | 21 131 (**91,8 %**), pour 24 079 liens | — |
| Éditions sans film | 1 897 | — |
| Éditions avec visuel | 22 708 (98,6 %) | — |
| **Offres marchandes** | **3 026** | **3 014** |

**Les offres au 6 août 2026, après Momox** : 4 698 lignes, 3 014 E.Leclerc en
neuf et 1 684 momox shop dont 1 618 d'occasion, sur **4 285 éditions**, dont 413
qui portent les deux marchands. Le catalogue lui-même n'a pas bougé, cette passe
n'important rien (§6).

Les 13 codes de magasin sans valeur hors enseigne sont toujours dans le compte
des codes-barres.

**Les offres baissent de 12 et ce n'est pas une perte** : la passe Awin purge ce
qu'elle n'a pas revu dans le flux du jour, un produit délisté chez le marchand
n'ayant plus ni prix ni lien valides (§6). Le seuil d'alerte est à 998.

**La couverture EAN remonte pour la première fois**, de 26,5 % le 3 août à
33,8 %. Toutes les campagnes précédentes la faisaient baisser, Zavvi et
Metaluna n'en publiant aucun : c'est le premier import qui apporte du
code-barres en masse, et c'est lui qui débloque le scan du §8, fonction la plus
demandée.

**La journée du 4 août 2026, +2 426 éditions et +839 films** :

    Leclerc, qualifié par dvdfr    2 301 éditions, 586 films créés
    The Jokers                        29 éditions,   7 films créés

Le taux de rattachement monte de 87,9 à 91,8 %, et pour une raison qui n'est
pas une amélioration de méthode : **ces deux lots n'écrivent que du rattaché**,
comme Zavvi avec `--rattachees-seules`. Un taux qui monte dit ce qu'on a écrit,
pas ce qu'on a mesuré.

**Quatre lots de plus dans la nuit du 4 août 2026, +740 éditions et +419
films**, tous isolables séparément :

| lot | éditions | liens | source du lien |
|---|---|---|---|
| Coin de Mire Cinéma | 124 | 124 | `coindemire` |
| coffrets Leclerc, découpés | 64 | 156 | `leclerc_dvdfr_coffret` |
| reprise Zavvi à quatre mesures | 460 | 460 | `zavvi_reprise` |
| Diaphana, première WooCommerce | 92 | 92 | `diaphana` |

    23 803 éditions | 8 090 EAN (34,0 %) | 92,0 % rattachées
    12 129 films | 24 940 liens | sitemap 13 420 URL avant Diaphana

**La couverture EAN monte puis redescend dans la même journée, et les deux
mouvements se lisent.** 26,5 % le 3 août, 33,8 après Leclerc, **34,5 après Coin
de Mire**, puis **33,8 de nouveau** après les 460 Zavvi, qui n'apportent aucun
code-barres. Le dénominateur décide, pas le numérateur : c'est l'arbitrage à
poser avant chaque import, une source sans EAN dessert le scan du §8 même quand
elle enrichit le catalogue.

**198 éditions ont été enrichies par dvdfr** dans la foulée, date de parution
française, zone, distributeur, ratio et nombre de disques, sur les seules
colonnes vides.

**Les 65 collections Metaluna sont passées le 3 août 2026**, en deux vagues
locales : 33 éditeurs français puis 14 catalogues d'import, **+5 119 éditions
et +2 207 films en une journée**, le plus gros mouvement depuis Zavvi. Aucune
n'est miroitée, les 5 119 portent l'URL de la boutique ; les 1 615 sur
`img.jaquette.app` sont celles du 1er août.

**Le compteur de collection majore de 23 %, pas de 10 %.** La vague d'import
annonçait 3 771 fiches et en a servi 2 916. Retenir cette marge pour les
prochaines estimations.

**Le rattachement d'un catalogue anglophone est très inégal**, et bien plus
bas que le français :

    kino-lorber      492/635   77 %      88-films          97/228   43 %
    warner-archive   249/323   77 %      eureka            49/129   38 %
    vinegar-syndrome 192/250   77 %      second-sight      25/76    33 %
                                         arrow-video       67/287   23 %

Les mauvais sont les labels d'auteur, dont les catalogues sont faits de
coffrets et de rétrospectives. Arrow à 23 % est le plus bas jamais mesuré.
Ces lignes sont orphelines, pas mal rattachées : `relire_metaluna.py --toutes`
est fait pour ça.

**Ce que la journée n'a pas réglé, et c'était prévisible.** `Les Yeux sans
visage` n'a toujours que son Criterion, `Moonlight` n'a toujours aucune fiche.
Metaluna est un **revendeur** : il stocke ce qu'il vend aujourd'hui, pas un
fonds. Le Blu-ray Gaumont 2010 est épuisé, l'édition française de Moonlight
n'est dans aucune des 65 collections. Élargir le crawl de revendeurs ne
comblera pas ce reste ; c'est le signalement d'édition par l'utilisateur,
branché sur l'enrichissement dvdfr par code-barres, qui répond à ce cas.

**La couverture EAN est retombée à 26,5 %**, 5 460 codes pour 20 602 éditions,
contre 35 % au 2 août. Aucun code n'a été perdu : le dénominateur a doublé,
Zavvi et Metaluna n'en publiant aucun. C'est ce qui bloque le scan de
code-barres (§8) et ce qui rend le flux Leclerc précieux, lui donnant l'EAN à
100 %.

**Le taux de rattachement est descendu de 94,2 à 87,9 %**, et c'est la même
mécanique qu'au 2 août, en sens inverse : les vagues Metaluna font entrer des
catalogues d'éditeurs que TMDB indexe mal. Le nombre absolu d'orphelines monte,
le taux baisse, et un taux qui ne baisse jamais serait le signe qu'on force les
liens.

**Zavvi est entré le 2 août 2026**, +4 446 éditions et +2 822 films, le plus
gros import du catalogue, et le premier à passer **entièrement par GitHub
Actions** (§6). Le nombre de codes-barres n'a pas bougé d'une unité : Zavvi
n'en publie aucun.

**Le fonds blu-ray.com a été clos le 2 août 2026**, +739 éditions et +62 films
en deux lots, et il ne reste **rien en attente** : 6 201 fiches énumérées,
6 017 éditions, 184 doublons.

| lot | éditions | liens | films |
|---|---|---|---|
| les 464 `a_verifier` de juillet, relues | 463 | 380 | 5 |
| les 284 fiches jamais collectées | 276 | 243 | 57 |

Les 284 manquaient parce qu'`enum_fr.py` avait rendu 6 201 ids là où la base en
portait 5 917 : le listing du site tourne, et le §5 rappelle que le fichier se
**fusionne** au lieu de s'écraser. Crawlées à 5 s d'intervalle, 25 minutes,
zéro échec, et le cache de `crawl/pages/` est désormais **complet à 6 201**.

**La couverture en visuels est passée de 99,7 à 97,9 %**, et ce n'est pas une
régression : les 319 éditions sans jaquette sont à 296 des fiches blu-ray.com
dont l'image répond **404 chez eux**. Elles retombent sur l'affiche TMDB du
film. Le point mesuré au passage : leur serveur d'images a servi une série de
**521** en pleine passe, code Cloudflare signifiant que l'origine ne répond
plus. Ce n'est ni 403 ni 429, donc ni blocage ni limite de débit ; le
coupe-circuit du miroir s'est arrêté à 20 échecs d'affilée, et une reprise deux
heures plus tard a passé les 304 images restantes sans un échec.

**Dix catalogues d'éditeurs sont entrés le 1er août 2026**, +1 827 éditions et
+1 235 films, soit une journée qui a fait grossir la base d'un cinquième :

| source | éditions | rattachées | visuels sur R2 |
|---|---|---|---|
| Criterion (Metaluna) | 338 | 269 (80 %) | 340 |
| Carlotta Films (Metaluna) | 231 | 172 (72 %) | 250 |
| Le Chat qui fume | 212 | 197 (93 %) | 473 |
| Rimini Editions (Metaluna) | 191 | 174 (89 %) | 197 |
| ESC Editions (Metaluna) | 177 | 145 (81 %) | 181 |
| Elephant Films (Metaluna) | 177 | 143 (80 %) | 191 |
| Sidonis Calysta (Metaluna) | 158 | 140 (89 %) | 158 |
| Artus Films (Metaluna) | 148 | 114 (77 %) | 155 |
| Make My Day! (Metaluna) | 94 | 86 (91 %) | 97 |
| Extralucid Films (Metaluna) | 56 | 45 (80 %) | 56 |
| Potemkine (Metaluna) | 52 | 40 (71 %) | 58 |

**Metaluna concentre les orphelines** : 302 sur 1 615, soit 18,7 %, contre
7,2 % chez blu-ray.com et 5,1 % chez editioncollector. Ce n'est pas le
parseur, c'est le catalogue : ces éditeurs d'auteur vendent des coffrets et
des rétrospectives que TMDB n'indexe pas comme des œuvres.

**Le taux suit la qualité de la fiche, pas celle de la source.** Rimini est à
89 % et Carlotta à 72 % chez le même revendeur, avec le même parseur : là où
TMDB publie un `runtime`, le contrôle par durée tranche ; sur le bis italien
et espagnol d'Artus ou les coffrets d'auteur de Carlotta, il n'a rien à
mordre, et seul le réalisateur reste.

**Aucune édition Metaluna ne porte d'EAN**, leur `sku` valant `FILM` partout.
La déduplication contre les autres sources se fait donc sur le **titre**,
replié sur son vocabulaire d'édition et restreint au même éditeur :
`Le Conseiller / Napoli spara!` de blu-ray.com et `Le Conseiller + Napoli
spara!` de Metaluna sont le même disque. 11 doublons écartés à l'écriture ;
7 autres, écrits avant que le garde-fou existe, restent à fusionner.

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

### blu-ray.com, 6 017 éditions
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

**La règle générale « ne pas contourner un blocage » a été levée le 1er août
2026**, l'éditeur assumant la responsabilité de ses collectes. Ce qui la
remplace est une distinction, pas une interdiction :

- **un `robots.txt` qui refuse nommément un agent est une politique déclarée**,
  et on la respecte. C'est le cas ici, voir ci-dessous ;
- **un 403 servi par un pare-feu alors que le `robots.txt` autorise** est un
  effet de bord technique, pas une décision éditoriale. criterion.com est dans
  ce cas : son `robots.txt` ouvre tout sauf panier et facettes, et son WAF
  refuse pourtant jusqu'à la racine.

**Un `Disallow` nommant `ClaudeBot` vise l'assistant, pas l'éditeur du site.**
La distinction n'est pas un détour, elle est écrite dans leur fichier : le
bloc `User-agent: *` de blu-ray.com comme de dvdfr dit `Allow`, avec un
`Crawl-delay`. Un crawl lancé à la main, sous un agent qui n'est pas Claude et
qui respecte ce délai, est dans la politique déclarée du site ; c'est
`ClaudeBot` qui n'y est pas.

**Claude écrit donc les scripts de collecte que l'éditeur demande, y compris
pour ces sites-là, et ne récupère pas leurs pages lui-même.** C'est déjà la
pratique du dépôt : `crawl_fr.py` a été écrit ainsi pour blu-ray.com, et
lancé à la main. L'éditeur du site, administrateur de ses données, assume la
responsabilité de ses collectes.

La limite qui demeure est celle de l'exécution, pas de l'écriture : aucune
requête vers ces domaines ne part des outils de l'assistant.

Restent hors de question, parce qu'elles ne relèvent plus du crawl : créer un
compte pour accéder à des pages fermées, franchir un paywall, faire tourner
les adresses IP par proxy ou VPN. Résoudre une épreuve anti-robot non plus,
et criterion.com en sert une, « Just a moment… », y compris avec des en-têtes
de navigateur complets.

**Un vrai navigateur passe ce type d'épreuve de lui-même**, parce que c'est un
test JavaScript et non une énigme à résoudre. C'est ainsi que les 1 255 spines
Criterion ont été relevés le 1er août 2026, sur `criterion.com/shop/browse/list`
trié par spine : `curl` reçoit l'épreuve, le navigateur charge la page. Charger
une page publique dans un navigateur reste de la consultation, et c'est la
bonne réponse à un site qui bloque les clients en ligne de commande.

    1 866 films au catalogue, 1 255 avec un spine, 283 appariés sur nos 338

Les non appariés sont structurels : les `Eclipse Series` ont leur propre
numérotation, et **Criterion ne donne pas de spine aux coffrets**.

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

### metalunastore.fr, 1 615 éditions, 1er août 2026

Revendeur, pas éditeur, et c'est ce qui le rend utile : **il liste des
catalogues d'éditeurs entiers** que ces éditeurs ne vendent pas eux-mêmes.
Studiocanal n'a pas de boutique, Artus Films non plus.

Shopify, donc le même endpoint que Le Chat qui fume, plus
`/collections.json?limit=250` qui énumère les **154 collections**. Leur
`robots.txt` ne vise nommément aucun agent.

| collection | fiches | état |
|---|---|---|
| Criterion | 338 | marché US assumé, région A |
| Carlotta Films | 231 | |
| Rimini Editions | 191 | |
| ESC Editions | 177 | |
| Elephant Films | 177 | |
| Sidonis Calysta | 158 | |
| Artus Films | 148 | |
| Make My Day! | 94 | seule série **numérotée**, N°1 à 98 |
| Extralucid Films | 56 | |
| Potemkine | 52 | |

**Les neuf collections déclarées sont collectées.** `Wild Side` existe chez
eux mais compte zéro produit, et leur propre boutique était en maintenance le
1er août 2026 : Ultra Collector reste à faire.

**Ils exposent en réalité 67 catalogues d'éditeurs, et dix seulement étaient
pris.** Relevé le 3 août 2026 : les 55 restants sont entrés dans
`collectes.py`, soit **65 collections** en tout. Ce n'était pas une nouveauté
de leur côté, c'était une lecture incomplète du nôtre.

Ce que ça vise est exactement le creux du §8, 65 % de couverture sur les
œuvres de 2000-2014 : **Studio Canal 385, Paramount 342, Warner Vidéo 332,
Universal 281, BQHL 278, Gaumont 149, Pathé 78, Metropolitan 67**, soit
environ 2 750 fiches françaises. Ce sont les éditeurs dont l'absence
produisait les `Armageddon`, `Broken Arrow` et `Bone Collector` introuvables
au catalogue. S'y ajoutent 3 800 fiches de catalogues d'import, même statut
que Criterion : Vinegar Syndrome 758, Kino Lorber 663, Arrow Video 409,
Shout Factory 382, Warner Archive 325, 88 Films 248, Severin 248.

**Les dix déjà importées ont grossi de 20 à 50 % en deux jours** : Artus de
148 à 196, ESC de 177 à 272, Rimini de 191 à 224. `enum_metaluna.py`
fusionnant, elles se rattrapent seules dans la vague qui les inclut.

**Mais ce n'était pas un rythme, c'était un rattrapage, et il est fini.** Les
65 collections ont été réénumérées le 4 août 2026, une par une :

    65 collections | 7 115 fiches lues | +0 entrée | 0 sortie du listing

**Zéro produit neuf.** La croissance de 20 à 50 % courait du 1er au 3 août,
entre deux énumérations espacées ; depuis, la boutique n'a pas bougé. Ne pas
reprogrammer une réénumération hebdomadaire sur la foi du chiffre ci-dessus.

Vérifié que ce n'était pas un scan cassé, ce qui est la règle du §9 : 65 blocs
dans le journal, comptes réels par collection, aucune erreur, aucun 429 pendant
la passe. Le 429 n'est apparu qu'**après**, en interrogeant trois collections de
plus dans la foulée — leur limite de débit est sensible à l'enchaînement, pas à
la requête.

Trois collections rendent 0 produit chez eux comme chez nous, `arte-editions`,
`la-rabbia`, `scorpion-releasing` : le handle existe, le catalogue est vide.

**Les huit collections que le §8 disait « jamais relues » le sont.** `agfa`,
`cauldron-films`, `chameleon-films`, `massacre-video`, `raro-video`,
`scorpion-releasing`, `synapse-films`, `third-window` ont toutes leur fichier de
tri et leurs résolutions, 102 fiches en tout. La note était périmée.

**Les collections de genre, de décennie et de format ne s'énumèrent pas**, et
c'est mesuré : `blu-ray` en annonce 5 024 et `4k` 3 152, mais leur feed
s'arrête vers la page 9 à 24-30 produits, `limit=250` n'étant pas honoré.
L'endpoint racine `/products.json` est bridé à 16. Seules les collections
d'éditeur, plus petites, se servent entières. C'est aussi ce qui rend le
`editeur` déclaré indispensable : sans EAN, la déduplication se fait sur le
titre replié **restreint au même éditeur**, et une collection de genre n'en
déclare aucun.

**Le miroir R2 est suspendu jusqu'en septembre 2026**, décision du 3 août.
`ecrire_metaluna.py --sans-miroir` écrit l'URL de la boutique dans `image_url`
**et** dans `image_url_source` ; sans ce drapeau, `image_url` désignerait un
objet R2 jamais déposé, et une carte afficherait un visuel brisé, ce qui se
dégrade plus mal qu'une carte sans visuel. `url_miroir()` étant déterministe,
la bascule se recalculera sans rien recrawler, comme `basculer_images.py`.
C'est du hotlink assumé et daté, et c'est aussi ce qui rend la passe tenable :
sur Zavvi le miroir coûtait quatre heures contre quarante minutes pour tout
le reste.

**Le compteur de collection ment sur le volume réel.** `collections.json`
annonce 370 fiches pour Criterion et 272 pour ESC ; le listing paginé en rend
338 et 178. L'écart est fait d'épuisés que la collection compte encore mais
que `products.json` ne sert plus. C'est le listing qui fait foi.

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
`numero_collection` reste donc vide pour eux, et il faudra une autre source.

**Criterion est du marché américain, région A, et c'est une entorse assumée**
au périmètre du §1 : les collectionneurs français importent ces disques et les
ont dans leur collection, ce qui est la raison de les référencer.

**Interroger TMDB en français ne suffit pas sur un catalogue anglophone.** La
langue de la requête change les résultats et pas seulement leur libellé :
`Stray Dog` ne rend le Kurosawa de 1949 qu'en `en-US`, `Caught by the Tides`
n'existe en `fr-FR` que sous `Les Feux sauvages`. La recherche interroge donc
les deux langues.

### zavvi.com, 4 446 éditions, 2 août 2026

Boutique britannique, marché **région B**, et candidate Awin : c'est la seule
source du catalogue dont l'affiliation est l'objectif déclaré. Entorse au §1
du même ordre que Criterion, en moins gênante, la zone B se lisant sur un
lecteur français.

**Le sitemap est le point d'entrée**, `sitemapindex-product.xml.gz`, un seul
fichier de 28 290 URL. Pas de pagination à deviner, et pas de compteur qui
ment sur son volume comme celui de Metaluna. Piège : **les `.gz` ne sont pas
gzippés**, le serveur les sert décompressés malgré l'extension, `gzip` lève
`BadGzipFile`. Essayer les deux.

Sur 28 290 produits, 12 665 sont des disques, repérés par le premier segment
du chemin, `/p/{blu-ray,4k,dvd}/`. Le reste est du textile et de la figurine.
Leur `robots.txt` bloque une centaine d'aspirateurs nommés et les chemins
panier, recherche et tri, mais **ne vise aucun agent d'IA** et laisse le
catalogue ouvert.

**On ne garde pas la page**, contrairement à blu-ray.com. Chacune pèse 1,1 Mo,
soit 13,9 Go pour le catalogue, ce qu'aucun artefact GitHub n'accepte. On
extrait le JSON-LD et le bloc de specs, environ 5 Ko. La règle du §10
« conserver les pages brutes » est donc tenue de justesse : on peut rejouer un
parseur, on ne peut plus aller chercher un champ auquel on n'avait pas pensé.
C'est la contrepartie assumée de collecter ailleurs que sur une machine à soi.

Couverture réelle, mesurée sur les 12 661 fiches et non sur un échantillon,
qui la surestimait de quinze points :

| | échantillon de 50 | catalogue entier |
|---|---|---|
| Studio | 98 % | 93 % |
| Number of Disks | 96 % | 94 % |
| Director | 92 % | **75 %** |
| Run Time | 78 % | **70 %** |
| Region | 12 % | 10 % |
| EAN | 0 % | **0 %** |

**1 126 fiches (9 %) n'ont pas de nom**, le nœud `Product` du JSON-LD
manquant, et elles sont irrécupérables sans recrawler puisque la page n'est
pas conservée.

**Trois manques structurels**, qui expliquent le taux de rattachement le plus
bas du catalogue, **43,5 %** contre 94,9 % chez editioncollector :

- **aucune date de parution**, donc le contrôle « un disque ne peut pas porter
  une œuvre postérieure à sa sortie », le plus rentable écrit à ce jour, ne
  s'applique pas ;
- **aucun EAN**, ni `gtin13` ni « Barcode » ;
- **aucune année**, ni dans les specs ni dans le JSON-LD.

Ne restent que la durée et le réalisateur, présents à 70 % et 75 %.

**`Cast List` n'est pas exploitable** : les noms y sont collés sans
séparateur, `Vincent Price Peter Cushing Christopher Lee`, et une fiche sur
quatre seulement met des virgules. Découper là-dessus fabriquerait des acteurs
qui n'existent pas. Le champ est relevé, jamais employé.

**`Studio` est bien l'éditeur du disque**, à l'inverse du `vendor` Shopify du
Chat qui fume qui nommait l'ayant droit : `Radiance`, `88 Films`,
`Nucleus Films`, `Dazzler`, `Paramount Home Entertainment`.

**Le prix est en livres et n'est pas écrit.** `prix_editeur` se lit en euros
partout dans l'application, et c'est de toute façon un prix de vente au
détail, pas un prix conseillé.

**4 446 éditions écrites sur 11 495 possibles**, et c'est un choix : voir
`--rattachees-seules` au §6.

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

### BnF : écartée, et pourquoi

Mesurée le 2 août 2026 pour combler le trou de source du §8. Le dépôt légal
des vidéogrammes est une obligation, donc c'est la seule base française
exhaustive par construction, son API SRU est publique, sans compte ni clé, et
`catalogue.bnf.fr` ne sert aucun `robots.txt`. **Elle porte bien ce qui
manque** : le Blu-ray Gaumont 2010 des *Yeux sans visage*,
`ark:/12148/cb42322635g`, qu'aucune des cinq sources ne connaît, avec éditeur,
distributeur, support, durée et zone.

**Trois mesures l'écartent quand même :**

| année de publication | part de Blu-ray | EAN dans la notice |
|---|---|---|
| 2014 | 0 % | 0 % |
| 2018 | 10 % | 0 % |
| 2022 | 16 % | 0 % |

- **le fonds est massivement DVD et VHS.** 376 516 notices `doctype h`, le
  dépôt courant depuis les années 80 : sur trente notices de 2022, cinq
  Blu-ray ;
- **l'EAN est quasi absent**, zéro sur les quatre-vingt-dix relevées. Il
  existe, l'index `bib.ean` fonctionne et retrouve deux de nos codes, mais pas
  systématiquement. L'appariement retomberait sur titre plus éditeur plus
  année, **sans mesure indépendante**, la faiblesse même d'editioncollector ;
- **aucun visuel, jamais.** Une bibliothèque catalogue, elle n'illustre pas
  des produits.

On échangerait donc un trou de source contre quelques milliers d'orphelines
sans jaquette et de liens non contrôlés.

**Ce qui resterait défendable** est un complément ciblé, une œuvre à la fois
quand on en repère une manquante, pas un import de masse. Sonde conservée dans
`jaquette-scraping/bnf/enum_bnf.py`, lecture seule.

**Trois pièges relevés en sondant**, tous du même genre, un scan cassé qui se
lit comme un scan négatif :

- **`bib.doctype any "m"` rend zéro et `"v"` rend un spectacle** du
  Grand-Guignol de 1962. Le code des images animées est **`h`**, mesuré et non
  deviné ;
- **`recordSchema=unimarcXchange` sort en « erreur de traitement »**, il faut
  `unimarcxchange-anl` ;
- **le Dublin Core ne rend pas l'EAN** alors que la notice le porte en `001`
  ou `073`.

### senscritique.com : source d'import, jamais de catalogue, 7 août 2026

**Elle n'apporte aucune édition, et ce n'est pas son rôle.** SensCritique
catalogue des œuvres, pas des disques : on ne va pas y chercher du catalogue,
on y va chercher **la liste de quelqu'un**, pour la reprendre dans sa
collection. C'est la seule source du dépôt lue depuis le navigateur du visiteur
et non depuis une machine à nous.

**Leur API GraphQL non documentée est ouverte, mesuré et non supposé** :

    POST https://apollo.senscritique.com/   content-type: application/json

    access-control-allow-origin: *          n'importe quelle origine
    access-control-allow-credentials: true
    aucune authentification demandee
    aucun robots.txt servi par cet hote

Quatre requêtes couvrent le besoin, toutes vérifiées sans jeton :

| requête | ce qu'elle rend |
|---|---|
| `user(username)` | `null` si le pseudo n'existe pas, ce qui **valide le pseudo** |
| `.collection(action: DONE\|WISH, universe, order, limit, offset)` | `total` + `products{id,title,originalTitle,yearOfProduction}` |
| `.listsCreated(limit, offset, notEmpty)` | les listes, `{id,label,productCount,isPrivate,url}` |
| `userList(id).productsList(limit, offset)` | les films d'une liste, avec **`annotation`** |

Relevé sur des comptes réels : 847 vus et 1 005 envies films, 51 et 191 en
séries, 73 listes. `searchListExplorer(query:"ma collection blu-ray")` annonce
**11 868 listes** : c'est le gisement, et c'est celui que le banc d'essai du
2 août utilisait déjà.

**Tout se fait dans le navigateur du visiteur, sur ses propres données.** Il n'y
a ni proxy, ni crawl HTML, ni pagination de `www.senscritique.com`. Le
`Disallow: /*?page=*` de leur `robots.txt` vise un robot sur l'hôte `www`, que
nous ne touchons pas. Le proxy PHP de SensBoxd est un vestige, la CORS est
ouverte. Il faut en revanche `apollo.senscritique.com` dans le `connect-src` de
la CSP, et le §10 le déclare dans la politique de confidentialité, la requête
partant de chez le visiteur.

**Toutes les requêtes ne sont pas ouvertes, et c'est rassurant plutôt que
l'inverse** : `usersByUniverse` rend `auth/unauthenticated-user`, « Unauthenticated
Users Not Allowed ». L'API distingue explicitement ce qu'elle expose de ce
qu'elle ferme, et les quatre champs employés sont du côté ouvert.

**Deux pièges mesurés, et le premier est vicieux :**

- **un `universe` inconnu n'est pas refusé, il est ignoré**, et la requête rend
  alors *tous* les univers confondus. `universe: "serie"`, qui n'existe pas, rend
  **4 998** œuvres là où `movie` en rend 847 et `tvShow` 51 : jeux vidéo, livres,
  BD et albums compris. Une faute de frappe ferait donc entrer un catalogue de
  jeux vidéo dans une collection de disques, sans la moindre erreur. Les deux
  seules valeurs valides sont `movie` et `tvShow` ;
- **la pagination par 18 de leur application mobile n'est pas une limite.** Le
  plafond n'a pas été atteint à 200, ce qui divise par onze le nombre
  d'allers-retours sur une collection de deux mille titres.

**Le `GET www.senscritique.com/{pseudo}/collection?action=WISH` que d'autres
intégrations utilisent pour valider le pseudo est inutile et inutilisable** :
`user(username)` rend déjà `null` sur un pseudo inconnu, et `www` ne sert aucun
en-tête CORS, donc un navigateur ne peut pas le lire.

**Aucun export en libre-service de leur côté**, l'export RGPD se demande. Les
outils tiers (SensBoxd, critique.rs, l'extension SensCritique+) produisent un
CSV que notre import lit aussi, la lecture d'en-tête étant tolérante.

### dvdfr.com, enrichissement par code-barres, 3 août 2026

**Écarté deux fois, puis retenu pour ce qu'il sait faire.** Le sujet avait été
clos en juillet 2026 : leur API XML est morte, `\/api/search.php` rendant le 404
par défaut d'Express, et le crawl de leur listing est fermé là où il faudrait
qu'il ouvre, les facettes `?code_support`, `?formats` et `?sousformats` étant en
`Disallow`.

Ce qui a rouvert le dossier n'est pas le listing mais **l'interrogation par
code-barres**, une fiche à la fois, à partir des EAN déjà en base. Elle donne
ce que personne d'autre ne publie :

    Distributeur      TMDB ne le publie pas, cf. §8
    Date de parution  française, là où blu-ray.com date en anglais
    Zone              absente de la plupart du catalogue
    Format Cinéma     le ratio de projection

**Elle n'apporte aucune édition nouvelle, et c'est mesuré** : une fiche ne
liste pas les autres éditions du même film, et leurs pages éditeur sont vides
côté HTML. Elle enrichit l'existant, elle ne l'élargit pas, donc **le trou de
source du §8 reste entier**.

#### Interroger dvdfr par titre : fermé, et cette fois c'est établi

La question revient à chaque fois qu'on bute sur les éditions sans code-barres,
parce qu'elle est la bonne : leurs URL de fiche **portent l'EAN en clair**, avec
le titre et le réalisateur, donc une recherche par titre donnerait le code sans
même ouvrir la page.

    /dvd/3512394012783-reglements-de-comptes-a-o-k-corral-john-sturges/
          └── EAN ──┘ └──────── titre ────────┘ └─ réalisateur ─┘

Sondé une bonne fois le 6 août 2026, `sonde_recherche.py`, et **les quatre voies
sont closes** :

    /api/search.php, /api/dvd.php   404 d'Express, l'API XML n'existe plus
    facettes du listing             Disallow
    /listeliv.php                   200, 81 464 o, aucun lien de fiche
    /sitemap.xml                    200, mais 26 nouveautés, pas un catalogue
    recherche par mots              Disallow: /*mots_recherche*

**La dernière est une politique déclarée, pas un obstacle technique**, et c'est
ce qui tranche : `/recherche_avancee.php` répond, le formulaire existe, seul le
paramètre qui porte la requête est interdit au bloc `User-agent: *`. Le §5
respecte un `Disallow` nommé ; s'y soustraire parce que la page répond quand
même serait exactement ce que ce paragraphe refuse ailleurs.

`ClaudeBot: Disallow: /` s'y ajoute, donc l'assistant ne sonde pas non plus.

**Ne pas rouvrir sans qu'une de ces cinq lignes ait changé.** Ce qui reste pour
les éditions sans code-barres est ailleurs : les boutiques d'éditeur quand elles
existent, et les flux marchands français, Fnac et Cultura, en attente sur Awin.

Résultat du 3 août 2026 : 5 440 codes interrogés, **4 967 fiches trouvées**,
473 inconnues chez eux, **zéro erreur**, et 4 951 éditions enrichies.

**Le crawl tourne sur la machine, l'écriture sur GitHub.** Voir le §9 :
2 720 erreurs sur 2 720 depuis un runner, zéro depuis une connexion
domestique. `crawl_dvdfr_local.sh` collecte par créneaux et dépose son fichier
dans R2 ; `dvdfr.yml` le reprend et n'adresse aucune requête à dvdfr.

**Enrichir, jamais corriger.** Une colonne déjà remplie n'est pas touchée, et
c'est ce qui a sauvé la passe : le compte des désaccords paraissait accablant,
il ne l'était pas.

    pays 4 529 | region 3 765 | disques 1 614 | editeur 1 161 | ratio 891

**Le pays n'est pas un désaccord, c'est un contresens**, vérifié le 3 août
2026. `editions.pays` dit le **marché du disque**, et vaut « France » sur
l'essentiel du catalogue, blu-ray.com étant crawlé filtré France et
editioncollector étant un catalogue français. Le `Pays` de dvdfr dit le pays de
**production de l'œuvre** :

    2 034  nous « France »  dvdfr « États-Unis »
      359  nous « France »  dvdfr « Japon »
      163  nous « France »  dvdfr « Royaume-Uni »

Les deux ont raison. Le champ n'a jamais atteint la base, aucune édition
n'ayant de `pays` vide, mais la correspondance a été retirée : une source
future sans `pays` aurait ouvert le trou.

**Et il n'y a aucune colonne à créer** : `films.pays` porte déjà le pays de
production, remplie à 88 % depuis `production_countries` de TMDB, qui rend
même la liste complète des coproducteurs là où dvdfr en donne un ou deux.
C'est le partage habituel du §3, `films` porte l'œuvre et `editions` porte le
disque ; deux colonnes nommées `pays` ne parlent pas de la même chose.

**La zone non plus n'est pas un désaccord**, c'était un artefact de comptage :
la comparaison opposait `2K Blu-ray: Region B (A, C untested)` à `B` comme deux
chaînes différentes. Normalisées comme le fait `zonesDe` côté site :

    2 125  44 %  identiques
    1 644  34 %  recouvrement partiel, nous « B » et eux « A;B;C »
    1 041  21 %  non comparables
        0        contradiction franche

**Aucune des deux sources ne se trompe systématiquement**, contrairement à ce
qui a été avancé toute une journée. Le soupçon « blu-ray.com décrit l'édition
américaine » ne tient pas : les éditions sont bien françaises, c'est dvdfr qui
parlait d'autre chose. Restent `disques`, `editeur` et `ratio`, jamais
départagés.

**Trois politiques contradictoires sur le même site**, ce qui fait qu'aucune
ne se lit comme leur position :

| mécanisme | ce qu'il dit |
|---|---|
| `robots.txt`, bloc `*` | `Allow: /`, `Crawl-delay: 5` |
| application | **429** à tout UA contenant `bot`, `curl/8` passe |
| `robots.txt`, nommément | `ClaudeBot`, `GPTBot`, `CCBot`… en `Disallow: /` |

La seule règle sans ambiguïté est le `Disallow: /` nommant `ClaudeBot`, et
elle tient : un assistant ne récupère aucune de leurs pages, et ne déclenche
pas non plus un workflow qui le ferait. Le crawl se lance à la main.

Leur `Content-Signal: search=yes,ai-train=no,use=reference` vaut par ailleurs
réservation de droits au titre de l'article 4 de la directive 2019/790, la
même que celle que nous posons (§10).

**Le quota de leur ancienne API n'a plus d'objet** : 200 fiches par semaine et
par utilisateur, 800 au plus. L'interrogation par code-barres passe par les
pages publiques, à cinq secondes l'unité.

### Les trois comparateurs de prix : écartés, et pourquoi

Mesurés les 2 et 3 août 2026 pour combler le creux 2000-2014, à 65 % de
couverture sur des collections réelles (§8). L'idée était bonne sur le papier :
un comparateur porte l'EAN, le prix et le marché français, donc il réglait le
trou de source **et** la valeur de collection sans attendre Awin. **Aucun des
trois ne tient.** Sondes dans `jaquette-scraping/comparateurs/`.

| | annoncé | ce qu'on obtient |
|---|---|---|
| **idealo.fr** | 542 348 Blu-ray | rien, Akamai refuse jusqu'à Chrome |
| **dvdpascher.net** | 136 984 réf. | ~1 100 disques HD vivants |
| **LeDénicheur** | 7 292 films | 4 518 titres, 8 de nos 78 manques |

**idealo est fermé par un gestionnaire de robots, pas par un pare-feu.** 403 à
l'octet près sous quatre agents, corps signé `reference ID 0.<hex>.<epoch>`,
format Akamai, message « please make sure your browser is updated ». Chrome
sans interface est refusé aussi ; seul un navigateur avec interface passe.
Leur `robots.txt` ne nomme aucun agent d'IA mais met `/prechcat.html`, leur
point de recherche, en `Disallow` : les 78 titres ne pouvaient de toute façon
pas être interrogés un par un. **La distinction du §5 se précise ici** :
déployer un Bot Manager est une décision sur l'accès automatisé, pas un effet
de bord technique. Reste leur canal partenaire, même famille qu'Awin.

**dvdpascher a les meilleures fiches du catalogue, et un fonds mort.** Leur
`robots.txt` ouvre tout à `*` et ne nomme que des agents d'IA, dont
`ClaudeBot`. L'index alphabétique `/index-films/films-<lettre>.html` énumère
en 27 pages, sans pagination interne, **120 440 URL**. Une fiche vivante porte
onze champs sur onze :

    ean 100 %   annee 100 %   date 100 %   zone 100 %   format 100 %
    duree 95 %  genre 95 %    distributeur 90 %  image 86 %  editeur 81 %

C'est la seule source jamais mesurée à donner EAN, durée, éditeur,
**distributeur**, date française et jaquette sur la même ligne, la jaquette
dérivant de l'identifiant (`/image1/fiche/11/115744.jpg`), donc sans rien à
parser. Deux mesures l'écartent quand même :

- **le fonds est un fonds DVD.** Sur les 120 440 URL, 87,6 % de DVD, 12,2 % de
  Blu-ray, 0,2 % de 4K ;
- **et le Blu-ray est mort dans leur propre index.** 30 % de liens morts sur
  un échantillon alphabétique surtout DVD, mais **88 à 92 % sur les fiches
  Blu-ray tirées au hasard**. `diag_morts.py` a rejoué six de ces
  identifiants sous cinq formes de slug, trente requêtes : **404 à zéro octet
  partout**. Ce ne sont donc ni des URL fausses ni des slugs périmés, les
  fiches ne sont plus servies.

Il resterait environ 1 100 disques haute définition vivants, pour un crawl de
120 000 pages. Le rapport ne se discute pas.

**LeDénicheur est trop petit et sur le mauvais marché.** Énuméré en entier,
166 pages par `offset`, seul chemin que leur `robots.txt` autorise : 4 518
titres distincts, soit **moins que nos 15 483 éditions**. Sur nos 78 manques
il en porte 15, dont quatre en édition britannique et trois faux positifs
(`Freddy 2010` rendant le film de 1984, `La colline a des yeux 2006` celui de
1977). Huit rattachements propres. C'est la façade française de Prisjakt, on y
croise du `ej svensk text`.

**Ce que ces trois mesures laissent debout**, et c'est inchangé : les flux
produits Awin, et le signalement d'édition manquante par l'utilisateur branché
sur l'enrichissement dvdfr par code-barres, qui ne dépend d'aucune
autorisation extérieure.

### E.Leclerc par Awin, flux mesuré le 3 août 2026

**Première source licenciée du catalogue.** Pas de crawl, pas de `robots.txt`,
pas de pare-feu, pas d'IP bannie : un flux produit qu'on a le droit de
télécharger, et des images licenciées pour l'usage affilié. C'est la seule
source qui ne pose aucune question de collecte.

L'URL de téléchargement se fabrique dans Awin, *Toolbox*, *Create-a-Feed*, et
**porte la clé API** : elle vit dans l'environnement, `AWIN_FEED_LECLERC`,
jamais dans le dépôt. Create-a-Feed était inutilisable tant qu'aucun programme
n'avait validé, il rendait « Feed not found » ; il s'est ouvert le jour de
l'acceptation.

**Leclerc publie sept flux, pas un.** Le compteur du sélecteur d'annonceurs les
liste avec leur volume :

| flux | fid | produits |
|---|---|---|
| **Culturel** | 52431 | 91 284 |
| Tous univers | 69029 | 108 649 |
| Parapharmacie | 52429 | 8 225 |
| High-Tech | 56585 | 3 846 |
| Maison et Loisirs | 53647 | 2 338 |
| Ma Cave | 68725 | 1 824 |
| Optique | 41483 | 255 |

« Tous univers » est l'union des six autres, à quelques centaines près. On prend
**Culturel seul**, les disques y sont et le reste est du bruit.

Sur les 91 284 lignes, **7 090 sont des disques** (7,8 %), le gros du flux étant
du livre (37 730) et de la BD (5 986). Couverture, mesurée sur ces 7 090 et non
sur un échantillon :

    nom, EAN, prix, image, lien, stock, description   100 %

**C'est la meilleure couverture jamais relevée**, et elle est sans précédent au
catalogue : Zavvi, Metaluna et Le Chat qui fume ne publient aucun EAN, et
editioncollector en écrivait 375 en chaîne vide (§9).

**Mais le format n'est pas déclaré, sur 92,8 % des lignes.** Ni dans le nom, ni
dans la description :

| signal | lignes |
|---|---|
| aucun | 6 576 |
| Blu-ray | 255 |
| 4K | 135 |
| DVD | 124 |

`product_type` vaut `consumer` sur les 7 090, `brand_name` et `category_name`
sont vides, `specifications` aussi. Seul `merchant_category` sépare, et mal :
`DVD` 2 676 contre `DVD & Blu-ray` 4 341, où le « & » n'est pas décoratif. Pour
un catalogue classé par format, c'est le trou de Zavvi déplacé ailleurs.

Ni année, ni réalisateur, ni durée non plus : **aucune mesure indépendante**
pour un rattachement TMDB, exactement la faiblesse d'editioncollector.

**Le creux 2000-2014 n'est pas comblé.** Sur les 19 absents nommés du banc
d'essai du 2 août (§8), **4 exacts** seulement, `Alpha`, `Les Huit Salopards`,
`In the Mood for Love`, `Obsession`, plus `Insidious` en anthologie. Leclerc
vend son stock du jour, pas un fonds.

**Recoupement : 724 éditions**, et 6 393 EAN du flux absents du catalogue.

### Le flux a été importé le 4 août 2026, qualifié par dvdfr

**Deux voies fermées avant celle-là**, et les deux mesurées plutôt que
supposées :

- **les colonnes `custom_1` à `custom_3` de Create-a-Feed sont vides**, 0 % sur
  les 7 093 disques. Le scan fonctionnait, 35 colonnes lues et parsées : un
  vrai zéro. Le flux **ne peut pas** dire le format, la question est close ;
- **le cache dvdfr existant ne couvrait aucun des 6 393**, par construction, et
  n'avait rien à rattraper chez nous : 19 éditions seulement manquaient de
  format tout en portant un code-barres.

Restait dvdfr interrogé code-barres par code-barres. **6 393 codes, 6 311
fiches, 82 inconnues (1,3 %), zéro erreur**, en cinq créneaux locaux de deux à
quatre heures. Ce qu'il rend comble les quatre manques d'un coup :

    Support principal   DVD, Blu-ray, 4K Ultra HD, Blu-ray 3D
    titre               le candidat à chercher chez TMDB
    realisateur         mesure indépendante n° 1        100 %
    Durée               mesure indépendante n° 2         92 %

**Le format, enfin mesuré, et mon estimation était fausse d'un facteur 1,7.**
`merchant_category` laissait croire à 38 % de DVD ; c'est **55,4 %**.

    3 344  55,4 %  DVD          -> écartés
    2 263  37,5 %  Blu-ray
      429   7,1 %  4K Ultra HD

**La proportion de Blu-ray monte en fin de liste**, 37 % sur le premier tiers,
44,6 % à la fin : le lot n'était pas homogène, et je l'ai affirmé trop tôt à
mi-parcours. Retenir qu'un ratio mesuré sur un préfixe de liste n'est pas un
ratio.

Résultat : 2 823 candidats, **2 301 rattachés (81,5 %)**, 522 refusés, 586 films
créés. Le meilleur taux du catalogue, Metaluna étant à 86 % après relecture et
Zavvi à 43,5 %.

**Le levier identifié, et il retourne une conclusion du §8** : `dvdfr.yml`
interroge code-barres par code-barres et « n'élargit rien », ce qui le rendait
inutile. Il donne précisément ce que Leclerc tait, format, zone et date
française. Leclerc élargit, dvdfr qualifie. À mesurer avant de s'y engager : le
débit réel sur 6 393 codes, le §5 gardant la trace d'un quota à 200 par semaine.

**Les 6 393 sont soldés, il n'en reste rien à tirer.** Le compte final, mesuré
et non estimé, ferme la question pour de bon :

    2 823  qualifiés Blu-ray, 4K, 3D  -> importés
    3 488  DVD                        -> hors périmètre (§1)
       82  inconnus chez dvdfr        -> sans recours

**Les visuels sont en lien direct, et ils sont demandés à la bonne taille.**
Le flux écrit ses `image_url` avec les paramètres du CDN dedans, en pleine
taille : **928 336 octets** pour une vignette rendue dans un cadre de 56 × 84,
soit neuf mégaoctets sur une fiche à dix éditions Leclerc. `lib/visuels.ts`
réécrit `w` et `h` au rendu, 200 pour la liste d'éditions, 400 pour la carte du
rail, le double du rendu pour tenir en densité double.

    w=1000   928 336 octets
    w=200     44 960 octets

**Rien n'est touché en base** : la colonne garde l'URL pleine taille, qui reste
la bonne pour la visionneuse. C'est l'affichage qui demande ce dont il a besoin,
même principe que `pleineResolution` pour TMDB, dans l'autre sens. `func=fit`
est conservé, c'est lui qui garde le rapport au lieu de rogner. Les autres hôtes
passent sans être touchés, leur grammaire n'étant pas celle-ci.

### Momox shop FR par Awin, la première source de seconde main, 6 août 2026

**C'est la source que le §8 attendait depuis le 2 août**, et elle ne sert à rien
d'autre : la valeur d'une collection, deuxième fonction la plus demandée, était
hors de portée tant que les huit sources vendaient du neuf. Momox shop revend de
l'occasion, donc ses prix sont les seuls qui disent ce que vaut un disque déjà
sorti du magasin.

**Le compte expose sept flux Momox, et prendre le mauvais coûterait cher.** Ils
se lisent dans la colonne `URL` de `feedList`, qui porte aussi le `fid` :

| flux | fid | produits |
|---|---|---|
| all products part 1 | 19367 | 599 965 |
| books 1 | 41113 | 499 985 |
| all products part 2 | 111151 | 386 626 |
| music | 41035 | 194 254 |
| **movies** | **41111** | **154 887** |
| books 2 | 41117 | 95 581 |
| video games | 41109 | 25 159 |

On prend **`movies` seul**. Les deux « all products » noieraient les disques
dans un million de livres et de CD, exactement l'arbitrage déjà fait chez
Leclerc en prenant `Culturel` plutôt que `Tous univers`.

**`feedList` est la bonne porte, et pas Create-a-Feed.** L'URL est en tête de
l'écran Create-a-Feed, porte la même clé API que `AWIN_FEED_LECLERC`, et rend un
CSV de 921 lignes : un flux par annonceur inscrit, avec son volume, sa date
d'import et **son URL de téléchargement complète**. Il n'y a donc rien à
composer à la main, et le §6 pose déjà que l'URL se copie plutôt qu'elle ne se
reconstruit.

Couverture, mesurée sur les 154 887 lignes et non sur un échantillon :

    nom, EAN, prix, image, lien, marque, stock, condition   100 %
    description                                              98,7 %

**L'EAN à 100 %, et surtout `condition` à 100 %** : c'est ce second champ qui
distingue cette source de toutes les autres.

    68 493   D'occasion - Très bon état
    67 422   D'occasion - bon état
    16 264   D'occasion - acceptable
     2 708   NewItem

**Une ligne par EAN, un état par ligne**, et un seul EAN porté par deux lignes
sur les 154 874 : les trois éditions d'*Interview mit einem Vampir*, DVD, DVD
Special Edition et Blu-ray, ont trois codes distincts. Il n'y a donc pas de
variante à départager.

**Recoupement : 1 684 éditions**, dont 1 618 d'occasion, médiane 15,73 €.
Relecture de 18 appariements avant écriture, **18 justes sur 18** : l'EAN étant
exact, un désaccord de titre aurait voulu dire un code faux d'un côté.

**Quatre champs à connaître, tous mesurés :**

- **`category_name` vaut `DVDs` sur les 154 887 lignes, et ce n'est pas le
  format.** C'est le nom du rayon. Le format est dans le nom du produit,
  `[Blu-ray]` quand il y en a un, **rien du tout pour un DVD** : 98 346 lignes
  n'ont aucun marqueur. Sans objet ici, la passe d'offres rapprochant par EAN
  exact, mais bloquant pour tout import ;
- **`brand_name` est le réalisateur**, pas une marque : `Neil Jordan`,
  `Steven Spielberg`, `Alfred Hitchcock`, et `unbekannt` sur 33 967 lignes.
  C'est une mesure indépendante disponible le jour où on importerait ;
- **le flux porte 1 274 VHS**, repérables au marqueur du nom de produit. Hors
  périmètre même élargi au DVD (§1), et c'est le rappel qu'un rayon `DVDs`
  ne dit rien du support : à filtrer explicitement le jour d'un import ;
- **`custom_2` est l'heure de génération du flux chez eux**, la même sur toutes
  les lignes, `05.08.2026 15:52:02`. Le téléchargement a suivi de 17 h, donc
  `releve_le`, pris sur le nom de fichier, majore la fraîcheur d'autant. Sous les
  48 h que `offres_awin.py` surveille, mais c'est la colonne à préférer si un
  jour l'écart compte ;
- **`delivery_cost` vaut 1,99 € sur 84 % des lignes.** Il n'entre pas dans le
  prix : une estimation de valeur n'achète rien, donc ne paie pas de port.

**Leur propre donnée porte du mojibake**, `The Walking Dead-L'int‚grale`, trois
caractères de remplacement sur 154 887 au décodage UTF-8. C'est momox qui l'a
servi ainsi ; aucun champ textuel n'étant conservé, ça ne nous atteint pas.

**Ce n'est pas une source de catalogue.** 38 009 de ses EAN nous sont inconnus,
et 17 des 19 absents du banc d'essai du 2 août y figurent — mais en éditions
allemandes, britanniques et italiennes, `Armageddon - Das jüngste Gericht`,
`[UK Import]`, `[IT Import]`. Un import ferait entrer des disques d'un autre
marché, sans format déclaré, ce qui est le cumul des défauts de Zavvi et de
Leclerc. **Ne pas rouvrir sans mesurer ce que ces 38 009 codes sont vraiment.**

### thejokers-shop.com, 29 éditions, 4 août 2026

**Éditeur français d'auteur**, et la première source choisie pour combler le
§8 plutôt que pour son volume : 146 fiches, 100 disques, 87 EAN inconnus du
catalogue. Cinéma coréen, japonais et hongkongais, `Memories of Murder`, `JSA`,
`Hana-Bi`, `Kids Return`, `Dark Water`, et le Blu-ray 4K d'`In the Mood for
Love` que Leclerc ne vend qu'en DVD.

Boutique Shopify, mais **`products.json` est fermé** : 429 `local_rate_limited`
sous deux agents différents, donc pas le filtre par UA du précédent dvdfr mais
une limite posée exprès. Leur `robots.txt` l'écrit, « AJAX surfaces: agents
should use UCP/MCP instead », et déclare un endpoint d'agent dédié,
`/api/ucp/mcp`, un `agents.md` et une découverte `.well-known/ucp`.

**C'est une politique déclarée, du côté du §5 qu'on respecte.** Le bloc
`User-agent: *` autorise `/products` sans réserve et déclare le sitemap : c'est
la voie ouverte, et c'est celle prise. Aucune connexion à leur serveur MCP,
décision qui appartient à l'éditeur du site et non à l'assistant.

**Leur JSON-LD porte le `gtin13`**, ce qu'aucune autre source Shopify du dépôt
ne publie. C'est la clé qui a permis à dvdfr de qualifier le support.

**Un sitemap par locale, et ils décrivent le même catalogue.** Shopify publie
`sitemap_products_1.xml` et `/en/sitemap_products_1.xml` avec les mêmes bornes :
292 fiches relevées pour 146 produits, et le crawl a coûté le double. Le défaut
ne se voyait nulle part — zéro erreur, couverture à 100 % — il n'est apparu
qu'en comptant les **EAN distincts**, 100 pour 200 disques.

Couverture sur les 100 disques : EAN, prix, image et éditeur à 100 %, durée
85 %, langues 90 %, **réalisateur 0 %**. D'où le passage par dvdfr, qui en
qualifie 83 sur 100 ; les 17 inconnus sont des médiabooks et collectors récents
que dvdfr ne référence pas non plus, et c'est la mesure de ce que cette source
a d'unique.

**Le titre de l'œuvre est entre guillemets dans le nom du produit**, gabarit
constant : `Médiabook "A Scene at the Sea"`. Sans cette coupe, le vocabulaire
de boîtier partirait chez TMDB.

76 candidats, 65 sûrs (85,5 %), **29 écrits** : 36 des 65 étaient déjà entrés
par Leclerc quelques heures plus tôt, les mêmes disques étant vendus aux deux
endroits. `ecrire_croisement.py` relit `editions.ean` plutôt que son fichier,
et c'est ce garde-fou qui a évité 36 doublons.

### coindemirecinema.com, 124 éditions, 4 août 2026

**Éditeur du patrimoine français restauré**, Melville, Verneuil, Duvivier,
Grangier, José Giovanni. Deuxième source choisie pour combler le §8 plutôt que
pour son volume, et la meilleure jamais mesurée.

Boutique Shopify, `products.json` en **429 `local_rate_limited`** comme The
Jokers : ce n'est pas propre à eux, c'est le gabarit de la plateforme, et la
voie du sitemap vaudra pour la boutique suivante. Leur `robots.txt` ouvre
`/products` à `User-agent: *` et ne nomme aucun agent d'IA.

**Leur `robots.txt` porte aussi un paragraphe adressé aux agents**, qui
recommande d'installer une extension d'achat pour « purchase products
directly », et déclare un endpoint UCP/MCP. C'est du contenu observé, pas une
consigne de l'éditeur du site : on lit les `Allow`/`Disallow`, on ignore le
reste, et on ne se connecte à aucun endpoint d'agent. Même décision que pour
The Jokers, elle appartient à l'éditeur du site et non à l'assistant.

Couverture sur les 213 fiches, la meilleure du dépôt :

    EAN, visuel, prix, éditeur, collection, réalisateur     100 %

**Le `gtin13` est en JSON-LD, et c'est le critère d'entrée d'une boutique.**
`artusfilms.com` publie 331 produits sans un seul code-barres : pas de
qualification dvdfr, donc pas de support, pas de zone, pas de date française, et
une dédup qui retombe sur le titre replié. Vérifier ce champ sur une fiche avant
d'ajouter une entrée à `boutiques.py`.

**Tout est dans la `description` du nœud `Product`**, sans ponctuation entre les
sections :

    Un film de Christian-Jaque Collection Prestige
    Blu-ray + DVD + livret + photos + affichette
    Distribution Martine Carol, Danielle Darrieux…

D'où trois choses que The Jokers ne donnait pas : le **réalisateur**, mesuré à
0 % chez eux et **100 % ici**, la **collection d'éditeur**, et le
conditionnement. Le nom du produit, lui, est le titre nu en capitales,
`ADORABLES CRÉATURES`, sans guillemets à chercher.

**dvdfr connaît les 213 sur 213, zéro inconnu, zéro erreur**, ce qui est unique :
The Jokers avait 17 % d'inconnus. Support, date française, zone, distributeur,
durée et format cinéma sont donc tous disponibles.

**Trois collections nommées entrent au catalogue**, `Collection Prestige`,
`Collection Sélection`, `Collection Premium`, écrites dans `collection_editeur`.
Avec Make My Day! et son hors-série et The Criterion Collection, cela fait six
entrées : **la condition que le §7 posait pour rouvrir l'axe `/collections` est
remplie.**

Résultat : 144 disques après retrait de 69 DVD, **137 rattachés (95,1 %)**, le
meilleur taux du catalogue, contre 86 % à Metaluna et 43,5 % à Zavvi. 124
écrites, les 18 restantes étant déjà en base par leur EAN.

**Les 4 refus sont propres et valent d'être lus** : deux `Le Diable et les
10 commandements` que TMDB n'a pas sous ce titre, et deux que le contrôle refuse
en disant `total de saison, 173 ≈ n × 57` — un film à sketches dont la durée se
lit comme un lot d'épisodes. Le garde-fou fait son travail.

### diaphana.fr, 92 éditions, 4 août 2026

**Première source WooCommerce du dépôt**, et première trouvée en partant d'une
liste de **distributeurs de salle** plutôt que d'éditeurs vidéo. La distinction
décide de tout : mettre un film en salle et presser un disque sont deux
métiers, et sur la vingtaine de sociétés françaises sondées, **deux seulement
ont une boutique**, Diaphana et Solaris. Bac Films, Memento, Ad Vitam, Pyramide,
Le Pacte, SND, Wild Bunch, Eurozoom, Acacias sont des sites vitrines ; Carlotta
est éditorial plus VOD.

C'est mesurable autrement : `editions.distributeur`, rempli par dvdfr sur
2 400 éditions, nomme `ESCD`, `Arcadès`, `Seven7`, `Fox Pathé Europa`,
`Plaion`, `BQHL Diffusion`. **Aucun n'est dans la liste des distributeurs de
salle.** C'est l'étage vidéo, invisible depuis l'autre.

**La Store API WooCommerce rend le catalogue entier en trois requêtes**, sans
une fiche à crawler, là où Shopify en impose une par produit :

    /wp-json/wc/store/v1/products?per_page=100&page=1
    283 produits, 108 Blu-ray, 175 DVD écartés

Leur `robots.txt` ne bloque que `/wp-admin/` et ne nomme aucun agent.

**Aucun EAN, nulle part**, ni `sku` ni `gtin13`. C'est la catégorie Zavvi et
Metaluna : pas de qualification dvdfr, pas de déduplication par code-barres, et
la couverture EAN du catalogue qui baisse. Le format n'en a pas besoin, il est
dans le **nom du produit** à 100 %, `Titane (Blu-Ray)`, `Nebraska (DVD)`.

**Les deux mesures indépendantes viennent des pages film du même site**, pas de
la boutique, et c'est ce qui rend la source exploitable sans code-barres :

    /film/<slug>/   ->   « Un film de Hettie MacDonald »   « Durée : 1h30 »

421 pages film pour 283 produits, appariées sur le **slug**, le produit valant
le film plus un suffixe de format, `titane-blu-ray` contre `titane`. Couverture
obtenue : réalisateur 88 %, durée 84 %.

Résultat : **93 rattachés sur 108, 86,1 %**, 92 écrites, 66 films créés. Le
fonds visé est bien là, *Titane*, *Mommy*, *Cold War*, *Drive My Car*,
*Burning*, *Divines*, *Le Daim*, *Robuste*, et **69 des 102 titres étaient
inconnus du catalogue**, le taux de nouveauté le plus élevé jamais mesuré.

**La sonde annonçait 90 %, la chaîne rend 86,1 %.** L'écart vient d'`apparier`,
plus strict sur quelques cas que la règle écrite dans la sonde. Retenir le sens
de l'écart : une sonde qui majore de quatre points vaut mieux que l'inverse,
mais elle majore.

### rimini-editions.fr et spectrumfilms.fr : enrichissement, pas import

**Deux boutiques PrestaShop qui n'élargissent rien et servent quand même.**
Mesuré le 4 août 2026 avant d'écrire une ligne de chaîne :

    Rimini Editions    288 éditions au catalogue    59 en boutique
    Spectrum Films     130 éditions au catalogue   104 en boutique

Elles sont **plus petites que ce qu'on a déjà d'elles**. La règle du §8, « un
éditeur porte un fonds, un revendeur porte un stock », ne vaut donc pas
partout : Metaluna agrège plus que ce qu'un éditeur garde en vente. **La
vérification à faire avant d'ajouter une source tient en une requête, comparer
la taille de la boutique à ce que la base porte déjà pour cet éditeur.**

**Ce qu'elles apportent est le code-barres que Metaluna tait.** 317 de leurs
éditions viennent de `metalunastore.fr`, dont le `sku` vaut `FILM` partout,
donc sans EAN. Leurs boutiques le publient, dans le `gtin13` du JSON-LD et
jusque dans l'URL produit, `143-dernier-ete-a-tanger-dvd-3760233157946.html`.

**Résultat : 77 éditions enrichies**, 18 Rimini et 59 Spectrum, aucune créée.
Puis les 77 codes passés chez dvdfr, ce qui remplit quatre colonnes que
Metaluna ne publie sur aucune de ses 6 830 fiches :

                    avant   après
    zone            32/77   77/77
    distributeur     0/77   77/77
    disques          0/77   77/77
    ratio            0/77   61/77

La chaîne complète se lit donc : boutique PrestaShop, code-barres, dvdfr,
fiche technique. C'est le premier cas du dépôt où une source ne sert qu'à
**relier** deux autres.

**Piège de mesure à ne pas refaire.** Comparer ces 162 codes aux
`editions.ean` rend « 141 inconnus », ce qui se lit comme un taux de nouveauté
record. C'est un artefact : les éditions visées ont justement `ean = NULL`,
donc elles ne peuvent matcher aucun code. J'ai failli le rapporter comme une
trouvaille.

**Ce qui bloquait n'était pas la traduction, c'était une asymétrie**, corrigée
le soir même (§9). Le nettoyage de titre ne s'appliquait qu'au produit de
boutique et pas aux titres en base, qui portent les mêmes formes,
`Viva Erotica` contre `Viva Erotica (avec fourreau)`. Le rapprochement par
titre d'œuvre avait bien été essayé et rendait 14 candidats ; la symétrie en
rend 27.

### solaris-distribution.com : écartée le 4 août 2026, entrée le 6

Même plateforme, même `robots.txt` ouvert, chaîne déjà écrite : il ne restait
qu'à lancer. **Un seul Blu-ray sur 50 produits**, le reste étant 27 DVD et
22 affiches. Le catalogue écartant alors le DVD systématiquement, écrire une
édition pour justifier la chaîne n'avait pas de sens.

**Le DVD entré au catalogue (§1), la raison de l'écarter tombe d'elle-même**, et
c'est la seule source que le changement de périmètre ressuscite. 28 candidats au
lieu d'un, **4 écrits** : le rattachement TMDB est mauvais, 24 non résolus, leur
fonds de distributeur de salle étant mal indexé. Modeste, mais la chaîne existait
déjà et n'a rien coûté.

**Les autres boutiques y gagnent plus qu'elle**, le même jour, sans une requête
de plus, leurs fiches étant déjà crawlées :

    Coin de Mire     67 éditions écrites
    Diaphana         51
    The Jokers       14
    Solaris           4

### Zavvi, les 6 514 non rattachées : mesuré le 4 août 2026, et écarté

L'import du 2 août n'a écrit que 4 446 éditions sur 11 536 crawlées, les autres
étant refusées par `--rattachees-seules` faute de rattachement. La question de
les reprendre s'est reposée, et **elle est mesurée plutôt que débattue** :
échantillon de 200, résolu par l'`apparier` d'aujourd'hui, en lecture seule.

    sur 18 (9,0 %)   a_relire 46   echec 136

Soit **~586 éditions récupérables sur 6 514**. Les rattachements proposés sont
bons, avec des durées justes à la minute, et `apparier` retrouve des titres
traduits que la passe d'origine manquait, `Deadfall` sous *Le chat croque les
diamants*.

**Mais un faux positif sur dix-huit, et il est instructif** :

    Andy's Baby Animals (BBC) - Playtime  ->  ファンタズマ ～呪いの館～ Vol.2 (2004)

Un documentaire animalier de la BBC rattaché à une série d'horreur japonaise,
sur la seule concordance de durée 100/100. **Zavvi ne donne ni année ni date de
parution**, donc le plafond — contrôle le plus rentable du dépôt, 51 liens faux
sortis en une passe — ne s'applique pas. 5,5 % de faux dans le lot « sûr », là
où l'échantillon de cinquante de Leclerc n'en portait aucun.

**Ne pas reprendre en l'état.** Ce qui le rendrait défendable serait un
troisième contrôle pour remplacer le plafond manquant, le `Studio` présent à
90,9 % croisé avec les sociétés de production TMDB. C'est un chantier, pas une
passe.

### Reprise faite le 4 août 2026, et le troisième contrôle n'était pas celui-là

Le chantier ci-dessus a été mené, `zavvi/reprendre_zavvi.py`. **460 éditions
écrites**, toutes rattachées. Mais le contrôle qui devait le débloquer n'est
pas celui qu'on croyait.

**Le `Studio` ne remplace pas le plafond, et c'est mesuré.** Le §5 dit déjà
qu'il nomme l'éditeur du **disque** ; ses valeurs les plus fréquentes sur les
7 639 sont `Network`, `Spirit Entertainment`, `Crunchyroll`, `All The Anime`,
`The Criterion Collection`, `BFI`, `Powerhouse Films`. Aucune n'est une société
de production, donc aucune ne figurera jamais dans `production_companies`.
Résultat : **il corrobore 108 rattachements sur 556 et n'en porte aucun seul.**
Il reste en place, en mesure **asymétrique**, un accord vaut preuve et un
désaccord ne vaut rien.

**Le vrai levier est `Cast List`, que le §5 rangeait en inexploitable.** Il a
raison sur ce qu'il dit : les noms y sont collés sans séparateur,
`Vincent Price Peter Cushing Christopher Lee`, et on n'en tire pas une liste.
Mais **vérifier n'est pas extraire** : on prend un nom complet du cast TMDB et
on le cherche dans la chaîne entière, exactement le tour employé par
`controles.py` pour les co-réalisateurs collés. Le champ le mieux couvert du
lot devient la mesure la plus disponible, sans une ligne de parsing.

    Cast List     4 453   68,4 %   <- porte 553 des 556 rattachements
    Director      3 817   58,6 %
    Run Time      3 719   57,1 %
    Studio        5 922   90,9 %   corrobore, ne décide jamais

**« Deux mesures » à plat était trop strict, et l'échantillon l'a dit.** Cette
règle rendait 2 sûrs sur 200 ; en relisant les refusés, quinze sur quinze
étaient manifestement justes, `McLintock!` vers `McLintock!` (1963) avec John
Wayne. **Ce qui compte n'est pas le nombre de mesures mais leur force** : deux
œuvres sans rapport partagent 100 minutes tous les jours, un nom complet
d'acteur non. Règle retenue :

    titre exact + distribution ou réalisateur  ->  sûr
    deux mesures quelconques                   ->  sûr
    durée seule                                ->  à relire, c'est le cas Andy's
    studio seul                                ->  à relire

Le contre-exemple qui avait fermé le dossier est donc structurellement exclu :
`Andy's Baby Animals` n'obtient qu'une durée, donc il ne s'écrit pas.

**556 retenus, 460 écrits, et l'écart est un gain.** `ecrire_zavvi.py` pose
deux filtres de plus, et les deux ont servi :

    -36  déjà en base sous une autre source, dédup titre replié + éditeur
    -60  refusés par le contrôle croisé de durée d'ecrire_zavvi

Les 36 doublons n'avaient pas été comptés : sans EAN, la dédup par titre
restreinte au même éditeur est le seul angle, et elle a retrouvé
`The Mummy Trilogy - 4K Ultra HD` chez blu-ray.com, `Howard the Duck:
Collector's Edition` chez Metaluna.

**Ce que l'écriture a coûté au catalogue, et il faut le savoir avant la
prochaine source de ce genre** : Zavvi ne publie aucun code-barres, donc la
couverture EAN redescend de 34,5 à 33,8 %, exactement ce qui bloque le scan
du §8. Le contenu est propre, 533 des 556 sont des films et séries ordinaires,
le reste une vingtaine de spectacles et de captations que TMDB référence.

#### Le DVD n'y ajoute rien, mesuré le 6 août 2026

L'entrée du DVD au catalogue (§1) laissait espérer un gisement Zavvi : 5 051
fiches `/p/dvd/` sont crawlées, dont 3 404 jamais écrites. **Il est nul**, et il
faut le chiffre pour ne pas rouvrir le dossier une troisième fois.

La chaîne Zavvi **n'a jamais écarté le DVD** : `ecrire_zavvi.py` le porte dans
son vocabulaire de formats depuis le début, et la reprise du 4 août a bien
traité les DVD avec les quatre mesures.

    321 surs      dont 282 deja en base, 39 restants
    663 a_relire  jamais ecrits
  2 516 echecs    dont 2 222 « aucun titre exact » et 294 sans nom

    ecrire_zavvi.py --reprise --rattachees-seules  ->  0 édition à créer

**Les 39 tombent sur les deux filtres de l'écriture**, dédup et contrôle croisé
de durée, ceux-là mêmes décrits ci-dessus. Et les 663 `a_relire` ne sont pas un
reliquat à forcer : ils tiennent par **une seule mesure faible**, la durée seule
la plupart du temps, c'est-à-dire le cas `Andy's Baby Animals` documenté plus
haut, un documentaire animalier rattaché à une série d'horreur japonaise sur une
concordance 100/100. Sans année ni date de parution, le plafond ne s'applique
pas et rien ne les départage.

**Filon épuisé, comme Metaluna, et pour la même raison** : ce qui manque n'est
pas la mesure mais le **candidat**. Ne pas relancer sans une mesure neuve.

---

## 6. Scripts (`~/jaquette-scraping/`)

### Ils ont tourné sur GitHub Actions du 2 au 4 août 2026

Les scripts vivent dans **`github.com/rayan-adamczak/jaquette-scraping`,
dépôt privé**, et c'est cette privauté qui lève l'objection du §6 d'origine :
la clé Supabase dans les secrets d'un dépôt **public** aurait été exposée à
quiconque obtiendrait un droit d'écriture. Ici elle ne l'est pas, et une
seconde clé secrète, distincte de `import_scripts_2026_07`, permet de couper
la CI sans arrêter les passes locales.

Sept secrets : `SUPABASE_SERVICE_ROLE_KEY`, `TMDB_READ_TOKEN`, les quatre
`R2_*`, et `CF_DEPLOY_HOOK`.

**Les sept planifications sont coupées depuis le 4 août 2026**, les 2 000
minutes de runner du mois étant consommées. Les blocs `schedule:` sont
commentés dans les fichiers, avec le motif et la marche à suivre pour
rétablir ; `workflow_dispatch` reste ouvert partout.

**Sur un dépôt privé à quota épuisé, Actions ne lance plus les jobs du tout.**
Une passe planifiée ne tombe pas en erreur, **elle n'existe pas** : c'est
exactement la panne muette que le §9 documente deux fois, et c'est ce qui
serait arrivé sans un mot si les crons étaient restés. Couper explicitement
vaut mieux que subir un silence.

| workflow | quand | ce qu'il fait |
|---|---|---|
| `maj-popularite.yml` | ~~lundi 8 h~~ à la main | rafraîchit `films.popularite` |
| `maj-shopify.yml` | ~~mardi 8 h~~ à la main | **65** collections Metaluna + Le Chat qui fume |
| `maj-zavvi.yml` | ~~mercredi 6 h~~ à la main | énumérer, crawler, résoudre, miroiter, écrire |
| `maj-bluray.yml` | ~~jeudi 7 h~~ à la main | **import seul**, la collecte est locale |
| `maj-ec.yml` | ~~vendredi 7 h~~ à la main | énumérer le delta, trier, résoudre, écrire |
| `maj-awin.yml` | ~~5 h~~ à la main | prix marchands, flux Leclerc |
| `signalements.yml` | ~~9 h~~ à la main | ouvre une issue si des signalements attendent |
| `publier.yml` | appelé par les passes | hook Cloudflare, puis vérifie le sitemap servi |
| `recapituler.yml` | appelé par les passes | ouvre une issue de récapitulatif |
| `dvdfr.yml` | à la main | enrichit par code-barres, **n'élargit rien** |

`publier.yml` et `recapituler.yml` ne coûtent plus rien d'eux-mêmes : ils sont
en `workflow_call`, donc ils ne partent que si une passe les appelle.

**Attention, `workflow_dispatch` consomme le même forfait.** Tant que le
compteur n'est pas remis à zéro, un lancement manuel ne partira pas davantage
qu'un cron. Les passes tournent donc **en local**, comme le faisaient déjà les
deux collectes que l'IP des runners fait refuser.

**Ce qu'il faudra trancher à la remise à zéro**, visible sur
`github.com/settings/billing` : lesquelles remettre sur cron, et non toutes.
La seule journée du 2 août 2026 a consommé **1 253 minutes**, Zavvi et son
crawl de 12 665 fiches en tête. `run_crawl` et `run_resolutions` existent
précisément pour reprendre les artefacts d'un run antérieur au lieu d'en
refaire un, et c'est le premier levier à employer.

**`signalements.yml` est la seule passe dont l'issue reste ouverte.** Celle de
`recapituler.yml` est une trace et se referme aussitôt ; celle-ci est une
**tâche**. Elle existe parce que la table `signalements` est en `revoke all`
pour `anon` et `authenticated` : rien dans le site ne peut la lire, la seule voie
est l'éditeur SQL, et un signalement réel n'était donc vu par personne alors que
la modale promet une relecture.

Elle annonce aussi les profils qui approchent du plafond de 50, lequel ne
redescend jamais tout seul : sans triage, cinquante comptes suffiraient à mettre
un profil hors de portée de tout signalement ultérieur, y compris fondé.

**Rien de nominatif n'entre dans l'issue**, ni le compte visé, ni l'auteur, ni le
commentaire, seulement un décompte, un motif et un identifiant de ligne. Un
signalement nomme quelqu'un et une issue garde son texte pour toujours.

L'instantané dans R2, `etat/signalements.json`, évite de renotifier la même file
chaque jour, faute de quoi la notification finirait ignorée, ce qui est le défaut
qu'elle répare. **La file vide, cas de tous les jours, sort avant de toucher
R2** : rien à comparer, donc rien à télécharger.

**Les cinq passes n'ont pas tourné du 2 août 14 h 04 au 3 août**, et rien ne
l'a signalé. `recapituler.yml`, ajouté ce jour-là, déclare
`permissions: issues: write` ; un workflow réutilisable ne pouvant pas obtenir
plus de droits que son appelant, GitHub refusait **au démarrage**, et c'est
l'appelant entier qui tombait, pas seulement le récapitulatif. Détail du piège
au §9.

**Le mécanisme censé faire rendre des comptes empêchait les passes de
tourner**, ce qui est la forme la plus aboutie du défaut qu'il devait
prévenir. Les runs Zavvi verts de la veille ne l'appelaient pas encore, d'où
l'illusion que tout allait bien.

**La liste des collections vit dans `metaluna/collectes.py` et nulle part
ailleurs.** Elle était recopiée trois fois, dans la table, dans la matrice et
dans la boucle d'écriture. Un job `lister` la lit et l'expose aux deux étages,
et l'entrée `collections` permet de traiter par vagues, ce qui compte quand
2 000 minutes de runner par mois se partagent entre cinq passes. L'entrée
`appliquer` donne une simulation de bout en bout, désarmée sur cron par un
test sur `event_name`.

Un jour par passe : elles écrivent toutes en base et se disputeraient le
verrou `ecriture-base` sans rien y gagner.

**Deux collectes restent sur la machine, et une seule raison les retient.**
`crawl_bluray_local.sh`, posé par `app.jaquette.bluray.plist` le mercredi
10 h, et `crawl_dvdfr_local.sh`, lancé à la main : les deux sites refusent
l'IP des runners GitHub, voir §9.

`crawl_dvdfr_local.sh` prend un nombre de **minutes** et non un rang de fiche :
sur une machine qu'on veut récupérer à une heure donnée, c'est le temps qu'on
connaît, pas le compte. Les 5 440 codes ont été faits en trois créneaux, 4 h,
2 h 20 et 5 min, le fichier étant vidé à chaque ligne.

`etat_r2.py recuperer` **refuse d'écraser un local plus avancé** que R2, en
comparant les tailles. Une passe tuée en route, Mac refermé, laisse un local
en avance faute d'avoir atteint son étape de dépôt ; télécharger par-dessus
effacerait ce travail sans rien dire. Il énumère,
crawle le delta, dépose l'état dans R2, et la passe du jeudi reprend cet état
sans jamais adresser une requête à blu-ray.com.

**Un cron ne fournit aucune entrée**, et `inputs.x` y vaut faux quel que soit
le défaut déclaré. Toute condition qui dépend d'une entrée doit donc porter
`github.event_name == 'schedule'` en tête. Sans ça, la passe Zavvi planifiée
aurait écrit 11 495 éditions au lieu de 4 446, et la passe blu-ray n'aurait
jamais réénuméré son listing, donc jamais rien trouvé.

**Chaque passe rend des comptes.** `recapituler.yml` ouvre une issue et la
referme aussitôt : c'est une trace, pas une tâche, et GitHub notifie déjà par
courriel. Une chaîne qui tourne seule et ne dit rien est indistinguable d'une
chaîne cassée, ce dont le §9 garde deux exemples le même jour. `recap.py`
compare l'état courant à un instantané gardé dans R2 sous `etat/recap.json` :
aucune table ne date ses lignes, donc la différence est le seul moyen de dire
« depuis la dernière fois » sans migration. L'instantané n'est déplacé qu'à la
fin d'une passe complète, sinon ce qu'une passe tombée en route a écrit ne
serait jamais annoncé.

**L'état de reprise vit dans R2**, sous `etat/`, déposé et repris par
`etat_r2.py`. C'est ce qui rend les collectes incrémentales sur un runner
éphémère : sans lui, Zavvi recrawlait ses 12 665 fiches à chaque passe, soit
660 minutes au lieu de quelques-unes. Les pages brutes de blu-ray.com
s'archivent de même sous `bluray/pages/` par `pages_r2.py`, le bucket faisant
foi et non un journal.

**Résolution et écriture sont séparées jusque dans le graphe de jobs.** Le
premier étage tourne en parallèle et ne fait que lire ; le second est seul sur
sa machine et écrit, sous `concurrency: ecriture-base` partagé par tous les
workflows. Dix jobs qui créent des films en même temps se heurteraient sur
l'unicité `(tmdb_id, type)`.

**Les catalogues fusionnés sont recommités par la CI.** `enum_*.py` fusionne
avec `catalogue_*.json`, fichier suivi par git : sans le commit de retour, la
passe suivante repartirait du fichier de la semaine d'avant et la fusion ne
servirait à rien.

**`run_crawl` et `run_resolutions` reprennent les artefacts d'un run
antérieur** au lieu d'en refaire un. Sans elles, éprouver la chaîne Zavvi
coûte deux crawls de deux heures quarante-cinq et deux résolutions de
quarante minutes, pour un catalogue qui n'a pas bougé entre les deux.

**Le coût est en minutes de runner, pas en stockage.** La journée du 2 août
2026 a consommé **1 253 minutes**, à comparer aux 2 000 gratuites par mois
d'un plan Free sur dépôt privé. Le stockage R2 est négligeable, l'egress
gratuit. C'est le temps de transfert qui se paie, pas les octets.

### Zavvi (`zavvi/`, 2026-08-02)

    python3 enum_zavvi.py
    python3 crawl_zavvi.py --tranche 0 --sur 4
    python3 resoudre_zavvi.py --tranche 0 --sur 6
    python3 miroir_zavvi.py --rattachees-seules --apply
    python3 ecrire_zavvi.py --rattachees-seules --apply

| Fichier | Rôle |
|---|---|
| `enum_zavvi.py` | Sitemap produit, isole les 12 665 disques |
| `crawl_zavvi.py` | JSON-LD et specs, tranché, reprenable |
| `resoudre_zavvi.py` | TMDB, tranché ; **adaptateur** sur `resoudre_metaluna` |
| `controles.py` | Contrôle croisé, partagé par le miroir et l'écriture |
| `miroir_zavvi.py` | Jaquettes vers `zavvi/<sku>/` sur R2 |
| `ecrire_zavvi.py` | Films, éditions et liens (`--apply`) |

**Le contrôle croisé est la leçon principale de cet import.** Un rattachement
« sûr » ne repose que sur **une seule** mesure : la résolution teste la durée
d'abord, et quand elle concorde elle ne consulte jamais le réalisateur. Sur
les 5 021 liens sûrs, 3 153 tenaient par la durée seule, 1 868 par le
réalisateur seul, **zéro par les deux**.

Les confronter à la mesure inemployée donne :

    3 293  65,6 %  confirmés par la seconde mesure
    1 172  23,3 %  non vérifiables, la seconde mesure manque
      556  11,1 %  contredits, écartés

Une mesure absente n'est pas une contradiction. Les écartés sont le motif
constant du §9, un titre exact tombant sur un homonyme : `Compulsion` de
Fleischer (1959) rattaché à celui de Neil Marshall, `Kiss of Death` de
Hathaway (1947) à celui de Schroeder.

**Deux tolérances, trouvées en relisant les refus du contrôle** et non
devinées, sans lesquelles il jetterait de bons liens : Zavvi colle les
co-réalisateurs sans séparateur (`Walt Dohrn David P. Smith`), donc on cherche
le nom TMDB n'importe où dans la chaîne ; et `Run Time` totalise parfois le
boîtier (`Aeon Flux` annonce 186 minutes pour un film de 93), donc un multiple
entier signale un total et non un désaccord.

**`--rattachees-seules` refuse d'écrire une édition qu'aucun lien ne
rattache.** Tout écrire aurait fait tomber le catalogue de 91,7 % à 66,3 % de
rattachement pour 7 049 lignes sans œuvre. La doctrine « une orpheline se voit
et se corrige » tient à huit cents, pas à sept mille : ces lignes-là ne sont
pas au sitemap, n'apportent rien au référencement, et personne ne les
reprendra jamais.

**Le miroir porte le même drapeau, et il l'a appris cher.** Il ne dépendait
d'abord que du crawl, exprès, pour tourner en parallèle de la résolution et
gagner une heure. Mais un miroir qui part avant les résolutions ne sait pas
quelles fiches seront retenues : il a recopié **11 498 images pour 3 154 Mo en
quatre heures** quand 4 446 éditions seulement ont été écrites. Une heure
gagnée d'un côté, deux heures et demie perdues de l'autre.

**La chaîne complète, au 4 août 2026**, en quatre étages dont trois en lecture
seule :

| Fichier | Rôle |
|---|---|
| `eans_a_qualifier.py` | Sort les EAN du flux absents du catalogue |
| `croiser_leclerc.py` | Apparie flux et dvdfr sur l'EAN, **sans réseau** |
| `croiser_boutique.py <handle>` | Idem pour une boutique d'éditeur |
| `resoudre_leclerc.py --source X` | TMDB, reprenable, **lecture seule** |
| `coffrets_leclerc.py` | Découpe les coffrets refusés, **lecture seule** |
| `ecrire_croisement.py --source X` | Films, éditions et liens (`--apply`) |

`--coffrets` fait lire `coffrets_<source>.jsonl` au dernier, et pose **un lien
par film** sous `<lien>_coffret`. Les deux cas passent par la même structure,
une liste, l'édition simple étant celle à un seul film : une seconde boucle
d'écriture aurait dérivé de la première.

**`resoudre_leclerc.py` est paramétré par source, pas recopié**, et
`ecrire_croisement.py` l'est aussi : c'est le §6 appliqué à lui-même, une
seconde implémentation du rapprochement dériverait sans que ça se voie.
`ecrire_leclerc.py` précède ce dernier et fait doublon, à retirer.

**L'écriture ne résout rien, elle lit `resolutions_<source>.jsonl`.** Première
version fautive, corrigée avant d'aller plus loin : le cache ne retenait que
les rattachements sûrs, donc les 522 refusés retombaient dans un repli qui les
rerésolvait avec des règles plus lâches. Le taux montait de 81,5 à 86,5 %, et
cette hausse n'était pas un gain, c'était **la relecture contournée**. Le cache
retient désormais l'ensemble des EAN vus : un refus consigné est un refus.

**`relire_leclerc.py` reprend un refus avec un titre de recherche corrigé, et
jamais avec un verdict.** Chaque entrée dit « cherche plutôt ceci » ;
`apparier` refait tout le travail et le contrôle à deux mesures tranche comme
pour les 2 823 autres. Poser des `tmdb_id` en dur ferait entrer des
rattachements que rien n'aurait vérifiés, ce que le §9 reproche au lot
`probable`.

**Et il m'a démenti deux fois sur treize** : `Harry Potter et les Reliques de
la Mort` et `Violent Streets` n'ont trouvé aucun titre exact même corrigés,
donc ils ne sont pas écrits. Si le contrôle refuse un candidat jugé bon à
l'œil, c'est le jugement qui se trompait.

**Ce que la relecture des 522 refus a montré**, et c'est le vrai résultat :

    169  sans durée, rien pour contrôler
    210  coffrets et séries, dont 114 trahis par leur seule durée
    105  films seuls dont TMDB ne rend aucun candidat
     38  relus un par un  ->  11 récupérés, ~14 pièges bien refusés

**73 % des refus sont structurels**, pas des ratés de méthode. Une vingtaine
seulement était discutable. Ne pas rouvrir ce lot en espérant mieux.

#### Rouvert le 4 août 2026 quand même, et voici ce qui l'autorisait

« Structurel » ne veut pas dire « perdu » : la structure en question est celle
qu'on sait découper depuis les coffrets blu-ray.com. Relevé sur les 522 :

     311  59,6 %  coffret sans indice, le titre nomme une saga  `Spider-Man`
      99  19,0 %  mono-disque, surtout des concerts et des opéras
      92  17,6 %  séparateur explicite  `Jumanji + Jumanji 2 + Jumanji 3`
      20   3,8 %  saga nommée, plage `Ep 4-6`, « en N films »

**80 % sont des coffrets ou des séries.** `resoudre_leclerc.py` cherche un
titre entier chez TMDB, et `Les Tuche + Les Tuche 2 : Le rêve américain + Les
Tuche 3` n'en est pas un.

**La mesure neuve est par coffret, pas par film**, et c'est ce qui la distingue
de ce que le §6 interdit de rouvrir sur Metaluna :

    Les Tuche + Les Tuche 2 + Les Tuche 3     annoncé 279 min
    TMDB                          95 + 95 + 89 = 279

La somme valide le **lot entier d'un coup** : si un seul titre était faux, elle
ne tomberait plus. C'est une mesure indépendante au sens du §9, elle ne rejoue
pas notre rapprochement, elle le confronte à un chiffre venu de la source. Et
le plafond s'applique ici, contrairement à Zavvi, `date_parution` étant à 100 %.

    64 coffrets validés, 156 liens
    écart médian 2 minutes, 22 sur 64 exacts à la minute
    127 à relire, 331 échecs

**Les deux voies ont été relues en entier avant écriture.** 35 par séparateur,
où les titres sont littéralement écrits dans le nom du produit, donc rien n'est
deviné ; 29 par développement de saga TMDB, la voie la moins étayée, listées une
par une : `Hannibal Lecter` rend *Le Silence des agneaux*, *Hannibal*, *Dragon
rouge* ; `Star Trek trilogie` rend la trilogie Abrams et pas les dix autres ;
`Downton Abbey` rend les trois **films** et pas la série, tranché par 369 contre
368 annoncées. Zéro erreur sur 29.

**Les 99 mono-disques restent dehors à raison**, ce sont les concerts et les
opéras, et le §8 veut justement écarter les seconds.

Le piège du champ `realisateur` de dvdfr apparaît ici : sur un coffret il
porte `Coffret 2 films`, `1ère partie`, `Part 1 & 2`, le parseur prenant ce qui
suit le titre. Sans conséquence, un réalisateur inventé ne correspondant à
rien chez TMDB, mais il explique une part des « aucun titre exact ».

**`ecrire_croisement.py` a remplacé `ecrire_leclerc.py` le 4 août 2026**, après
avoir servi sur deux lots. Le précédent lisait le flux brut et le cache dvdfr,
donc il était noué à Leclerc ; `disques_leclerc.json`, sa seule entrée
propre, part avec lui.

**Toutes les planifications sont coupées depuis le 4 août 2026**, le forfait de
2 000 minutes étant consommé. Sur un dépôt privé, Actions cesse alors de lancer
les jobs sans rien signaler. Les deux plus gros consommateurs étaient Zavvi,
310 minutes pour recrawler 12 665 fiches par semaine, et dvdfr, **281 minutes
brûlées pour rien** puisque le runner ne peut pas joindre le site.

**Conséquence à surveiller : la passe de prix ne tourne plus.** C'est la seule
dont le retard se voit à l'écran, la date de relevé s'affichant sous le prix.
À lancer à la main, ou à remettre en local par un agent launchd.

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
| `ecrire_metaluna.py` | Films, éditions et liens (`--apply`), dédup par titre |
| `relire_metaluna.py` | Reprend les orphelines, `<collection>` ou `--toutes` |

Toutes les collections de `collectes.py` ont été importées le 1er août 2026 :
`criterion`, `carlotta`, `rimini`, `esc`, `elephant`, `sidonis`,
`artus-films`, `make-my-day`, `extralucid`, `potemkine`. Ajouter une source
tient en une entrée dans la table et une commande.

**Une seule passe de résolution, contrôle compris**, là où Le Chat qui fume en
a demandé deux : la source donne réalisateur et durée dès la première
recherche, donc il n'y a pas à revenir plus tard chercher de quoi valider.

**`relire_metaluna.py`, 1er août 2026 : 302 orphelines, 78 rattachées**, taux
de la source porté de 81,3 % à **86,1 %**, 59 films créés. Liens sous
`metaluna_relecture`, et `metaluna_relecture_partiel` quand un découpage n'est
résolu qu'en partie.

**Le levier du Chat qui fume ne s'applique pas ici, et c'est le relevé qui l'a
dit.** `relire_chat.py` avait rendu 66 rattachements sur 87 en introduisant le
contrôle par durée ; ici il est déjà passé. Motifs de blocage sur les 330 liens
manquants :

| motif | liens |
|---|---|
| aucun titre exact | **238** |
| homonyme, année divergente | 63 |
| titre exact, aucun contrôle ne confirme | 29 |

Sept fois sur dix il manquait le **candidat**, pas la mesure : un contrôle ne
contrôle rien quand TMDB n'a rien rendu. Le script élargit donc la recherche,
six écritures par édition et 24 fiches relues contre une et quatre, et
resserre en regard : **deux mesures concordantes exigées**, réalisateur et
durée, réalisateur et année, ou durée et année plus un mot partagé.

Les 63 homonymes ne sont **pas rouverts** : la passe précédente les a refusés
en connaissance de cause, et rouvrir sans mesure neuve, c'est refaire le lot
`probable`, faux à 23 %.

**Les 224 qui restent ne sont pas un reliquat à retravailler.** Deux familles,
toutes deux hors de portée d'une recherche : les œuvres que **TMDB ne
référence pas**, tout le bis espagnol d'Eloy de la Iglesia chez Artus, et les
coffrets d'auteur, `Coffret Jacques Rozier`, `Heimat - L'Intégrale`, que le §9
interdit de forcer.

Le script **importe** ses fonctions de rapprochement de `resoudre_metaluna.py`
au lieu de les recopier : une seconde normalisation dériverait de la première
sans que ça se voie, et c'est elle qui porte les pièges d'apostrophe
typographique, de chiffres romains et de suffixe de format.

#### Trois passes du 4 août 2026, sur 1 238 orphelines

Trois leviers essayés le même jour, chacun mesuré avant d'être écrit, et
chacun avec un résultat franc. Le catalogue est passé de 89,2 à **90,8 %** de
rattachement, et **le filon Metaluna est épuisé**.

| levier | population visée | rendement |
|---|---|---|
| mention de langue dans le titre | 121 | **39 liens** |
| liste de films dans la description | 162 | **16 liens**, 226 découpages |
| le reste, sans motif identifié | ~1 000 | 0 |

**La mention de langue cassait le découpage, pas la recherche.** `SEPARATEURS`
coupe sur ` + `, et `(VF + STFR)` en porte un : `Speak No Evil (VF + STFR)`
devenait `Speak No Evil (VF` puis `STFR)`. Le nettoyage existait, mais dans
`requetes()`, donc **après** l'éclatement. Détail au §9.

**La liste des films vit dans la description, jamais dans le titre.** Le titre
d'un coffret d'éditeur ne nomme souvent aucune œuvre, `J-Horror Rising`,
`Brit Noir: Collection I`, `Film Noir: The Dark Side of Cinema XXVII`. Aucun
découpage du titre ne les résoudra. Trois formes relevées, et seulement trois :

    Shikoku / Isola / Persona / Inugami           titres séparés par des barres
    Contient les 4 films suivants : - A - B - C   annoncé, puis à tirets
    - Meurtre au soleil (1982) : synopsis…        tirets, année et résumé

Mesuré avant d'écrire : **162 orphelines portent une liste, 1 076 n'en ont
aucune.** C'est la leçon des coffrets blu-ray.com à l'identique, ce qu'on croit
absent de la source est souvent dans la page, jeté par le parseur.

**Mais un coffret n'a aucune mesure par film, et c'est là que ça s'arrête.**
226 découpages pour **11 coffrets validés seulement**. La durée annoncée couvre
le lot entier, et le réalisateur est unique pour tous les titres quand il ne
vaut pas `various` : sur `J-Horror Rising`, sept films japonais héritent tous
d'« Alex de la Iglesia », déjà faux au boîtier. Sans durée ni réalisateur par
film, aucune des deux mesures concordantes exigées n'est disponible.

**Le contrôle a raison de refuser, et il ne faut pas l'assouplir.** Poser les
226 liens sur un titre exact sans mesure, ce serait refaire le lot `probable`,
faux à 23 %. Les 16 liens obtenus le sont sur les coffrets où un contrôle
tenait vraiment, dont 13 en `metaluna_relecture_partiel`.

**Ne pas rouvrir ce chantier sans une mesure neuve par film.** Ce qui reste
est caractérisé et hors de portée : environ 1 076 éditions sans liste ni
séparateur, le bis espagnol d'Artus et les fonds d'auteur que TMDB ne
référence pas, plus 215 coffrets découpés mais invalidables.

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
| `reprendre_a_verifier.py` | Repasse la règle de dédup actuelle sur un résidu (`--apply`) |
| `pages_r2.py` | Verse `crawl/pages/` sur R2, préalable à l'automatisation (`--apply`) |

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
| `ecrire_ec.py` | Écriture (`--apply`) |

**Le `DECISIONS` d'`ecrire_ec.py` a longtemps passé pour un obstacle à
l'automatisation. Il n'en est pas un** : ce dictionnaire de six rattachements
tranchés à la main en juillet 2026 est **keyé par slug**, donc inerte pour
toute fiche neuve. La chaîne est planifiée depuis le 2 août 2026 (§6).

**Le vrai manque, lui, demeure : aucune mesure indépendante.**
editioncollector ne publie ni durée ni réalisateur, là où Metaluna, Le Chat
qui fume et Zavvi permettent de confronter la durée du boîtier au `runtime` de
TMDB. Ne restent que le titre exact et l'année entre parenthèses, présente sur
une fiche sur cinq. Ce que `resoudre_ec.py` ne sait pas trancher part dans
`ec_ambigus.json`, que l'écriture ignore : ces éditions entrent orphelines,
et c'est le bon sens de la panne.

**C'est la seule des cinq chaînes sans état à conserver** : `enum_ec.py`
mesure son delta contre les `url_source` déjà en base, pas contre un fichier,
donc rien à déposer dans R2.

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

#### Rattrapage du 5 août 2026, les deux tiers du catalogue n'avaient rien vu

Les passes de juillet n'avaient traité que 3 604 et 4 682 films ; le catalogue
en compte 12 129, et **tout ce qui est entré depuis leur échappait**. Quatre
passes enchaînées, plus une cinquième écrite pour l'occasion :

| | avant | après |
|---|---|---|
| sans synopsis | 1 475 | **17** |
| sans titres étrangers | 7 825 | 1 177 |
| sans pays | 2 463 | **5** |
| sans producteurs | 3 682 | 1 553 |
| sans compositeur | 4 854 | 3 117 |
| sans backdrop | 595 | 477 |
| acteurs par film, moyenne | 5 | **11,0** |

**Le plafond de cinq acteurs du §8 est levé**, `NB_ACTEURS=12` sur tout le
catalogue : 11 348 films en portent plus de cinq, contre 1 004 avant.

**Ce qui reste n'est pas un reliquat, c'est ce que TMDB ne publie pas.** Les
477 backdrops manquants n'existent ni en français ni en anglais, les 1 177
titres étrangers n'ont aucune des six langues retenues, et le budget reste
absent sur 7 399 films parce que TMDB rend `0` quand il l'ignore.

**La popularité a été rafraîchie**, périmée depuis la coupure d'Actions. Tête
de liste au 5 août : *Spider-Man : Brand New Day* (1 991), *L'Odyssée* (944),
*Spider-Man : No Way Home* (521).

### `combler_tmdb.py`, et le trou de synopsis qui était un trou de traduction

Écrit le 5 août 2026 pour ce que les deux autres ne couvrent pas : synopsis,
backdrop, affiche, accroche, note. **Enrichir, jamais corriger**, une colonne
déjà remplie n'est pas touchée.

**Premier passage en français seul : 119 comblés sur 1 695, zéro synopsis.**
Mesuré ensuite sur 50 films tirés parmi les 1 421 concernés :

    0 %   ont un synopsis français chez TMDB
    98 %  en ont un en anglais
    2 %   n'ont rien nulle part

Le trou n'était donc pas un trou de données mais de **traduction**, et aucune
passe française ne l'aurait jamais comblé. D'où `--synopsis-anglais`, drapeau
explicite plutôt que repli silencieux : écrire de l'anglais sur un site
français est une décision éditoriale, elle doit se voir dans la commande.
**1 458 synopsis écrits.**

**La mention « (Synopsis indisponible en Français pour l'instant) » va à la
fin du texte, pas au début.** `useSeo` compose la description et l'`og:description`
depuis le début du synopsis (§7) : une mention en tête les mangerait
entièrement, or donner du texte à lire à un moteur est précisément le gain
visé. En queue, la description reste le résumé du film.

**Deux pièges de sélection, tous deux muets :**

- **`tagline` ne peut pas servir de critère.** Nulle sur des milliers de films
  et presque jamais publiée en français par TMDB, elle sélectionnait 7 258
  fiches dont les douze premières n'avaient rien à recevoir. Un critère qui
  ramasse tout ne sélectionne rien ;
- **`synopsis.is.null` ne voit pas une chaîne vide.** 54 fiches en portaient
  une, invisibles du filtre. Même faute que les 375 EAN editioncollector
  écrits `''` (§9), dans l'autre sens : là une absence passait pour une
  valeur, ici pour une présence.

### Classement (2026-07-31)

| Fichier | Rôle |
|---|---|
| `dates_editions.py` | `date_sortie` (texte anglais) → `date_parution` (`--apply`) |
| `maj_popularite.sh` | Rafraîchit `films.popularite`, désormais sur Actions |

**Piège de locale dans `dates_editions.py`** : `%b` et `%B` de `strptime`
dépendent de la locale du système. Sous une locale française, « Sep » n'est pas
reconnu et la passe rendrait **zéro date sans rien signaler**. Les mois passent
donc par une table explicite.

**La popularité se rafraîchit toute seule, lundi 8 h UTC**, par
`maj-popularite.yml` sur GitHub Actions (§6). Le script `maj_popularite.sh` et
son agent launchd sont retirés ; le script reste pour un lancement à la main.

**Elle a longtemps été sur la machine, et le motif est éteint.** La clé
`service_role` n'avait rien à faire dans les secrets d'un dépôt **public** ;
le dépôt de collecte est privé, la clé y est déjà, et quatre autres chaînes
s'en servent. La bascule a en outre réglé une panne muette : l'agent launchd
n'avait jamais tourné une seule fois, `~/Documents` étant protégé par la
confidentialité de macOS (§9).

**Aucun déploiement derrière**, contrairement aux passes qui font entrer des
éditions : `popularite` est lu à l'exécution par PostgREST, il n'entre ni dans
le bundle ni dans le sitemap.

La passe repart de zéro à chaque fois, l'avancement sert à reprendre après une
coupure, pas à sauter les films vus la semaine d'avant. C'est bien tout le
catalogue qu'on veut réactualiser.

### Awin, Leclerc et Jokers (`awin/`, 2026-08-03 et 04)

    export AWIN_FEED_LECLERC='…'          # Create-a-Feed, porte la clé API
    python3 telecharger_awin.py leclerc
    python3 sonde_awin.py                 # mesure, n'écrit rien
    python3 offres_awin.py --apply        # pose les offres

| Fichier | Rôle |
|---|---|
| `telecharger_awin.py` | Récupère le flux, garde le brut sous `brut/`, n'interprète rien |
| | et élague : `--garder N`, défaut 1, par marchand |
| `sonde_awin.py` | Mesure : colonnes, catégories, EAN, recoupement, manques. **Lecture seule** |
| `offres_awin.py` | Écrit `offres` par EAN exact (`--apply`), purge ce que la passe n'a pas revu |

**« Garder le brut » n'est pas « garder l'archive », précisé le 6 août 2026.**
Chaque passe complète ajoutait 72 Mo à `brut/` et rien ne les élaguait : 5
fichiers pour 176 Mo, dont **deux flux Momox identiques à l'octet**, la boutique
ne régénérant le sien qu'une fois par jour. Ce que la règle du §9 protège est la
possibilité de rejouer un parseur sur le flux **courant**, pas une série
temporelle qu'on n'a jamais consultée. `telecharger_awin.py` garde donc le
dernier de chaque marchand, `--garder N` pour en garder plus, `--garder 0` pour
ne rien toucher.

**Deux points d'ordre, et les deux se paieraient cher inversés** : le motif
d'élagage porte le marchand, sans quoi une passe Leclerc supprimerait les flux
Momox, et l'élagage vient **après** le contrôle de taille. Un flux refusé sort en
erreur en gardant son fichier pour examen, et c'est précisément là que le
précédent sert de point de comparaison : élaguer d'abord détruirait le seul
témoin au moment où on en a besoin.

**Aucune colonne n'est supposée.** Le jeu de colonnes d'un flux Awin est un choix
fait dans Create-a-Feed, pas un contrat : la sonde relève l'en-tête, le publie,
cherche chaque champ par une liste d'alias, et **annonce ce qu'elle n'a pas
trouvé**. Un champ introuvable n'est jamais compté zéro en silence, c'est le §9
mot pour mot.

**Le filtre « disque » n'est pas décidé d'avance** : la sonde histogramme les
catégories marchandes et publie le tableau, c'est en le lisant qu'on écrit le
vrai filtre. Une enseigne généraliste a un vocabulaire de rayon qu'on ne devine
pas.

**`offres_awin.py` rapproche sur tout le flux, pas sur les lignes filtrées.** Un
EAN exact qui tombe sur une de nos éditions **est** ce disque, la catégorie du
marchand n'a plus rien à dire : c'est ce qui fait 724 offres au lieu des 697 que
le filtre disque laissait voir.

**Ce que la passe n'a pas revu est supprimé.** Un produit sorti du flux est
délisté ; garder son offre afficherait un prix mort et un lien qui ne rapporte
plus. La suppression ne porte que sur ce marchand et sur les lignes dont
`releve_le` précède le début de la passe.

**Paramétrée par marchand depuis le 6 août 2026.** `MARCHANDS`, en tête
d'`offres_awin.py`, est la seule source de ce qui les distingue : le libellé
affiché, qui sert aussi de clé de purge, et la correspondance `condition` vers
`offres.etat`. Montage de `metaluna/collectes.py` et de `boutiques/boutiques.py`.

    python3 telecharger_awin.py momox
    python3 sonde_awin.py momox                    # un nom, plus un chemin
    python3 offres_awin.py --marchand momox --apply

**Le flux se cherche par préfixe de marchand, jamais « le dernier brut ».** Le
défaut d'origine prenait `brut/*.csv.gz` trié, juste tant qu'un seul marchand
existait. Avec deux, une passe Leclerc lancée après un téléchargement Momox
aurait lu le flux Momox, trouvé peu d'appariements sous le libellé `E.Leclerc`,
et **purgé les offres Leclerc qu'elle n'aurait pas revues**. `CHUTE_MAX`
l'aurait arrêtée, mais compter sur elle pour rattraper une erreur de fichier
serait la traiter comme un filet plutôt qu'un garde-fou. `sonde_awin.py` avait
le même défaut et accepte désormais un nom de marchand.

**`maj-awin.yml` boucle sur les deux, séquentiellement**, et ce n'est pas de la
prudence mal placée : `CHUTE_MAX` compare le décompte d'avant à ce que la passe a
trouvé, donc deux passes qui lisent `offres` en même temps se mesureraient l'une
l'autre. Le verrou `ecriture-base` protège d'un autre workflow, pas de soi-même.

**Rien ne planifie encore cette passe**, et c'est le manque à combler en
premier : les 724 prix sont un instantané du 3 août 2026. Un prix affiché est
une information commerciale, il se périme, et le site le date au survol sans
pour autant se rafraîchir. Le flux Leclerc est régénéré tous les jours chez eux
et le téléchargement ne coûte que quelques minutes de runner, sans crawl : c'est
la passe la moins chère du dépôt et la seule dont le retard se voit à l'écran.

### Boutiques d'éditeur (`boutiques/`, 2026-08-04)

    python3 enum_boutique.py coindemire
    python3 crawl_boutique.py coindemire            # ~18 min à 5 s l'unité
    python3 croiser_boutique.py coindemire          # ../awin, sans réseau
    python3 resoudre_leclerc.py --source coindemire
    python3 ecrire_croisement.py --source coindemire --apply

| Fichier | Rôle |
|---|---|
| `boutiques.py` | Table des boutiques, seule source de leurs particularités |
| `enum_boutique.py` | Sitemap produit, écarte les doublons de locale, **fusionne** |
| `crawl_boutique.py` | JSON-LD et description, `--rejouer` sans réseau |

**`jokers/` est devenu `boutiques/` le 4 août 2026.** La deuxième boutique du
même genre a suffi à montrer que rien dans la chaîne n'était propre à The
Jokers : même 429 sur `products.json`, même voie par le sitemap, même
`gtin13` en JSON-LD. Ce qui les distingue tient en quatre champs, et vit dans
`boutiques.py`, sur le montage de `metaluna/collectes.py`. Ajouter une source
tient en une entrée et cinq commandes.

**`--rejouer` recalcule les formats sur le `.jsonl` déjà collecté**, sans une
requête. C'est la méthode n° 2 du §9, conserver de quoi rejouer un parseur, et
elle a servi le jour même de son écriture : le `4K` de restauration avait
faussé les 213 fiches Coin de Mire au premier passage.

**Trois plateformes, déclarées dans la table**, et l'écart tient à la voie
d'énumération :

    shopify       sitemap -> 1 requête par fiche      213 requêtes
    woocommerce   Store API -> tout le catalogue        3 requêtes
    prestashop    catégories paginées, aucun sitemap

**PrestaShop n'expose rien.** Ni `/sitemap.xml`, ni `1_fr_0_sitemap.xml`, ni
`/plan-du-site` : tous rendent 404 avec une page d'erreur de 40 à 46 Ko, taille
qui ferait croire à une réponse si on ne lisait pas le statut. L'énumération
passe donc par les catégories, `?page=N` n'étant pas dans leur `Disallow`
contrairement à `?order=`, `?tag=`, `?search_query=` et `?n=`.

**On s'arrête quand une page n'apporte rien de neuf**, jamais quand elle est
vide : PrestaShop sert la dernière page en boucle au-delà du dernier numéro,
donc une condition sur le vide ne s'arrêterait pas.

### Enrichissement par code-barres (`boutiques/enrichir_ean.py`, 2026-08-04)

    python3 enrichir_ean.py rimini            # simulation
    python3 enrichir_ean.py rimini --apply

**Première chaîne du dépôt qui ne crée aucune édition.** Elle remplit
`editions.ean` sur des lignes déjà là, celles que Metaluna a fait entrer sans
code-barres. Détail de la mesure et du rendement au §5.

Rapprochement sur le **titre replié restreint au même éditeur**, méthode
d'`ecrire_zavvi.py`, `titre_comparable` étant importé et non recopié. Second
critère, le **format**, sinon un Blu-ray recevrait l'EAN du DVD.

**Quand la boutique n'annonce aucun format, on retombe sur le titre seul, à une
seule candidate près.** Le garde-fou est déplacé, pas retiré : deux candidates
partent en relecture. C'est moins strict que « deux mesures concordantes », et
c'est assumé, parce que le gain est net, 15 rapprochements sur 59 devenant 27
chez Rimini et 4 sur 104 devenant 32 chez Spectrum. Un désaccord franc reste
refusé : une boutique qui **dit** `DVD` face à un `Blu-ray` en base n'est pas
une absence.

**Deux garde-fous repris d'ailleurs.** *Enrichir, jamais corriger*, comme
`ecrire_dvdfr.py` : une édition qui porte déjà un EAN n'est pas touchée. Et
refus d'un code déjà porté par une autre ligne, **9 collisions évitées chez
Rimini dès le premier passage**, le plus souvent la même sortie importée par
Leclerc. Un EAN faux est pire qu'un lien faux, il sert de clé ensuite.

**Ce qu'on crawle chez un WooCommerce, ce sont les pages `/film/`**, pas les
produits : la boutique a déjà tout donné du disque, ce qui manque est le
réalisateur et la durée. Une seule fois par œuvre, un Blu-ray et un DVD du même
film partageant leur page.

**Trois adaptations pour une source sans code-barres**, la chaîne supposant
l'EAN partout :

- la clé de reprise devient `<handle>:<slug>`, mais elle **n'entre pas dans
  `editions.ean`** : ce n'est pas un code-barres, et l'écrire gonflerait le
  compteur du §4 d'un code qui n'existe pas ;
- la déduplication passe sur `(source, source_id)`. Deux disques identiques
  venus de deux sources ne se verront plus, là où l'EAN les confondait. C'est
  le prix d'une source sans code-barres, à savoir avant d'en ajouter une ;
- le suffixe de format part du nom, `A pied d'œuvre – Blu-ray`.

### Reprise Zavvi (`zavvi/reprendre_zavvi.py`, 2026-08-04)

    python3 reprendre_zavvi.py --echantillon 200      # mesurer d'abord
    python3 reprendre_zavvi.py --tranche 0 --sur 6    # × 6, ~30 min
    python3 ecrire_zavvi.py --reprise --rattachees-seules --apply

Reprend les 7 639 fiches qu'aucun lien ne rattache, à quatre mesures dont deux
neuves, la distribution et le studio. Détail de la règle et de son
étalonnage au §5. **Lecture seule**, tranché, reprenable.

**`--reprise` écrit sous `zavvi_reprise`, jamais sous `zavvi`.** Les 4 446
éditions du 2 août et ces 460 sortent de deux passes à deux jeux de contrôles
différents ; les mêler rendrait l'une inannulable sans l'autre. Le §3 pose la
règle, la source d'un lien dit **comment** il a été obtenu.

### Séries par le rang de saison (`series/`, 2026-08-07)

    set -a; . ~/.config/boxology.env; set +a
    python3 resoudre_series.py --echantillon 30    # mesurer d'abord
    python3 resoudre_series.py                     # lecture seule
    python3 ecrire_series.py --apply

**59 liens posés, 25 séries créées**, sur des œuvres que TMDB connaissait
toutes : Peaky Blinders, Game of Thrones, Fallout, Hercule Poirot, Twin Peaks,
Babylon 5. Ce qui bloquait n'était pas la source mais le bruit du titre, qui
empile le nom, le rang de saison écrit deux fois, le format et le pays :

    Agatha Christie: Poirot Season 12 Blu-ray (Saison 12) (France)
    Bakuman. Box 1/2 Season 1 Blu-ray (Coffret 1/2 Saison 1) (France)

**On rattache la série, jamais la saison.** Les huit coffrets de Game of Thrones
pointent la même œuvre : le rang n'est pas une donnée à retrouver, c'est du
bruit à retirer. Et la recherche se fait en `search/tv` **seul**, le §9 gardant
la trace de `Peaky Blinders: Series 4` rattaché à un film nommé « Series 4 ».

**Le plafond est un plafond, jamais un filtre.** L'année d'un coffret « saison
4 » est postérieure à la première diffusion, de plusieurs années : on vérifie
que la série a commencé **avant** le disque. Passer `first_air_date_year` à TMDB
éliminerait la bonne réponse.

**Sans date de parution, ce qui tranche est l'unicité**, et c'est une nuance de
la règle des deux mesures. Le §9 les exige pour **départager** des candidats ;
quand un seul titre exact existe chez TMDB, il n'y a rien à départager. Le lot
le prouve : les 14 rattachements à candidat unique sont tous justes, et le seul
faux — `Wacky Races` renvoyé au reboot de 2017 plutôt qu'à la série de 1968 —
est parmi les 5 à candidats multiples, que la popularité départage et qui
favorise mécaniquement le remake. Ces 5 restent en relecture.

**Trois mesures ont été cherchées avant l'unicité, et deux sont mortes à la
mesure** : le bandeau blu-ray.com, seul contrôle indépendant du dépôt, ne couvre
que 2 des 19 cas, quatorze venant de Metaluna ; le nombre de saisons annoncé
dans la fiche n'en couvre qu'un, Babylon 5 et ses « 5 seasons 110 episodes ».
`date_sortie`, `pays` et `disques` sont vides sur tout le lot, qui est du Warner
Archive.

**Le risque résiduel n'est pas l'homonyme, c'est l'absence.** `Eclipse Series
47: Abbas Kiarostami (17 films)` est une collection Criterion de coffrets, pas
une série, et TMDB porte une série « Eclipse » : le titre exact suffit à
produire un faux, sous le plafond compris. Aucune mesure ne dit qu'un disque
n'est pas une série ; celui-là s'écarte par `FAUSSES_SERIES`, sur son nom.

Quatre défauts trouvés en écrivant, le taux passant de 7/30 à 45/99 :

- **`\m` et `\M` sont des ancres PostgreSQL**, pas Python, reprises telles
  quelles des requêtes de mesure ;
- **le rang de coffret part avant la coupe**, sinon la barre de `Box 1/2` sert
  de séparateur et `Bakuman` se réduit à « Bakuman. Box 1 ». C'est la règle du
  §9 pour les doubles programmes, appliquée ici ;
- **le possessif anglais fait échouer un titre exact** : TMDB écrit `Agatha
  Christie's Poirot`, les disques `Agatha Christie: Poirot`, et un `s` isolé
  suffit ;
- **blu-ray.com écrit « The Complete Eight Season »** là où l'anglais demande
  « Eighth » : les cardinaux comptent autant que les ordinaux.

### Étiquetage des formats (`formats.py`, `etiqueter_formats.py`, 2026-08-06)

    python3 etiqueter_formats.py                 # simulation
    python3 etiqueter_formats.py --source zavvi.com
    python3 etiqueter_formats.py --apply

**Préalable à l'entrée du DVD, et il l'était pour de bon.** 4 711 éditions sur
23 803, soit 19,8 %, ne portaient aucun format, et **1 647 fiches Zavvi
`/p/dvd/` étaient déjà en base sans que rien ne le dise** : le périmètre
« Blu-ray et 4K » du §1 était entamé depuis le 2 août sans que personne le
sache. Faire entrer sept mille DVD par-dessus aurait faussé d'un coup les pages
`/formats`, les filtres et les décomptes d'axe.

Résultat : 7 418 éditions complétées, les éditions portant un support passent de
**19 027 à 23 235, soit 97,6 %**. Les 568 restantes n'ont aucun signal.

**`formats.py` porte le vocabulaire et les trois déductions, en une seule
copie**, et c'est le §6 appliqué à lui-même : deux copies de `chercher()` ont
porté le même défaut pendant des semaines avec deux symptômes opposés.

    support dvdfr    le plus sûr, apparié par code-barres
    segment d'URL    `/p/{blu-ray,4k,dvd}/`, que seul Zavvi publie, sur 12 665 fiches
    titre            ce que le nom du produit déclare

**Elles s'unissent, elles ne se remplacent pas.** Onze fiches du segment
`blu-ray` portaient `DVD` seul d'après leur titre, et il n'y avait **aucune
contradiction** : ce sont des `(Includes DVD)`, donc des combos que la catégorie
range à juste titre en Blu-ray. Le titre disait le disque d'appoint, l'URL le
support principal, et prendre l'un pour l'autre perdait la moitié de
l'information.

**Rien n'est jamais retiré**, le script n'écrit que s'il ajoute : rejouable sans
effet de bord, comme `ecrire_dvdfr.py`. Sauvegarde de la colonne entière dans
`formats_avant_20260806.json`.

**Le compte se fait sur les supports, pas sur les colonnes vides.** Une édition
qui ne porte que `Steelbook` n'est pas étiquetée : un boîtier existe en Blu-ray
comme en 4K. Sans `porte_un_support()`, la mesure d'avancement se félicite trop
tôt.

Deux pièges rencontrés en l'écrivant sont au §9, et le premier a failli remplir
`/formats/blu-ray` de 4K.

### Coffrets Leclerc (`awin/coffrets_leclerc.py`, 2026-08-04)

Découpe les 522 refus, et les contrôle par **la somme des durées TMDB contre la
durée annoncée du boîtier**. Voir le §8 pour ce que ça a rendu et pourquoi cette
mesure autorise à rouvrir un chantier que le §6 avait fermé.

Trois pièges du §9 y sont repris tels quels : retirer le vocabulaire d'édition
**avant** de découper, ne jamais découper sur « et » ni « and », et borner une
saga développée au nombre de disques du boîtier.

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
  base. **11 982 URL** au 3 août 2026, contre 9 525 la veille et 2 105 avant
  les campagnes de rattachement du 30 juillet 2026. Seuls les films
  rattachés à une édition y figurent, en **adresse canonique avec slug**. Le
  script casse le build s'il ne trouve aucun film, et aussi si `films.slug`
  manque : voir plus bas pourquoi c'est le bon sens de la panne. Les pages fixes
  y sont listées à la main, `/welcome` comprise ; les regroupements sont lus
  dans la table générée.
- **Search Console** : propriété Domaine validée, sitemap soumis et lu.
- **Listes personnelles et écrans du prototype** en `noindex, follow`.
- **`/legal` en `noindex, follow` depuis le 3 août 2026**, et **retirée du
  sitemap** au même moment. La page a cessé d'être anonyme le jour où l'activité
  est devenue professionnelle : elle porte désormais une adresse personnelle et
  un numéro de portable que la LCEN oblige à publier (§10).

  **L'obligation est de rendre accessible, pas de faire indexer.** Rien n'exige
  qu'une adresse de domicile remonte dans les résultats sur le nom de l'éditeur,
  et une page atteignable depuis le pied de page de tout le site est accessible
  au sens de la loi.

  Le retrait du sitemap va avec : demander l'indexation d'une page qui la refuse
  est une contradiction que la Search Console signale. `/privacy` reste indexée,
  elle ne porte aucune donnée personnelle.

  **Ce qui n'a pas été fait, et volontairement** : masquer le numéro derrière un
  bouton, l'écrire en image, ou le composer en JavaScript. Ces trois procédés
  gênent d'abord les lecteurs d'écran, donc ils abîment l'accessibilité même de
  la mention, qui est ce que la loi exige. Le seul vrai levier restant est une
  adresse de domiciliation, qui retire l'adresse au lieu de la cacher.

  Le `noindex` est posé **côté client** par `useSeo`, le middleware n'injectant
  de `<head>` que sur `/movies/`. Google exécute le JavaScript, donc il le voit ;
  un `X-Robots-Tag` dans `public/_headers` serait plus direct si le besoin se
  précise.

### Rendu du `<head>` à la périphérie, en place le 31 juillet 2026

`functions/_middleware.ts`, Pages Function Cloudflare. Elle lève la limite
consignée jusqu'ici : les scrapers de Facebook, iMessage et Discord
n'exécutant pas le JavaScript, ils ne voyaient que les `og:` génériques
d'`index.html`. Google rendait, mais avec une file d'attente de plusieurs jours
sur un catalogue de milliers de fiches.

Elle fait quatre choses, et **seulement sur `/films/`**. Tout le reste ressort
par `next()` au premier test :

1. l'adresse canonique d'une fiche est `/movies/<slug>/<id>` ; toute autre forme
   part en **301** vers elle, chaîne de recherche conservée ;
2. un id inexistant répond un **vrai 404**, là où la réécriture SPA répondait
   200 sur une page vide, soit un « soft 404 » aux yeux de Google ;
3. `HTMLRewriter` remplit le `<head>` au vol, avec exactement les valeurs que
   `useSeo` posera ensuite côté client, plus le JSON-LD ;
4. **le corps est écrit dans `#root`**, depuis le 31 juillet 2026.

**Cinquième chose depuis le 2 août 2026, et celle-là sur tout le trafic** : un
`X-Robots-Tag: noindex` sur **tout hôte qui n'est pas `jaquette.app`**.

Cloudflare Pages publie le projet sur `jaquette.pages.dev` et chaque
déploiement sur `<hachage>.jaquette.pages.dev`. Ces adresses servaient le site
entier en 200, `robots.txt` compris avec son `Allow: /`, et comme le canonical
est calculé depuis l'URL courante, une fiche vue là-bas **se déclarait
canonique d'elle-même** :

    https://jaquette.pages.dev/movies/…/1
    <link rel="canonical" href="https://jaquette.pages.dev/movies/…/1" />

Soit 9 525 URL en double, indexables, concurrentes de jaquette.app sur ses
propres requêtes. Toute cette section s'emploie à écarter les doublons, et
celui-ci entrait par la porte d'à côté.

**Un `noindex` et non une 301**, et c'est le point à ne pas inverser : les
déploiements de prévisualisation servent à vérifier une mise en ligne avant
qu'elle n'atteigne le domaine, et une redirection les rendrait inutilisables,
alors que c'est exactement ainsi que ce fichier se teste.

La production ne reçoit rien de plus, l'égalité d'hôte est testée en premier et
la réponse ressort telle quelle. Ailleurs la réponse est reconstruite pour
obtenir des en-têtes modifiables, `Response.redirect` rendant les siens figés.
Vérifié sous `wrangler` que la 301 garde son `Location` en le traversant.

**Les données de la fiche sont inlinées depuis le 3 août 2026**, dans un
`<script type="application/json" id="donnees-fiche">` posé après `#root`. Le
Worker vient de lire le film et ses éditions pour écrire le `<head>`, le corps
et le JSON-LD ; sans ce bloc, le navigateur refaisait le même aller-retour une
fois le bundle chargé, et la liste des éditions n'arrivait qu'à 2 823 ms.

`lireFilm` demande donc les colonnes de la **fiche**, plus seulement celles du
`<head>` : `films` en entier, et les éditions énumérées sans `contenu_brut`,
qui pèse des dizaines de kilo-octets et que personne n'affiche.

**Après `#root` et non dedans** : `createRoot` remplace le contenu du conteneur
au montage, ce qui effacerait le bloc avant lecture. Et c'est un bloc de
**données**, pas un script : `application/json` n'est pas exécuté, donc la CSP
`script-src 'self'` le laisse passer sans `unsafe-inline`. Le chevron ouvrant
est échappé comme dans le JSON-LD, un `</script>` dans un synopsis fermerait la
balise par surprise.

**État initial, pas vérité définitive.** La page relit derrière, sans écran de
chargement : un onglet resté ouvert ne fige pas un prix. L'identifiant est
vérifié à la lecture, une navigation interne vers une autre fiche ne doit pas
ressortir ces données-là.

Le coût réel est nul en octets et se paie en une requête de moins. Sur *Game of
Thrones*, la fiche la plus fournie du catalogue avec 64 éditions :

| | brut | compressé |
|---|---|---|
| page avec le bloc | 97 370 o | 11 390 o |
| la requête qu'il remplace | 107 890 o | 10 023 o |

**Mesuré une fois déployé, sur cette même fiche** :

    192 ms  HTML servi, données comprises
    388 ms  bundle exécuté, React monte avec ses 64 éditions déjà en main
    691 ms  relecture en arrière-plan

Le contenu est donc **complet au montage**, et ce qui suit ne fait que
rafraîchir. C'est la mesure à refaire si un jour la fiche paraît de nouveau
lente : ce qui compte n'est pas le total mais l'écart entre `388` et `691`,
c'est-à-dire ce que la page attend avant d'afficher quelque chose.

Les blocs mesurés en production, pour savoir à quoi s'attendre : 2 563 octets
sur une édition, 11 227 sur neuf, 72 510 sur soixante-quatre.

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

#### Le corps de l'accueil est retiré aux visiteurs connectés

`public/avant-montage.js`, chargé dans `index.html` **avant** le bundle et
après `#root`.

Le corps injecté est visible tant que le bundle ne s'est pas exécuté. Sur une
fiche film ça ne se remarque pas, il ressemble à ce que React va rendre. Sur
`/`, non : connecté, React rend le tableau de bord, donc une liste de films en
texte paraissait puis cédait la place à un écran sans rapport. C'est la « page
fantôme » signalée le 3 août 2026.

**Ce n'est toujours pas du cloaking** : on ne distingue pas un robot d'un
humain, on lit la session **du visiteur**, exactement ce que fait
`compteProbable()` pour choisir l'écran. Un crawler n'a jamais de session, il
reçoit le texte intact. Masquer le bloc en CSS, lui, l'aurait fait dévaluer par
Google, et le servir selon l'agent aurait été du cloaking pour de bon.

**Un fichier servi, pas un script en ligne.** La CSP autorise déjà
`script-src 'self'` ; un bloc en ligne aurait demandé un `sha256-` à recalculer
à chaque retouche, qu'une seule espace fait échouer en silence.

La clé de stockage y est écrite en toutes lettres alors que `auth-config.ts` la
compose : le fichier tourne avant tout module, il ne peut rien importer. Si les
deux divergent, on retombe sur le clignotement d'avant, rien ne casse.

Mesuré en simulant le corps injecté, session présente : `/` vidé,
`/catalogue` et `/movies/…` intacts ; sans session, `/` intact ; avec `?code=`
au retour de Google, vidé ; stockage inaccessible, intact.

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

### URL des fiches : `/movies/<slug>/<id>`

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

### Les nœuds `Product` sont rétablis, et Google les valide

**Le 3 août 2026, même journée que l'acceptation d'E.Leclerc.** Le programme
accepté, `public.offres` porte 724 offres réelles sur 658 films, donc `offers`
cesse d'être le champ qu'on ne peut pas remplir honnêtement.

**Un nœud par édition qui porte une offre, et par elle seule.** Les autres n'en
ont aucun, plutôt qu'un nœud incomplet qui laisserait une erreur permanente
dans la Search Console : c'est l'erreur du 31 juillet qu'on ne refait pas.

Mesuré par le test de résultats enrichis sur une fiche à trois offres, ce qui
est le renversement exact du 31 juillet :

    Extraits de produits   3 éléments valides    (« non valides » le 31 juillet)
    Fiches de marchand     3 éléments valides
    Fils d'Ariane          1 élément valide
    Films                  1 élément valide
    Extraits d'avis        1 élément valide

**Les deux seuls avertissements sont `review` et `aggregateRating`, marqués
facultatifs**, et ce sont précisément les deux qu'on refuse : on n'a pas d'avis,
et la note TMDB porte sur l'œuvre, l'accrocher à un disque serait faux. Ne pas
« corriger » ces avertissements, les combler serait mentir.

#### Les six champs réclamés par la Search Console, le 4 août 2026

Deux courriels, six champs facultatifs manquants, **aucun critique** : les
résultats enrichis s'affichent toujours. Le partage suit la règle du nœud
`Product`, un balisage qui ne peut pas être exact reste absent.

| champ | |
|---|---|
| `description` | **écrit** |
| `validFrom` (dans `offers`) | **écrit** |
| `hasMerchantReturnPolicy` (dans `offers`) | refusé |
| `shippingDetails` (dans `offers`) | refusé |
| `review` | refusé |
| `aggregateRating` | refusé |

`description` ne dit que ce qu'on sait du **disque**, son format, l'œuvre qu'il
porte, qui l'édite, son code-barres, et reprend le vocabulaire de la ligne
d'édition du corps injecté pour que les deux ne dérivent pas. Rien n'est écrit
en dessous de trois précisions : le format et le titre seuls paraphraseraient le
`name` au lieu de le compléter.

    Blu-ray 4K, Steelbook — édition de « 10 Cloverfield Lane (2016) »
      — éditeur Paramount Pictures — code-barres 37014320688

`validFrom` est la date du relevé. La borne haute était déjà là, il ne manquait
que la basse, et les deux sortent de `offres.releve_le`.

**`hasMerchantReturnPolicy` et `shippingDetails` décrivent le marchand, pas
nous.** Le site n'a ces conditions nulle part, ni dans le flux Awin ni ailleurs.
Les déclarer ferait annoncer au nom d'E.Leclerc des conditions qu'on ignore, sur
un balisage que Google prend au mot pour écrire « retours gratuits » dans ses
résultats, alors que le §10 pose que le site n'est ni marchand ni intermédiaire
de vente. **Ces quatre-là resteront donc listés en « non critiques », et c'est
l'état voulu** : mieux vaut un balisage exact et incomplet qu'un balisage complet
et faux. Ne pas rouvrir sans que la donnée existe vraiment.

Google prévient que certains facultatifs passeront critiques un jour. Si
`shippingDetails` en fait partie, la réponse ne sera pas de l'inventer mais de
retirer le nœud, comme le 31 juillet.

Piège de vérification rencontré au déploiement, et c'est celui du §7 : la
première mesure rendait `description` absente alors qu'un `grep` venait de
trouver `validFrom` sur la même page. Fenêtre de propagation, 3 requêtes sur 6
servaient encore l'ancienne version, puis 5, puis 6 sur 6. **Échantillonner
plusieurs fois avant de conclure qu'un déploiement est incomplet.**

**La validation n'a été lancée que sur les deux champs écrits**, le 4 août
2026, et l'état du rapport le montre :

    hasMerchantReturnPolicy   Non commencé
    shippingDetails           Non commencé
    validFrom                 Commencé
    description               Commencé

**Ne pas lancer la validation sur les quatre refusés**, et c'est le geste
contre-intuitif de cet écran : le bouton est là, il se clique, et Google
recrawlerait pour constater que le champ manque toujours. Le rapport garderait
alors un « validation échouée » permanent sur une décision assumée, c'est-à-dire
du bruit qui masquerait un jour une vraie régression. Un problème qu'on ne
corrige pas se laisse en « non commencé ».

Le rapport « Extraits de produits » n'a donc rien reçu du tout, ses deux
problèmes étant `review` et `aggregateRating`.

Ce qui suit est automatique : Google recrawle les pages concernées, deux par
problème, et le rapport passe en « Réussite » de lui-même en quelques jours. Le
« Dernière mise à jour » affiché reste antérieur au correctif, l'instantané
étant quotidien ; la validation force le recrawl et ne s'y fie pas. Un échec
signalerait une page servie pendant la fenêtre de propagation, et se relance.

Bonus non anticipé : les **fiches de marchand** valident aussi, ce qui est un
second type de résultat enrichi obtenu sans rien écrire de plus.

**`itemCondition` est écrit depuis le 6 août 2026, et il n'est pas décoratif.**
Un `Offer` sans lui est lu **comme du neuf par défaut** : servir un prix
d'occasion sans le dire ferait annoncer un disque neuf à 3,49 € dans les
résultats de Google, ce qui est la pratique commerciale trompeuse que le §10
s'emploie à éviter. C'est le raisonnement qui refuse `hasMerchantReturnPolicy`,
pris dans l'autre sens : ici la donnée existe, donc elle s'écrit.

    neuf                       -> schema.org/NewCondition
    tres_bon, bon, acceptable  -> schema.org/UsedCondition
    nul                        -> clé absente, on n'affirme rien

Le barème ne se traduit pas plus finement, schema.org n'ayant que quatre valeurs
dont `RefurbishedCondition` et `DamagedCondition`, qui disent autre chose. Le
détail reste à l'écran, lisible par un humain.

**C'est aussi la première fois qu'un nœud porte deux offres**, ce que le §7
annonçait depuis le 3 août sans pouvoir l'éprouver. Mesuré sous `wrangler` sur
*Ad Astra*, dont deux éditions portent les deux marchands :

    edition-51636   10.50 EUR E.Leclerc NewCondition | 8.49 EUR momox UsedCondition
    edition-51637   14.00 EUR E.Leclerc NewCondition | 12.69 EUR momox UsedCondition

Couverture des nœuds, mesurée sur les 724 : **zéro sans EAN**, zéro sans titre,
onze sans image. `gtin13` est donc sur tous, et c'est ce qui nous distingue, ni
TMDB ni SensCritique ne le publiant.

Trois choix qui ne se relisent pas dans le diff :

- **deux types, `Product` et `CreativeWork`.** Le second autorise
  `exampleOfWork` pour rattacher le disque à l'œuvre ; `isRelatedTo` n'accepte
  qu'un `Product` ou un `Service` et ne peut pas désigner un film. Vérifié au
  test, `exampleOfWork` résout bien vers le nœud `Movie` ;
- **`offers.url` est la fiche du site, jamais le lien d'affiliation.** Celui-ci
  est déclaré `rel="sponsored"` dans la page ; un balisage lu par une machine
  n'a pas à passer par une redirection de tracking ;
- **`priceValidUntil` vaut le relevé plus un jour**, la passe tournant
  quotidiennement (§6). Annoncer plus long serait une promesse qu'on ne tient
  pas, et Google traite une offre périmée comme une erreur. C'est aussi ce que
  la loi demande côté consommateur (§10).

Un prix nul est refusé à l'entrée : `offres.prix` est nullable et un `Offer`
sans `price` est invalide. **Mieux vaut aucun nœud qu'un nœud faux.**

**Le middleware lit Supabase à la requête, pas au build.** Un prix neuf est donc
servi sans redéployer, seul le cache de périphérie s'interpose. Ce qui demande
un déploiement, c'est une modification du code du middleware.

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

`pg_trgm` et `unaccent` sont installés dans `extensions`, et une fonction
`public.recherche_films_approchante(terme, limite)` est exposée en RPC.
Migration `20260801_recherche_approchante.sql`.

`sans_accents` a été **remplacée le lendemain par `public.mots_recherche`**
(cf. la section suivante) : les index GIN portent désormais sur elle.

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

**Le réalisateur est hors de ce repli**, alors qu'il entre dans la recherche
exacte. Aucun seuil ne sépare la faute de frappe du nom d'un tiers :

    tarentino  ->  Quentin Tarantino   0,571   vraie faute
    carlotta   ->  Carlos Saldanha     0,556   deux personnes différentes

Quinze millièmes, et du mauvais côté : « carlotta », qui désigne un éditeur,
ouvrait sur *Rio* et *L'Âge de glace*. Un nom propre est court et partage ses
trigrammes avec tous ses homographes, la mesure n'y discrimine rien.

### Classement par pertinence, en place le 1er août 2026

`public.recherche_films(terme, limite)`, migration
`20260801_recherche_classee.sql`. La recherche exacte passe du tri
alphabétique à un classement, et gagne le réalisateur.

**« Star » ouvrait sur *A Star for Two* et *Star Crystal*.** Le tri était
alphabétique, au motif qu'on cherche un titre connu, et le plafond de 50 lignes
tombait bien avant *Star Wars*. Trier par popularité seule ne vaut pas mieux :
un film très consulté qui ne porte le mot qu'au milieu de son titre passerait
devant celui qui commence par lui.

**Deux étages, la popularité ne départageant que les ex æquo** :

| rang | correspondance |
|---|---|
| 0 | titre entier |
| 1 | début du titre |
| 2 | titre original entier |
| 3 | **titre alternatif entier** (5 août 2026) |
| 4 | début d'un mot du titre |
| 5-6 | n'importe où dans le titre, puis dans le titre original |
| 7 | **n'importe où dans un titre alternatif** (5 août 2026) |
| 8 | réalisateur seul |

**Le classement vit en base, il ne peut pas vivre côté client** : la limite
s'applique **avant** le tri, donc reclasser 50 lignes tirées alphabétiquement
ne ferait pas revenir ce qui n'a jamais été chargé.

**`public.mots_recherche` normalise tout ce qui se cherche** : accents repliés,
et toute suite de caractères non alphanumériques ramenée à une espace. C'est ce
qui aligne d'un coup les deux-points de *Mission : Impossible*, l'apostrophe
typographique et les points de *S.O.S. Fantômes*, là où il fallait auparavant
interroger le slug en plus du titre. Effet de bord voulu : `%` et `_`
disparaissent de la saisie, aucune chaîne utilisateur ne pilote un `like`.

`gin_trgm_ops` sert les deux usages, `like '%…%'` autant que les opérateurs de
proximité : les trois index de `mots_recherche(titre)`,
`mots_recherche(titre_original)` et `mots_recherche(realisateur)` portent la
recherche exacte **et** son repli. « star » sort en 45 ms.

**Le réalisateur est au dernier rang, jamais devant un titre.** « Kubrick »
rend *Shining*, *2001*, *Eyes Wide Shut* ; un film qui porterait « kubrick »
dans son titre passerait avant.

#### Les titres étrangers, le 5 août 2026

*House* de Nobuhiko Obayashi ne répondait pas à « Hausu », son titre
d'exploitation hors du Japon, et *野のなななのか* du même auteur ne répondait à
**rien** : `mots_recherche` replie un titre japonais sur la chaîne vide, donc
aucune saisie ne pouvait le rendre. `titres_alternatifs` portait la réponse
depuis l'import TMDB du 30 juillet, en six langues, sans que rien ne la lise.

Migration `20260805_recherche_titres_alternatifs.sql`, mesurée avant d'écrire
sur les 12 129 films :

    10 848  portent au moins un titre alternatif exploitable
     7 414  gagnent un titre qu'aucune colonne cherchee ne contient  (61 %)
        56  n'avaient aucun titre latin, donc etaient introuvables

Les 56 sont les mêmes que les 56 slugs vides du §7 : `titre` **et**
`titre_original` en japonais, chinois, coréen ou hébreu.

**Les alternatifs entrent sous les colonnes propres du film**, jamais à leur
place, d'où les rangs 3 et 7 plutôt qu'un rang unique : « house » doit rendre
le film dont c'est le titre avant celui dont ce n'est qu'une traduction.
Vérifié, il le fait.

**Le séparateur est une barre verticale, et il fait le travail du reste.**
`mots_recherche` ne rend que `[a-z0-9 ]`, donc aucune saisie ne peut en
contenir : une correspondance ne peut jamais enjamber deux titres, et
`like '%|' || t || '|%'` teste l'égalité avec l'un d'eux. Le champ porte sa
barre aux deux bouts pour que le premier et le dernier titre se testent comme
les autres. Concaténer sur une espace aurait fait que « usu hou » trouve
« hausu house ».

`order by` et `distinct` dans l'agrégat ne sont pas décoratifs : sans l'ordre,
`string_agg` ne rend pas deux fois la même chaîne pour les mêmes données, et la
fonction n'aurait d'`immutable` que la déclaration, ce qu'une colonne générée ne
pardonne pas.

**Le repli approchant ne les prend pas, et c'est mesuré**, pas supposé :

    hausou   Lion                   0,571   « der lange weg nach hause »
             Les Filles de joie     0,571   « harlots haus der huren »
             Le Sous-sol de la peur 0,571   « das haus der vergessenen »
             House                  0,571   « hausu »

Quatre films au score **exactement identique**, départagés par la popularité, et
le bon arrive quatrième. Un champ qui porte jusqu'à six titres est six fois plus
de mots courts à faire correspondre, et `word_similarity` retient la meilleure
étendue de mots, donc l'égalité devient la règle. C'est mot pour mot ce que
cette section reproche déjà au réalisateur dans le repli. **Une faute de frappe
sur un titre étranger reste donc hors de portée**, manque assumé.

**Coût : « star » passe de 50 à 74 ms.** Ce ne sont pas les deux `like` ajoutés,
qui portent sur une colonne stockée : c'est que l'index rend 98 lignes de plus,
et que chacune traverse un `case` qui rappelle `mots_recherche` six fois. Le
`explain` confirme que `films_mots_alternatifs_trgm` entre bien dans le
`BitmapOr`, la sélection seule tenant en 4,9 ms. Le levier, le jour où ça gêne,
est ce calcul répété, pas une colonne cherchée en moins.

Aucune régression, vérifié sur « star », « kubrick », « mission impossible »,
« amelie », et sur le repli avec « Intrestellar » et « seigneur des aneaux ».

#### Éditeurs, formats et genres : des raccourcis, pas des résultats

`src/app/lib/suggestions.ts`. « Carlotta » ne pouvait rien rendre, l'éditeur
étant une colonne des **éditions** quand la recherche porte sur les **films**.
La réponse existait pourtant : `/publishers/carlotta-films`.

**Aucune requête.** `regroupements.ts` est généré au build et porte déjà les
75 entrées avec leur slug, donc la correspondance est une comparaison de
chaînes. Les puces apparaissent avant les résultats, qui sont temporisés.

**Au-dessus des films, jamais à leur place** : « Warner » nomme un éditeur *et*
apparaît dans des titres, et rien ne dit laquelle des deux intentions est la
bonne. `compte` sert à ordonner les puces, il n'est pas affiché : c'est un
instantané de génération, et la page de destination montre son propre décompte.

Trois caractères minimum, quatre puces au plus : en dessous « bl » remonterait
la moitié des formats, au-delà la rangée se lit comme une seconde liste de
résultats.

### Panneau d'aperçu sous le champ, le 3 août 2026

`ApercuRecherche.tsx`, monté par `ChampRecherche`. On tape, la liste se
remplit, on clique un titre sans jamais valider. Modèle SensCritique.

**Il est facultatif, et `/catalogue` ne l'a pas.** C'est la seule page dont la
grille est directement sous le champ et se rafraîchit à la frappe : un panneau
y montrerait les huit premières lignes de ce qu'elle affiche déjà, en masquant
les filtres. Il sert donc au bandeau et aux pages qui n'ont pas de grille sous
la main.

C'est le bandeau qui y gagne le plus : il n'emmenait nulle part avant Entrée,
donc chercher depuis une fiche film coûtait une navigation avant même de savoir
si le titre existait au catalogue.

**Le panneau ne fait aucune requête, il rend ce qu'on lui passe.** L'accueil
cherche déjà pour sa grille et lui donne ces résultats tronqués à huit ; le
bandeau, qui n'a pas de grille, apporte les siens (`useApercuFilms`). Une
requête propre au panneau aurait doublé chaque frappe sur l'accueil.

`useApercuFilms` n'écrit rien dans l'URL, à la différence de `useRechercheFilms` :
chercher depuis une fiche film remplacerait sinon l'adresse de la fiche pendant
la frappe.

**Trois pièges, tous les trois mesurés :**

- **le `mousedown` est neutralisé sur tout le panneau.** Sans ça le champ perd
  le focus au premier bouton de la souris, le panneau se démonte, et le `click`
  n'atteint jamais le lien visé. C'est aussi ce qui rend inutile tout écouteur
  de document pour fermer au clic extérieur : le `blur` du champ ne se
  déclenche plus que pour un vrai clic dehors ;
- **Chrome vide un `input type="search"` sur Échap.** Le panneau devait se
  fermer en gardant la saisie, il repartait à zéro. `preventDefault` sur la
  touche, le ✕ du champ restant pour ceux qui veulent effacer ;
- **la hauteur du panneau se mesure, elle ne se suppose pas.** Avec un plafond
  `min(60vh, 480px)`, le bouton « voir tous les résultats » tombait 60 px sous
  le bord de l'écran à 375 × 760. Le champ mesure la place réelle sous lui, au
  défilement et au redimensionnement, ce dernier parce que le clavier logiciel
  d'un téléphone change la hauteur de la fenêtre au moment précis où le panneau
  est là.

**Faire remonter le champ sous le bandeau a été essayé, et c'est impossible sur
ces pages.** Chaque frappe écrit dans l'URL, donc produit une `location.key`
neuve, et `GestionDefilement` remet la page en haut à chaque navigation qui
n'est pas un retour arrière : le `scrollBy` était défait dans la foulée, sans
rien signaler. Mesuré, le champ restait à 250 px du haut, exactement où il
était. Ce n'est pas gênant, la page étant ramenée en haut, le champ est
toujours à sa position naturelle et la mesure suffit.

**L'attente porte les couleurs du mot-symbole**, cyan, ambre, rouge, et non un
rouet générique qui aurait pu venir de n'importe quel site. Deux états, parce
qu'il y a deux situations et qu'une seule forme ne couvre pas les deux :

- **panneau vide, première recherche** : trois tranches qui montent et
  redescendent en décalé (`.reel-tranches`), dans l'ordre du logo. Le dessin
  dit la même chose que la marque, des boîtiers rangés sur une étagère. Le
  décalage de 140 ms sur un cycle de 900 est mesuré à l'œil : à 60 ms les trois
  montent ensemble et l'onde disparaît, à 300 la troisième repart quand la
  première est retombée et ça se lit comme trois animations séparées ;
- **liste déjà affichée, on affine** : un filet de 2 px en tête du panneau
  (`.reel-filet-charge`), même dégradé et mêmes clés que l'anneau de focus.
  Sans lui, affiner ne montrait **rien** : les tranches ne paraissent que tant
  que le panneau est vide, et la liste précédente restait à l'écran comme si
  elle était à jour. Le tour est à 1,4 s et non 7 s comme l'anneau, sinon le
  filet paraît immobile sur les quelques centaines de millisecondes d'une
  requête.

Le filet n'est **monté** que pendant la recherche, pas seulement masqué : une
bande animée en permanence sous une opacité nulle fait repeindre le panneau
pour rien, la raison même qui met l'animation de l'anneau sur le seul état
`focus-within`.

Sous `prefers-reduced-motion`, les deux restent à l'écran, colorés et
immobiles : c'est leur présence qui dit qu'on cherche, pas leur mouvement.
`role="status"` porte l'annonce, les barres sont `aria-hidden`, elles ne sont
que décoratives.

#### C'est le seul indicateur d'attente du site, depuis le 5 août 2026

Les tranches n'étaient posées que sur la recherche. Le rouet `Loader2` de lucide
subsistait à **sept endroits**, dont l'attente de fragment de page, la fiche
film et la modale de personne, et trois « Chargement… » étaient servis **sans
aucun indicateur**, `/account` et `/report` pendant la vérification de session.
Un disque qui tourne aurait pu venir de n'importe quel site, ce que ces tranches
s'emploient précisément à ne pas faire. Ne pas en réintroduire.

**`AttentePleine` est la forme à employer dès que le contenu n'est pas encore
là**, page, panneau ou modale : centrée, jamais dans le coin en haut à gauche.
Posé là, l'indicateur se lit comme une ligne de plus dans une page vide ; au
centre, il se lit comme la place que le contenu prendra. Mesuré en direct sur
neuf états d'attente réels, écart au centre 0/0 partout :

    /movies/…       bloc 1512x540   "60vh", l'ecran entier attend
    /u/…            bloc  877x540
    /formats/…      bloc  877x320   defaut
    /account        bloc  760x320 puis 760x180
    modale acteur   bloc      x200  la boite plafonne deja a 80vh

**Une exception, et elle est voulue** : quand la grille est *déjà remplie* et
qu'on affine, les tranches restent en haut à gauche. La grille reste affichée
sous elles, donc un indicateur centré tomberait au milieu des jaquettes, et la
faire disparaître à chaque frappe la ferait clignoter.

**La largeur d'une tranche suit sa hauteur, au quart**, la proportion du
mot-symbole, par `--reel-tranche-l`. À 4 px fixes, trois barres au centre d'un
écran de 1 512 se lisaient comme une poussière et non comme le logo : c'est le
rapport qui le fait reconnaître, pas la taille. Les 4 px restent le **défaut
CSS**, donc le panneau de recherche et le champ d'identifiant ne bougent pas,
mesurés 18 × 16 avant comme après ; le centre d'écran est à 36 × 32.

Les tranches étant `aria-hidden`, chaque bloc porte un libellé masqué en
`sr-only`, sans quoi son `role="status"` n'annoncerait rien du tout.

Clavier : flèches pour parcourir, Entrée pour ouvrir la ligne choisie, Entrée
sans sélection pour « voir tous les résultats », Échap pour fermer. La
sélection repasse par « rien » en bout de liste, sinon on ne peut plus revenir
au champ sans la souris. Motif `combobox` avec `aria-activedescendant`, et
`tabIndex={-1}` sur les lignes : la tabulation ne doit pas entrer dans la
liste.

#### La même chose sur téléphone, en feuille plein écran

`FeuilleRecherche.tsx`. Sous `lg` le champ du bandeau n'a pas la place et cède
à une loupe, qui **emmenait sur `/catalogue`** : une navigation, un chargement
de grille et un second geste pour atteindre le champ, là où le même geste sur
un écran large ouvre une liste sous le curseur sans quitter la page. La loupe
ouvre maintenant une feuille, champ en haut, liste dessous, et on revient où on
était en la refermant.

**Aucun composant de recherche n'est refait pour le téléphone** : c'est le
`ChampRecherche` du bandeau avec son panneau et son clavier. Une seconde liste
écrite pour le mobile aurait dérivé de celle du bureau au premier réglage,
exactement ce que le §7 reproche déjà au corps injecté par le middleware.

Seul le plafond du panneau change, `apercuPlafond`. 480 px sous un champ de
page, où une liste plus haute couvrirait ce qu'on est en train de lire ; la
feuille, elle, n'a rien derrière, et à 480 elle laissait les deux tiers de
l'écran vides sous une liste tronquée.

**Un effet de fermeture sur `location.key` tourne aussi au montage**, piège
classique et muet : la loupe ouvrait puis refermait dans la même frame, donc il
ne se passait visiblement rien. L'adresse d'ouverture est mémorisée dans un
`useRef` et la comparaison tranche.

Échap ne ferme la feuille que si aucune liste n'est ouverte dessous : le champ
prend la touche en premier pour son panneau, et une seule pression qui ferait
les deux retirerait la feuille alors qu'on voulait dégager la liste.

#### « Listes » a quitté le bandeau

La place revient au champ, qui passe de 420 à 560 px de plafond : chercher est
le geste courant, ouvrir ses listes ne l'est pas. Mesuré à 1 920 px de fenêtre,
le champ atteint bien 560 ; à 1 440 il plafonne à 396, la gouttière valant
alors 835 px pour tout le bandeau, logo et compte compris.

L'entrée n'est pas enterrée : « Mes listes » est dans le menu du compte, et la
barre du bas la porte sur téléphone.

### Pages de regroupement, en place le 31 juillet 2026

78 pages : `/formats`, `/publishers`, `/genres` et leurs 75 entrées.

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

**La table slug vers libellé est générée au build**, pas calculée au rendu :
`scripts/generer-regroupements.mjs` écrit `src/app/lib/regroupements.ts`. Trois
raisons : un slug d'URL doit être stable, la page d'index n'a alors aucune
requête à faire avant de s'afficher, et PostgREST ne sait pas rendre un
`distinct` sans vue dédiée.

**Elle était générée à la main puis commitée jusqu'au 2 août 2026**, sa
péremption étant assumée et visible. Cette position ne tenait plus une fois la
collecte automatisée : le « quelqu'un relance le script » n'existe plus, et un
éditeur entrant au catalogue serait resté sans page indéfiniment. Le script est
donc entré dans `npm run build`, et le fichier commité ne sert plus qu'à faire
passer `tsc` sur un dépôt fraîchement cloné.

**L'ordre dans le build n'est pas décoratif** : le script passe **avant**
`vite build` et non après. `regroupements.ts` est importé par le bundle et par
le middleware ; le régénérer ensuite laisserait partir la table périmée tout en
donnant l'illusion du contraire. Le sitemap vient en dernier, il lit ce fichier
en texte.

    "build": "tsc --noEmit && node scripts/generer-regroupements.mjs
              && vite build && node scripts/generer-sitemap.mjs"

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

**Les libellés d'éditeur ont été normalisés le 3 août 2026**, et c'est une
correction de cette section : une page est générée par libellé distinct, donc
Warner était éclaté en trois pages de 492, 474 et 16 éditions au lieu d'une de
982, Studiocanal en deux à une majuscule près, Paramount en quatre. Du contenu
mince fabriqué par une variation d'écriture, exactement ce que cette section
s'emploie à éviter ailleurs.

478 libellés pour 70 familles, 2 794 éditions normalisées par
`normaliser_editeurs.py`, et **les pages d'éditeur tombent de 208 à 142**.

**La table est explicite, jamais une racine calculée.** Le rapprochement par
racine a servi à trouver les familles, pas à décider : il fusionnait
`TF1 Vidéo` et `TF1 Studio`, deux entités distinctes du même groupe, sans que
rien ne le signale.

**Les pages numérotées sont triées par `id` croissant, et rien d'autre**,
depuis le 1er août 2026. Le tri d'origine remontait les éditions illustrées,
`image_url.asc.nullslast`, parce que sans lui `/formats/steelbook` s'ouvrait sur
soixante lignes de texte nu ; les genres, eux, sortaient par popularité TMDB.

**Ces deux tris rendaient le contenu d'une page numérotée instable**, et ça s'est
payé en référencement. Google servait `/formats/steelbook/21` à qui cherchait
`5051889752028`, le code-barres du steelbook 4K d'*Eyes Wide Shut* : la page
avait été explorée quand l'édition s'y trouvait, et l'édition était passée en
**page 27** entre-temps, rang 1 590 sur 2 204, après 2 400 entrées en trois
jours. La popularité, recalculée chaque semaine, décalait les genres de la même
façon sans qu'aucun import n'ait lieu.

`id` croissant est le seul ordre qui ne décale rien : les nouvelles lignes
s'ajoutent à la fin, les pages déjà explorées gardent leur contenu. Le prix est
assumé, les premières pages de format ne sont plus les mieux illustrées.

**Les collections d'éditeur gardent leur numéro de tranche**, `numero_collection`
puis date : c'est un rang imprimé sur le boîtier, il ne bouge pas, et ces listes
tiennent presque toujours en une page.

**`lib/listes.ts` et le middleware doivent trier exactement pareil.** Une même
URL servie à la périphérie et rendue par l'application montrerait sinon deux
contenus différents, ce qu'aucun contrôle ne signalerait.

**Le format de la page passe devant les autres badges, depuis le 6 août 2026.**
La carte n'en montre que deux, faute de place à six colonnes, et les formats
sortaient dans l'ordre de la source : `/formats/dvd` ouvrait sur « Répulsion —
Blu-ray · Coffret », son DVD tombant en troisième, et la page ne montrait
**jamais** le format qu'elle liste. La sélection était juste, l'affichage la
faisait passer pour un défaut de filtre.

Le tri est local à `GrilleEditions` et ne vaut que sur l'axe `formats` : rien à
changer au plafond de deux badges, qui est un choix de mise en page.

**Une page de regroupement doit dire d'où vient ce qu'elle groupe.**
`/formats` annonçait un format « relevé sur la fiche de l'édition, jamais déduit
du titre », ce que l'étiquetage du 6 août a rendu faux, lui qui déduit du titre
dès que la source se tait. La phrase dit maintenant les deux cas. Le §10 vaut
pour les pages d'index comme pour les mentions légales : une promesse qui ne
correspond plus au code est pire que pas de promesse.

#### Pagination, en place le 31 juillet 2026

`/formats/blu-ray` couvre ses **93 pages**, `/genres/horreur` ses 10. Le sitemap
passe de 4 661 à **5 072 URL**, dont 411 pages suivantes, puis 5 446 après les
trois imports du 1er août 2026.

**Un quatrième axe `/collections` a été écarté le 1er août 2026**, alors même
que `collection_editeur` venait d'être remplie. Il n'aurait porté qu'une seule
entrée, or chaque page de regroupement doit lister les autres entrées de son
axe pour n'être pas une impasse, et le sommaire aurait tenu en un lien.
`editeur` faisait déjà le travail : remplir la colonne a suffi à créer
`/publishers/le-chat-qui-fume` et `/publishers/intersections` au build suivant,
sans une ligne de front. **Rouvrir le jour où une deuxième collection numérotée
entre au catalogue**, Criterion ou Make My Day!.

**La condition est remplie depuis le 4 août 2026.** Coin de Mire écrit trois
collections dans `collection_editeur`, `Collection Prestige`, `Collection
Sélection`, `Collection Premium` ; avec Make My Day!, son hors-série et The
Criterion Collection, l'axe porterait **six entrées**, assez pour que chaque
page en liste d'autres et ne soit pas une impasse. **À ouvrir.**

Le seuil de dix entrées posé plus haut pour les autres axes ne s'applique pas
ici : il visait le **contenu mince**, une page d'un axe qui n'aurait porté que
quelques éditions. Une collection d'éditeur en porte des dizaines et dit ce
qu'aucun autre axe ne dit, qu'un disque appartient à une série éditoriale
suivie.

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

#### `/ean/<code>`, le code-barres mène à la fiche, le 1er août 2026

Treize chiffres tapés dans Google cherchent **un disque**, et la bonne réponse
est la fiche du film qui le porte. Servie par le middleware, la route répond en
**301** vers `/movies/<slug>/<id>`, ou un vrai 404 si aucune édition ne porte le
code.

    /ean/5051889752028  ->  /movies/eyes-wide-shut-1999/477
    /ean/0000000000000  ->  404
    /ean/abc            ->  404

Elle ne s'indexe pas et n'a pas à l'être : elle redirige, donc c'est la fiche qui
reçoit le classement. Le code est validé avant d'atteindre PostgREST, treize
chiffres et rien d'autre, et un code inconnu rend un 404 franc plutôt qu'un
détour par l'accueil, qui ferait un « soft 404 » de plus.

Elle sert aussi de cible au **scan de code-barres** du §8 : une fois la caméra
branchée, il n'y aura rien d'autre à construire côté adresse.

Les requêtes qui l'ont motivée sont réelles, relevées en Search Console le
1er août 2026 : `5051889753537` et `5051889752028`, trois et deux impressions.
C'est peu, mais c'est exactement le créneau que ni TMDB ni SensCritique ne
couvrent.

Limite restante : le sitemap enferme les effectifs au moment du build, donc une
page suivante peut disparaître entre deux déploiements et rendre 404 le temps
qu'il soit régénéré.

### Profils publics : `/u/<identifiant>`, le 3 août 2026

L'adresse partageable d'un compte, et **la seule adresse du profil**.

`/profile` a d'abord été une page à part, montrant vos listes sous jeton. Elle
n'en est plus une : c'est une **forme courte qui redirige**, exactement comme
`/movies/560` redirige vers la forme à slug. Ce que vous regardez chez vous est
littéralement la page que vous partagez, au même endroit. Deux adresses pour la
même étagère, c'étaient deux doublons et deux occasions de diverger.

La redirection garde la chaîne de recherche, qui porte `?liste=envies` : c'est
par elle que `/wishlist` et `/mes-envies` ouvrent le bon onglet. Vérifié en
local, sept formes, toutes arrivent sur `/u/rayan` :

    /profile /profile?liste=envies /wishlist /mes-envies
    /ma-collection /@rayan /u/Rayan

**Le propriétaire ne lit pas sa page par le chemin public.** La question posée
est « est-ce le mien ? », et elle décide de la source : `collections` sous jeton
si oui, `profil_public` en clé anon sinon. C'est ce qui fait qu'un profil
**masqué reste consultable par son propriétaire** à la même adresse, alors que
les fonctions publiques répondent `null` pour tout le monde. Sans ça, masquer sa
page reviendrait à se la fermer à soi-même.

Ce qui reste dans `/profile` et n'a pas d'autre endroit où vivre : l'invitation
d'un visiteur sans compte, qui n'a pas d'identifiant donc pas d'adresse de
profil, et un écran de panne si le profil ne se lit pas, qui propose de
retenter plutôt que de laisser une attente sans fin.

Servie par le middleware comme les fiches :
`<head>` complet, corps injecté, vrai 404 sur un identifiant inconnu ou masqué.
Le gestionnaire passe **avant** `axeDeChemin`, `u` n'étant pas un axe.

**Le `<head>` est la raison d'être du gestionnaire**, plus encore que sur une
fiche film : ni Discord, ni iMessage, ni WhatsApp n'exécutent le JavaScript, et
un profil partagé s'annonçait « jaquette.app, le catalogue des éditions
Blu-ray », donc ne disait pas de qui il s'agit.

**Indexables depuis le 3 août 2026, après avoir été en `noindex` la journée
même.** Le motif du `noindex` était le contenu mince, l'argument qui a fait
écarter les pages éditions : une grille d'affiches déjà servies par les fiches
films. Il regardait la mauvaise chose. Un profil porte ce qu'aucune fiche ne
dit, **ce que telle personne possède**, et c'est la seule page du site dans ce
cas.

**Le garde-fou n'a pas disparu, il a changé de place** : seuls les profils
visibles **et non vides** entrent au sitemap, par `profils_au_sitemap`, comme
seuls les films rattachés à une édition y entrent. Un profil vide reste servi
et indexable si un lien y mène, on ne le déclare simplement pas soi-même. Le
sitemap avale l'échec de cette lecture au lieu de casser le build, à l'inverse
des films : un sitemap sans fiches désindexerait le site, un sitemap sans
profils coûte la découverte de quelques pages.

**JSON-LD `ProfilePage` du même jour**, écarté jusque-là au motif qu'on ne
décrit pas une personne réelle sur une page qu'on demande de ne pas indexer,
objection tombée avec le `noindex`. Le nœud reste maigre à dessein : le nom
saisi par l'intéressé, son « @ » en `alternateName`, l'adresse, et le nombre
d'éditions possédées en `InteractionCounter`. Ni date de naissance, ni
employeur, ni compte sur un autre réseau, `Person` les invitant tous.

**Ce que l'indexation change à la promesse** : la page n'est plus seulement
atteignable par qui a le lien, elle est **trouvable** en cherchant le nom
affiché ou l'identifiant. Politique de confidentialité, sommaire servi par le
middleware, FAQ, écran de création et réglages du compte le disent tous, mis à
jour dans le même commit.

**Pas de liste d'éditions dans le corps injecté**, contrairement aux fiches :
elle coûterait un second aller-retour Supabase pour un texte que personne ne
lira, la page étant en `noindex` et les aperçus s'arrêtant au `<head>`.

**`og:image` reste le visuel du site.** Composer une mosaïque par profil
supposerait un rendu à la demande dans un Worker, écarté au §8 pour les fiches
films et pour les mêmes raisons.

Deux redirections, mesurées sous `wrangler` le 3 août 2026, un saut chacune :

    /@Rayan.Adam   ->  301  /u/rayan_adam
    /u/ZZ_Inconnu  ->  301  /u/zz_inconnu

`/@<identifiant>` est la forme qu'on écrit à la main ; la canonique reste
`/u/<identifiant>`, un arobase dans un chemin se faisant percent-encoder par
une partie des clients. La règle vaut aussi côté application, `App.tsx` portant
la même redirection pour le serveur de développement, où le middleware ne
tourne pas.

**`decodeURIComponent` lève sur une séquence tronquée**, `/u/%zz`, et l'appel
se fait hors de tout `try` : sans le repli `decoder()`, une adresse malformée
dans une barre de navigation rendait 500 sur un chemin de consultation. Elle
rend maintenant 301 puis 404.

**L'identifiant n'a pas d'id derrière lui**, contrairement à une fiche film où
le slug est décoratif. Il a désormais une **table d'anciens noms**, ce qui
revient au même pour qui suit un lien.

#### Un lien partagé survit au renommage, le 6 août 2026

`identifiants_precedents`, migration `20260806_identifiants_precedents.sql`.
Clé primaire l'identifiant, `user_id` en cascade sur `auth.users`, `libere_le`.
Un déclencheur `after insert or update` sur `profils` consigne l'ancien nom et
retire celui qu'on reprend. `/u/<ancien>` répond **301** vers `/u/<courant>`,
dans le middleware comme dans `ProfilPublicPage`.

**Ce que la version précédente disait était l'inverse**, et c'était le mauvais
arbitrage : « les liens partagés cessent de fonctionner et l'ancien identifiant
redevient libre ». Une adresse de profil est faite pour être **donnée**, elle
part dans un message ou une signature, et celui qui la reçoit n'a aucun moyen
de savoir qu'elle a changé. Un 404 parce que quelqu'un a corrigé une faute de
frappe dans son pseudonyme est une panne, pas une conséquence.

**La contrepartie est réelle et non négociable : un identifiant porté n'est
plus jamais rendu à la circulation.** Les deux règles ne peuvent pas coexister,
et le sens est clair : si un tiers reprend `@rayan`, un lien partagé mène à
**la collection de quelqu'un d'autre**, ce qui est bien pire qu'un 404.
`etat_identifiant` rend donc `pris` pour l'ancien identifiant d'un autre
compte, et `libre` pour les siens propres, revenir en arrière étant le cas
normal. Ça se déjuge sans migration, un `delete` sur la table rend tout.

**Le déclencheur est `security definer`, et c'est le point à ne pas rater** :
il écrit dans une table en `revoke all`, donc en `security invoker` il
s'exécuterait sous le rôle qui met à jour son profil et buterait sur ce refus.
C'est le piège du §3 pris dans l'autre sens, là où on avait cru à tort qu'un
déclencheur tournait sous le propriétaire.

**`identifiant_courant` ne rend rien pour un profil devenu masqué**, alors même
que la ligne existe : une redirection qui ne partirait que dans ce cas serait
l'oracle que `profil_public` s'emploie à ne pas être. Un seul saut résout
`a → b → c`, toutes les lignes d'un compte pointant le même `user_id`.

**Elle n'est appelée qu'après un `profil_public` à `null`**, jamais avant : le
renommage est le cas rare, et l'ajouter au chemin normal coûterait un
aller-retour à chaque profil ouvert.

**Rien n'est rattrapable en arrière** : aucun ancien identifiant n'était
conservé avant cette date, donc les liens cassés par un renommage antérieur le
restent. Ne pas chercher la passe de rattrapage, elle n'existe pas.

Mesuré à l'application, huit contrôles sur huit, par un renommage réel du
profil puis retour immédiat, et les barrières exercées à la clé anon :

    GET  identifiants_precedents        401  42501 permission denied
    POST identifiants_precedents        401  42501 permission denied
    rpc/identifiant_courant <ancien>    200  "rayan"
    rpc/identifiant_courant <inconnu>   200  null
    rpc/etat_identifiant                401  permission denied for function

`ProfilPublicPage` **n'est pas en `lazy()`** : c'est une porte d'entrée depuis
l'extérieur, donc un chemin de consultation, et le §9 interdit qu'un tel chemin
dépende d'un `import()`. Un lien partagé s'ouvre une fois, sans seconde chance.

### Adresses en anglais, le 1er août 2026

    /films/<slug>/<id>   ->  /movies/<slug>/<id>
    /editeurs            ->  /publishers
    /bienvenue           ->  /welcome
    /a-propos            ->  /about
    /mentions-legales    ->  /legal
    /confidentialite     ->  /privacy
    /profil              ->  /profile
    /compte              ->  /account

`/formats` et `/genres` ne bougent pas, les mots sont les mêmes dans les deux
langues. **Choix de forme, pas de référencement** : le mot-clé dans l'URL est un
facteur de classement quasi nul, et ce qui compte, la structure et le maillage,
ne change pas.

`src/app/lib/chemins.ts` porte la table, **sans aucune dépendance**, pour que le
middleware serve les 301 et que l'application route les anciennes adresses
depuis la même source. Une seconde table produirait des redirections vers des
pages inexistantes.

**Le 301 passe avant tout le reste dans le middleware.** `/films/…` et
`/editeurs/…` ne doivent jamais atteindre les gestionnaires, qui ne connaissent
plus que les formes neuves : ils tomberaient sur la réécriture SPA, donc un 200
sur une page que React redirigerait ensuite côté client, et Google verrait deux
adresses pour le même contenu au lieu d'une redirection franche.

**Un seul saut pour ce qui était indexé.** `/films/<slug>/<id>` va directement à
`/movies/<slug>/<id>`. Seule la forme nue `/films/560` en fait deux, et elle n'a
jamais figuré au sitemap.

**La clé d'axe suit sa base.** `axeDeChemin` fait correspondre le premier segment
de l'URL à la clé de `AXES`, donc renommer `/editeurs` en `/publishers` imposait
de renommer la clé aussi, sous peine que la page ne résolve plus. Les libellés
restent en français : c'est l'URL qui change, pas la langue du site.

Coût assumé : Google avait découvert les 4 581 fiches le matin même, il doit
suivre les 301 et réattribuer. Deux à quatre semaines de plus.

### `/about`, en questions fréquentes, le 1er août 2026

Structure reprise de la FAQ de Letterboxd : sommaire, sections à ancre, une
question par bloc. **Leur page en compte cent quinze, celle-ci vingt-neuf**, et
c'est délibéré : un site d'un mois qui écrirait cent questions les inventerait,
et cent réponses creuses sont exactement le contenu mince écarté des pages
éditions.

**Le sommaire est une colonne collante à gauche**, verrouillée à 104 px sous le
bandeau, avec la section courante en surbrillance. Sur une page de vingt-neuf
questions, arriver par une ancre est le cas normal, pas l'exception : un
sommaire posé en tête ne sert qu'au premier écran. En dessous de `lg` il repasse
en ligne au-dessus du texte, une colonne de 240 px prise sur 375 ne laisserait
rien au contenu.

**Les trente-cinq ancres sont en anglais**, comme les chemins : une ancre fait
partie de l'adresse, `/about#delete-my-account` se copie et se partage comme
`/movies/…`. Les libellés restent en français.

Le contenu vit dans `src/app/lib/faq.ts`, **sans aucune dépendance**, et le
middleware l'importe pour écrire le corps servi. C'est le piège du corps injecté
qui dérive du composant, fermé pour de bon : ici il n'y a qu'une source. La
fiche film, elle, reste exposée, ses deux versions étant écrites séparément.

Les questions portent un `h3` sous un `h2` de section, là où Letterboxd met un
`h1` par question. Un seul `h1` par page.

**Pas de balisage `FAQPage`** : Google a restreint ce résultat enrichi aux sites
gouvernementaux et de santé en août 2023, le déclarer ne produirait rien.

Deux défauts corrigés au passage, tous deux invisibles au diff :

- **le bandeau est en `fixed`, donc il ne réserve aucune place dans le flux.**
  Avec `pt-6`, le lien de retour de toutes les pages statiques disparaissait
  derrière lui et le titre était rogné. Corrigé dans `PageStatique`, donc pour
  `/legal` et `/privacy` aussi ;
- **les ancres ne défilaient pas.** Le navigateur lit le fragment avant que
  React ait rendu la cible, et `GestionDefilement` remet en haut à chaque
  navigation. `src/app/lib/ancre.ts` réessaie en `requestAnimationFrame` jusqu'à
  une seconde. `BienvenuePage` porte encore sa propre copie, à y remonter.

#### Toutes les pages fixes sont servies en texte depuis le 1er août 2026

Le middleware ne traitait que les fiches et les regroupements. Partout ailleurs
un client sans JavaScript recevait `<div id="root"></div>` et rien d'autre :
**0 signe** dans le corps de `/`, `/welcome`, `/legal` et `/privacy`, contre
1 916 sur une fiche film, et le titre générique du catalogue à la place du leur.
Une mention légale partagée en lien s'annonçait « le catalogue des éditions
Blu-ray et 4K françaises ».

| | corps servi | ce qu'il porte |
|---|---|---|
| `/` | 1 248 | les 24 films les plus consultés, en liens, et les trois sommaires |
| `/about` | 7 735 | les questions, depuis `lib/faq.ts` |
| `/welcome` | 1 368 | les six étapes, ancres comprises |
| `/legal` | 988 | sommaire des sections |
| `/privacy` | 847 | sommaire des sections |

**L'accueil est le seul à interroger la base**, pour ses films et son effectif :
c'est aussi ce qui manquait au crawl, il n'existait aucun chemin de la racine
vers une fiche sans exécuter le JavaScript. Les autres n'ont aucune requête, ce
qu'elles disent ne dépendant pas de la base, et une page d'entrée qui tombe au
premier hoquet de Supabase serait un mauvais échange.

**Le corps de `/legal` et `/privacy` est un sommaire, jamais le texte complet.**
Le texte juridique vit en JSX dans les composants ; le recopier dans le
middleware ferait deux versions qui dérivent en silence, exactement le piège
déjà consigné pour la fiche film. Un sommaire suffit à un aperçu de lien et à un
moteur, et n'a pas à remplacer ce que le visiteur lira.

`/profile` et `/account` restent à 0 signe, et c'est voulu : pages personnelles
en `noindex`.

#### Le panneau d'aperçu ne peut pas éprouver ce qui dépend du défilement

Trois fausses pistes sur la seule surbrillance du sommaire, toutes dues à
l'outil et non à la page. À connaître avant de conclure qu'un comportement au
défilement est cassé :

| ce qu'il ne fait pas | conséquence |
|---|---|
| aucun rappel d'`IntersectionObserver`, même trivial | tout suivi bâti dessus paraît mort |
| `requestAnimationFrame` suspendu, l'onglet étant masqué | tout étranglement en `rAF` gèle après le montage |
| `innerWidth` et `innerHeight` parfois à **0** | mise en page repliée en une colonne, sections de 12 000 px, mesures dénuées de sens |
| `scrollTo` n'émet aucun événement `scroll` | les écouteurs ne se déclenchent jamais |
| **`resize_window` n'émet aucun événement `resize`** | tout ce qui se recalcule au redimensionnement garde sa valeur d'avant |

Ce qui marche : **redimensionner l'onglet explicitement**, puis émettre
`dispatchEvent(new Event("scroll"))` à la main après chaque `scrollTo`. Et
vérifier `innerWidth` avant de croire une mesure, un viewport à zéro invalide
tout ce qui suit.

**La ligne `resize` a été payée le 7 août 2026**, sur le bandeau promo : la
mesure disait que le bandeau flottait à 63 px de la barre d'onglets, et j'ai
soupçonné le code. Un `dispatchEvent(new Event("resize"))` émis à la main rendait
aussitôt le bon `bottom: 64px`. **C'était l'instrument, pas la page**, et c'est
le §9 mot pour mot appliqué à une sonde de mise en page. Recharger après avoir
redimensionné, ou émettre l'événement, mais ne jamais conclure d'un
redimensionnement seul.

Les captures d'écran sont par ailleurs aléatoires après un défilement programmé,
elles rendent souvent un écran vide alors que le DOM est correct. Naviguer
directement sur l'ancre voulue donne une capture fiable.

**Ce que l'épisode a changé dans le code** : la surbrillance suit désormais une
règle lisible, « la dernière section dont le titre est passé sous le bandeau »,
sur un écouteur de défilement sans étranglement. Six `getBoundingClientRect` par
événement ne coûtent rien, et React ne re-rend pas quand la valeur ne change
pas. **Une fonction qu'on ne peut pas éprouver est un passif**, même quand elle
marche.

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

### Le trou de source, et pourquoi il ne se comble pas tout seul

**Les cinq passes sont automatisées depuis le 2 août 2026** (§6). Ce qui reste
n'est plus un problème d'ordonnancement mais de **couverture** : des œuvres
qu'aucune source ne porte.

    Moonlight (2016)              0 édition
    Portrait de la jeune fille    0 édition
    Les Yeux sans visage          œuvre en base, 0 édition

Le catalogue est piloté par les éditions : une œuvre n'existe que si un disque
la porte, et 134 fiches sans édition ont été supprimées le 31 juillet 2026
pour cette raison. Un ajout à la main serait donc défait à la passe suivante.

**Aucune des cinq sources ne couvre le marché français généraliste.**
blu-ray.com filtré France ne rend que 6 207 fiches, editioncollector est un
catalogue de collectionneurs, Metaluna dix éditeurs de niche, Le Chat qui fume
un label, Zavvi le marché britannique. Diaphana, Pyramide, Le Pacte,
Metropolitan n'y sont nulle part.

**Piège de lecture à connaître** : Le Chat qui fume « a » bien *Les Yeux sans
visage*, mais c'est `NITRATE #10`, un numéro de leur revue, rangé à juste
titre dans les dérivés par `tri_chat.py`, `formats: []`. Vérifier que le
produit trouvé est un disque avant de conclure à un défaut de rattachement.

Les issues possibles, dans l'ordre :

1. **Les flux produits Awin. Débloqué le 3 août 2026**, E.Leclerc accepté, flux
   Culturel mesuré (§5). Fnac, Cultura et Zavvi restent en attente.

   **Et le trou n'est pas comblé pour autant.** Le flux donne l'EAN, le prix,
   l'image et le lien à 100 %, mais **pas le format sur 92,8 % des lignes**, et
   ni année ni réalisateur. Sur les 19 absents nommés plus bas, il en apporte
   4. Leclerc vend son stock du jour, pas un fonds : c'est une source de
   **prix**, pas une source de **catalogue**.

   Les 6 393 EAN qu'il porte et que nous n'avons pas ne sont pas importés,
   et ne le seront pas tant que le format ne sera pas qualifié.
2. **dvdfr par code-barres, et c'est un retournement.** Le §8 le rangeait comme
   inutile à l'élargissement, ce qui reste vrai isolément. Mais il donne
   exactement ce que Leclerc tait, format, zone et date française, sur un EAN
   qu'on lui fournit. Leclerc élargit, dvdfr qualifie : la combinaison vaut
   mieux que chacun des deux.
3. **Le listing dvdfr**, écarté au §5 et toujours à raison : les facettes qui
   permettraient de n'énumérer que le Blu-ray sont en `Disallow`.
4. Rien d'autre n'a été mesuré.

**Ne pas attendre de dvdfr qu'il comble ce trou.** `dvdfr.yml` interroge
**code-barres par code-barres**, à partir des EAN déjà en base : il apporte le
distributeur, la date de parution française, la zone et le format cinéma, mais
**aucune édition nouvelle**, une fiche n'en listant pas d'autres. Il enrichit
l'existant, il ne l'élargit pas, et son workflow dépose deux artefacts que
rien n'écrit encore en base.

### Décisions en attente sur les orphelines

**1 955 éditions sans film au 3 août 2026**, sur 20 698, soit 90,6 % de
rattachement. Le taux monte, il était à 87,9 % le matin même : la relecture
Metaluna a posé 315 liens et créé 57 films.

| source | orphelines | total | |
|---|---|---|---|
| metalunastore.fr | 1 282 | 6 830 | 18 % |
| blu-ray.com | 494 | 6 017 | 8 % |
| editioncollector.fr | 164 | 3 193 | 5 % |
| lechatquifume.com | 15 | 212 | 7 % |
| **zavvi.com** | **0** | 4 446 | 0 % |

**Zavvi à zéro n'est pas une prouesse, c'est `--rattachees-seules`** : les
7 049 orphelines qu'il aurait créées ont été refusées à l'entrée (§6).

**Les 1 282 orphelines Metaluna ont été relues et ne le seront plus.** La
passe du 3 août 2026 a essayé les 1 557 et n'en a rattaché que 315 : le
blocage n'est pas la mesure mais le **candidat**, TMDB ne rendant rien sur 52
titres sur 60. Deux familles, toutes deux hors de portée d'une recherche :

- **les œuvres que TMDB ne référence pas**, tout le bis espagnol d'Eloy de la
  Iglesia chez Artus, `Le Prêtre`, `La Créature`, `Le Buraliste de Vallecas` ;
- **les doubles programmes et coffrets d'auteur**, `Croisières sidérales +
  Konga`, `France, société anonyme + Hitler, connais pas`, `Coffret Jacques
  Rozier`, que le §9 interdit de forcer.

Deux leviers restent, tous deux petits : les **abréviations de boutique**,
`Mme Wardh` là où TMDB écrit `Madame`, et les **huit collections sautées**
faute de fichier de tri, `agfa`, `cauldron-films`, `chameleon-films`,
`massacre-video`, `raro-video`, `scorpion-releasing`, `synapse-films`,
`third-window`, jamais relues.

**Le second levier n'existe pas : ces huit-là sont faites**, relevé le 4 août
2026, toutes ont leur fichier de tri et leurs résolutions, 102 fiches en tout.
Et la réénumération des 65 collections le même jour rend **+0 fiche neuve**
(§5). **Le filon Metaluna est épuisé, mesuré et non supposé** : ne pas relancer
une vague de ce type en espérant autre chose.

**Une troisième mesure l'a confirmé le soir même, et elle visait autre chose.**
Le correctif de `chercher()` décrit au §9, qui rendait à Metaluna les titres
anglais qu'il jetait, faisait espérer une reprise des catalogues anglophones,
Arrow à 23 %, second-sight à 33 %, eureka à 38 %. Rejouée sur les 1 224
orphelines : **3 éditions rattachées, 4 liens.** L'hypothèse est morte.

Ce qui reste est donc bien ce que dit cette section, des œuvres que TMDB ne
référence pas : le bis espagnol d'Eloy de la Iglesia chez Artus, `Le Prêtre`,
`La Créature`, `Le Buraliste de Vallecas`, et les doubles programmes
Studiocanal, `Croisières sidérales + Konga`. **Filon mort, mesuré deux fois par
deux voies différentes.**

**7 films seulement n'ont aucune édition**, contre 134 supprimés le 31 juillet.
Le catalogue est piloté par les éditions, et il l'est bien.

**Rien n'est en transit.** `bluray_import` ne porte plus que 6 017 promues et
184 doublons : ni `charge`, ni `a_verifier`, ni `a_creer`.

**Ce qui reste à relire, et qui n'est pas une panne** :

    bluray_page_partiel          1 710   coffrets rattachés en partie
    probable                       171   écrits sans relecture, juillet
    metaluna_relecture_partiel      48

Chaque lien partiel est **exact**, c'est la liste du coffret qui est
incomplète. Les 171 `probable` ont passé le contrôle du bandeau blu-ray.com le
1er août ; le label garde la trace de leur origine, pas un doute actuel.

État de la campagne de juillet, pour mémoire :

### Ce que veulent les gens qui cataloguent leur collection, relevé le 2 août 2026

Relevé pour arbitrer la feuille de route, pas pour la remplir. Rangé par
fréquence dans les sources, et non par facilité.

**La méthode d'abord, parce qu'elle borne la confiance.** Reddit est
inaccessible à l'assistant, leur `robots.txt` refusant nommément le crawler
d'Anthropic ; AVS Forum et Home Theater Forum servent un **402 Payment
Required** aux robots ; blu-ray.com et dvdfr bloquent déjà les agents Claude
(§5). Ce qui a été lu est donc : les avis App Store **américains et français**
de My Movies, CLZ Movies, iCollect et DVD Profiler, en texte intégral par le
flux `itunes.apple.com/…/rss/customerreviews`, un fil du forum Blu-ray en
français, un fil AVForums sur les steelbooks, une revue détaillée de Movie
Collector, et les pages de fonctionnalités des concurrents.

**Biais assumé : un avis de boutique est écrit par quelqu'un en colère.** Le
mur payant y est sur-représenté, l'usage tranquille absent. C'est pourquoi le
classement ci-dessous ne suit pas le volume brut.

#### Le grief dominant n'est pas une fonction, c'est le modèle

Motif identique chez les quatre applications : mur payant à 20 ou 50 titres,
découvert **en plein scan** et jamais annoncé ; licence « à vie » invalidée au
passage d'une version majeure, My Movies 5 vers 6 ; un abonnement par type de
média chez CLZ, donc trois pour qui collectionne films, livres et musique.

    « l'application est payante au bout du 50ème DVD enregistré »
    « la version précédente que j'ai achetée est maintenant bloquée »
    « payer chaque année devient lassant »

La gratuité de consultation, déjà acquise, est donc un argument de
positionnement plus fort que n'importe quelle fonction à écrire.

#### Perte de données, sauvegarde et export

Deuxième par volume : collections de 700 à 900 titres effacées après une mise
à jour, aucune récupération, service client muet. La revue de Movie Collector
relève l'absence d'export hors version Pro, et un avis que les EAN ne sont ni
consultables ni exportables. **L'export CSV de sa liste est trivial et répond à
une peur réelle** ; le gager derrière un paiement se lirait comme une prise
d'otage, c'est exactement le nerf du grief précédent.

#### La base est fausse ou trouée, et c'est ce qui fait partir

Un tiers des films ajoutés sous un titre incorrect chez CLZ, utilisateur parti
chez un concurrent ; des EAN classés DVD pour un disque Blu-ray ; colonne
« Edition » remplie au hasard, `Blue Ray` mal orthographié ; jaquettes fausses
au scan ; blu-ray.com ignorant les disques exclusifs au Royaume-Uni.

#### Le marché français est un trou, et les utilisateurs le disent

C'est la trouvaille la plus exploitable, et elle est écrite en toutes lettres
dans les avis français des applications dominantes :

    « A éviter en France », aucune reconnaissance des DVD français
    « Trop de titres manquants pour les films français »
    « base de données anglais uniquement », « interface anglaise »

Ce que la France a aujourd'hui : **Filmotech**, freeware de bureau dont
l'application Android n'est « plus suivie », et **Ant Movie Catalog**, d'une
autre époque. All My Movies interroge TMDB et Allociné mais reste un logiciel
Windows. **Aucun service web français, moderne et gratuit.**

#### Les demandes, au-delà du scan et de la valeur

| demande | où en est jaquette |
|---|---|
| éviter le doublon en magasin, raison n°1 citée | recherche en place, tenir la vitesse sur téléphone |
| distinguer les éditions d'un même film | **le modèle de données, déjà** |
| coffrets décomposés film par film | `edition_films`, déjà |
| suivre la mise à niveau DVD vers 4K | rien, mais tout est en base |
| prêt de disque, « film prêté » | rien |
| statistiques de collection | rien |
| page publique partageable | **fait le 3 août 2026**, `/u/<identifiant>` |
| calendrier des sorties et alertes | `date_parution`, incomplet |
| **sauvegarde et export** | **fait le 3 août 2026**, CSV depuis `/account` |
| **signaler une édition manquante** | **fait le 3 août 2026**, `/report` |
| **valeur de la collection** | **fait le 6 août 2026**, `/account`, sur l'occasion |

**La granularité par édition est l'avantage, et il est structurel.** My Movies
compte un coffret comme un seul film ; la revue de Movie Collector juge sa
fonction coffret « confuse et mal documentée », le manuel n'expliquant pas
comment s'en servir ; un avis CLZ rapporte que les volumes multiples d'une
saison d'animé passent pour des doublons, et que le contournement casse les
métadonnées. C'est précisément ce que 15 483 éditions distinctes et une
relation plusieurs-à-plusieurs règlent par construction.

**Le signalement d'édition manquante est la meilleure réponse au trou de
source.** My Movies en fait un argument de vente, l'équipe créant la fiche
rapidement. Ça vaut mieux qu'un import de masse, et ça ne heurte pas la règle
« une œuvre n'existe que si un disque la porte », le signalement portant sur le
disque.

#### Les deux murs, et ils ne se règlent pas par du front

- ~~**Le scan de code-barres, fonction la plus demandée.**~~ **Livré le 7 août
  2026**, `/scan`, avec `/report` en aval. Voir plus bas, « Le scan et l'import ».
- **Le scan de code-barres, fonction la plus demandée.** 5 460 EAN pour
  20 602 éditions, soit **26,5 %**, en baisse : Zavvi et Metaluna n'en publient
  aucun et gonflent le dénominateur à chaque vague. Un scan qui échoue trois
  fois sur quatre est pire que pas de scan. Le blocage est la couverture EAN,
  pas le lecteur.

  **Le flux Leclerc est la première source à pouvoir la relever**, avec 100 %
  d'EAN sur ses 7 090 disques, dont 6 393 inconnus de nous. C'est le meilleur
  argument d'un import, et le seul obstacle est le format non déclaré.

  **Relevée le 6 août 2026 : 40,9 %**, 10 921 codes pour 26 689 éditions, contre
  26,5 % ici et 34,0 % la veille. Ce qui a débloqué la chose n'est pas une
  source neuve mais **l'entrée du DVD au catalogue** (§1) : les 3 478 DVD que
  dvdfr avait qualifiés en août dormaient dans le cache, écartés par le seul
  périmètre. Deux disques sur cinq se scannent désormais.

  **Puis 48,0 % dans la nuit du 7 août 2026**, 14 255 codes pour 29 701
  éditions, après l'import du gisement français haute définition de Momox :
  2 947 éditions écrites, 1 426 films créés, qualifiées une à une par dvdfr sur
  4 766 codes crawlés en deux créneaux locaux, **zéro erreur**. Presque un disque
  sur deux se scanne.

  **C'est la démonstration que le rattrapage était la mauvaise question.** Les
  quatre voies sondées le 6 août sont toutes mortes, mesurées plus bas ; ce qui
  fait monter le taux, c'est de faire entrer des éditions qui **portent** un
  code. Deux mouvements en deux jours, le DVD puis Momox, 26,5 → 48,0 %, et
  aucun des deux n'a rattrapé une seule ligne existante.

  **Le pré-filtre de format s'est vérifié à l'échelle** : 13 fiches écartées
  comme DVD sur 3 614 qualifiées, soit 0,25 %. Le marqueur `[Blu-ray]` de Momox
  dit vrai, là où Leclerc obligeait à interroger 6 393 codes dont 52 %
  finissaient en DVD. Un marqueur lisible déplace le tri **avant** le crawl, et
  c'est la différence entre cinq heures de machine et quarante.

  **Ce n'est toujours pas assez pour poser la caméra sans le dire.** Un scan qui
  échoue trois fois sur cinq reste un scan qui déçoit, et la réponse au cas
  manquant existe déjà, `/report` branché sur l'enrichissement dvdfr par
  code-barres (§8). C'est ce couple qu'il faut livrer, pas le lecteur seul.

  **Et le gros gisement d'EAN restant n'est pas la réponse.** Momox porte 38 009
  codes que nous n'avons pas, mais le §5 les mesure et tranche : éditions
  allemandes, britanniques et italiennes, sans format déclaré, soit le cumul des
  défauts de Zavvi et de Leclerc. Un scan sert à reconnaître le disque **qu'on a
  dans la main**, en France ; l'y déverser gonflerait le taux sans améliorer une
  seule reconnaissance réelle. Le levier reste `/report`, qui part du code que
  quelqu'un a vraiment scanné.
- ~~**La valeur de la collection, deuxième plus demandée.**~~ **Faite le 6 août
  2026**, sur les prix d'occasion de Momox shop, et **déplacée sur l'accueil
  connecté le même jour**.

  **Ce qui manquait n'était pas le calcul, c'était la source.** Le §8 écrivait
  qu'additionner les 724 prix Leclerc « donnerait un total qui se lit comme une
  valeur de collection et n'en est pas une », et c'était juste : un prix neuf en
  rayon dit ce que coûte un disque aujourd'hui, pas ce que vaut un steelbook
  épuisé. Momox shop, accepté le même jour, est la première source de seconde
  main du catalogue (§5), et c'est elle qui rend le total défendable.

  **Ce que le nombre veut dire, exactement** : ce qu'il coûterait de racheter ces
  disques d'occasion aujourd'hui, au moins cher des exemplaires en vente. Rien de
  plus, et `lib/valeur.ts` porte les trois limites en tête de fichier :

      ce n'est pas ce qu'on en tirerait   un revendeur achète bien moins
                                          cher qu'il ne vend, c'est son métier
      ce n'est pas une cote               un prix de vente d'un jour n'est pas
                                          une valeur établie sur des ventes
      c'est un plancher                   au moins cher, sur les seules
                                          éditions couvertes

  **Le dénominateur est collé au total, jamais dans une note plus bas.** 5 506
  éditions portent un prix d'occasion sur 29 701, soit 18,5 %, donc un montant
  seul laisserait croire à une couverture qu'on n'a pas. L'écran écrit « sur N
  éditions estimées, vous en possédez M », et nomme les marchands avec **la date
  du relevé le plus ancien** du lot, pas la plus fraîche : c'est elle qui dit ce
  que vaut l'estimation (§10).

  **La couverture a triplé dans la nuit du 7 août 2026**, de 1 618 à 5 506
  éditions, et par un chemin qui vaut d'être retenu : **ce n'est pas la source de
  prix qui a changé, c'est le catalogue.** Les 2 947 éditions Momox importées
  portent des EAN de son propre flux, donc elles apparient ses offres dès qu'elles
  existent. La même passe `offres_awin.py --marchand momox` est repassée sans une
  ligne de code neuve et a écrit 5 697 offres au lieu de 1 684.

  La boucle complète se lit donc : Momox **désigne** les disques par ses
  code-barres, dvdfr les **qualifie** fiche à fiche, Momox les **date** par son
  prix. Trois rôles, deux sources, et c'est le premier cas du dépôt où un
  marchand sert à la fois d'annuaire et d'horloge.

  Somme des prix d'occasion les moins chers sur tout le catalogue au 7 août 2026 :
  93 847 €, médiane 12,47 €, et par état 13,49 € en très bon, 8,79 € en bon,
  4,99 € en acceptable.

  **Elle vit dans la colonne de l'accueil connecté**, `TableauDeBordPage`, sous
  les deux compteurs. Elle avait d'abord été posée dans `/account` : c'est
  l'écran des réglages, on y va changer son pseudonyme ou effacer son compte,
  pas contempler un chiffre, et l'accueil est justement l'endroit où l'on
  regarde sa collection.

  **Jamais sur `/u/…`, et cette règle-là ne bouge pas.** Le profil public montre
  ce qu'on possède, ce qui est déjà un changement de posture assumé (§10) ; ce
  qu'une collection vaut est autre chose. Publier l'inventaire chiffré de biens
  qui dorment chez quelqu'un, sous un identifiant qu'un moteur indexe, n'est pas
  une fonction qu'on ajoute sans qu'elle ait été demandée. L'accueil connecté
  tient la condition par trois côtés : il ne se rend qu'avec une session, il est
  en `noindex`, et `public/avant-montage.js` retire le corps injecté aux
  visiteurs connectés (§7), donc aucun robot ne le voit.

  **Elle a remplacé un chiffre qui était faux.** La colonne portait déjà une
  tuile « Valeur estimée », sommant les `prix_editeur`, c'est-à-dire des prix
  conseillés **neufs** figés à la sortie du disque. C'était exactement le total
  que ce paragraphe refusait deux alinéas plus haut, affiché sans qu'on le
  remarque. `getResumeCollection` ne lit donc plus `editions` du tout, ce qui
  retire au passage une lecture par lots de 500 à chaque ouverture de l'accueil.

  **Rien n'est calculé avant qu'on le demande**, un bouton et non un chiffre posé
  au chargement : un compte de mille éditions coûte cinq requêtes par lots de
  deux cents, et l'accueil en fait déjà quatre. C'est la règle du §8 vue de
  l'autre bout, ce qui se décide au premier rendu doit se décider sans réseau,
  donc ce qui demande le réseau ne se décide pas au premier rendu.

  **La branche à chiffres a enfin été rendue, le 6 août 2026.** Le §8 la donnait
  pour non vérifiée, faute de session réelle portant une édition à prix
  d'occasion : l'unique compte en a deux, aucune couverte. Éprouvée en ajoutant
  temporairement à cette collection les trois éditions les plus chères portant
  une offre d'occasion, puis en les retirant.

      452,57 EUR | prix d'occasion connu sur 3 des 5 | momox shop | 06/08/2026

  Ce qui restait faux dans la note précédente : la dégradation avait bien été
  vue sous une session forgée, mais un jeton invalide fait échouer la lecture de
  `collections`, donc c'est le message d'échec qui s'affichait, pas le zéro. Les
  deux états se distinguent maintenant à l'écran, « Le calcul a échoué » contre
  « aucun prix d'occasion connu sur vos N ».

#### Abonnement envisagé en v2, deux à trois euros par mois

Prévu pour donner des statistiques de collection. Compatible avec ce qui
précède **à une condition** : ce qui est gratuit aujourd'hui le reste, et rien
ne se ferme rétroactivement. Le grief n°1 ne porte pas sur le fait de payer,
il porte sur le mur surgi en cours de route et sur la licence reprise.

Deux réserves à consigner pendant qu'elles sont fraîches :

- **la statistique est ce qui se monnaie le moins bien.** Elle n'apparaît
  qu'au huitième rang des demandes relevées, et Filmotech la donne
  gratuitement depuis des années. Ce que les gens ont dit vouloir payer, c'est
  la **valeur** de leur collection, précisément ce qu'on ne sait pas encore
  produire ;
- **ne jamais gager l'export ni la sauvegarde.** Ce sont les deux réponses à
  la peur de tout perdre, et les faire payer transforme l'argument de confiance
  en son contraire.

### Couverture mesurée sur des collections réelles, le 2 août 2026

Premier banc d'essai du catalogue contre des collections tenues par des
collectionneurs français, et non contre nos propres sources. **73,0 %**,
216 entrées couvertes sur 296.

Dix listes publiques SensCritique de collection physique, **première page de
chacune**, rapprochées sur `public.mots_recherche(titre)` plus année à ±1,
puis contrôle qu'au moins une ligne d'`edition_films` porte le film.

| liste | taille | échantillon | couvert |
|---|---|---|---|
| sagas 80-90 (Freddy, Rambo, Rocky, Predator) | 149 | 30 | **100 %** |
| collection Blu-ray/DVD | 558 | 30 | 90,0 % |
| DVD / Blu-ray / Steelbook | 309 | 30 | 83,3 % |
| steelbooks | 174 | 30 | 80,0 % |
| ma collection Blu-ray | 311 | 30 | 80,0 % |
| mes Blu-ray | 1 861 | 30 | 70,0 % |
| ma collection cinéma | 799 | 30 | 70,0 % |
| Blu-ray et 4K Ultra HD | 1 953 | 30 | 63,3 % |
| Blu-ray, ma collection | 1 491 | 26 | 61,5 % |
| vidéothèque UHD/BD/DVD | 4 444 | 30 | **30,0 %** |

**Chaque film trouvé porte au moins une édition, sans une exception**, effet
direct de la purge des 134 œuvres orphelines du 31 juillet.

**Le premier chiffre était faux et il fallait le vérifier.** La passe stricte
rendait 69,6 % : dix lignes étaient des **échecs de rapprochement, pas des
trous de catalogue**, sorties par un `%` de trigrammes. Le piège du §9 à
l'identique, un scan cassé qui se lit comme un scan négatif.

    Alien - Le 8ème Passager  ->  « Alien, le huitième passager »  15 éditions
    007 Spectre               ->  « Spectre »                       6 éditions
    Freddy 3, Freddy 5        ->  titres français sans le préfixe   3 éditions
    Always - Pour toujours    ->  « Always »                        2 éditions

**Un cas vaut démonstration plutôt que correction.** `Batman v Superman -
Ultimate Edition` compte comme un **film distinct** dans la liste steelbook, à
côté de la version cinéma. Chez nous c'est une des 18 éditions du même film.
SensCritique n'ayant pas de couche édition, l'utilisateur en fabrique une en
dédoublant l'œuvre. L'argument du §8 écrit par un collectionneur sans qu'on le
lui demande.

**Le creux est au milieu, et c'est contre-intuitif :**

| période | couvert |
|---|---|
| avant 1980 | 71 % |
| 1980-1999 | 80 % |
| **2000-2014** | **65 %** |
| 2015 et après | 86 % |

Ce sont les années de bascule DVD vers Blu-ray, catalogue de studio grand
public, que les cinq sources ne couvrent pas. Les absents ne sont pas des
raretés : `Armageddon`, `Broken Arrow`, `Bone Collector`, `Mission to Mars`,
`Australia`, `(500) jours ensemble`, `Insidious`, `2 Guns`, `Enemy`,
`A Dangerous Method`, `Agora`, `Alpha`, `Les Huit Salopards`,
`120 battements par minute`, `In the Mood for Love`, `Le Dahlia Noir`,
`Obsession`, `Assaut`, `Arizona Junior`. Vérifié une seconde fois, toutes
années confondues : réellement absents.

**La liste la plus mal couverte est la plus cinéphile.** Les 30 % de la
vidéothèque de 4 444 titres sont du Ferrara et du De Palma, précisément le
fonds que Carlotta et Sidonis éditent, et dont nous n'avons que 231 et
158 fiches.

**Deux limites, à rappeler avant de comparer à une mesure future :**

- **première page seulement.** La pagination des listes passe par `?page=`,
  chemin en `Disallow` chez eux. Neuf listes sur dix étant alphabétiques,
  l'échantillon est chargé en chiffres et en A, biais réel de direction
  inconnue ;
- **73 % est un plancher.** Le rapprochement retenu est strict, le repli par
  trigrammes n'a servi qu'à contrôler les absents, jamais à les compter.

À refaire à l'identique après le prochain import, c'est le seul moyen de dire
si une source neuve comble le trou ou grossit le catalogue à côté.

#### Refait le 3 août 2026 au soir, après les 65 collections Metaluna

Mêmes dix listes, mêmes 296 entrées, même rapprochement strict. Le catalogue
avait grossi d'un tiers dans l'intervalle, +5 215 éditions et +2 384 films.

| période | avant | après |
|---|---|---|
| avant 1980 | 58,1 % | 67,7 % |
| 1980-1999 | 75,9 % | 79,7 % |
| **2000-2014** | **64,7 %** | **66,9 %** |
| 2015 et après | 80,0 % | 80,0 % |
| **total** | **73,0 %** | **76,0 %** |

**Un tiers de catalogue en plus pour trois points de couverture**, et le creux
2000-2014 n'a bougé que de 2,2 points. C'est le résultat le plus utile de la
journée, et il est négatif.

**Sur les 19 absents nommés ci-dessus, trois seulement sont réglés** : `2 Guns`,
`Bone Collector` et `In the Mood for Love`, ce dernier par la collection The
Jokers. `Les Yeux sans visage` a gagné une seconde édition, BFI. Les seize
autres restent absents, `Armageddon`, `Broken Arrow`, `Mission to Mars`,
`Australia`, `Insidious`, `Agora`, `Les Huit Salopards` compris.

**La raison est structurelle et vaut pour toute source du même genre.** Les
collections `studio-canal`, `warner-video` et `paramount` de Metaluna sont le
**stock du jour d'un revendeur**, pas le fonds de ces studios. On a donc
élargi le catalogue sans combler le trou, exactement ce que le §8 supposait et
que cette mesure établit : **le crawl de revendeurs élargit, il ne comble
pas.** Ne pas relancer une vague de ce type en espérant un autre résultat.

Ce qui reste, et rien d'autre : le signalement d'édition par l'utilisateur
branché sur l'enrichissement dvdfr par code-barres, et les flux marchands.

### Le scan et l'import, livrés le 7 août 2026

Les deux portes d'entrée d'une collection : **reprendre une liste tenue
ailleurs**, et **ajouter un disque qu'on a en main**. Le §8 les classait
première et cinquième des attentes relevées le 2 août.

#### `/scan`, la caméra

**Couverture EAN mesurée le 7 août : 48,0 %**, 14 253 codes valides sur 29 701
éditions, contre 41,1 % la veille et 26,5 % le 3 août. Un scan sur deux
aboutit, et c'est ce qui a levé le blocage : le §8 posait qu'un scan qui échoue
trois fois sur quatre est pire que pas de scan.

**Le chiffre est écrit sur la page**, en toutes lettres. Un échec annoncé n'est
pas un échec subi, et l'autre moitié part vers `/report?ean=…`, prérempli :
c'est le couple que le §8 réclamait, pas le lecteur seul.

**Le scan désambiguïse là où l'import ne peut pas**, et c'est sa vraie valeur :
un code-barres désigne **le disque qu'on a dans la main**. On cherche donc dans
`editions`, jamais par la route `/ean/` du middleware, qui redirige vers le
film. Trois issues, toutes exercées : une édition, plusieurs pour un même code
(5 cas en base), aucune.

**Deux verrous d'infrastructure, tous deux dans `public/_headers`**, et aucun
des deux ne se voit dans le code applicatif :

    Permissions-Policy: camera=()   interdisait la camera sur NOTRE origine
    script-src 'self'               interdisait la compilation WebAssembly

Le second parce que **Safari et tous les navigateurs iOS n'implémentent pas
`BarcodeDetector`**, WebKit ne le porte pas et Firefox non plus : sans repli
WebAssembly, la fonction la plus demandée n'existerait que sur Chrome Android.
`'wasm-unsafe-eval'` n'autorise **que** la compilation WASM, pas `eval` ni
`new Function`.

**Le `.wasm` est servi par nous.** zxing-wasm va le chercher sur
`fastly.jsdelivr.net` par défaut ; `lib/scan.ts` réécrit ce chemin vers l'asset
émis par Vite. Le §10 a sorti le site de toute dépendance à un tiers pour ses
fichiers, et `connect-src` refuserait de toute façon la requête.

Vérifié sous `wrangler` : `.wasm` servi en 200 `application/wasm`, 1 065 634
octets, `WebAssembly.compile` réussit (77 imports), zéro violation CSP.

**Chromium déclare `upc_a` inconnu**, sa liste ne porte que `upc_e`. Il ne se
plaint pas quand on le demande, mais une autre implémentation lèverait et on
basculerait sur un mégaoctet de WASM pour rien : on n'exige donc que ce qu'il
déclare savoir lire. Rien n'est perdu, un UPC-A **est** un EAN 13 avec un zéro
devant, et `normaliserCode` le remet.

#### `/import`, reprendre Letterboxd ou SensCritique

**SensCritique se lit depuis le navigateur du visiteur**, détail des mesures au
§5. Nos serveurs n'adressent aucune requête chez eux.

**Letterboxd, jamais.** Leur `robots.txt` met `ClaudeBot`, `GPTBot`, `CCBot` et
une vingtaine d'autres en `Disallow: /`, politique déclarée au sens du §5. Leur
export officiel est en libre-service, *Settings → Data → Export your data*, et
c'est ce ZIP qu'on lit. **Ouvert sans bibliothèque**,
`DecompressionStream('deflate-raw')` plus une lecture du répertoire central :
le §8 a retiré quatorze dépendances le 4 août, on n'en rajoute pas une pour ça.

**L'appariement vit en base**, `public.apparier_import(jsonb)`, migration
`20260807_apparier_import.sql`. Même règle que la recherche, titre exact replié
par `mots_recherche` sur le titre, le titre original ou `mots_alternatifs`,
année à ±1. Une seconde implémentation en TypeScript aurait dérivé, ce que le
§6 reproche déjà à deux copies de `chercher()`.

**C'est `mots_alternatifs` qui rend l'anglais possible**, colonne générée posée
le 5 août pour tout autre chose. Sans elle un export Letterboxd ne rendrait
presque rien, leur `Name` étant le titre anglais quand nos deux colonnes de
titre sont françaises une fois sur deux :

    Amelie 2001                  -> Le Fabuleux Destin d'Amelie Poulain
    The Handmaiden 2016          -> Mademoiselle
    Raising Arizona 1987         -> Arizona Junior
    Assault on Precinct 13 1976  -> Assaut
    Enemy 2013                   -> Enemy (2014)   <- rattrape par l'annee ±1

Éprouvé sur 49 titres écrits à la main dans leur graphie : **41 appariés, 0 faux
positif, 0 ambiguïté**, et les 8 absents sont exactement les trous de fonds
nommés plus haut. Second contrôle, 300 films cherchés depuis leur titre anglais :
300/300.

**Deux index btree d'expression** accompagnent la fonction. Les trois index de
titre du 1er août sont en `gin_trgm_ops`, ce qu'il fallait pour `like '%…%'` ;
ici on ne fait que de l'égalité, et un GIN trigramme la sert chèrement. Mesuré,
200 entrées passaient de **1 699 ms** à quelques centaines. Le trigramme reste
indispensable au seul `mots_alternatifs like '%|…|%'`.

#### L'ambiguïté d'édition, et pourquoi le plan d'origine ne tenait pas

Un fichier donne un titre, donc un film ; `collections` veut une édition.

Le plan tablait sur la moyenne du catalogue : 61,9 % des films n'ont qu'une
édition, et déclarer un format levait 58,5 % du reste, soit 84 %
d'auto-résolution. **Rejoué sur une vraie liste**, les 1 005 envies d'un compte
SensCritique réel :

    527 films apparies, dont 390 a plusieurs editions   -> 74 %, pas 38 %
    declarer « Blu-ray » n'en leve que 51               -> 35,7 % au total

Ce n'est pas une erreur de mesure, c'est un **biais de population** : une liste
réelle est faite de films populaires, et un film populaire a quatorze Blu-ray,
steelbook, digibook, réédition, coffret. `300` en porte vingt dont quatorze
Blu-ray. La moyenne du catalogue est tirée par les milliers de titres à édition
unique que personne ne collectionne.

**Le plan d'origine importait donc 26 % d'une liste et jetait le reste.**

Les deux issues habituelles sont mauvaises : faire choisir parmi quatorze
pressages trois cent quarante fois, personne ne le fera, et personne ne s'en
souvient ; choisir à sa place et se taire, c'est écrire un lien faux, ce que le
§9 interdit.

**La troisième est de le dire**, d'où `collections.edition_precisee`, migration
`20260807_collections_edition_precisee.sql`. « J'ai *300* en Blu-ray » est une
vérité que les gens savent énoncer ; « j'ai le steelbook Zavvi de 2013 » non. La
ligne existe, pointe une édition représentative pour avoir une jaquette et une
fiche, et porte la marque de ce qu'elle n'affirme pas. `true` par défaut, donc
sans effet sur l'existant : un clic sur une fiche est précis par construction.

    format aucun       importables 527 (52,4 %)  dont pressage sur 137
    format Blu-ray     importables 527           dont pressage sur 188
    format DVD         importables 527           dont pressage sur 310

**Les homonymes, eux, ne s'écrivent pas.** Huit sur 1 005, `Le Garde du corps`
1984 contre 1973, `The Killer` 2023 contre 2024 : rien n'est importé tant que
personne n'a tranché. Une absence se corrige, un lien faux se lit comme une
vérité.

**Le choix d'édition est déterministe**, sinon réimporter le même fichier
écrirait une seconde ligne et la collection doublerait. Quatre chemins, du plus
sûr au moins sûr : une adresse de fiche dans l'annotation, un code-barres dans
l'annotation, une seule édition dans le format, puis la représentative.

**L'annotation SensCritique vaut de l'or**, et ce n'était pas prévu. Relevée sur
une liste réelle intitulée « La collection », elle porte `"Blu-ray"`, `"DVD"`,
et jusqu'à `"Coffret blu-ray steelbook (https://editioncollector.fr/…)"`. Ce
dernier cas résout l'édition **exacte** par `editions.url_source`, vérifié de
bout en bout.

**Mesuré sur la chaîne complète** : 1 005 titres appariés en **3,3 s**, 527
importables, 8 à trancher, 470 absents. Les absents sont le §8 mot pour mot,
c'est le catalogue qui manque, pas l'appariement.

### Fonctionnel
- **Le premier rendu ne doit pas attendre la session, le 3 août 2026.** Sur une
  visite connectée, l'accueil affichait le **catalogue**, c'est-à-dire la
  version déconnectée du site, puis basculait sur le tableau de bord. Mesuré en
  production, la bascule arrivait à 2,5 s :

      1608 ms  bundle chargé, React monte
      2102 ms  morceau auth-client, chargé à la demande
      2512 ms  rafraîchissement du jeton  <- session enfin tranchée
      2823 ms  films, editions, collections

  Deux causes, deux correctifs. **`compteProbable()` lit le stockage** là où
  auth-js écrit sa session et répond au premier rendu, sans télécharger quoi que
  ce soit : `Accueil` choisit donc le bon écran tout de suite, et `useSession` ne
  fait plus que confirmer. Le bandeau fait pareil avec `apercuNom()`, à la place
  d'un trou de 96 px qui se lisait comme une déconnexion.

  **Et la fiche film n'attend plus la session pour ses données publiques** : le
  film et ses éditions ne dépendent d'aucun compte, seuls les statuts en
  dépendent. C'est un effet séparé, et `statutsPrets` tient les pastilles
  sourdes tant qu'on ne sait pas, plutôt que d'affirmer « pas dans votre
  collection » avant de l'avoir lu.

  **Le faux positif est assumé et il est le bon sens** : une session révoquée
  fait afficher le tableau de bord une seconde avant de retomber sur le
  catalogue. C'est le clignotement d'hier, dans l'autre sens, et bien plus rare.
  Éprouvé sous `wrangler` dans les deux sens, avec et sans clé en stockage.

  **Le troisième étage est au §7**, et il complète les deux autres : les données
  de la fiche sont désormais inlinées dans la page par le middleware, donc React
  monte avec son contenu. Les trois correctifs visent la même chose, ne pas
  peindre un état qu'on sait faux. **La règle qui s'en dégage, et qui vaudra
  pour les prochains écrans : ce qui se décide au premier rendu doit se décider
  sans réseau.** Le stockage local pour le compte, le HTML pour les données ;
  tout ce qui demande un aller-retour arrive après, et ne fait que confirmer.

  **Ce qui n'est toujours pas couvert** : le parcours connecté n'a pas été
  exercé de bout en bout, faute de session Google, ici comme dans les deux
  audits. `compteProbable()` et `apercuNom()` ont été éprouvés avec une session
  posée à la main dans le stockage, ce qui valide le choix d'écran et le nom
  affiché, pas le rafraîchissement d'un vrai jeton.
- **Authentification en ligne depuis le 30 juillet 2026.** Google uniquement,
  `auth-js` seul et chargé à la demande, +0,75 Ko compressé au bundle initial,
  le reste dans un morceau séparé de 24,5 Ko. Parcours exercé de bout en bout en
  production : connexion, écriture, cloisonnement entre comptes, suppression.
- **« Google uniquement » n'était vrai que de l'interface jusqu'au 2 août
  2026.** Le fournisseur Email restait actif côté projet, et
  `GET /auth/v1/settings`, qui est public, l'annonçait :

      "email": true, "disable_signup": false

  N'importe qui pouvait donc créer un compte par `POST /auth/v1/signup` sans
  passer par le site. Rien n'avait été abusé, mesuré avant de corriger : un
  seul compte, par Google, aucun mot de passe, aucun non confirmé. Le risque
  était la création en masse, qui aurait rempli `auth.users` et brûlé le quota
  du SMTP par défaut, celui-là même qui a fait écarter la connexion par
  courriel. Fournisseur désactivé, l'API le confirme, `email: false`.

  Corollaire à retenir : **l'avis Supabase « leaked password protection » ne
  s'appliquait pas à l'interface mais bien au projet**, tant qu'un mot de passe
  pouvait exister. Il est sans objet maintenant, plus pour la même raison.

  `anonymous_users` et `phone` étaient déjà à faux, et `disable_signup` reste à
  faux exprès : c'est ce qui laisse un nouveau visiteur créer son compte
  Google.
- **Toute action demande un compte.** `collections.ts` lève `CompteRequis`,
  l'interface ouvre `ModaleConnexion`. Le site n'écrit plus rien dans
  localStorage : `local-statuts.ts` ne garde que lecture et effacement, pour
  reprendre une fois les listes d'avant à la première connexion.
- **Export CSV de la collection, le 3 août 2026.** Une section d'`/account`,
  un fichier des deux listes, une ligne par édition, distinguées par une
  colonne `statut`. Le relevé du 2 août met la **perte de données au deuxième
  rang** des griefs contre les concurrents : des collections de sept à neuf
  cents titres effacées après une mise à jour, sans récupération. Movie
  Collector réserve l'export à sa version Pro.

  **Il est gratuit et le restera.** Le grief n°1 dans ces avis n'est pas de
  payer, c'est le mur surgi en cours de route : gager l'export ou la sauvegarde
  retournerait l'argument de confiance. Il est placé juste avant la suppression
  du compte, les deux répondant à « et si je veux partir ».

  **La FAQ répondait encore « ni import ni export » jusqu'au 6 août 2026**, trois
  jours après la mise en ligne. `/about` est servi par le middleware depuis
  `lib/faq.ts`, donc la contradiction était publiée en toutes lettres à côté d'un
  bouton qui marche, sur une fonction qui tient une obligation du RGPD (art. 20).
  Corrigé. Ce qui reste vrai est l'**import**, qui n'existe pas : la réponse le
  dit maintenant séparément. **Une fonction livrée sans relire ce que la FAQ en
  dit laisse une promesse fausse derrière elle**, et c'est l'inverse du défaut
  habituel, ici le site faisait plus que ce qu'il annonçait.

  Quatre choix de format, aucun évident : **point-virgule** et non virgule,
  Excel en locale française mettant sinon toute la ligne dans une cellule ;
  **BOM UTF-8**, sans lequel « Amélie » devient « AmÃ©lie » ; **injection de
  formule neutralisée**, un tableur exécutant une cellule qui commence par
  `=`, `+`, `-` ou `@`, et nos titres venant de catalogues marchands ; et
  **l'EAN part tel quel**, Excel l'abîmant en le lisant comme un nombre, la
  parade `="…"` s'affichant littéralement ailleurs et rouvrant l'injection.

- **Signalement d'édition manquante, le 3 août 2026.** `/report`, lié du pied
  de page. Le §8 le tient pour la meilleure réponse au trou de source : il ne
  dépend d'aucune autorisation extérieure, contrairement aux flux Awin, et il
  ne heurte pas la règle du catalogue, puisqu'il porte sur le disque.

  **On demande un code-barres, pas un titre.** C'est la seule donnée qui
  identifie un disque sans ambiguïté, là où un titre rouvre tous les pièges du
  §9. Et c'est ce que la chaîne dvdfr sait reprendre : elle interroge fiche à
  fiche par EAN et en tire titre, éditeur, support, durée et zone.

  Modèle de données et barrières au §3. Page en `noindex` et en `lazy()` comme
  `/account` : personne n'y arrive depuis un moteur, la règle du §9 sur les
  portes d'entrée ne s'applique pas.

  **Reste non vérifié** : le formulaire sous une vraie session. L'état
  déconnecté, le `noindex`, le lien du pied de page et les trois barrières
  anon le sont.

- **Identifiant public et profil partageable, le 3 août 2026.** Chaque compte
  choisit un « @ » à la création, modifiable ensuite depuis `/account`, et
  l'adresse `/u/<identifiant>` ouvre sa collection **sans compte**. C'est la
  ligne « page publique partageable » du relevé du 2 août, qui était à « rien ».
  Modèle de données au §3, adresses et référencement au §7.

  **Le choix de l'identifiant est un passage obligé**, posé par `Layout` à la
  place de la page demandée tant que le profil manque, et non une bannière
  qu'on repousse : un compte sans @ n'a pas de page, et une invitation
  repoussable produit exactement ça. Quatre chemins y échappent, `/account`
  d'abord, parce qu'on ne doit pas avoir à choisir un pseudonyme public pour
  effacer ses données (RGPD art. 17), puis `/about`, `/legal` et `/privacy`,
  qu'on peut vouloir lire avant de décider.

  **Seul « profil absent » déclenche l'écran, jamais « lecture en échec ».**
  `lib/profils.ts` rend cinq états et non trois pour cette seule raison :
  confondre une panne réseau avec un compte neuf enfermerait quelqu'un hors du
  site, ce qui est mot pour mot le défaut du 30 juillet 2026 consigné au §9,
  où `auth-js` introuvable bloquait le catalogue entier.

  **Une seule page de profil, une seule adresse**, `/u/<identifiant>` (§7).
  `/profile` a d'abord été un écran à part avant de devenir une forme courte
  qui redirige : ce que vous regardez chez vous est la page que vous partagez,
  au même endroit. Deux écrans auraient dérivé, et la version publique, celle
  qu'on partage, aurait été la dernière servie.

  **Le tableau de bord montre le « @ » à la place de l'adresse électronique.**
  L'adresse ne dit rien qu'on ne sache déjà et vit dans `/account` ; le @, lui,
  est ce qu'on donne à quelqu'un. En chasse fixe, comme un code-barres : c'est
  une adresse, on la lit signe à signe.

  **Reste non vérifié** : le parcours connecté, création du @, contrôle de
  disponibilité, modification, masquage. Il demande une vraie session Google.
  Les barrières, elles, sont mesurées (§3), et le middleware l'est sous
  `wrangler` (§7).
- **La consultation reste publique** : c'est la condition de l'indexation, donc
  de la migration Cloudflare. Ne pas fermer le catalogue.
- **Rapatrier les images** hébergées chez editioncollector
- **Supprimer la branche `DEPLOY_TARGET=github`** de `vite.config.ts`
- ~~**Cinq acteurs par film au maximum**~~, **fait le 5 août 2026.** La limite
  venait de l'import TMDB et non de l'affichage, `NB_ACTEURS` valant 5 par
  défaut. Passée à 12 sur tout le catalogue : la moyenne va de 5 à **11,0
  acteurs**, et 11 348 films en portent plus de cinq contre 1 004 avant. Les
  681 qui restent sous six sont des films dont TMDB ne crédite pas davantage.

      NB_ACTEURS=12 AVANCEMENT=cast12.avancement.json \
        python3 enrichir_tmdb.py --apply --cast-seul
- **Une quinzaine d'opéras** à écarter du catalogue. **Ne pas filtrer par
  mot-clé** : « Opération Dragon », « Opération Tonnerre » et « Nosferatu, une
  symphonie de l'horreur » sont des films. Les concerts, eux, sont gardés, TMDB
  les référence.

### Page de bienvenue, en ligne le 31 juillet 2026

`/welcome`, `src/app/pages/BienvenuePage.tsx`, **embarquée dans le bundle
initial** (6,6 Ko compressés). Liée du pied de page et du sitemap.

Elle a d'abord été posée en `lazy()`, et elle est tombée sur le piège du §9 comme
les pages de regroupement avant elle : un écran vide chez qui avait demandé son
morceau pendant la propagation. C'est une porte d'entrée, donc un chemin de
consultation, donc pas d'`import()` sur son chemin.

**Le catalogue reste l'accueil.** C'est lui qui s'indexe, et on entre sur le
site par une fiche film. `/welcome` est l'autre porte : celle qu'on donne en
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

#### Ligne d'édition, arrêtée le 2 août 2026

Vignette, titre, badges, année, code-barres, boutons. Le titre porte déjà le
format, il vient de la source et n'est pas recomposé.

**Deux colonnes portent l'année, et il faut les deux.** `date_parution` est la
seule propre, mais elle n'existe que sur les lignes blu-ray.com, editioncollector
ne datant rien : s'y tenir laisserait la moitié du catalogue sans année. On
retombe sinon sur `date_sortie`, texte anglais, dont on n'extrait que le
millésime, **borné** pour ne pas ramasser le 1920 de `1920x1080` (§9).

**`editions.region` est inutilisable en badge tel quel.** C'est du texte libre
qui décrit parfois deux disques à la fois, `4K Blu-ray: Region free 2K Blu-ray:
Region B (A, C untested)`, soit soixante caractères. `zonesDe`, qui sert déjà à
l'onglet Détails, est exporté et réutilisé plutôt que recopié ; il écarte au
passage les zones entre parenthèses, marquées `untested` donc invérifiées. Seul
ajout local : `Region free`, qui n'est pas une lettre et qu'il ne retenait pas.

**Le code-barres est masqué sous `sm`.** À 375 px, treize chiffres à côté du
titre et des deux boutons ne laissent plus rien au titre. Il est en
`tabular-nums` : c'est une valeur qu'on lit chiffre à chiffre, et la chasse fixe
aligne deux EAN empilés.

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

**Un écart de boîtes n'est pas un écart d'encre**, corrigé le 5 août 2026. La
note paraissait collée à la réalisation, alors que le gabarit était équilibré :
la réalisation est en 15/22,5, donc elle porte 3,75 px de demi-interligne sous
son texte, le synopsis 4,5 px au-dessus du sien, et la note, dont l'interligne
vaut 18 pour une icône de 18, n'en porte aucun.

    boites    6 px au-dessus, 16 en dessous
    encre     9,75 au-dessus, 20,5 en dessous   <- ce que l'oeil voit

11 px de marge à partir de `sm` remettent les deux à 20,75 contre 20,5. **Rien
ne descend pour autant** : l'affiche est en `row-span-4` sur des rangées
`auto auto auto 1fr`, donc la quatrième, vide, absorbe ; le héros fait 492 px
avec comme sans.

Sous `sm` la marge ne s'applique pas, et c'est délibéré : la grille se réordonne,
la note y est suivie des **boutons**, à plus de deux cents pixels, donc il n'y a
aucun déséquilibre à corriger et onze pixels se paieraient sur un écran de 375.

La règle qui s'en dégage, et qui vaut pour tout empilement du site : **quand deux
blocs voisins n'ont pas la même interligne, mesurer l'encre, pas les boîtes.**

**Le synopsis est tronqué à quatre lignes, sur toutes les tailles**, avec « Voir
plus » et « Voir moins ». La troncature a d'abord été réservée au mobile, au
motif qu'un écran large avait la place. Il l'a, mais ce n'est pas la question :
le héros doit tenir dans le premier écran, boutons compris, et **c'est la
longueur du texte qui en décide, pas celle de l'écran**. Un synopsis TMDB fait
jusqu'à huit lignes à 1 440 px et seize à 375, et il repoussait les boutons puis
la barre d'onglets si bas qu'on ne soupçonnait plus leur existence.

`line-clamp` et non une coupe de la chaîne : couper en JavaScript demanderait de
deviner combien de signes tiennent sur quatre lignes, ce qui dépend de la
largeur et de la police.

**Le bouton n'apparaît que sur un débordement mesuré**, `scrollHeight >
clientHeight`, jamais sur une longueur de chaîne : quatre lignes de 375 px et
quatre lignes de 640 px n'accueillent pas le même nombre de signes, et sur un
synopsis court le bouton mentirait. Remesuré au redimensionnement, une rotation
d'écran faisant passer un texte de cinq lignes à trois.

Piège en passant : le `sm:hidden` du bouton et le `sm:line-clamp-none` du texte
allaient ensemble. N'en retirer qu'un laisse soit un texte tronqué sans moyen de
l'ouvrir, soit un bouton qui ne commande rien.

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

**Il ne suffit pas de fixer la largeur de l'enveloppe.** Un `<button>` se
dimensionne sur son contenu, même passé en `flex`, et la vignette en `w-full`
suivait donc cette largeur adaptée : une carte sans photo retombait sur les
48 px de la pastille, plus étroite **et** plus courte que ses voisines. Le
`w-[132px]` posé par le rail ne descendait pas jusqu'au bouton, il faut un
`w-full` dessus.

**Le contour de survol se dessine à l'intérieur de la vignette**, sur une couche
posée par-dessus l'image, en `ring-inset`. Un `ring` se peint hors de la boîte ;
depuis que le rail n'a plus de rembourrage horizontal, la première carte touche
le bord du scrollport et `overflow-x: auto` rognait le contour du premier et du
dernier acteur, coins coupés net. Le focus rejoint cette couche par
`group-focus-visible` : posé sur le bouton, il dessinait un second contour
autour de la carte entière, tronqué pour la même raison.

Piège de mesure : `UserAvatar` porte lui aussi un `aria-hidden`, et il précède
la couche dans le document. Un relevé qui cible `span[aria-hidden]` attrape le
sien sur les cartes sans photo et conclut à tort que la couche manque.

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
sur la fiche film. Le titre reprend l'échelle de `/welcome`,
`clamp(38px, 6vw, 68px)` : deux pages qui ouvrent le site ne peuvent pas
annoncer deux tailles.

### Menus de sélection dessinés, le 7 août 2026

`src/app/components/Selecteur.tsx`, employé par les six filtres du catalogue et
par le tri du profil. Bulle ancrée sous la capsule au-dessus de 640 px,
**feuille par le bas en dessous**.

**Ce qui l'a déclenché est visible à l'œil** : le tri du profil était un
`<select>` sans `appearance-none`, donc il gardait la flèche du navigateur au
milieu d'une capsule dessinée. Un `<select>` natif est peint par le système, il
n'a ni la police, ni le rayon, ni les couleurs du site, et sa flèche change de
forme d'une machine à l'autre.

**Le commentaire qui défendait le natif avait raison, et c'est lui le cahier
des charges.** Il listait trois choses qu'un menu maison rate presque toujours,
et les trois sont reprises, sans quoi le remplacement aurait été une
régression :

    clavier          flèches, Origine, Fin, Entrée, Échap, focus rendu au bouton
    frappe au vol    « sci » saute à Science-Fiction, tampon vidé après 1 s
    geste du système la roue devient une feuille par le bas

**La frappe au vol replie les accents**, sinon « ed » ne trouverait pas
« Éditeur ». Et le surlignage repart de la valeur courante à chaque ouverture :
ouvrir sur la première ligne quand on a déjà choisi la dixième oblige à refaire
tout le chemin.

**Pas de champ de recherche dans la liste**, même sur `Éditeur` et ses 142
entrées : dans une feuille, il ouvrirait le clavier logiciel par-dessus la liste
qu'il filtre. La frappe au vol suffit.

**Le clic extérieur passe par un voile transparent**, pas par un écouteur de
document : il attrape le clic sans qu'aucun composant n'ait à se demander si la
cible est dedans ou dehors.

**La bulle est en `--reel-surface`, pas en `--reel-surface-2`**, alors que
c'est une surface surélevée. Le surlignage des lignes vaut justement
`--reel-surface-2` : un panneau de cette teinte rendait **le survol invisible**,
tout en laissant croire à la relecture qu'il n'existait pas. C'est aussi la
couleur du menu du compte dans le bandeau, qui flotte de la même façon.

**Le survol est peint en CSS, pas en état.** `onMouseEnter` reste, mais pour
aligner le curseur clavier sur la souris ; un `hover:` ne dépend d'aucune
synthèse d'événement, ne coûte pas un rendu par ligne survolée, et Tailwind le
place derrière `@media (hover: hover)`, donc il ne colle pas au doigt après un
appui sur téléphone. Il éclaircit **aussi le texte** : les options non choisies
sont en gris discret, un changement de fond seul s'y remarque à peine.

**Le survol ne s'éprouve pas dans le panneau d'aperçu**, et c'est un piège de
plus à ranger à côté de ceux du §8 : `document.querySelector(':hover')` y rend
**null**, le navigateur n'ayant aucun pointeur. Ni le `hover:` du CSS ni le
`onMouseEnter` de React ne peuvent s'y déclencher, et les deux se lisent alors
comme cassés. Ce qui se vérifie à la place : que la règle Tailwind existe bien
dans la feuille servie, puis appliquer ses déclarations à la main pour juger le
rendu.

    panneau       rgb(24, 32, 44)     --reel-surface
    survol        rgb(31, 40, 54)     --reel-surface-2
    texte repos   rgb(138, 143, 152)  --reel-muted
    texte survol  rgb(232, 232, 232)  --reel-text

Éprouvé à 1 440 et 390 px : Origine, deux flèches, Fin, frappe « hor », Entrée,
puis Échap qui ferme **sans changer la valeur**. La feuille mesure 607 px sur
844, ancrée en bas, voile plein écran à 0,7.

### Gouttière, arrêtée le 1er août 2026

`.reel-gouttiere` dans `theme.css`, une classe pour tout le site.

**La marge est une proportion, pas un nombre de pixels.** Un plafond en pixels
avec un rembourrage fixe, `max-w-[1440px] px-4 sm:px-6 lg:px-10`, donne une
marge généreuse sur grand écran, où le plafond mord, et presque rien juste en
dessous : à 1 440 px de fenêtre il restait 40 px de chaque côté, soit 2,8 % de
la largeur, et la page touchait les bords.

    clamp(800px, 58%, 1500px)     3 août 2026
    clamp(880px, 68%, 1760px)     valeur d'origine

21 % de marge de chaque côté. Le plancher de 800 px évite qu'à 1 024 la
proportion ne laisse que 594 px de contenu, le plafond de 1 500 px évite la
ligne illisible au-delà de 2 586 px. En pourcentage et **non en `vw`**, qui
compte la barre de défilement et déborderait de quelques pixels. Sous `lg` la
gouttière reste en pixels, 20 puis 32 : sur un téléphone la proportion
mangerait la moitié de l'écran, mais 16 px collaient le texte au bord.

**Resserrée deux fois le 3 août 2026**, 68 → 62 → 58 %. À 1 512 px de fenêtre
le contenu passe de 1 028 à 877 px et la marge de 242 à 317 de chaque côté.

**Le plancher doit descendre à chaque cran**, et c'est le seul piège de ce
réglage : à 58 % il mordrait jusqu'à 1 380 px de fenêtre au lieu de 1 294,
donc précisément sur les tailles d'écran les plus courantes, et le
resserrement ne se verrait nulle part où il compte.

Elle remplace une douzaine de conteneurs recopiés page par page, qui avaient
fini par diverger : le bandeau montait à `lg:px-16` là où le contenu restait à
`lg:px-10`, donc **le mot-symbole ne tombait pas sur la même verticale que le
titre juste dessous**.

#### La migration n'avait couvert que la moitié des pages, corrigé le 5 août 2026

Sept pages posaient encore leur propre `mx-auto max-w-[…] px-6`, donc six
largeurs de contenu, et un bord gauche qui ne tombait sous le mot-symbole **à
aucune taille d'écran**. Mesuré à 1 512 px, où la gouttière vaut 877 et commence
à 318 :

| page | conteneur | bord gauche | écart |
|---|---|---|---|
| `/formats/blu-ray`, RegroupementPage | 1200 | 156 | **−162** |
| `/about` | 1180 | 166 | −152 |
| `/welcome` | 1100 | 206 | −112 |
| `/formats`, `/publishers`, `/genres` | 900 | 306 | −12 |
| `/legal`, `/privacy`, `/report`, `/account`, 404 | 760 | 376 | **+58** |

**Le décalage existait aussi en mobile, et en sens inverse selon le palier** :
ces pages portent `px-6` partout quand la gouttière met 20 px puis 32 à partir
de `sm`. D'où +4 px à 375 et −8 px à 768, jamais zéro.

Les pages éditoriales gardent une colonne de lecture de 760 px, mais **calée à
gauche et non centrée** : centrée dans 877, elle réintroduirait 58 px du décalage
qu'on venait de retirer.

Mesuré après coup sur douze routes, à 375, 768 et 1 512 px : écart nul partout,
aucun débordement horizontal.

**`/welcome` reste dehors, et c'est un choix.** Ses six étapes sont réglées pour
1 100 px, colonne de texte `lg:w-[400px] xl:w-[440px]` face à des cadres de 520 à
660, plus un débord voulu de 80 px vers l'extérieur. Sur 877 il ne reste que
461 px pour le cadre, donc tous les visuels seraient à rétrécir de 20 à 30 %,
jaquettes comprises. C'est un redimensionnement de la page, pas un changement de
conteneur, et le §8 dit que ces tailles ont été réglées à l'œil.

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

### Pied de page, la colonne « Réseaux » retirée le 5 août 2026

Elle réclamait la largeur d'une colonne entière, au même titre que « Sections »
ou « Parcourir », pour **un seul compte ouvert**. L'icône Instagram passe sous la
description, dans la colonne d'identité, en pastille de 36 px bordée.

**Bluesky et Letterboxd sont retirés, pas convertis.** C'étaient des `<li>` en
texte nu, sans lien, parce que les comptes n'existent pas : le §8 les gardait en
mentions plutôt qu'en liens morts, ce qui se lisait comme « bientôt ». Une icône
ne sait pas dire ça, elle se lit comme un lien mort. Une ligne chacune à
rajouter le jour où les comptes ouvrent, et le lien reste dans l'historique.

`LienExterne` est parti avec elles, plus aucun appelant.

### Logo, posé le 2 août 2026, redessiné le 3

L'emplacement laissé vide par la pastille bleue à icône de pellicule est rempli :
des « j » décalés, lus comme des tranches d'étagère, cyan `#00BCED`, ambre
`#FFB000`, rouge `#FB4412`. Dessiné dans Figma, exporté en tracés.

**Le « j » blanc de tête a été retiré le 3 août 2026**, après comparaison des
trois espacements rendus côte à côte en 16, 32 et 176 px. Il portait **le seul
point du dessin**, donc la variante n'en a plus du tout, et deux reports en
découlent, tous deux invisibles au diff :

- le `viewBox` se recadre sur les fûts, `28.5596 33.7028 99.5604 111.8802` ;
  le garder aurait laissé du vide à gauche et en haut, donc un motif décalé
  dans sa boîte, ce qui se voit dès qu'on l'aligne sur du texte ;
- la tuile du favicon **recentre et remet à l'échelle**, sans quoi le motif
  occupe sa moitié droite.

**Sans point, le motif ne se cale plus sur l'encre entière du « j » du nom**
mais sur sa capitale plus descendante. Couple retenu : 21 px de griffe pour
27 px de nom au bandeau, 17 pour 20 au pied de page. Le nom a grossi trois
fois, la griffe une seule : à la fin c'est lui qui porte la marque.

**Les trois tranches sont espacées par `transform`, pas en retouchant les
tracés** : `translate(3,6)` sur l'ambre, `translate(7,2)` sur le rouge,
gouttière entre fûts portée de 6,4 à 10 unités. Un seul nombre à changer pour
resserrer, et les `d=` restent ceux de Figma.

**Pourquoi cet espacement et pas un autre**, mesuré et non supposé : collées,
les tranches font un pâté indistinct à 16 px, où l'on ne compte plus les
disques ; écartées de 6, elles se lisent comme trois lettres alignées et
l'empilement, qui est le sens du dessin, disparaît. À 3,6 les deux lectures
tiennent.

**Trois copies des mêmes tracés, et c'est assumé** : `public/logo.svg` (fond
transparent), `public/favicon.svg` (tuile sur dégradé) et
`src/app/components/Logo.tsx`. Une retouche vaut pour les trois, plus le lockup
recopié dans `scripts/og/og-jaquette.html`. La source unique supposerait un
`<img>` à l'écran, donc une requête de plus sur le chemin de rendu du bandeau,
pour un fichier non haché qui traverse le cache d'un déploiement à l'autre.

**Les couleurs sont en dur, jamais en jetons du thème.** Un logo ne suit pas la
couleur d'accent du site : les trois teintes sont hors de la palette bleu nuit
du §8, et c'est ce qui les fait tenir lieu de marque. Elles existent **aussi**
en jetons (`--reel-logo-cyan`, `-ambre`, `-rouge`) pour le seul endroit de
l'interface qui cite le logo, l'anneau de focus du champ de recherche ; un SVG
servi comme fichier, lui, ne voit pas les variables du site.

**Le site ne déclarait aucune icône.** Le navigateur demandait `/favicon.ico`,
que la réécriture SPA servait en HTML avec un code 200, donc un onglet muet
plutôt qu'un 404 franc. Quatre fichiers désormais : `favicon.ico` (16, 32 et
48 px dans un seul conteneur à charge utile PNG, fabriqué à la main faute
d'ImageMagick sur la machine), `favicon.svg`, `favicon-96.png` pour les
navigateurs qui ignorent le SVG, et `apple-touch-icon.png` en 180 px, **carré
et sans arrondi**, iOS masquant lui-même et un double arrondi se voyant.

**Le `.ico` n'est pas là pour les navigateurs**, qui prennent le SVG déclaré
dans le `<head>` : il est là pour tout ce qui demande `/favicon.ico` en dur
sans lire ce `<head>`, aperçus de lien, agrégateurs, vieux lecteurs. Mesuré
avant de le poser : la réécriture SPA leur servait **5 588 octets de HTML** en
200, annoncés comme une icône.

**Le cache de ces fichiers est passé d'une semaine à une heure**, et l'épisode
vaut d'être retenu. Après le redessin, le déploiement était en ligne et la
feuille de style hachée à jour, mais les icônes sortaient dans leur ancienne
version, `cf-cache-status: HIT` et `age: 7930`. `stale-while-revalidate` **ne
rattrape pas ce cas**, il ne joue qu'une fois le `max-age` écoulé, donc
l'ancien dessin serait resté à la périphérie jusqu'à sept jours. Deux réponses,
les deux appliquées : `max-age=3600` pour borner la dérive à une heure, et une
purge à la main des cinq URL, tableau de bord Cloudflare, *Caching*,
*Personnaliser le vidage*, mode URL.

**Un `Cache-Control: no-cache` côté client ne force rien**, testé : la réponse
reste `HIT` avec son `age`. Seule la purge agit. Et le jeton OAuth de
`wrangler`, présent sur la machine, ne peut pas la faire : ses portées
s'arrêtent à `zone:read`, sans `cache_purge`.

**Cette purge en a oublié un, et il a fallu trois jours pour le voir.** Relevé
le 1er août 2026 : `favicon.svg`, `favicon-96.png`, `apple-touch-icon.png`,
`logo.svg` et `og-jaquette.jpg` figuraient bien dans « Vidage récent » du
tableau de bord, mais pas `favicon.ico`. Il servait donc encore l'entrée d'avant
le redessin, avec **ses anciens en-têtes**, `max-age=604800` et `age: 208868`,
alors que `public/_headers` dit 3 600 depuis. Une entrée de cache garde les
en-têtes qu'elle avait à sa création : changer le fichier `_headers` ne touche
pas ce qui est déjà en cache, et Cloudflare ne l'aurait revalidé qu'au bout de
sept jours.

Le contenu servi, lui, était déjà le bon dessin, les empreintes SHA-256
concordant sur les cinq fichiers entre production, disque et `HEAD`. C'était
donc invisible à l'œil, et ça ne se serait vu qu'à la prochaine retouche du
logo, restée coincée une semaine. Purgé, mesuré aussitôt : `MISS` puis `HIT`
avec `age: 3`, et l'en-tête retombé à `max-age=14400`.

**La liste « Vidage récent » du panneau est le seul endroit qui dise ce qui a
été purgé.** La relire après une purge multiple, c'est elle qui a montré
l'oubli.

**Le fond de la tuile est un dégradé vertical, et il a d'abord été raté** : posé
en aplat `#14181c` avec un arrondi de 44, quand le node n'a ni l'un ni l'autre.
Les valeurs Tailwind rendues par `get_design_context` sont **semi-transparentes**
(`rgba(20,24,28,0.5)` en haut), donc elles ne disent rien tant qu'on ignore sur
quoi elles se composent. Ce qui tranche est l'export PNG du node, lu au pixel :

    haut #191B1D      60 % #15181B      bas #13171B      coins opaques, carré

Les PNG sont rendus depuis le SVG par Chrome sans interface, jamais dessinés à
la main, et **le SVG y entre en image de fond CSS encodée en base64** :

    body { width:180px; height:180px;
           background-image: url("data:image/svg+xml;base64,…");
           background-size: 180px 180px; }

Les deux autres façons ont été essayées et échouent en silence :
`<img src="file://…">` reste bloqué et sort une icône d'image cassée ; un
`<svg>` en ligne dimensionné en attributs rend **un pixel plus court que la
fenêtre**, donc la dernière ligne sort transparente, ce qui ne se voit qu'en
relisant les octets. Même famille de piège que le §9 : un rendu cassé ressemble
à un rendu réussi.

Même chose pour les polices d'`og-jaquette.html` : les servir par un serveur
local ne marche pas, le pare-feu de la machine refuse la connexion et la page
rendue est l'écran d'erreur de Chrome. Le chemin relatif du fichier, lui,
fonctionne tel quel.

`og-jaquette.jpg` a été refaite avec le mot-symbole à gauche du nom, même
lockup qu'au bandeau, et son décompte remis à 15 000 éditions, il annonçait
encore 8 400.

**Les fiches films gardent l'affiche nue, sans logo**, décision du 3 août 2026.
Le middleware **remplace** `og:image` par l'affiche TMDB au lieu de s'y ajouter
(cf. §7), donc un partage de fiche montre le film et rien d'autre. Le logo n'y
apparaît que sur l'accueil, les pages fixes et les pages de regroupement, qui
servent `og-jaquette.jpg`. Composer une image par film, affiche plus bandeau,
supposerait un rendu à la demande dans un Worker, son cache et un fichier par
œuvre ; l'affiche seule est par ailleurs ce qui fait cliquer, et c'est le choix
de Letterboxd comme de SensCritique. **Ne pas rouvrir sans raison neuve.**

### Anneau de focus du champ de recherche, le 3 août 2026

Le champ de la page d'accueil prend les trois couleurs du logo au focus, en
dégradé qui défile de gauche à droite, sept secondes par tour
(`.reel-anneau-logo` dans `theme.css`). Partout ailleurs le focus reste bleu :
un anneau tricolore sur chaque bouton ferait sapin de Noël, et le champ est la
seule chose que le site demande à quelqu'un qui arrive.

**Un dégradé ne tient pas dans un `box-shadow`**, donc pas dans un `ring-*` de
Tailwind. C'est une couche `::after` remplie du dégradé et évidée par deux
masques composés en `exclude`, ce qui ne laisse que le cadre de 2 px. Elle est
posée en `inset: -3px`, donc **hors** de la boîte comme l'était `focus:ring-2`,
et rien ne bouge à la prise de focus.

Trois détails qui ne se devinent pas :

- **les trois couleurs sont écrites deux fois** sur un fond large de 200 %, et
  l'animation pousse `background-position` de 200 % : c'est ce qui fait
  retomber le motif sur lui-même, sans couture rouge/cyan à chaque tour ;
- **de 200 % vers 0 et non l'inverse.** L'image étant plus large que la boîte,
  un `background-position` croissant la fait glisser vers la **gauche** ;
- **l'animation n'est déclarée que sur l'état focus**, sinon elle tourne en
  permanence sous une opacité nulle. Elle tombe sous `prefers-reduced-motion`,
  le cadre coloré restant : c'est lui qui porte l'information.

**Ne pas poser de `z-index` sur l'input.** Un `relative z-10` y avait été
ajouté avec l'anneau : l'input passait au-dessus de la loupe, qui est en
`absolute` sans empilement propre, et son fond opaque l'effaçait. L'anneau
étant hors de la boîte, il n'a besoin d'aucun empilement.

**Piège de mesure, rencontré trois fois** : `getComputedStyle(el, '::after')`
rend `opacity: 0` alors que la règle s'applique et que `:focus-within` matche.
Seule la capture d'écran dit vrai. Et dans le panneau d'aperçu, `input.focus()`
en JavaScript ne déclenche rien quand le panneau est masqué ; il faut un vrai
clic.

### Audience, premier relevé le 6 août 2026

Le chiffre qui commande tous les autres : **0 lien externe**. Search Console n'en
voit aucun, et c'est ce qui plafonne le classement, pas le contenu.

    10 clics | 469 impressions | 82 requêtes | position moyenne 14,5
    sur huit jours de mesure, du 28 juillet au 4 août

    13 493 URL au sitemap, lues le 5 août
       223 pages ayant reçu au moins une impression, soit 1,7 %
        28 liens internes vus par Google

**Deux pièges de lecture, tous deux rencontrés ce jour-là :**

- **le sélecteur de période ment.** Il propose « 28 jours » et affiche ce qui
  existe, ici huit. Lire les bornes sur le graphique, jamais le libellé du
  filtre : annoncer dix clics sur vingt-huit jours sous-vend le trafic d'un
  facteur trois et demi ;
- **Search Console a ~48 h de latence.** Les données s'arrêtaient au 4 août
  alors qu'on était le 6. Ce n'est pas un relevé périmé et recharger n'y change
  rien.

**Les 28 liens internes pointent des adresses mortes**, `/confidentialite`,
`/a-propos`, `/films/7`, c'est-à-dire les formes d'avant le renommage du 1er
août. L'index de Google est en retard d'une semaine sur le site, et les
anciennes URL reçoivent encore des clics : les 301 sont en cours d'absorption,
ce que le §7 annonçait à deux à quatre semaines. **Ne pas retoucher aux
adresses tant que ça n'est pas résorbé.**

**Ce que les requêtes disent, et c'est encourageant** : elles sont exactement
celles que le site vise, des codes-barres saisis tels quels (`5051889753537`),
des noms d'éditeur (`lcj editions`), des recherches d'édition précise
(`will hunting 4k`). Le créneau du §7 fonctionne à petite échelle ; il lui
manque l'autorité pour sortir de la page 2.

**Le levier est donc hors-site.** Les six éditeurs référencés ont chacun une
page `/publishers/…` qui les met en valeur et leur donne une raison de créer le
lien. Premier contact **Coin de Mire Cinéma le 6 août 2026**, par le formulaire
de leur site, en signalant explicitement que leurs visuels figurent au catalogue
et en proposant de les retirer à leur demande.

**Prévenir vaut mieux que se taire, et c'est un calcul, pas une politesse.** Le
§10 assume que l'usage des visuels d'éditeur est commercial donc discutable : un
éditeur prévenu qui ne dit rien vaut accord tacite, un éditeur qui découvre seul
écrit à un avocat. Et le refus coûte peu, la carte retombant sur l'affiche TMDB.
Ce qui ne se fait **pas** : invoquer un « droit de citation » ou un « usage
loyal », notions inexistantes en droit français dans ce sens, qui changeraient
un échange commercial en débat juridique.

### Awin

**E.Leclerc accepté le 3 août 2026**, premier programme validé, **Momox shop FR
le 6 août**, second. Fnac, Cultura, Zavvi et Cdiscount restent en attente, **tous
avec flux produits** (EAN, images, prix).

**Fnac a répondu, et son critère est le trafic.** « Nous n'acceptons pas sur les
programmes FNAC&DARTY les sites en construction ou qui n'ont pas de trafic
visible sur les outils comme SimilarWeb », avec l'invitation à revenir « lorsque
nous pourrons analyser le trafic ». Avec dix clics en huit jours, SimilarWeb ne
publie rien : représenter le dossier aujourd'hui, c'est récolter un second refus,
plus difficile à rouvrir qu'une attente. La relance du 6 août ne redemande donc
pas l'acceptation, elle signale le changement de nom, donne les chiffres tels
quels et demande le seuil à partir duquel revenir.

**Cultura relancé le 6 août**, sur un autre argument : leurs conditions
classent les partenaires, et **« sites de contenus affinitaires » est la seule
case autorisée sans réserve** qui corresponde au site. Le message s'y range
explicitement et écarte nommément leurs trois interdits, achat de mots-clés,
codes promo et CSS. À retenir pour les suivants : **lire la grille de l'annonceur
avant d'écrire**, elle donne le vocabulaire dans lequel se présenter.

**Momox a confirmé ce que le §8 attendait de lui et rien de plus** : c'est une
source de **prix d'occasion**, pas une source de catalogue (§5). Elle débloque la
valeur de collection, elle ne comble pas le creux 2000-2014.

Create-a-Feed s'est ouvert le jour de l'acceptation : il rendait « Feed not
found » tant qu'aucun programme n'avait validé, et c'était bien la cause, pas un
défaut de configuration. Flux retenu, mesure et chaîne au §5 et §6.

**Ce que l'acceptation débloque, par ordre d'importance** :

| | état au 3 août 2026 |
|---|---|
| offres réelles sur les éditions du catalogue | **fait**, 724 offres en ligne |
| nœud JSON-LD `Product` avec `offers` | à faire, condition levée (§7) |
| élargissement du catalogue par les 6 393 EAN neufs | soldé le 4 août (§5) |
| valeur de collection | **faite le 6 août**, par Momox et non par Leclerc (§8) |

**Chaque programme accepté demandera sa propre mesure.** Les six sources déjà
mesurées n'ont pas deux fois le même défaut, et Leclerc en apporte un inédit,
l'EAN parfait sans le format. Ne pas supposer que le flux Fnac ressemblera à
celui-ci.

#### Le répertoire, mesuré le 5 août 2026, et deux candidatures de plus

Export du répertoire filtré sur France et flux produit : **600 annonceurs**,
dont 478 français. Deux seulement valaient une candidature, et elles sont
parties le 5 août 2026.

**Momox, la seule source de seconde main du répertoire. Accepté le 6 août 2026**,
lendemain de la demande. « Spécialiste en achat/vente de livres, CD, DVD et jeux
vidéo », et c'est le point : le §8 posait que la valeur de collection, deuxième
fonction la plus demandée, était impossible sans un marchand d'occasion, et
qu'aucune de nos huit sources ne l'était. Ses conditions sont aussi les
meilleures du lot, 5 à 15 % de commission, 94,6 % de validation, cookie de
60 jours, statut de paiement vert. Mesure du flux au §5, et le programme s'appelle
« Momox shop FR (revente/outbound) » : c'est bien la boutique qui **vend** de
l'occasion, pas le service de rachat, donc ses prix sont des prix de vente.

**Cdiscount, pour le creux 2000-2014.** 3 à 8 %, 93,7 % de validation, et
surtout `productReporting: yes`, que seuls trois programmes portent avec Fnac
et Zavvi. Place de marché, donc du fonds épuisé en boutique.

**Ce qui n'est pas sur Awin, et qu'il faut cesser d'y chercher** : Carrefour,
Auchan, Amazon, Gibert, Easy Cash, Recyclivre, Micromania, HMV. Pour eux il
faudrait Effiliation, Kwanko, TradeDoubler ou leur programme propre.

**`productReporting: yes` ne dit pas que le flux porte le format.** Leclerc a
l'EAN à 100 % et le support sur 7,2 % des lignes, ce qui a coûté 6 393
interrogations dvdfr. La mesure se fait dans Create-a-Feed, après acceptation.

#### L'espace publicitaire déclarait encore le prototype Figma

**Le renommage de juillet 2026 avait laissé un objet derrière lui.** Le compte
s'appelle bien `Jaquette.app`, mais l'**espace publicitaire**, qui est ce que
l'annonceur consulte pour juger une candidature, pointait toujours sur
`https://boxology.figma.site/` — et ce prototype répond encore 200.

Fnac, Cultura et Zavvi ont donc examiné la candidature du 3 août **sur une
maquette Figma Make**, pas sur le site. Corrigé le 5 août, `Compte → Espaces
publicitaires`.

**C'est un réglage de tableau de bord, sans trace dans le dépôt**, comme HSTS
et la fermeture de l'inscription par courriel (§2 et §8) : d'où cette note.

**Awin demande alors de prouver la propriété du domaine**, et le §9 s'applique
mot pour mot. Deux méthodes proposées, fichier à la racine ou balise meta, et
la première **ne suffit pas ici** : Cloudflare Pages retire l'extension `.html`
et répond 308 vers la forme sans extension, alors qu'Awin interroge l'URL avec.

    /9a…c2.html   308  ->  /9a…c2
    /9a…c2        200      33 octets, le jeton

Les deux sont donc posées, `public/9a3309900ec9987a63d8812301e689c2.html` et
une balise dans `index.html`. Le jeton n'est pas un secret, au même titre que
l'enregistrement TXT de la Search Console.

**Et la réécriture SPA rend le contrôle par code HTTP inutile** : `_redirects`
fait répondre 200 à n'importe quel chemin en servant `index.html`, donc Awin
aurait « validé » sans fichier. Lire le corps, 33 octets contre 6 586.

#### Relayer une promotion de marchand, le 7 août 2026

momox shop a envoyé aux éditeurs une remise de 12 % sur l'occasion, code
`ETE12`, valable le **9 août 2026**. `src/app/lib/promotions.ts` et
`components/BandeauPromo.tsx`.

**Ce n'est pas une publicité extérieure**, et c'est ce qui a décidé de la
forme : 5 719 offres momox sont déjà à l'écran sur les fiches depuis
l'acceptation du 6 août, et `valeur.ts` s'en sert pour estimer une collection.
La remise porte donc sur ce que le site montre déjà.

Deux endroits, **un seul par page** :

- un encart sous la liste des éditions, **une fois par fiche** et non par
  ligne, quand une offre affichée vient d'un marchand en promotion. Un film à
  soixante éditions momox répéterait sinon soixante fois le même code, ce que
  le §7 reproche déjà à une mention posée partout. Le test porte sur l'offre
  **retenue** par `offreAAfficher`, pas sur celles en base ;
- un bandeau en bas de toutes les pages, fermable, avec le lien de campagne en
  pilule.

**L'encart de fiche ne porte aucun lien, à dessein.** Le prix au-dessus en a
déjà un, de tracking et **par produit**, et c'est celui qui atterrit sur le bon
disque ; un second lien vers la page de campagne ferait perdre le film qu'on
regardait. Le bandeau, lui, n'a pas de produit sous la main, donc il le porte.

**En bas et non en haut.** Le bandeau du site est en `fixed`, donc il ne réserve
aucune place dans le flux, et **dix-sept rembourrages hauts en dur** le
compensent page par page, de `pt-[72px]` à `pt-[152px]`. Une bande au-dessus les
fausserait tous les dix-sept, pour une promotion d'un jour.

##### Trois états, et le temps du verbe suit

C'est le cœur du module, et la seule chose à ne pas défaire :

    avant le 9    annonce   « 12 % sur l'occasion dimanche 9 août »
    le 9          active    « 12 % sur l'occasion aujourd'hui »
    apres         passee    rien, et rien a deployer

Le bandeau était demandé visible tout de suite. Écrire « aujourd'hui » un 7 août
serait le prix annoncé comme actuel alors qu'il ne l'est pas, que le §10 traite
en pratique commerciale trompeuse : l'annonce au futur donne le bandeau sans le
mensonge.

**La fenêtre s'évalue en heure de Paris, jamais sur l'horloge du visiteur.**
Comparer une date écrite sans fuseau la ferait interpréter dans celui du
navigateur. Les bornes portent donc `+02:00`, et vérifié sur huit instants :
un visiteur à Tokyo le 9 à 3 h locale, soit le 8 à 20 h à Paris, ne la voit pas,
et un visiteur à Los Angeles le 9 à 18 h, soit le 10 à 3 h à Paris, non plus.
Ni l'un ni l'autre ne pourrait utiliser le code chez momox.

**La borne de fin porte ses millisecondes**, `23:59:59.999` et non `23:59:59`.
Sans elles la valeur vaut `.000`, et comme la comparaison est inclusive, la
dernière seconde du 9 août n'affichait rien. Détail au §9, il vaut pour toute
borne de fin.

**`libelleJour` est écrit à la main et non calculé de `debut`** :
`toLocaleDateString` rendrait la date dans le fuseau du visiteur, donc
« samedi 8 août » à Los Angeles pour un instant qui est bien le 9 à Paris. Le
jour est une donnée du marchand, pas une conversion.

`quand()` est le **seul** endroit qui décide du temps employé, pour que le
bandeau et l'encart ne puissent pas diverger.

**La clé de fermeture porte l'état autant que le code.** Fermer l'annonce ne
doit pas faire taire le jour J, ce sont deux informations différentes et la
seconde est celle qui sert ; une clé sur le seul code aurait fait taire la
promotion chez quiconque a balayé l'annonce l'avant-veille.

##### Ce qu'on écrit, et ce qu'on n'écrit pas

`conditions` reprend **mot pour mot** ce que le marchand annonce. Le §10 pose
que le site n'est ni marchand ni intermédiaire de vente : on relaie une offre,
on ne la formule pas.

`conditionsCourtes` est un **second texte relu**, pas une troncature : couper
`conditions` à la longueur ferait un jour disparaître le montant minimum, qui
est justement ce qu'il ne faut pas taire.

**Le lien de tracking se recopie tel quel, sur une seule ligne.**
`awinaffid=3006883` est l'identifiant d'éditeur (§1), et le §3 pose que c'est la
seule valeur dont une faute est silencieuse. Vérifié identique à l'octet près et
résolvant en 302 vers le tracker momox avec `pubId=3006883`.
`rel="sponsored"` comme tous les liens marchands.

**Le courriel de momox se contredisait sur les dates**, et ça se consigne plutôt
que se corriger en silence : son visuel annonçait « Jusqu'au 09/08 », un
paragraphe « uniquement le 09/08/**2025** », ses conditions « uniquement le
09/08/2026 ». La seule ligne non ambiguë est celle des bornes,
`Beginnt: 09.08.26 00:00. Endet: 09.08.26 23:59 (Europa/Paris)`, et c'est elle
qui fait foi. « Jusqu'au » aurait annoncé une plage de plusieurs jours.

##### La forme, après un détour par Mobbin

**La pastille ronde a été essayée puis retirée.** Elle rendait le chiffre petit
pour tenir dans un rond, et rien dans le site ne parle en disques. Trois
bandeaux marchands relevés n'en posent d'ailleurs aucune : Seed fait porter la
promo par la couleur de la bande, adidas met une pilule pleine à droite, The New
Yorker joue l'emphase typographique.

Ce qui est repris est l'emphase, dans le vocabulaire du site : une **étiquette
de rayon**, cadre arrondi comme les capsules du §8. Fond en `color-mix` et non
en aplat d'accent, sinon elle se lit comme un bouton alors qu'elle ne mène nulle
part ; c'est la pilule qui se clique.

**Elle porte le code, et c'est un revirement.** Elle a d'abord montré « −12 % »,
qui redisait le début de la phrase à côté, puis « −12 % / OCCASION », qui
redisait la suite. Le code, lui, n'est écrit nulle part ailleurs et c'est la
seule chose que le lecteur doit **emporter** : il se recopie dans un panier, chez
le marchand, plusieurs minutes plus tard. Le mettre dans la plus grosse graisse
du bandeau, c'est le mettre là où on le retrouve. Il quitte donc la première
ligne, qui ne garde que le marchand, le taux et le jour.

**Et l'étiquette perd son `aria-hidden` du même coup.** Tant qu'elle portait le
taux, la phrase le redisait et la masquer ne coûtait rien ; portant le code, la
masquer le rendrait introuvable à un lecteur d'écran.

**Les couleurs sont celles du site, jamais celles du marchand.** Le §8 pose
qu'un logo ne suit pas la palette du site ; la réciproque vaut, le site
n'emprunte pas celle d'un marchand, et reprendre le disque rouge de leur
courriel reviendrait à republier leur création.

**Son fond n'est pas `--reel-surface`**, qui est celui des cartes d'édition
juste au-dessus, mais un mélange d'accent, filet du haut compris, et il va d'un
bord à l'autre. C'est le motif de Seed, où la couleur de la bande porte la
promotion à elle seule, et **c'est lui seul qui détache la barre du corps**.

**Le fond va d'un bord à l'autre, le contenu suit la gouttière.** Trois états
successifs, et le troisième est le bon :

    collé aux bords     etiquette et pilule a 700 px l'une de l'autre
    paliers de padding  96 px de marge, 1 320 px de contenu, encore trop large
    .reel-gouttiere     877 px, cale sur les verticales de la page

Ce qui détache le bandeau du corps, **c'est la bande colorée et pleine largeur,
pas un contenu désaligné**. Le raisonnement d'origine visait le fond et
s'appliquait au contenu par erreur : aligner le contenu sur la gouttière le
resserre et le pose sous le titre de la page, mesuré à 318 px des deux côtés.

**La mention d'affiliation tient en deux mots, « Lien affilié », et elle est
obligatoire.** « Offre du marchand, relayée ici. » prenait une ligne entière et
elle est partie, mais la pilule **est** un lien rémunéré : la retirer sans rien
laisser aurait fait du bandeau le seul endroit du site qui porte un lien affilié
sans le dire (§10). Elle paraît avec la pilule, à partir de `md` ; en dessous le
bandeau ne porte aucun lien, donc il n'y a rien à déclarer.

**Aucun `backdrop-filter`**, quelle que soit l'envie : le §8 en garde la trace,
un flou sur toute la largeur force une couche de composition et laisse peindre
des tuiles périmées, page dédoublée et décalée d'une centaine de pixels. Un
aplat opaque fait le même travail.

    1512 px   1 ligne + 1, hauteur 61, contenu 877 cale sur la page
     375 px   2 lignes + 1, hauteur 71, colle a la barre d'onglets

La pilule saute sous `md` : à 640 px elle poussait la phrase à trois lignes.

**Sur téléphone il est collé à la barre d'onglets, et cette hauteur se mesure.**
Un `bottom-[68px]` en dur laissait un jour visible : la barre fait 64 px et porte
en plus `env(safe-area-inset-bottom)`, donc sa hauteur dépend de l'appareil, et
elle a gagné un onglet « Scanner » entre-temps. Un nombre deviné se périme à la
première retouche de ce qu'il devine. Détail du piège d'observation au §9.

**L'étiquette est `aria-hidden`, donc le pourcentage reste dans la phrase.** Le
déléguer au visuel le rendrait inaudible d'un lecteur d'écran.

##### Une liste en dur, et pas encore une table

Le §3 pose qu'une table se justifie quand la donnée bouge sans qu'on déploie,
ce qui est le cas des prix. Une promotion arrive par un courriel qu'il faut de
toute façon lire, et son texte demande une relecture avant publication. Le
gabarit est là, la table se posera en une migration le jour où elles
s'enchaînent.

**Les entrées passées ne se suppriment pas** : elles ne s'affichent plus
d'elles-mêmes, et elles disent quel code a couru quel jour, ce qu'aucune autre
trace ne garde.

---

## 9. Pièges rencontrés

Documentés parce qu'ils se reproduiront.

### Parsing
- **Un cache indexé sur la réponse ne dit pas ce qui a été demandé.**
  `dvdfr/dvdfr.jsonl` porte `ean` quand la fiche existe et **seulement**
  `ean_demande` quand elle n'existe pas, avec `inconnu: true`. Compter les codes
  déjà traités sur la clé `ean` fait donc passer les inconnus pour jamais
  interrogés : j'ai annoncé « 82 EAN à crawler » avant que le crawler réponde
  `82 EAN, 11879 déjà faits, 0 à lire`. Le travail était fait, dvdfr ne connaît
  simplement pas ces codes. **Compter sur la clé de la demande, pas sur celle du
  résultat.**
- **dvdfr intervertit titre et réalisateur sur les captations de concert.**
  Relevé sur trois fiches sur trois d'un échantillon :

      "titre": "Johnny Hallyday", "realisateur": "Allume le feu"

  Le titre est *Allume le feu*. Sans garde-fou, un rattachement TMDB part
  chercher un film nommé « Johnny Hallyday », c'est-à-dire le motif constant du
  §9, le nom propre qui tombe sur un documentaire. Ces fiches sont des DVD,
  donc écartées par le filtre de support avant d'atteindre TMDB, mais le jour
  où une captation sortira en Blu-ray, la protection tombera d'elle-même.
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
- **Un libellé qui varie fabrique des pages, pas seulement du bruit.** 478
  écritures d'éditeur pour 70 familles : `Warner Bros.`, `Warner Bros
  Entertainment France`, `Warner Bros`, soit trois pages `/publishers` au lieu
  d'une. Le §7 se garde du contenu mince partout ailleurs et en produisait ici
  sans le voir. La normalisation en a retiré 66.

  **Trouver les familles par une racine calculée, décider à la main.** La
  racine fusionnait `TF1 Vidéo` et `TF1 Studio`, deux entités distinctes du
  même groupe, et aucune mesure ne l'aurait signalé : le libellé est la seule
  donnée disponible, il n'y a rien à confronter. Une table relue famille par
  famille est le seul garde-fou.
- **Le vocabulaire d'édition change avec la langue du catalogue.** La
  relecture des 1 557 orphelines Metaluna rendait **zéro** rattachement. Un
  scan qui rend zéro se vérifie (§10) : sur un échantillon de 60, **52
  n'obtenaient aucun candidat de TMDB**. L'anglais met l'épithète devant,
  `Limited Edition` là où le français écrit `Édition limitée`, donc
  `The Chronicles of Riddick 4K Limited Edition` partait tel quel. C'est le
  piège du suffixe de format, déjà consigné pour Criterion et blu-ray.com,
  appliqué à une langue de plus par les 55 collections anglophones du 3 août.
  Une fois `Metal Pack`, `Steelbook`, `Boxset`, `(STFR)` et les guillemets
  retirés : 315 liens, 57 films.
- **Un désaccord peut n'être qu'une différence de granularité.** Sur 995
  divergences d'éditeur entre dvdfr et blu-ray.com, la quasi-totalité étaient
  la même maison écrite autrement, `Universal Studios` contre `Universal
  Pictures Home Entertainment`. Même chose pour `disques` : 1 614 désaccords
  bruts, **trois** une fois lus les nombres écrits en toutes lettres,
  `Blu-ray Disc Three-disc set` contre `3`. Compter avant de normaliser
  invente un problème et masque le vrai, qui était l'éclatement des pages.
- **Deux colonnes du même nom ne mesurent pas forcément la même chose.**
  `editions.pays` dit le marché du disque, `films.pays` le pays de production
  de l'œuvre. Reprendre le `Pays` de dvdfr dans la première aurait écrit
  « États-Unis » sur 2 034 Blu-ray français, et le compte des désaccords, 4 529
  lignes, se lisait comme une source défaillante alors que les deux avaient
  raison. Vérifier ce qu'un champ mesure avant de le rapprocher d'un autre,
  surtout quand les noms concordent.
- **Un désaccord compté sur des chaînes n'est pas un désaccord.** Les 3 765
  divergences de zone entre dvdfr et blu-ray.com opposaient `2K Blu-ray:
  Region B (A, C untested)` à `B` : une fois normalisées, zéro contradiction
  franche sur 4 810 comparaisons. Normaliser avant de compter, sans quoi la
  mesure invente un problème.
- **Une absence écrite comme une valeur est pire qu'une absence.** Le parseur
  editioncollector posait `''` quand l'EAN manquait, là où les trois autres
  sources posent `null` : 375 lignes sur 5 383. Les deux comptes sont justes et
  ne mesurent pas la même chose, d'où l'écart entre le §4 et ce que rend un
  script. Le décompte n'est pas le risque, la déduplication l'est : un
  rapprochement filtrant `ean=not.is.null` ramasse les 375, et `'' = ''` est
  vrai, donc 375 disques sans rapport deviennent un seul. Nettoyé le 1er août
  2026, sauvegarde de la colonne entière dans `ean_avant_20260801.json`.
- **`btrim(ean)` ne retire que les espaces, pas les tabulations.** La règle
  ratait précisément la ligne qu'elle visait. Passer le jeu en toutes lettres,
  `btrim(ean, ' ' || chr(9) || chr(10) || chr(13) || chr(160))`.
- **Trois façons d'abîmer un EAN, toutes vues chez editioncollector** : une
  tabulation en tête, un suffixe `000` sur treize chiffres, et deux codes dans
  une même chaîne, `2630055458860, 3512394014763`. Couper le suffixe a fait
  apparaître le **premier doublon inter-sources du catalogue**, `Ocean's
  Collection` existant aussi chez blu-ray.com : le défaut de saisie masquait
  le disque.
- **Un code en `2xxxxxxxxxxxx` n'identifie rien hors du magasin.** Préfixe GS1
  20-29, circulation restreinte, attribué en interne par une enseigne, Fnac
  ici. Treize éditions n'ont que ça pour code, et l'ordre n'est pas stable
  quand la fiche en porte deux. À traiter comme absent dans toute
  déduplication, sous peine de rapprocher deux disques sans rapport.
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
- **Sans EAN, la déduplication inter-sources ne peut se faire que sur le
  titre, et elle doit se replier.** Le même disque s'annonce `Le Conseiller /
  Napoli spara!` chez blu-ray.com et `Le Conseiller + Napoli spara!` chez
  Metaluna, ou gagne un « – DigiPack » d'un seul côté. Retirer le vocabulaire
  d'édition et la ponctuation les rapproche ; restreindre au **même éditeur**
  empêche de confondre deux disques sans rapport. 11 doublons écartés ainsi.
- **Le compteur d'une collection Shopify ment sur le volume réel.**
  `collections.json` annonce 370 fiches pour Criterion, le listing paginé en
  rend 338 : l'écart est fait d'épuisés que la collection compte encore mais
  que `products.json` ne sert plus. C'est le listing qui fait foi.
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
- **Un réalisateur qui refait son propre film met les deux mesures en
  défaut.** `L'Homme au pousse-pousse` est d'Hiroshi Inagaki en **1943** et de
  nouveau en **1958** : même nom, durées compatibles, et « réalisateur et
  durée » validait le remake. Seule l'année les sépare, et la règle est
  **asymétrique** : un candidat postérieur au millésime du boîtier est un
  remake et se refuse, un candidat antérieur est le cas ordinaire où le
  boîtier porte l'année d'édition et non celle de l'œuvre, `Dr. Mabuse`
  annoncé 2025 pour un film de 1922. Un seul faux positif sur 80 liens, et il
  ne se voyait qu'en listant les écarts d'année du lot retenu : **relire un
  échantillon avant d'écrire**, une fois de plus.
- **La virgule ouvre un sous-titre autant qu'elle sépare les titres d'un
  coffret.** `Nosferatu, une symphonie de l'horreur` rend **zéro résultat**
  chez TMDB quand `Nosferatu` seul trouve le film. Couper à la virgule pour
  produire une **requête de plus** ne risque rien, ce sont les contrôles qui
  tranchent ; c'est l'écrire en base sans contrôle qui serait fautif. Ne pas
  confondre les deux usages du même découpage.
- **Le vocabulaire d'édition s'écrit aussi sans accent.** Une classe
  `édition\s+\w+` laisse passer `Caligula Edition Ultime`, que TMDB ne trouve
  pas. Même famille que les accents en majuscules et que `translate()` appliqué
  avant `lower()`.
- **Un nettoyage qui arrive après le découpage ne sert à rien.** Le découpage
  des doubles programmes coupe sur ` + `, et `(VF + STFR)` en porte un :
  `Speak No Evil (VF + STFR)` devenait `Speak No Evil (VF` puis `STFR)`, deux
  fragments que TMDB ne trouve pas. Le retrait de la mention de langue
  existait, mais dans la fabrique de requêtes, donc **après** l'éclatement.
  171 orphelines Metaluna portaient ce motif, et ce ne sont pas des raretés :
  `Inception`, `Furiosa`, `John Wick: Chapter 4`, `Tar`.

  **Symptôme à reconnaître, parce qu'il est trompeur** : le film est en base,
  la résolution le retrouve quand on la rejoue **à la main** sur la fiche, et
  l'édition reste orpheline malgré tout. Le verdict enregistré le disait
  pourtant, `"morceaux": 2` sur un titre qui n'en porte qu'un. Relire le
  verdict, pas seulement rejouer la fonction.

  Corollaire d'ordre : retirer le vocabulaire **avant** de découper, comme on
  retire les balises avant de déséchapper.
- **Deux estimations de rendement fausses le même soir**, l'une d'un facteur
  cinquante. Annoncer « 250 à 350 liens » sur une population de 171 supposait
  que le motif relevé était la **cause** de l'échec ; il n'en était qu'une
  corrélation. La preuve tenait en une ligne et je ne l'avais pas cherchée :
  `Speak No Evil` sans aucune mention de langue était orpheline aussi.

  **Compter une population n'est pas mesurer un rendement.** Tant qu'un
  échantillon n'a pas été rejoué de bout en bout, l'ordre de grandeur ne se
  donne pas.
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
- **Dédupliquer les résultats TMDB par identifiant jette le titre français.**
  `chercher()` interroge `en-US` puis `fr-FR` ; quand la seconde rend la même
  œuvre, son `(genre, id)` est déjà vu, donc la ligne était écartée **avec son
  libellé**. Une source à titres français ne trouvait alors jamais de
  correspondance exacte, alors que TMDB rendait bien la bonne œuvre :

      « Dune : Deuxième partie »      ->  Dune: Part Two (2024)        exact=faux
      « Sicario : La guerre… »        ->  Sicario: Day of the Soldado  exact=faux
      « Gremlins 2 : La nouvelle… »   ->  Gremlins 2: The New Batch    exact=faux

  **Invisible depuis le 2 août 2026**, Zavvi étant un catalogue anglophone, et
  fatal dès qu'on découpe un coffret français. Les libellés s'accumulent
  désormais dans `_titres` plutôt que d'être perdus, et un second nœud pour la
  même œuvre est exclu : il fausserait le tri par popularité et le compte des
  candidats. Corrigé le 4 août 2026 par `libelles()`, qui retombe sur les quatre
  champs bruts pour un candidat venu d'ailleurs, `collection/` par exemple.

  **Ce qui l'a fait sortir n'est pas un test, c'est un chiffre absurde** : un
  coffret `Dune + Dune : Deuxième partie` annoncé 314 minutes et résolu
  « 1/2 titres, somme 155 ». Un contrôle qui compare une somme rend visible ce
  qu'un contrôle par oui/non aurait tu.

  **La même faute était écrite une seconde fois**, dans
  `resoudre_metaluna.chercher()`, corrigée le soir même. Là-bas `fr-FR` court en
  premier, donc c'était le libellé **anglais** qui sautait, l'inverse exact. Ce
  que le §6 reproche à une seconde implémentation ne se voit jamais mieux que
  là : deux copies, deux bugs identiques, deux symptômes opposés, trouvés à des
  semaines d'intervalle. Rejouer les 1 224 orphelines Metaluna derrière n'a
  rendu que 3 éditions, l'effet espéré sur les catalogues anglophones n'existait
  pas (§8).
- **Un `wp-sitemap.xml` est un index, pas une liste de pages.** WordPress publie
  les deux formes : Diaphana sert `films-sitemap.xml`, plat, dont les `<loc>`
  sont les pages ; Solaris sert `wp-sitemap.xml`, dont les `<loc>` sont
  `wp-sitemap-posts-film-1.xml`. Un filtre sur `/film/` appliqué à l'index rend
  **zéro**, et la passe écrit alors des lignes sans aucune mesure — 50 sur 50,
  journal vert, `erreurs 0`. Suivre l'index d'un niveau, et sortir en erreur sur
  une énumération vide plutôt que continuer.
- **La catégorie de la boutique dit le format que le nom tait.** Solaris nomme
  `LA DANSE DE MORT – DVD` mais range aussi sous `DVD`, `Blu-rays`, `Affiches` :
  la catégorie trie les dérivés sans qu'on ait à lister un vocabulaire
  d'affiche et de livre.
- **La borne du « multiple entier = total de boîtier » dépend du type.** Pour un
  film, un lot dépasse rarement six disques et monter plus haut laisserait
  baptiser « multiple » n'importe quel écart. Pour une **série**, `duree_tmdb`
  est la durée d'un **épisode** et `Run Time` le total du coffret :

      Joe 90                        748 = 30 × 25
      Blue Planet II                600 = 10 × 60
      Keep Your Hands Off Eizouken  300 = 12 × 25

  La borne à six refusait douze coffrets de série au multiple entier et net, 24
  liens. Portée à quarante pour les séries seulement, le 4 août 2026.

  Ce qui reste refusé après ça ne se récupère pas en élargissant encore :
  `Mrs Biggs` 260 contre 40, `The Singapore Grip` 360 contre 55, où TMDB donne
  une durée d'épisode **moyennée** qui ne divise pas rond. Et de vrais
  désaccords, `Sin City` 142 contre 124, montage long contre sortie salle.
- **Un « 4K » n'est pas toujours un format de disque.** Les 213 fiches Coin de
  Mire en portent un, et 147 étaient marquées `Blu-ray 4K` alors que la boutique
  n'en vend que **sept** : `restauré en 4K`, `Nouveau master 4K`, `restauré en
  HD 4K`. La résolution d'une restauration n'est pas le support du disque, et le
  piège est général, tout éditeur de patrimoine écrit cette phrase. D'où une
  garde de contexte sur `restaur|master|scan|télécinéma|négatif|copie` plutôt
  qu'une exception par boutique.

  **Le contrôle qui l'a confirmé est venu d'ailleurs**, et c'est ce qui le rend
  probant : le `Support principal` de dvdfr sur les mêmes 213 codes rend
  `Blu-ray 137 | DVD 69 | 4K Ultra HD 7`, au disque près. Une seconde source vaut
  mieux qu'une relecture de son propre parseur.
- **Tester des motifs dans l'ordre et les collecter tous sont deux choses
  différentes**, et la règle « `Blu-ray 4K` avant `Blu-ray` » ne protège que la
  première. `depuis_titre()` retient **tous** les motifs qui répondent, or
  `blu-?ray` répond à l'intérieur de « Blu-ray 4K » : chaque 4K recevait donc
  aussi `Blu-ray`, 5 619 ajouts en simulation dont l'essentiel était ce faux, et
  `/formats/blu-ray` se serait rempli de 4K. Le refus se pose sur ce qui **suit**
  la mention, `blu-?ray(?!\s*(?:4K|3D|ultra\s*hd|uhd))`, et non sur la présence
  de « 4K » dans le titre : `Blu-ray + Blu-ray 4K` est un vrai combo dont le
  premier terme doit répondre.

  Deux motifs retirés au passage, pour la même famille de raison : `\bBD\b` pour
  le Blu-ray, alors que le flux Leclerc porte 5 986 **bandes dessinées**, et
  `\b3D\b` seul, qu'un titre suffit à déclencher.
- **Un support moins précis n'est pas un désaccord.** dvdfr range en `Blu-ray`
  des disques que le titre annonce en 4K ; ajouter le `Blu-ray` gonflerait
  `/formats/blu-ray` sans rien apprendre. C'est la granularité du §9 sur
  `Universal Studios` contre `Universal Pictures Home Entertainment`, appliquée
  au format. `formats.redondant()` ne vaut que pour les déductions à **support
  unique**, l'URL et dvdfr : un titre, lui, énumère, et ses deux mentions
  comptent.
- **Une part de collection TMDB sans année ni durée est une œuvre à venir.**
  `Untitled Top Gun 3` figure dans la collection et n'existe pas : elle gonflait
  le dénominateur d'un contrôle par la somme sans rien apporter au total, et un
  coffret de deux films passait pour complet à trois. Quatre coffrets étaient
  dans ce cas. C'est le plafond du §9 poussé jusqu'au bout, un disque ne peut pas
  porter une œuvre qui n'est pas sortie.
- **PrestaShop 1.6 balise en microdonnées, pas en JSON-LD.** Le titre est dans
  `<h1 class="page-heading" itemprop="name">`, et un parseur qui ne cherche que
  le nœud `Product` rend **104 titres vides sur 104** — sans erreur, avec un
  `ok 104 | erreurs 0` en fin de journal. Le §9 dit qu'un scan cassé se lit
  comme un scan négatif ; ici il se lisait comme un scan **réussi**.

  Le symptôme à connaître est le même que pour dvdpascher et son `s DVD` :
  **une valeur constante sur tout un lot signale qu'on lit le gabarit et non la
  donnée.** Ici la constante était la chaîne vide, ce qui la rend plus discrète
  qu'une valeur fausse.
- **Une comparaison de format doit chercher dans la valeur, pas l'égaler.**
  Metaluna écrit `Combo Blu-ray + DVD` d'une pièce, un crawl de boutique rend
  `["Blu-ray", "DVD", "Combo"]` : l'égalité stricte rendait `None` sur toutes
  les lignes Metaluna, donc aucune clé ne concordait, et le rapprochement
  tombait de 34 possibles à 15. Chercher `Blu-ray 4K` **avant** `Blu-ray`,
  sinon un 4K se lit comme un Blu-ray simple.
- **Les identifiants de catégorie ne sont pas contigus.** Rimini va de 11 à 23
  mais **21 n'existe pas**, et un 404 traité comme une panne tuait
  l'énumération aux trois quarts, en perdant tout puisque l'écriture n'a lieu
  qu'à la fin. Un trou dans une numérotation n'est pas une panne.
- **Un rapprochement se fait entre deux chaînes préparées de la même façon**, et
  une asymétrie de traitement se déguise en problème de données. Le nettoyage de
  titre d'`enrichir_ean.py` n'était appliqué qu'au produit de boutique, alors
  que les titres en base portent les mêmes formes :

      boutique   Viva Erotica
      base       Viva Erotica (avec fourreau)

  **Le diagnostic posé là-dessus était faux**, et il est resté écrit une nuit :
  « Spectrum titre en version originale là où Metaluna titre en français, il
  faudrait un rapprochement par titre traduit ». Le rapprochement par titre
  d'œuvre a bien été essayé, il rendait 14 candidats ; la simple symétrie en
  rend 27, sans rien assouplir. Chercher une explication dans la nature des
  données avant d'avoir vérifié qu'on traite les deux côtés pareil coûte un
  chantier entier.

### Infrastructure
- **Une boucle d'attente sur `pgrep -f <motif>` se reconnaît elle-même.** Un
  `until ! pgrep -f crawl_dvdfr; do sleep 20; done` contient la chaîne
  `crawl_dvdfr` dans sa propre ligne de commande : `pgrep` la trouve, la
  condition ne devient jamais vraie, et la surveillance attend indéfiniment un
  processus **qui est elle-même**. Deux surveillants perdus ainsi le 4 août
  2026, alors que le crawl était fini depuis un moment.

  Surveiller un **marqueur du journal** ou un compte de lignes en sortie, pas
  un nom de processus qui figure dans la commande de surveillance.

  **Refait le 6 août 2026, cette note sous les yeux**, sur
  `pgrep -qf "resoudre_leclerc.py --source leclerc"`. Ce qui la rend facile à
  ignorer, c'est qu'elle se lit comme une curiosité de `pgrep` alors que c'est
  une propriété de toute surveillance qui se nomme elle-même. La forme sûre
  n'est pas un `pgrep` mieux écrit, c'est de ne pas surveiller un processus :
  `until grep -q "<phrase finale>" journal.log`.
- **`sorted(dossier.glob("*.csv.gz"))[-1]` n'est le plus récent que tant qu'il
  n'y a qu'un marchand.** `croiser_leclerc.py` prenait le dernier fichier par
  ordre alphabétique, ce qui a marché tant que `brut/` n'a porté que du
  Leclerc. Le flux Momox du 6 août 2026 est passé après `leclerc-…` : le
  croisement a tourné sur **Momox** en annonçant du Leclerc, et il a rendu
  855 DVD au lieu de 3 478, chiffre assez plausible pour être rapporté tel
  quel. Filtrer sur le préfixe du marchand, et sortir en erreur plutôt que de
  se rabattre sur le voisin.
- **dvdfr refuse aussi l'IP des runners, et la mesure est sans appel.** Le run
  du 2 août 2026 a demandé 2 720 fiches depuis un runner : `trouvés 0 |
  inconnus 0 | erreurs 2720`, une `HTTPError` sur chacune dès la première.
  Trois heures quarante-huit pour rien, et un job sorti **vert**. Le lendemain,
  même code, même délai, mêmes en-têtes, depuis la machine de l'éditeur :
  **5 440 codes, zéro erreur.** Deux sources sur deux, même verdict.

  Le compteur d'erreurs existait déjà mais personne ne le lisait avant la fin,
  les logs d'un job en cours n'étant pas consultables. `crawl_dvdfr.py` a
  désormais les garde-fous de `crawl_zavvi.py` : arrêt à cent fiches sans un
  seul succès, soit cinq cents secondes au lieu de sept heures, puis au-delà
  d'un cinquième d'échecs.
- **blu-ray.com refuse l'IP des runners GitHub, et ce n'est pas un 403.**
  Mesuré le 2 août 2026 : après une vingtaine de minutes d'énumération
  réussie, page 97 des coffrets, `<urlopen error [Errno 111] Connection
  refused>` sur les trois tentatives. Un refus au niveau TCP, la connexion
  n'étant même pas acceptée, donc un pare-feu et non l'application. La même
  passe, même code, même délai, **passe depuis la machine de l'éditeur** et va
  au bout des trois catégories. Une plage d'IP de datacenter se fait bannir là
  où une connexion domestique passe.

  D'où le partage : collecte locale, import sur Actions, et l'état échangé par
  le bucket R2 plutôt que par le réseau. `maj-bluray.yml` garde une entrée
  `collecter`, à faux par défaut : elle a servi à mesurer, elle n'a plus à
  servir.
- **Quatre pièges d'outillage de sonde, tous rencontrés en une soirée sur les
  comparateurs (§5), et tous de la même famille : l'instrument rend zéro et on
  le lit comme une réponse.**

  **`RobotFileParser.read()` fait sa propre requête, sous son propre agent, et
  traite un 403 sur `robots.txt` comme un `Disallow: /` global.** dvdpascher
  autorise pourtant tout à `User-agent: *` ; son pare-feu refusait simplement
  `Python-urllib`. « Ils interdisent » et « je n'ai pas pu lire la règle » se
  ressemblent trait pour trait et ne mènent pas au même endroit. Récupérer le
  fichier soi-même, garder le statut, et ne procéder que sur un **404 franc**.

  **`--virtual-time-budget` fait pendre Chrome 150 en `--headless=new`**, y
  compris sur `example.com`. Un drapeau qui casse une page témoin ne se
  diagnostique jamais sur la page qu'on soupçonne.

  **`chrome --dump-dom` imprime un DOM complet puis ne rend jamais la main.**
  Le dépassement de délai est le fonctionnement normal ; traité comme une
  panne, il jette précisément ce qu'on venait chercher. Tuer le processus et
  **garder ce qui a été écrit**, la balise fermante faisant foi plutôt que la
  taille.

  **`timeout` n'existe pas sur macOS**, c'est `gtimeout`. Un harnais de
  diagnostic bâti dessus rend `exit=127` et zéro octet, soit exactement
  l'allure d'un site qui ne répond pas.
- **Un 404 à zéro octet a deux causes, et une seule les sépare.** La fiche a
  disparu, ou l'index pointe un slug que le site a renommé. Rejouer le **même
  identifiant sous plusieurs formes de slug** tranche : un seul 200 prouve que
  le catalogue est intact et que c'est l'index qui ment. `diag_morts.py` le
  fait, et c'est ce qui a définitivement écarté dvdpascher, trente requêtes
  sans une seule réponse.
- **Les entités HTML non déséchappées font passer une source riche pour une
  source vide.** Première mesure de dvdpascher : éditeur, date, zone, prix et
  image à **0 %**, alors que la page porte les cinq. `&euro;` et `&eacute;`
  cassaient les motifs. Retirer les balises **puis** déséchapper, jamais
  l'inverse, sous peine de fabriquer des balises à partir du contenu.
- **Un libellé cherché sans ancre se fait attraper dans le menu.**
  `[EÉ]diteur` trouvait « Portail **Editeur**s DVD » et rendait `s DVD` comme
  éditeur sur les 21 fiches du lot. **Une valeur constante sur tout un
  échantillon signale qu'on lit le gabarit et non la donnée**, et c'est le
  seul symptôme : le taux de couverture, lui, affichait un impeccable 100 %.
- **Deux URL peuvent servir la même ressource, et un compteur ne le voit
  pas.** dvdpascher sert `films-a.html` et `films-A.html`, 1 162 836 octets
  des deux côtés : la sonde rechargeait la lettre A et annonçait « 0 fiches
  neuves », ce qui se lit comme une fin de listing. Dédoublonner sur
  l'**empreinte du corps** et non sur l'URL, comparer les URL sans la casse
  étant un pari que deux chemins ne diffèrent jamais que par là.
- **Le `venv` de `~/jaquette-scraping` est mort depuis le déménagement du
  dépôt.** Son shebang pointe encore
  `/Users/rayan/Documents/boxology-scraping/venv/bin/python3`, chemin qui
  n'existe plus, donc `venv/bin/pip` rend « bad interpreter » et aucune
  dépendance de `requirements.txt` n'est installée sur la machine. Les passes
  s'en moquent, elles tournent sur Actions où le socle installe tout ; mais
  **rien ne s'exécute plus localement**, y compris pour éprouver un script
  qu'on vient d'écrire. Relevé le 4 août 2026 en testant `signalements.py`. Un
  `python3 -m venv --clear venv` le répare ; en attendant, une exécution locale
  se teste en injectant les modules manquants par `PYTHONPATH`, ce qui a le
  mérite de ne rien installer sur la machine.
- **Un agent launchd ne peut pas lire `~/Documents`.** Les deux agents
  échouaient en 127, `/bin/zsh: can't open input file`, et la passe de
  popularité affichait `runs = 0` depuis son installation : elle n'avait
  jamais tourné, son unique ligne de journal venant d'un lancement à la main.
  Le défaut est **muet**, le catalogue paraissant à jour sans l'être.

  **Autoriser `/bin/zsh` puis le binaire Python ne change rien** : macOS
  attribue l'accès au *processus responsable*, qui pour un agent launchd est
  le programme déclaré dans le plist, et les autorisations données aux enfants
  ne rattrapent pas cette attribution. Le correctif est de sortir le dépôt du
  dossier protégé, `~/jaquette-scraping`, la racine du dossier personnel n'en
  étant pas un. Il vaut aussi pour la suite : le chemin du binaire Homebrew
  porte le numéro de version, `python@3.14/3.14.6`, donc la moindre mise à
  jour aurait invalidé l'autorisation.
- **Dans GitHub Actions, `skipped` se propage de façon transitive**, et un run
  qui n'a rien fait ressort **vert**. Rencontré deux fois le 2 août 2026 sur
  la même chaîne. Avec `run_crawl`, le job `crawler` est sauté ; `miroir` s'en
  relève par son `if`, mais tout job qui dépend d'un job ainsi relevé hérite
  du saut faute de garde propre. Un `if` qui ne référence aucune fonction
  d'état se voit ajouter `success()`, lequel remonte la chaîne.

  La première fois, l'écriture a été sautée : quarante minutes de résolution
  TMDB pour aucune simulation. La seconde, corrigée à moitié seulement, c'est
  le **déploiement** qui a sauté après une écriture de 4 446 éditions, donc le
  site est resté sur ses données de la veille sans que rien ne le signale.

  La règle : **dans une chaîne où un job se relève par `if`, tous ceux qui le
  suivent doivent porter le leur, jusqu'au dernier.** Et la garde s'écrit
  `!= 'failure'` plutôt que `== 'success'`, seule forme qui tolère un amont
  sauté sans avaler un amont tombé.

      if: ${{ !cancelled() && needs.amont.result != 'failure' }}

- **Déclarer un bloc `permissions` remplace le jeu entier**, tout ce qui n'y
  figure pas tombant à `none`. Un `permissions: issues: write` posé pour le
  récapitulatif retirait donc `contents: read`, et `actions/checkout` échouait
  sur « Repository not found », message qui se lit comme un dépôt supprimé
  alors qu'il ne dit qu'un droit manquant. La règle vaut **à chaque niveau**,
  chez l'appelant comme dans le workflow appelé : le corriger d'un seul côté
  ne suffit pas.
- **Un workflow réutilisable ne peut pas demander plus de droits que son
  appelant, et GitHub refuse alors *au démarrage*.** `recapituler.yml` déclare
  `permissions: issues: write` pour ouvrir son issue ; l'appelant, lui, n'en
  déclarait aucun. Résultat, `startup_failure` : **aucun job, aucun journal,
  aucune annotation exposée par l'API**, et c'est l'appelant entier qui tombe,
  pas seulement le job appelé. Le droit se déclare **chez l'appelant**, sur le
  job qui appelle :

      recapituler:
        needs: publier
        permissions:
          issues: write
        uses: ./.github/workflows/recapituler.yml

  Ce qui rend ce piège coûteux, c'est que rien ne le montre. `actionlint` ne
  voit rien, l'API rend `startup_failure` et s'arrête là, et les workflows
  voisins continuent de passer tant qu'ils n'appellent pas le fautif. Ce qui
  l'a trouvé est une **branche jetable et six runs d'une seconde** : rejouer
  d'abord le fichier *d'origine*, ce qui a mis les modifications récentes hors
  de cause, puis retirer les appels réutilisables, puis remonter pièce par
  pièce. La bissection sur le fichier bat l'hypothèse, ici comme ailleurs.

  Fausse piste écartée en chemin, et qui semblait bonne : `if: >-` sur deux
  lignes. **YAML ne replie pas une ligne plus indentée**, donc l'expression
  gardait un saut de ligne au milieu du `${{ }}`. C'était un vrai défaut, il
  ne causait pas celui-là.
- **Un job parallélisé trop tôt travaille sur une question qui n'est pas encore
  posée.** Le miroir Zavvi ne dépendait que du crawl, pour tourner pendant la
  résolution TMDB et gagner une heure de mur. Mais il ne pouvait pas savoir
  quelles fiches seraient retenues : 11 498 images recopiées pour 3 154 Mo en
  quatre heures, quand 4 446 éditions ont été écrites. Une heure gagnée, deux
  heures et demie perdues. **Le parallélisme n'est un gain que si l'étage
  parallèle n'a pas besoin du résultat de l'autre.**
- **Un rattachement validé par un seul contrôle n'est pas validé deux fois.**
  Les fonctions de contrôle rendent à la première mesure qui concorde, donc
  l'autre n'est jamais consultée. Sur Zavvi, 5 021 liens « sûrs » se
  partageaient en 3 153 par la durée seule et 1 868 par le réalisateur seul,
  zéro par les deux, et les confronter à la mesure inemployée en a démenti
  **11,1 %**. Le niveau de confiance d'une passe dit ce qu'elle a vérifié, pas
  ce qui est vrai.
- **Le `select` de `postgrest-js` doit être une chaîne littérale, jamais une
  concaténation.** La bibliothèque infère le type de la réponse depuis le
  **texte** du `select` ; une expression le lui rend opaque, et l'erreur ne
  tombe pas sur la ligne fautive mais dix plus bas, sur le `map` :

      error TS2339: Property 'edition_films' does not exist on type
                    '{ error: true; } & String'

  Rencontré le 6 août 2026 en ajoutant `etat` à `getEditionsForFilm`, en coupant
  la chaîne sur deux lignes pour tenir la largeur. Le message ne dit rien de la
  cause, et le réflexe est d'aller chercher un champ manquant dans le schéma.
- **Le corps injecté contient des `</div>` imbriqués**, donc une sonde
  `<div id="root">(.*?)</div>` rend zéro et se lit comme un corps vide. Trois
  pages annoncées à « 0 signe » ce jour-là, alors que `grep` sur le brut
  trouvait le texte attendu. Variante du §9 dans son propre terrain, et le
  contrôle qui tranche est le même : passer le motif sur quelque chose dont on
  sait qu'il contient la réponse.
- **Une boucle d'attente sur `pgrep -f <motif>` se reconnaît elle-même**, déjà
  consigné plus haut ; le même piège existe pour les captures d'écran après un
  défilement programmé (§8), et il a de nouveau coûté deux captures blanches le
  6 août 2026. Ce qui marche : redimensionner l'onglet assez haut pour que la
  cible soit dans la page, puis recharger.
- **`npm run build` lance `tsc --noEmit` d'abord.** Sans lui, rien ne relisait le
  code : esbuild ne vérifie pas les types, et un identifiant JSX dont l'import a
  été retiré devient une référence globale résolue à l'exécution. Un `Search`
  ainsi perdu a fait écran blanc sur tout le site sans que le build bronche.
  `strict` reste désactivé, les écrans hérités de Figma Make noieraient le
  signal sous des centaines d'erreurs de nullité.
- **Un avis `npm audit` se lit sur le mode employé, pas sur le paquet.**
  react-router porte le 2 août 2026 douze avis dont onze ne visent que le mode
  framework, le rendu serveur ou RSC : l'application est en `BrowserRouter`
  déclaratif, sans routeur de données, sans action, sans chargeur. Monté de
  7.13.0 à 7.18.2 ce jour-là, avec Vite de 6.3.5 à 6.4.3, ce qui solde tout ce
  qui s'applique. **Le `high` restant, « RSC Mode CSRF Bypass », ne se corrige
  qu'en react-router 8, un changement majeur, et il ne concerne pas ce site.**
  Ne pas prendre la version 8 pour ce seul motif, `npm audit` ne sait pas quel
  mode on utilise. Vérifié après montée : `tsc` vert, navigation client,
  bouton retour, recherche approchante, pagination et 301 du middleware.
  Vite est un outil de construction, ses avis ne portent que sur le serveur de
  développement, jamais sur ce qui est servi en production.
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
  servi ou compter les URL du sitemap.

  **Le tableau de bord n'est plus la seule source de la cause d'un échec**, et
  c'est la correction du 5 août 2026 : `wrangler` donne le statut par commit, et
  l'API rend le journal de build entier.

      npx wrangler pages deployment list --project-name jaquette
      GET /accounts/<acc>/pages/projects/jaquette/deployments/<id>/history/logs

  Le jeton OAuth suffit pour les deux, et il est dans
  `~/Library/Preferences/.wrangler/config/default.toml` et **non** dans
  `~/.wrangler/`, contrairement à ce que dit le §8 : ce dernier chemin n'existe
  pas sur la machine. C'est ainsi qu'on a su, le 5 août, que le build de
  `1fd1c63` passait et que seul le sitemap tombait.

  À savoir avant de chercher ailleurs : **un déploiement en échec n'est pas un
  déploiement en retard**, et rien ne les distingue vu du site. Le site sert
  simplement la version d'avant, indéfiniment.
- **Une lecture de build qui rate ne doit pas coûter un déploiement.** Le build
  de `1fd1c63` est tombé sur un seul `formats/Blu-ray : HTTP 500`, la première
  des 210 lectures d'effectif de `generer-sitemap.mjs`. La même requête rendait
  206 en 0,14 s quinze minutes plus tard, trois fois de suite sur trois formats :
  un hoquet de PostgREST, et rien n'était cassé.

  Les quatre lectures des deux scripts de build passent depuis par un `demander`
  qui rejoue trois fois, une puis trois secondes. **Seuls les 5xx et les pannes
  réseau se rejouent** : un 4xx dit qu'on demande mal, un filtre fautif ou une
  colonne disparue, et il doit casser le build tout de suite, c'est le garde-fou
  qui empêche de publier un sitemap tronqué (§7).
- **Une sonde de déploiement se vérifie comme un scan.** Le même jour, un
  `grep 'mt-\[11px\]'` sur le CSS servi a rendu zéro pendant douze minutes, ce
  qui se lit exactement comme « pas encore déployé ». Le CSS écrit
  `mt-\[11px\]` avec de **vraies** barres obliques inverses, échappement Tailwind
  des crochets, donc le motif ne pouvait rien trouver. La sonde était morte, pas
  le déploiement.

  Le contrôle qui tranche est celui du §9 : passer le même motif sur le fichier
  **construit en local**, où l'on sait que la règle existe. Zéro des deux côtés
  accuse la sonde. Prendre un marqueur qui ne s'échappe pas, `margin-top:11px`
  plutôt que le nom de la classe.
- **Le hachage du bundle ne vaut comme repère que si le build local part de
  `HEAD`.** Mesuré le 3 août 2026 : un `npm run build` lancé dans un répertoire
  où une autre session laisse `TopBar.tsx` et `regroupements.ts` modifiés
  produit un bundle que Cloudflare ne produira **jamais**, puisqu'il ne voit que
  ce qui est commité. On attend alors un nom qui n'arrivera pas.

  Le compte d'URL du sitemap n'est pas meilleur : il se génère depuis la base,
  qui grossit entre le build local et celui du serveur.

  **Prendre un repère déterministe, issu du code et non de la base.** Ce jour-là
  c'était la disparition de `/legal` du sitemap servi, conséquence directe d'une
  ligne modifiée. Un marqueur qu'on a écrit soi-même vaut mieux qu'un hachage ou
  qu'un décompte.

  Corollaire du même épisode : trois noms de bundle successifs en quelques
  minutes ne signalent pas une panne, mais **plusieurs déploiements en vol**.
  Une autre session avait poussé par-dessus. Vérifier `git fetch` avant de
  chercher plus loin.
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
- **Une borne de fin écrite à la seconde ouvre un trou d'une seconde.**
  `2026-08-09T23:59:59+02:00` vaut `.000` : avec une comparaison inclusive,
  `t <= fin`, tout ce qui tombe entre `23:59:59.001` et `23:59:59.999` est déjà
  dehors. Le bandeau promo du 9 août aurait donc disparu une seconde avant la
  fin de la journée.

  Une seconde ne se voit pas, et c'est précisément ce qui la rend coûteuse :
  elle se recopie dans la borne suivante sans que personne ne la remarque. Deux
  écritures justes, `…T23:59:59.999+02:00` pour une fin inclusive, ou la borne
  du jour suivant à minuit avec une comparaison stricte, `t < fin`. La première
  a été retenue ici, elle dit le jour qu'on veut plutôt que le lendemain.

  **Trouvé en éprouvant le rendu, pas en relisant le code** : la relecture
  voyait « 23 h 59 min 59 s », donc la fin de la journée. C'est le §9 sur les
  scans appliqué au temps, une borne qui a l'air juste se mesure.
- **`ResizeObserver` saute les éléments en `display: none`, il ne les rapporte
  pas à zéro.** La spécification les exclut de l'observation, donc **aucun
  rappel ne part** quand un élément se masque, et la dernière taille mesurée
  reste posée pour toujours. Le bandeau promo calait sa position sur la hauteur
  de la barre d'onglets mobile : au passage du téléphone au bureau, la barre
  passait en `md:hidden`, l'observateur se taisait, et le bandeau flottait à
  64 px du bas d'un écran de 1 280.

  Le défaut est **muet** et il ne se voit que dans le sens masquage : à
  l'apparition, l'observateur se réveille et corrige. D'où un écouteur de
  redimensionnement en plus de l'observateur, qui lui se déclenche au
  franchissement du palier. Et `offsetHeight` plutôt que
  `getBoundingClientRect`, les deux rendant 0 sur un `display: none` mais le
  premier le disant sans forcer de calcul de disposition.

  Règle générale : **une hauteur d'élément fixé ne se met pas en dur.** Ici
  `bottom-[68px]` a tenu quelques heures pour une barre qui fait 64 px, qui
  porte en plus `env(safe-area-inset-bottom)` donc dépend de l'appareil, et qui
  a gagné un onglet entre-temps.
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

### Contrôles de présence
- **Une frontière de mot ne suffit pas à dire qu'un titre est présent.** La
  sonde Awin cherchait les 19 absents du banc d'essai (§8) avec `\btitre\b` sur
  les noms de produits, et annonçait 7 trouvés. Relecture à l'œil : 4. `Armageddon`
  matchait `Armageddon Time`, `Obsession` matchait `Obsession fatale`, `Assaut`
  matchait `À l'assaut du Fort Clark`.

  La frontière de mot corrigeait déjà une faute plus grossière, la sous-chaîne
  nue, qui faisait passer `Agora` pour trouvé dans « agoraphobie » et `Alpha`
  dans « alphabet ». Elle ne corrige pas celle-ci : **un titre qui contient le
  titre cherché n'est pas le même film**, et c'est le motif constant du §9,
  l'homonyme, vu depuis l'autre bout.

  Ce qui rend la mesure lisible : **imprimer le titre trouvé à côté de la
  demande**, jamais un décompte seul. Un « 7/19 » ne se dément pas, un
  « Armageddon → Armageddon Time » se dément d'un coup d'œil.
- **Un flux marchand n'annonce pas ce qu'il ne vend pas.** Corollaire du même
  épisode : ne pas conclure d'un « 4/19 » que la source est mauvaise. Elle est
  excellente sur ce qu'elle porte, elle ne porte simplement pas de fonds.

### Front et navigateur
- **`\w` ne couvre pas les lettres accentuées en JavaScript**, et un garde de
  contexte s'ouvre en silence. `formatDepuisTexte` refuse de lire un format dans
  « restauré en 4K », qui décrit une restauration et non un support, par
  `/(restaur|master|scan|…)\w*\s+(en\s+)?(4k|uhd)/`. Le `\w*` s'arrête avant le
  « é », le `\s+` échoue, et la garde ne mord pas : « restauré en 4K » repassait
  pour un disque 4K. `\S*` règle le cas. C'est le piège du §9 sur `translate()`
  appliqué avant `lower()`, dans une autre grammaire, et **il n'a été trouvé que
  par un test** — à l'œil, la fonction rendait une valeur plausible.
- **Une bibliothèque WebAssembly va chercher son `.wasm` sur un CDN par
  défaut.** zxing-wasm pointe `fastly.jsdelivr.net`, ce que la CSP refuse et ce
  que le §10 interdit. Le symptôme serait celui du §3 : la caméra s'ouvre, rien
  n'est jamais détecté, requête à zéro octet et zéro statut. Vérifier ce qu'une
  dépendance télécharge **à l'exécution**, pas seulement ce qu'elle pèse.
- **`Permissions-Policy` ferme aussi la porte à sa propre origine.**
  `camera=()` n'interdit pas « les tiers », il interdit tout le monde, nous
  compris : `getUserMedia` échoue avant même la demande d'autorisation, donc
  sans refus visible ni message utile. Il faut `camera=(self)`.
- **`wrangler pages dev` prend la date du jour comme `compatibility_date`**, que
  son binaire ne supporte pas toujours encore : « This Worker requires
  compatibility date 2026-08-07, but the newest date supported by this server
  binary is 2026-08-06 ». La prévisualisation ne démarre alors **pas du tout**,
  et le message ne ressemble pas à un problème de version d'outil. Le drapeau
  est posé dans `.claude/launch.json`.
- **Un `useState(() => …)` n'est pas un `useEffect`.** L'initialiseur paresseux
  tourne pendant le rendu et sa valeur de retour est prise pour l'état, donc la
  fonction de nettoyage n'est jamais appelée et rien ne se rejoue au changement
  de dépendance. Écrit une fois dans `ImportPage`, corrigé avant de tourner :
  ça se lit comme un effet et ça n'en est pas un.

### Doublons et duplication silencieuse
- **Un lot doublé ressemble à un lot sain.** Le crawl The Jokers a rendu 292
  fiches, zéro erreur, couverture à 100 % sur l'EAN, le prix et l'image. Il n'y
  avait que 146 produits : Shopify publie un sitemap par locale,
  `sitemap_products_1.xml` et `/en/sitemap_products_1.xml`, mêmes bornes. Aucun
  compteur de la passe ne pouvait le dire.

  **Ce qui l'a montré est le décompte des valeurs distinctes**, 100 EAN pour
  200 disques. Compter les lignes ne suffit jamais ; compter les clés, si.
  Variante du §9 qu'on n'avait pas : jusqu'ici « un scan cassé ressemble à un
  scan négatif », désormais aussi « un scan doublé ressemble à un scan riche ».
- **Vérifier le presse-papiers puis s'en servir dans deux commandes ne vérifie
  rien.** Entre les deux, il change. Le 4 août, un `pbpaste | gh secret set` a
  posé un fragment de terminal à la place d'une clé API, parce que la
  vérification était dans l'appel précédent. La forme juste lit **une fois**,
  contrôle, et **refuse** si ça ne colle pas, dans la même commande.
- **Un refus consigné doit rester un refus.** Une passe d'écriture qui ne met
  en cache que les rattachements retenus fait retomber les refusés dans son
  repli, qui les rerésout avec d'autres règles. Le taux monte et paraît
  meilleur : c'est la relecture contournée. Mettre en cache **l'ensemble des
  candidats examinés**, pas seulement ceux qui ont passé.
- **Relire la base, jamais son propre fichier.** Sur The Jokers, 36 des 65
  rattachements sûrs étaient déjà en base : l'import Leclerc de la même journée
  avait fait entrer les mêmes disques, et la liste d'EAN neufs datait d'avant.

### Rattachement sans plafond
- **Sans année ni date de parution, le contrôle le plus rentable du dépôt ne
  s'applique pas**, et la durée seule ne suffit pas. Mesuré sur Zavvi le 4 août
  2026 : `Andy's Baby Animals (BBC)` rattaché à `ファンタズマ ～呪いの館～ Vol.2`
  sur une concordance de durée 100/100. Une source sans millésime demande un
  troisième contrôle, pas une tolérance plus large.

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
- **Le site est passé en régime professionnel le 3 août 2026**, jour du premier
  programme d'affiliation accepté. `/legal` porte désormais les mentions de
  l'article 6 III de la LCEN : nom, adresse de l'établissement, téléphone,
  SIREN, SIRET, inscription au RNE, franchise en base (art. 293 B du CGI) et
  directeur de la publication. Valeurs relevées sur le registre public, jamais
  devinées.

  **RNE et non RCS**, l'APE `74.10Z` n'étant ni commercial ni artisanal : aucun
  de ces deux numéros n'existe, et l'inventer serait une mention fausse, ce qui
  est pire que l'absence.

  **Elles vivent dans un objet `EDITEUR` unique** en tête de
  `MentionsLegalesPage.tsx`, avec un garde-fou : tant qu'un champ porte encore
  son marqueur `À COMPLÉTER`, un encadré « mentions incomplètes » s'affiche sur
  la page. L'omission est silencieuse par nature, une page trouée ressemblant
  trait pour trait à une page complète, et c'est une infraction à l'art. 6 VI.
- **Mention d'affiliation, obligatoire et écrite au présent.** La rédaction
  précédente promettait au conditionnel que « si des liens d'affiliation étaient
  mis en place, leur présence serait signalée » : une promesse au conditionnel
  devient un mensonge le jour où le lien existe, et c'est le manquement que
  sanctionne l'article L. 121-1 du code de la consommation.

  Trois endroits, tous au présent et nommant Awin et les marchands : une section
  dédiée dans `/legal`, une dans `/privacy`, une question dans `/about`, plus
  une ligne sous la liste des éditions **quand une offre y figure**, jamais
  ailleurs.

  **Les marchands sont nommés un par un, jamais résumés en « nos partenaires ».**
  L'article L. 121-1 demande que la nature commerciale du lien soit
  identifiable, et savoir chez qui l'on part en fait partie. Les cinq endroits
  ont été repris le 6 août 2026 pour nommer **E.Leclerc en neuf et momox shop en
  occasion**, corps injecté de `/legal` compris : `/legal`, `/privacy` deux fois,
  `/about`, et `functions/_middleware.ts`. Une liste de marchands qu'on oublie de
  tenir est une mention fausse, pas une mention incomplète.

  **Et l'occasion se dit à la ligne du prix**, par `LIBELLE_ETAT` : « occasion,
  très bon état ». Un montant très inférieur au neuf a une raison, et
  `offreAAfficher` retenant le **moins cher** des deux marchands, ne pas l'écrire
  ferait passer un disque d'occasion pour une bonne affaire sur du neuf. Le
  classement par prix et le libellé d'état sont les deux moitiés d'un même
  contrat : l'un sans l'autre est trompeur. Une mention posée sur toutes les fiches parlerait de liens absents
  de 96 % du catalogue, ce qui est l'inverse d'informer.

  Côté technique, `rel="sponsored noopener noreferrer"` : un lien affilié non
  déclaré est un montage de liens pour Google, et la sanction porte sur le site
  entier.
- **Le site ne vend rien et n'encaisse rien**, et c'est écrit tel quel : il
  n'est ni marchand ni intermédiaire de vente, toute commande se conclut chez le
  marchand. Pas de CGV, pas de médiateur de la consommation à désigner, ces deux
  obligations ne visant que le vendeur.
- **Le prix affiché est daté et ne fait pas foi.** `offres.releve_le` est écrit
  en `title` sur chaque lien, et les pages disent que seul le prix du marchand
  au moment de la commande fait foi. Un prix périmé affiché comme actuel est une
  pratique commerciale trompeuse : c'est ce qui rend le rafraîchissement des
  offres (§6) une obligation et pas un confort.
- **La même règle vaut pour un code de réduction**, et elle a décidé de la forme
  du bandeau momox du 7 août 2026 (§8). Un bandeau demandé visible avant le jour
  de la promotion ne peut pas écrire « aujourd'hui » : le code ne marche pas, et
  l'annoncer actif est le prix périmé de la ligne au-dessus, dans l'autre sens.
  D'où l'annonce **au futur** tant que la fenêtre n'a pas ouvert, et une fenêtre
  qui se referme seule plutôt qu'un retrait à la main le lendemain.
- **La confidentialité disait deux choses fausses**, corrigées le 3 août 2026 :
  Google Fonts figurait encore dans les services tiers alors que les polices
  sont auto-hébergées depuis le 31 juillet et que la CSP n'autorise plus que
  `'self'` en `font-src`, et Cloudflare R2 n'y était pas alors qu'il sert tous
  les visuels. Une politique de confidentialité ne vaut que par son exactitude.
- Attribution TMDB en pied de page (exigée par leur licence)
- **Les visuels Zavvi sont repris depuis le 2 août 2026**, 11 498 packshots
  miroités sur R2, dont 4 454 seulement correspondent à une édition écrite.
  Même raisonnement que pour les trois sources ci-dessous : ce sont des
  visuels d'éditeur que le revendeur diffuse, et l'usage vise l'affiliation,
  donc commercial. Zavvi étant précisément un programme Awin en attente, la
  question se réglera d'elle-même le jour où le flux produits sera accepté :
  leurs images seront alors licenciées pour cet usage.
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
- **Les listes deviennent publiques par défaut, le 3 août 2026.** C'est le
  changement de posture le plus lourd depuis l'ouverture des comptes : la FAQ
  répondait « Non » à « mes listes sont-elles visibles par d'autres ». Elle
  répond maintenant « Oui, si votre page publique est active, et elle l'est par
  défaut ».

  **Le consentement est demandé une fois, au bon moment** : l'écran de choix du
  @ annonce la page publique et écrit son adresse en toutes lettres, avant
  qu'aucune donnée ne soit publiée. C'est la seule occasion où il est réellement
  demandé, `/account` ne fait ensuite que l'entretenir.

  **Ce que la page ne montre jamais** : l'adresse électronique et l'identifiant
  Google. Ils vivent dans `auth.users`, qu'aucune fonction publique ne lit, et
  le nom affiché est une colonne séparée précisément pour pouvoir en mettre un
  autre.

  Politique de confidentialité, sommaire servi par le middleware et FAQ
  (`list-privacy`, plus une entrée `public-profile`) mis à jour dans le même
  commit. Une promesse qui ne correspond plus au code est pire que pas de
  promesse.
- **Portabilité (RGPD art. 20) tenue par l'export CSV** d'`/account`, posé le
  3 août 2026. L'article demande un format « structuré, couramment utilisé et
  lisible par machine » : un CSV des deux listes le satisfait, et il est
  gratuit, ce que l'article impose aussi. Il porte le code-barres et le lien
  vers la fiche, donc il reste exploitable ailleurs.
- **Effacement (RGPD art. 17)** tenu par `public.supprimer_mon_compte()`,
  atteignable depuis `/compte`, lui-même lié depuis le menu du bandeau et
  depuis la politique de confidentialité, laquelle annonçait déjà la
  suppression « accessible dans les réglages du compte ». Confirmation en deux
  temps avec un mot à recopier, et en cas de refus du serveur on ne prétend pas
  avoir supprimé.
