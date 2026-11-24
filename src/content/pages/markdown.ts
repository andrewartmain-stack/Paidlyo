/*
 * The small Markdown subset used in page text (section `body`, and inline in paragraphs, card
 * texts, FAQ answers and callouts). Pure functions: rendered by components/marketing/rich-text.tsx.
 *
 *   **bold**                     [anchor text](/invoicing/online) or (https://…)
 *   - item / * item              1. item
 *   > "Quote" — Name, Company    | Plan | Price |  (first row = header; |---| rows are skipped)
 *   ### Subheading               blank line = new paragraph
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "paragraph"; content: Inline[] }
  | { type: "heading"; content: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; content: Inline[]; cite?: string }
  | { type: "table"; head: Inline[][]; rows: Inline[][][] };

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** `**bold**` and `[text](href)`; bold may contain links and link text may be bold. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", text: text.slice(last, index) });
    if (match[1] !== undefined) out.push({ type: "bold", children: parseInline(match[1]) });
    else out.push({ type: "link", href: match[3], children: parseInline(match[2]) });
    last = index + match[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

const LIST_ITEM = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-*:?\s*\|?\s*$/;

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => parseInline(cell.trim()));

/** "Text" — Name, Company → the quote and who said it. */
function splitQuote(text: string): { content: Inline[]; cite?: string } {
  const match = text.match(/^(.*\S)\s+[—–]\s+(.+)$/);
  const quote = (match ? match[1] : text).trim().replace(/^["“](.*)["”]$/, "$1");
  return { content: parseInline(quote), ...(match && { cite: match[2].trim() }) };
}

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (/^\s*#{2,4}\s+/.test(line)) {
      blocks.push({ type: "heading", content: parseInline(line.replace(/^\s*#{2,4}\s+/, "").trim()) });
      i++;
    } else if (LIST_ITEM.test(line)) {
      const ordered = Boolean(line.match(LIST_ITEM)?.[2]);
      const items: Inline[][] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        items.push(parseInline((lines[i].match(LIST_ITEM)?.[3] ?? "").trim()));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
    } else if (/^\s*>/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) parts.push(lines[i++].replace(/^\s*>\s?/, "").trim());
      blocks.push({ type: "quote", ...splitQuote(parts.join(" ")) });
    } else if (TABLE_ROW.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++]);
      const [head, ...body] = rows.filter((row) => !TABLE_RULE.test(row));
      blocks.push({ type: "table", head: cells(head), rows: body.map(cells) });
    } else {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim() && !LIST_ITEM.test(lines[i]) && !/^\s*(>|#{2,4}\s|\|)/.test(lines[i])) parts.push(lines[i++].trim());
      blocks.push({ type: "paragraph", content: parseInline(parts.join(" ")) });
    }
  }
  return blocks;
}

/** Text without Markdown, for structured data and other plain-text uses. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*(#{2,4}|>|[-*]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Link targets that are neither an internal path (/…) nor an https URL. */
export function invalidLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map((match) => match[1]).filter((href) => !/^(\/|https:\/\/)/.test(href));
}

/** True for an https link, or an internal link (ignoring #anchors and ?query) to a path in `linkable`. */
export function isLinkable(href: string, linkable: Set<string>): boolean {
  if (href.startsWith("https://")) return true;
  const path = href.split(/[?#]/)[0] || "/";
  return href.startsWith("/") && linkable.has(path);
}
