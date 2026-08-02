import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Settings, LogOut, Bookmark, Library, User as UserIcon } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { Logo } from "./Logo";
import { connexionGoogle, deconnexion, nomAffiche, useSession } from "../lib/auth";

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useSession();

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center"
      style={{
        height: 72,
        backgroundColor: "var(--reel-bg)",
        borderBottom: "1px solid var(--reel-border)",
      }}
    >
      <div className="reel-gouttiere flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Accueil jaquette.app"
        >
          {/* Le mot-symbole reste visible à toute taille : c'est lui qui porte
              l'identité sur petit écran, où le nom écrit peut céder la place. */}
          {/* 21 px, soit l'encre du « j » du mot mesurée à côté (20,06 px à
              21 px de corps) : c'est la même lettre répétée, donc toute autre
              hauteur se lit comme une faute d'échelle. À 26 px le mot-symbole
              dépassait le mot de 30 %. */}
          <Logo hauteur={21} />
          <span
            /* 21 px et non 18 : à 18, la hauteur d'x du mot tombait bien sous
               les 26 px du mot-symbole, qui prenait le dessus. Le pied de page
               reste à 18, il n'a pas de bandeau à équilibrer. */
            style={{ fontFamily: "var(--reel-font-titre)", fontSize: "21px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--reel-text)" }}
          >
            jaquette.app
          </span>
        </Link>

        {/*
          Pas de champ de recherche ici : la page d'accueil porte déjà le sien,
          branché sur `searchFilms`. En doubler un dans le bandeau donnait deux
          entrées côte à côte sur `/`, dont une qui ne cherchait rien.
        */}

        {/* Right cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {/*
            Trois états, pas deux : tant que la session n'est pas résolue on
            n'affiche rien à cet endroit, sinon un visiteur déjà connecté verrait
            « Connexion » clignoter à chaque chargement de page.
          */}
          {session === undefined && <div style={{ width: 56, height: 34 }} aria-hidden="true" />}

          {session === null && (
            <button
              type="button"
              onClick={() => { void connexionGoogle(); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "var(--reel-accent)",
                color: "#ffffff",
                border: "1px solid var(--reel-accent)",
              }}
            >
              Connexion
            </button>
          )}

          {session && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu du compte"
              className="flex items-center gap-1 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
            >
              <UserAvatar name={nomAffiche(session)} size={34} />
              <ChevronDown size={16} color="var(--reel-muted)" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[10px] py-1 shadow-xl"
                  style={{
                    backgroundColor: "var(--reel-surface)",
                    border: "1px solid var(--reel-border)",
                  }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--reel-border)" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
                      {nomAffiche(session)}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--reel-muted)" }}>{session.user.email}</p>
                  </div>
                  <MenuItem icon={<UserIcon size={16} />} to="/profile">Mon profil</MenuItem>
                  <MenuItem icon={<Library size={16} />} to="/profile">Ma collection</MenuItem>
                  <MenuItem icon={<Bookmark size={16} />} to="/profile?liste=envies">Mes envies</MenuItem>
                  {/*
                    Vers `/compte`, qui porte la suppression du compte. La
                    politique de confidentialité annonce que l'effacement est
                    accessible dans les réglages : sans ce lien, la page n'était
                    atteignable que depuis cette politique.
                  */}
                  <MenuItem icon={<Settings size={16} />} to="/account">Mon compte</MenuItem>
                  <MenuItem
                    icon={<LogOut size={16} />}
                    onClick={() => { setMenuOpen(false); void deconnexion(); }}
                  >
                    Déconnexion
                  </MenuItem>
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  children,
  icon,
  to,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left outline-none transition hover:bg-[var(--reel-surface-2)]";
  const inner = (
    <>
      <span style={{ color: "var(--reel-muted)" }}>{icon}</span>
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} role="menuitem" className={className} style={{ fontSize: "14px", color: "var(--reel-text)" }}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={className}
      style={{ fontSize: "14px", color: "var(--reel-text)" }}
    >
      {inner}
    </button>
  );
}
