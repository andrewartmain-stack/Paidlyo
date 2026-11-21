import Image from "next/image";
import logoWordmark from "../../../public/logo-wordmark.png";

/*
 * The Paidlyo logo with an animated coin stack (hover / keyboard focus on the parent link).
 * The wordmark is the original PNG with the coins removed; the three coins are vector paths traced
 * from it and drawn on top in the same 845×190 coordinates, so at rest it looks identical to
 * logo.png. The lower coins are complete discs; the white gaps between coins come from a
 * background-coloured halo drawn under each upper coin (below its rim, above the coins beneath).
 *
 * Only while animating, each coin turns "3D": a rim (the face shape shifted down, in grey) gives it
 * thickness, an inner ring and a shine mark the raised edge, and the flipping top coin shows a
 * solid edge when it's side-on. Keyframes: globals.css ("Logo").
 */

const TOP = "M77.0 26.0 L65.0 27.6 L57.0 29.6 L49.0 32.6 L43.0 35.7 L35.6 42.0 L33.7 46.0 L34.0 47.0 L32.7 48.0 L33.3 49.0 L32.9 53.0 L34.7 57.0 L38.0 61.1 L42.0 64.3 L50.0 68.5 L51.0 68.4 L52.0 69.4 L56.0 70.5 L57.0 70.0 L57.5 71.0 L61.0 72.1 L73.0 74.4 L91.0 74.6 L99.0 74.4 L110.0 72.5 L120.0 69.4 L128.0 65.5 L134.0 61.2 L137.5 57.0 L139.4 52.0 L139.3 48.0 L136.5 42.0 L131.0 36.6 L126.0 33.6 L119.0 30.5 L109.0 27.6 L96.0 25.7 L81.0 25.5 Z";
const MIDDLE = "M3.9 89.0 L5.8 94.0 L7.0 95.0 L6.9 96.0 L11.0 100.5 L18.0 105.3 L30.0 110.5 L35.0 111.4 L36.0 112.2 L38.0 112.5 L39.0 112.0 L40.0 113.1 L41.0 112.7 L42.0 113.5 L44.0 113.0 L46.0 114.4 L54.0 115.5 L71.0 116.2 L84.0 115.5 L98.0 113.4 L107.0 111.4 L121.0 106.4 L128.0 102.5 L134.0 97.7 L138.3 92.0 L139.5 87.0 L139.5 87.0 L138.3 82.0 L134.0 76.3 L128.0 71.5 L121.0 67.6 L107.0 62.6 L98.0 60.6 L84.0 58.5 L71.0 57.8 L54.0 58.5 L46.0 59.6 L44.0 61.0 L42.0 60.5 L41.0 61.3 L40.0 60.9 L39.0 62.0 L38.0 61.5 L36.0 61.8 L35.0 62.6 L30.0 63.5 L18.0 68.7 L11.0 73.5 L6.9 78.0 L7.0 79.0 L5.8 80.0 L3.9 85.0 Z";
const BOTTOM = "M3.7 127.0 L5.0 129.0 L4.7 132.0 L8.0 137.5 L14.0 143.5 L15.0 143.6 L20.0 147.1 L27.0 150.4 L37.0 153.5 L47.0 155.4 L58.0 156.4 L67.0 156.4 L77.0 155.4 L90.0 152.4 L98.0 149.4 L106.0 145.3 L113.0 139.5 L115.4 137.0 L118.3 131.0 L118.3 115.0 L115.4 109.0 L113.0 106.5 L106.0 100.7 L98.0 96.6 L90.0 93.6 L77.0 90.6 L67.0 89.6 L58.0 89.6 L47.0 90.6 L37.0 92.5 L27.0 95.6 L20.0 98.9 L15.0 102.4 L14.0 102.5 L8.0 108.5 L4.7 114.0 L5.0 117.0 L3.7 119.0 Z";

const INK = "#000";
const RIM = "#4a4a4a";
/** White halo that cuts the gap into the coins below (drawn under the coin, above lower coins). */
const GAP = { fill: "var(--background)", stroke: "var(--background)", strokeWidth: 30, strokeLinejoin: "round" } as const;

type CoinProps = {
  name: "top" | "middle" | "bottom";
  d: string;
  gap: boolean;
  ring: { cx: number; cy: number; rx: number; ry: number };
};

function Coin({ name, d, gap, ring }: CoinProps) {
  return (
    <g className={`logo-coin logo-coin-${name}`}>
      {gap && <path d={d} {...GAP} />}
      <path className="logo-rim" d={d} fill={RIM} />
      <path d={d} fill={INK} />
      <g className="logo-detail">
        <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} fill="none" stroke={RIM} strokeWidth={6} />
        <path
          d={`M${ring.cx - ring.rx * 0.55} ${ring.cy - ring.ry * 0.45} q${ring.rx * 0.25} ${-ring.ry * 0.4} ${ring.rx * 0.6} ${-ring.ry * 0.42}`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.55}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

export function AnimatedLogoMark({ className }: { className?: string }) {
  return (
    <span className={`logo-anim relative inline-block ${className ?? ""}`}>
      <Image src={logoWordmark} alt="Paidlyo" priority className="h-7 w-auto" />
      <svg
        viewBox="0 0 845 190"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <Coin name="bottom" d={BOTTOM} gap={false} ring={{ cx: 61, cy: 123, rx: 42, ry: 16 }} />
        <g className="logo-lift-middle">
          <Coin name="middle" d={MIDDLE} gap ring={{ cx: 71.5, cy: 87, rx: 50, ry: 17 }} />
        </g>
        <g className="logo-lift-top">
          <Coin name="top" d={TOP} gap ring={{ cx: 86, cy: 50, rx: 40, ry: 15 }} />
          {/* The coin's side, shown over the squashed face while it's edge-on mid-flip. */}
          <rect className="logo-edge" x={33} y={41} width={106} height={18} rx={9} fill={RIM} stroke={INK} strokeWidth={5} />
        </g>
      </svg>
    </span>
  );
}
