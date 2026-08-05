import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { AttentePleine } from "../components/AttenteRecherche";
import { connexionGoogle, useSession } from "../lib/auth";
import {
  MESSAGE,
  chiffres,
  eanBienForme,
  mesSignalements,
  signalerEdition,
  type SignalementEdition,
} from "../lib/signalements";

/**
 * Signaler une édition absente du catalogue.
 *
 * **C'est la seule réponse au trou de source qui ne dépende de personne.** Les
 * cinq sources couvrent des niches, aucune ne couvre le marché français
 * généraliste, et *Moonlight* comme *Portrait de la jeune fille en feu* n'ont
 * donc aucune édition. Les flux Awin y répondront un jour, quand Fnac et
 * Cultura auront validé ; celui-ci marche aujourd'hui.
 *
 * **On demande un code-barres, pas un titre.** C'est la seule donnée qui
 * identifie un disque sans ambiguïté, là où un titre rouvre tous les pièges du
 * §9, homonymes, suffixes de format et éditions multiples. Et c'est exactement
 * ce que la chaîne dvdfr sait reprendre : elle interroge fiche à fiche par EAN
 * et en tire titre, éditeur, support, durée et zone.
 *
 * **Aucune règle n'est recopiée ici.** La validité du code, le refus des codes
 * de magasin, le quota et la présence au catalogue sont décidés par la
 * fonction `signaler_edition` en base, seule porte d'écriture. Le champ ne
 * connaît que la *forme*, treize chiffres, pour répondre à la frappe sans
 * aller-retour, comme le champ d'identifiant public (§3).
 */
export function SignalerPage() {
  const session = useSession();
  // La liste se recharge après un envoi réussi. Le compteur vit ici plutôt que
  // dans le formulaire : c'est la page qui possède les deux moitiés, et une
  // liste qui se rafraîchit elle-même redemanderait la base à chaque frappe.
  const [version, setVersion] = useState(0);

  return (
    <PageStatique
      titre="Signaler une édition manquante"
      description="Un disque absent du catalogue ? Donnez son code-barres, il sera ajouté."
      noindex
    >
      <Section titre="Ce que ça sert">
        <p>
          Le catalogue est construit à partir des éditions réellement en vente chez nos sources.
          Quand aucune ne référence un disque, l’œuvre reste absente, même si elle existe : c’est
          le cas de plusieurs films français édités par de petits distributeurs.
        </p>
        <p>
          Si vous avez le boîtier en main, son code-barres suffit. Nous en tirons le titre,
          l’éditeur, le support et la durée, et la fiche apparaît à la passe suivante.
        </p>
      </Section>

      {session === undefined && (
        <AttentePleine hauteur={180} libelle="Vérification de la session…" />
      )}

      {session === null && (
        <Section titre="Un compte est nécessaire">
          <p>
            Le signalement demande un compte, pour que nous puissions revenir vers vous si le code
            ne donne rien, et pour éviter les envois automatisés.
          </p>
          <div className="pt-1">
            <Bouton onClick={() => { void connexionGoogle("/report"); }}>
              Se connecter avec Google
            </Bouton>
          </div>
        </Section>
      )}

      {session && <Formulaire onEnvoye={() => setVersion((n) => n + 1)} />}
      {session && <MesSignalements key={version} />}
    </PageStatique>
  );
}

function Formulaire({ onEnvoye }: { onEnvoye: () => void }) {
  const [ean, setEan] = useState("");
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);

  const propre = chiffres(ean);
  const valide = eanBienForme(propre);

  async function envoyer() {
    setEnCours(true);
    try {
      const verdict = await signalerEdition(propre, note);
      // Le verdict vient de la base, jamais d'une règle recopiée ici : c'est
      // elle qui sait si le code est déjà au catalogue ou si le quota est
      // atteint.
      if (verdict === "enregistre") {
        toast.success(MESSAGE[verdict]);
        setEan("");
        setNote("");
        onEnvoye();
      } else {
        toast.error(MESSAGE[verdict]);
      }
    } catch {
      // Une panne réseau n'est pas un refus : les deux ne se corrigent pas de
      // la même façon, et confondre les deux est le défaut consigné au §9.
      toast.error("Envoi impossible. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Section titre="Le code-barres">
        <p>
          Les treize chiffres imprimés au dos du boîtier. Les espaces et les tirets sont ignorés.
        </p>
        <div className="flex flex-col gap-3 pt-1">
          <input
            type="text"
            inputMode="numeric"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            placeholder="3512394015968"
            autoComplete="off"
            spellCheck={false}
            disabled={enCours}
            aria-label="Code-barres à treize chiffres"
            className="w-full max-w-[320px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
              // Un code-barres se lit chiffre à chiffre, comme un identifiant
              // public : la chasse fixe aligne les colonnes et rend la
              // relecture possible.
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.04em",
            }}
          />
          {propre.length > 0 && !valide && (
            <span style={{ color: "var(--reel-muted)" }}>
              {propre.length} chiffre{propre.length > 1 ? "s" : ""} sur treize.
            </span>
          )}

          <label className="flex flex-col gap-2">
            <span>Une précision, si vous voulez : le titre, l’éditeur, l’édition.</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Les Yeux sans visage, Blu-ray Gaumont"
              disabled={enCours}
              className="w-full max-w-[420px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
              }}
            />
          </label>

          <div>
            <Bouton onClick={() => { void envoyer(); }} disabled={!valide || enCours}>
              {enCours ? "Envoi…" : "Signaler cette édition"}
            </Bouton>
          </div>
        </div>
    </Section>
  );
}

/**
 * La liste des signalements du compte.
 *
 * Elle existe pour une raison précise : sans elle, on ne sait pas si son envoi
 * a servi, et on le refait. Le statut dit où en est chacun.
 */
function MesSignalements() {
  const [lignes, setLignes] = useState<SignalementEdition[] | null>(null);

  useEffect(() => {
    let annule = false;
    mesSignalements()
      .then((l) => { if (!annule) setLignes(l); })
      .catch(() => { if (!annule) setLignes([]); });
    return () => { annule = true; };
  }, []);

  // Rien à montrer tant qu'aucun signalement n'existe : une section vide
  // laisserait croire à une panne de chargement.
  if (!lignes || lignes.length === 0) return null;

  return (
    <Section titre="Mes signalements">
      {lignes.map((l) => (
        <Encadre key={l.ean}>
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {l.ean}
          </span>
          {l.note && <> — {l.note}</>}
          <br />
          <span style={{ color: "var(--reel-muted)" }}>
            {ETAT[l.statut] ?? l.statut} · {new Date(l.cree_le).toLocaleDateString("fr-FR")}
          </span>
        </Encadre>
      ))}
      <p>
        Un signalement traité fait apparaître l’édition au catalogue. S’il est refusé, c’est que le
        code n’a rien donné chez nos sources : écrivez-nous depuis{" "}
        <Link to="/about" style={{ color: "var(--reel-accent-clair)" }}>la page à propos</Link>.
      </p>
    </Section>
  );
}

const ETAT: Record<string, string> = {
  nouveau: "en attente",
  traite: "ajouté au catalogue",
  refuse: "sans résultat",
  doublon: "déjà au catalogue",
};

function Bouton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[10px] px-4 py-2 transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{
        backgroundColor: disabled ? "var(--reel-surface-2)" : "var(--reel-accent)",
        color: disabled ? "var(--reel-muted)" : "#fff",
        border: "none",
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
