import Link from "next/link";
import { Quote } from "lucide-react";
import { linkablePaths } from "@/content/pages/cards";
import { isLinkable, parseBlocks, parseInline, type Block, type Inline } from "@/content/pages/markdown";
import { cn } from "@/lib/utils";

/*
 * Renders page text written in the Markdown subset of content/pages/markdown.ts. Server
 * components: links to pages that aren't published yet render as plain text, never as a 404.
 */

function Inlines({ nodes, linkable }: { nodes: Inline[]; linkable: Set<string> }) {
  return nodes.map((node, i) => {
    if (node.type === "text") return node.text;
    if (node.type === "bold") {
      return (
        <strong key={i} className="font-semibold text-foreground">
          <Inlines nodes={node.children} linkable={linkable} />
        </strong>
      );
    }
    const children = <Inlines nodes={node.children} linkable={linkable} />;
    if (!isLinkable(node.href, linkable)) return <span key={i}>{children}</span>;
    const className = "font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";
    return node.href.startsWith("/") ? (
      <Link key={i} href={node.href} className={className}>
        {children}
      </Link>
    ) : (
      <a key={i} href={node.href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    );
  });
}

/** One line of text with **bold** and links (card texts, FAQ answers, callouts). */
export async function InlineText({ text }: { text: string }) {
  const linkable = await linkablePaths();
  return <Inlines nodes={parseInline(text)} linkable={linkable} />;
}

function BlockView({ block, linkable, muted }: { block: Block; linkable: Set<string>; muted: boolean }) {
  const body = muted ? "text-muted-foreground" : "text-foreground";
  switch (block.type) {
    case "paragraph":
      return (
        <p className={cn("text-lg leading-relaxed", body)}>
          <Inlines nodes={block.content} linkable={linkable} />
        </p>
      );
    case "heading":
      return (
        <h3 className="pt-2 text-xl font-semibold">
          <Inlines nodes={block.content} linkable={linkable} />
        </h3>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={cn("flex flex-col gap-2 pl-6 text-lg leading-relaxed marker:text-brand", block.ordered ? "list-decimal marker:font-semibold" : "list-disc", body)}>
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <Inlines nodes={item} linkable={linkable} />
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <figure className="my-2 flex flex-col gap-3 rounded-3xl bg-cream px-7 py-6">
          <Quote className="size-7 text-brand" aria-hidden />
          <blockquote className="font-heading text-xl leading-snug text-foreground sm:text-2xl">
            <Inlines nodes={block.content} linkable={linkable} />
          </blockquote>
          {block.cite && <figcaption className="text-sm text-muted-foreground">{block.cite}</figcaption>}
        </figure>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[28rem] text-left text-base">
            <thead className="bg-muted/60">
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col" className="px-4 py-3 text-sm font-semibold">
                    <Inlines nodes={cell} linkable={linkable} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className={cn("px-4 py-3 tabular-nums", c === 0 ? "font-medium" : "text-muted-foreground")}>
                      <Inlines nodes={cell} linkable={linkable} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** A section body: paragraphs, subheadings, lists, quotes and tables. */
export async function RichText({ text, muted = true }: { text: string; muted?: boolean }) {
  const linkable = await linkablePaths();
  return (
    <div className="flex flex-col gap-5">
      {parseBlocks(text).map((block, i) => (
        <BlockView key={i} block={block} linkable={linkable} muted={muted} />
      ))}
    </div>
  );
}
