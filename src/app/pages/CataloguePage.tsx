import { X } from "lucide-react";
import { Selecteur } from "../components/Selecteur";
import { ChampRecherche } from "../components/ChampRecherche";
import { GrilleFilms, PucesRegroupement } from "../components/GrilleFilms";
import { useRechercheFilms } from "../lib/recherche-films";
import { DECENNIES, NOTES, type Filtres } from "../lib/catalogue-filtres";
import { EDITEURS, FORMATS, GENRES } from "../lib/regroupements";
import { useSeo } from "../lib/seo";

/**
 * Page Catalogue, posée le 3 août 2026.
 *
 * L'accueil devient un tableau de bord une fois connecté (cf.
 * `TableauDeBordPage`), donc le parcours du catalogue avait besoin d'une porte
 * à lui, atteignable depuis le bandeau à tout moment.
 *
 * **L'accueil déconnecté ne perd rien pour autant** : il garde son héros, ses
 * parutions et sa grille. C'est lui qui est indexé et qui reçoit le trafic des
 * moteurs ; le déshabiller au profit de cette page aurait déplacé l'entrée du
 * site sans rien y gagner.
 *
 * Les deux pages partagent le champ, la recherche et la grille
 * (`ChampRecherche`, `useRechercheFilms`, `GrilleFilms`) : trois copies de la
 * même logique auraient dérivé au premier réglage.
 */
const LIBELLE_SECTION = {
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--reel-muted)",
} as const;

export function CataloguePage() {
  const recherche = useRechercheFilms(true);

  /*
    Même règle que sur l'accueil : une page de résultats de recherche interne
    est du contenu généré à la volée, Google demande de ne pas l'indexer.
    `follow` reste, les liens vers les fiches doivent être suivis. Le canonical
    est calculé depuis le seul `pathname`, donc il vaut `/catalogue` quelle que
    soit la frappe.

    **Une vue filtrée ne s'indexe pas davantage** : c'est la même combinatoire
    de contenu généré à la volée, et les axes qui méritent une page ont déjà la
    leur, /formats, /publishers et /genres, écrites pour ça (§7).
  */
  useSeo(
    recherche.query.trim() || recherche.nbFiltres > 0
      ? {
          titre: recherche.query.trim() ? `Recherche : ${recherche.query.trim()}` : "Catalogue filtré",
          description: recherche.query.trim()
            ? `Résultats pour « ${recherche.query.trim()} » dans le catalogue des éditions physiques.`
            : "Sélection filtrée du catalogue des éditions physiques.",
          noindex: true,
        }
      : {
          titre: "Parcourir le catalogue",
          description:
            "Cherchez un film et comparez ses éditions physiques françaises : Blu-ray, 4K, DVD, steelbooks, digibooks et coffrets.",
        },
  );

  return (
    <div className="reel-gouttiere w-full pb-24 pt-[104px] md:pb-12">
      <h1
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "clamp(28px, 3.4vw, 40px)",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "var(--reel-text)",
        }}
      >
        Parcourir le catalogue
      </h1>
      <p className="mt-3 max-w-[640px]" style={{ fontSize: "16px", lineHeight: "25px", color: "var(--reel-muted)" }}>
        Par titre, par réalisateur, ou par éditeur et format avec les raccourcis qui apparaissent
        sous le champ.
      </p>

      <div className="mt-7 max-w-[680px]">
        {/*
          **Pas de panneau d'aperçu ici, et c'est la seule page dans ce cas.**
          La grille est juste en dessous et se rafraîchit à la frappe : un
          panneau par-dessus montrerait les huit premières lignes de ce qu'elle
          affiche déjà, en masquant les filtres au passage.

          Pas d'`onValider` non plus : on est déjà sur la page de destination.
        */}
        <ChampRecherche valeur={recherche.query} onChange={recherche.setQuery} />
      </div>

      <BarreFiltres
        filtres={recherche.filtres}
        setFiltre={recherche.setFiltre}
        effacer={recherche.effacerFiltres}
        nb={recherche.nbFiltres}
      />

      {recherche.tronque && (
        <p className="mt-4" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Ce filtre porte sur plus de mille éditions : la liste ci-dessous n’en montre qu’une
          partie.
        </p>
      )}

      {recherche.suggestions.length > 0 && (
        <section className="pt-8">
          <h2 style={LIBELLE_SECTION}>Parcourir</h2>
          <PucesRegroupement suggestions={recherche.suggestions} />
        </section>
      )}

      <section className="pt-10">
        <h2 style={LIBELLE_SECTION}>
          {recherche.active || recherche.nbFiltres > 0 ? "Résultats" : "Tous les films"}
        </h2>
        <GrilleFilms
          films={recherche.films}
          chargement={recherche.chargement}
          erreur={recherche.erreur}
          approchante={recherche.approchante}
          query={recherche.query}
        />
      </section>
    </div>
  );
}

/**
 * La barre de filtres.
 *
 * Six capsules `Filtre`, donc six `Selecteur` dessinés. Elles ont longtemps été
 * des `<select>` natifs, pour trois raisons qui tenaient : la navigation au
 * clavier, la recherche à la frappe et la roue du système sur téléphone. Le
 * composant partagé les reprend une à une, et c'est ce qui a autorisé le
 * remplacement le 7 août 2026.
 *
 * Les valeurs viennent de `regroupements.ts`, la table générée au build : les
 * mêmes libellés que les pages /formats, /publishers et /genres, sans une
 * requête de plus.
 */
function BarreFiltres({
  filtres,
  setFiltre,
  effacer,
  nb,
}: {
  filtres: Filtres;
  setFiltre: <K extends keyof Filtres>(cle: K, valeur: Filtres[K]) => void;
  effacer: () => void;
  nb: number;
}) {
  return (
    /*
      Grille de deux colonnes sur téléphone, flux libre au-delà.

      Ce que la grille corrige est un défaut hérité du `<select>` natif, dont
      **la largeur suivait sa plus longue option**, et rien d'autre : mesuré à
      375 px, les six capsules faisaient 147, 261, 288, 130, 115 et 100 px,
      parce que « Éditeur » contient « France Télévisions Distribution » et
      « Genre » « Science-Fiction & Fantastique ». Le flux libre en tirait des
      rangées bancales, une capsule par ligne ici, trois là.

      Le menu dessiné n'a plus ce travers, sa capsule tronque, mais la grille
      reste : deux colonnes égales rangent six contrôles de même nature mieux
      qu'un flux qui les dimensionne au contenu. Le libellé fermé est court, ce
      sont les options ouvertes qui sont longues, et elles s'affichent
      désormais dans la feuille par le bas, pas dans la capsule.

      Sur écran large, même principe : les six capsules se partagent la ligne à
      parts égales (`flex-1 basis-0`), plutôt que de prendre chacune la largeur
      de sa plus longue option. Une rangée de capsules de six tailles
      différentes se lisait comme six contrôles de natures différentes, alors
      qu'ils font tous la même chose.
    */
    <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      {/*
        `contents` : sur téléphone cette enveloppe s'efface et les six capsules
        redeviennent des cellules de la grille à deux colonnes. Au-dessus de
        `sm` elle devient la rangée, sur toute la largeur, ce qui met le bouton
        d'effacement **sous** elle et non dedans.

        Mesuré avant d'en arriver là : en gardant le bouton dans la rangée, les
        capsules tombaient à 104 px à 1 280, dont 56 de rembourrage, et les
        libellés s'affichaient « Déc… », « Édite… », « Stee… ». Une capsule qui
        ne peut plus dire ce qu'elle filtre ne filtre plus rien.
      */}
      <div className="contents sm:flex sm:w-full sm:gap-2">
      <Filtre
        libelle="Décennie"
        valeur={filtres.decennie ? String(filtres.decennie) : ""}
        onChange={(v) => setFiltre("decennie", v ? Number(v) : undefined)}
        options={DECENNIES.map((d) => ({ valeur: String(d), libelle: `Années ${d}` }))}
      />
      <Filtre
        libelle="Genre"
        valeur={filtres.genre ?? ""}
        onChange={(v) => setFiltre("genre", v || undefined)}
        options={GENRES.map((g) => ({ valeur: g.libelle, libelle: g.libelle }))}
      />
      <Filtre
        libelle="Éditeur"
        valeur={filtres.editeur ?? ""}
        onChange={(v) => setFiltre("editeur", v || undefined)}
        options={EDITEURS.map((e) => ({ valeur: e.libelle, libelle: e.libelle }))}
      />
      <Filtre
        libelle="Format"
        valeur={filtres.format ?? ""}
        onChange={(v) => setFiltre("format", v || undefined)}
        options={FORMATS.map((f) => ({ valeur: f.libelle, libelle: f.libelle }))}
      />
      <Filtre
        libelle="Note"
        valeur={filtres.noteMin ? String(filtres.noteMin) : ""}
        onChange={(v) => setFiltre("noteMin", v ? Number(v) : undefined)}
        options={NOTES.map((n) => ({ valeur: String(n), libelle: `${n} et plus` }))}
      />
      <Filtre
        libelle="Type"
        valeur={filtres.type ?? ""}
        onChange={(v) => setFiltre("type", (v || undefined) as Filtres["type"])}
        options={[
          { valeur: "film", libelle: "Films" },
          { valeur: "serie", libelle: "Séries" },
        ]}
      />
      </div>

      {nb > 0 && (
        <button
          type="button"
          onClick={effacer}
          /* Toute la largeur sur téléphone, et sur sa propre rangée : ce n'est
             pas un filtre de plus, c'est ce qui les défait tous. */
          className="col-span-2 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] sm:col-span-1"
          style={{
            fontSize: "14px",
            color: "var(--reel-accent-clair)",
            border: "1px solid var(--reel-border)",
          }}
        >
          <X size={14} /> Tout effacer
        </button>
      )}
    </div>
  );
}

/**
 * Une capsule de la barre de filtres.
 *
 * Adaptateur au-dessus de `Selecteur` : il n'ajoute que l'option vide, qui
 * porte le nom du filtre et vaut « tous ». Le menu lui-même, son clavier, sa
 * frappe au vol et sa feuille par le bas sur téléphone vivent dans le
 * composant partagé, où le tri du profil les prend aussi.
 *
 * **C'étaient des `<select>` natifs jusqu'au 7 août 2026**, et le commentaire
 * qui les défendait avait raison sur le fond : clavier, frappe au vol et roue
 * du système sont trois choses qu'un menu maison rate presque toujours. Elles
 * sont reprises une à une dans `Selecteur`, et c'est ce qui autorisait le
 * remplacement. Ce que le natif ne pouvait pas donner, lui, c'est la même
 * capsule d'une machine à l'autre : sa flèche est dessinée par le système.
 */
function Filtre({
  libelle,
  valeur,
  onChange,
  options,
}: {
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  options: { valeur: string; libelle: string }[];
}) {
  return (
    <Selecteur
      libelle={libelle}
      valeur={valeur}
      onChange={onChange}
      options={[{ valeur: "", libelle }, ...options]}
      accentSiChoisi
    />
  );
}
