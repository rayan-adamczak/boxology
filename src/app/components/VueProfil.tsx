import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { UserAvatar } from "./UserAvatar";
import { arobase, cheminProfil } from "../lib/identifiant";
import { lienFilm } from "../lib/liens";
import { splitList, type EditionWithFilm, type StatutValue } from "../lib/reelio-db";
import { SITE_ORIGIN } from "../lib/seo";

/**
 * La collection d'une personne, vue comme une étagère.
 *
 * **Présentation pure : tout arrive en props, rien n'est lu d'une session.**
 * C'est ce qui permet à `ProfilPage`, qui montre vos listes sous jeton, et à
 * `ProfilPublicPage`, qui montre celles de quelqu'un d'autre en clé anon, de
 * rendre exactement le même écran. Deux copies auraient dérivé au premier
 * ajustement, et la version publique, celle qu'on partage, aurait été la
 * dernière servie.
 *
 * Les éditions sont regroupées par film, avec un badge ×N quand plusieurs
 * éditions du même titre sont possédées : c'est la lecture qu'attend quelqu'un
 * qui regarde une collection, on possède *Dune*, pas trois lignes de catalogue.
 *
 * Volontairement absents : Follow, Message, Followers, Following et le fil
 * d'activité de la maquette. Rien ne les alimente, et afficher des compteurs
 * vides annonce une fonction qui n'existe pas.
 */

/** Un titre de la collection, avec toutes les éditions possédées de ce titre. */
export interface Entree {
  cle: string;
  /** Cible du lien, slug compris quand le film en porte un. Null hors film. */
  lien: string | null;
  titre: string;
  affiche: string | null;
  editions: EditionWithFilm[];
}

type Tri = "recent" | "titre";

export const ONGLETS: { statut: StatutValue; libelle: string }[] = [
  { statut: "possede", libelle: "Collection" },
  { statut: "envie", libelle: "Envies" },
];

/**
 * Regroupe les éditions par film. Une édition sans film rattaché, il y en a
 * près de 900 au catalogue, reste une entrée à elle seule plutôt que de
 * disparaître dans un groupe fourre-tout.
 */
export function grouper(editions: EditionWithFilm[]): Entree[] {
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
      lien: lienFilm(ed.film),
      titre: ed.film?.titre ?? ed.titre ?? "Édition sans titre",
      affiche: ed.film?.affiche_url ?? ed.image_url ?? null,
      editions: [ed],
    });
  }

  return [...parCle.values()];
}

export function VueProfil({
  nom,
  identifiant,
  sousTitre,
  actions,
  parStatut,
  statut,
  onStatut,
  vide,
}: {
  nom: string;
  /** Le @ du compte, sans son arobase. Null tant qu'il n'a pas été choisi. */
  identifiant: string | null;
  /** Seconde ligne sous le @. L'adresse sur son propre profil, rien en public. */
  sousTitre?: string;
  /** Bouton de partage, invitation à se connecter : posé par l'appelant. */
  actions?: React.ReactNode;
  parStatut: Record<StatutValue, Entree[]>;
  statut: StatutValue;
  onStatut: (s: StatutValue) => void;
  /** Le texte de la liste vide : « votre collection » ou « sa collection ». */
  vide: Record<StatutValue, string>;
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

      <div className="reel-gouttiere">
        {/* L'en-tête chevauche la bannière, comme dans la maquette. */}
        <header className="-mt-12 flex flex-wrap items-end gap-3">
          <span className="rounded-full p-1" style={{ backgroundColor: "var(--reel-bg)" }}>
            <UserAvatar name={nom} size={96} />
          </span>
          <div className="min-w-0 pb-1">
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>{nom}</h1>
            {identifiant && (
              /*
                Le @ est en chasse fixe et non dans la police du corps : c'est
                une adresse, on la recopie signe à signe, et `l`, `1` et `I`
                doivent se distinguer. Même raison que le code-barres d'une
                ligne d'édition (§8).
              */
              <p
                className="truncate"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "15px",
                  color: "var(--reel-accent-clair)",
                }}
              >
                {arobase(identifiant)}
              </p>
            )}
            {sousTitre && (
              <p className="max-w-[520px] truncate" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>
                {sousTitre}
              </p>
            )}
          </div>
          {actions && <div className="mb-1 ml-auto flex items-center gap-2">{actions}</div>}
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
            {vide[statut]}
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
 * Bouton de partage d'un profil.
 *
 * `navigator.share` d'abord : sur téléphone il ouvre la feuille du système,
 * qui est ce que les gens attendent. Sinon le presse-papiers, avec un retour
 * visuel de deux secondes, parce qu'une copie sans accusé de réception donne
 * l'impression que rien ne s'est passé.
 *
 * **L'adresse est construite sur `SITE_ORIGIN` et non sur `location.origin`.**
 * Un lien copié depuis un déploiement de prévisualisation
 * (`<hachage>.jaquette.pages.dev`, cf. §7) partirait sinon avec cet hôte, qui
 * est en `noindex` et changera au prochain déploiement.
 */
export function BoutonPartage({ identifiant }: { identifiant: string }) {
  const [copie, setCopie] = useState(false);
  const adresse = `${SITE_ORIGIN}${cheminProfil(identifiant)}`;

  async function partager() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: arobase(identifiant), url: adresse });
        return;
      } catch {
        /* Feuille de partage refusée ou fermée : on retombe sur la copie. */
      }
    }
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Le presse-papiers demande un contexte sécurisé et peut être refusé.
      // On affiche alors l'adresse : elle reste sélectionnable à la main.
      toast.message("Copie refusée par le navigateur", { description: adresse });
    }
  }

  return (
    <button
      type="button"
      onClick={() => { void partager(); }}
      className="flex items-center gap-1.5 rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--reel-text)",
        border: "1px solid var(--reel-border)",
        backgroundColor: "var(--reel-surface)",
      }}
    >
      {copie ? <Check size={16} /> : <Share2 size={16} />}
      {copie ? "Lien copié" : "Partager"}
    </button>
  );
}

/**
 * Bandeau dégradé de la maquette. Purement décoratif : deux halos colorés sur
 * un fond sombre, sans image à charger.
 */
/**
 * Le dégradé qui coiffe un profil.
 *
 * Exporté parce que `/account` porte le même en-tête : c'est la même personne
 * et la même étagère, vues depuis les réglages plutôt que depuis l'adresse
 * publique. Deux dégradés écrits séparément auraient dérivé à la première
 * retouche, et c'est exactement ce que `VueProfil` évite déjà entre les deux
 * pages de profil.
 */
export function Banniere() {
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
      ? `${entree.titre} (${entree.editions.length} éditions)`
      : entree.titre;

  if (entree.lien === null) return <div title={libelle}>{contenu}</div>;

  return (
    <Link
      to={entree.lien}
      aria-label={libelle}
      className="outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
    >
      {contenu}
    </Link>
  );
}
