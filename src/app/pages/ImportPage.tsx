import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Upload, AtSign, CheckCircle2, HelpCircle, Search } from "lucide-react";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { AttentePleine } from "../components/AttenteRecherche";
import { connexionGoogle, useSession } from "../lib/auth";
import { lienFilm } from "../lib/liens";
import { vignette } from "../lib/visuels";
import type { StatutValue } from "../lib/reelio-db";
import {
  LIBELLE_NATURE,
  lireCsv,
  lireZip,
  natureDe,
  type EntreeImportee,
  type FichierLu,
} from "../lib/import-collection";
import {
  lireCollection,
  lireCompte,
  lireListe,
  listeDepuis,
  pseudoDepuis,
  SensCritiqueIndisponible,
  type CompteSensCritique,
} from "../lib/senscritique";
import {
  apparier,
  bilanDe,
  choisirEdition,
  classer,
  ecrireImport,
  FORMATS,
  type EditionCandidate,
  type FilmApparie,
  type FormatVoulu,
  type LigneImport,
} from "../lib/appariement";

/**
 * Importer une collection tenue ailleurs.
 *
 * **Pourquoi ça existe.** Le relevé du 2 août 2026 (§8) met le remplissage
 * initial au cœur de l'adoption : une collection vide se remplit édition par
 * édition, ce qui condamne l'inscription, et personne ne saisit huit cents
 * titres à la main. Ces gens ont déjà leur liste ailleurs, et le banc d'essai du
 * même jour portait précisément sur des listes SensCritique intitulées
 * « DVD / Blu-ray / Steelbook ».
 *
 * **En `lazy()` et `noindex`**, comme `/account` et `/report` : personne n'y
 * arrive depuis un moteur, la règle du §9 sur les chemins de consultation ne
 * s'applique donc pas.
 */
export function ImportPage() {
  const session = useSession();
  const [source, setSource] = useState<{ nom: string; entrees: EntreeImportee[] } | null>(null);

  return (
    <PageStatique
      titre="Importer une collection"
      description="Reprenez votre collection depuis Letterboxd ou SensCritique, en une fois."
      noindex
    >
      <Section titre="Ce que ça fait">
        <p>
          Vous avez déjà listé vos disques ailleurs : on lit cette liste, on cherche chaque titre au
          catalogue, et <strong>on vous montre le résultat avant d’écrire quoi que ce soit</strong>.
          Rien n’est jamais retiré de vos listes, l’import ne peut qu’ajouter.
        </p>
        <p>
          Attendez-vous à ce qu’une partie manque : le catalogue couvre environ trois quarts d’une
          collection française ordinaire, et les absents sont surtout les éditions de studio des
          années 2000-2014. Ils vous seront listés, avec de quoi les signaler.
        </p>
      </Section>

      {session === undefined && (
        <AttentePleine hauteur={180} libelle="Vérification de la session…" />
      )}

      {session === null && (
        <Section titre="Un compte est nécessaire">
          <p>
            L’import écrit dans vos listes, il faut donc qu’elles appartiennent à quelqu’un. La
            lecture de votre liste, elle, se fait dans votre navigateur.
          </p>
          <div className="pt-1">
            <Bouton onClick={() => { void connexionGoogle("/import"); }}>
              Se connecter avec Google
            </Bouton>
          </div>
        </Section>
      )}

      {session && !source && <ChoixSource onSource={setSource} />}

      {session && source && (
        <Appariement
          nom={source.nom}
          entrees={source.entrees}
          onRecommencer={() => setSource(null)}
        />
      )}
    </PageStatique>
  );
}

/* ----------------------------------------------------------- la source --- */

function ChoixSource({
  onSource,
}: {
  onSource: (s: { nom: string; entrees: EntreeImportee[] }) => void;
}) {
  return (
    <>
      <FichierDepose onSource={onSource} />
      <SensCritique onSource={onSource} />
    </>
  );
}

/**
 * Un fichier déposé : le ZIP de Letterboxd, ou n'importe quel CSV.
 *
 * **On ne récupère jamais le site de Letterboxd.** Leur `robots.txt` met les
 * agents d'IA en `Disallow: /`, c'est une politique déclarée au sens du §5, et
 * il n'y a de toute façon rien à y chercher : leur export officiel est en libre
 * service et rend tout.
 */
function FichierDepose({
  onSource,
}: {
  onSource: (s: { nom: string; entrees: EntreeImportee[] }) => void;
}) {
  const [fichiers, setFichiers] = useState<FichierLu[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function deposer(fichier: File) {
    setEnCours(true);
    setErreur(null);
    setFichiers(null);
    try {
      if (fichier.name.toLowerCase().endsWith(".zip")) {
        const lus = await lireZip(fichier);
        if (!lus) {
          setErreur("Ce fichier n’est pas une archive lisible.");
        } else if (lus.length === 0) {
          setErreur("Cette archive ne contient aucun CSV exploitable.");
        } else {
          setFichiers(lus);
        }
      } else {
        const lu = lireCsv(fichier.name, await fichier.text());
        // Un refus franc, pas un fichier vide : le §9 pose qu'une lecture qui
        // échoue doit s'interrompre, et « 0 titre » se lit comme une liste vide
        // alors que c'est un en-tête qu'on n'a pas su lire.
        if (!lu) {
          setErreur(
            "Aucune colonne de titre reconnue. Le fichier doit en porter une, " +
              "nommée Name, Title ou Titre.",
          );
        } else {
          setFichiers([lu]);
        }
      }
    } catch {
      setErreur("Le fichier n’a pas pu être lu.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Section titre="Depuis un fichier">
      <p>
        Letterboxd : <em>Settings → Data → Export your data</em>. Déposez le ZIP tel quel, sans
        l’ouvrir. Un CSV isolé fonctionne aussi, quelle que soit son origine, du moment qu’il porte
        une colonne de titre.
      </p>

      <label
        className="flex cursor-pointer items-center gap-3 rounded-[10px] px-4 py-3 transition"
        style={{
          backgroundColor: "var(--reel-surface)",
          border: "1px dashed var(--reel-border)",
          color: "var(--reel-text)",
        }}
      >
        <Upload size={18} style={{ color: "var(--reel-accent-clair)" }} />
        <span style={{ fontSize: "14px" }}>
          {enCours ? "Lecture…" : "Choisir un fichier .zip ou .csv"}
        </span>
        <input
          type="file"
          accept=".zip,.csv,text/csv,application/zip"
          className="sr-only"
          disabled={enCours}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void deposer(f);
            // Sans cette remise à zéro, redéposer le même fichier après une
            // erreur ne déclenche aucun `change`.
            e.target.value = "";
          }}
        />
      </label>

      {erreur && <Encadre>{erreur}</Encadre>}

      {fichiers?.map((f) => {
        const nature = natureDe(f.nom);
        return (
          <button
            key={f.nom}
            type="button"
            onClick={() => onSource({ nom: f.nom, entrees: f.entrees })}
            className="flex w-full items-center justify-between gap-3 rounded-[10px] px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
            }}
          >
            <span className="min-w-0">
              <span
                className="block truncate"
                style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}
              >
                {f.nom}
              </span>
              <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                {f.entrees.length} titre{f.entrees.length > 1 ? "s" : ""} · {LIBELLE_NATURE[nature]}
              </span>
            </span>
            <span
              className="shrink-0"
              style={{ fontSize: "13px", color: "var(--reel-accent-clair)", fontWeight: 600 }}
            >
              Choisir
            </span>
          </button>
        );
      })}
    </Section>
  );
}

/**
 * SensCritique, lu depuis le navigateur du visiteur.
 *
 * Sondé le 7 août 2026 : leur API GraphQL publique répond sans authentification
 * et annonce `access-control-allow-origin: *`. **Nos serveurs n'adressent donc
 * aucune requête à senscritique.com** : c'est le navigateur du visiteur qui lit
 * ses propres données, ni proxy, ni crawl, ni pagination de leur site web.
 */
function SensCritique({
  onSource,
}: {
  onSource: (s: { nom: string; entrees: EntreeImportee[] }) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const [compte, setCompte] = useState<CompteSensCritique | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [avancement, setAvancement] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function chercher() {
    setErreur(null);
    setCompte(null);

    // Une URL de liste est la porte la plus directe : on colle le lien, sans
    // avoir à donner son pseudo.
    const idListe = listeDepuis(saisie);
    if (idListe) {
      await charger(async () => {
        const liste = await lireListe(idListe, (n, t) => setAvancement(`${n} sur ${t}`));
        if (!liste) {
          setErreur("Cette liste est privée ou n’existe plus.");
          return null;
        }
        return { nom: liste.label, entrees: liste.entrees };
      });
      return;
    }

    const pseudo = pseudoDepuis(saisie);
    if (!pseudo) {
      setErreur("Donnez un pseudo SensCritique, ou l’adresse d’une de vos listes.");
      return;
    }

    setEnCours(true);
    try {
      const c = await lireCompte(pseudo);
      if (!c) setErreur(`Aucun compte SensCritique nommé « ${pseudo} ».`);
      else setCompte(c);
    } catch (e) {
      setErreur(
        e instanceof SensCritiqueIndisponible
          ? `SensCritique n’a pas répondu : ${e.message}`
          : "SensCritique n’a pas répondu.",
      );
    } finally {
      setEnCours(false);
    }
  }

  async function charger(
    lecture: () => Promise<{ nom: string; entrees: EntreeImportee[] } | null>,
  ) {
    setEnCours(true);
    setAvancement("0");
    setErreur(null);
    try {
      const r = await lecture();
      if (r) onSource(r);
    } catch (e) {
      setErreur(
        e instanceof SensCritiqueIndisponible
          ? `SensCritique n’a pas répondu : ${e.message}`
          : "La lecture a échoué.",
      );
    } finally {
      setEnCours(false);
      setAvancement(null);
    }
  }

  return (
    <Section titre="Depuis SensCritique">
      <p>
        Votre pseudo suffit, ou l’adresse d’une de vos listes. La lecture se fait{" "}
        <strong>dans votre navigateur</strong>, directement chez eux : rien ne passe par nos
        serveurs, et nous ne conservons que ce que vous choisissez d’importer.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <AtSign
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--reel-muted)" }}
          />
          <input
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void chercher(); }}
            placeholder="votre_pseudo"
            autoComplete="off"
            spellCheck={false}
            disabled={enCours}
            aria-label="Pseudo SensCritique ou adresse d’une liste"
            className="w-full min-w-[240px] rounded-[8px] py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
            }}
          />
        </div>
        <Bouton onClick={() => { void chercher(); }} disabled={enCours || !saisie.trim()}>
          {enCours ? "Lecture…" : "Chercher"}
        </Bouton>
        {avancement && (
          <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{avancement} titres lus</span>
        )}
      </div>

      {erreur && <Encadre>{erreur}</Encadre>}

      {compte && (
        <>
          <p style={{ color: "var(--reel-text)" }}>
            Compte <strong>{compte.pseudo}</strong>. Choisissez ce que vous voulez reprendre.
          </p>

          <LigneSource
            titre="Vos envies"
            detail={`${compte.envies} œuvre${compte.envies > 1 ? "s" : ""}`}
            onClick={() => {
              void charger(async () => ({
                nom: `Envies de ${compte.pseudo}`,
                entrees: await lireCollection(compte.pseudo, "WISH", (n, t) =>
                  setAvancement(`${n} sur ${t}`),
                ),
              }));
            }}
            disabled={enCours || compte.envies === 0}
          />

          {compte.listes.map((l) => (
            <LigneSource
              key={l.id}
              titre={l.label}
              detail={`${l.nb} œuvre${l.nb > 1 ? "s" : ""}`}
              onClick={() => {
                void charger(async () => {
                  const liste = await lireListe(l.id, (n, t) => setAvancement(`${n} sur ${t}`));
                  return liste ? { nom: liste.label, entrees: liste.entrees } : null;
                });
              }}
              disabled={enCours}
            />
          ))}

          <LigneSource
            titre="Vos films vus"
            /*
              **« Vu » n'est pas « possédé », et c'est la distinction qui fonde
              le site.** Une étagère n'est pas un journal de visionnage : reprendre
              les 847 films vus de quelqu'un remplirait sa collection de disques
              qu'il n'a jamais eus. L'entrée existe, nommée pour ce qu'elle est, et
              elle est la dernière de la liste.
            */
            detail={`${compte.vus} œuvres, à ne reprendre qu’en envies`}
            onClick={() => {
              void charger(async () => ({
                nom: `Vus de ${compte.pseudo}`,
                entrees: await lireCollection(compte.pseudo, "DONE", (n, t) =>
                  setAvancement(`${n} sur ${t}`),
                ),
              }));
            }}
            disabled={enCours || compte.vus === 0}
          />
        </>
      )}
    </Section>
  );
}

function LigneSource({
  titre,
  detail,
  onClick,
  disabled,
}: {
  titre: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 rounded-[10px] px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
      style={{
        backgroundColor: "var(--reel-surface)",
        border: "1px solid var(--reel-border)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="min-w-0">
        <span
          className="block truncate"
          style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}
        >
          {titre}
        </span>
        <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{detail}</span>
      </span>
      <span
        className="shrink-0"
        style={{ fontSize: "13px", color: "var(--reel-accent-clair)", fontWeight: 600 }}
      >
        Choisir
      </span>
    </button>
  );
}

/* ------------------------------------------------------- l'appariement --- */

/**
 * Le compte rendu, avant toute écriture.
 *
 * C'est la seule façon de refuser un import qui aurait mal tourné, et c'est
 * aussi ce qui rend le levier de format utile : on le change, le tableau se
 * recalcule sans un appel de plus, les candidats étant déjà en mémoire.
 */
function Appariement({
  nom,
  entrees,
  onRecommencer,
}: {
  nom: string;
  entrees: EntreeImportee[];
  onRecommencer: () => void;
}) {
  const [candidats, setCandidats] = useState<FilmApparie[][] | null>(null);
  const [avancement, setAvancement] = useState(0);
  const [erreur, setErreur] = useState(false);
  const [format, setFormat] = useState<FormatVoulu | null>(null);
  const [statut, setStatut] = useState<StatutValue>("possede");
  const [choix, setChoix] = useState<Record<number, number>>({});
  const [ecrit, setEcrit] = useState<{ ecrites: number; precisees: number } | null>(null);
  const [ecriture, setEcriture] = useState(false);

  // Un seul appariement par source : changer le format ou le statut ne doit pas
  // relancer quatre secondes de requêtes, les candidats restant en mémoire et
  // le classement se refaisant sans réseau.
  useEffect(() => {
    let annule = false;
    apparier(entrees, (faits) => { if (!annule) setAvancement(faits); })
      .then((c) => { if (!annule) setCandidats(c); })
      .catch(() => { if (!annule) setErreur(true); });
    return () => { annule = true; };
  }, [entrees]);

  const lignes = useMemo(
    () => (candidats ? classer(entrees, candidats, format) : []),
    [candidats, entrees, format],
  );

  // Les choix faits à la main priment sur le classement automatique.
  const finales = useMemo<LigneImport[]>(
    () =>
      lignes.map((l, i) => {
        const editionId = choix[i];
        if (editionId === undefined) return l;
        const film = l.film ?? l.candidats.find((c) => c.editions.some((e) => e.id === editionId));
        const edition = film?.editions.find((e) => e.id === editionId) ?? null;
        return edition ? { ...l, film: film ?? null, edition, precisee: true, sort: "sur" } : l;
      }),
    [lignes, choix],
  );

  const bilan = useMemo(() => bilanDe(finales), [finales]);
  const aEcrire = finales.filter((l) => l.edition !== null);

  async function ecrire() {
    setEcriture(true);
    try {
      const r = await ecrireImport(aEcrire, statut);
      setEcrit(r);
      toast.success(`${r.ecrites} édition${r.ecrites > 1 ? "s" : ""} ajoutée${r.ecrites > 1 ? "s" : ""}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "L’écriture a échoué.");
    } finally {
      setEcriture(false);
    }
  }

  if (erreur) {
    return (
      <Section titre="L’appariement a échoué">
        <Encadre>Réessayez dans un instant, rien n’a été écrit.</Encadre>
        <p>
          <BoutonTexte onClick={onRecommencer}>Choisir une autre source</BoutonTexte>
        </p>
      </Section>
    );
  }

  if (!candidats) {
    return (
      <Section titre={`« ${nom} », ${entrees.length} titres`}>
        <AttentePleine hauteur={200} libelle={`Recherche au catalogue… ${avancement} sur ${entrees.length}`} />
      </Section>
    );
  }

  if (ecrit) {
    return (
      <Section titre="C’est importé">
        <Encadre>
          {ecrit.ecrites} édition{ecrit.ecrites > 1 ? "s" : ""} ajoutée
          {ecrit.ecrites > 1 ? "s" : ""} à {statut === "possede" ? "votre collection" : "vos envies"}.
          {ecrit.precisees < ecrit.ecrites && (
            <>
              {" "}
              {ecrit.ecrites - ecrit.precisees} portent une édition non précisée : le film et le
              format sont justes, le pressage exact reste à confirmer depuis votre profil.
            </>
          )}
        </Encadre>
        <p>
          <Link to="/profile" style={{ color: "var(--reel-accent-clair)", fontWeight: 600 }}>
            Voir mes listes
          </Link>
          {" · "}
          <BoutonTexte onClick={onRecommencer}>Importer autre chose</BoutonTexte>
        </p>
      </Section>
    );
  }

  return (
    <>
      <Section titre={`« ${nom} », ${entrees.length} titres`}>
        <div className="flex flex-wrap gap-2">
          <Compteur valeur={bilan.sur} libelle={pluriel(bilan.sur, "prêt", "prêts")} accent />
          <Compteur
            valeur={bilan.aPreciser}
            libelle={pluriel(bilan.aPreciser, "édition à préciser", "éditions à préciser")}
          />
          <Compteur valeur={bilan.homonyme} libelle="à trancher" />
          <Compteur valeur={bilan.absent} libelle={pluriel(bilan.absent, "absent", "absents")} />
        </div>

        <label className="flex flex-wrap items-center gap-2 pt-1">
          <span>Ranger dans</span>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as StatutValue)}
            className="rounded-[8px] px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
              fontSize: "14px",
            }}
          >
            <option value="possede">ma collection</option>
            <option value="envie">mes envies</option>
          </select>
        </label>

        <label className="flex flex-wrap items-center gap-2">
          <span>Je collectionne surtout en</span>
          <select
            value={format ?? ""}
            onChange={(e) => setFormat((e.target.value || null) as FormatVoulu | null)}
            className="rounded-[8px] px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
            style={{
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              color: "var(--reel-text)",
              fontSize: "14px",
            }}
          >
            <option value="">tous formats</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <p style={{ fontSize: "13px" }}>
          Un film populaire a souvent dix éditions, et personne ne se souvient de laquelle il a.
          Celles qu’on n’a pas su trancher sont importées <strong>sans affirmer le pressage</strong> :
          le film et le format sont justes, et vous pourrez préciser plus tard.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Bouton onClick={() => { void ecrire(); }} disabled={ecriture || aEcrire.length === 0}>
            {ecriture
              ? "Écriture…"
              : `Importer ${aEcrire.length} édition${aEcrire.length > 1 ? "s" : ""}`}
          </Bouton>
          <BoutonTexte onClick={onRecommencer}>Changer de source</BoutonTexte>
        </div>
      </Section>

      {bilan.homonyme > 0 && (
        <Section titre={`${bilan.homonyme} ${pluriel(bilan.homonyme, "titre", "titres")} à trancher`}>
          <p>
            Plusieurs films portent ce titre à un an près. Tant que vous n’avez pas choisi, rien
            n’est importé pour eux : un lien faux se lit comme une vérité, une absence se corrige.
          </p>
          {finales.map((l, i) =>
            l.sort !== "homonyme" ? null : (
              <ChoixHomonyme
                key={i}
                ligne={l}
                onChoisir={(editionId) => setChoix((c) => ({ ...c, [i]: editionId }))}
              />
            ),
          )}
        </Section>
      )}

      {bilan.absent > 0 && (
        <Section
          titre={`${bilan.absent} ${pluriel(bilan.absent, "titre absent", "titres absents")} du catalogue`}
        >
          <p>
            Aucun disque de nos sources ne porte ces œuvres. Ce n’est pas un défaut de recherche :
            le catalogue est construit à partir des éditions réellement en vente, et il lui manque
            surtout le fonds de studio des années 2000-2014.
          </p>
          <Encadre>
            {finales
              .filter((l) => l.sort === "absent")
              .slice(0, 40)
              .map((l) => l.entree.titre)
              .join(" · ")}
            {bilan.absent > 40 && ` … et ${bilan.absent - 40} autres`}
          </Encadre>
          <p>
            Si vous avez le boîtier en main,{" "}
            <Link to="/report" style={{ color: "var(--reel-accent-clair)" }}>
              son code-barres suffit à le faire entrer
            </Link>
            .
          </p>
        </Section>
      )}
    </>
  );
}

function ChoixHomonyme({
  ligne,
  onChoisir,
}: {
  ligne: LigneImport;
  onChoisir: (editionId: number) => void;
}) {
  return (
    <div
      className="rounded-[10px] px-4 py-3"
      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
    >
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
        {ligne.entree.titre}
        {ligne.entree.annee ? ` (${ligne.entree.annee})` : ""}
      </div>
      <div className="flex flex-col gap-1.5 pt-2">
        {ligne.candidats.map((c) => {
          // On propose le film, pas le pressage : le choix d'édition se fait
          // ensuite par le même chemin que les autres lignes, format compris.
          const { edition } = choisirEdition(c, ligne.entree.note, null);
          if (!edition) return null;
          const lien = lienFilm({ id: c.filmId, slug: c.slug });
          const visuel = vignette(edition.image_url, 120) ?? c.afficheUrl;
          return (
            <div key={c.filmId} className="flex items-center gap-2">
              {visuel && (
                <img src={visuel} alt="" className="h-[48px] w-[32px] rounded-[4px] object-cover" loading="lazy" />
              )}
              <button
                type="button"
                onClick={() => onChoisir(edition.id)}
                className="flex-1 rounded-[8px] px-3 py-1.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
                style={{
                  backgroundColor: "var(--reel-surface-2)",
                  color: "var(--reel-text)",
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {c.titre} {c.annee ? `(${c.annee})` : ""}
                {c.realisateur && (
                  <span style={{ color: "var(--reel-muted)" }}> — {c.realisateur}</span>
                )}
              </button>
              {lien && (
                <Link
                  to={lien}
                  className="shrink-0"
                  style={{ fontSize: "12px", color: "var(--reel-accent-clair)" }}
                >
                  fiche
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- petits --- */

/**
 * Accord en nombre.
 *
 * Un « 1 titres absents » se remarque tout de suite et fait négligé, sur un
 * écran qui demande précisément qu'on lui fasse confiance avant d'écrire dans
 * ses listes. Les deux formes sont écrites en toutes lettres plutôt qu'un « s »
 * ajouté : « titre absent » devient « titres absents », deux mots s'accordent.
 */
function pluriel(n: number, singulier: string, plurielForme: string): string {
  return n > 1 ? plurielForme : singulier;
}

function Compteur({
  valeur,
  libelle,
  accent,
}: {
  valeur: number;
  libelle: string;
  accent?: boolean;
}) {
  const Icone = accent ? CheckCircle2 : valeur > 0 ? HelpCircle : Search;
  return (
    <span
      className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5"
      style={{
        backgroundColor: "var(--reel-surface)",
        border: "1px solid var(--reel-border)",
        fontSize: "13px",
        color: accent ? "var(--reel-text)" : "var(--reel-muted)",
      }}
    >
      <Icone size={14} style={{ color: accent ? "var(--reel-accent-clair)" : "var(--reel-muted)" }} />
      <strong style={{ color: "var(--reel-text)" }}>{valeur}</strong> {libelle}
    </span>
  );
}

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
      className="rounded-[10px] px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
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

function BoutonTexte({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        color: "var(--reel-accent-clair)",
        cursor: "pointer",
        fontSize: "15px",
      }}
    >
      {children}
    </button>
  );
}
