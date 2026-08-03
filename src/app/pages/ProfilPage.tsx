import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Loader2, Settings } from "lucide-react";
import { BoutonPartage, ONGLETS, VueProfil, grouper, type Entree } from "../components/VueProfil";
import { connexionGoogle, nomAffiche, useSession } from "../lib/auth";
import { idsParStatut } from "../lib/collections";
import { cheminProfil } from "../lib/identifiant";
import { useProfil } from "../lib/profils";
import { getEditionsByIds, type StatutValue } from "../lib/reelio-db";
import { useSeo } from "../lib/seo";

/**
 * Mon profil : la même étagère que celle qu'on partage, vue de l'intérieur.
 *
 * L'écran est rendu par `VueProfil`, partagé avec `ProfilPublicPage` : ce que
 * vous voyez ici est exactement ce que verra quelqu'un qui ouvre votre lien,
 * aux actions près. C'était la raison d'être de la séparation notée dans la
 * version précédente de ce fichier, elle sert enfin.
 *
 * Deux différences avec la page publique, et deux seulement :
 *
 *   - l'adresse électronique paraît sous le @, parce qu'on est chez soi. Elle
 *     n'est jamais rendue par `profil_public`, donc elle ne peut pas fuiter ;
 *   - les listes sont lues sous jeton de session, par la RLS de `collections`,
 *     et non par les fonctions publiques. Un profil masqué reste donc
 *     consultable par son propriétaire.
 *
 * La page est en `noindex` : c'est `/u/<identifiant>` qui est l'adresse
 * partageable, et deux adresses pour la même étagère seraient deux doublons.
 */

export function ProfilPage() {
  const session = useSession();
  const etatProfil = useProfil();
  const [parStatut, setParStatut] = useState<Record<StatutValue, Entree[]> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  // L'onglet vit dans l'URL : `/wishlist` y redirige, et une page remise en
  // favori rouvre la bonne.
  const [params, setParams] = useSearchParams();
  const statut: StatutValue = params.get("liste") === "envies" ? "envie" : "possede";
  const setStatut = (s: StatutValue) =>
    setParams(s === "envie" ? { liste: "envies" } : {}, { replace: true });

  useSeo({
    titre: "Mon profil",
    description: "Votre collection d’éditions physiques, regroupée par film.",
    noindex: true,
  });

  useEffect(() => {
    if (session === undefined) return;
    // Sans compte, `idsParStatut` rend du vide : inutile d'interroger le réseau.
    if (session === null) { setChargement(false); return; }

    let annule = false;
    setChargement(true);
    setErreur(null);

    (async () => {
      try {
        const listes = await Promise.all(
          ONGLETS.map(async ({ statut: s }) => {
            const ids = await idsParStatut(s);
            const editions = await getEditionsByIds(ids);
            // `idsParStatut` rend les identifiants du plus récent au plus
            // ancien, mais `getEditionsByIds` ne garantit aucun ordre : sans ce
            // rang, le tri « ajout récent » ne voudrait rien dire.
            const rang = new Map(ids.map((id, i) => [id, i]));
            editions.sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
            return [s, grouper(editions)] as const;
          }),
        );
        if (!annule) setParStatut(Object.fromEntries(listes) as Record<StatutValue, Entree[]>);
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!annule) setChargement(false);
      }
    })();

    return () => { annule = true; };
    // Voir FilmDetailPage : on suit l'identité, pas l'objet session, recréé à
    // chaque rafraîchissement de jeton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session === undefined, session?.user.id]);

  if (session === undefined || (chargement && session !== null)) {
    return (
      <Cadre>
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
        </div>
      </Cadre>
    );
  }

  if (erreur) {
    return (
      <Cadre>
        <p className="py-20 text-center" style={{ fontSize: "15px", color: "#ef6b6b" }}>{erreur}</p>
      </Cadre>
    );
  }

  if (session === null) return <Invitation />;

  const profil = etatProfil.statut === "pret" ? etatProfil.profil : null;

  return (
    <VueProfil
      nom={profil?.nom ?? nomAffiche(session)}
      identifiant={profil?.identifiant ?? null}
      sousTitre={session.user.email ?? ""}
      actions={
        profil && (
          <>
            {/* Le lien vers sa propre page publique n'est pas décoratif : c'est
                le seul moyen de voir ce que l'autre voit, notamment quand le
                profil est masqué et que la page répond alors comme un profil
                inexistant. */}
            {profil.visible && (
              <Link
                to={cheminProfil(profil.identifiant)}
                className="rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--reel-text)",
                  border: "1px solid var(--reel-border)",
                  backgroundColor: "var(--reel-surface)",
                }}
              >
                Ma page publique
              </Link>
            )}
            {profil.visible ? (
              <BoutonPartage identifiant={profil.identifiant} />
            ) : (
              <Link
                to="/account"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--reel-muted)",
                  border: "1px solid var(--reel-border)",
                }}
              >
                <Settings size={16} /> Profil masqué
              </Link>
            )}
          </>
        )
      }
      parStatut={parStatut ?? { possede: [], envie: [] }}
      statut={statut}
      onStatut={setStatut}
      vide={{
        possede: "Votre collection est vide. Ajoutez une édition depuis une fiche film.",
        envie: "Aucune envie pour l’instant.",
      }}
    />
  );
}

function Cadre({ children }: { children: React.ReactNode }) {
  return <div className="reel-gouttiere pt-[88px]">{children}</div>;
}

/**
 * Ce que voit un visiteur sans compte. On explique avant de demander : le
 * catalogue est ouvert, c'est seulement garder des listes qui demande un compte.
 */
function Invitation() {
  return (
    <Cadre>
      <div className="mx-auto max-w-[560px] py-20 text-center">
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--reel-text)" }}>
          Votre collection, gardée
        </h1>
        <p className="pt-3" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
          Marquez les éditions que vous possédez et celles qui vous font envie. Elles sont rattachées
          à votre compte : vous les retrouvez sur votre téléphone comme sur votre ordinateur, et
          elles survivent à un vidage du cache.
        </p>
        <p className="pt-3" style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
          Vous choisissez au passage votre identifiant, un « @ » qui vous donne une page à partager.
        </p>
        <button
          type="button"
          onClick={() => { void connexionGoogle("/profile"); }}
          className="mt-6 rounded-full px-4 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{
            fontSize: "15px",
            fontWeight: 600,
            backgroundColor: "var(--reel-accent)",
            color: "#ffffff",
            border: "1px solid var(--reel-accent)",
          }}
        >
          S’inscrire ou se connecter avec Google
        </button>
        <p className="pt-3" style={{ fontSize: "13px", color: "var(--reel-muted)" }}>
          Le catalogue reste consultable sans compte.
        </p>
      </div>
    </Cadre>
  );
}
