import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Library, Bookmark, Wallet, CalendarClock, ArrowRight, ListPlus, Settings, Share2 } from "lucide-react";
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
  const [resume, setResume] = useState<ResumeCollection | null>(null);
  const [activite, setActivite] = useState<ActiviteLigne[]>([]);
  const [dernieres, setDernieres] = useState<EditionWithFilm[]>([]);
  const [aVenir, setAVenir] = useState<EditionWithFilm[]>([]);

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
    getActiviteRecente(10)
      .then((a) => { if (!annule) setActivite(a); })
      .catch(() => {});
    getDernieresEditions(18)
      .then((e) => { if (!annule) setDernieres(e); })
      .catch(() => {});
    getSortiesAVenir(6)
      .then((e) => { if (!annule) setAVenir(e); })
      .catch(() => {});

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
            {/*
              La valeur est une estimation par le prix conseillé, jamais une
              cote : aucune source de prix du marché n'existe (§8). La couverture
              est donc écrite sous le montant, seule ligne ajoutée à la maquette,
              sans quoi un total qui ignore les éditions sans prix se lirait comme
              une valeur réelle.
            */}
            <Tuile
              icone={Wallet}
              libelle="Valeur estimée"
              valeur={resume ? formaterEuros(resume.valeur) : "—"}
              note={
                resume && resume.possedees > 0
                  ? `prix éditeur connu sur ${resume.valorisees} des ${resume.possedees}`
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <LienPanneau to="/profile" icone={Library}>Ma collection</LienPanneau>
            <LienPanneau to="/profile?liste=envies" icone={Bookmark}>Mes envies</LienPanneau>
            {/* Le lien de partage n'apparaît que si la page est réellement
                servie : proposer de partager une adresse qui répond 404 serait
                pire que ne rien proposer. */}
            {profil?.visible && (
              <LienPanneau to={cheminProfil(profil.identifiant)} icone={Share2}>
                Ma page publique
              </LienPanneau>
            )}
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
  {aVenir.length > 0 && (
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
          {dernieres.length > 0 && (
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
            {activite.length === 0 ? (
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

/** `1 245,50 €`, sans décimale au-delà de mille : on donne un ordre de grandeur. */
function formaterEuros(montant: number): string {
  return montant.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: montant >= 1000 ? 0 : 2,
  });
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
