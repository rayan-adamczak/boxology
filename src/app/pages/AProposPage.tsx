import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { FAQ, toutesLesQuestions } from "../lib/faq";
import { useSeo } from "../lib/seo";
import { useDefilementVersAncre } from "../lib/ancre";

/**
 * `/about`, en questions et réponses.
 *
 * Structure reprise de la FAQ de Letterboxd : un sommaire, des sections à ancre,
 * une question par bloc. Le contenu vit dans `lib/faq.ts`, que le middleware lit
 * aussi pour écrire le corps servi aux moteurs : une seule source, donc la page
 * et ce qu'un crawler reçoit disent forcément la même chose.
 *
 * Elle n'emploie pas `PageStatique` : celle-ci suppose une colonne unique de
 * texte suivi, alors qu'il faut ici deux colonnes et un sommaire collant.
 *
 * Les questions portent un `h3` sous un `h2` de section, là où Letterboxd met
 * un `h1` par question. Un seul `h1` par page, c'est ce qu'attend un lecteur
 * d'écran comme un moteur.
 */
export function AProposPage() {
  const nombre = toutesLesQuestions().length;

  // Vingt-neuf ancres ne servent à rien si un lien profond dépose le visiteur
  // en haut de page.
  useDefilementVersAncre();

  useSeo({
    titre: "À propos et questions fréquentes",
    description:
      `Ce qu'est jaquette.app, d'où viennent les données, ce que le site ne fait pas, ` +
      `et ce que devient un compte. ${nombre} questions.`,
  });

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-[120px]">
      <Link
        to="/"
        className="inline-flex items-center gap-2 pb-6 transition"
        style={{ fontSize: "15px", color: "var(--reel-muted)" }}
      >
        <ArrowLeft size={17} />
        Retour au catalogue
      </Link>

      <h1
        className="max-w-[860px]"
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "clamp(32px, 5vw, 46px)",
          fontWeight: 800,
          color: "var(--reel-text)",
          lineHeight: 1.12,
          letterSpacing: "-0.015em",
        }}
      >
        À propos et questions fréquentes
      </h1>
      <p
        className="max-w-[720px] pt-4"
        style={{ fontSize: "19px", lineHeight: "31px", color: "var(--reel-muted)" }}
      >
        Un catalogue des éditions physiques de films, pensé pour celles et ceux qui collectionnent.
        Voici ce qu’il fait, ce qu’il ne fait pas, et d’où viennent ses données.
      </p>

      {/*
        Deux colonnes à partir de `lg`, le sommaire à gauche et collant.

        Sur une page de vingt-neuf questions, arriver par une ancre depuis un
        moteur ou un lien partagé est le cas normal, pas l'exception : le
        sommaire doit rester atteignable une fois qu'on a défilé, sinon il ne
        sert qu'au premier écran.

        En dessous de `lg` il repasse en tête, en ligne : une colonne de 240 px
        prise sur 375 ne laisserait rien au texte.
      */}
      <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:gap-14">
        <Sommaire />

        <div className="flex min-w-0 flex-1 flex-col gap-14">
          {FAQ.map((section) => (
            <section key={section.ancre} id={section.ancre} style={{ scrollMarginTop: "104px" }}>
              <h2
                style={{
                  fontFamily: "var(--reel-font-titre)",
                  fontSize: "27px",
                  fontWeight: 700,
                  color: "var(--reel-text)",
                  letterSpacing: "-0.01em",
                }}
              >
                {section.titre}
              </h2>

              <div className="mt-6 flex flex-col gap-9">
                {section.questions.map((q) => (
                  <div key={q.ancre} id={q.ancre} style={{ scrollMarginTop: "104px" }}>
                    <h3
                      style={{
                        fontSize: "19px",
                        fontWeight: 600,
                        color: "var(--reel-text)",
                        lineHeight: "28px",
                      }}
                    >
                      {q.question}
                    </h3>
                    {q.reponse.map((paragraphe, i) => (
                      <p
                        key={i}
                        className="mt-2.5 max-w-[680px]"
                        style={{ fontSize: "17px", lineHeight: "29px", color: "var(--reel-muted)" }}
                      >
                        {paragraphe}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section
            className="rounded-[14px] px-6 py-5"
            style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
          >
            <h2 style={{ fontSize: "19px", fontWeight: 600, color: "var(--reel-text)" }}>
              Une question qui n’est pas là ?
            </h2>
            <p className="mt-2.5" style={{ fontSize: "17px", lineHeight: "29px", color: "var(--reel-muted)" }}>
              Écrivez à{" "}
              <a href="mailto:contact@jaquette.app" style={{ color: "var(--reel-accent-clair)" }}>
                contact@jaquette.app
              </a>
              . Les corrections sur le catalogue sont particulièrement bienvenues.
            </p>
            <p className="mt-4 flex flex-wrap gap-5" style={{ fontSize: "17px" }}>
              <Link to="/legal" style={{ color: "var(--reel-accent-clair)" }}>
                Mentions légales
              </Link>
              <Link to="/privacy" style={{ color: "var(--reel-accent-clair)" }}>
                Politique de confidentialité
              </Link>
              <Link to="/welcome" style={{ color: "var(--reel-accent-clair)" }}>
                Comment ça marche
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Sommaire des sections, collant à partir de `lg`.
 *
 * `top-[104px]` dégage le bandeau, qui est en `fixed` et ne réserve aucune place
 * dans le flux. `max-h` et `overflow-y` sont là pour l'écran d'ordinateur
 * portable : à six sections ça ne déborde pas, mais une septième le ferait, et
 * un sommaire collant qui dépasse l'écran ne se referme jamais.
 *
 * La section courante est suivie **à l'écoute du défilement**, et non à
 * l'`IntersectionObserver`, qui était le premier réflexe. Deux raisons, dans
 * cet ordre :
 *
 *   - la règle « la dernière section dont le titre est passé sous le bandeau »
 *     se lit en une ligne, là où l'observateur demandait un `rootMargin`
 *     négatif en bas pour que plusieurs sections visibles à la fois ne fassent
 *     pas gagner la mauvaise ;
 *   - elle se vérifie. Le panneau d'aperçu n'exécute aucun rappel
 *     d'`IntersectionObserver`, y compris pour un observateur trivial : la
 *     mise en surbrillance était donc invérifiable, et une fonction qu'on ne
 *     peut pas éprouver est un passif.
 *
 * Sur une page de cette longueur, un sommaire qui ne dit pas où l'on se trouve
 * ne sert qu'à partir, pas à se repérer.
 */
function Sommaire() {
  const { hash } = useLocation();
  const [visible, setVisible] = useState<string>(FAQ[0].ancre);

  useEffect(() => {
    let frame = 0;

    /* La dernière section dont le titre est passé sous le bandeau. Le repli sur
       la première couvre le haut de page, où aucune ne l'a encore franchi. */
    const relire = () => {
      frame = 0;
      const ligne = 140;
      let courante = FAQ[0].ancre;
      for (const section of FAQ) {
        const el = document.getElementById(section.ancre);
        if (el && el.getBoundingClientRect().top <= ligne) courante = section.ancre;
      }
      setVisible(courante);
    };

    // Une frame d'écart suffit : on ne suit pas le pixel, seulement la section.
    const auDefilement = () => {
      if (frame) return;
      frame = requestAnimationFrame(relire);
    };

    relire();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    return () => {
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* Une ancre dans l'URL l'emporte sur l'observation : au clic, la surbrillance
     doit suivre tout de suite, sans attendre que le défilement soit arrivé. Une
     ancre de question compte pour sa section. */
  const cible = hash.slice(1);
  const parAncre = FAQ.find(
    (s) => s.ancre === cible || s.questions.some((q) => q.ancre === cible),
  );
  const courante = parAncre?.ancre ?? visible;

  return (
    <nav className="lg:w-[240px] lg:shrink-0" aria-label="Sommaire">
      <div className="lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--reel-muted)",
          }}
        >
          Sommaire
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-y-1">
          {FAQ.map((section) => {
            const actif = section.ancre === courante;
            return (
              <li key={section.ancre}>
                <a
                  href={`#${section.ancre}`}
                  aria-current={actif ? "true" : undefined}
                  className="block rounded-[7px] transition lg:px-3 lg:py-2"
                  style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: actif ? "var(--reel-text)" : "var(--reel-accent-clair)",
                    fontWeight: actif ? 600 : 400,
                    backgroundColor: actif ? "var(--reel-surface-2)" : "transparent",
                  }}
                >
                  {section.titre}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
