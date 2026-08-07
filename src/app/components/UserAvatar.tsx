import { useEffect, useState } from "react";

interface UserAvatarProps {
  name: string;
  /** Photo de profil. Absente, on retombe sur les initiales. */
  src?: string | null;
  size?: number;
  className?: string;
}

// Deterministic muted tint per user so avatars stay distinguishable without photos.
const TINTS = ["#3a4450", "#4a3d52", "#3d4a45", "#524a3d", "#3d4552", "#4a3d3d"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * L'avatar d'un compte : sa photo, ou ses initiales sur une teinte stable.
 *
 * **Les initiales ne sont pas un pis-aller, c'est le cas courant.** Personne
 * n'est obligé de déposer une photo, et la teinte tirée du nom suffit à
 * distinguer deux comptes dans une liste. La photo ne fait que remplacer le
 * fond, jamais la place ni la forme : tout ce qui appelle ce composant continue
 * de réserver un rond de `size` pixels.
 *
 * **Un 404 retombe sur les initiales, sans rien signaler.** Une photo effacée
 * d'un côté et encore référencée de l'autre est un état transitoire normal ; y
 * répondre par un cadre brisé serait le défaut que le §5 refuse ailleurs, où
 * une carte sans visuel est jugée préférable à un visuel cassé.
 */
export function UserAvatar({ name, src, size = 32, className = "" }: UserAvatarProps) {
  const tint = TINTS[name.charCodeAt(0) % TINTS.length];
  const [casse, setCasse] = useState(false);

  // Une URL neuve efface le souvenir de l'échec précédent, sinon changer de
  // photo après un 404 laisserait les initiales pour toute la visite.
  useEffect(() => setCasse(false), [src]);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        color: "var(--reel-text)",
        fontSize: Math.max(11, size * 0.38),
        fontWeight: 600,
      }}
    >
      {src && !casse ? (
        /* `object-cover` et non `contain` : la photo est déjà carrée, mais un
           avatar recadré ailleurs, ou servi depuis une ancienne version, ne doit
           pas se déformer pour tenir. */
        <img
          src={src}
          alt=""
          draggable={false}
          onError={() => setCasse(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
