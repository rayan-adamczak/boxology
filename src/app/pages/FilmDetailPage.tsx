import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Bookmark, Library, ChevronDown, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PersonModal } from "../components/PersonModal";
import { UserAvatar } from "../components/UserAvatar";
import { RailHorizontal } from "../components/RailHorizontal";
import { AttentePleine } from "../components/AttenteRecherche";
import { Lanterne, pleineResolution } from "../components/Lanterne";
import { toast } from "sonner";
import {
  getFilm,
  getEditionsForFilm,
  splitList,
  agregerSpecs,
  zonesDe,
  offreAAfficher,
  estOccasion,
  LIBELLE_ETAT,
  type Film,
  type Edition,
  type StatutValue,
} from "../lib/reelio-db";
import { basculerStatut, chargerStatuts, CompteRequis } from "../lib/collections";
import { ModaleConnexion } from "../components/ModaleConnexion";
import { useSession } from "../lib/auth";
import { useSeo, extrait, type Seo } from "../lib/seo";
import { lienFilm } from "../lib/liens";
import { formaterMontant, formaterPrix } from "../lib/prix";
import { vignette } from "../lib/visuels";

/* ---- helpers ---- */

/**
 * Langues des titres étrangers. Ce sont les six que `enrichir_tmdb.py` retient,
 * TMDB en propose une centaine, dont beaucoup ne sont qu'une translittération
 * du titre original et n'apprennent rien à un lecteur francophone.
 */
const LANGUES_TITRES: Record<string, string> = {
  en: "Anglais",
  de: "Allemand",
  es: "Espagnol",
  it: "Italien",
  ja: "Japonais",
  pt: "Portugais",
};

/** « 2018-01-17 » → « 17 janvier 2018 ». Date nue, jamais reformatée en UTC. */
function formatDateSortie(raw: string | null): string {
  if (!raw) return "";
  // `new Date("2018-01-17")` est interprété en UTC et recule d'un jour dans les
  // fuseaux négatifs. On construit la date en local, à partir des trois nombres.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Zones d'une édition, en badges.
 *
 * `editions.region` est du texte libre relevé chez blu-ray.com, et il peut
 * décrire deux disques à la fois : « 4K Blu-ray: Region free 2K Blu-ray: Region
 * B (A, C untested) ». Tel quel, ça fait un badge de soixante caractères.
 *
 * `zonesDe` fait déjà le tri pour l'onglet Détails et écarte les zones entre
 * parenthèses, marquées `untested` donc invérifiées. On s'appuie dessus plutôt
 * que d'en recopier une variante qui dériverait sans que ça se voie. Elle ne
 * retient en revanche que les lettres, `Region free` n'en étant pas une : c'est
 * la seule chose ajoutée ici, et elle vaut pour une édition entière, d'où sa
 * place en tête.
 */
function zonesEdition(region: string | null): string[] {
  const zones = zonesDe(region);
  return /\bregion\s+free\b/i.test(region ?? "") ? ["Zone libre", ...zones] : zones;
}

/**
 * Année de parution d'une édition, sur les deux colonnes qui la portent.
 *
 * `date_parution` est la colonne normalisée, mais elle n'existe que sur les
 * lignes blu-ray.com : `dates_editions.py` l'a remplie depuis `date_sortie`, et
 * editioncollector ne date rien. Prendre la seule colonne propre laisserait donc
 * la moitié du catalogue sans année.
 *
 * `date_sortie` reste du texte dans la langue de la source, « Sep 30, 2025 » ou
 * « September 8, 2024 ». On n'en tire que l'année, seule partie qui se lise sans
 * analyser la langue, et on la borne : une chaîne comme `1920x1080` porte un
 * millésime parfaitement valide, piège déjà rencontré côté import.
 */
function anneeEdition(ed: { date_parution?: string | null; date_sortie: string | null }): string {
  const normalisee = ed.date_parution?.slice(0, 4);
  if (normalisee && /^(19|20)\d{2}$/.test(normalisee)) return normalisee;
  const m = /(?:^|[^\dx×])((?:19|20)\d{2})(?:$|[^\dx×])/.exec(ed.date_sortie ?? "");
  return m ? m[1] : "";
}

/**
 * Budget TMDB, en dollars, leur champ n'est pas converti et ne porte pas de
 * devise, mais c'est du dollar. Arrondi au million au-dessus de dix millions :
 * « 15 000 000 $ » donne une précision que la donnée n'a pas.
 */
function formatBudget(raw: number | null): string {
  if (!raw || raw <= 0) return "";
  if (raw >= 10_000_000) return `${Math.round(raw / 1_000_000)} M$`;
  return `${raw.toLocaleString("fr-FR")} $`;
}

function formatDuration(raw: string | null): string {
  if (!raw) return "";
  const total = parseInt(String(raw), 10);
  if (isNaN(total)) return String(raw);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return `${h}h ${String(min).padStart(2, "0")}min`;
}

/**
 * Les données que la Pages Function a posées dans la page, si elles portent
 * bien sur ce film.
 *
 * Le Worker a déjà lu le film et ses éditions pour écrire le `<head>`, le corps
 * et le JSON-LD ; il les inline dans un `<script type="application/json">`
 * (cf. `donneesInlinees` dans `functions/_middleware.ts`). Les reprendre évite
 * un aller-retour qui, mesuré en production, ne rendait la liste des éditions
 * qu'à 2 823 ms.
 *
 * **L'identifiant est vérifié.** Une navigation interne vers une autre fiche
 * trouverait encore le bloc de la page d'entrée ; il ne doit servir qu'à celle
 * pour laquelle il a été écrit.
 *
 * Le bloc n'est pas consommé : la page relit derrière, sans écran de
 * chargement, donc un second montage sur la même fiche repart du même état
 * initial et se rafraîchit pareil. Rien ne dépend de l'ordre.
 */
function ficheInlinee(filmId: number): { film: Film; editions: Edition[] } | null {
  try {
    const bloc = document.getElementById("donnees-fiche");
    if (!bloc?.textContent) return null;
    const charge = JSON.parse(bloc.textContent) as { film?: Film; editions?: Edition[] };
    if (!charge.film || charge.film.id !== filmId) return null;
    return { film: charge.film, editions: charge.editions ?? [] };
  } catch {
    /* Bloc absent, tronqué, illisible : on charge par le réseau comme avant. */
    return null;
  }
}

/**
 * L'URL d'une offre, si et seulement si c'est un lien HTTPS.
 *
 * `offres.url` est le seul `href` du site construit depuis la base, et rien en
 * aval ne le filtre : React ne bloque pas `javascript:` (il n'avertit qu'en
 * développement), et le contrôle de schéma de react-router ne couvre que
 * `<Link to>`, pas un `<a>` écrit à la main.
 *
 * Le contrôle est au rendu et non à l'écriture, parce que l'affichage est le
 * seul endroit qui voie toutes les sources : la colonne est remplie par
 * `offres_awin.py` aujourd'hui, elle le sera par un autre programme demain.
 * Les 724 lignes en base sont toutes en `https`, ce garde-fou ne corrige donc
 * rien, il empêche qu'un flux marchand fasse un jour entrer autre chose.
 */
function lienMarchand(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** `photo` est une URL TMDB complète, posée par `enrichir_tmdb.py --cast-seul`.
 *  Absente sur les seconds rôles que TMDB n'illustre pas. */
interface CastMember { nom: string; role: string; photo?: string }

function parseCast(val: unknown): CastMember[] {
  if (!val) return [];
  try {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return (arr as CastMember[]).filter((m) => m && m.nom);
  } catch {
    return [];
  }
}

/* ---- sub-components ---- */

interface CircleStatusButtonsProps {
  editionId: number;
  status: StatutValue | undefined;
  /** Les statuts du compte sont-ils connus ? Faux le temps que la session soit
   *  tranchée : les pastilles sont alors sourdes plutôt que menteuses. */
  pret: boolean;
  /** La page tient la bascule : elle écrit en base, ou ouvre la modale de
   *  connexion s'il n'y a pas de compte. Ce composant n'a pas à le savoir. */
  onToggle: (editionId: number, value: StatutValue) => void;
}

function CircleStatusButtons({ editionId, status, pret, onToggle }: CircleStatusButtonsProps) {
  const handle = (value: StatutValue) => { if (pret) onToggle(editionId, value); };

  const collectionActive = status === "possede";
  const wishlistActive = status === "envie";

  return (
    <div className="flex gap-[6px] shrink-0 items-center">
      <button
        type="button"
        onClick={() => handle("possede")}
        aria-pressed={collectionActive}
        title={collectionActive ? "Retirer de la collection" : "Ajouter à la collection"}
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
        style={{
          backgroundColor: collectionActive ? "var(--reel-accent)" : "var(--reel-surface-2)",
          border: "none",
        }}
      >
        {collectionActive
          ? <Library size={15} color="#fff" strokeWidth={2.2} />
          : <Plus size={15} color="var(--reel-muted)" strokeWidth={2} />}
      </button>

      <button
        type="button"
        onClick={() => handle("envie")}
        aria-pressed={wishlistActive}
        title={wishlistActive ? "Retirer des envies" : "Ajouter aux envies"}
        className="flex items-center justify-center rounded-full size-[36px] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
        style={{
          backgroundColor: wishlistActive ? "var(--reel-accent)" : "var(--reel-surface-2)",
          border: "none",
        }}
      >
        <Bookmark
          size={15}
          color={wishlistActive ? "#fff" : "var(--reel-muted)"}
          fill={wishlistActive ? "#fff" : "none"}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}>{children}</h2>
  );
}

type LigneFiche = { label: string; value: React.ReactNode } | false | null | undefined | "";

/**
 * Carte libellé/valeur, reprise de la maquette : un filet sous chaque ligne, le
 * libellé en gris à gauche sur une colonne fixe, la valeur plus grande à
 * droite. Les filets font le travail que les capsules faisaient mal, ils
 * séparent sans ajouter d'objet visuel.
 *
 * La carte disparaît entièrement quand aucune ligne n'est renseignée. Un bloc
 * technique vide n'apprendrait rien, et il serait vide sur les 3 193 éditions
 * editioncollector, qui ne publient pas de fiche technique.
 */
function BlocFiche({
  titre,
  lignes,
  note,
}: {
  titre: string;
  lignes: LigneFiche[];
  note?: string;
}) {
  const visibles = lignes.filter(Boolean) as { label: string; value: React.ReactNode }[];
  if (visibles.length === 0) return null;

  return (
    <section
      className="rounded-[12px] px-5 py-4"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <TitreSection>{titre}</TitreSection>
      <dl className="pt-2">
        {visibles.map(({ label, value }, i) => (
          <div
            key={label}
            className="flex gap-5 py-3"
            style={{
              // Pas de filet sous la dernière ligne : il doublerait le bord de
              // la carte.
              borderBottom: i < visibles.length - 1 ? "1px solid var(--reel-border)" : "none",
            }}
          >
            <dt
              className="shrink-0 w-[120px]"
              style={{ fontSize: "14px", color: "var(--reel-muted)", lineHeight: "24px" }}
            >
              {label}
            </dt>
            <dd style={{ fontSize: "16px", color: "var(--reel-text)", lineHeight: "24px" }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {note && (
        <p className="pt-1" style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "20px" }}>
          {note}
        </p>
      )}
    </section>
  );
}

/**
 * Une carte d'acteur : portrait, nom, rôle. En grille et non en liste, la
 * liste empilée tenait dans une colonne étroite, mais elle lisait comme un
 * annuaire, et les portraits se réduisaient à des pastilles d'initiales de
 * 36 px où l'on ne reconnaissait personne.
 *
 * Le portrait garde le rapport 2/3 de l'affiche, même sans image : sans
 * hauteur imposée, les cartes sans photo remontaient et cassaient l'alignement
 * des noms d'une colonne à l'autre.
 */
function CarteActeur({ membre, onClick }: { membre: CastMember; onClick: () => void }) {
  /*
    `w-full` sur le bouton est indispensable : un `<button>` se dimensionne sur
    son contenu, même passé en `flex`. La vignette est en `w-full` avec un
    rapport 2/3, donc elle suivait cette largeur adaptée au contenu, et une carte
    sans photo retombait sur les 48 px de la pastille d'initiales, plus étroite
    et plus courte que ses voisines. La largeur fixe posée par l'enveloppe du
    rail ne descendait pas jusqu'ici.
  */
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-[10px] text-left outline-none"
    >
      <span
        className="relative block w-full overflow-hidden rounded-[10px]"
        style={{ aspectRatio: "2 / 3", backgroundColor: "var(--reel-surface)" }}
      >
        {membre.photo ? (
          // Zoom léger plutôt qu'un voile : assombrir un portrait déjà sombre
          // ne se voyait pas, alors que le mouvement se remarque tout de suite.
          <ImageWithFallback
            src={membre.photo}
            alt={membre.nom}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <UserAvatar name={membre.nom} size={48} />
          </span>
        )}

        {/*
          Le contour du survol et du focus est **dessiné à l'intérieur** de la
          vignette, par une couche posée par-dessus l'image, et non par un `ring`
          sur le bouton.

          Un `ring` se peint hors de la boîte. Le rail ayant perdu son
          rembourrage horizontal le jour où la gouttière est devenue
          proportionnelle, la première carte touche le bord du scrollport, et
          `overflow-x: auto` rogne tout ce qui dépasse : le contour sortait
          tronqué sur le premier et le dernier acteur, avec des coins coupés net.

          Le focus passe par `group-focus-visible` pour la même raison, et parce
          que deux contours, un sur le bouton et un sur la vignette, en font un
          de trop.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-transparent transition group-hover:ring-[var(--reel-accent-clair)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--reel-accent-clair)]"
        />
      </span>
      {/* La couleur passe par une classe et non par `style` : une couleur en
          ligne l'emporte sur toute règle CSS, y compris sur le survol. */}
      <span
        className="block text-[var(--reel-text)] transition-colors group-hover:text-[var(--reel-accent-clair)]"
        style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19px" }}
      >
        {membre.nom}
      </span>
      {membre.role && (
        <span className="block" style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "18px" }}>
          {membre.role}
        </span>
      )}
    </button>
  );
}

const TABS = ["Editions", "Détails", "Critiques", "Listes"] as const;
type Tab = (typeof TABS)[number];

/* ---- main page ---- */

export function FilmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const filmId = Number(id);

  /* Lu une fois, avant le premier rendu : un effet s'exécute après la peinture,
     donc y lire le bloc laisserait passer une image vide pour rien. */
  const [initial] = useState(() => ficheInlinee(filmId));
  const [film, setFilm] = useState<Film | null>(initial?.film ?? null);
  const [editions, setEditions] = useState<Edition[]>(initial?.editions ?? []);
  const [statuts, setStatuts] = useState<Record<number, StatutValue>>({});
  /* Les pastilles ne disent rien du visiteur tant que c'est faux : la fiche
     s'affiche désormais avant que la session soit tranchée, et « pas dans
     votre collection » serait affirmé sans le savoir. */
  const [statutsPrets, setStatutsPrets] = useState(false);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Editions");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  /** Visionneuse : la liste montrée et l'image courante, ou rien. */
  const [lanterne, setLanterne] = useState<{ images: string[]; index: number; titre: string } | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [synopsisOuvert, setSynopsisOuvert] = useState(false);
  /** Vrai quand le synopsis déborde de ses quatre lignes, mesuré, pas deviné
   *  sur une longueur de chaîne : quatre lignes de 375 px et quatre lignes de
   *  640 px n'accueillent pas le même nombre de signes. */
  const [synopsisDeborde, setSynopsisDeborde] = useState(false);
  const synopsisRef = useRef<HTMLParagraphElement | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const session = useSession();

  /*
    Le « voir plus » n'apparaît que si le texte est vraiment coupé. Un synopsis
    de deux lignes n'a pas de suite à montrer, et le bouton mentirait.

    Remesuré au redimensionnement : la troncature dépend de la largeur, et une
    rotation d'écran fait passer un texte de cinq lignes à trois.
  */
  useEffect(() => {
    const el = synopsisRef.current;
    if (!el) return;
    const mesurer = () => {
      if (synopsisOuvert) return;      // déplié, il ne déborde plus par construction
      setSynopsisDeborde(el.scrollHeight > el.clientHeight + 1);
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
  }, [film?.synopsis, synopsisOuvert]);

  /*
   * Le film et ses éditions sont publics : ils ne dépendent d'aucune session et
   * ne doivent donc rien attendre.
   *
   * Ils l'attendaient, et ça coûtait une seconde de page vide. Mesuré en
   * production le 3 août 2026, sur une visite connectée :
   *
   *     1608 ms  bundle chargé, React monte
   *     2102 ms  morceau auth-client
   *     2512 ms  rafraîchissement du jeton  <- la session est tranchée ici
   *     2823 ms  films, editions, collections
   *
   * Soit quatre allers-retours en série là où deux suffisent. Le motif d'alors
   * était juste, mais il ne visait que les statuts : voir l'effet suivant.
   */
  useEffect(() => {
    let cancelled = false;

    /* Le bloc inliné par la Pages Function, s'il porte sur cette fiche. Relu
       ici et pas seulement à l'état initial : une navigation interne change
       `filmId` sans remonter le composant. */
    const local = ficheInlinee(filmId);
    if (local) {
      setFilm(local.film);
      setEditions(local.editions);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    (async () => {
      try {
        const [f, eds] = await Promise.all([getFilm(filmId), getEditionsForFilm(filmId)]);
        if (cancelled) return;
        setFilm(f);
        setEditions(eds);
      } catch (e) {
        /* Avec des données inlinées à l'écran, une lecture ratée ne doit pas
           remplacer une fiche lisible par un message d'erreur : le réseau a
           échoué, le contenu affiché reste vrai. */
        if (!cancelled && !local) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filmId]);

  /*
   * Les statuts, eux, attendent bel et bien la session, et c'est le motif
   * d'origine : sans elle on les lirait vides pour les remplacer aussitôt par
   * ceux du compte, et les boutons changeraient d'état sous le curseur.
   *
   * `statutsPrets` porte cette attente à l'écran. Sans lui, la page s'affiche
   * plus tôt mais les pastilles annoncent « pas dans votre collection » avant
   * de savoir, ce qui est un mensonge d'une seconde sur la seule chose que la
   * page dise du visiteur.
   */
  useEffect(() => {
    if (session === undefined || editions.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        // Vide sans compte (cf. lib/collections.ts).
        const st = await chargerStatuts(editions.map((e) => e.id));
        if (!cancelled) { setStatuts(st); setStatutsPrets(true); }
      } catch {
        // Un statut illisible ne doit pas emporter la fiche : on laisse les
        // pastilles neutres plutôt que d'afficher une erreur sur la page.
        if (!cancelled) setStatutsPrets(true);
      }
    })();
    return () => { cancelled = true; };
    // `session?.user.id` et non `session` : l'objet est recréé à chaque
    // rafraîchissement de jeton, ce qui rechargerait la page toutes les heures.
  }, [editions, session === undefined, session?.user.id]);

  /*
   * Titre et description propres à la fiche. Tant que le film n'est pas chargé
   * on passe null : useSeo laisse alors le <head> intact plutôt que d'écrire un
   * canonical sur une page qui n'existe peut-être pas.
   */
  const seo = useMemo<Seo | null>(() => {
    if (!film) return null;

    const annee = film.annee ? ` (${film.annee})` : "";
    const nb = editions.length;
    // Le synopsis décrit le film ; à défaut on décrit ce que la page apporte
    // vraiment, c'est-à-dire le nombre d'éditions recensées.
    const description = film.synopsis
      ? extrait(film.synopsis)
      : nb > 0
      ? `${nb} édition${nb > 1 ? "s" : ""} de ${film.titre}${annee} recensée${nb > 1 ? "s" : ""} : formats, zones, dates de sortie et codes-barres.`
      : `Les éditions Blu-ray, 4K et coffrets de ${film.titre}${annee}.`;

    return {
      titre: `${film.titre}${annee}, éditions Blu-ray, 4K et coffrets`,
      description,
      image: film.affiche_url,
      type: "video.movie",
    };
  }, [film, editions.length]);

  useSeo(seo);

  const onStatusChange = (editionId: number, status: StatutValue | null) => {
    setStatuts((prev) => {
      const next = { ...prev };
      if (status === null) delete next[editionId];
      else next[editionId] = status;
      return next;
    });
  };

  /**
   * Unique point de bascule d'un statut. On attend la confirmation avant de
   * bouger l'interface : avec un compte, l'écriture passe par le réseau, et
   * afficher « Ajouté » sur un enregistrement qui a échoué serait un mensonge.
   */
  const basculer = async (editionId: number, value: StatutValue) => {
    try {
      const next = await basculerStatut(editionId, value);
      onStatusChange(editionId, next);
      toast.success(
        next === null
          ? value === "possede" ? "Retiré de votre collection" : "Retiré de vos envies"
          : value === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies"
      );
    } catch (e) {
      // Sans compte, on explique au lieu d'afficher une erreur : le visiteur
      // n'a rien fait de mal, il lui manque juste un compte.
      if (e instanceof CompteRequis) setModaleOuverte(true);
      else toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  /* Dropdown state for edition picker */
  const [openDropdown, setOpenDropdown] = useState<StatutValue | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  /* Toggle a specific edition for a given statut value */
  const handleEditionStatut = (editionId: number, value: StatutValue) => {
    void basculer(editionId, value);
    setOpenDropdown(null);
  };

  /* Main button click: if single edition, toggle directly; if multiple, open picker */
  const handleMainCta = (value: StatutValue) => {
    if (editions.length === 0) return;
    if (editions.length === 1) {
      handleEditionStatut(editions[0].id, value);
    } else {
      setOpenDropdown((prev) => (prev === value ? null : value));
    }
  };

  if (loading) {
    return (
      <AttentePleine hauteur="60vh" />
    );
  }

  if (error || !film) {
    return (
      <div className="px-16 pt-[120px]">
        <Link to="/" className="inline-flex items-center gap-1.5 mb-6" style={{ fontSize: "14px", color: "var(--reel-muted)" }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <p style={{ fontSize: "14px", color: error ? "#ff6b6b" : "var(--reel-muted)" }}>
          {error ?? "Film introuvable."}
        </p>
      </div>
    );
  }

  const genres = splitList(film.genres);
  const castList = parseCast(film.cast_principal);
  const scenaristes = splitList(film.scenariste);

  const allFormats = Array.from(
    new Set(editions.flatMap((ed) => splitList(ed.formats_extraits)).filter(Boolean))
  );

  const filteredEditions = formatFilter
    ? editions.filter((ed) =>
        splitList(ed.formats_extraits).some((f) => f.toLowerCase() === formatFilter.toLowerCase())
      )
    : editions;

  const durationFormatted = formatDuration(film.duree);
  const paysList = splitList(film.pays);
  const producteurs = splitList(film.producteurs);
  const dateSortieFr = formatDateSortie(film.date_sortie);
  const budgetFormate = formatBudget(film.budget);
  const specs = agregerSpecs(editions);

  // Un titre déjà affiché ailleurs sur la carte n'apprend rien : le titre
  // anglais est le titre original dans la plupart des cas, et le répéter deux
  // lignes plus bas donne à la fiche l'air de bégayer.
  const dejaVus = new Set(
    [film.titre, film.titre_original].filter(Boolean).map((t) => String(t).toLowerCase())
  );
  const titresEtrangers = Object.entries(film.titres_alternatifs || {})
    .filter(([code, titre]) => titre && LANGUES_TITRES[code] && !dejaVus.has(titre.toLowerCase()))
    .sort((a, b) => LANGUES_TITRES[a[0]].localeCompare(LANGUES_TITRES[b[0]], "fr"));

  return (
    <div className="w-full" style={{ backgroundColor: "var(--reel-bg)", minHeight: "100vh" }}>
      {/* Hero */}
      {/* Pas de hauteur minimale : elle laissait un vide sous les boutons quand
          le film avait un synopsis court. Le héros épouse son contenu. */}
      <div className="relative w-full">
        {/*
          Le site s'appelle Jaquette : l'image de l'œuvre porte l'identité, pas
          le chrome. On prend le backdrop TMDB quand il existe, une vraie image
          large, nette, et on retombe sur l'affiche floutée sinon, faute de
          mieux. Chaque fiche a donc sa propre couleur dominante.
        */}
        {/*
          **L'atmosphère a une hauteur à elle, indépendante du contenu.**

          Elle épousait le héros, en `inset-0`. Déplier le synopsis fait grandir
          le héros, donc la boîte, donc `object-cover` recalculait son cadrage :
          l'image sautait sous le texte. Mesuré à 1 440 px sur un synopsis long,
          696 px de haut fermé contre 829 ouvert, et 673 contre 1 252 à 375 px.

          Les deux dégradés sont dans le même bloc, et pas seulement l'image :
          laissés en `inset-0`, leurs arrêts auraient continué de suivre la
          hauteur du héros, donc la part d'image voilée aurait changé au
          dépliage. C'est le même défaut, en moins voyant.

          `min(100%, …)` est un garde-fou : sans lui, un héros plus court que la
          hauteur fixée laisserait le bloc déborder sur la barre d'onglets. Les
          valeurs sont calées pour que ce cas ne se présente pas, la colonne de
          l'affiche tenant le héros à environ 600 px en bureau et 545 au moins en
          téléphone, mais une retouche de gabarit ne doit pas casser la page.

          Sous le bloc, le fond plat de la page prend le relais : le dégradé
          vertical finit déjà sur `--reel-bg`, la jonction ne se voit pas.
        */}
        {(film.backdrop_url || film.affiche_url) && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: "min(100%, clamp(420px, 40vw, 560px))" }}
          >
            <img
              src={film.backdrop_url ?? film.affiche_url ?? ""}
              alt=""
              aria-hidden
              className="absolute w-full h-full object-cover pointer-events-none"
              style={
                film.backdrop_url
                  // Atmosphère, pas illustration : un léger flou empêche l'image
                  // de disputer l'attention au texte, et un contraste réduit
                  // l'empêche de produire des zones claires sous les lettres.
                  ? {
                      opacity: 0.38,
                      objectPosition: "50% 22%",
                      filter: "blur(3px) saturate(0.85) contrast(0.9)",
                      transform: "scale(1.04)",
                    }
                  : { filter: "blur(32px)", transform: "scale(1.15)", opacity: 0.35 }
              }
            />

            {/*
              Deux dégradés, pas un. Le vertical seul laissait le texte sur une
              image nette : lisible sur un fond sombre, illisible sur un ciel
              clair ou un visage. L'horizontal donne au texte un fond franc à
              gauche et laisse l'image respirer à droite, où il n'y a rien à
              lire.
            */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(16, 23, 32,1) 0%, rgba(16, 23, 32,0.99) 40%, rgba(16, 23, 32,0.9) 58%, rgba(16, 23, 32,0.55) 78%, rgba(16, 23, 32,0.3) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(16, 23, 32,0.7) 0%, rgba(16, 23, 32,0.35) 30%, rgba(16, 23, 32,0.8) 80%, var(--reel-bg) 100%)",
              }}
            />
          </div>
        )}

        {/*
          Le lien de retour est passé à l'intérieur du héros. Dehors, il occupait
          une bande de 120 px que le backdrop ne couvrait pas : l'image
          commençait sous lui, et le haut de la page montrait un aplat gris avec
          une arête nette. Le héros part maintenant du filet de l'en-tête.

          `pt-[88px]` reste : c'est ce qui dégage l'en-tête fixe.
        */}
        <div className="reel-gouttiere relative pt-[88px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] rounded-full"
            style={{ fontSize: "14px", color: "var(--reel-muted)" }}
          >
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>

        {/*
          Grille et non pile, pour que le mobile et le bureau puissent ranger
          les mêmes blocs dans deux ordres différents sans dupliquer le balisage.

          Sur mobile, l'affiche et le titre partagent la première ligne, puis
          les boutons, puis le synopsis. Empilé, affiche centrée, titre,
          réalisation, note, synopsis, boutons, le premier écran s'arrêtait
          au milieu du synopsis : on arrivait sur la fiche sans voir une seule
          action. Le synopsis passe donc sous les boutons ; il se lit toujours,
          mais après avoir eu le choix d'agir.

          Sur écran large l'ordre d'origine tient, synopsis puis boutons, et
          l'affiche court sur les trois rangées.
        */}
        <div className="reel-gouttiere relative pb-8 sm:pb-12 pt-4 sm:pt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-4 sm:gap-x-6 sm:grid-rows-[auto_auto_auto_1fr] items-start">
          {/* Affiche, agrandissable. Le bouton n'existe que s'il y a une image
              à montrer : un cadre vide qui s'ouvre sur rien serait une panne. */}
          <button
            type="button"
            disabled={!film.affiche_url}
            onClick={() => {
              const grande = pleineResolution(film.affiche_url);
              if (grande) setLanterne({ images: [grande], index: 0, titre: `Affiche de ${film.titre}` });
            }}
            aria-label={film.affiche_url ? `Agrandir l'affiche de ${film.titre}` : undefined}
            className="group col-start-1 row-start-1 sm:row-span-4 shrink-0 self-start overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] disabled:cursor-default"
            style={{
              width: "clamp(120px, 22vw, 280px)",
              aspectRatio: "2 / 3",
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <ImageWithFallback
              src={film.affiche_url ?? ""}
              alt={`Affiche de ${film.titre}`}
              className="w-full h-full object-cover transition duration-200 group-enabled:group-hover:scale-[1.03]"
            />
          </button>

          {/* Titre, réalisation, note, la colonne à droite de l'affiche */}
          <div className="col-start-2 row-start-1 min-w-0 flex flex-col gap-2 sm:gap-1.5">
            <div>
              <h1
                style={{
                  // Les variables ne sont posées que par le sélecteur d'essai,
                  // en développement. En production, les replis s'appliquent.
                  fontFamily: "var(--reel-font-titre)",
                  // 22 px au plancher : à 30 px, le titre occupait trois lignes
                  // à côté d'une affiche de 120 px et repoussait tout le reste.
                  fontSize: "clamp(22px, 3.4vw, 44px)",
                  fontWeight: 800,
                  color: "var(--reel-text)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  textTransform: "none",
                }}
              >
                {film.titre}
                {film.annee && (
                  // Espace insécable large plutôt qu'une espace ordinaire : à
                  // 44 px, l'espace du titre est trop serrée et l'année colle
                  // au dernier mot. Graisse 200, le plus fin que Bricolage
                  // Grotesque propose : contre un titre en 800, plus l'écart
                  // est large, moins l'année se lit comme un morceau du titre.
                  <span style={{ fontWeight: 200, color: "var(--reel-muted)" }}>
                    {"  "}({film.annee})
                  </span>
                )}
              </h1>
            </div>

            {/*
              Le héros s'en tient à ce qui situe le film : titre, auteur, note,
              récit, action. Accroche, durée, genres et distribution vivent dans
              l'onglet Détails, les empiler ici repoussait les boutons hors de
              vue sans rien apprendre d'essentiel.
            */}
            <p style={{ fontSize: "15px", color: "var(--reel-muted)", lineHeight: "22.5px" }}>
              {film.realisateur && (
                <>
                  {/* « Réalisé par » saute sur mobile : dans une colonne de
                      200 px, ces trois mots prennent une ligne entière pour
                      annoncer ce que la position dit déjà. */}
                  <span className="hidden sm:inline">Réalisé par </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(film.realisateur)}
                    className="outline-none transition"
                    style={{ color: "var(--reel-text)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "rgba(232,232,232,0.3)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--reel-text)")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "rgba(232,232,232,0.3)")}
                  >
                    {film.realisateur}
                  </button>
                </>
              )}
            </p>

            {/*
              La note s'aère au-dessus, et seulement à partir de `sm`.

              Les deux écarts qui l'encadrent ne se comparent pas en boîtes : la
              réalisation est en 15/22,5, donc elle porte 3,75 px de demi-interligne
              sous son texte, et le synopsis 4,5 px au-dessus du sien. La note, elle,
              a une interligne de 18 pour une icône de 18, donc rien. Mesuré à
              1 512 px, l'encre disait 9,75 px au-dessus contre 20,5 en dessous : le
              gabarit paraissait équilibré, l'œil voyait la note collée à la
              réalisation.

              11 px de marge remettent les deux à 20,75 contre 20,5, soit un quart
              de pixel d'écart. Et rien ne descend : l'affiche est en `row-span-4`
              sur des rangées `auto auto auto 1fr`, donc la quatrième, vide, absorbe
              les onze pixels. Mesuré, le héros fait 492 px avec comme sans.

              Sous `sm`, la grille se réordonne et la note est suivie des boutons,
              à plus de cent pixels : il n'y a aucun déséquilibre à corriger, et
              onze pixels de plus se paieraient sur un écran de 375.
            */}
            {film.note != null && film.note !== "" && (
              <div className="flex items-center gap-[6px] sm:mt-[11px]">
                <Star size={18} color="#d9a441" fill="#d9a441" />
                {/* TMDB rend 7.901 : trois décimales suggèrent une précision
                    que la note n'a pas. Deux suffisent. */}
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)", lineHeight: "18px" }}>
                  {Number(film.note).toFixed(2)}
                </span>
                <span style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "18px" }}>/ 10</span>
              </div>
            )}
          </div>

          {film.synopsis && (
            /*
              Quatre lignes partout, dépliables. Un synopsis TMDB fait souvent
              quinze lignes à 375 px, et jusqu'à huit en desktop : entier, il
              repoussait les boutons puis la barre d'onglets si bas qu'on ne
              soupçonnait plus leur existence.

              La troncature a d'abord été réservée au mobile, au motif qu'un
              écran large avait la place. Il l'a, mais ce n'est pas la question :
              le héros doit tenir dans le premier écran, boutons compris, et
              c'est la longueur du texte qui décide, pas celle de l'écran.

              `line-clamp` et non une troncature de la chaîne : couper le texte
              en JavaScript demanderait de deviner combien de signes tiennent
              sur quatre lignes, ce qui dépend de la largeur et de la police.
            */
            <div className="col-span-2 row-start-3 sm:col-span-1 sm:col-start-2 sm:row-start-2 sm:mb-2 max-w-[640px]">
              {/*
                Le texte s'éteint vers le bas quand il est coupé, du blanc de
                lecture au gris des mentions, par un dégradé découpé sur les
                glyphes (`background-clip: text`).

                C'est ce qui dit que la phrase continue. Une coupe franche au
                milieu d'une ligne se lit comme une fin, et « Voir plus » devient
                alors le seul indice, ce qui est mince pour un bouton de 14 px.

                **Conditionné à `synopsisDeborde`, pas seulement à l'état
                fermé.** Un synopsis de deux lignes n'a rien à cacher : l'éteindre
                laisserait croire à une suite qui n'existe pas, la même faute que
                celle du bouton qui mentirait.

                Le dégradé s'arrête à `var(--reel-muted)`, la couleur des
                mentions du site, et non à `transparent` : la dernière ligne
                resterait lisible mais deviendrait un texte à contraste presque
                nul, alors qu'elle porte encore du sens.

                Deux propriétés en même temps, `color` et
                `-webkit-text-fill-color` : la seconde l'emporte sur la première
                dans les moteurs WebKit, et sans elle le texte reste peint par
                dessus le dégradé.
              */}
              <p
                ref={synopsisRef}
                className={synopsisOuvert ? "" : "line-clamp-4"}
                style={{
                  fontSize: "15px",
                  lineHeight: "24px",
                  color: "var(--reel-text)",
                  ...(synopsisDeborde && !synopsisOuvert
                    ? {
                        backgroundImage:
                          "linear-gradient(to bottom, var(--reel-text) 0%, var(--reel-text) 45%, var(--reel-muted) 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        WebkitTextFillColor: "transparent",
                      }
                    : null),
                }}
              >
                {film.synopsis}
              </p>
              {synopsisDeborde && (
                <button
                  type="button"
                  onClick={() => setSynopsisOuvert((o) => !o)}
                  className="mt-1 rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                  style={{ fontSize: "14px", fontWeight: 500, color: "var(--reel-accent-clair)" }}
                >
                  {synopsisOuvert ? "Voir moins" : "Voir plus"}
                </button>
              )}
            </div>
          )}

          {/* Global CTA buttons */}
          <div
            ref={dropdownRef}
            className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-3 relative flex flex-wrap gap-[10px] items-center"
          >
              {/* Add to Collection split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleMainCta("possede")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "var(--reel-accent)", fontSize: "15px", fontWeight: 500, color: "#fff" }}
                  >
                    <Library size={16} color="#fff" strokeWidth={2} />
                    Ajouter à la collection
                  </button>
                  <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.3)" }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "possede" ? null : "possede"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "var(--reel-accent)" }}
                    title="Choisir une édition"
                  >
                    <ChevronDown
                      size={16}
                      color="#fff"
                      style={{ transform: openDropdown === "possede" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                </div>

                {openDropdown === "possede" && (
                  <div
                    className="absolute left-0 mt-2 z-50 rounded-[12px] overflow-hidden py-2"
                    style={{
                      backgroundColor: "var(--reel-surface)",
                      border: "1px solid var(--reel-border)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "var(--reel-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Choisir une édition
                    </p>
                    {editions.map((ed) => {
                      const active = statuts[ed.id] === "possede";
                      return (
                        <button
                          key={ed.id}
                          type="button"
                          onClick={() => handleEditionStatut(ed.id, "possede")}
                          className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 transition"
                          style={{
                            fontSize: "14px",
                            color: active ? "var(--reel-accent-clair)" : "var(--reel-text)",
                            backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--reel-accent-soft)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Library size={15} color="var(--reel-accent-clair)" strokeWidth={2.2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add to Wishlist split button */}
              <div className="relative">
                <div className="flex h-[40px] rounded-full overflow-hidden" style={{ border: "1px solid var(--reel-border)" }}>
                  <button
                    type="button"
                    onClick={() => handleMainCta("envie")}
                    className="flex items-center gap-[6px] pl-[17px] pr-[13px] transition"
                    style={{ backgroundColor: "transparent", fontSize: "15px", fontWeight: 500, color: "var(--reel-accent-clair)" }}
                  >
                    <Bookmark size={16} color="var(--reel-accent-clair)" fill="none" strokeWidth={2} />
                    Ajouter aux envies
                  </button>
                  <div style={{ width: "1px", backgroundColor: "var(--reel-accent)", opacity: 0.3 }} />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((p) => (p === "envie" ? null : "envie"))}
                    className="flex items-center px-[9px] transition"
                    style={{ backgroundColor: "transparent" }}
                    title="Choisir une édition"
                  >
                    <ChevronDown
                      size={16}
                      color="var(--reel-accent-clair)"
                      style={{ transform: openDropdown === "envie" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>
                </div>

                {openDropdown === "envie" && (
                  <div
                    className="absolute left-0 mt-2 z-50 rounded-[12px] overflow-hidden py-2"
                    style={{
                      backgroundColor: "var(--reel-surface)",
                      border: "1px solid var(--reel-border)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      minWidth: "260px",
                    }}
                  >
                    <p className="px-4 py-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "var(--reel-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Choisir une édition
                    </p>
                    {editions.map((ed) => {
                      const active = statuts[ed.id] === "envie";
                      return (
                        <button
                          key={ed.id}
                          type="button"
                          onClick={() => handleEditionStatut(ed.id, "envie")}
                          className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 transition"
                          style={{
                            fontSize: "14px",
                            color: active ? "var(--reel-accent-clair)" : "var(--reel-text)",
                            backgroundColor: active ? "var(--reel-accent-soft)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? "var(--reel-accent-soft)" : "transparent"; }}
                        >
                          <span className="truncate">{ed.titre ?? "Édition sans titre"}</span>
                          {active && <Bookmark size={15} color="var(--reel-accent-clair)" fill="var(--reel-accent-clair)" strokeWidth={2} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="sticky top-[64px] z-10"
        style={{ backgroundColor: "var(--reel-bg)", borderBottom: "1px solid var(--reel-border)" }}
      >
        <div className="reel-gouttiere flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-3 outline-none transition"
              style={{
                fontSize: "15px",
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? "var(--reel-text)" : "var(--reel-muted)",
              }}
            >
              {tab}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: "var(--reel-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="reel-gouttiere py-6 pb-24">

        {activeTab === "Editions" && (
          <div className="flex flex-col gap-4">
            {allFormats.length > 0 && (
              /*
                Une seule ligne, qui défile latéralement au besoin.

                En `flex-wrap`, sept formats passaient sur trois lignes en
                mobile et poussaient la première édition sous le pli. Une barre
                de filtres est un rail : elle doit tenir sur sa ligne, quitte à
                ce qu'on la fasse glisser. Les capsules gardent `shrink-0`,
                sinon flex les comprime au lieu de déborder, et les marges
                négatives font mordre le rail sur le rembourrage de la page,
                sans elles, le défilement s'arrêterait avant le bord et laisserait
                croire qu'il n'y a plus rien.

                Les valeurs doivent rester le miroir exact de `.reel-gouttiere`.
                À partir de `lg` celle-ci n'a plus de rembourrage, elle pilote la
                proportion par sa largeur : d'où le retour à zéro. Les `lg:-mx-10
                lg:px-10` d'avant compensaient un rembourrage disparu, la bande
                dépassait donc de 40 px dans la marge de chaque côté.
              */
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setFormatFilter(null)}
                  className="shrink-0 whitespace-nowrap rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                  style={{
                    backgroundColor: formatFilter === null ? "var(--reel-accent)" : "var(--reel-surface)",
                    border: `1px solid ${formatFilter === null ? "var(--reel-accent-clair)" : "var(--reel-border)"}`,
                    fontSize: "13px", fontWeight: 500,
                    color: formatFilter === null ? "#fff" : "var(--reel-muted)",
                    padding: "7px 13px",
                  }}
                >
                  Tous
                </button>
                {allFormats.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormatFilter(fmt === formatFilter ? null : fmt)}
                    className="shrink-0 whitespace-nowrap rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                    style={{
                      backgroundColor: formatFilter === fmt ? "var(--reel-accent)" : "var(--reel-surface)",
                      border: `1px solid ${formatFilter === fmt ? "var(--reel-accent-clair)" : "var(--reel-border)"}`,
                      fontSize: "13px", fontWeight: 500,
                      color: formatFilter === fmt ? "#fff" : "var(--reel-muted)",
                      padding: "7px 13px",
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}

            {filteredEditions.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>Aucune édition pour ce film.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEditions.map((ed) => {
                  const fmtTags = splitList(ed.formats_extraits);
                  const annee = anneeEdition(ed);
                  return (
                    <div
                      key={ed.id}
                      className="rounded-[12px] w-full"
                      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
                    >
                      <div className="flex gap-3 items-center p-[13px]">
                        {(() => {
                          // L'image principale d'abord, puis les visuels du dos
                          // et de l'intérieur. `splitList` parce que la colonne
                          // porte tantôt un tableau, tantôt une chaîne.
                          const visuels = [ed.image_url, ...splitList(ed.images_secondaires)]
                            .filter((u): u is string => Boolean(u));
                          const nom = ed.titre ?? "Édition";
                          return (
                            <button
                              type="button"
                              disabled={visuels.length === 0}
                              onClick={() => setLanterne({ images: visuels, index: 0, titre: nom })}
                              aria-label={visuels.length ? `Agrandir les visuels de ${nom}` : undefined}
                              className="group shrink-0 overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] disabled:cursor-default"
                              style={{ width: 56, height: 84, backgroundColor: "var(--reel-bg)" }}
                            >
                              {/* 200 px pour un cadre de 56 : de quoi rester net
                                  sur un écran à densité double, sans payer les
                                  928 Ko de l'original Leclerc (cf. `vignette`). */}
                              <ImageWithFallback
                                src={vignette(ed.image_url, 200) ?? ""}
                                alt={nom}
                                className="w-full h-full object-cover transition duration-200 group-enabled:group-hover:scale-[1.06]"
                              />
                            </button>
                          );
                        })()}

                        <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                          <p
                            className="truncate"
                            style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)", lineHeight: "22.5px" }}
                          >
                            {ed.titre ?? "Édition sans titre"}
                          </p>

                          {/*
                            Format, zone et pays en badges, puis l'année en
                            texte nu. La distinction n'est pas décorative : le
                            badge dit une propriété du disque relevée à la
                            source, l'année est une date et se lit comme telle.
                          */}
                          {(fmtTags.length > 0 || ed.region || ed.pays || annee) && (
                            <div className="flex flex-wrap items-center gap-[6px]">
                              {[...fmtTags, ...zonesEdition(ed.region), ed.pays]
                                .filter((v): v is string => Boolean(v))
                                .map((valeur) => (
                                  <span
                                    key={valeur}
                                    className="rounded-full"
                                    style={{
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                      padding: "2px 9px",
                                      color: "var(--reel-muted)",
                                      backgroundColor: "var(--reel-surface-2)",
                                      border: "1px solid var(--reel-border)",
                                    }}
                                  >
                                    {valeur}
                                  </span>
                                ))}
                              {annee && (
                                <span style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "19.5px" }}>
                                  {annee}
                                </span>
                              )}
                            </div>
                          )}

                          {/*
                            Le prix sur sa propre ligne, sous les badges, comme
                            la maquette (node 1:146) : en graisse et en couleur
                            de texte, là où les badges et l'année restent gris.
                            C'est la seule valeur de la ligne qu'on vient
                            chercher, elle ne se lit pas au milieu du reste.

                            La devise vient de la source : Zavvi est britannique
                            et ses 4 446 prix sont en livres (cf. `lib/prix.ts`).
                            « conseillé » est écrit parce que c'est un prix de
                            sortie, pas une cote.
                          */}
                          {/*
                            **Une offre réelle chasse le prix conseillé**, elle
                            ne s'affiche pas à côté. Deux prix sur la même ligne
                            demanderaient au lecteur de deviner lequel il paie,
                            et le conseillé est justement celui qu'on ne paie
                            pas : c'est un prix de sortie, parfois vieux de dix
                            ans.

                            `rel="sponsored"` n'est pas un ornement : un lien
                            d'affiliation non déclaré est un montage de liens
                            aux yeux de Google, et la sanction porte sur le
                            site entier. `noopener noreferrer` suit la règle des
                            autres `target="_blank"` du site.

                            La date du relevé est en `title` plutôt qu'à
                            l'écran : un prix se date, mais l'écrire sur chaque
                            ligne d'un film à soixante éditions noierait la
                            valeur qu'on vient chercher.
                          */}
                          {/*
                            **L'offre est choisie, pas prise au hasard**, depuis
                            que momox shop vend de l'occasion à côté du neuf
                            d'E.Leclerc : `offreAAfficher` prend la moins chère
                            et l'état est écrit à côté du marchand. Sans ce
                            libellé, le classement par prix serait trompeur, un
                            « état acceptable » à 3,49 € n'étant pas une bonne
                            affaire sur un neuf mais un autre produit.
                          */}
                          {(() => {
                            const offre = offreAAfficher(ed.offres);
                            if (offre) {
                              const montant = formaterMontant(offre.prix, offre.devise);
                              const jour = new Date(offre.releve_le).toLocaleDateString("fr-FR");
                              const lien = lienMarchand(offre.url);
                              const etat = offre.etat ? LIBELLE_ETAT[offre.etat] : null;
                              /* Sans lien utilisable, on garde le prix et le
                                 marchand : c'est l'information, le lien n'est
                                 que le chemin pour y aller. Même repli que
                                 pour un prix absent, une ligne plus bas. */
                              const contenu = (
                                <>
                                  <span
                                    className="tabular-nums"
                                    style={{ fontSize: "15px", fontWeight: 600, lineHeight: "22.5px" }}
                                  >
                                    {montant}
                                  </span>
                                  <span style={{ fontSize: "12px" }}>
                                    chez {offre.marchand}
                                    {etat ? ` — ${etat}` : ""}
                                  </span>
                                </>
                              );
                              return (
                                <p className="flex items-baseline gap-1.5">
                                  {lien ? (
                                    <a
                                      href={lien}
                                      target="_blank"
                                      rel="sponsored noopener noreferrer"
                                      title={`Prix relevé le ${jour}`}
                                      className="flex items-baseline gap-1.5 hover:underline"
                                      style={{ color: "var(--reel-accent-clair)" }}
                                    >
                                      {contenu}
                                    </a>
                                  ) : (
                                    <span
                                      title={`Prix relevé le ${jour}`}
                                      className="flex items-baseline gap-1.5"
                                      style={{ color: "var(--reel-muted)" }}
                                    >
                                      {contenu}
                                    </span>
                                  )}
                                </p>
                              );
                            }
                            const conseille =
                              formaterPrix(ed.prix_editeur, ed.source) ??
                              formaterPrix(ed.prix_fnac_extrait, ed.source);
                            if (!conseille) return null;
                            return (
                              <p className="flex items-baseline gap-1.5">
                                <span
                                  className="tabular-nums"
                                  style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)", lineHeight: "22.5px" }}
                                >
                                  {conseille}
                                </span>
                                {formaterPrix(ed.prix_editeur, ed.source) && (
                                  <span style={{ fontSize: "12px", color: "var(--reel-muted)" }}>conseillé</span>
                                )}
                              </p>
                            );
                          })()}

                        </div>

                        {/*
                          Le code-barres au bout de la ligne, juste avant les
                          boutons. C'est la donnée qu'on vient chercher en
                          rayon, et elle n'a d'utilité que lue chiffre à
                          chiffre : `tabular-nums` fige la chasse pour que deux
                          EAN empilés s'alignent et se comparent.

                          Masqué sous `sm` : à 375 px, treize chiffres à côté du
                          titre et des deux boutons ne laissent plus rien au
                          titre lui-même.
                        */}
                        {ed.ean && (
                          <span
                            className="hidden shrink-0 tabular-nums sm:block"
                            style={{ fontSize: "13px", color: "var(--reel-muted)", lineHeight: "19.5px" }}
                          >
                            {ed.ean}
                          </span>
                        )}

                        <CircleStatusButtons
                          editionId={ed.id}
                          status={statuts[ed.id]}
                          pret={statutsPrets}
                          onToggle={handleEditionStatut}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/*
              Mention d'affiliation, obligatoire dès qu'un lien rémunéré est
              affiché : la transparence sur la nature commerciale d'un lien
              relève des pratiques commerciales trompeuses (art. L. 121-1 du
              code de la consommation), et Google traite un lien d'affiliation
              non déclaré comme un montage de liens.

              **Elle n'apparaît que si une offre est affichée.** Une mention
              posée sur toutes les fiches parlerait de liens qui n'existent pas
              sur 96 % du catalogue, ce qui est l'inverse d'informer.

              Sous la liste et non au-dessus : elle qualifie ce qu'on vient de
              lire, et elle ne doit pas s'interposer entre le lecteur et les
              éditions, qui sont le sujet de la page.
            */}
            {filteredEditions.some((ed) => (ed.offres ?? []).length > 0) && (
              <p
                className="mt-6"
                style={{ fontSize: "12px", lineHeight: "18px", color: "var(--reel-muted)" }}
              >
                Les prix marchands sont des liens affiliés : une commission peut nous être
                versée si vous achetez, sans que le prix change pour vous. Prix relevés à la
                date indiquée au survol, seul le site marchand fait foi.
                {/*
                  **La phrase d'occasion n'est écrite que si une occasion est
                  affichée.** Même règle que la mention elle-même, qui ne paraît
                  pas sur les 82 % du catalogue sans offre : annoncer de la
                  seconde main sur une liste qui n'en porte pas est l'inverse
                  d'informer. Et le test porte sur l'offre **retenue** par
                  `offreAAfficher`, pas sur celles en base : dire « certains
                  prix » d'une offre qu'on n'affiche pas serait faux.
                */}
                {filteredEditions.some((ed) => {
                  const o = offreAAfficher(ed.offres);
                  return o !== null && estOccasion(o);
                }) && " Certaines offres portent sur un disque d'occasion, indiqué à côté du prix."}
              </p>
            )}
          </div>
        )}

        {activeTab === "Détails" && (
          /*
            Distribution en tête, pleine largeur, puis les deux fiches côte à
            côte. Les visages passent avant les tableaux : c'est ce qu'on
            reconnaît d'un coup d'œil, et une grille de portraits a besoin de
            toute la largeur, dans une demi-colonne elle retombait à trois
            cartes par ligne.

            Pas de synopsis ici : il est déjà en entier dans le héros, au-dessus
            des onglets. Le répéter deux fois sur le même écran ne renseignait
            personne.
          */
          <div className="flex flex-col gap-10">
            {castList.length > 0 && (
              <section>
                <TitreSection>Distribution</TitreSection>
                {/*
                  Un rail qui défile, et non une grille qui se replie. À douze
                  acteurs la grille faisait deux rangées sur écran large et
                  quatre sur mobile, repoussant les deux fiches techniques hors
                  de vue, alors que la distribution est un accessoire de la
                  page, pas son sujet. Sur une ligne, elle occupe la même
                  hauteur quel que soit le nombre d'acteurs.

                  Largeur de carte fixe plutôt qu'une fraction du conteneur :
                  dans un conteneur qui défile, un pourcentage se calcule sur la
                  largeur visible et toutes les cartes se tasseraient pour tenir
                  dedans. La demi-carte qui dépasse à droite est le seul indice
                  qu'il y a une suite, elle est donc voulue.
                */}
                <RailHorizontal ariaLabel="Distribution">
                  {castList.map((m) => (
                    <div key={m.nom} className="w-[116px] shrink-0 sm:w-[132px]">
                      <CarteActeur membre={m} onClick={() => setSelectedPerson(m.nom)} />
                    </div>
                  ))}
                </RailHorizontal>
              </section>
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-8">
              {/*
                Deux blocs et non un. L'ancienne fiche unique mélangeait ce qui
                relève de l'œuvre (réalisation, année, genres, titres étrangers,
                identiques quel que soit le disque) et ce qui relève du support
                (définition, HDR, pistes audio, qui changent d'une édition à
                l'autre). Les séparer dit d'où vient chaque ligne.

                Ordre et vocabulaire calqués sur la fiche technique de
                SensCritique, prise comme référence pour cette v1 : titre
                original, titres alternatifs, genres, année, pays, durée, dates
                de sortie, réalisateur, scénariste, producteurs, distributeur,
                budget, bande originale.

                Le distributeur n'y figure pas : TMDB ne publie que les sociétés
                de production, qui ne sont le distributeur que par accident.
                L'éditeur vidéo relevé sur blu-ray.com le remplace, et il est
                dans l'autre bloc, il qualifie le disque, pas l'œuvre.

                La note n'est pas de leur liste non plus. Gardée quand même,
                pour le nombre de votes, que le héros n'affiche pas.
              */}
              <BlocFiche
                titre="L'œuvre"
                lignes={[
                  film.titre_original && film.titre_original !== film.titre &&
                    { label: "Titre original", value: film.titre_original },
                  titresEtrangers.length > 0 && {
                    label: "Autres titres",
                    // Une ligne par langue : sur un seul paragraphe, les titres
                    // se confondaient entre eux dès qu'il y en avait trois.
                    value: (
                      <span className="flex flex-col gap-1">
                        {titresEtrangers.map(([code, titre]) => (
                          <span key={code}>
                            <span style={{ color: "var(--reel-muted)" }}>{LANGUES_TITRES[code]}</span>
                            {" · "}
                            {titre}
                          </span>
                        ))}
                      </span>
                    ),
                  },
                  // L'accroche d'affiche TMDB. Elle a d'abord ouvert la colonne
                  // de droite, hors carte : elle y flottait sans rien qualifier.
                  // Ici elle suit les titres, ce qu'elle prolonge, mais elle
                  // reste en italique, parce que c'est une phrase d'affiche et
                  // non une donnée relevée comme les lignes qui suivent. En
                  // blanc comme les autres valeurs : le gris la faisait passer
                  // pour un libellé alors qu'elle est du contenu.
                  film.tagline && { label: "Accroche", value: <em>{film.tagline}</em> },
                  genres.length > 0 && { label: "Genres", value: genres.join(", ") },
                  film.annee && { label: "Année", value: String(film.annee) },
                  paysList.length > 0 && { label: "Pays", value: paysList.join(", ") },
                  durationFormatted && { label: "Durée", value: durationFormatted },
                  dateSortieFr && { label: "Sortie", value: dateSortieFr },
                  film.realisateur && { label: "Réalisateur", value: film.realisateur },
                  scenaristes.length > 0 && { label: "Scénariste", value: scenaristes.join(", ") },
                  producteurs.length > 0 && { label: "Producteurs", value: producteurs.join(", ") },
                  film.musique && { label: "Bande originale", value: film.musique },
                  budgetFormate && { label: "Budget", value: budgetFormate },
                  film.note != null && film.note !== "" && {
                    label: "Note TMDB",
                    // Deux décimales comme dans le héros : la même note ne peut
                    // pas s'afficher différemment à deux endroits.
                    value: film.nb_votes
                      ? `${Number(film.note).toFixed(2)} / 10 (${film.nb_votes.toLocaleString("fr-FR")} votes)`
                      : `${Number(film.note).toFixed(2)} / 10`,
                  },
                ]}
              />

            </div>

            <div className="flex flex-col gap-8">
              {/*
                Ce bloc réunit les specs de toutes les éditions du film, pas
                celles d'un disque. Il se lit « disponible en Dolby Vision », et
                non « ce film est en Dolby Vision », d'où la mention du nombre
                d'éditions dépouillées, qui dit sur quoi la liste s'appuie.

                Aucune donnée n'en vient d'IMDb : leurs conditions interdisent
                l'extraction, et leurs jeux gratuits sont réservés à un usage non
                commercial et ne contiennent de toute façon aucune spec. Tout
                vient des fiches blu-ray.com déjà en cache.
              */}
              <BlocFiche
                titre="Image et son"
                lignes={[
                  specs.definitions.length > 0 && {
                    label: "Définition",
                    value: specs.definitions.join(" · "),
                  },
                  specs.hdr.length > 0 && { label: "HDR", value: specs.hdr.join(" · ") },
                  specs.ratios.length > 0 && { label: "Format", value: specs.ratios.join(" · ") },
                  specs.codecs.length > 0 && { label: "Codec", value: specs.codecs.join(" · ") },
                  specs.languesAudio.length > 0 && {
                    label: "Audio",
                    value: specs.languesAudio.join(", "),
                  },
                  specs.sousTitres.length > 0 && {
                    label: "Sous-titres",
                    value: specs.sousTitres.join(", "),
                  },
                  specs.editeurs.length > 0 && { label: "Éditeur", value: specs.editeurs.join(" · ") },
                  /*
                    Le distributeur vient de dvdfr, et de nulle part ailleurs :
                    TMDB ne le publie pas, ce que le §8 notait comme un manque
                    définitif. Il suit l'éditeur parce qu'on les confond
                    volontiers, et la fiche technique de SensCritique, prise
                    pour référence, les distingue de la même façon :
                    Studiocanal presse, Universal distribue.
                  */
                  specs.distributeurs.length > 0 && {
                    label: "Distributeur",
                    value: specs.distributeurs.join(" · "),
                  },
                  specs.zones.length > 0 && { label: "Zone", value: specs.zones.join(" · ") },
                ]}
                note={
                  specs.sources > 0
                    ? `Relevé sur ${specs.sources} édition${specs.sources > 1 ? "s" : ""} du catalogue.`
                    : undefined
                }
              />

              {/*
                Ce que Jaquette apporte que TMDB n'a pas : le recensement des
                éditions physiques. C'est l'information la plus rare de la page,
                elle mérite une place et pas une ligne de tableau.
              */}
              {editions.length > 0 && (
                <section>
                  <TitreSection>Au catalogue</TitreSection>
                  <p className="pt-3" style={{ fontSize: "15px", color: "var(--reel-text)", lineHeight: "25px" }}>
                    {editions.length} édition{editions.length > 1 ? "s" : ""} recensée
                    {editions.length > 1 ? "s" : ""}
                    {allFormats.length > 0 && <> en {allFormats.join(", ")}</>}.
                    {(() => {
                      const avecEan = editions.filter((e) => e.ean).length;
                      return avecEan > 0 ? ` ${avecEan} avec code-barres.` : "";
                    })()}
                  </p>
                </section>
              )}
            </div>
            </div>
          </div>
        )}

        {(activeTab === "Critiques" || activeTab === "Listes") && (
          <p style={{ fontSize: "14px", color: "var(--reel-muted)" }}>Section bientôt disponible.</p>
        )}
      </div>

      {lanterne && (
        <Lanterne
          images={lanterne.images}
          index={lanterne.index}
          titre={lanterne.titre}
          onFermer={() => setLanterne(null)}
          onChanger={(index) => setLanterne((l) => (l ? { ...l, index } : l))}
        />
      )}

      {selectedPerson && (
        <PersonModal name={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}

      <ModaleConnexion
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        retourVers={lienFilm(film) ?? `/films/${filmId}`}
      />

    </div>
  );
}
