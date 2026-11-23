/** Decorative: a CSV sheet travels along a dotted path into a Paidlyo card, then a check pops. */
export function ImportFlow({ className }: { className?: string }) {
  const ink = "var(--foreground)";
  return (
    <svg viewBox="0 0 320 180" fill="none" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="92" rx="150" ry="74" fill="#fff" fillOpacity={0.07} />
      {/* Dotted path */}
      <path
        d="M86 92H204"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 9"
        className="mk-dash-flow"
      />
      {/* Source sheet (stays put, shows the file being imported) */}
      <g>
        <path d="M30 60h32l14 14v44a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V66a6 6 0 0 1 6-6Z" fill="var(--muted)" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M62 60v14h14" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <text x="50" y="106" textAnchor="middle" fontSize="13" fontWeight="700" fill={ink} fontFamily="var(--font-heading), sans-serif">CSV</text>
        <path d="M34 114h30" stroke={ink} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* Moving copy of the sheet */}
      <g className="mk-import-file" opacity={0} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
        <path d="M30 60h32l14 14v44a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V66a6 6 0 0 1 6-6Z" fill="var(--accent)" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M62 60v14h14" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M34 90h30M34 100h22" stroke={ink} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* Paidlyo card */}
      <rect x="210" y="50" width="86" height="80" rx="16" fill="var(--primary)" stroke={ink} strokeWidth={3} />
      <rect x="222" y="64" width="34" height="8" rx="4" fill={ink} fillOpacity={0.8} />
      <path d="M222 88h60M222 100h44M222 112h52" stroke={ink} strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
      {/* Check pop */}
      <g className="mk-import-check">
        <circle cx="290" cy="52" r="15" fill="var(--card)" stroke={ink} strokeWidth={3} />
        <path d="M283 52l5 5 9-10" stroke="var(--brand)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
