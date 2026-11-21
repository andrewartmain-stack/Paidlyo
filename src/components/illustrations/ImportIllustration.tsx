export function ImportIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="96" rx="100" ry="70" fill="var(--accent)" />
      <rect x="14" y="62" width="64" height="56" rx="12" fill="var(--muted)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x="46" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--foreground)" stroke="none" fontFamily="var(--font-heading), sans-serif">Harvest</text>
      <rect x="162" y="62" width="64" height="56" rx="12" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x="194" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--foreground)" stroke="none" fontFamily="var(--font-heading), sans-serif">Paidlyo</text>
      <line x1="86" y1="90" x2="140" y2="90" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <path d="M132 80 L146 90 L132 100" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
      <rect className="ill-travel" x="84" y="84" width="10" height="10" rx="2" fill="var(--brand)" />
      <rect className="ill-travel" x="84" y="84" width="10" height="10" rx="2" fill="var(--primary)" stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} style={{ animationDelay: "1s" }} />
      <rect className="ill-travel" x="84" y="84" width="10" height="10" rx="2" fill="var(--warning)" style={{ animationDelay: "2s" }} />
    </svg>
  );
}
