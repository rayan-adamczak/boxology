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
    note: "L’actuelle. Neutre, sans caractère.",
  },
  {
    cle: "instrument",
    nom: "Instrument Serif",
    pile: "'Instrument Serif', serif",
    graisse: 400,
    echelle: 1.34,
    interligne: 1.02,
    approche: "-0.01em",
    casse: "none",
    note: "Didone à fort contraste. Édition, collection, objet.",
  },
  {
    cle: "fraunces",
    nom: "Fraunces",
    pile: "'Fraunces', serif",
    graisse: 700,
    echelle: 1.16,
    interligne: 1.04,
    approche: "-0.02em",
    casse: "none",
    note: "Serif dessinée, plus chaude. Identité la plus affirmée.",
  },
  {
    cle: "oswald",
    nom: "Oswald",
    pile: "'Oswald', sans-serif",
    graisse: 600,
    echelle: 1.24,
    interligne: 1.02,
    approche: "0.01em",
    casse: "uppercase",
    note: "Affiche de cinéma. Souffre sur les titres français longs.",
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
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Oswald:wght@500;600&display=swap";
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
