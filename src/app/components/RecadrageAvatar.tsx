import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { recadrerEnWebp } from "../lib/avatar";

/**
 * Recadrer une photo dans un rond, avant de la déposer.
 *
 * ## Pourquoi c'est écrit à la main
 *
 * `react-easy-crop` fait ça très bien, et pèse 40 Ko. Le §3 garde la trace du
 * ménage du 4 août 2026, quatorze dépendances directes retirées parce
 * qu'aucun fichier ne les importait : en rajouter une pour un carré, deux
 * bornes et un `drawImage` irait à rebours. Ce qu'il fallait vraiment savoir
 * tient en dix lignes de conversion de repère, elles sont dans `cadrage()`.
 *
 * ## Le rond n'est qu'un masque
 *
 * L'image écrite est **carrée** (cf. `recadrerEnWebp`). Le disque est un voile
 * posé par-dessus la vue, avec un trou : c'est ce qui montre ce qui sera visible
 * une fois l'avatar arrondi par le CSS, tout en gardant les coins à l'écran
 * pendant qu'on déplace. Masquer les coins pour de bon donnerait l'illusion
 * qu'ils sont perdus, alors qu'ils sont seulement cachés à l'affichage.
 *
 * ## Ce qui est contraint
 *
 * L'image **couvre toujours la vue**, aux quatre bords : c'est la seule règle
 * qui empêche un avatar à moitié transparent. Le zoom minimal est donc calculé,
 * jamais fixé — sur un panorama, « ne pas zoomer » remplirait déjà la hauteur,
 * et un plancher à 1 laisserait des bandes.
 */

/** Côté de la vue, en pixels d'écran. Le rendu final est à 512 (`lib/avatar`). */
const VUE = 300;

/** Au-delà, on regarde des pixels, pas un visage. */
const ZOOM_MAX = 4;

export function RecadrageAvatar({
  fichier,
  enCours,
  onAnnuler,
  onValider,
}: {
  fichier: File;
  /** Le dépôt est en vol : on gèle les commandes sans démonter la fenêtre. */
  enCours: boolean;
  onAnnuler: () => void;
  onValider: (blob: Blob) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  /* Décalage du coin haut-gauche de l'image par rapport à la vue, en pixels
     d'écran. Négatif ou nul : l'image déborde toujours. */
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  const glisse = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const precedent = useRef({ largeur: 0, hauteur: 0 });

  /*
    L'URL d'objet est révoquée au démontage, sinon le fichier reste en mémoire
    pour toute la durée de la visite. `onerror` est traité : un fichier au bon
    type MIME mais au contenu abîmé ne doit pas laisser une fenêtre vide.
  */
  useEffect(() => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setErreur("Ce fichier n’a pas pu être ouvert comme une image.");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [fichier]);

  // Échelle qui fait tout juste couvrir la vue. C'est le zoom 1.
  const base = image ? Math.max(VUE / image.naturalWidth, VUE / image.naturalHeight) : 1;
  const echelle = base * zoom;
  const largeur = image ? image.naturalWidth * echelle : 0;
  const hauteur = image ? image.naturalHeight * echelle : 0;

  /*
    À l'ouverture on centre ; à chaque changement de zoom on garde **le point de
    l'image qui est sous le centre de la vue**. Zoomer en repartant du coin
    haut-gauche fait fuir le visage hors du rond dès le deuxième cran, et le
    bornage le rattrape par un saut.
  */
  useEffect(() => {
    if (!image) return;
    const avant = precedent.current;
    if (avant.largeur === 0) {
      setDx(borner((VUE - largeur) / 2, VUE - largeur));
      setDy(borner((VUE - hauteur) / 2, VUE - hauteur));
    } else {
      setDx((x) => borner(VUE / 2 - ((VUE / 2 - x) * largeur) / avant.largeur, VUE - largeur));
      setDy((y) => borner(VUE / 2 - ((VUE / 2 - y) * hauteur) / avant.hauteur, VUE - hauteur));
    }
    precedent.current = { largeur, hauteur };
  }, [largeur, hauteur, image]);

  // Échap ferme, comme partout ailleurs sur le site.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enCours) onAnnuler();
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [onAnnuler, enCours]);

  /* Le défilement de la page est gelé pendant la fenêtre, **avec compensation
     de la barre** : la masquer élargit la page et fait sauter tout le contenu
     derrière. Même parade que la visionneuse d'images (§8). */
  useEffect(() => {
    const barre = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (barre > 0) document.body.style.paddingRight = `${barre}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  function surPointerDown(e: React.PointerEvent) {
    if (enCours) return;
    /* La capture garde le glissement vivant quand le curseur sort du cadre.
       Elle est facultative : un pointeur qui n'existe plus la fait lever, et un
       recadrage qui casse pour ça serait une régression pour un confort. */
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* pointeur déjà relâché */
    }
    glisse.current = { x: e.clientX, y: e.clientY, dx, dy };
  }

  function surPointerMove(e: React.PointerEvent) {
    const depart = glisse.current;
    if (!depart) return;
    setDx(borner(depart.dx + (e.clientX - depart.x), VUE - largeur));
    setDy(borner(depart.dy + (e.clientY - depart.y), VUE - hauteur));
  }

  function surPointerUp() {
    glisse.current = null;
  }

  async function valider() {
    if (!image) return;
    try {
      // De l'écran vers les pixels natifs : c'est ici, et nulle part ailleurs,
      // que la qualité cesse de dépendre de la taille du navigateur.
      onValider(
        await recadrerEnWebp(image, {
          x: -dx / echelle,
          y: -dy / echelle,
          cote: VUE / echelle,
        }),
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Recadrage impossible.");
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer la photo de profil"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(6, 10, 16, 0.86)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !enCours) onAnnuler(); }}
    >
      <div
        className="w-full max-w-[380px] rounded-[16px] p-5"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--reel-text)" }}>
          Recadrer la photo
        </h2>
        <p className="pt-1" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Déplacez l’image et ajustez le zoom. Seul le rond sera visible.
        </p>

        {erreur ? (
          <p className="py-8 text-center" style={{ fontSize: "14px", color: "#ef6b6b" }}>{erreur}</p>
        ) : (
          <div
            className="relative mx-auto mt-4 touch-none overflow-hidden rounded-[12px]"
            style={{ width: VUE, height: VUE, backgroundColor: "var(--reel-bg)", cursor: enCours ? "default" : "grab" }}
            onPointerDown={surPointerDown}
            onPointerMove={surPointerMove}
            onPointerUp={surPointerUp}
            onPointerCancel={surPointerUp}
            onWheel={(e) => {
              if (enCours) return;
              setZoom((z) => Math.min(ZOOM_MAX, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))));
            }}
          >
            {image && (
              <img
                src={image.src}
                alt=""
                draggable={false}
                className="absolute select-none"
                style={{ left: dx, top: dy, width: largeur, height: hauteur, maxWidth: "none" }}
              />
            )}
            {/*
              Le voile et son trou. `radial-gradient` plutôt qu'un `box-shadow`
              démesuré : le second déborde du conteneur et se fait rogner par
              l'`overflow-hidden`, laissant les coins à nu.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${VUE / 2 - 1}px, rgba(16,23,32,0.72) ${VUE / 2}px)`,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(255,255,255,0.55)" }}
            />
          </div>
        )}

        {!erreur && (
          <div className="mt-4 flex items-center gap-3">
            <Minus size={15} style={{ color: "var(--reel-muted)" }} aria-hidden="true" />
            <input
              type="range"
              min={1}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              disabled={enCours}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{ accentColor: "var(--reel-accent)", backgroundColor: "var(--reel-surface-2)" }}
            />
            <Plus size={15} style={{ color: "var(--reel-muted)" }} aria-hidden="true" />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="rounded-full px-4 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "var(--reel-surface-2)",
              color: "var(--reel-text)",
              border: "1px solid var(--reel-border)",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => { void valider(); }}
            disabled={!image || !!erreur || enCours}
            className="rounded-full px-4 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "var(--reel-accent)",
              color: "#ffffff",
              border: "1px solid var(--reel-accent)",
            }}
          >
            {enCours ? "Envoi…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Garde le décalage entre `min` (négatif) et 0 : l'image couvre toujours. */
function borner(valeur: number, min: number): number {
  return Math.min(0, Math.max(min, valeur));
}
