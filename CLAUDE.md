# Jaquette — contexte projet

Catalogue des éditions physiques de films (Blu-ray, 4K, steelbooks, coffrets)
pour le marché français. Anciennement *Boxology*, renommé en juillet 2026.

---

## 1. Identité

| | |
|---|---|
| Nom | Jaquette |
| Domaine | `jaquette.app` (acheté, à brancher) |
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
| Hébergement actuel | GitHub Pages — **renvoie 404 sur les deep links** |
| Hébergement cible | Cloudflare Pages (en cours de configuration) |
| Images films | TMDB (attribution obligatoire, présente en pied de page) |

### Bascule d'hébergement

`vite.config.ts` gère deux cibles via `DEPLOY_TARGET` :

- **absent** (Cloudflare) → base `/`, lit `public/_redirects` → **HTTP 200**
- **`github`** → base `/jaquette/`, génère `404.html` → HTTP 404

Le 404 empêche toute indexation. C'est la raison de la migration.

### Secrets

Dans `~/.config/boxology.env` (hors dépôt, à renommer un jour) :
`TMDB_READ_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

Chargement : `set -a; . ~/.config/boxology.env; set +a`

---

## 3. Modèle de données

### `films` — 2 227 lignes
`id` (identity), `tmdb_id` (unique), `titre`, `titre_original`, `annee`,
`duree`, `realisateur`, `scenariste`, `synopsis`, `note` (**/10**),
`nb_votes`, `affiche_url`, `backdrop_url`, `imdb_id`, `tagline`,
`genres` (text[]), `cast_principal` (jsonb), **`type`** (`film|serie|coffret`).

### `editions` — 5 726 lignes
`id` (identity **ajoutée en juillet 2026** — elle manquait, toute insertion
applicative échouait), `titre`, `ean`, `date_sortie`, `pays`, `region`,
`formats_extraits` (text[]), `url_source`, `contenu_brut`, `image_url`,
`film_id` (film principal), **`source`**, **`source_id`**.

`source` vaut `editioncollector.fr` (3 180) ou `bluray.com` (2 546).

### `edition_films` — 3 966 liens
Relation plusieurs-à-plusieurs : un coffret appartient à chacun de ses films.
`edition_id`, `film_id`, `source` (`film_id|collection_tmdb|bluray_tmdb|
corrige_annee|corrige_manuel`).

**L'app lit les éditions via cette table**, pas via `editions.film_id`
(cf. `getEditionsForFilm` dans `src/app/lib/reelio-db.ts`).

### `bluray_import` — table de transit
3 100 fiches crawlées, avec statut : `promu` (2 546), `a_verifier` (464),
`doublon` (90). Invisible du site, aucune policy anon.

### Tables de sauvegarde
`editions_film_id_backup_20260728`, `editions_supprimees_20260728`.

### Sécurité
RLS activé partout. Policies `anon` en **lecture seule** sur `films`,
`editions`, `edition_films`. `statuts` et `kv_store_38e4ee68` fermées.
Vérifié : écriture anon refusée (401).

---

## 4. État du catalogue

| | |
|---|---|
| Films | 2 227 (1 997 films, 228 séries, 2 coffrets) |
| Éditions | 5 726 |
| Codes-barres | 3 042 |
| Éditions sans film | 1 892 |
| Films sans édition | ~700 |

---

## 5. Sources de données

### editioncollector.fr — 3 180 éditions
Source d'origine. **Seule à fournir des visuels** (`image_url` pointant vers
leur S3 — hotlink, donc fragile : ils peuvent couper à tout moment).

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

| Fichier | Rôle |
|---|---|
| `enum_fr.py` | Énumère le catalogue FR via les listings |
| `crawl_fr.py` | Crawl reprenable, verrou `flock`, tranches d'1 h |
| `parseur.py` | Extraction des fiches (séparé exprès du crawl) |
| `import_1_charger.py` | JSONL → `bluray_import` |
| `import_2_resoudre.py` | Résolution TMDB, **lecture seule** |
| `import_3_ecrire.py` | Création films + éditions + liens |
| `import_4_titres.py` | Nettoyage des titres (`--apply` pour écrire) |

`crawl/pages/` — 3 100 pages gzippées (170 Mo). Permettent de rejouer un
parsing sans réseau. **Ne pas supprimer** tant que l'import n'est pas figé.

---

## 7. Chantiers ouverts

### Immédiat
- **Cloudflare Pages** — configuration en cours. Sans variable
  `DEPLOY_TARGET`. Puis brancher `jaquette.app`.
- **Visuels** des 2 546 nouvelles éditions — bloqué sur Awin.

### Décisions en attente
- **212 résolutions TMDB ambiguës** — homonymes, popularité faible
- **464 fiches `a_verifier`** — même film qu'une édition existante
- **1 380 fiches non résolues** — surtout des coffrets multi-films

### Fonctionnel
- **Authentification** — les listes sont en `localStorage`
  (clé `jaquette_statuts`, migration depuis `boxology_statuts` en place).
  Perte des données si le cache est vidé, aucune synchronisation.
- **SEO** — titres et meta identiques sur toutes les pages
- **Rapatrier les images** hébergées chez editioncollector

### Awin
4 programmes en attente : Fnac, E.Leclerc, Cultura, Zavvi — **tous avec flux
produits** (EAN + images + prix). Aucun accepté. Create-a-Feed inutilisable
tant qu'aucun n'a validé (« Feed not found »).

---

## 8. Pièges rencontrés

Documentés parce qu'ils se reproduiront.

### Parsing
- **Les titres blu-ray.com** suivent `Titre 4K Blu-ray (X) (France)` où `X`
  est **soit** le titre français, **soit** un qualificatif d'édition. Trancher
  sur un vocabulaire (steelbook, collector, digipack…), sinon on obtient
  `SteelBook → Titanic`.
- **19,7 % des titres d'édition portent l'année** entre parenthèses. La jeter
  fait perdre la désambiguïsation : `Dune (1985)` rattaché à Dune 2021.
  111 rattachements faux corrigés grâce à elle.
- **Séparateurs** : les titres mélangent `-` et `–` (cadratin). Ne découper
  que sur l'un fausse tout.
- **Accents en majuscules** : `translate()` s'applique avant `lower()`.

### Appariement TMDB
- Exiger le **titre exact**. Un repli « année seule » donne
  `Ça (1990) → Living To Die`.
- Sur homonymes, la popularité départage mal quand elle est sous 1.

### Infrastructure
- **PostgREST plafonne à 1 000 lignes.** Paginer, toujours.
- **`ON CONFLICT` ignore les index partiels.**
- **`editions.id` n'avait pas d'identity** — insertion impossible.
- **`noindex, nofollow`** traînait dans `index.html` depuis Figma Make.
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

---

## 9. Juridique

- Mentions légales, confidentialité et à propos en ligne
- Éditeur non professionnel (LCEN art. 6) — **à compléter dès que le site
  devient commercial**
- Attribution TMDB en pied de page (exigée par leur licence)
- Aucune image reprise de blu-ray.com
- Données factuelles uniquement (EAN, dates, formats) — non protégeables
  individuellement, mais le droit *sui generis* protège l'extraction d'une
  partie substantielle d'une base
- Aucun tracker, aucun compte, aucune donnée personnelle serveur
