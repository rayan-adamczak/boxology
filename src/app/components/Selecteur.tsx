import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * Un menu de sélection dessiné, et sur téléphone une feuille par le bas.
 *
 * ## Ce qu'il remplace, et ce qu'il doit reprendre
 *
 * Les filtres du catalogue étaient des `<select>` natifs, et le commentaire qui
 * les défendait avait raison sur le fond : ils portent **la navigation au
 * clavier, la recherche à la frappe et la roue du système**, trois choses
 * qu'un menu maison rate presque toujours. Les trois sont donc reprises ici,
 * et c'est le seul motif qui rendait ce composant écrivable :
 *
 *   - flèches, Origine, Fin, Entrée, Échap, et le focus qui revient au bouton ;
 *   - **frappe au vol** : taper « sci » saute à « Science-Fiction », comme un
 *     `<select>` le fait, avec la même remise à zéro après une seconde ;
 *   - sur téléphone, une feuille par le bas plutôt qu'un menu suspendu, parce
 *     que c'est ce que fait le système et que douze options dans une bulle de
 *     200 px ne se pointent pas au pouce.
 *
 * Ce qu'on y gagne en échange : la même capsule sur toutes les machines. Un
 * `<select>` natif est dessiné par le système, donc il n'a ni la police, ni le
 * rayon, ni les couleurs du reste du site, et **sa flèche non plus** — c'est
 * exactement ce qui se voyait sur le tri du profil, où la flèche du navigateur
 * paraissait au milieu d'une capsule dessinée.
 *
 * ## Ce qui n'est pas repris, et c'est assumé
 *
 * La liste longue n'a pas de champ de recherche. `Éditeur` compte 142 entrées,
 * et la frappe au vol suffit à les atteindre ; un champ dans une feuille
 * ouvrirait le clavier logiciel par-dessus la liste qu'il filtre.
 */

export interface OptionSelecteur {
  valeur: string;
  libelle: string;
}

/** En dessous, la feuille par le bas ; au-dessus, le menu suspendu. */
const MOBILE = "(max-width: 639px)";

export function Selecteur({
  libelle,
  valeur,
  onChange,
  options,
  taille = "md",
  accentSiChoisi = false,
}: {
  /** Nom accessible du contrôle, et libellé de repli si la valeur ne matche rien. */
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  options: OptionSelecteur[];
  /** `md` pour la barre de filtres, `sm` pour un tri posé dans une rangée. */
  taille?: "md" | "sm";
  /** Capsule bleue quand une valeur est choisie. Vrai pour un filtre. */
  accentSiChoisi?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [surligne, setSurligne] = useState(0);
  const bouton = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const frappe = useRef<{ texte: string; minuteur: number | null }>({ texte: "", minuteur: null });
  const id = useId();

  const mobile = useMobile();
  const index = Math.max(0, options.findIndex((o) => o.valeur === valeur));
  const choisie = options[index];
  const actif = accentSiChoisi && valeur !== "";

  // Le surlignage repart de la valeur courante à chaque ouverture : ouvrir un
  // menu sur sa première ligne alors qu'on a déjà choisi la dixième oblige à
  // refaire tout le chemin.
  useEffect(() => {
    if (ouvert) setSurligne(index);
  }, [ouvert, index]);

  /* Le focus va à la liste à l'ouverture et **revient au bouton** à la
     fermeture. Sans le retour, la tabulation repart du début du document, ce
     qui est le défaut classique d'un menu maison. */
  useLayoutEffect(() => {
    if (ouvert) liste.current?.focus();
  }, [ouvert]);

  function fermer(rendreLeFocus = true) {
    setOuvert(false);
    if (rendreLeFocus) bouton.current?.focus();
  }

  function choisir(o: OptionSelecteur) {
    onChange(o.valeur);
    fermer();
  }

  /**
   * Frappe au vol, comme un `<select>` : les lettres s'accumulent une seconde,
   * puis le tampon repart. Sans l'accumulation, « sci » chercherait « s », puis
   * « c », puis « i », et sauterait trois fois ailleurs.
   */
  function surFrappe(lettre: string) {
    const f = frappe.current;
    if (f.minuteur) window.clearTimeout(f.minuteur);
    f.texte += lettre.toLowerCase();
    f.minuteur = window.setTimeout(() => { f.texte = ""; }, 1000);

    const cible = options.findIndex((o) => replier(o.libelle).startsWith(replier(f.texte)));
    if (cible >= 0) setSurligne(cible);
  }

  function surTouche(e: React.KeyboardEvent) {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        fermer();
        break;
      case "ArrowDown":
        e.preventDefault();
        setSurligne((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSurligne((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setSurligne(0);
        break;
      case "End":
        e.preventDefault();
        setSurligne(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[surligne]) choisir(options[surligne]);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          surFrappe(e.key);
        }
    }
  }

  const rangees = (
    <div
      ref={liste}
      role="listbox"
      tabIndex={-1}
      aria-label={libelle}
      aria-activedescendant={`${id}-${surligne}`}
      onKeyDown={surTouche}
      className="outline-none"
    >
      {options.map((o, i) => (
        <Rangee
          key={o.valeur}
          id={`${id}-${i}`}
          option={o}
          choisie={o.valeur === valeur}
          surlignee={i === surligne}
          mobile={mobile}
          onChoisir={() => choisir(o)}
          onSurvol={() => setSurligne(i)}
        />
      ))}
    </div>
  );

  return (
    <div
      className={
        taille === "md"
          ? "relative flex w-full sm:min-w-0 sm:flex-1 sm:basis-0"
          : "relative inline-flex"
      }
    >
      <button
        ref={bouton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={libelle}
        onClick={() => setOuvert((v) => !v)}
        onKeyDown={(e) => {
          // Ouvrir à la flèche du bas est le geste attendu d'un `<select>`.
          if (!ouvert && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOuvert(true);
          }
        }}
        className={`flex w-full items-center gap-2 rounded-full outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)] ${
          taille === "md" ? "py-2.5 pl-4 pr-3" : "py-1.5 pl-3 pr-2.5"
        }`}
        style={{
          fontSize: taille === "md" ? "14px" : "13px",
          fontWeight: actif ? 600 : taille === "md" ? 400 : 500,
          color: actif ? "var(--reel-text)" : taille === "md" ? "var(--reel-muted)" : "var(--reel-text)",
          backgroundColor: actif ? "var(--reel-accent-soft)" : "var(--reel-surface)",
          border: `1px solid ${actif ? "var(--reel-accent-clair)" : "var(--reel-border)"}`,
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left">{choisie?.libelle ?? libelle}</span>
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform"
          style={{
            color: actif ? "var(--reel-accent-clair)" : "var(--reel-muted)",
            transform: ouvert ? "rotate(180deg)" : undefined,
          }}
          aria-hidden="true"
        />
      </button>

      {ouvert && !mobile && (
        <>
          {/* Voile transparent plutôt qu'un écouteur de document : il attrape
              le clic extérieur sans qu'aucun composant n'ait à se demander si
              la cible est dedans ou dehors. */}
          <div className="fixed inset-0 z-40" onMouseDown={() => fermer(false)} aria-hidden="true" />
          <div
            className="absolute left-0 top-full z-50 mt-1.5 max-h-[300px] min-w-full overflow-y-auto rounded-[12px] py-1 shadow-xl"
            style={{
              /*
                **`--reel-surface` et non `--reel-surface-2`**, alors que c'est
                une surface surélevée : le surlignage des lignes vaut justement
                `--reel-surface-2`, donc un panneau de cette couleur rendait le
                survol **invisible**, tout en laissant croire à la relecture
                qu'il n'existait pas. C'est aussi la teinte du menu du compte
                dans le bandeau, qui flotte de la même façon au-dessus de la
                page.
              */
              backgroundColor: "var(--reel-surface)",
              border: "1px solid var(--reel-border)",
              /* Le menu ne se laisse pas rétrécir par la capsule : celle-ci est
                 volontairement courte, ce sont les options qui sont longues. */
              width: "max-content",
              maxWidth: "min(320px, calc(100vw - 32px))",
            }}
          >
            {rangees}
          </div>
        </>
      )}

      {ouvert && mobile && <Feuille libelle={libelle} onFermer={fermer}>{rangees}</Feuille>}
    </div>
  );
}

/**
 * La feuille par le bas.
 *
 * Le pouce atteint le bas de l'écran, pas le haut : une liste ancrée en bas se
 * parcourt sans changer de prise. C'est aussi ce que fait la roue du système
 * qu'on remplace, et l'écart avec elle doit rester un écart de dessin, pas
 * d'ergonomie.
 */
function Feuille({
  libelle,
  onFermer,
  children,
}: {
  libelle: string;
  onFermer: () => void;
  children: React.ReactNode;
}) {
  const [entre, setEntre] = useState(false);

  // Un cadre après le montage : la transition ne part que si l'état de départ
  // a été peint, sinon le navigateur passe directement à l'arrivée.
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntre(true));
    return () => cancelAnimationFrame(t);
  }, []);

  /* Défilement gelé avec compensation de la barre, comme la visionneuse et le
     recadrage : la masquer élargit la page et fait sauter tout le contenu. */
  useEffect(() => {
    const barre = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (barre > 0) document.body.style.paddingRight = `${barre}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(6, 10, 16, 0.7)", opacity: entre ? 1 : 0 }}
        onMouseDown={onFermer}
        aria-hidden="true"
      />
      <div
        className="relative max-h-[72vh] overflow-y-auto rounded-t-[18px] pb-[max(16px,env(safe-area-inset-bottom))] transition-transform duration-200 motion-reduce:transition-none"
        style={{
          backgroundColor: "var(--reel-surface)",
          borderTop: "1px solid var(--reel-border)",
          transform: entre ? "translateY(0)" : "translateY(16px)",
        }}
      >
        {/* La poignée ne se saisit pas, elle dit seulement que ça se ferme par
            le bas. Un vrai glissement demanderait un suivi de pointeur pour
            un geste que le voile couvre déjà. */}
        <div className="flex justify-center pb-1 pt-2.5" aria-hidden="true">
          <span
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: "var(--reel-border)" }}
          />
        </div>
        <p
          className="px-5 pb-1 pt-1"
          style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--reel-muted)" }}
        >
          {libelle}
        </p>
        <div className="px-2 pb-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function Rangee({
  id,
  option,
  choisie,
  surlignee,
  mobile,
  onChoisir,
  onSurvol,
}: {
  id: string;
  option: OptionSelecteur;
  choisie: boolean;
  surlignee: boolean;
  mobile: boolean;
  onChoisir: () => void;
  onSurvol: () => void;
}) {
  const element = useRef<HTMLDivElement>(null);

  // Le surlignage suit le clavier jusque dans une liste plus longue que sa
  // fenêtre : sans ça, les flèches déplacent une sélection invisible.
  useEffect(() => {
    if (surlignee) element.current?.scrollIntoView({ block: "nearest" });
  }, [surlignee]);

  return (
    <div
      ref={element}
      id={id}
      role="option"
      aria-selected={choisie}
      onMouseDown={(e) => { e.preventDefault(); onChoisir(); }}
      onMouseEnter={onSurvol}
      /*
        **Le survol est en CSS, pas en état.** `onMouseEnter` reste, mais pour
        aligner le curseur clavier sur la souris, pas pour peindre : React
        synthétise `mouseenter` à partir de `mouseover`, et cette synthèse est
        un intermédiaire de plus entre le geste et le pixel. Un `hover:` ne
        dépend de rien, ne coûte pas un rendu par ligne survolée, et Tailwind le
        place derrière `@media (hover: hover)`, donc il ne colle pas au doigt
        après un appui sur téléphone.

        Le survol éclaircit **aussi le texte**, pas seulement le fond : les
        options non choisies sont en gris discret, et un changement de fond seul
        s'y remarque à peine.
      */
      className={`flex cursor-pointer items-center gap-2 rounded-[8px] transition-colors hover:bg-[var(--reel-surface-2)] hover:text-[var(--reel-text)] ${
        mobile ? "px-3 py-3" : "px-3 py-2"
      } ${surlignee ? "bg-[var(--reel-surface-2)] text-[var(--reel-text)]" : ""} ${
        choisie ? "font-semibold text-[var(--reel-text)]" : "text-[var(--reel-muted)]"
      }`}
      style={{ fontSize: mobile ? "15px" : "14px" }}
    >
      <span className="min-w-0 flex-1 truncate">{option.libelle}</span>
      {choisie && (
        <Check size={15} className="shrink-0" style={{ color: "var(--reel-accent-clair)" }} aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Vrai sous 640 px, et **réévalué au redimensionnement**.
 *
 * L'état est lu au premier rendu, sans effet : `matchMedia` est synchrone, et
 * la règle du §8 vaut ici aussi, ce qui se décide au premier rendu doit se
 * décider sans attendre. Une rotation de téléphone change la réponse, d'où
 * l'écouteur.
 */
function useMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const suivre = () => setMobile(mq.matches);
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);

  return mobile;
}

/** Accents repliés pour la frappe au vol : « ed » doit trouver « Éditeur ». */
function replier(texte: string): string {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
