import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronDown, Settings, LogOut, Bookmark, Library, User as UserIcon, Bell, Search } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { Logo } from "./Logo";
import { ChampRecherche } from "./ChampRecherche";
import { FeuilleRecherche } from "./FeuilleRecherche";
import { apercuNom, connexionGoogle, deconnexion, nomAffiche, useSession } from "../lib/auth";
import { arobase, cheminProfil } from "../lib/identifiant";
import { useProfil } from "../lib/profils";
import { useApercuFilms } from "../lib/recherche-films";

/**
 * Bandeau, refait le 3 août 2026.
 *
 * Deux états, et ils ne diffèrent pas que par un bouton :
 *
 *   déconnecté   mot-symbole, recherche, Catalogue, Se connecter, S'inscrire
 *   connecté     mot-symbole, recherche, Catalogue, cloche, compte
 *
 * **La recherche est ici parce que l'accueil ne la porte plus toujours** :
 * connecté, l'accueil est un tableau de bord, et sans champ dans le bandeau il
 * n'y aurait plus aucune entrée de recherche à l'écran. Elle emmène vers
 * `/catalogue`, la page de parcours.
 *
 * Elle valide à **Entrée** et non à chaque frappe : naviguer à la volée
 * changerait de page sous les doigts, et la temporisation de la recherche
 * appartient à la page de destination, pas au bandeau.
 */
export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clocheOuverte, setClocheOuverte] = useState(false);
  const [saisie, setSaisie] = useState("");
  /** La recherche plein écran du téléphone, ouverte par la loupe. */
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  /*
    Le bandeau n'a pas de grille où poser ses résultats : il apporte donc sa
    propre recherche, là où l'accueil et /catalogue passent celle de leur page.
    Elle n'écrit rien dans l'URL, sans quoi chercher depuis une fiche film
    remplacerait l'adresse de la fiche pendant la frappe.
  */
  const apercu = useApercuFilms(saisie);
  const session = useSession();
  const etatProfil = useProfil();
  const profil = etatProfil.statut === "pret" ? etatProfil.profil : null;
  const lienProfil = profil ? cheminProfil(profil.identifiant) : "/profile";
  const navigate = useNavigate();
  const location = useLocation();

  // Le champ du bandeau se vide en changeant de page : il sert à partir, pas à
  // garder l'état d'une recherche, que l'URL de /catalogue porte déjà.
  useEffect(() => setSaisie(""), [location.pathname]);

  const chercher = (valeur: string) => {
    const terme = valeur.trim();
    navigate(terme ? `/catalogue?q=${encodeURIComponent(terme)}` : "/catalogue");
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center"
      style={{
        height: 72,
        backgroundColor: "var(--reel-bg)",
        borderBottom: "1px solid var(--reel-border)",
      }}
    >
      {/* Une seule gouttière pour tout le site, connecté ou non : deux largeurs
          selon la session faisaient sauter la page d'un état à l'autre, et le
          §8 rappelle que c'est précisément le décalage qu'elle existe pour
          supprimer. */}
      <div className="reel-gouttiere flex items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Accueil jaquette.app">
          {/* Le mot-symbole reste visible à toute taille : c'est lui qui porte
              l'identité sur petit écran, où le nom écrit cède la place. */}
          <Logo hauteur={24} />
          <span
            /* 27 px, et caché sous `sm` : à 375 px, le nom, la recherche et les
               actions ne tiennent pas ensemble, et c'est la marque qui cède
               puisque le mot-symbole reste. */
            className="hidden sm:inline"
            style={{
              fontFamily: "var(--reel-font-titre)",
              fontSize: "27px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--reel-text)",
            }}
          >
            jaquette.app
          </span>
        </Link>

        {/*
          Recherche **réservée aux comptes**, et centrée dans le bandeau.

          Déconnecté, elle n'y est pas : l'accueil porte déjà son grand champ,
          et les deux se répondaient en double sur la page d'entrée du site.
          Connecté, l'accueil est le tableau de bord, il n'a plus de champ, donc
          le bandeau devient la seule entrée de recherche.

          **Centrée dans la place libre, et non sur l'axe du bandeau.** Le
          centrage absolu a été essayé et mesuré : à 1 440 px, le mot-symbole
          finit à 493 et la navigation commence à 851, alors que l'axe est à
          720. Un champ vraiment centré ne pouvait donc pas dépasser 230 px sans
          passer sous « Catalogue », le bloc de droite étant plus large que le
          mot-symbole. Le champ occupe donc l'espace entre les deux, centré
          dedans, plafonné à 420 px. Cachée sous `lg`, où la place manque, la
          loupe prenant le relais.
        */}
        {session && (
          <>
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              {/* 560 et non 420 depuis le retrait de « Listes » : la place
                  libérée revient au champ, qui est ce qu'on vient faire ici. */}
              <div className="w-full max-w-[560px]">
                <ChampRecherche
                  valeur={saisie}
                  onChange={setSaisie}
                  onValider={chercher}
                  apercu={apercu}
                  taille="compact"
                />
              </div>
            </div>

            {/*
              **La loupe ouvre une feuille, elle n'emmène plus sur
              `/catalogue`.** Elle y menait, ce qui coûtait une navigation, un
              chargement de grille et un second geste pour atteindre le champ,
              là où le même geste sur un écran large ouvre une liste sous le
              curseur sans quitter la page.
            */}
            <button
              type="button"
              onClick={() => setFeuilleOuverte(true)}
              aria-label="Rechercher"
              aria-expanded={feuilleOuverte}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] lg:hidden"
              style={{ color: "var(--reel-muted)" }}
            >
              <Search size={20} />
            </button>

            {feuilleOuverte && <FeuilleRecherche onFermer={() => setFeuilleOuverte(false)} />}
          </>
        )}

        <nav className="ml-auto hidden shrink-0 items-center gap-1 sm:flex lg:ml-0" aria-label="Sections">
          <LienBandeau to="/catalogue">Catalogue</LienBandeau>
          {/*
            **« Listes » a quitté le bandeau**, pour rendre sa largeur au champ
            de recherche : chercher est le geste courant, ouvrir ses listes ne
            l'est pas. L'entrée n'est pas enterrée pour autant, « Mes listes »
            est dans le menu du compte, et la barre du bas la porte sur
            téléphone.
          */}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/*
            Trois états, pas deux : tant que la session n'est pas résolue on
            n'affiche rien à cet endroit, sinon un visiteur déjà connecté verrait
            « Se connecter » clignoter à chaque chargement de page.
          */}
          {/*
            `session === undefined` n'arrive **que** sur une visite connectée :
            sans clé en stockage, `useSession` répond `null` dès le premier
            rendu. Ce cas est donc celui de quelqu'un qui a un compte et attend
            que le jeton soit rafraîchi, deux secondes et demie mesurées en
            production. Un trou de 96 pixels à cet endroit se lisait comme une
            déconnexion ; on pose l'avatar tout de suite, avec le nom lu dans le
            stockage, et le menu s'active quand la session est confirmée.
          */}
          {session === undefined && (
            <div className="flex items-center gap-1 p-0.5" aria-hidden="true">
              <UserAvatar name={apercuNom()} size={34} />
              <ChevronDown size={16} color="var(--reel-muted)" />
            </div>
          )}

          {session === null && (
            <>
              <button
                type="button"
                onClick={() => { void connexionGoogle(); }}
                className="hidden rounded-full px-3 py-1.5 outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] sm:block"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--reel-text)",
                  border: "1px solid var(--reel-border)",
                }}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => { void connexionGoogle(); }}
                className="rounded-full px-3.5 py-1.5 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "var(--reel-accent)",
                  color: "#ffffff",
                  border: "1px solid var(--reel-accent)",
                }}
              >
                S’inscrire
              </button>
            </>
          )}

          {session && (
            <>
              {/*
                La cloche est posée vide, et le dit. Un bouton qui n'ouvre rien
                se lit comme une panne ; celui-ci ouvre un panneau qui annonce
                qu'il n'y a rien, ce qui est une information.
              */}
              <Cloche ouverte={clocheOuverte} onBascule={() => setClocheOuverte((v) => !v)} />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Menu du compte"
                  className="flex items-center gap-1 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
                >
                  {/* Le nom reste celui du compte : seule la photo vient du
                      profil, changer aussi les initiales ferait bouger le
                      bandeau pour qui n'a rien demandé. */}
                  <UserAvatar name={nomAffiche(session)} src={profil?.avatarUrl} size={34} />
                  <ChevronDown size={16} color="var(--reel-muted)" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[10px] py-1 shadow-xl"
                      style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
                    >
                      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--reel-border)" }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>
                          {profil?.nom ?? nomAffiche(session)}
                        </p>
                        {/* Le « @ » plutôt que l'adresse : c'est ce qu'on donne
                            à quelqu'un, et le menu est l'endroit où on vient le
                            relire. L'adresse reste sur `/account`. */}
                        <p
                          className="truncate"
                          style={{
                            fontFamily: profil ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
                            fontSize: "13px",
                            color: "var(--reel-muted)",
                          }}
                        >
                          {profil ? arobase(profil.identifiant) : session.user.email}
                        </p>
                      </div>
                      {/*
                        Une seule entrée de profil, et elle mène à l'adresse
                        canonique quand on la connaît. Il y avait « Mon profil »
                        et « Ma page publique » : ce sont la même page depuis
                        que le profil n'a qu'une adresse, et deux libellés pour
                        une destination se lisent comme deux destinations.
                        `/profile` reste le repli tant que l'identifiant n'est
                        pas lu, c'est une forme courte qui redirige.
                      */}
                      <MenuItem icon={<UserIcon size={16} />} to={lienProfil}>Mon profil</MenuItem>
                      <MenuItem icon={<Library size={16} />} to={lienProfil}>Ma collection</MenuItem>
                      <MenuItem icon={<Bookmark size={16} />} to={`${lienProfil}?liste=envies`}>
                        Mes envies
                      </MenuItem>
                      <MenuItem icon={<Library size={16} />} to="/lists">Mes listes</MenuItem>
                      {/*
                        Vers `/account`, qui porte la suppression du compte. La
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Un lien de section du bandeau, surligné quand on y est. */
function LienBandeau({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const actif = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      aria-current={actif ? "page" : undefined}
      className="rounded-full px-3 py-1.5 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: actif ? "var(--reel-text)" : "var(--reel-muted)",
        backgroundColor: actif ? "var(--reel-surface-2)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}

function Cloche({ ouverte, onBascule }: { ouverte: boolean; onBascule: () => void }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onBascule}
        aria-haspopup="dialog"
        aria-expanded={ouverte}
        aria-label="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
        style={{ color: "var(--reel-muted)" }}
      >
        <Bell size={19} />
      </button>
      {ouverte && (
        <>
          <div className="fixed inset-0 z-40" onClick={onBascule} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 z-50 mt-2 w-64 rounded-[10px] px-4 py-3 shadow-xl"
            style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
          >
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--reel-text)" }}>Notifications</p>
            <p className="mt-1" style={{ fontSize: "13px", lineHeight: "20px", color: "var(--reel-muted)" }}>
              Rien pour l’instant. Les alertes de sortie et de baisse de prix arriveront ici.
            </p>
          </div>
        </>
      )}
    </div>
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
