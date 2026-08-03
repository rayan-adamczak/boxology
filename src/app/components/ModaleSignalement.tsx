import { useEffect, useRef, useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import {
  MOTIFS_SIGNALEMENT,
  signalerProfil,
  type MotifSignalement,
  type ResultatSignalement,
} from "../lib/profils";
import { arobase } from "../lib/identifiant";

/**
 * Signaler un profil.
 *
 * **Sans compte, et c'est le point.** On tombe sur un profil par un lien
 * partagé ; exiger une inscription pour dire « ce pseudonyme est une injure »
 * reviendrait à ne pas vouloir le savoir. C'est aussi ce qui fait de ce bouton
 * le complément de la liste de mots et non son doublon : une liste attrape ce
 * qu'on a prévu, un signalement apprend le reste.
 *
 * Un motif obligatoire, un commentaire facultatif et borné. Le champ libre est
 * la partie la plus exposée de l'écran : sans plafond, c'est une invitation à y
 * déverser ce qu'on prétend combattre. 500 signes, imposés ici **et** en base.
 *
 * Ce qui n'existe pas et qui se voit : **aucun accusé de réception par
 * courriel**. `contact@jaquette.app` ne fait que recevoir (§2), il n'y a pas de
 * SMTP pour répondre. Les signalements s'empilent dans une table qu'on relit
 * à la main. Le message de confirmation ne promet donc rien d'autre que la
 * prise en compte.
 */
export function ModaleSignalement({
  identifiant,
  onFermer,
}: {
  identifiant: string;
  onFermer: () => void;
}) {
  const [motif, setMotif] = useState<MotifSignalement>("injure");
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const dialogue = useRef<HTMLDivElement>(null);

  // Échap ferme, comme n'importe quelle boîte de dialogue. Le défilement de la
  // page est laissé libre : la modale est courte et ne couvre pas l'écran, à
  // l'inverse de la visionneuse d'images.
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", auClavier);
    dialogue.current?.focus();
    return () => window.removeEventListener("keydown", auClavier);
  }, [onFermer]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const resultat = await signalerProfil(identifiant, motif, commentaire);
      toast[resultat === "enregistre" ? "success" : "message"](MESSAGES[resultat]);
      if (resultat !== "trop") onFermer();
    } catch (erreur) {
      toast.error(erreur instanceof Error ? erreur.message : "Signalement impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(8,10,14,0.7)" }}
        onClick={onFermer}
        aria-hidden="true"
      />
      <div
        ref={dialogue}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-signalement"
        tabIndex={-1}
        className="relative w-full max-w-[440px] rounded-[14px] p-5 outline-none"
        style={{
          backgroundColor: "var(--reel-surface)",
          border: "1px solid var(--reel-border)",
        }}
      >
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{ color: "var(--reel-muted)" }}
        >
          <X size={18} />
        </button>

        <h2
          id="titre-signalement"
          className="flex items-center gap-2"
          style={{ fontSize: "17px", fontWeight: 700, color: "var(--reel-text)" }}
        >
          <Flag size={17} /> Signaler {arobase(identifiant)}
        </h2>
        <p className="pt-2" style={{ fontSize: "14px", lineHeight: "21px", color: "var(--reel-muted)" }}>
          Dites-nous ce qui pose problème. Nous relisons les signalements à la main, sans automatisme
          derrière : rien n’est masqué ni supprimé par le seul fait de signaler.
        </p>

        <form onSubmit={envoyer} className="flex flex-col gap-4 pt-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-1" style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
              Motif
            </legend>
            {MOTIFS_SIGNALEMENT.map(({ cle, libelle }) => (
              <label key={cle} className="flex items-center gap-2.5" style={{ fontSize: "14px" }}>
                <input
                  type="radio"
                  name="motif"
                  value={cle}
                  checked={motif === cle}
                  onChange={() => setMotif(cle)}
                  disabled={envoi}
                  style={{ accentColor: "var(--reel-accent)" }}
                />
                <span style={{ color: "var(--reel-text)" }}>{libelle}</span>
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-2">
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
              Précisions <span style={{ fontWeight: 400, color: "var(--reel-muted)" }}>(facultatif)</span>
            </span>
            <textarea
              value={commentaire}
              // Borné ici et en base : le plafond côté écran est un service
              // rendu, celui de la base est la garantie.
              onChange={(e) => setCommentaire(e.target.value.slice(0, 500))}
              rows={3}
              disabled={envoi}
              className="w-full resize-none rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface-2)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
                fontSize: "14px",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--reel-muted)" }}>
              {commentaire.length} / 500
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={envoi}
              className="rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: "var(--reel-accent)",
                color: "#ffffff",
                border: "1px solid var(--reel-accent)",
              }}
            >
              {envoi ? "Envoi…" : "Envoyer le signalement"}
            </button>
            <button
              type="button"
              onClick={onFermer}
              disabled={envoi}
              className="rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
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
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Une phrase par réponse de la base.
 *
 * `inconnu` ne dit pas si le profil n'existe pas ou s'il vient d'être masqué :
 * les distinguer ferait de l'adresse un oracle disant quels comptes existent,
 * règle tenue partout ailleurs.
 */
const MESSAGES: Record<ResultatSignalement, string> = {
  enregistre: "Signalement enregistré. Merci, nous allons regarder.",
  deja: "Vous aviez déjà signalé ce profil. Un seul signalement par compte suffit.",
  soi: "C’est votre propre profil. Modifiez-le depuis « Mon compte ».",
  inconnu: "Ce profil n’est plus accessible.",
  trop: "Ce profil a déjà été signalé de nombreuses fois. C’est noté.",
};
