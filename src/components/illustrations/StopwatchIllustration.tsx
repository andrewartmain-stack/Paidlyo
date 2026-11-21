export function StopwatchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <g className="ill-pulse" style={{ transformOrigin: "120px 32px" }}>
        <rect x="108" y="22" width="24" height="14" rx="4" fill="var(--brand)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="116" y="34" width="8" height="14" fill="var(--foreground)" />
      <line x1="170" y1="52" x2="182" y2="40" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} />
      <circle cx="120" cy="100" r="52" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <circle cx="120" cy="100" r="38" fill="var(--background)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="120" y1="68" x2="120" y2="76" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="152" y1="100" x2="144" y2="100" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="120" y1="132" x2="120" y2="124" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="88" y1="100" x2="96" y2="100" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <rect className="ill-sweep" x="117" y="72" width="6" height="28" rx="3" fill="var(--foreground)" />
      <circle cx="120" cy="100" r="6" fill="var(--brand)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
