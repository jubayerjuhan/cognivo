/* Extracts plain text from BlockNote JSON blocks (for sending to the AI). */
type Inline = { type?: string; text?: string; content?: Inline[] | string };
type Block = { type?: string; content?: unknown; children?: Block[]; props?: Record<string, unknown> };

function inlineText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: Inline) => (typeof c.text === "string" ? c.text : inlineText(c.content)))
      .join("");
  }
  // Tables: { type: "tableContent", rows: [{ cells: [...] }] }
  const table = content as { rows?: { cells: unknown[] }[] };
  if (Array.isArray(table.rows)) {
    return table.rows
      .map((r) =>
        r.cells
          .map((cell) => inlineText((cell as { content?: unknown }).content ?? cell))
          .join(" | ")
      )
      .join("\n");
  }
  return "";
}

export function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  const lines: string[] = [];
  const walk = (list: Block[], depth: number) => {
    for (const b of list) {
      const text = inlineText(b.content);
      if (text) lines.push("  ".repeat(depth) + (b.type === "bulletListItem" ? "- " : "") + text);
      if (Array.isArray(b.children)) walk(b.children, depth + 1);
    }
  };
  walk(blocks as Block[], 0);
  return lines.join("\n");
}
