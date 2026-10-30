import type { CSSProperties, ReactNode } from "react";

// Renders BlockNote's saved JSON as plain React on the server: no editor, no jsdom.
// React escapes all text; links and media only accept safe URLs. Unknown block types are skipped.

type Styles = Partial<Record<"bold" | "italic" | "underline" | "strike" | "code", boolean>> & {
  textColor?: string;
  backgroundColor?: string;
};
type Inline =
  | { type: "text"; text: string; styles?: Styles }
  | { type: "link"; href: string; content: Inline[] }
  | { type: string; [k: string]: unknown };
type Cell = Inline[] | { type: "tableCell"; content: Inline[] };
type Block = {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: Inline[] | { type: "tableContent"; rows: { cells: Cell[] }[]; headerRows?: number };
  children?: Block[];
};

// BlockNote's named colours (light-mode values).
const COLORS: Record<string, { text: string; background: string }> = {
  gray: { text: "#9b9a97", background: "#ebeced" },
  brown: { text: "#64473a", background: "#e9e5e3" },
  red: { text: "#e03e3e", background: "#fbe4e4" },
  orange: { text: "#d9730d", background: "#f6e9d9" },
  yellow: { text: "#dfab01", background: "#fbf3db" },
  green: { text: "#4d6461", background: "#ddedea" },
  blue: { text: "#0b6e99", background: "#ddebf1" },
  purple: { text: "#6940a5", background: "#eae4f2" },
  pink: { text: "#ad1a72", background: "#f4dfeb" },
};

export function safeUrl(url: unknown, allowMailto = false): string | undefined {
  if (typeof url !== "string") return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" || (allowMailto && protocol === "mailto:") ? url : undefined;
  } catch {
    return undefined;
  }
}

function colorStyle(text?: unknown, background?: unknown): CSSProperties | undefined {
  const t = typeof text === "string" ? COLORS[text]?.text : undefined;
  const b = typeof background === "string" ? COLORS[background]?.background : undefined;
  return t || b ? { color: t, backgroundColor: b } : undefined;
}

function renderInline(items: Inline[] | undefined): ReactNode {
  return (items ?? []).map((item, i) => {
    if (item.type === "link") {
      const link = item as Extract<Inline, { type: "link" }>;
      const href = safeUrl(link.href, true);
      const inner = renderInline(link.content);
      return href ? (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        <span key={i}>{inner}</span>
      );
    }
    if (item.type !== "text") return null;
    const { text, styles = {} } = item as Extract<Inline, { type: "text" }>;
    let node: ReactNode = text;
    if (styles.code) node = <code>{node}</code>;
    if (styles.bold) node = <strong>{node}</strong>;
    if (styles.italic) node = <em>{node}</em>;
    if (styles.underline) node = <u>{node}</u>;
    if (styles.strike) node = <s>{node}</s>;
    const style = colorStyle(styles.textColor, styles.backgroundColor);
    return style ? <span key={i} style={style}>{node}</span> : <span key={i}>{node}</span>;
  });
}

const ALIGN: Record<string, CSSProperties["textAlign"]> = { left: "left", center: "center", right: "right", justify: "justify" };
const LIST_TYPES = new Set(["bulletListItem", "numberedListItem", "checkListItem"]);

/** Groups consecutive list items so they share one <ul>/<ol>. */
export function groupBlocks(blocks: Block[]): (Block | Block[])[] {
  const out: (Block | Block[])[] = [];
  for (const b of blocks) {
    const last = out.at(-1);
    if (LIST_TYPES.has(b.type) && Array.isArray(last) && last[0].type === b.type) last.push(b);
    else out.push(LIST_TYPES.has(b.type) ? [b] : b);
  }
  return out;
}

function Children({ blocks }: { blocks?: Block[] }) {
  return blocks?.length ? <div className="ml-6">{renderBlocks(blocks)}</div> : null;
}

function renderList(items: Block[], key: number) {
  const type = items[0].type;
  const lis = items.map((b, i) => (
    <li key={b.id ?? i} style={colorStyle(b.props?.textColor, b.props?.backgroundColor)}>
      {type === "checkListItem" && <input type="checkbox" checked={b.props?.checked === true} readOnly disabled className="mr-2 align-middle" />}
      {renderInline(b.content as Inline[])}
      <Children blocks={b.children} />
    </li>
  ));
  if (type === "numberedListItem") {
    const start = Number(items[0].props?.start) || undefined;
    return <ol key={key} start={start}>{lis}</ol>;
  }
  return <ul key={key} className={type === "checkListItem" ? "list-none pl-0" : undefined}>{lis}</ul>;
}

function Media({ b }: { b: Block }) {
  const p = b.props ?? {};
  const url = safeUrl(p.url);
  if (!url) return null;
  const caption = typeof p.caption === "string" && p.caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{p.caption}</figcaption> : null;
  const width = typeof p.previewWidth === "number" ? Math.max(48, p.previewWidth) : undefined;
  const align = p.textAlignment === "center" ? "mx-auto" : p.textAlignment === "right" ? "ml-auto" : "";
  const name = typeof p.name === "string" && p.name ? p.name : "";
  const media =
    b.type === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={typeof p.caption === "string" && p.caption ? p.caption : name} style={{ width }} className={`max-w-full ${align}`} />
    ) : b.type === "video" ? (
      <video src={url} controls style={{ width }} className={`max-w-full ${align}`} />
    ) : b.type === "audio" ? (
      <audio src={url} controls className="w-full" />
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer">{name || url}</a>
    );
  return (
    <figure className="my-6" style={{ textAlign: ALIGN[String(p.textAlignment)] }}>
      <div className={b.type === "image" || b.type === "video" ? "flex" : undefined}>{media}</div>
      {caption}
    </figure>
  );
}

function renderBlock(b: Block, key: number): ReactNode {
  const p = b.props ?? {};
  const style: CSSProperties = { ...colorStyle(p.textColor, p.backgroundColor), textAlign: ALIGN[String(p.textAlignment)] };
  const inline = renderInline(Array.isArray(b.content) ? (b.content as Inline[]) : undefined);
  switch (b.type) {
    case "paragraph":
      return <div key={key}><p style={style}>{inline}</p><Children blocks={b.children} /></div>;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(p.level) || 1));
      const H = `h${level}` as "h1";
      return p.isToggleable ? (
        <details key={key}>
          <summary><H style={{ ...style, display: "inline" }}>{inline}</H></summary>
          <Children blocks={b.children} />
        </details>
      ) : (
        <div key={key}><H style={style}>{inline}</H><Children blocks={b.children} /></div>
      );
    }
    case "toggleListItem":
      return (
        <details key={key} style={style}>
          <summary>{inline}</summary>
          <Children blocks={b.children} />
        </details>
      );
    case "quote":
      return <blockquote key={key} style={style}>{inline}</blockquote>;
    case "codeBlock":
      return <pre key={key}><code>{(Array.isArray(b.content) ? b.content : []).map((t) => ("text" in t ? String(t.text) : "")).join("")}</code></pre>;
    case "divider":
      return <hr key={key} />;
    case "image":
    case "video":
    case "audio":
    case "file":
      return <Media key={key} b={b} />;
    case "table": {
      const t = b.content && !Array.isArray(b.content) && b.content.type === "tableContent" ? b.content : null;
      if (!t) return null;
      const headerRows = t.headerRows ?? 0;
      return (
        <table key={key}>
          <tbody>
            {t.rows.map((row, r) => (
              <tr key={r}>
                {row.cells.map((cell, c) => {
                  const content = Array.isArray(cell) ? cell : cell.content;
                  return r < headerRows ? <th key={c}>{renderInline(content)}</th> : <td key={c}>{renderInline(content)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default:
      return null;
  }
}

function renderBlocks(blocks: Block[]): ReactNode {
  return groupBlocks(blocks).map((g, i) => (Array.isArray(g) ? renderList(g, i) : renderBlock(g, i)));
}

export function BlocksView({ blocks }: { blocks: unknown[] }) {
  return <div className="post-blocks">{renderBlocks(blocks as Block[])}</div>;
}
