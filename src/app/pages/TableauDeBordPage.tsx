import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Library, Bookmark, Wallet, CalendarClock, ArrowRight, ListPlus, Settings } from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { CarteEdition } from "../components/CarteEdition";
import { RailHorizontal } from "../components/RailHorizontal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { nomAffiche, useSession } from "../lib/auth";
import { getDernieresEditions, type EditionWithFilm } from "../lib/reelio-db";
import {
  getActiviteRecente,
  getResumeCollection,
  getSortiesAVenir,
  type ActiviteLigne,
  type ResumeCollection,
} from "../lib/tableau-de-bord";
import { lienFilm } from "../lib/liens";
import { arobase, cheminProfil } from "../lib/identifiant";
import { useProfil } from "../lib/profils";
import { formaterEuros, valeurCollection, type ValeurCollection } from "../lib/valeur";
import { useSeo } from "../lib/seo";

/**
 * Accueil connecté, posé le 3 août 2026.
 *
 * Trois colonnes, d'après la maquette Figma : le résumé de la collection à
 * gauche, le fil au centre, les sorties à venir à droite. Le catalogue, lui, a
 * sa page (`/catalogue`), atteignable depuis le bandeau.
 *
 * **La page est en `noindex`**, comme le profil : elle ne montre que des
 * données de compte, et un moteur qui la visiterait n'y verrait de toute façon
 * qu'une page vide, faute de session.
 *
 * Ce qui manque et qui est assumé : les baisses de prix, faute de source (le §8
 * les suspend à un flux Awin), et l'activité des autres comptes, faute de volet
 * social. Le fil ne montre donc que vos propres gestes.
 */
const LIBELLE_SECTION = {
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--reel-muted)",
} as const;

const CADRE = {
  backgroundColor: "var(--reel-surface)",
  border: "1px solid var(--reel-border)",
} as const;

export function TableauDeBordPage() {
  const session = useSession();
  const etatProfil = useProfil();
  const profil = etatProfil.statut === "pret" ? etatProfil.profil : null;
  const lienProfil = profil ? cheminProfil(profil.identifiant) : "/profile";
  /*
    `null` = pas encore lu, tableau vide = lu et réellement vide. **Les deux
    étaient confondus**, et le fil annonçait « Rien encore. Ouvrez une fiche
    film… » à chaque rafraîchissement, à quelqu'un dont la collection est
    pleine. Le message n'attendait même pas la requête : il paraissait dès le
    premier rendu et jusqu'à ce que la session soit résolue, ce qui prend
    jusqu'à deux secondes et demie en production (cf. `Accueil` dans App.tsx).

    Un état de chargement qui ressemble à un état vide est pire qu'un écran
    d'attente : il affirme quelque chose de faux.
  */
  const [resume, setResume] = useState<ResumeCollection | null>(null);
  const [activite, setActivite] = useState<ActiviteLigne[] | null>(null);
  const [dernieres, setDernieres] = useState<EditionWithFilm[] | null>(null);
  const [aVenir, setAVenir] = useState<EditionWithFilm[] | null>(null);

  useSeo({
    titre: "Mon tableau de bord",
    description: "Votre collection d’éditions physiques, vos envies et les parutions récentes.",
    noindex: true,
  });

  /*
    Quatre lectures indépendantes, chacune avec son `catch` : une panne sur les
    sorties à venir ne doit pas vider les compteurs de collection, qui sont la
    raison d'être de la page. Même principe que le repli du middleware au §7,
    on sert ce qu'on a plutôt que rien.
  */
  useEffect(() => {
    if (!session) return;
    let annule = false;

    getResumeCollection()
      .then((r) => { if (!annule) setResume(r); })
      .catch(() => {});
    /*
      Chaque `catch` retombe sur le tableau vide plutôt que de laisser `null` :
      une lecture qui échoue doit rendre la page à son état normal, pas la
      laisser en attente indéfinie. C'est le §9 mot pour mot, une lecture qui
      échoue ne doit pas se confondre avec une lecture qui n'a rien trouvé,
      mais elle ne doit pas non plus bloquer l'écran.
    */
    getActiviteRecente(10)
      .then((a) => { if (!annule) setActivite(a); })
      .catch(() => { if (!annule) setActivite([]); });
    getDernieresEditions(18)
      .then((e) => { if (!annule) setDernieres(e); })
      .catch(() => { if (!annule) setDernieres([]); });
    getSortiesAVenir(6)
      .then((e) => { if (!annule) setAVenir(e); })
      .catch(() => { if (!annule) setAVenir([]); });

    return () => { annule = true; };
  }, [session]);

  return (
    <div className="reel-gouttiere w-full pb-24 pt-[100px] md:pb-12">
      {/*
        Deux colonnes et non trois, depuis le 3 août 2026 : la page partage
        désormais la gouttière du reste du site, 58 % de la fenêtre, soit 835 px
        à 1 440. Trois colonnes n'y laissaient que deux cents pixels au fil. Les
        sorties à venir passent donc sous le panneau de gauche, où six lignes
        tiennent sans peine.
      */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ---- Colonne de gauche : qui vous êtes, et ce que vous avez ----

            Reprise du node Figma 1:558, **à plat** : pas de carte qui enveloppe
            l'ensemble. Les trois tuiles portent leur propre cadre, le reste est
            une simple colonne, et l'identité comme les liens sont posés sur le
            fond de page. Emboîter des cadres dans un cadre épaissit le bord
            gauche sans rien séparer de plus. */}
        <aside className="flex w-full shrink-0 flex-col gap-5 lg:sticky lg:top-[92px] lg:w-[248px]">
          {/*
            L'identité, et sous elle le « @ » plutôt que l'adresse électronique.

            L'adresse ne dit rien qu'on ne sache déjà, et elle vit dans
            `/account`. L'identifiant, lui, est ce qu'on donne à quelqu'un : il
            doit se lire et se recopier depuis l'accueil, sans passer par les
            réglages. En chasse fixe pour la même raison qu'un code-barres (§8),
            c'est une adresse, on la lit signe à signe.

            Repli sur l'adresse tant que le profil n'est pas lu : la ligne ne
            doit pas être vide pendant le chargement, ni si la lecture échoue.
          */}
          <div className="flex items-center gap-3">
            <UserAvatar name={profil?.nom ?? nomAffiche(session ?? null)} size={44} />
            <div className="min-w-0">
              <p className="truncate" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
                {profil?.nom ?? nomAffiche(session ?? null)}
              </p>
              {profil ? (
                <Link
                  to={cheminProfil(profil.identifiant)}
                  className="block truncate transition hover:brightness-125"
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "13px",
                    color: "var(--reel-accent-clair)",
                  }}
                >
                  {arobase(profil.identifiant)}
                </Link>
              ) : (
                <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                  {session?.user.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Tuile icone={Library} libelle="Éditions possédées" valeur={resume ? String(resume.possedees) : "—"} />
            <Tuile icone={Bookmark} libelle="Envies" valeur={resume ? String(resume.envies) : "—"} />
            <EncartValeur />
          </div>

          {/* Vers l'adresse canonique du profil quand elle est connue. Il y
              avait en plus une entrée « Ma page publique » : c'est la même
              page depuis que le profil n'a qu'une adresse. `/profile` reste le
              repli, c'est une forme courte qui redirige. */}
          <div className="flex flex-col gap-1">
            <LienPanneau to={lienProfil} icone={Library}>Ma collection</LienPanneau>
            <LienPanneau to={`${lienProfil}?liste=envies`} icone={Bookmark}>Mes envies</LienPanneau>
          </div>

          <div style={{ borderTop: "1px solid var(--reel-border)" }} />

          {/*
            La maquette met ici « Following » et « Followers ». Le volet social
            n'existe pas, et afficher deux compteurs à zéro annoncerait une
            fonction absente : ces deux lignes mènent donc à ce qui existe.
          */}
          <div className="flex flex-col gap-1">
            <LienPanneau to="/lists" icone={ListPlus}>Mes listes</LienPanneau>
            <LienPanneau to="/account" icone={Settings}>Mon compte</LienPanneau>
          </div>

          {/* Les sorties à venir, sous les liens plutôt qu'en troisième colonne.
              Le panneau disparaît quand la liste est vide plutôt que d'afficher
              un cadre creux : `date_parution` ne vient que de blu-ray.com, les
              autres sources ne datent rien, donc la liste peut se tarir sans
              prévenir. Mesuré le 3 août 2026 : 42 éditions à venir. */}
          {aVenir !== null && aVenir.length > 0 && (
            <div>
              <div className="rounded-[14px] px-5 py-5" style={CADRE}>
                <h2 className="flex items-center gap-2" style={LIBELLE_SECTION}>
                  <CalendarClock size={15} /> Sorties à venir
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {aVenir.map((ed) => (
                    <LigneSortie key={ed.id} edition={ed} />
                  ))}
                </ul>
                <p className="mt-4" style={{ fontSize: "12px", lineHeight: "18px", color: "var(--reel-muted)" }}>
                  Dates de parution relevées chez nos sources, sur les éditions qui en publient une.
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ---- Colonne centrale : le fil ---- */}
        {/* Le fil est borné à 620 px : au-delà, une carte d'activité s'étire sur
            toute la largeur pour trois lignes de texte, et le rail montre des
            jaquettes plus grandes que sur la fiche film. */}
        <main className="min-w-0 flex-1 lg:max-w-[620px]">
          {/*
            Le rail garde sa place pendant la lecture, avec des cartes muettes.
            Le faire apparaître d'un coup poussait tout le fil vers le bas une
            fois la requête revenue, et le clic partait sur la mauvaise ligne.
          */}
          {dernieres === null && (
            <section aria-hidden>
              <h2 style={LIBELLE_SECTION}>Dernières parutions</h2>
              <div className="mt-4 flex gap-3 overflow-hidden">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="w-[104px] shrink-0 sm:w-[124px]">
                    <div
                      className="reel-attente w-full rounded-[10px]"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                    <div className="reel-attente mt-2 h-3 w-4/5 rounded" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {dernieres !== null && dernieres.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 style={LIBELLE_SECTION}>Dernières parutions</h2>
                <Link
                  to="/catalogue"
                  className="shrink-0 transition hover:brightness-125"
                  style={{ fontSize: "14px", color: "var(--reel-accent-clair)" }}
                >
                  Tout le catalogue
                </Link>
              </div>
              <RailHorizontal ariaLabel="Dernières parutions">
                {dernieres.map((ed) => (
                  <CarteEdition key={ed.id} edition={ed} />
                ))}
              </RailHorizontal>
            </section>
          )}

          <section className="pt-12">
            <h2 style={LIBELLE_SECTION}>Votre activité</h2>
            {activite === null ? (
              <ul className="mt-4 flex flex-col gap-2" aria-hidden>
                {Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[12px] px-3 py-3" style={CADRE}>
                    <div className="reel-attente h-[54px] w-[36px] shrink-0 rounded-[6px]" />
                    <div className="min-w-0 flex-1">
                      <div className="reel-attente h-3.5 w-2/5 rounded" />
                      <div className="reel-attente mt-2 h-3 w-1/4 rounded" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : activite.length === 0 ? (
              <div className="mt-4 rounded-[12px] px-5 py-6" style={CADRE}>
                <p style={{ fontSize: "15px", lineHeight: "23px", color: "var(--reel-muted)" }}>
                  Rien encore. Ouvrez une fiche film et marquez une édition comme possédée ou
                  souhaitée : elle apparaîtra ici.
                </p>
                <Link
                  to="/catalogue"
                  className="mt-4 inline-flex items-center gap-1.5"
                  style={{ fontSize: "15px", color: "var(--reel-accent-clair)" }}
                >
                  Parcourir le catalogue <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {activite.map((ligne) => (
                  <LigneActivite key={`${ligne.editionId}-${ligne.creeLe}`} ligne={ligne} />
                ))}
              </ul>
            )}
          </section>
        </main>

      </div>
    </div>
  );
}

/**
 * Ce que vaudrait la collection d'occasion, sur demande.
 *
 * **Elle est ici et plus dans `/account`**, parce que c'est ici qu'on regarde
 * sa collection. Elle y était par accident d'écriture : `/account` est l'écran
 * des réglages, on y va changer son pseudonyme ou effacer son compte, pas
 * contempler un chiffre. Le §8 impose seulement qu'elle ne paraisse **jamais**
 * sur `/u/<@>`, et l'accueil connecté remplit cette condition : il ne se rend
 * qu'avec une session, il est en `noindex`, et `public/avant-montage.js` retire
 * le corps injecté aux visiteurs connectés, donc aucun robot ne le voit.
 *
 * **Un bouton et non un chiffre posé au chargement.** Un compte de mille
 * éditions coûte cinq requêtes par lots de deux cents, et la page en fait déjà
 * quatre. C'est la règle du §8 prise par l'autre bout : ce qui se décide au
 * premier rendu doit se décider sans réseau, donc ce qui demande le réseau ne
 * se décide pas au premier rendu.
 *
 * Ce que le montant veut dire, et ce qu'il ne veut pas dire, est dans
 * `lib/valeur.ts`. Ce qui compte à l'écran : le dénominateur est collé au
 * total, jamais renvoyé à une note plus bas.
 */
function EncartValeur() {
  const [etat, setEtat] = useState<"repos" | "calcul" | "fait" | "panne">("repos");
  const [valeur, setValeur] = useState<ValeurCollection | null>(null);

  async function estimer() {
    setEtat("calcul");
    try {
      setValeur(await valeurCollection());
      setEtat("fait");
    } catch {
      setEtat("panne");
    }
  }

  const chiffre = etat === "fait" && valeur && valeur.estimees > 0 ? valeur : null;

  return (
    <div
      className="rounded-[10px] p-[13px]"
      style={{ backgroundColor: "var(--reel-surface-2)", border: "1px solid var(--reel-border)" }}
    >
      <p className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <Wallet size={16} /> Valeur estimée
      </p>

      <p
        className="tabular-nums pt-1"
        style={{
          fontSize: "24px",
          fontWeight: 700,
          lineHeight: "26.4px",
          color: chiffre ? "var(--reel-text)" : "var(--reel-muted)",
        }}
      >
        {chiffre ? formaterEuros(chiffre.total) : "—"}
      </p>

      {chiffre ? (
        <>
          {/* Le dénominateur est collé au total, jamais dans une note plus bas :
              1 618 éditions du catalogue portent un prix d'occasion sur 23 803,
              donc un montant seul laisserait croire à une couverture qu'on n'a
              pas. C'est la règle du §4, un taux se lit avec ce qui le divise. */}
          <p className="pt-0.5" style={{ fontSize: "12px", lineHeight: "17px", color: "var(--reel-muted)" }}>
            prix d’occasion connu sur {chiffre.estimees} des {chiffre.possedees}
          </p>
          <p className="pt-2" style={{ fontSize: "12px", lineHeight: "17px", color: "var(--reel-muted)" }}>
            {/* Trois limites, écrites parce qu'elles sont le sujet (§10), et la
                date du relevé le plus ancien, pas la plus fraîche : c'est elle
                qui dit ce que vaut l'estimation. */}
            Un plancher, pas une cote : au moins cher des exemplaires en vente chez{" "}
            {chiffre.marchands.join(", ")}, relevés au plus tard le{" "}
            {new Date(chiffre.releveLePlusAncien ?? "").toLocaleDateString("fr-FR")}. Un revendeur
            vous en donnerait bien moins. Rien n’est publié sur votre page.
          </p>
        </>
      ) : (
        <>
          <p className="pt-0.5" style={{ fontSize: "12px", lineHeight: "17px", color: "var(--reel-muted)" }}>
            {etat === "panne"
              ? "Le calcul a échoué."
              : etat === "fait" && valeur?.possedees === 0
              ? "Votre collection est vide."
              : etat === "fait"
              ? `aucun prix d’occasion connu sur vos ${valeur?.possedees}`
              : "ce que coûterait leur rachat d’occasion"}
          </p>
          {etat !== "fait" && (
            <button
              type="button"
              onClick={() => { void estimer(); }}
              disabled={etat === "calcul"}
              className="mt-2.5 w-full rounded-full px-3 py-1.5 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] disabled:opacity-60"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "var(--reel-accent)",
                color: "#ffffff",
                border: "1px solid var(--reel-accent)",
              }}
            >
              {etat === "calcul" ? "Calcul…" : etat === "panne" ? "Réessayer" : "Estimer"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Une tuile de statistique : icône et libellé sur une ligne, valeur dessous.
 * Cadre, rayon et rembourrage repris du node Figma 1:572.
 */
function Tuile({
  icone: Icone,
  libelle,
  valeur,
  note,
}: {
  icone: typeof Library;
  libelle: string;
  valeur: string;
  note?: string;
}) {
  return (
    <div
      className="rounded-[10px] p-[13px]"
      style={{ backgroundColor: "var(--reel-surface-2)", border: "1px solid var(--reel-border)" }}
    >
      <p className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <Icone size={16} /> {libelle}
      </p>
      <p
        className="pt-1"
        style={{ fontSize: "24px", fontWeight: 700, lineHeight: "26.4px", color: "var(--reel-text)" }}
      >
        {valeur}
      </p>
      {note && (
        <p className="pt-0.5" style={{ fontSize: "12px", lineHeight: "17px", color: "var(--reel-muted)" }}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * Un lien de la colonne : icône et libellé, rien de plus.
 *
 * **Aucun état actif**, alors que la maquette en montre un sur « My
 * Collection » : le fond bleu se lisait comme « vous êtes sur cette page »,
 * alors qu'on est sur le tableau de bord et que le lien mène ailleurs. Un état
 * actif ne se pose que sur une navigation qui reflète l'écran courant, comme
 * celle du bandeau.
 */
function LienPanneau({
  to,
  icone: Icone,
  children,
}: {
  to: string;
  icone: typeof Library;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[8px] px-3 py-2 transition hover:bg-[var(--reel-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{ fontSize: "15px", fontWeight: 500, color: "var(--reel-text)" }}
    >
      <Icone size={18} />
      {children}
    </Link>
  );
}

function LigneActivite({ ligne }: { ligne: ActiviteLigne }) {
  const lien = lienFilm(ligne.film);
  const visuel = ligne.imageUrl ?? ligne.film?.affiche_url ?? "";

  const corps = (
    <div className="flex items-center gap-3 rounded-[12px] px-3 py-3" style={CADRE}>
      <div
        className="h-[54px] w-[36px] shrink-0 overflow-hidden rounded-[6px]"
        style={{ backgroundColor: "var(--reel-surface-2)" }}
      >
        <ImageWithFallback src={visuel} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {ligne.statut === "possede" ? "Ajouté à votre collection" : "Ajouté à vos envies"}
          {" · "}
          {dateRelative(ligne.creeLe)}
        </p>
        <p className="truncate" style={{ fontSize: "15px", fontWeight: 600, color: "var(--reel-text)" }}>
          {ligne.film?.titre ?? ligne.titre ?? "Édition"}
        </p>
        {ligne.titre && ligne.film?.titre && (
          <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
            {ligne.titre}
          </p>
        )}
      </div>
    </div>
  );

  return <li>{lien ? <Link to={lien} className="block">{corps}</Link> : corps}</li>;
}

function LigneSortie({ edition }: { edition: EditionWithFilm }) {
  const lien = lienFilm(edition.film);
  const visuel = edition.image_url ?? edition.film?.affiche_url ?? "";

  const corps = (
    <div className="flex items-center gap-3">
      <div
        className="h-[54px] w-[36px] shrink-0 overflow-hidden rounded-[6px]"
        style={{ backgroundColor: "var(--reel-surface-2)" }}
      >
        <ImageWithFallback src={visuel} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
          {edition.film?.titre ?? edition.titre}
        </p>
        <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          {formaterDate(edition.date_parution)}
        </p>
      </div>
    </div>
  );

  return <li>{lien ? <Link to={lien} className="block transition hover:brightness-125">{corps}</Link> : corps}</li>;
}

function formaterDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** « il y a 3 jours ». Les dates absolues n'apprennent rien sur un fil. */
function dateRelative(iso: string): string {
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) return "aujourd’hui";
  if (jours === 1) return "hier";
  if (jours < 31) return `il y a ${jours} jours`;
  const mois = Math.floor(jours / 30);
  return mois === 1 ? "il y a un mois" : `il y a ${mois} mois`;
}
