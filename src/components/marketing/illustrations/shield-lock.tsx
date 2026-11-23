/** Decorative: a green shield with a lock whose shackle clicks shut. */
export function ShieldLock({ className }: { className?: string }) {
  const ink = "var(--foreground)";
  return (
    <svg viewBox="0 0 120 140" fill="none" className={className} aria-hidden="true" focusable="false">
      <circle cx="60" cy="72" r="52" fill="var(--accent)" className="mk-shield-glow" />
      <path
        d="M60 12 104 29v38c0 28-18 49-44 61C34 116 16 95 16 67V29Z"
        fill="var(--primary)"
        stroke={ink}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M60 24 92 36v30c0 21-13 37-32 46" stroke="#fff" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
      <path
        className="mk-lock-shackle"
        d="M49 66v-8a11 11 0 0 1 22 0v8"
        stroke={ink}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <rect x="42" y="64" width="36" height="30" rx="7" fill="var(--brand)" stroke={ink} strokeWidth={3} />
      <circle cx="60" cy="76" r="4" fill="var(--primary)" />
      <path d="M60 78v8" stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" />
    </svg>
  );
}
