export function ReportsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <rect x="44" y="30" width="152" height="124" rx="12" fill="var(--background)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <rect className="ill-grow" x="62" y="104" width="22" height="36" rx="4" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <rect className="ill-grow" x="94" y="82" width="22" height="58" rx="4" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: "0.2s" }} />
      <rect className="ill-grow" x="126" y="92" width="22" height="48" rx="4" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: "0.4s" }} />
      <rect className="ill-grow" x="158" y="56" width="22" height="84" rx="4" fill="var(--brand)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: "0.6s" }} />
      <line x1="54" y1="141" x2="188" y2="141" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <path className="ill-line" pathLength={1} d="M64 78 L105 62 L137 70 L170 42" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" stroke="var(--warning)" />
      <circle className="ill-pop" cx="170" cy="42" r="5" fill="var(--warning)" style={{ animationDelay: "1.6s" }} />
    </svg>
  );
}
