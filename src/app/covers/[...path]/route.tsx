import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { allPageCards } from "@/content/pages/cards";
import { COVER_SIZE } from "@/content/pages/covers";

/*
 * Generated cover of a programmatic page: /covers/invoicing/online is the cover of
 * /invoicing/online. Used on cards linking to the page and as its share image whenever no cover
 * was uploaded in Sanity (content/pages/covers.ts). Unknown pages 404.
 */

const logo = await readFile(join(process.cwd(), "public/logo.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
// PNG header: width and height at bytes 16–23. The image renderer needs both to keep proportions.
const LOGO_HEIGHT = 60;
const logoWidth = Math.round((logo.readUInt32BE(16) / logo.readUInt32BE(20)) * LOGO_HEIGHT);

/** Long titles get a smaller font so they fit in three lines. */
const headlineSize = (text: string) => (text.length <= 36 ? 104 : text.length <= 60 ? 88 : 72);

export async function GET(_request: Request, { params }: RouteContext<"/covers/[...path]">) {
  const { path } = await params;
  const page = (await allPageCards()).get(`/${path.join("/")}`);
  if (!page) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#fbfaf5",
          color: "#0e0f0c",
        }}
      >
        <div style={{ position: "absolute", top: -380, right: -260, width: 760, height: 760, borderRadius: 999, background: "#9fe870" }} />
        <div style={{ position: "absolute", bottom: -180, right: 120, width: 360, height: 360, borderRadius: 999, background: "#e2f6d5" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            // Keep text inside the middle band: social previews crop 16:10 to about 1.91:1.
            padding: "150px 110px",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain <img>; next/image can't render here */}
          <img src={logoSrc} alt="" width={logoWidth} height={LOGO_HEIGHT} style={{ width: logoWidth, height: LOGO_HEIGHT }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1120 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 26px",
                borderRadius: 999,
                background: "#163300",
                color: "#e2f6d5",
                fontSize: 32,
              }}
            >
              {page.label}
            </div>
            <div style={{ fontSize: headlineSize(page.headline), fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>{page.headline}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", height: 14, width: 200, borderRadius: 999, background: "#9fe870" }} />
            <div style={{ fontSize: 30, color: "#454745" }}>paidlyo.com</div>
          </div>
        </div>
      </div>
    ),
    {
      ...COVER_SIZE,
      // Covers change only when a title changes: cache a day at the edge, refresh in the background.
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
