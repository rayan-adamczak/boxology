import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { BoutonPartage, ONGLETS, VueProfil, grouper, type Entree } from "../components/VueProfil";
import { IntrouvablePage } from "./IntrouvablePage";
import { arobase, cheminProfil, normaliserIdentifiant } from "../lib/identifiant";
import { editionsDuProfil, profilPublic, type ProfilPublic } from "../lib/profils";
import { getEditionsByIds, type StatutValue } from "../lib/reelio-db";
import { useSeo } from "../lib/seo";

/**
 * `/u/<identifiant>` : l'étagère de quelqu'un, lisible sans compte.
 *
 * C'est l'adresse qu'on partage, donc **une porte d'entrée depuis l'extérieur,
 * donc un chemin de consultation** : la page est importée dans le bundle
 * initial et non en `lazy()`. Le §9 en garde deux exemples, les pages de
 * regroupement et `/welcome`, où un morceau demandé pendant la propagation
 * d'un déploiement rendait un écran vide. Un lien partagé est précisément ce
 * qu'on ouvre une fois, sans y revenir : un écran vide n'a pas de seconde
 * chance.
 *
 * Rien ici ne passe par une session. Les listes viennent de
 * `editions_du_profil`, en clé anon, et les éditions du catalogue public : un
 * visiteur connecté et un visiteur de passage voient exactement la même chose.
 *
 * **En `noindex, follow`.** Un profil est une grille d'affiches déjà servies
 * par les fiches films : mince et redondant, c'est-à-dire ce que le §7 a
 * refusé aux pages éditions, pour la même raison. Partageable n'est pas
 * indexable, et les liens vers les fiches doivent rester suivis. À rouvrir le
 * jour où un profil porte quelque chose qui n'existe nulle part ailleurs, une
 * note, un classement, un texte.
 */

type Etat =
  | { statut: "attente" }
  | { statut: "introuvable" }
  | { statut: "erreur"; message: string }
  | { statut: "pret"; profil: ProfilPublic; parStatut: Record<StatutValue, Entree[]> };

export function ProfilPublicPage() {
  const { identifiant = "" } = useParams();
  const [etat, setEtat] = useState<Etat>({ statut: "attente" });
  const [statut, setStatut] = useState<StatutValue>("possede");

  /*
    Une adresse en majuscules ou avec un signe interdit désigne au mieux le
    même profil, au pire aucun : on la ramène à sa forme canonique par une
    redirection plutôt que d'interroger la base avec, sinon `/u/Rayan` et
    `/u/rayan` seraient deux adresses pour la même page.
  */
  const canonique = normaliserIdentifiant(identifiant);

  useEffect(() => {
    if (!canonique || canonique !== identifiant) return;

    let annule = false;
    setEtat({ statut: "attente" });

    (async () => {
      try {
        const profil = await profilPublic(canonique);
        if (annule) return;
        if (!profil) { setEtat({ statut: "introuvable" }); return; }

        const listes = await Promise.all(
          ONGLETS.map(async ({ statut: s }) => {
            const ids = await editionsDuProfil(canonique, s);
            const editions = await getEditionsByIds(ids);
            // `editions_du_profil` rend du plus récent au plus ancien, mais
            // `getEditionsByIds` ne garantit aucun ordre : sans ce rang, le tri
            // « ajout récent » ne voudrait rien dire.
            const rang = new Map(ids.map((id, i) => [id, i]));
            editions.sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
            return [s, grouper(editions)] as const;
          }),
        );
        if (!annule) {
          setEtat({
            statut: "pret",
            profil,
            parStatut: Object.fromEntries(listes) as Record<StatutValue, Entree[]>,
          });
        }
      } catch (e) {
        if (!annule) {
          setEtat({ statut: "erreur", message: e instanceof Error ? e.message : "Erreur inconnue" });
        }
      }
    })();

    return () => { annule = true; };
  }, [canonique, identifiant]);

  const nom = etat.statut === "pret" ? etat.profil.nom : "";
  useSeo(
    etat.statut === "pret"
      ? {
          titre: `${nom} (${arobase(etat.profil.identifiant)})`,
          description: descriptionProfil(nom, etat.profil),
          noindex: true,
        }
      : null,
  );

  // Forme non canonique : une seule adresse par profil, `replace` pour que le
  // bouton retour ne ramène pas sur la forme fautive.
  if (canonique && canonique !== identifiant) {
    return <Navigate to={cheminProfil(canonique)} replace />;
  }
  // Une adresse dont il ne reste rien après normalisation ne désigne personne.
  if (!canonique) return <IntrouvablePage />;

  if (etat.statut === "attente") {
    return (
      <div className="reel-gouttiere pt-[88px]">
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
        </div>
      </div>
    );
  }

  /*
    Profil masqué et identifiant inconnu rendent le même écran, et c'est
    délibéré : les distinguer dirait quels comptes existent. La base répond
    déjà `null` dans les deux cas, cet écran ne fait que ne pas défaire ce
    choix.
  */
  if (etat.statut === "introuvable") return <IntrouvablePage />;

  if (etat.statut === "erreur") {
    return (
      <div className="reel-gouttiere pt-[88px]">
        <p className="py-20 text-center" style={{ fontSize: "15px", color: "#ef6b6b" }}>
          {etat.message}
        </p>
      </div>
    );
  }

  return (
    <VueProfil
      nom={etat.profil.nom}
      identifiant={etat.profil.identifiant}
      actions={<BoutonPartage identifiant={etat.profil.identifiant} />}
      parStatut={etat.parStatut}
      statut={statut}
      onStatut={setStatut}
      vide={{
        possede: "Aucune édition dans cette collection pour l’instant.",
        envie: "Aucune envie affichée pour l’instant.",
      }}
    />
  );
}

/**
 * La description de partage. Elle doit dire la même chose que celle du
 * middleware (`corpsProfil`), qui la sert aux aperçus de lien.
 */
function descriptionProfil(nom: string, profil: ProfilPublic): string {
  return (
    `La collection de ${nom} sur jaquette.app : ` +
    `${profil.possedees} édition${profil.possedees > 1 ? "s" : ""} possédée${profil.possedees > 1 ? "s" : ""}, ` +
    `${profil.envies} envie${profil.envies > 1 ? "s" : ""}.`
  );
}
