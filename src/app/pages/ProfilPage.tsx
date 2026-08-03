import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { connexionGoogle } from "../lib/auth";
import { cheminProfil } from "../lib/identifiant";
import { rafraichirProfil, useProfil } from "../lib/profils";
import { useSeo } from "../lib/seo";

/**
 * `/profile` : une forme courte, plus une page.
 *
 * Le profil a **une seule adresse**, `/u/<identifiant>`, la même pour son
 * propriétaire et pour qui reçoit le lien. Cette route redirige, exactement
 * comme `/movies/560` redirige vers la forme à slug (§7) : les liens déjà
 * posés dans le bandeau, le pied de page, la barre mobile et `/welcome`
 * continuent de fonctionner, au prix d'un saut, et ils arrivent tous sur
 * l'adresse canonique.
 *
 * Elle garde la chaîne de recherche, qui porte `?liste=envies` : c'est par
 * elle que `/wishlist` et `/mes-envies` ouvrent le bon onglet.
 *
 * Ce qui reste ici, et qui n'a pas d'autre endroit où vivre : l'écran
 * d'invitation d'un visiteur sans compte. Il n'a pas d'identifiant, donc pas
 * d'adresse de profil, donc rien vers quoi rediriger.
 */
export function ProfilPage() {
  const etat = useProfil();
  const { search } = useLocation();

  useSeo({
    titre: "Mon profil",
    description: "Votre collection d’éditions physiques, regroupée par film.",
    noindex: true,
  });

  if (etat.statut === "pret") {
    return <Navigate to={`${cheminProfil(etat.profil.identifiant)}${search}`} replace />;
  }

  if (etat.statut === "anonyme") return <Invitation />;

  /*
    « Profil absent » : le garde-fou du `Layout` occupe déjà l'écran avec le
    choix de l'identifiant. On n'affiche donc rien de plus qu'une attente, le
    temps que le montage se fasse.
  */
  if (etat.statut === "erreur") return <Panne />;

  return (
    <Cadre>
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin" color="var(--reel-muted)" />
      </div>
    </Cadre>
  );
}

function Cadre({ children }: { children: React.ReactNode }) {
  return <div className="reel-gouttiere pt-[88px]">{children}</div>;
}

/**
 * Le profil n'a pas pu être lu, donc on ne sait pas vers quelle adresse
 * envoyer. On le dit et on propose de retenter, plutôt que de laisser une
 * attente qui ne finira jamais.
 */
function Panne() {
  return (
    <Cadre>
      <div className="mx-auto max-w-[460px] py-20 text-center">
        <p style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}>
          Votre profil n’a pas pu être chargé. Le catalogue, lui, reste consultable.
        </p>
        <button
          type="button"
          onClick={() => { void rafraichirProfil(); }}
          className="mt-5 rounded-full px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
          style={{
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: "var(--reel-surface-2)",
            color: "var(--reel-text)",
            border: "1px solid var(--reel-border)",
          }}
        >
          Réessayer
        </button>
      </div>
    </Cadre>
  );
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
          Vous choisissez au passage votre identifiant, un « @ » qui donne son adresse à votre page,
          celle que vous partagez.
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
