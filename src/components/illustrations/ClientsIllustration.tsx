export function ClientsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <g className="ill-slide-l" style={{ animationDelay: "0s" }}>
        <rect x="58" y="30" width="124" height="38" rx="10" fill="var(--muted)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="49" r="11" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="100" y="40" width="56" height="6" rx="3" fill="var(--foreground)" />
        <rect x="100" y="52" width="38" height="6" rx="3" fill="var(--muted-foreground)" />
      </g>
      <g className="ill-slide-r" style={{ animationDelay: "0.35s" }}>
        <rect x="58" y="72" width="124" height="38" rx="10" fill="var(--background)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="91" r="11" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="100" y="82" width="56" height="6" rx="3" fill="var(--foreground)" />
        <rect x="100" y="94" width="38" height="6" rx="3" fill="var(--muted-foreground)" />
      </g>
      <g className="ill-slide-l" style={{ animationDelay: "0.7s" }}>
        <rect x="58" y="114" width="124" height="38" rx="10" fill="var(--background)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="133" r="11" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="100" y="124" width="56" height="6" rx="3" fill="var(--foreground)" />
        <rect x="100" y="136" width="38" height="6" rx="3" fill="var(--muted-foreground)" />
      </g>
    </svg>
  );
}
