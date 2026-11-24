/**
 * Icons a content card can show (the `icon` column in the CSV, a picker in the Studio). A fixed
 * list keeps every icon in the site's style; components/marketing/card-icon.tsx maps them to
 * lucide icons. No imports here: the Studio reads this file too.
 */
export const CARD_ICONS = [
  "clock",
  "timer",
  "calendar",
  "invoice",
  "receipt",
  "wallet",
  "money",
  "percent",
  "chart",
  "budget",
  "users",
  "user",
  "building",
  "briefcase",
  "folder",
  "check",
  "alert",
  "idea",
  "link",
  "import",
  "export",
  "lock",
  "globe",
  "mail",
  "search",
] as const;

export type CardIconKey = (typeof CARD_ICONS)[number];
