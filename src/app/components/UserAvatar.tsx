interface UserAvatarProps {
  name: string;
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

export function UserAvatar({ name, size = 32, className = "" }: UserAvatarProps) {
  const tint = TINTS[name.charCodeAt(0) % TINTS.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        color: "var(--reel-text)",
        fontSize: Math.max(11, size * 0.38),
        fontWeight: 600,
      }}
    >
      {initials(name)}
    </span>
  );
}
