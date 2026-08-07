import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Upload, AtSign, ArrowRight, CheckCircle2, HelpCircle, Search } from "lucide-react";
import { PageStatique, Section, Encadre } from "../components/PageStatique";
import { AttentePleine } from "../components/AttenteRecherche";
import { connexionGoogle, useSession } from "../lib/auth";
import { lienFilm } from "../lib/liens";
import { vignette } from "../lib/visuels";
import type { StatutValue } from "../lib/reelio-db";
import {
  MESSAGE,
  chiffres,
  eanBienForme,
  signalerEdition,
  type Verdict,
} from "../lib/signalements";
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
  type Sort,
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
      {/*
        **Le texte a été coupé de moitié après le premier import réel.** Il
        disait vrai mais il disait tout, et sur un écran où l'on vient déposer un
        fichier, chaque paragraphe repousse plus bas la seule chose à faire. Ce
        qui reste est ce qui engage : rien n'est écrit sans qu'on l'ait vu, rien
        n'est retiré. Le reste, couverture du catalogue et sort des absents, se
        dit **au moment où ça se voit**, c'est-à-dire dans le compte rendu, et la
        FAQ en garde la version longue.
      */}
      <Section titre="Ce que ça fait">
        <p>
          On lit votre liste, on cherche chaque titre au catalogue, et{" "}
          <strong>on vous montre tout avant d’écrire quoi que ce soit</strong>. Rien n’est jamais
          retiré : un import ne peut qu’ajouter.
        </p>
      </Section>

      {session === undefined && (
        <AttentePleine hauteur={180} libelle="Vérification de la session…" />
      )}

      {session === null && (
        <Section titre="Un compte est nécessaire">
          <p>Vos listes doivent appartenir à quelqu’un. La lecture, elle, se fait chez vous.</p>
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
        Letterboxd : <em>Settings → Data → Export your data</em>, puis déposez le ZIP sans l’ouvrir.
        N’importe quel CSV portant une colonne de titre marche aussi.
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
        Votre pseudo, ou l’adresse d’une de vos listes. La lecture se fait{" "}
        <strong>dans votre navigateur</strong>, rien ne passe par nos serveurs.
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
            Compte <strong>{compte.pseudo}</strong>.
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
  /** Le film retenu quand plusieurs homonymes se disputaient la ligne. */
  const [filmChoisi, setFilmChoisi] = useState<Record<number, number>>({});
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

  /*
    Les choix faits à la main priment sur le classement automatique.

    Deux niveaux, et l'ordre compte : on tranche d'abord **quel film**, ce qui
    débloque une ligne homonyme, puis **quelle édition** de ce film. Un homonyme
    tranché retombe alors dans le cas ordinaire, édition unique ou pas, et
    traverse `choisirEdition` comme les autres au lieu d'être traité à part.
  */
  const finales = useMemo<LigneImport[]>(
    () =>
      lignes.map((l, i) => {
        let ligne = l;

        const filmId = filmChoisi[i];
        if (filmId !== undefined) {
          const film = l.candidats.find((c) => c.filmId === filmId);
          if (film) {
            const { edition, precisee } = choisirEdition(film, l.entree.note, format);
            ligne = edition
              ? { ...l, film, edition, precisee, sort: precisee ? "sur" : "aPreciser" }
              : l;
          }
        }

        const editionId = choix[i];
        if (editionId === undefined) return ligne;
        const film =
          ligne.film ?? ligne.candidats.find((c) => c.editions.some((e) => e.id === editionId));
        const edition = film?.editions.find((e) => e.id === editionId) ?? null;
        return edition ? { ...ligne, film: film ?? null, edition, precisee: true, sort: "sur" } : ligne;
      }),
    [lignes, choix, filmChoisi, format],
  );

  const bilan = useMemo(() => bilanDe(finales), [finales]);

  const RANG: Record<Sort, number> = { homonyme: 0, aPreciser: 1, sur: 2, absent: 3 };

  /*
    **L'ordre se calcule sur le classement automatique, jamais sur l'état
    courant**, et ce détail s'est vu dès le premier essai : trié sur `finales`,
    une ligne qu'on venait de préciser changeait de rang et sautait en bas du
    tableau, sous le curseur. On corrige une ligne, elle disparaît, on cherche
    où elle est passée.

    `lignes` porte le classement d'origine, avant tout choix à la main : les
    rangs sont donc figés tant qu'on ne change pas de source ni de format, et le
    tableau reste sous les doigts pendant qu'on le corrige.
  */
  const rangees = useMemo(
    () =>
      lignes
        .map((l, i) => ({ i, rang: RANG[l.sort] }))
        .filter(({ rang }) => rang !== RANG.absent)
        .sort((a, b) => a.rang - b.rang || a.i - b.i)
        .map(({ i }) => i),
    // `RANG` est une constante littérale, elle ne peut pas changer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lignes],
  );

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

  /*
    Les lignes appariées, celles qui ont une correspondance à montrer.

    **L'ordre met devant ce qui demande quelque chose.** Un homonyme bloque
    l'import de sa ligne, une édition non précisée est écrite mais affirme moins
    que les autres, et une ligne sûre n'appelle aucun geste. Trier autrement,
    par ordre du fichier par exemple, noierait les trois cas qui comptent au
    milieu de trois cents qui vont bien.
  */
  const absents = finales.filter((l) => l.sort === "absent");

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

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          <label className="flex items-center gap-2">
            <span>Ranger dans</span>
            <Menu value={statut} onChange={(v) => setStatut(v as StatutValue)}>
              <option value="possede">ma collection</option>
              <option value="envie">mes envies</option>
            </Menu>
          </label>

          <label className="flex items-center gap-2">
            <span>Surtout en</span>
            <Menu value={format ?? ""} onChange={(v) => setFormat((v || null) as FormatVoulu | null)}>
              <option value="">tous formats</option>
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Menu>
          </label>
        </div>
      </Section>

      {rangees.length > 0 && (
        <Section titre="Ce qui sera importé">
          <p style={{ fontSize: "13px" }}>
            Un film à gauche, l’édition à droite. Celles qu’on n’a pas su trancher sont marquées :
            elles s’importent quand même, sans affirmer le pressage.
          </p>

          <div
            className="overflow-hidden rounded-[10px]"
            style={{ border: "1px solid var(--reel-border)" }}
          >
            {rangees.map((i, n) => (
              <Correspondance
                key={i}
                ligne={finales[i]}
                premiere={n === 0}
                onFilm={(filmId) => setFilmChoisi((c) => ({ ...c, [i]: filmId }))}
                onEdition={(editionId) =>
                  setChoix((c) => {
                    const suite = { ...c };
                    if (editionId === null) delete suite[i];
                    else suite[i] = editionId;
                    return suite;
                  })
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Bouton onClick={() => { void ecrire(); }} disabled={ecriture || aEcrire.length === 0}>
              {ecriture
                ? "Écriture…"
                : `Importer ${aEcrire.length} édition${aEcrire.length > 1 ? "s" : ""}`}
            </Bouton>
            <BoutonTexte onClick={onRecommencer}>Changer de source</BoutonTexte>
          </div>
        </Section>
      )}

      {absents.length > 0 && (
        <Section
          titre={`${bilan.absent} ${pluriel(bilan.absent, "titre absent", "titres absents")} du catalogue`}
        >
          <p style={{ fontSize: "13px" }}>
            Aucun disque de nos sources ne les porte. Si vous avez le boîtier en main, son
            code-barres suffit à le faire entrer : la fiche est créée à la passe suivante.
          </p>

          <div
            className="overflow-hidden rounded-[10px]"
            style={{ border: "1px solid var(--reel-border)" }}
          >
            {absents.slice(0, PLAFOND_ABSENTS).map((l, n) => (
              <LigneAbsent key={n} titre={l.entree.titre} annee={l.entree.annee} premiere={n === 0} />
            ))}
          </div>

          {absents.length > PLAFOND_ABSENTS && (
            <p style={{ fontSize: "13px" }}>
              … et {absents.length - PLAFOND_ABSENTS} autres, qui restent listés dans{" "}
              <Link to="/report" style={{ color: "var(--reel-accent-clair)" }}>
                la page de signalement
              </Link>
              .
            </p>
          )}
        </Section>
      )}
    </>
  );
}

/**
 * Une ligne de la table de correspondance : le film à gauche, son édition à
 * droite.
 *
 * **C'est l'écran que le premier import réel réclamait.** Le compte rendu
 * d'origine donnait quatre compteurs et un levier de format, donc on savait
 * *combien* de lignes restaient imprécises sans jamais pouvoir en corriger une
 * seule. Ici chaque ligne se répare là où elle se lit.
 *
 * Sur un homonyme, la cellule de gauche devient un menu : le film se choisit
 * d'abord, l'édition ensuite, parce qu'il n'y a pas d'édition tant qu'on ne sait
 * pas de quelle œuvre on parle.
 */
function Correspondance({
  ligne,
  premiere,
  onFilm,
  onEdition,
}: {
  ligne: LigneImport;
  premiere: boolean;
  onFilm: (filmId: number) => void;
  onEdition: (editionId: number | null) => void;
}) {
  const film = ligne.film;
  const visuel = film && ligne.edition ? vignette(ligne.edition.image_url, 200) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap"
      style={{
        backgroundColor: "var(--reel-surface)",
        borderTop: premiere ? undefined : "1px solid var(--reel-border)",
      }}
    >
      {/* Gauche : le film. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Jaquette src={visuel} repli={film?.afficheUrl} />

        {film ? (
          <span className="min-w-0">
            <span
              className="block truncate"
              style={{ fontSize: "14px", color: "var(--reel-text)" }}
            >
              {film.titre}
              {film.annee ? ` (${film.annee})` : ""}
            </span>
            {/* Le titre du fichier n'est rappelé que s'il diffère : sur une liste
                française il est identique une fois sur deux, et le répéter
                doublerait la hauteur de la table pour rien. */}
            {ligne.entree.titre !== film.titre && (
              <span className="block truncate" style={{ fontSize: "12px", color: "var(--reel-muted)" }}>
                {ligne.entree.titre}
              </span>
            )}
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <Menu value="" onChange={(v) => v && onFilm(Number(v))} pleineLargeur>
              <option value="">{ligne.entree.titre} — quel film ?</option>
              {ligne.candidats.map((c) => (
                <option key={c.filmId} value={c.filmId}>
                  {c.titre}
                  {c.annee ? ` (${c.annee})` : ""}
                  {c.realisateur ? ` — ${c.realisateur}` : ""}
                </option>
              ))}
            </Menu>
          </span>
        )}
      </div>

      <Fleche />

      {/* Droite : l'édition. */}
      <div className="w-full sm:w-[290px] sm:shrink-0">
        {film ? (
          <Menu
            value={ligne.precisee && ligne.edition ? String(ligne.edition.id) : ""}
            onChange={(v) => onEdition(v ? Number(v) : null)}
            pleineLargeur
          >
            <option value="">
              {ligne.edition ? `Non précisée — ${resume(ligne.edition)}` : "Non précisée"}
            </option>
            {film.editions.map((e) => (
              <option key={e.id} value={e.id}>{resume(e)}</option>
            ))}
          </Menu>
        ) : (
          <span style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            choisissez le film d’abord
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Combien d'absents on affiche en lignes saisissables.
 *
 * Le quota de `signaler_edition` est de **vingt par jour et par compte** (§3) :
 * dérouler cinq cents champs dont on ne pourra en envoyer que vingt serait une
 * promesse qu'on ne tient pas, et une page interminable. Trente laisse de la
 * marge sans mentir sur ce qui est possible en une fois.
 */
const PLAFOND_ABSENTS = 30;

/**
 * Un titre que le catalogue ne connaît pas, avec de quoi le faire entrer.
 *
 * **Pas de jaquette, et ce n'est pas un oubli.** Un absent n'est pas un film
 * sans disque, c'est un film qui n'est pas en base : mesuré le 7 août 2026,
 * **11 films seulement** sur 14 691 n'ont aucune édition. Il n'y a donc aucune
 * affiche à afficher de notre côté, et en chercher une supposerait d'appeler
 * TMDB depuis le navigateur, ce que la CSP refuse et ce qu'aucun jeton client ne
 * permet. Le cadre reste vide plutôt que de montrer une image devinée.
 *
 * **Le champ code-barres est ici et pas seulement sur `/report`**, parce que
 * c'est ici qu'on a le boîtier en tête : on vient de lire son titre dans sa
 * propre liste. C'est le couple que le §8 réclame, le signalement branché sur ce
 * qui l'a fait naître, plutôt qu'une page à retrouver plus tard.
 */
function LigneAbsent({
  titre,
  annee,
  premiere,
}: {
  titre: string;
  annee?: number;
  premiere: boolean;
}) {
  const [saisie, setSaisie] = useState("");
  const [envoye, setEnvoye] = useState<Verdict | null>(null);
  const [enCours, setEnCours] = useState(false);

  const code = chiffres(saisie);
  const valide = eanBienForme(code);

  async function envoyer() {
    setEnCours(true);
    try {
      // Le titre part en note : c'est ce qui permet de vérifier à la main que le
      // code correspond bien à l'œuvre annoncée, quand la passe le reprendra.
      const verdict = await signalerEdition(code, annee ? `${titre} (${annee})` : titre);
      setEnvoye(verdict);
      if (verdict === "enregistre") toast.success(MESSAGE[verdict]);
      else toast.error(MESSAGE[verdict]);
    } catch {
      toast.error("Envoi impossible. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap"
      style={{
        backgroundColor: "var(--reel-surface)",
        borderTop: premiere ? undefined : "1px solid var(--reel-border)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Jaquette />
        <span className="min-w-0">
          <span className="block truncate" style={{ fontSize: "14px", color: "var(--reel-text)" }}>
            {titre}
            {annee ? ` (${annee})` : ""}
          </span>
          <span style={{ fontSize: "12px", color: "var(--reel-muted)" }}>
            absent du catalogue
          </span>
        </span>
      </div>

      <Fleche />

      <div className="flex w-full items-center gap-2 sm:w-[290px] sm:shrink-0">
        {envoye === "enregistre" ? (
          <span style={{ fontSize: "13px", color: "var(--reel-accent-clair)" }}>
            Signalé, la fiche arrive à la prochaine passe.
          </span>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && valide) void envoyer(); }}
              placeholder="code-barres"
              autoComplete="off"
              spellCheck={false}
              disabled={enCours}
              aria-label={`Code-barres de ${titre}`}
              className="w-full min-w-0 rounded-[8px] px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
              style={{
                backgroundColor: "var(--reel-surface-2)",
                border: "1px solid var(--reel-border)",
                color: "var(--reel-text)",
                fontSize: "13px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            />
            <button
              type="button"
              onClick={() => { void envoyer(); }}
              disabled={!valide || enCours}
              className="shrink-0 rounded-[8px] px-2.5 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: valide ? "var(--reel-accent)" : "var(--reel-surface-2)",
                color: valide ? "#fff" : "var(--reel-muted)",
                border: "none",
                cursor: valide ? "pointer" : "default",
              }}
            >
              {enCours ? "…" : "Envoyer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * La jaquette d'une ligne.
 *
 * **Assez grande pour se reconnaître.** À 28 px de large, ce que la première
 * version posait, on distinguait une tache colorée et rien d'autre : la
 * jaquette ne servait alors à rien, alors que c'est précisément elle qui permet
 * de valider un appariement d'un coup d'œil, sans lire le titre.
 *
 * Le cadre garde sa place quand l'image manque, sinon les lignes ne s'alignent
 * plus les unes sous les autres et la colonne de titres ondule.
 *
 * **Le repli se déclenche sur l'échec, pas sur l'absence.** La première version
 * ne retombait sur l'affiche du film que si `image_url` était nul, et *Climax*
 * rendait donc l'icône d'image cassée : le §4 relève 319 éditions dont le visuel
 * répond 404 chez la source, colonne remplie et fichier mort. Une URL présente
 * ne prouve rien, seul `onError` le dit.
 */
function Jaquette({ src, repli }: { src?: string | null; repli?: string | null }) {
  const [echecs, setEchecs] = useState(0);
  const candidats = [src, repli].filter(Boolean) as string[];
  const courant = candidats[echecs];

  return courant ? (
    <img
      src={courant}
      alt=""
      // La clé force le remontage au changement de source : sans elle, le
      // navigateur garde l'image cassée en cache de rendu et `onError` ne
      // repasse pas.
      key={courant}
      onError={() => setEchecs((n) => n + 1)}
      className="h-[81px] w-[54px] shrink-0 rounded-[4px] object-cover"
      loading="lazy"
    />
  ) : (
    <span
      className="h-[81px] w-[54px] shrink-0 rounded-[4px]"
      style={{ backgroundColor: "var(--reel-surface-2)" }}
    />
  );
}

/**
 * La flèche entre les deux colonnes.
 *
 * Elle dit le sens de la lecture, « ce film devient cette édition », là où deux
 * cellules côte à côte laissent deviner. `aria-hidden` : elle ne porte rien
 * qu'un lecteur d'écran ait à annoncer, l'ordre du document dit déjà la même
 * chose.
 */
function Fleche() {
  return (
    <ArrowRight
      size={16}
      aria-hidden
      className="hidden shrink-0 sm:block"
      style={{ color: "var(--reel-muted)" }}
    />
  );
}

/**
 * Ce qui distingue une édition d'une autre, en une ligne.
 *
 * Les formats d'abord, c'est ce qu'on cherche ; l'éditeur ensuite ; l'année de
 * parution en dernier. Le `titre` de l'édition n'y est pas : il répète le nom du
 * film une fois sur deux, et un menu déroulant n'a pas la place.
 */
function resume(e: EditionCandidate): string {
  const bouts = [
    (e.formats ?? []).join(" · "),
    e.editeur,
    e.date_parution?.slice(0, 4),
  ].filter(Boolean);
  const texte = bouts.join(" — ");
  return (e.nb_films ?? 1) > 1 ? `Coffret ${e.nb_films} films — ${texte}` : texte || "Édition";
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

/**
 * Menu déroulant, seule forme de choix de la page.
 *
 * Un `select` natif et non une liste maison : sur téléphone il ouvre le
 * sélecteur du système, qui sait déjà afficher trente éditions dans une feuille
 * défilante, et c'est exactement ce dont la table a besoin.
 *
 * **Aucune teinte d'alerte sur le bord**, et c'est un revirement. La première
 * version cerclait de bleu toute ligne dont l'édition n'était pas précisée ;
 * comme c'est le cas de la grande majorité, la table entière paraissait
 * sélectionnée, et le bleu ne distinguait plus rien. Ce que la ligne a à dire
 * est déjà écrit dedans, « Non précisée », et les compteurs en tête donnent le
 * compte.
 */
function Menu({
  value,
  onChange,
  children,
  pleineLargeur,
}: {
  value: string;
  onChange: (valeur: string) => void;
  children: React.ReactNode;
  pleineLargeur?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        (pleineLargeur ? "w-full min-w-0 " : "") +
        "truncate rounded-[8px] px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--reel-accent)]"
      }
      style={{
        backgroundColor: "var(--reel-surface-2)",
        border: "1px solid var(--reel-border)",
        color: "var(--reel-text)",
        fontSize: "13px",
      }}
    >
      {children}
    </select>
  );
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
