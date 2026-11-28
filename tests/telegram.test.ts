import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { sendTelegram, signupMessage } = await import("@/lib/telegram");

describe("signup alert message", () => {
  it("lists the lead's details", () => {
    expect(
      signupMessage({ email: "jane@agency.com", name: "Jane Smith", workspace: "Smith Creative", currency: "USD", timezone: "Europe/London", provider: "google" }),
    ).toBe(
      "🎉 New Paidlyo signup\nEmail: jane@agency.com\nName: Jane Smith\nWorkspace: Smith Creative\nCurrency: USD · Timezone: Europe/London\nSigned up with: Google",
    );
  });

  it("leaves out missing name and provider", () => {
    expect(signupMessage({ email: "a@b.co", workspace: "W", currency: "EUR", timezone: "UTC" })).toBe(
      "🎉 New Paidlyo signup\nEmail: a@b.co\nWorkspace: W\nCurrency: EUR · Timezone: UTC",
    );
  });
});

describe("sendTelegram", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing when the bot isn't configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendTelegram("hi")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the message to the owner's chat", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "42");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendTelegram("hi")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    expect(JSON.parse(init.body)).toMatchObject({ chat_id: "42", text: "hi" });
  });

  it("never throws when Telegram is unreachable", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "42");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendTelegram("hi")).toBe(false);
  });
});
