import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { ModaleConnexion } from "../components/ModaleConnexion";
import { AttentePleine } from "../components/AttenteRecherche";
import { basculerStatut, CompteRequis } from "../lib/collections";
import { lienFilm } from "../lib/liens";
import { vignette } from "../lib/visuels";
import { splitList, type StatutValue } from "../lib/reelio-db";
import {
  codeMagasin,
  creerDetecteur,
  eanValide,
  editionsParEan,
  normaliserCode,
  type Detecteur,
  type EditionScannee,
} from "../lib/scan";

/**
 * Scanner un code-barres pour ajouter un disque.
 *
 * **La fonction la plus demandée du relevé du 2 août 2026 (§8)**, tenue en
 * attente jusqu'ici par la couverture EAN et non par le lecteur. Elle est à
 * 48,0 % le 7 août 2026 : un disque sur deux se scanne, et l'autre part vers
 * `/report`, qui est le couple que le §8 réclame.
 *
 * **Le chiffre est écrit sur la page, en toutes lettres.** Le §8 refuse de
 * poser la caméra sans le dire : un échec annoncé n'est pas un échec subi, et
 * une fonction qui déçoit une fois sur deux sans prévenir est pire que pas de
 * fonction.
 *
 * **Téléphone seulement**, comme demandé. Sur un écran large la page explique et
 * garde la saisie manuelle : l'adresse doit continuer de répondre, un lien
 * partagé ne se casse pas parce qu'on l'ouvre sur un portable.
 */
export function ScanPage() {
  const [code, setCode] = useState<string | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  return (
    <PageStatique
      titre="Scanner un code-barres"
      description="Ajoutez un disque à votre collection en scannant son code-barres."
      noindex
    >
      <Section titre="Ce que ça fait">
        <p>
          Visez le code-barres au dos du boîtier : la fiche du disque s’ouvre, et vous l’ajoutez à
          votre collection ou à vos envies d’un geste. Le code désigne <strong>le disque exact</strong>,
          pas seulement le film, donc il n’y a aucune édition à choisir.
        </p>
        <p>
          Environ <strong>un disque sur deux</strong> du catalogue porte son code-barres. Quand le
          vôtre n’y est pas, l’écran vous propose de le signaler, et il entre à la passe suivante.
        </p>
      </Section>

      <Lecteur onCode={setCode} />

      <SaisieManuelle onCode={setCode} />

      {code && (
        <Resultat
          code={code}
          onCompteRequis={() => setModaleOuverte(true)}
          onRecommencer={() => setCode(null)}
        />
      )}

      <ModaleConnexion
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        retourVers="/scan"
      />
    </PageStatique>
  );
}

/* ---------------------------------------------------------------- caméra - */

type EtatCamera = "arret" | "demarrage" | "marche" | "refusee" | "absente" | "erreur";

/**
 * Le flux vidéo et la boucle de lecture.
 *
 * **La caméra ne démarre pas toute seule.** Un site qui réclame la caméra à
 * l'ouverture d'une page se fait refuser une fois pour toutes par le navigateur,
 * et l'autorisation ne se redemande pas facilement. On la demande au geste, une
 * fois que la page a expliqué à quoi elle sert.
 */
function Lecteur({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const detecteurRef = useRef<Detecteur | null>(null);
  const boucleRef = useRef<number | null>(null);
  const [etat, setEtat] = useState<EtatCamera>("arret");
  const [natif, setNatif] = useState<boolean | null>(null);

  const arreter = useCallback(() => {
    if (boucleRef.current !== null) {
      cancelAnimationFrame(boucleRef.current);
      boucleRef.current = null;
    }
    // Sans ce `stop()` sur chaque piste, la pastille de la caméra reste allumée
    // après qu'on a quitté la page : le flux survit à la vidéo qui l'affichait.
    fluxRef.current?.getTracks().forEach((p) => p.stop());
    fluxRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setEtat("arret");
  }, []);

  // Le démontage doit couper le flux, y compris quand on part par un lien.
  useEffect(() => arreter, [arreter]);

  const demarrer = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setEtat("absente");
      return;
    }
    setEtat("demarrage");
    try {
      const detecteur = detecteurRef.current ?? (await creerDetecteur());
      detecteurRef.current = detecteur;
      setNatif(detecteur.natif);

      const flux = await navigator.mediaDevices.getUserMedia({
        // `environment` demande la caméra arrière. Sans elle on se filme le
        // visage en cherchant un boîtier, ce qui ne se comprend pas.
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      fluxRef.current = flux;

      const video = videoRef.current;
      if (!video) {
        flux.getTracks().forEach((p) => p.stop());
        return;
      }
      video.srcObject = flux;
      await video.play();
      setEtat("marche");

      const lire = async () => {
        boucleRef.current = requestAnimationFrame(() => { void lire(); });
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detecteur.lire(videoRef.current);
          for (const brut of codes) {
            const propre = normaliserCode(brut);
            // La clé de contrôle écarte les lectures partielles : un reflet
            // rend souvent douze chiffres justes et un faux, et interroger la
            // base là-dessus rendrait « inconnu » pour un disque qu'on a.
            if (eanValide(propre)) {
              arreter();
              onCode(propre);
              return;
            }
          }
        } catch {
          // Une image illisible n'est pas une panne, c'est le cas courant.
        }
      };
      void lire();
    } catch (e) {
      const nom = (e as { name?: string }).name;
      setEtat(nom === "NotAllowedError" ? "refusee" : nom === "NotFoundError" ? "absente" : "erreur");
    }
  };

  return (
    <Section titre="La caméra">
      {/* Sous `lg` seulement, comme demandé : sur un écran large on garde la
          saisie manuelle, qui est juste en dessous. */}
      <div className="hidden lg:block">
        <Encadre>
          Le scan est fait pour le téléphone, avec le boîtier dans la main. Ouvrez{" "}
          <strong>jaquette.app/scan</strong> depuis le vôtre, ou saisissez les treize chiffres
          ci-dessous.
        </Encadre>
      </div>

      <div className="lg:hidden">
        {etat === "arret" && (
          <button
            type="button"
            onClick={() => { void demarrer(); }}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
            style={{ backgroundColor: "var(--reel-accent)", color: "#fff", fontWeight: 600 }}
          >
            <Camera size={20} />
            Ouvrir la caméra
          </button>
        )}

        {etat === "demarrage" && (
          <AttentePleine hauteur={200} libelle="Préparation de la caméra…" />
        )}

        <div
          className={etat === "marche" ? "relative overflow-hidden rounded-[12px]" : "hidden"}
          style={{ border: "1px solid var(--reel-border)" }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="block w-full"
            style={{ maxHeight: "60vh", objectFit: "cover" }}
          />
          {/* Une fenêtre de visée, purement décorative : elle dit où mettre le
              code, alors que la détection porte sur l'image entière. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 rounded-[8px]"
            style={{ height: "22%", border: "2px solid var(--reel-accent-clair)" }}
          />
          <button
            type="button"
            onClick={arreter}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 outline-none"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "13px" }}
          >
            <CameraOff size={15} />
            Fermer
          </button>
        </div>

        {etat === "marche" && (
          <p className="pt-2" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            Cadrez le code-barres. {natif === false && "Lecture assurée par le lecteur embarqué."}
          </p>
        )}

        {etat === "refusee" && (
          <Encadre>
            L’accès à la caméra a été refusé. Vous pouvez le rétablir dans les réglages du
            navigateur pour ce site, ou saisir les chiffres à la main juste en dessous.
          </Encadre>
        )}
        {etat === "absente" && (
          <Encadre>
            Aucune caméra n’est accessible depuis ce navigateur. La saisie manuelle est juste en
            dessous.
          </Encadre>
        )}
        {etat === "erreur" && (
          <Encadre>
            La caméra n’a pas démarré. Réessayez, ou saisissez les chiffres à la main.
          </Encadre>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------ saisie manuelle -- */

/**
 * Toujours visible, jamais un repli d'échec.
 *
 * La caméra peut être refusée, un boîtier peut être abîmé, et certains
 * préfèrent taper. Réserver ce champ aux cas d'erreur le rendrait introuvable
 * pour ceux qui en ont besoin dès le premier essai.
 */
function SaisieManuelle({ onCode }: { onCode: (code: string) => void }) {
  const [saisie, setSaisie] = useState("");
  const chiffres = saisie.replace(/\D/g, "").slice(0, 13);
  const complet = chiffres.length === 13;

  return (
    <Section titre="Ou tapez les chiffres">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && complet) onCode(chiffres); }}
          placeholder="3512394015968"
          autoComplete="off"
          spellCheck={false}
          aria-label="Code-barres à treize chiffres"
          className="w-full max-w-[240px] rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
          style={{
            backgroundColor: "var(--reel-surface)",
            border: "1px solid var(--reel-border)",
            color: "var(--reel-text)",
            // Un code-barres se lit chiffre à chiffre : la chasse fixe aligne
            // les colonnes et rend la relecture possible.
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.04em",
          }}
        />
        <button
          type="button"
          onClick={() => onCode(chiffres)}
          disabled={!complet}
          className="flex items-center gap-2 rounded-[10px] px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
          style={{
            backgroundColor: complet ? "var(--reel-accent)" : "var(--reel-surface-2)",
            color: complet ? "#fff" : "var(--reel-muted)",
            fontWeight: 600,
            cursor: complet ? "pointer" : "default",
          }}
        >
          <Keyboard size={17} />
          Chercher
        </button>
        {chiffres.length > 0 && !complet && (
          <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            {chiffres.length} chiffre{chiffres.length > 1 ? "s" : ""} sur treize.
          </span>
        )}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- résultat - */

/**
 * Ce que le code a donné.
 *
 * Trois issues, et les trois sont prévues : une édition, plusieurs éditions pour
 * un même code (cinq cas en base au 7 août 2026), aucune. La troisième n'est pas
 * une panne, c'est la moitié du catalogue, et elle mène à `/report`.
 */
function Resultat({
  code,
  onCompteRequis,
  onRecommencer,
}: {
  code: string;
  onCompteRequis: () => void;
  onRecommencer: () => void;
}) {
  const [editions, setEditions] = useState<EditionScannee[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    setEditions(null);
    setErreur(false);
    editionsParEan(code)
      .then((e) => { if (!annule) setEditions(e); })
      .catch(() => { if (!annule) setErreur(true); });
    return () => { annule = true; };
  }, [code]);

  const basculer = async (editionId: number, statut: StatutValue) => {
    try {
      const suivant = await basculerStatut(editionId, statut);
      toast.success(
        suivant === null
          ? statut === "possede" ? "Retiré de votre collection" : "Retiré de vos envies"
          : statut === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies",
      );
    } catch (e) {
      if (e instanceof CompteRequis) onCompteRequis();
      else toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Section titre={`Code ${code}`}>
      {editions === null && !erreur && (
        <AttentePleine hauteur={180} libelle="Recherche du disque…" />
      )}

      {erreur && (
        <Encadre>
          La recherche a échoué. Réessayez dans un instant.
        </Encadre>
      )}

      {editions?.length === 0 && (
        <>
          {codeMagasin(code) ? (
            <Encadre>
              Ce code commence par 2 : c’est une référence interne à une enseigne, qui n’identifie
              pas le disque en dehors de leurs rayons. Prenez celui imprimé au dos du boîtier.
            </Encadre>
          ) : (
            <Encadre>
              Ce code-barres n’est pas au catalogue. C’est le cas d’environ un disque sur deux, et
              c’est exactement ce que le signalement sert à combler.
            </Encadre>
          )}
          {!codeMagasin(code) && (
            <p>
              <Link
                to={`/report?ean=${code}`}
                style={{ color: "var(--reel-accent-clair)", fontWeight: 600 }}
              >
                Signaler cette édition
              </Link>{" "}
              — nous en tirons le titre, l’éditeur, le support et la durée, et la fiche apparaît à
              la passe suivante.
            </p>
          )}
        </>
      )}

      {editions && editions.length > 1 && (
        <Encadre>
          Deux éditions du catalogue portent ce même code-barres. Choisissez celle que vous avez :
          si vous ne savez pas, prenez la première, elles décrivent presque toujours le même disque.
        </Encadre>
      )}

      {editions?.map((edition) => (
        <CarteEdition key={edition.id} edition={edition} onBasculer={basculer} />
      ))}

      {editions !== null && (
        <p className="pt-1">
          <button
            type="button"
            onClick={onRecommencer}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--reel-accent-clair)",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Scanner un autre disque
          </button>
        </p>
      )}
    </Section>
  );
}

function CarteEdition({
  edition,
  onBasculer,
}: {
  edition: EditionScannee;
  onBasculer: (editionId: number, statut: StatutValue) => Promise<void>;
}) {
  const film = edition.films[0] ?? null;
  // Le visuel de l'édition d'abord, l'affiche du film en repli : 319 éditions
  // n'ont pas de jaquette (§4), et une carte sans image se lit comme un bug.
  const visuel = vignette(edition.image_url, 200) ?? film?.affiche_url ?? null;
  const lien = lienFilm(film);

  return (
    <div
      className="flex gap-3 rounded-[10px] p-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      {visuel && (
        <img
          src={visuel}
          alt=""
          className="h-[112px] w-[75px] shrink-0 rounded-[6px] object-cover"
          loading="lazy"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
            {film ? film.titre : (edition.titre ?? "Édition sans titre")}
            {film?.annee ? ` (${film.annee})` : ""}
          </div>
          <div style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            {/* `splitList` et non un `join` direct : la colonne est un `text[]`
                en base mais l'interface la déclare `string | null`, les deux
                formes circulent selon la requête. */}
            {[splitList(edition.formats_extraits).join(" · "), edition.editeur]
              .filter(Boolean)
              .join(" — ")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <BoutonListe onClick={() => onBasculer(edition.id, "possede")}>
            Je l’ai
          </BoutonListe>
          <BoutonListe onClick={() => onBasculer(edition.id, "envie")} secondaire>
            Je le veux
          </BoutonListe>
          {lien && (
            <Link
              to={lien}
              className="rounded-[8px] px-3 py-1.5"
              style={{
                fontSize: "13px",
                color: "var(--reel-accent-clair)",
                border: "1px solid var(--reel-border)",
              }}
            >
              Voir la fiche
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function BoutonListe({
  children,
  onClick,
  secondaire,
}: {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  secondaire?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => { void onClick(); }}
      className="rounded-[8px] px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{
        fontSize: "13px",
        fontWeight: 600,
        backgroundColor: secondaire ? "var(--reel-surface-2)" : "var(--reel-accent)",
        color: secondaire ? "var(--reel-text)" : "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
