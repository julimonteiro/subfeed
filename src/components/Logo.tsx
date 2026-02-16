interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({
  size = 28,
  className = "text-[var(--accent)]",
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Play triangle */}
      <path d="M3 5.5L11 12L3 18.5Z" fill="currentColor" />
      {/* Signal arc (small) */}
      <path
        d="M13.5 7.67A5 5 0 0 1 13.5 16.33"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Signal arc (large) */}
      <path
        d="M15.5 4.21A9 9 0 0 1 15.5 19.79"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
