import { useEffect, useState } from "react";

/**
 * Sélecteur de police, visible uniquement en développement.
 *
 * Sert à trancher une direction typographique en la voyant sur de vraies
 * données plutôt que sur un échantillon. Le choix est écrit dans une variable
 * CSS que la fiche film consomme, et retenu d'un rechargement à l'autre.
 *
 * Ce composant et les polices qu'il charge n'existent pas en production : il
 * est rendu sous `import.meta.env.DEV`, et les `<link>` sont injectés ici, pas
 * dans index.html — un visiteur ne télécharge donc rien de tout ça.
 *
 * À supprimer une fois la police retenue.
 */

interface Option {
  cle: string;
  nom: string;
  pile: string;
  graisse: number;
  echelle: number;
  interligne: number;
  approche: string;
  casse: "none" | "uppercase";
  note: string;
}

const OPTIONS: Option[] = [
  {
    cle: "inter",
    nom: "Inter",
    pile: "'Inter', sans-serif",
    graisse: 700,
    echelle: 1,
    interligne: 1.08,
    approche: "-0.02em",
    casse: "none",
    note: "L’actuelle, pour comparer. Neutre, sans caractère.",
  },
  {
    cle: "bricolage",
    nom: "Bricolage Grotesque",
    pile: "'Bricolage Grotesque', sans-serif",
    graisse: 700,
    echelle: 1.06,
    interligne: 1.04,
    approche: "-0.025em",
    casse: "none",
    note: "Grotesque contemporaine, dessin volontairement irrégulier. Le contraire d’une police par défaut.",
  },
  {
    cle: "familjen",
    nom: "Familjen Grotesk",
    pile: "'Familjen Grotesk', sans-serif",
    graisse: 700,
    echelle: 1.08,
    interligne: 1.04,
    approche: "-0.02em",
    casse: "none",
    note: "Grotesque suédoise, serrée, détails singuliers. Sobre mais reconnaissable.",
  },
  {
    cle: "space",
    nom: "Space Grotesk",
    pile: "'Space Grotesk', sans-serif",
    graisse: 700,
    echelle: 1.06,
    interligne: 1.05,
    approche: "-0.03em",
    casse: "none",
    note: "Géométrique avec des accidents. Tranche nettement d’Inter tout en restant lisible.",
  },
  {
    cle: "newsreader",
    nom: "Newsreader",
    pile: "'Newsreader', serif",
    graisse: 600,
    echelle: 1.2,
    interligne: 1.06,
    approche: "-0.015em",
    casse: "none",
    note: "Serif dessinée pour l’écran. Éditoriale sans la fragilité d’une didone.",
  },
  {
    cle: "bodoni",
    nom: "Bodoni Moda",
    pile: "'Bodoni Moda', serif",
    graisse: 700,
    echelle: 1.24,
    interligne: 1.02,
    approche: "-0.01em",
    casse: "none",
    note: "Contraste extrême, registre mode et affiche. Très fort en logo, exigeant en petit.",
  },
];

const CLE_STOCKAGE = "jaquette_essai_typo";

/** Applique le choix sous forme de variables CSS lues par la fiche film. */
function appliquer(o: Option) {
  const r = document.documentElement.style;
  r.setProperty("--titre-famille", o.pile);
  r.setProperty("--titre-graisse", String(o.graisse));
  r.setProperty("--titre-echelle", String(o.echelle));
  r.setProperty("--titre-interligne", String(o.interligne));
  r.setProperty("--titre-approche", o.approche);
  r.setProperty("--titre-casse", o.casse);
}

export function EssaiTypo() {
  const [choix, setChoix] = useState<string>(
    () => localStorage.getItem(CLE_STOCKAGE) ?? "inter",
  );
  const [replie, setReplie] = useState(false);

  useEffect(() => {
    const lien = document.createElement("link");
    lien.rel = "stylesheet";
    lien.href =
      "https://fonts.googleapis.com/css2" +
      "?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800" +
      "&family=Familjen+Grotesk:wght@600;700" +
      "&family=Space+Grotesk:wght@600;700" +
      "&family=Newsreader:opsz,wght@6..72,500;6..72,600" +
      "&family=Bodoni+Moda:opsz,wght@6..96,600;6..96,700" +
      "&display=swap";
    document.head.appendChild(lien);
    return () => { lien.remove(); };
  }, []);

  useEffect(() => {
    const o = OPTIONS.find((x) => x.cle === choix) ?? OPTIONS[0];
    appliquer(o);
    localStorage.setItem(CLE_STOCKAGE, choix);
  }, [choix]);

  const actuelle = OPTIONS.find((x) => x.cle === choix) ?? OPTIONS[0];

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] rounded-[10px] p-3 shadow-xl"
      style={{
        backgroundColor: "var(--reel-surface)",
        border: "1px solid var(--reel-border)",
        maxWidth: 260,
      }}
    >
      <button
        type="button"
        onClick={() => setReplie((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
        style={{ fontSize: "12px", fontWeight: 600, color: "var(--reel-muted)" }}
      >
        Essai typo — {actuelle.nom}
        <span aria-hidden="true">{replie ? "▸" : "▾"}</span>
      </button>

      {!replie && (
        <>
          <div className="flex flex-col gap-1 pt-2">
            {OPTIONS.map((o) => (
              <button
                key={o.cle}
                type="button"
                onClick={() => setChoix(o.cle)}
                className="rounded-[6px] px-2 py-1.5 text-left transition"
                style={{
                  fontSize: "13px",
                  fontWeight: choix === o.cle ? 600 : 400,
                  color: choix === o.cle ? "#ffffff" : "var(--reel-text)",
                  backgroundColor: choix === o.cle ? "var(--reel-accent)" : "transparent",
                }}
              >
                {o.nom}
              </button>
            ))}
          </div>
          <p className="pt-2" style={{ fontSize: "11px", lineHeight: "15px", color: "var(--reel-muted)" }}>
            {actuelle.note}
          </p>
        </>
      )}
    </div>
  );
}
