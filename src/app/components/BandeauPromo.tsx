import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  promotionsAAfficher,
  quand,
  type EtatPromotion,
  type Promotion,
} from "../lib/promotions";

/**
 * Le bandeau d'une promotion marchande en cours.
 *
 * Il ne paraît que dans la fenêtre déclarée par `lib/promotions.ts`, donc il
 * s'éteint tout seul : c'est la contrainte qui a décidé du module, un code
 * périmé affiché comme actif étant une pratique commerciale trompeuse au même
 * titre qu'un prix périmé (§10).
 *
 * ## En bas et non en haut, et ce n'est pas un choix esthétique
 *
 * Le bandeau du site est en `fixed`, donc il ne réserve aucune place dans le
 * flux, et **dix-sept rembourrages hauts en dur** le compensent page par page,
 * de `pt-[72px]` à `pt-[152px]`. Poser une bande au-dessus de lui les fausserait
 * tous les dix-sept, pour une promotion qui dure un jour. Le §8 garde déjà la
 * trace de ce piège, c'est lui qui faisait disparaître le lien de retour des
 * pages statiques derrière le bandeau.
 *
 * En bas, rien à recalculer : la barre se pose au-dessus de la barre d'onglets
 * mobile, qui est le seul autre élément fixé de ce côté, et **sa hauteur se
 * mesure** plutôt qu'elle ne se devine, cf. `useHauteurBarreOnglets`.
 *
 * ## Fermable, et la fermeture se retient par code
 *
 * La clé porte le code de la promotion et non un nom générique : une promotion
 * suivante doit reparaître chez quelqu'un qui a fermé la précédente, ce qu'une
 * clé fixe interdirait pour toujours.
 *
 * `localStorage` et non `sessionStorage` : la promotion dure une journée
 * entière, et rouvrir un onglet ne veut pas dire qu'on a changé d'avis.
 *
 * **Le stockage peut lever**, navigation privée de vieux Safari, quota plein :
 * dans ce cas le bandeau paraît, ce qui est le bon sens de la panne. Ne pas
 * pouvoir se souvenir d'un refus vaut mieux que ne pas afficher l'information.
 */
/**
 * La clé porte l'état autant que le code.
 *
 * Fermer l'annonce ne doit pas fermer la promotion elle-même : ce sont deux
 * informations différentes, « c'est dimanche » et « c'est maintenant », et la
 * seconde est celle qui sert. Une clé sur le seul code aurait fait taire le
 * jour J chez quiconque a balayé l'annonce l'avant-veille.
 */
function cle(promo: Promotion, etat: EtatPromotion) {
  return `jaquette.promo.${promo.code}.${etat}`;
}

function dejaFerme(promo: Promotion, etat: EtatPromotion) {
  try {
    return localStorage.getItem(cle(promo, etat)) === "1";
  } catch {
    return false;
  }
}

/**
 * La hauteur de la barre d'onglets mobile, mesurée et non supposée.
 *
 * Un `bottom-[68px]` en dur a tenu quelques heures et laissait un jour entre le
 * bandeau et la navigation : la barre porte `padding-bottom:
 * env(safe-area-inset-bottom)`, donc sa hauteur dépend de l'appareil, et elle a
 * gagné un onglet « Scanner » entre-temps. Un nombre deviné se périme à la
 * première retouche de ce qu'il devine.
 *
 * `ResizeObserver` plutôt qu'une mesure au montage : l'insert de sécurité change
 * quand la barre d'adresse du navigateur se replie, et la barre gagne des
 * onglets au fil des versions.
 *
 * **Mais `ResizeObserver` ne suffit pas, et le défaut est muet.** La
 * spécification lui fait *sauter* les éléments en `display: none`, elle ne les
 * rapporte pas à zéro : la barre disparaissant à partir de `md`, le passage du
 * téléphone au bureau ne déclenchait aucun rappel et la dernière hauteur
 * mesurée restait posée. Le bandeau flottait alors à 64 px du bas d'un écran de
 * 1 280, sans que rien ne le signale. D'où l'écouteur de redimensionnement en
 * plus, qui lui se déclenche au franchissement du palier.
 *
 * `offsetHeight` et non `getBoundingClientRect` : les deux rendent 0 sur un
 * `display: none`, mais le premier le dit sans forcer de calcul de disposition
 * sur un élément qui n'en a pas.
 *
 * Rend 0 quand la barre n'est pas là : le bandeau descend alors au ras.
 */
function useHauteurBarreOnglets() {
  const [hauteur, setHauteur] = useState(0);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
    if (!nav) return;
    const mesurer = () => setHauteur(nav.offsetHeight);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(nav);
    window.addEventListener("resize", mesurer);
    return () => {
      observateur.disconnect();
      window.removeEventListener("resize", mesurer);
    };
  }, []);

  return hauteur;
}

export function BandeauPromo() {
  const basBarre = useHauteurBarreOnglets();

  /*
    L'état part de `null` et non de la promotion : le premier rendu doit être
    le même côté serveur et côté client, et surtout il ne doit pas peindre un
    bandeau que le stockage va retirer dans la foulée. Le §8 en fait une règle,
    ce qui se décide au premier rendu se décide sans réseau, et son corollaire
    est qu'un état qu'on sait provisoire ne se peint pas.

    Ici la lecture du stockage est synchrone, donc l'effet tourne avant la
    première peinture visible et le bandeau n'apparaît jamais pour disparaître.
  */
  const [courant, setCourant] = useState<{ promo: Promotion; etat: EtatPromotion } | null>(null);

  useEffect(() => {
    setCourant(promotionsAAfficher().find((x) => !dejaFerme(x.promo, x.etat)) ?? null);
  }, []);

  if (!courant) return null;
  const { promo, etat } = courant;

  const fermer = () => {
    try {
      localStorage.setItem(cle(promo, etat), "1");
    } catch {
      /* Rien à faire : on ferme quand même, la fermeture ne survivra pas au
         rechargement et c'est tout ce qu'on perd. */
    }
    setCourant(null);
  };

  return (
    <div
      role="region"
      aria-label="Promotion en cours"
      /* `bottom` vient de la mesure et non d'une classe : la barre d'onglets
         mobile occupe le bas de l'écran et se poser dessus masquerait la
         navigation, mais sa hauteur dépend de l'appareil. Au-dessus de `md` elle
         n'existe pas, la mesure rend 0 et le bandeau descend au ras. */
      className="fixed inset-x-0 z-30"
      /*
        **Il ne suit pas la gouttière, et c'est voulu.** `.reel-gouttiere` cadre
        le corps du site, 877 px à 1 512 : s'y aligner faisait lire le bandeau
        comme une section de la page. Une barre qui annonce autre chose que le
        catalogue doit se détacher de lui, donc elle va d'un bord à l'autre et
        garde son propre rembourrage.

        Le fond n'est pas `--reel-surface` non plus, qui est celui des cartes
        d'édition juste au-dessus : un mélange d'accent l'en écarte, et le filet
        du haut le reprend plus franchement. C'est le motif de Seed relevé sur
        Mobbin, où la couleur de la bande porte la promotion à elle seule.

        **Aucun `backdrop-filter`**, quelle que soit l'envie : le §8 en garde la
        trace, un flou sur toute la largeur force une couche de composition et
        laisse le navigateur peindre des tuiles périmées, page dédoublée et
        décalée d'une centaine de pixels. Un aplat opaque fait le même travail.
      */
      style={{
        bottom: basBarre,
        backgroundColor: "color-mix(in srgb, var(--reel-accent) 14%, var(--reel-bg))",
        borderTop: "1px solid color-mix(in srgb, var(--reel-accent-clair) 40%, transparent)",
      }}
    >
      <div className="flex items-center gap-3 px-5 py-2.5 sm:px-8 lg:px-12">
        {/*
          Une étiquette de rayon, et non une pastille ronde.

          Le disque de 44 px a été essayé et retiré : il rendait le chiffre
          petit pour tenir dans un rond, et rien dans le site ne parle en
          disques. Trois bandeaux marchands relevés sur Mobbin, Seed, adidas et
          The New Yorker, ne posent d'ailleurs aucun badge circulaire : la
          couleur de la bande ou l'emphase typographique porte la remise, et
          l'action passe par une pilule pleine à droite.

          Ce qui est repris ici est l'emphase typographique, dans le vocabulaire
          du site : un cadre rectangulaire arrondi comme les capsules du §8, avec
          le seul taux. Ça se lit comme une étiquette posée sur un boîtier, ce
          que le site montre par ailleurs.

          **Le taux est seul, sans mot dessous.** Un « OCCASION » en petites
          capitales a tenu quelques heures : il redisait ce que la phrase à côté
          écrit déjà, « 12 % sur l'occasion », et il faisait de l'étiquette un
          bloc à deux étages là où une étiquette de prix n'en a qu'un.

          Les couleurs sont celles du site et non celles de momox : le §8 pose
          qu'un logo ne suit pas la palette du site, la réciproque vaut, le site
          n'emprunte pas celle d'un marchand.

          **`color-mix` pour le fond**, plutôt qu'un aplat d'accent : un bleu
          plein ferait un bouton qu'on cherche à cliquer alors que l'étiquette
          ne mène nulle part. C'est la pilule à droite qui se clique.
        */}
        <span
          aria-hidden
          className="flex shrink-0 items-center justify-center rounded-[8px] px-2.5 py-1 sm:px-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--reel-accent) 18%, transparent)",
            border: "1px solid color-mix(in srgb, var(--reel-accent-clair) 45%, transparent)",
          }}
        >
          <span
            className="tabular-nums text-[15px] sm:text-[17px]"
            style={{
              fontFamily: "var(--reel-font-titre)",
              fontWeight: 800,
              lineHeight: "20px",
              letterSpacing: "-0.02em",
              color: "var(--reel-accent-clair)",
            }}
          >
            {promo.badge}
          </span>
        </span>

        {/*
          Deux lignes, et elles portent chacune une chose.

          La première dit l'offre et le code, la seconde ce qui la conditionne
          et où aller. Empilées en un seul paragraphe, elles faisaient trois
          lignes à 1 512 px, ce qui donne au bandeau la hauteur d'un encart et
          non d'une barre.
        */}
        <div className="min-w-0 flex-1">
          {/*
            Des points médians et non des phrases, à 375 px la phrase entière
            prenait trois lignes à elle seule. Le §8 réserve le point médian aux
            valeurs qui se juxtaposent sans se lier, et c'est le cas ici :
            le marchand, la remise, le code.
          */}
          <p className="text-[12px] leading-[17px] sm:text-[13px] sm:leading-[19px]" style={{ color: "var(--reel-text)" }}>
            <span style={{ fontWeight: 600 }}>{promo.marchand}</span>
            <span style={{ color: "var(--reel-muted)" }}>{" · "}</span>
            <span style={{ fontWeight: 600 }}>
              {promo.resumeCourt} {quand(promo, etat)}
            </span>
            <span style={{ color: "var(--reel-muted)" }}>{" · code "}</span>
            {/* Chasse fixe, comme un code-barres : c'est une valeur qu'on
                recopie signe à signe, et `I` contre `l` s'y joue. */}
            <span
              className="tabular-nums"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontWeight: 600,
              }}
            >
              {promo.code}
            </span>
          </p>
          {/*
            La mention d'affiliation ne paraît qu'à partir de `md`, et ce n'est
            pas une commodité de place : c'est là que la pilule apparaît, donc
            là qu'il y a un lien rémunéré à déclarer (§10). En dessous, le
            bandeau ne porte aucun lien, il informe et rien de plus, et la
            phrase prenait une ligne entière sur les quatre d'un écran de 375.

            La fiche film, elle, garde la mention en toutes lettres sous sa
            liste d'éditions, où les prix sont des liens affiliés.
          */}
          <p className="text-[11px] leading-[16px] sm:text-[12px] sm:leading-[18px]" style={{ color: "var(--reel-muted)" }}>
            {promo.conditionsCourtes}
            <span className="hidden md:inline"> Offre du marchand, relayée ici.</span>
          </p>
        </div>

        {/*
          L'action en pilule pleine, motif commun aux trois bandeaux relevés :
          un lien en texte au milieu d'une phrase grise se cherche, une pilule
          se voit. Elle est masquée sous `sm`, où elle mangerait la moitié de la
          largeur ; le §10 est sauf, le bandeau y reste informatif et la fiche
          film porte les mêmes offres avec leurs liens.

          `rel="sponsored"` comme tous les liens marchands du site : un lien
          d'affiliation non déclaré est un montage de liens aux yeux de Google,
          et la sanction porte sur le site entier (§10).
        */}
        <a
          href={promo.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)] md:inline-flex"
          style={{
            backgroundColor: "var(--reel-accent)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          En profiter
          <ArrowUpRight size={15} />
        </a>

        <button
          type="button"
          onClick={fermer}
          aria-label="Masquer cette promotion"
          className="shrink-0 rounded-full p-1.5 outline-none transition hover:text-[var(--reel-text)] focus-visible:ring-2 focus-visible:ring-[var(--reel-accent-clair)]"
          style={{ color: "var(--reel-muted)" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
