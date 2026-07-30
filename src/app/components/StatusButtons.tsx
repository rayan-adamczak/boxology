import { Heart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { basculerStatut } from "../lib/collections";
import type { StatutValue } from "../lib/reelio-db";

interface StatusButtonsProps {
  editionId: number;
  status: StatutValue | undefined;
  onChange: (editionId: number, status: StatutValue | null) => void;
}

export function StatusButtons({ editionId, status, onChange }: StatusButtonsProps) {
  // On attend la confirmation avant de bouger l'interface : avec un compte,
  // l'écriture passe par le réseau, et annoncer « Ajouté » sur un
  // enregistrement qui a échoué serait un mensonge.
  const handle = async (value: StatutValue) => {
    try {
      const next = await basculerStatut(editionId, value);
      onChange(editionId, next);
      if (next === null) {
        toast.success(value === "envie" ? "Retiré de vos envies" : "Retiré de votre collection");
      } else {
        toast.success(value === "envie" ? "Ajouté à vos envies" : "Ajouté à votre collection");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <div className="flex gap-2">
      <StatusButton
        active={status === "envie"}
        onClick={() => { void handle("envie"); }}
        icon={<Heart size={15} strokeWidth={2.2} />}
        label="Envie"
      />
      <StatusButton
        active={status === "possede"}
        onClick={() => { void handle("possede"); }}
        icon={<CheckCircle2 size={15} strokeWidth={2.2} />}
        label="Possédé"
      />
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--reel-accent)]"
      style={{
        fontSize: "13px",
        fontWeight: 600,
        backgroundColor: active ? "var(--reel-accent)" : "var(--reel-surface-2)",
        color: active ? "#ffffff" : "var(--reel-text)",
        border: `1px solid ${active ? "var(--reel-accent)" : "var(--reel-border)"}`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
