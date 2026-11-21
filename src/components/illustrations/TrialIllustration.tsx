export function TrialIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <rect x="120" y="36" width="90" height="100" rx="12" fill="var(--background)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <path d="M120 48 a12 12 0 0 1 12 -12 h66 a12 12 0 0 1 12 12 v16 h-90 z" fill="var(--brand)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="140" y1="28" x2="140" y2="42" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} />
      <line x1="190" y1="28" x2="190" y2="42" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} />
      <circle cx="140" cy="86" r="4" fill="var(--muted-foreground)" />
      <circle cx="165" cy="86" r="4" fill="var(--muted-foreground)" />
      <circle cx="190" cy="86" r="4" fill="var(--muted-foreground)" />
      <circle cx="140" cy="112" r="4" fill="var(--muted-foreground)" />
      <circle cx="165" cy="112" r="4" fill="var(--muted-foreground)" />
      <circle className="ill-tick" cx="190" cy="112" r="10" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <g className="ill-glide">
        <rect x="26" y="78" width="96" height="62" rx="10" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
        <rect x="26" y="92" width="96" height="14" fill="var(--foreground)" />
        <rect x="38" y="118" width="26" height="8" rx="4" fill="var(--brand)" />
        <rect x="72" y="118" width="14" height="8" rx="4" fill="var(--background)" />
      </g>
    </svg>
  );
}
