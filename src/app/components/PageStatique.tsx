import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

/** Mise en page commune aux pages éditoriales (mentions légales, confidentialité, à propos). */
export function PageStatique({ titre, sousTitre, children }: {
  titre: string;
  sousTitre?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 pt-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 pb-6 transition"
        style={{ fontSize: "14px", color: "var(--reel-muted)" }}
      >
        <ArrowLeft size={16} />
        Retour au catalogue
      </Link>

      <h1 style={{ fontSize: "30px", fontWeight: 700, color: "var(--reel-text)", lineHeight: "1.2" }}>
        {titre}
      </h1>
      {sousTitre && (
        <p className="pt-2" style={{ fontSize: "15px", color: "var(--reel-muted)" }}>{sousTitre}</p>
      )}

      <div className="flex flex-col gap-7 pt-9">{children}</div>
    </div>
  );
}

export function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--reel-text)" }}>{titre}</h2>
      <div
        className="flex flex-col gap-3"
        style={{ fontSize: "15px", lineHeight: "24px", color: "var(--reel-muted)" }}
      >
        {children}
      </div>
    </section>
  );
}

export function Encadre({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[10px] px-4 py-3"
      style={{
        backgroundColor: "var(--reel-surface)",
        border: "1px solid var(--reel-border)",
        fontSize: "14px",
        lineHeight: "22px",
        color: "var(--reel-muted)",
      }}
    >
      {children}
    </div>
  );
}
