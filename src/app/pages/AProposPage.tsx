import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { FAQ, toutesLesQuestions } from "../lib/faq";
import { useSeo } from "../lib/seo";

/**
 * `/about`, en questions et réponses.
 *
 * Structure reprise de la FAQ de Letterboxd : un sommaire en tête, des sections
 * à ancre, une question par bloc. Le contenu vit dans `lib/faq.ts`, que le
 * middleware lit aussi pour écrire le corps servi aux moteurs : une seule
 * source, donc la page et ce qu'un crawler reçoit disent forcément la même
 * chose.
 *
 * Elle n'emploie pas `PageStatique` : celle-ci suppose un texte suivi, alors
 * qu'ici il faut un sommaire, des ancres et une hiérarchie à deux niveaux.
 *
 * Les questions portent un `h3` sous un `h2` de section, là où Letterboxd met
 * un `h1` par question. Un seul `h1` par page, c'est ce qu'attend un lecteur
 * d'écran comme un moteur.
 */
export function AProposPage() {
  const nombre = toutesLesQuestions().length;

  useSeo({
    titre: "À propos et questions fréquentes",
    description:
      `Ce qu'est jaquette.app, d'où viennent les données, ce que le site ne fait pas, ` +
      `et ce que devient un compte. ${nombre} questions.`,
  });

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 pt-[120px]">
      <Link
        to="/"
        className="inline-flex items-center gap-2 pb-6 transition"
        style={{ fontSize: "14px", color: "var(--reel-muted)" }}
      >
        <ArrowLeft size={16} />
        Retour au catalogue
      </Link>

      <h1
        style={{
          fontFamily: "var(--reel-font-titre)",
          fontSize: "clamp(28px, 5vw, 38px)",
          fontWeight: 800,
          color: "var(--reel-text)",
          lineHeight: 1.15,
        }}
      >
        À propos et questions fréquentes
      </h1>
      <p className="pt-3" style={{ fontSize: "16px", lineHeight: "26px", color: "var(--reel-muted)" }}>
        Un catalogue des éditions physiques de films, pensé pour celles et ceux qui collectionnent.
        Voici ce qu’il fait, ce qu’il ne fait pas, et d’où viennent ses données.
      </p>

      {/* Sommaire. Sur une page de vingt-neuf questions, arriver par une ancre
          depuis un moteur ou un lien partagé est le cas normal, pas l'exception. */}
      <nav
        className="mt-9 rounded-[12px] px-5 py-4"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      >
        <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--reel-muted)" }}>
          Sommaire
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {FAQ.map((section) => (
            <li key={section.ancre}>
              <a
                href={`#${section.ancre}`}
                style={{ fontSize: "15px", color: "var(--reel-accent-clair)" }}
                className="hover:underline"
              >
                {section.titre}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-12 pt-12">
        {FAQ.map((section) => (
          <section key={section.ancre} id={section.ancre} style={{ scrollMarginTop: "96px" }}>
            <h2
              style={{
                fontFamily: "var(--reel-font-titre)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--reel-text)",
              }}
            >
              {section.titre}
            </h2>

            <div className="mt-5 flex flex-col gap-7">
              {section.questions.map((q) => (
                <div key={q.ancre} id={q.ancre} style={{ scrollMarginTop: "96px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--reel-text)", lineHeight: "24px" }}>
                    {q.question}
                  </h3>
                  {q.reponse.map((paragraphe, i) => (
                    <p
                      key={i}
                      className="mt-2"
                      style={{ fontSize: "15px", lineHeight: "25px", color: "var(--reel-muted)" }}
                    >
                      {paragraphe}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section
        className="mt-14 rounded-[12px] px-5 py-4"
        style={{ backgroundColor: "var(--reel-surface)", border: "1px solid var(--reel-border)" }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--reel-text)" }}>
          Une question qui n’est pas là ?
        </h2>
        <p className="mt-2" style={{ fontSize: "15px", lineHeight: "25px", color: "var(--reel-muted)" }}>
          Écrivez à{" "}
          <a href="mailto:contact@jaquette.app" style={{ color: "var(--reel-accent-clair)" }}>
            contact@jaquette.app
          </a>
          . Les corrections sur le catalogue sont particulièrement bienvenues.
        </p>
        <p className="mt-3 flex flex-wrap gap-4" style={{ fontSize: "15px" }}>
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
  );
}
