import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Library, Bookmark, Wallet, CalendarClock, ArrowRight } from "lucide-react";
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
    <div className="reel-gouttiere-large w-full pb-24 pt-[100px] md:pb-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ---- Colonne de gauche : qui vous êtes, et ce que vous avez ---- */}
        <aside className="w-full shrink-0 lg:sticky lg:top-[92px] lg:w-[268px]">
          <div className="rounded-[14px] px-5 py-5" style={CADRE}>
            <div className="flex items-center gap-3">
              <UserAvatar name={nomAffiche(session ?? null)} size={44} />
              <div className="min-w-0">
                <p className="truncate" style={{ fontSize: "16px", fontWeight: 600, color: "var(--reel-text)" }}>
                  {nomAffiche(session ?? null)}
                </p>
                <p className="truncate" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
                  {session?.user.email}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Metrique
                icone={Library}
                libelle="Éditions possédées"
                valeur={resume ? String(resume.possedees) : "—"}
              />
              <Metrique
                icone={Bookmark}
                libelle="Envies"
                valeur={resume ? String(resume.envies) : "—"}
              />
              {/*
                La valeur est une estimation par le prix conseillé, jamais une
                cote : aucune source de prix du marché n'existe (§8). La
                couverture est donc affichée avec le montant, sinon un total qui
                ignore les éditions sans prix se lit comme une valeur réelle.
              */}
              <Metrique
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

            <div className="mt-5 flex flex-col gap-2">
              <BoutonPanneau to="/profile" icone={Library}>Ma collection</BoutonPanneau>
              <BoutonPanneau to="/profile?liste=envies" icone={Bookmark}>Mes envies</BoutonPanneau>
            </div>
          </div>
        </aside>

        {/* ---- Colonne centrale : le fil ---- */}
        <main className="min-w-0 flex-1">
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

        {/* ---- Colonne de droite : ce qui arrive ----

            Deux conditions, et elles ne disent pas la même chose. Le panneau
            **disparaît** quand la liste est vide, plutôt que d'afficher un cadre
            creux : `date_parution` ne vient que de blu-ray.com, les autres
            sources ne datent rien, donc la liste peut se tarir sans prévenir.
            Mesuré le 3 août 2026 : 42 éditions à venir, jusqu'à début octobre.

            Il est par ailleurs **caché entre `lg` et `xl`**, tout en restant
            visible en pile sur téléphone : à 1 024 px la gouttière ne laisse que
            840 px, dont 268 pour la colonne de gauche, et une troisième colonne
            réduirait le fil à moins de deux cents pixels. */}
        {aVenir.length > 0 && (
          <aside className="w-full shrink-0 lg:hidden xl:sticky xl:top-[92px] xl:block xl:w-[288px]">
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
          </aside>
        )}
      </div>
    </div>
  );
}

/** Une tuile de la colonne de gauche : icône, libellé, valeur, mention. */
function Metrique({
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
    <div className="rounded-[10px] px-4 py-3" style={{ backgroundColor: "var(--reel-surface-2)" }}>
      <p className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
        <Icone size={14} /> {libelle}
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "26px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--reel-text)",
        }}
      >
        {valeur}
      </p>
      {note && (
        <p style={{ fontSize: "12px", lineHeight: "17px", color: "var(--reel-muted)" }}>{note}</p>
      )}
    </div>
  );
}

function BoutonPanneau({
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
      className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: "var(--reel-accent-soft)",
        border: "1px solid var(--reel-border)",
        fontSize: "15px",
        fontWeight: 600,
        color: "var(--reel-text)",
      }}
    >
      <Icone size={16} color="var(--reel-accent-clair)" />
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
