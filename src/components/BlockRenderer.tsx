/* Read-only renderer for BlockNote block JSON (shared notes + print view). */
type Inline = {
  type?: string;
  text?: string;
  styles?: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; code?: boolean };
  href?: string;
  content?: Inline[];
};
type Block = {
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: Block[];
};

function Inlines({ content }: { content: unknown }) {
  if (typeof content === "string") return <>{content}</>;
  if (!Array.isArray(content)) return null;
  return (
    <>
      {content.map((c: Inline, i: number) => {
        if (c.type === "link") {
          return (
            <a key={i} href={c.href} className="text-indigo-600 underline" target="_blank" rel="noreferrer">
              <Inlines content={c.content} />
            </a>
          );
        }
        const s = c.styles ?? {};
        const cls = [
          s.bold ? "font-semibold" : "",
          s.italic ? "italic" : "",
          s.underline ? "underline" : "",
          s.strike ? "line-through" : "",
          s.code ? "rounded bg-slate-100 px-1 font-mono text-[0.85em]" : "",
        ].join(" ");
        return (
          <span key={i} className={cls || undefined}>
            {c.text ?? ""}
          </span>
        );
      })}
    </>
  );
}

function BlockView({ block, depth }: { block: Block; depth: number }) {
  const inner = (
    <>
      <Inlines content={block.content} />
      {Array.isArray(block.children) && block.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {block.children.map((ch, i) => (
            <BlockView key={i} block={ch} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
  const indent = depth > 0 ? { marginLeft: depth * 20 } : undefined;
  switch (block.type) {
    case "heading": {
      const lvl = Math.min(3, Math.max(1, Number(block.props?.level ?? 1)));
      const cls = lvl === 1 ? "mt-5 text-2xl font-bold" : lvl === 2 ? "mt-4 text-xl font-bold" : "mt-3 text-lg font-semibold";
      return <div style={indent} className={cls}>{inner}</div>;
    }
    case "bulletListItem":
      return (
        <div style={indent} className="flex gap-2">
          <span aria-hidden>•</span>
          <div className="min-w-0 flex-1">{inner}</div>
        </div>
      );
    case "numberedListItem":
      return (
        <div style={indent} className="flex gap-2">
          <span aria-hidden>1.</span>
          <div className="min-w-0 flex-1">{inner}</div>
        </div>
      );
    case "checkListItem":
      return (
        <div style={indent} className="flex items-start gap-2">
          <input type="checkbox" checked={!!block.props?.checked} readOnly className="mt-1.5" />
          <div className="min-w-0 flex-1">{inner}</div>
        </div>
      );
    case "quote":
      return <blockquote style={indent} className="border-l-4 border-slate-300 pl-3 italic text-slate-600">{inner}</blockquote>;
    case "image": {
      const url = typeof block.props?.url === "string" ? block.props.url : "";
      // eslint-disable-next-line @next/next/no-img-element
      return url ? <img src={url} alt={typeof block.props?.caption === "string" ? block.props.caption : ""} className="max-w-full rounded" style={indent} /> : null;
    }
    default:
      return <p style={indent} className="leading-relaxed">{inner}</p>;
  }
}

export function BlockRenderer({ blocks }: { blocks: unknown }) {
  if (!Array.isArray(blocks) || !blocks.length) {
    return <p className="text-slate-400">This note is empty.</p>;
  }
  return (
    <div className="space-y-2 text-slate-800">
      {(blocks as Block[]).map((b, i) => (
        <BlockView key={i} block={b} depth={0} />
      ))}
    </div>
  );
}
