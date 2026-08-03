import { useEffect, useState } from "react";
import type { Session } from "@supabase/auth-js";
import { Check, Loader2, X } from "lucide-react";
import { nomAffiche } from "../lib/auth";
import {
  IDENTIFIANT_MAX,
  IDENTIFIANT_MIN,
  identifiantBienForme,
  normaliserIdentifiant,
  suggererIdentifiant,
} from "../lib/identifiant";
import { creerProfil, etatIdentifiant, type EtatIdentifiant } from "../lib/profils";
import { SITE_ORIGIN } from "../lib/seo";

/**
 * Le choix de l'identifiant, une fois, juste après la première connexion.
 *
 * C'est un passage obligé et non une invitation : l'identifiant est ce qui
 * fabrique l'adresse du profil, un compte sans @ n'a pas de page, et une
 * bannière qu'on peut repousser indéfiniment produit exactement ça. Le
 * `Layout` le pose à la place de la page demandée tant que le profil manque.
 *
 * **Un compte dont le profil n'a pas pu être lu ne voit pas cet écran**, il
 * accède au site normalement : le garde-fou distingue « absent » d'« erreur »
 * (cf. `lib/profils.ts`). Confondre les deux enfermerait quelqu'un hors du site
 * pour une coupure réseau, ce qui est le défaut du 30 juillet 2026 consigné au
 * §9, reproduit à l'identique.
 *
 * L'écran annonce que la page est publique, avec l'adresse écrite en toutes
 * lettres. C'est la seule occasion où le consentement est réellement demandé :
 * après coup, `/account` ne fait que l'entretenir.
 */

/** Ce que la vérification renvoie, plus les deux états qui lui sont propres. */
type Verdict = EtatIdentifiant | "attente" | "vide";

/*
  `reserve` couvre deux causes que la base ne distingue pas à dessein : le nom
  est réservé au site, ou il tombe sur la liste des injures. Répondre
  « interdit » désignerait exactement la mutation qui a échoué, donc
  apprendrait à contourner une entrée à la fois. « Pas disponible » est vrai
  dans les deux cas et n'apprend rien.
*/
const MESSAGES: Record<Verdict, string> = {
  vide: "",
  attente: "Vérification…",
  invalide: `Entre ${IDENTIFIANT_MIN} et ${IDENTIFIANT_MAX} signes : lettres, chiffres et « _ ».`,
  reserve: "Cet identifiant n’est pas disponible.",
  pris: "Cet identifiant est déjà pris.",
  libre: "Disponible.",
};

export function EcranIdentifiant({ session }: { session: Session }) {
  const nomGoogle = nomAffiche(session);
  const [identifiant, setIdentifiant] = useState(() => suggererIdentifiant(nomGoogle));
  const [nom, setNom] = useState(nomGoogle);
  const [verdict, setVerdict] = useState<Verdict>("vide");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /*
    Vérification temporisée : une requête par frappe interrogerait la base huit
    fois pour un identifiant de huit signes, et la dernière réponse arrivée ne
    serait pas forcément celle de la dernière saisie. Le garde `annule` règle
    le second problème, la temporisation le premier.

    400 ms : en dessous on tape plus vite que la réponse, au-delà le champ
    paraît inerte.
  */
  useEffect(() => {
    if (identifiant === "") { setVerdict("vide"); return; }
    if (!identifiantBienForme(identifiant)) { setVerdict("invalide"); return; }

    let annule = false;
    setVerdict("attente");
    const minuteur = setTimeout(() => {
      etatIdentifiant(identifiant)
        .then((e) => { if (!annule) setVerdict(e); })
        // La vérification n'est qu'une amabilité : l'unicité est garantie par
        // la base à l'écriture. On laisse donc envoyer plutôt que de bloquer
        // sur une panne de réseau.
        .catch(() => { if (!annule) setVerdict("vide"); });
    }, 400);

    return () => { annule = true; clearTimeout(minuteur); };
  }, [identifiant]);

  const nomPropre = nom.trim();
  const pretAEnvoyer =
    identifiantBienForme(identifiant) &&
    nomPropre.length > 0 &&
    verdict !== "pris" &&
    verdict !== "reserve" &&
    !envoi;

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    if (!pretAEnvoyer) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await creerProfil(identifiant, nomPropre);
    } catch (erreurCreation) {
      setErreur(erreurCreation instanceof Error ? erreurCreation.message : "Erreur inconnue");
      setEnvoi(false);
    }
    // Aucun `setEnvoi(false)` en cas de succès : le profil créé fait disparaître
    // cet écran, et remettre le bouton actif ferait clignoter le formulaire
    // pendant le démontage.
  }

  return (
    <div className="reel-gouttiere pb-24 pt-[120px]">
      <div className="mx-auto max-w-[520px]">
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--reel-text)" }}>
          Choisissez votre identifiant
        </h1>
        <p
          className="pt-3"
          style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}
        >
          C’est votre « @ » sur jaquette.app : il donne son adresse à votre page de collection, que
          vous pourrez partager à qui vous voulez, même sans compte. Il se change ensuite depuis
          votre compte.
        </p>

        <form onSubmit={valider} className="flex flex-col gap-5 pt-8">
          <label className="flex flex-col gap-2">
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
              Identifiant
            </span>
            <span
              className="flex items-center gap-1 rounded-[10px] px-3 focus-within:ring-2 focus-within:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "16px",
                  color: "var(--reel-muted)",
                }}
              >
                @
              </span>
              <input
                type="text"
                value={identifiant}
                // Normalisé à la frappe : quelqu'un qui tape « Jean-Luc » voit
                // `jean_luc` apparaître plutôt qu'un message d'erreur.
                onChange={(e) => setIdentifiant(normaliserIdentifiant(e.target.value))}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                aria-describedby="aide-identifiant"
                className="w-full bg-transparent py-2.5 outline-none"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "16px",
                  color: "var(--reel-text)",
                }}
              />
              {verdict === "attente" && (
                <Loader2 size={16} className="animate-spin" color="var(--reel-muted)" />
              )}
              {verdict === "libre" && <Check size={16} color="#4ade80" />}
              {(verdict === "pris" || verdict === "reserve") && <X size={16} color="#ef6b6b" />}
            </span>
            <span
              id="aide-identifiant"
              aria-live="polite"
              style={{
                fontSize: "13px",
                color:
                  verdict === "libre"
                    ? "#4ade80"
                    : verdict === "pris" || verdict === "reserve" || verdict === "invalide"
                    ? "#ef6b6b"
                    : "var(--reel-muted)",
              }}
            >
              {MESSAGES[verdict] || `Entre ${IDENTIFIANT_MIN} et ${IDENTIFIANT_MAX} signes.`}
            </span>
            {identifiantBienForme(identifiant) && (
              <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                Votre page :{" "}
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                  {SITE_ORIGIN.replace("https://", "")}/u/{identifiant}
                </span>
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
              Nom affiché
            </span>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value.slice(0, 60))}
              autoComplete="off"
              className="w-full rounded-[10px] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
                fontSize: "16px",
              }}
            />
            {/* Repris de Google, et modifiable : personne ne doit être obligé de
                publier son état civil pour avoir une page. */}
            <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
              Repris de votre compte Google. Il s’affiche sur votre page publique, mettez-y ce que
              vous voulez. Votre adresse électronique, elle, n’y paraît jamais.
            </span>
          </label>

          {erreur && (
            <p style={{ fontSize: "14px", color: "#ef6b6b" }}>{erreur}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!pretAEnvoyer}
              className="rounded-full px-4 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-50"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                backgroundColor: "var(--reel-accent)",
                color: "#ffffff",
                border: "1px solid var(--reel-accent)",
              }}
            >
              {envoi ? "Création…" : "Continuer"}
            </button>
            <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
              Vous pourrez masquer votre page à tout moment.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
