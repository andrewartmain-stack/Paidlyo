import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { HERO, SITE } from "@/content/landing";

// Social share image for the marketing pages (generated at build time).
export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at build time (module scope), so the image is prerendered instead of per request.
const logo = await readFile(join(process.cwd(), "public/logo.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          color: "#0e0f0c",
        }}
      >
        <img src={logoSrc} alt="" height={64} style={{ height: 64, width: "auto" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              background: "#e2f6d5",
              color: "#163300",
              fontSize: 28,
            }}
          >
            {HERO.eyebrow}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5, maxWidth: 980 }}>
            {SITE.tagline}
          </div>
        </div>
        <div style={{ display: "flex", height: 16, borderRadius: 999, background: "#9fe870", width: 240 }} />
      </div>
    ),
    size,
  );
}
