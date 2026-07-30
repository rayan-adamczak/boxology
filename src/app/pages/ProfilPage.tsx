import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UserAvatar } from "../components/UserAvatar";
import { connexionGoogle, nomAffiche, useSession } from "../lib/auth";
import { idsParStatut } from "../lib/collections";
import {
  getEditionsByIds,
  splitList,
  type EditionWithFilm,
  type StatutValue,
} from "../lib/reelio-db";
import { useSeo } from "../lib/seo";

/**
 * Profil : la collection d'une personne, vue comme une étagère.
 *
 * Remplace « Ma collection » et « Mes envies », qui listaient les éditions à
 * plat : ici elles sont regroupées par film, avec un badge ×N quand plusieurs
 * éditions du même titre sont possédées. C'est la lecture qu'attend quelqu'un
 * qui regarde une collection — on possède *Dune*, pas trois lignes de catalogue.
 *
 * Sans compte, il n'y a rien à montrer : les actions en demandent un et le site
 * n'écrit plus dans localStorage. La page invite alors à se connecter, en
 * expliquant ce que le compte apporte.
 *
 * Elle ne montre en revanche que *ses propres* listes : `collections` n'est
 * lisible que par son propriétaire, et la politique de confidentialité promet
 * qu'elles servent à se retrouver entre appareils, pas à être publiées. Un
 * profil public demandera une table `profils`, une policy de lecture
 * conditionnée à un choix explicite, et une mise à jour de cette politique —
 * d'où la séparation ci-dessous : `VueProfil` ne connaît que des données reçues
 * en props, et acceptera telles quelles celles d'un autre compte le jour où
 * elles existeront.
 *
 * Volontairement absents du design d'origine : Follow, Message, Followers,
 * Following et le fil d'activité. Rien ne les alimente, et afficher des
 * compteurs vides est précisément ce qu'on vient de retirer du bandeau.
 */

/** Un titre de la collection, avec toutes les éditions possédées de ce titre. */
interface Entree {
  cle: string;
  filmId: number | null;
  titre: string;
  affiche: string | null;
  editions: EditionWithFilm[];
}

type Tri = "recent" | "titre";

const ONGLETS: { statut: StatutValue; libelle: string }[] = [
  { statut: "possede", libelle: "Collection" },
  { statut: "envie", libelle: "Envies" },
];

/**
 * Regroupe les éditions par film. Une édition sans film rattaché — il y en a
 * près de 1 900 au catalogue — reste une entrée à elle seule plutôt que de
 * disparaître dans un groupe fourre-tout.
 */
function grouper(editions: EditionWithFilm[]): Entree[] {
  const parCle = new Map<string, Entree>();

  for (const ed of editions) {
    const cle = ed.film ? `f${ed.film.id}` : `e${ed.id}`;
    const existante = parCle.get(cle);
    if (existante) {
      existante.editions.push(ed);
      continue;
    }
    parCle.set(cle, {
      cle,
      filmId: ed.film?.id ?? null,
      titre: ed.film?.titre ?? ed.titre ?? "Édition sans titre",
      affiche: ed.film?.affiche_url ?? ed.image_url ?? null,
      editions: [ed],
    });
  }

  return [...parCle.values()];
}

export function ProfilPage() {
  const session = useSession();
  const [parStatut, setParStatut] = useState<Record<StatutValue, Entree[]> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  // L'onglet vit dans l'URL : `/mes-envies` y redirige, et une liste partagée
  // ou remise en favori rouvre la bonne.
  const [params, setParams] = useSearchParams();
  const statut: StatutValue = params.get("liste") === "envies" ? "envie" : "possede";
  const setStatut = (s: StatutValue) =>
    setParams(s === "envie" ? { liste: "envies" } : {}, { replace: true });

  useSeo({
    titre: "Mon profil",
    description: "Votre collection d’éditions physiques, regroupée par film.",
    noindex: true,
  });

  useEffect(() => {
    if (session === undefined) return;
    // Sans compte, `idsParStatut` rend du vide : inutile d'interroger le réseau.
    if (session === null) { setChargement(false); return; }

    let annule = false;
    setChargement(true);
    setErreur(null);

    (async () => {
      try {
        const listes = await Promise.all(
          ONGLETS.map(async ({ statut: s }) => {
            const ids = await idsParStatut(s);
            const editions = await getEditionsByIds(ids);
            // `idsParStatut` rend les identifiants du plus récent au plus
            // ancien, mais `getEditionsByIds` ne garantit aucun ordre : sans ce
            // rang, le tri « ajout récent » ne voudrait rien dire.
            const rang = new Map(ids.map((id, i) => [id, i]));
            editions.sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
            return [s, grouper(editions)] as const;
          }),
        );
        if (!annule) setParStatut(Object.fromEntries(listes) as Record<StatutValue, Entree[]>);
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!annule) setChargement(false);
      }
    })();

    return () => { annule = true; };
    // Voir FilmDetailPage : on suit l'identité, pas l'objet session, recréé à
    // chaque rafraîchissement de jeton.
  }, [session === undefined, session?.user.id]);

  if (session === undefined || (chargement && session !== null)) {
    return (
      <Cadre>
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
        </div>
      </Cadre>
    );
  }

  if (erreur) {
    return (
      <Cadre>
        <p className="py-20 text-center" style={{ fontSize: "15px", color: "#ef6b6b" }}>{erreur}</p>
      </Cadre>
    );
  }

  if (session === null) return <Invitation />;

  return (
    <VueProfil
      connecte
      nom={nomAffiche(session)}
      sousTitre={session.user.email ?? ""}
      parStatut={parStatut ?? { possede: [], envie: [] }}
      statut={statut}
      onStatut={setStatut}
    />
  );
}

/** Présentation pure : tout arrive en props, rien n'est lu de la session. */
function VueProfil({
  connecte,
  nom,
  sousTitre,
  parStatut,
  statut,
  onStatut,
}: {
  /** Sans compte, pas d'avatar ni d'identité : la page montre des listes locales. */
  connecte: boolean;
  nom: string;
  sousTitre: string;
  parStatut: Record<StatutValue, Entree[]>;
  statut: StatutValue;
  onStatut: (s: StatutValue) => void;
}) {
  const [format, setFormat] = useState<string | null>(null);
  const [tri, setTri] = useState<Tri>("recent");

  const entrees = parStatut[statut] ?? [];

  // Les formats proposés viennent de l'onglet courant : offrir « Steelbook »
  // dans une liste qui n'en contient aucun produirait un filtre toujours vide.
  const formats = useMemo(
    () =>
      [...new Set(
        entrees.flatMap((e) => e.editions.flatMap((ed) => splitList(ed.formats_extraits))),
      )].sort((a, b) => a.localeCompare(b, "fr")),
    [entrees],
  );

  const visibles = useMemo(() => {
    const filtrees = format
      ? entrees.filter((e) =>
          e.editions.some((ed) =>
            splitList(ed.formats_extraits).some((f) => f.toLowerCase() === format.toLowerCase()),
          ),
        )
      : entrees;
    return tri === "titre"
      ? [...filtrees].sort((a, b) => a.titre.localeCompare(b.titre, "fr"))
      : filtrees;
  }, [entrees, format, tri]);

  const nbEditions = (s: StatutValue) =>
    (parStatut[s] ?? []).reduce((n, e) => n + e.editions.length, 0);

  return (
    <>
      <Banniere />

      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
        {/* L'en-tête chevauche la bannière, comme dans la maquette. */}
        <header className="-mt-12 flex flex-wrap items-end gap-3">
          {connecte && (
            <span
              className="rounded-full p-1"
              style={{ backgroundColor: "var(--reel-bg)" }}
            >
              <UserAvatar name={nom} size={96} />
            </span>
          )}
          <div className="pb-1">
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>{nom}</h1>
            {sousTitre && (
              <p className="max-w-[520px]" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
                {sousTitre}
              </p>
            )}
          </div>
          {!connecte && (
            <button
              type="button"
              onClick={() => { void connexionGoogle("/profil"); }}
              className="mb-1 ml-auto rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: "var(--reel-accent)",
                color: "#ffffff",
                border: "1px solid var(--reel-accent)",
              }}
            >
              Se connecter
            </button>
          )}
        </header>

        <div className="grid grid-cols-2 gap-3 pt-6 md:grid-cols-3">
          <Tuile valeur={parStatut.possede?.length ?? 0} libelle="Titres possédés" />
          <Tuile valeur={nbEditions("possede")} libelle="Éditions possédées" />
          <Tuile valeur={nbEditions("envie")} libelle="Envies" />
        </div>

        <div
          className="mt-6 flex gap-1"
          style={{ borderBottom: "1px solid var(--reel-border)" }}
          role="tablist"
        >
          {ONGLETS.map(({ statut: s, libelle }) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={statut === s}
              onClick={() => { onStatut(s); setFormat(null); }}
              className="relative px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{
                fontSize: "15px",
                fontWeight: statut === s ? 600 : 500,
                color: statut === s ? "var(--reel-text)" : "var(--reel-muted)",
              }}
            >
              {libelle}
              {statut === s && (
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--reel-accent)" }}
                />
              )}
            </button>
          ))}
        </div>

        {entrees.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-6">
            <label className="sr-only" htmlFor="tri-profil">Trier</label>
            <select
              id="tri-profil"
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="rounded-full px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{
                fontSize: "13px",
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
              }}
            >
              <option value="recent">Ajout récent</option>
              <option value="titre">Titre A→Z</option>
            </select>

            <div className="flex flex-wrap gap-1.5">
              <Puce actif={format === null} onClick={() => setFormat(null)}>Tous</Puce>
              {formats.map((f) => (
                <Puce key={f} actif={format === f} onClick={() => setFormat(format === f ? null : f)}>
                  {f}
                </Puce>
              ))}
            </div>

            <span className="ml-auto" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
              {visibles.length} {visibles.length > 1 ? "titres" : "titre"}
            </span>
          </div>
        )}

        {entrees.length === 0 ? (
          <p className="py-16 text-center" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
            {statut === "possede"
              ? "Votre collection est vide. Ajoutez une édition depuis une fiche film."
              : "Aucune envie pour l’instant."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24 pt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibles.map((e) => <Affiche key={e.cle} entree={e} />)}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Bandeau dégradé de la maquette. Purement décoratif : deux halos colorés sur
 * un fond sombre, sans image à charger.
 */
function Banniere() {
  return (
    // Le bandeau du site est en `position: fixed` et ne réserve pas sa hauteur.
    // Sans ce décalage, les 72 premiers pixels du dégradé passent dessous et
    // l'en-tête du profil remonte d'autant.
    <div className="pt-[72px]">
    <div
      aria-hidden="true"
      className="h-[220px] w-full"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(46,125,255,0.25), rgba(0,0,0,0) 45%)," +
          "radial-gradient(circle at 80% 60%, rgba(120,60,200,0.18), rgba(0,0,0,0) 40%)," +
          "linear-gradient(174deg, #17233a 0%, var(--reel-bg) 55%, #1e1830 100%)",
      }}
    />
    </div>
  );
}

function Tuile({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)", lineHeight: 1.1 }}>
        {valeur.toLocaleString("fr-FR")}
      </p>
      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--reel-muted)" }}>{libelle}</p>
    </div>
  );
}

function Puce({
  children,
  actif,
  onClick,
}: {
  children: React.ReactNode;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className="rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        fontSize: "13px",
        fontWeight: 500,
        backgroundColor: actif ? "var(--reel-accent)" : "var(--reel-surface)",
        border: `1px solid ${actif ? "var(--reel-accent)" : "var(--reel-border)"}`,
        color: actif ? "#ffffff" : "var(--reel-muted)",
      }}
    >
      {children}
    </button>
  );
}

function Affiche({ entree }: { entree: Entree }) {
  const contenu = (
    <div
      className="relative overflow-hidden rounded-[8px]"
      style={{ backgroundColor: "var(--reel-surface-2)", aspectRatio: "2 / 3" }}
    >
      <ImageWithFallback
        src={entree.affiche ?? ""}
        alt={entree.titre}
        className="h-full w-full object-cover"
      />
      {entree.editions.length > 1 && (
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5"
          style={{
            backgroundColor: "rgba(10,12,14,0.8)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--reel-text)",
          }}
          // Le badge est décoratif : le décompte est déjà dans le libellé du lien.
          aria-hidden="true"
        >
          ×{entree.editions.length}
        </span>
      )}
    </div>
  );

  const libelle =
    entree.editions.length > 1
      ? `${entree.titre} — ${entree.editions.length} éditions`
      : entree.titre;

  if (entree.filmId === null) return <div title={libelle}>{contenu}</div>;

  return (
    <Link
      to={`/films/${entree.filmId}`}
      aria-label={libelle}
      className="outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
    >
      {contenu}
    </Link>
  );
}

function Cadre({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1440px] px-4 pt-[88px] md:px-8 lg:px-16">{children}</div>;
}

/**
 * Ce que voit un visiteur sans compte. On explique avant de demander : le
 * catalogue est ouvert, c'est seulement garder des listes qui demande un compte.
 */
function Invitation() {
  return (
    <Cadre>
      <div className="mx-auto max-w-[560px] py-20 text-center">
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>
          Votre collection, gardée
        </h1>
        <p className="pt-3" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
          Marquez les éditions que vous possédez et celles qui vous font envie. Elles sont rattachées
          à votre compte : vous les retrouvez sur votre téléphone comme sur votre ordinateur, et
          elles survivent à un vidage du cache.
        </p>
        <button
          type="button"
          onClick={() => { void connexionGoogle("/profil"); }}
          className="mt-6 rounded-full px-4 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{
            fontSize: "15px",
            fontWeight: 600,
            backgroundColor: "var(--reel-accent)",
            color: "#ffffff",
            border: "1px solid var(--reel-accent)",
          }}
        >
          S’inscrire ou se connecter avec Google
        </button>
        <p className="pt-3" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Le catalogue reste consultable sans compte.
        </p>
      </div>
    </Cadre>
  );
}
