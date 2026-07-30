import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { connexionGoogle } from "../lib/auth";

/**
 * Demande de compte, ouverte quand un visiteur non connecté tente une action.
 *
 * Le catalogue reste consultable sans compte — c'est ce qui permet aux 2 227
 * fiches films d'être indexées. Seules les actions en demandent un, parce
 * qu'elles écrivent dans une liste qui doit bien appartenir à quelqu'un.
 *
 * On explique avant de demander : un bouton Google sans raison ressemble à un
 * péage. La raison tient en une phrase, donc autant la donner.
 */
export function ModaleConnexion({
  ouverte,
  onFermer,
  retourVers,
}: {
  ouverte: boolean;
  onFermer: () => void;
  /** Où revenir après Google. Par défaut la page courante. */
  retourVers?: string;
}) {
  const fermerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    // Le focus part sur la fermeture : au clavier comme au lecteur d'écran, on
    // doit pouvoir sortir sans traverser la boîte.
    fermerRef.current?.focus();
    const auClavier = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(10,12,14,0.7)" }}
        onClick={onFermer}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-connexion-titre"
        className="relative w-full max-w-[420px] rounded-[14px] p-6"
        style={{
          backgroundColor: "var(--reel-surface)",
          border: "1px solid var(--reel-border)",
        }}
      >
        <button
          ref={fermerRef}
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full outline-none transition hover:bg-[var(--reel-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        >
          <X size={18} color="var(--reel-muted)" />
        </button>

        <h2
          id="modale-connexion-titre"
          className="pr-8"
          style={{ fontSize: "20px", fontWeight: 700, color: "var(--reel-text)" }}
        >
          Un compte pour garder vos listes
        </h2>

        <p className="pt-3" style={{ fontSize: "15px", lineHeight: "23px", color: "var(--reel-muted)" }}>
          Votre collection et vos envies sont rattachées à votre compte : vous les retrouvez sur
          votre téléphone comme sur votre ordinateur, et elles survivent à un vidage du cache.
        </p>

        <ul
          className="flex list-disc flex-col gap-1 pl-5 pt-3"
          style={{ fontSize: "14px", lineHeight: "21px", color: "var(--reel-muted)" }}
        >
          <li>Connexion par Google, aucun mot de passe à créer.</li>
          <li>Nous recevons votre adresse et votre nom, rien d’autre.</li>
          <li>Suppression du compte en deux clics, immédiate et définitive.</li>
        </ul>

        <button
          type="button"
          onClick={() => { void connexionGoogle(retourVers); }}
          className="mt-5 w-full rounded-full px-4 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
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

        <p className="pt-3 text-center" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Le catalogue reste consultable sans compte.
        </p>
      </div>
    </div>
  );
}
