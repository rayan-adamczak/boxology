import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2, Heart, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getEditionsByIds, type EditionWithFilm, type StatutValue } from "../lib/reelio-db";
import { idsParStatut } from "../lib/collections";
import { useSession } from "../lib/auth";
import { useSeo } from "../lib/seo";

interface StatusListPageProps {
  statut: StatutValue;
}

const CONFIG: Record<StatutValue, { title: string; empty: string; icon: React.ReactNode }> = {
  envie: {
    title: "Mes envies",
    empty: "Vous n'avez pas encore ajouté d'éditions à vos envies.",
    icon: <Heart size={22} color="var(--reel-accent)" />,
  },
  possede: {
    title: "Ma collection",
    empty: "Vous ne possédez encore aucune édition.",
    icon: <CheckCircle2 size={22} color="var(--reel-accent)" />,
  },
};

export function StatusListPage({ statut }: StatusListPageProps) {
  const cfg = CONFIG[statut];

  // Liste propre au visiteur, vide pour tout le monde d'autre : rien à indexer.
  // « follow » laisse quand même les liens vers les fiches films être suivis.
  useSeo({
    titre: cfg.title,
    description: cfg.empty,
    noindex: true,
  });

  const [editions, setEditions] = useState<EditionWithFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  useEffect(() => {
    // Attendre la résolution de la session évite d'afficher la liste locale
    // une fraction de seconde avant celle du compte.
    if (session === undefined) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Base ou localStorage selon qu'un compte est connecté, puis on va
        // chercher le détail des éditions dans le catalogue.
        const ids = await idsParStatut(statut);
        const rows = await getEditionsByIds(ids);
        if (!cancelled) setEditions(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // Voir FilmDetailPage : on suit l'identité, pas l'objet session, qui est
    // recréé à chaque rafraîchissement de jeton.
  }, [statut, session === undefined, session?.user.id]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-[88px] md:px-8 md:pb-8 lg:px-16">
      <header className="mb-6 flex items-center gap-2.5">
        {cfg.icon}
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--reel-text)" }}>{cfg.title}</h1>
        {!loading && (
          <span style={{ fontSize: "15px", color: "var(--reel-muted)" }}>({editions.length})</span>
        )}
      </header>

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: "var(--reel-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Chargement…</span>
        </div>
      ) : error ? (
        <p style={{ fontSize: "14px", color: "#ff6b6b" }}>{error}</p>
      ) : editions.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>{cfg.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {editions.map((ed) => (
            <Link
              key={ed.id}
              to={ed.film ? `/films/${ed.film.id}` : "#"}
              className="group block rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            >
              <div
                className="relative w-full overflow-hidden rounded-[8px]"
                style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface-2)" }}
              >
                <ImageWithFallback
                  src={ed.film?.affiche_url ?? ed.image_url ?? ""}
                  alt={`Affiche de ${ed.film?.titre ?? ed.titre ?? "film"}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-110"
                />
              </div>
              <p
                className="mt-2 line-clamp-2"
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--reel-text)" }}
              >
                {ed.titre ?? ed.film?.titre ?? "Édition"}
              </p>
              {ed.prix_fnac_extrait && (
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--reel-accent)" }}>
                  {ed.prix_fnac_extrait}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
