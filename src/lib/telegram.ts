import "server-only";

/*
 * Owner alerts through a Telegram bot (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID; server-only).
 * Not configured → does nothing. Never throws: an alert must never break the user's request.
 */

const TIMEOUT_MS = 5000;

export type SignupAlert = {
  email: string;
  name?: string | null;
  workspace: string;
  currency: string;
  timezone: string;
  provider?: string | null;
};

const PROVIDERS: Record<string, string> = { email: "Email", google: "Google" };

/** Plain-text message for a new workspace owner. */
export function signupMessage(alert: SignupAlert): string {
  const provider = alert.provider ? (PROVIDERS[alert.provider] ?? alert.provider) : null;
  return [
    "🎉 New Paidlyo signup",
    `Email: ${alert.email}`,
    alert.name ? `Name: ${alert.name}` : null,
    `Workspace: ${alert.workspace}`,
    `Currency: ${alert.currency} · Timezone: ${alert.timezone}`,
    provider ? `Signed up with: ${provider}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Sends `text` to the owner's chat. Returns whether Telegram accepted it. */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) console.error("Telegram alert failed", response.status);
    return response.ok;
  } catch (error) {
    console.error("Telegram alert failed", error instanceof Error ? error.message : error);
    return false;
  }
}
