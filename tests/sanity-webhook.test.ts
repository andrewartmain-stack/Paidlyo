import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidSanitySignature, signSanityPayload } from "@/lib/sanity-webhook";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const { POST } = await import("@/app/api/webhooks/sanity/route");

const SECRET = "test-secret";
const send = (body: string, signature: string | null) =>
  POST(new Request("https://paidlyo.com/api/webhooks/sanity", { method: "POST", body, headers: signature ? { "sanity-webhook-signature": signature } : {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  revalidateTag.mockReset();
  revalidatePath.mockReset();
});

describe("Sanity webhook signature", () => {
  it("accepts its own signature and rejects tampering", () => {
    const body = JSON.stringify({ _type: "guidePage" });
    const header = signSanityPayload(body, SECRET, 1764000000000);
    expect(header).toMatch(/^t=1764000000000,v1=[\w-]+$/);
    expect(isValidSanitySignature(body, header, SECRET)).toBe(true);
    expect(isValidSanitySignature(`${body} `, header, SECRET)).toBe(false);
    expect(isValidSanitySignature(body, header, "other")).toBe(false);
    expect(isValidSanitySignature(body, null, SECRET)).toBe(false);
    expect(isValidSanitySignature(body, "v1=abc", SECRET)).toBe(false);
  });
});

describe("POST /api/webhooks/sanity", () => {
  it("refuses requests while the secret isn't set", async () => {
    expect((await send("{}", null)).status).toBe(500);
  });

  it("rejects unsigned requests without revalidating", async () => {
    vi.stubEnv("SANITY_WEBHOOK_SECRET", SECRET);
    expect((await send(JSON.stringify({ _type: "guidePage" }), "t=1,v1=nope")).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the page type of a signed event", async () => {
    vi.stubEnv("SANITY_WEBHOOK_SECRET", SECRET);
    const body = JSON.stringify({ _type: "guidePage", slug: "track-time" });
    const response = await send(body, signSanityPayload(body, SECRET, Date.now()));
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("cms:guide", { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("ignores documents that aren't pages", async () => {
    vi.stubEnv("SANITY_WEBHOOK_SECRET", SECRET);
    const body = JSON.stringify({ _type: "sanity.imageAsset" });
    expect(await (await send(body, signSanityPayload(body, SECRET, Date.now()))).json()).toMatchObject({ ignored: "sanity.imageAsset" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
