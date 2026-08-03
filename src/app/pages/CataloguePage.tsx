import { ChampRecherche } from "../components/ChampRecherche";
import { GrilleFilms, PucesRegroupement } from "../components/GrilleFilms";
import { useRechercheFilms } from "../lib/recherche-films";
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
  const recherche = useRechercheFilms();

  /*
    Même règle que sur l'accueil : une page de résultats de recherche interne
    est du contenu généré à la volée, Google demande de ne pas l'indexer.
    `follow` reste, les liens vers les fiches doivent être suivis. Le canonical
    est calculé depuis le seul `pathname`, donc il vaut `/catalogue` quelle que
    soit la frappe.
  */
  useSeo(
    recherche.query.trim()
      ? {
          titre: `Recherche : ${recherche.query.trim()}`,
          description: `Résultats pour « ${recherche.query.trim()} » dans le catalogue des éditions physiques.`,
          noindex: true,
        }
      : {
          titre: "Parcourir le catalogue",
          description:
            "Cherchez un film et comparez ses éditions physiques françaises : Blu-ray, 4K, steelbooks, digibooks et coffrets.",
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
        <ChampRecherche valeur={recherche.query} onChange={recherche.setQuery} />
      </div>

      {recherche.suggestions.length > 0 && (
        <section className="pt-8">
          <h2 style={LIBELLE_SECTION}>Parcourir</h2>
          <PucesRegroupement suggestions={recherche.suggestions} />
        </section>
      )}

      <section className="pt-10">
        <h2 style={LIBELLE_SECTION}>{recherche.active ? "Résultats" : "Tous les films"}</h2>
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
