import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import { Loader2, Settings } from "lucide-react";
import { Link } from "react-router";
import { BoutonPartage, ONGLETS, VueProfil, grouper, type Entree } from "../components/VueProfil";
import { IntrouvablePage } from "./IntrouvablePage";
import { useSession } from "../lib/auth";
import { idsParStatut } from "../lib/collections";
import { arobase, cheminProfil, normaliserIdentifiant } from "../lib/identifiant";
import { editionsDuProfil, profilPublic, useProfil } from "../lib/profils";
import { getEditionsByIds, type StatutValue } from "../lib/reelio-db";
import { useSeo } from "../lib/seo";

/**
 * `/u/<identifiant>` : **la** page de profil. Il n'y en a pas d'autre.
 *
 * Une personne, une adresse. Ce que vous regardez chez vous est littéralement
 * la page que vous partagez, au même endroit, avec le même slug : `/profile`
 * n'est plus qu'une forme courte qui redirige ici, comme `/movies/560`
 * redirige vers l'adresse à slug (§7). Deux adresses pour la même étagère,
 * c'étaient deux doublons et deux occasions de diverger.
 *
 * C'est une porte d'entrée depuis l'extérieur, donc un chemin de consultation :
 * la page est dans le bundle initial et non en `lazy()`. Le §9 en garde deux
 * exemples, les pages de regroupement et `/welcome`, où un morceau demandé
 * pendant la propagation d'un déploiement rendait un écran vide. Un lien
 * partagé s'ouvre une fois, sans seconde chance.
 *
 * **Deux chemins de lecture, choisis sur une seule question : est-ce le
 * mien ?**
 *
 *   - non : `profil_public` et `editions_du_profil`, en clé anon. Un visiteur
 *     connecté et un visiteur de passage voient exactement la même chose ;
 *   - oui : `collections` sous jeton de session. C'est ce qui fait qu'un profil
 *     **masqué reste consultable par son propriétaire** à la même adresse,
 *     alors que les fonctions publiques répondent `null` pour tout le monde.
 *     Sans ça, masquer sa page reviendrait à se la fermer à soi-même.
 *
 * **En `noindex, follow`.** Un profil est une grille d'affiches déjà servies
 * par les fiches films : mince et redondant, c'est-à-dire ce que le §7 a refusé
 * aux pages éditions, pour la même raison. Partageable n'est pas indexable, et
 * les liens vers les fiches doivent rester suivis.
 */

type Etat =
  | { statut: "attente" }
  | { statut: "introuvable" }
  | { statut: "erreur"; message: string }
  | {
      statut: "pret";
      nom: string;
      identifiant: string;
      parStatut: Record<StatutValue, Entree[]>;
    };

export function ProfilPublicPage() {
  const { identifiant = "" } = useParams();
  const session = useSession();
  const etatProfil = useProfil();
  const [etat, setEtat] = useState<Etat>({ statut: "attente" });

  /*
    L'onglet vit dans l'URL, comme avant sur `/profile` : une envie partagée
    doit s'ouvrir sur les envies, et `/wishlist` continue d'y mener.
  */
  const [params, setParams] = useSearchParams();
  const statut: StatutValue = params.get("liste") === "envies" ? "envie" : "possede";
  const setStatut = (s: StatutValue) =>
    setParams(s === "envie" ? { liste: "envies" } : {}, { replace: true });

  /*
    Une adresse en majuscules ou ponctuée désigne au mieux le même profil : on
    la ramène à sa forme canonique par une redirection plutôt que d'interroger
    la base avec, sinon `/u/Rayan` et `/u/rayan` seraient deux adresses pour la
    même page. Le middleware fait la même 301 en production ; cette route sert
    au serveur de développement, où il ne tourne pas.
  */
  const canonique = normaliserIdentifiant(identifiant);

  const monProfil = etatProfil.statut === "pret" ? etatProfil.profil : null;
  const cestMoi = monProfil !== null && monProfil.identifiant === canonique;

  useEffect(() => {
    if (!canonique || canonique !== identifiant) return;
    // Tant que la session n'est pas tranchée, on ne sait pas encore par quel
    // chemin lire : attendre coûte un instant, se tromper coûte un 404 sur son
    // propre profil masqué.
    if (session === undefined || etatProfil.statut === "attente") return;

    let annule = false;
    setEtat({ statut: "attente" });

    (async () => {
      try {
        const nom = cestMoi ? monProfil.nom : (await profilPublic(canonique))?.nom ?? null;
        if (annule) return;
        if (nom === null) { setEtat({ statut: "introuvable" }); return; }

        const listes = await Promise.all(
          ONGLETS.map(async ({ statut: s }) => {
            const ids = cestMoi ? await idsParStatut(s) : await editionsDuProfil(canonique, s);
            const editions = await getEditionsByIds(ids);
            // Les deux sources rendent du plus récent au plus ancien, mais
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
            nom,
            identifiant: canonique,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonique, identifiant, cestMoi, session === undefined, etatProfil.statut]);

  useSeo(
    etat.statut === "pret"
      ? {
          titre: `${etat.nom} (${arobase(etat.identifiant)})`,
          description: descriptionProfil(etat.nom, etat.parStatut),
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
    choix. Le propriétaire, lui, ne passe pas par là : il lit sous session.
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
      nom={etat.nom}
      identifiant={etat.identifiant}
      // L'adresse électronique n'apparaît nulle part, pas même chez soi : la
      // page est la même pour tout le monde, et une ligne qui n'existe que
      // pour son propriétaire serait la première divergence.
      actions={
        cestMoi ? (
          <>
            {monProfil.visible ? (
              <BoutonPartage identifiant={etat.identifiant} />
            ) : (
              <span
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--reel-muted)",
                  border: "1px solid var(--reel-border)",
                }}
              >
                Page masquée
              </span>
            )}
            <Link
              to="/account"
              aria-label="Réglages du profil"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--reel-text)",
                border: "1px solid var(--reel-border)",
                backgroundColor: "var(--reel-surface)",
              }}
            >
              <Settings size={16} /> Modifier
            </Link>
          </>
        ) : (
          <BoutonPartage identifiant={etat.identifiant} />
        )
      }
      parStatut={etat.parStatut}
      statut={statut}
      onStatut={setStatut}
      vide={
        cestMoi
          ? {
              possede: "Votre collection est vide. Ajoutez une édition depuis une fiche film.",
              envie: "Aucune envie pour l’instant.",
            }
          : {
              possede: "Aucune édition dans cette collection pour l’instant.",
              envie: "Aucune envie affichée pour l’instant.",
            }
      }
    />
  );
}

/**
 * La description de partage. Comptée sur les listes chargées et non sur les
 * compteurs de `profil_public` : c'est la même mesure pour le propriétaire,
 * qui ne passe pas par cette fonction, et pour un visiteur.
 *
 * Elle doit dire la même chose que celle du middleware (`servirProfil`), qui la
 * sert aux aperçus de lien.
 */
function descriptionProfil(nom: string, parStatut: Record<StatutValue, Entree[]>): string {
  const compter = (s: StatutValue) =>
    (parStatut[s] ?? []).reduce((n, e) => n + e.editions.length, 0);
  const possedees = compter("possede");
  const envies = compter("envie");
  return (
    `La collection de ${nom} sur jaquette.app : ` +
    `${possedees} édition${possedees > 1 ? "s" : ""} possédée${possedees > 1 ? "s" : ""}, ` +
    `${envies} envie${envies > 1 ? "s" : ""}.`
  );
}
