/** Decorative ~96px spot illustrations for the workflows row: thin ink line art with one green accent. */
type SpotProps = { className?: string };

const ink = "var(--foreground)";
const common = { fill: "none", "aria-hidden": true, focusable: false, viewBox: "0 0 96 96" } as const;
const line = { stroke: ink, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function TrackSpot({ className }: SpotProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="48" cy="54" r="30" fill="var(--accent)" />
      <circle cx="48" cy="54" r="30" {...line} />
      <path d="M42 16h12M48 16v8" {...line} />
      <path d="M48 54V38" {...line} />
      <path d="M48 54l11 8" stroke="var(--brand)" strokeWidth={3.5} strokeLinecap="round" className="mk-pulse-dot" />
      <circle cx="48" cy="54" r="3" fill={ink} />
      <path d="M72 26l5-5" {...line} />
    </svg>
  );
}

export function InvoiceSpot({ className }: SpotProps) {
  return (
    <svg {...common} className={className}>
      <path d="M24 12h40l10 10v58a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z" fill="#fff" />
      <path d="M24 12h40l10 10v58a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z" {...line} />
      <path d="M64 12v10h10" {...line} />
      <path d="M30 34h22M30 44h34M30 54h28" {...line} strokeOpacity={0.45} />
      <rect x="40" y="62" width="36" height="20" rx="6" fill="var(--primary)" />
      <rect x="40" y="62" width="36" height="20" rx="6" {...line} />
      <path d="M50 72h16" {...line} />
    </svg>
  );
}

export function PaySpot({ className }: SpotProps) {
  return (
    <svg {...common} className={className}>
      <rect x="10" y="26" width="64" height="42" rx="8" fill="#fff" />
      <rect x="10" y="26" width="64" height="42" rx="8" {...line} />
      <path d="M10 40h64" {...line} />
      <path d="M20 58h16" {...line} strokeOpacity={0.45} />
      <circle cx="68" cy="64" r="18" fill="var(--primary)" />
      <circle cx="68" cy="64" r="18" {...line} />
      <path d="M60 64l6 6 11-12" stroke={ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportSpot({ className }: SpotProps) {
  return (
    <svg {...common} className={className}>
      <rect x="12" y="14" width="72" height="68" rx="8" fill="#fff" />
      <rect x="12" y="14" width="72" height="68" rx="8" {...line} />
      <rect x="24" y="52" width="10" height="20" rx="2" fill="var(--accent)" {...line} />
      <rect x="43" y="40" width="10" height="32" rx="2" fill="var(--primary)" {...line} />
      <rect x="62" y="28" width="10" height="44" rx="2" fill="var(--accent)" {...line} />
      <path d="M20 78h56" {...line} strokeOpacity={0.35} />
    </svg>
  );
}

export function OrganizeSpot({ className }: SpotProps) {
  return (
    <svg {...common} className={className}>
      <rect x="12" y="18" width="30" height="26" rx="6" fill="#fff" />
      <rect x="12" y="18" width="30" height="26" rx="6" {...line} />
      <rect x="54" y="18" width="30" height="26" rx="6" fill="var(--accent)" />
      <rect x="54" y="18" width="30" height="26" rx="6" {...line} />
      <rect x="12" y="54" width="72" height="26" rx="6" fill="#fff" />
      <rect x="12" y="54" width="72" height="26" rx="6" {...line} />
      <rect x="20" y="64" width="40" height="6" rx="3" fill="var(--primary)" {...line} strokeWidth={2} />
      <path d="M20 31h14M62 31h14" {...line} strokeOpacity={0.45} />
    </svg>
  );
}
