export function InvoiceIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <rect x="70" y="24" width="100" height="132" rx="10" fill="var(--background)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <rect x="84" y="38" width="30" height="14" rx="4" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <rect className="ill-draw" x="84" y="64" width="72" height="7" rx="3.5" fill="var(--foreground)" style={{ animationDelay: "0.2s" }} />
      <rect className="ill-draw" x="84" y="80" width="56" height="7" rx="3.5" fill="var(--foreground)" style={{ animationDelay: "0.7s" }} />
      <rect className="ill-draw" x="84" y="96" width="64" height="7" rx="3.5" fill="var(--foreground)" style={{ animationDelay: "1.2s" }} />
      <rect className="ill-draw" x="84" y="112" width="40" height="7" rx="3.5" fill="var(--muted-foreground)" style={{ animationDelay: "1.7s" }} />
      <line x1="84" y1="130" x2="156" y2="130" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <g className="ill-coin">
        <circle cx="160" cy="136" r="20" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
        <circle cx="160" cy="136" r="12" fill="var(--background)" stroke="var(--warning)" strokeWidth={3} />
        <line x1="160" y1="130" x2="160" y2="142" stroke="var(--warning)" strokeWidth={3} strokeLinecap="round" />
      </g>
    </svg>
  );
}
