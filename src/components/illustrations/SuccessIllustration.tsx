export function SuccessIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <circle cx="120" cy="92" r="46" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <path className="ill-check" pathLength={1} d="M99 93 L114 108 L142 76" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={8} />
      <circle className="ill-pop" cx="52" cy="50" r="6" fill="var(--brand)" style={{ animationDelay: "0.8s" }} />
      <circle className="ill-pop" cx="188" cy="44" r="7" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} style={{ animationDelay: "0.95s" }} />
      <circle className="ill-pop" cx="196" cy="128" r="5" fill="var(--warning)" style={{ animationDelay: "1.1s" }} />
      <circle className="ill-pop" cx="46" cy="124" r="7" fill="var(--background)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} style={{ animationDelay: "1.25s" }} />
      <rect className="ill-pop" x="150" y="150" width="10" height="10" rx="2" fill="var(--brand)" style={{ animationDelay: "1.4s" }} />
      <rect className="ill-pop" x="80" y="20" width="10" height="10" rx="2" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} style={{ animationDelay: "1.55s" }} />
    </svg>
  );
}
