export function ProjectsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <g className="ill-fan-back">
        <path d="M60 60 h34 l10 12 h76 a8 8 0 0 1 8 8 v58 a8 8 0 0 1 -8 8 h-112 a8 8 0 0 1 -8 -8 v-70 a8 8 0 0 1 8 -8 z" fill="var(--brand)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="ill-fan-mid">
        <rect x="64" y="52" width="112" height="86" rx="8" fill="var(--background)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="68" width="50" height="6" rx="3" fill="var(--foreground)" />
        <rect x="76" y="82" width="34" height="6" rx="3" fill="var(--muted-foreground)" />
      </g>
      <g className="ill-fan-front">
        <path d="M56 86 h40 l10 12 h78 a8 8 0 0 1 8 8 v42 a8 8 0 0 1 -8 8 h-120 a8 8 0 0 1 -8 -8 v-54 a8 8 0 0 1 8 -8 z" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="76" cy="124" r="6" fill="var(--background)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
        <rect x="90" y="120" width="52" height="7" rx="3.5" fill="var(--foreground)" />
      </g>
    </svg>
  );
}
