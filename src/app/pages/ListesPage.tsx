import { Link } from "react-router";
import { ListPlus, Share2, Filter, ArrowRight } from "lucide-react";
import { PageStatique } from "../components/PageStatique";

/**
 * Page Listes, annoncée le 3 août 2026, fonction non écrite.
 *
 * Une entrée de bandeau qui mène à une page vide se lit comme une panne. Celle
 * -ci dit donc ce que la fonction fera et ce qu'elle ne fera pas, et renvoie
 * vers ce qui existe déjà, collection et envies.
 *
 * **En `noindex`** : c'est une promesse, pas du contenu. Le §7 écarte déjà les
 * pages minces pour cette raison, et une page qui annonce une fonctionnalité
 * absente est le cas d'école.
 */
const CE_QUI_ARRIVE = [
  {
    icone: ListPlus,
    titre: "Des listes à vous",
    texte:
      "« Mes steelbooks Marvel », « À revendre », « Cadeaux de Noël ». Une édition peut appartenir à plusieurs listes, et une liste peut mêler films et coffrets.",
  },
  {
    icone: Filter,
    titre: "Construites depuis le catalogue",
    texte:
      "Ajout depuis une fiche film comme pour la collection, et depuis les pages de format ou d'éditeur, pour composer une liste sans la saisir à la main.",
  },
  {
    icone: Share2,
    titre: "Partageables, si vous le voulez",
    texte:
      "Une adresse publique par liste, à envoyer avant un achat groupé ou une bourse aux disques. Privé par défaut : rien ne devient public sans un geste.",
  },
];

export function ListesPage() {
  return (
    <PageStatique
      titre="Listes"
      sousTitre="Fonctionnalité en préparation"
      description="Les listes personnelles arrivent sur jaquette.app : regrouper vos éditions par thème, les composer depuis le catalogue, les partager."
      noindex
    >
      <p style={{ fontSize: "17px", lineHeight: "27px", color: "var(--reel-text)" }}>
        Les listes ne sont pas encore ouvertes. Voici ce qu’elles feront, pour que l’entrée du menu
        ne soit pas une promesse en l’air.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {CE_QUI_ARRIVE.map(({ icone: Icone, titre, texte }) => (
          <div
            key={titre}
            className="rounded-[12px] px-5 py-5"
            style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
          >
            <Icone size={22} color="var(--reel-accent-clair)" strokeWidth={2} />
            <h2 className="mt-3" style={{ fontSize: "17px", fontWeight: 600, color: "var(--reel-text)" }}>
              {titre}
            </h2>
            <p className="mt-1.5" style={{ fontSize: "15px", lineHeight: "23px", color: "var(--reel-muted)" }}>
              {texte}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
        En attendant, deux listes existent déjà et sont tenues automatiquement : ce que vous possédez
        et ce que vous cherchez.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Lien to="/profile">Ma collection</Lien>
        <Lien to="/profile?liste=envies">Mes envies</Lien>
      </div>
    </PageStatique>
  );
}

function Lien({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        backgroundColor: "var(--reel-surface-2)",
        border: "1px solid var(--reel-border)",
        fontSize: "15px",
        color: "var(--reel-text)",
      }}
    >
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
