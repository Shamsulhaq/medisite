// -----------------------------------------------------------------------------
// Safe markdown renderer. Parses a limited markdown subset into React elements.
// It NEVER uses dangerouslySetInnerHTML, so stored content cannot inject HTML.
// Supported:
//   # / ## / ### headings, paragraphs, blank-line separation
//   - or * bullet lists, 1. ordered lists
//   > blockquotes
//   **bold**, *italic* / _italic_, `code`, [label](url) (url scheme-checked)
// -----------------------------------------------------------------------------

import React from "react";
import Link from "next/link";

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string };

const SPECIAL_LINE = /^(#{1,4}\s+|>\s?|[-*]\s+|\d+\.\s+)/;

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !SPECIAL_LINE.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

// Only allow safe URL schemes; anything else becomes a harmless anchor.
function safeUrl(url: string): string {
  const u = url.trim();
  if (
    u.startsWith("/") ||
    u.startsWith("#") ||
    /^https?:\/\//i.test(u) ||
    /^mailto:/i.test(u) ||
    /^tel:/i.test(u)
  ) {
    return u;
  }
  return "#";
}

type InlinePattern = {
  type: "image" | "link" | "bold" | "code" | "italic";
  re: RegExp;
};

const INLINE_PATTERNS: InlinePattern[] = [
  { type: "image", re: /!\[([^\]]*)\]\(([^)\s]+)\)/ },
  { type: "link", re: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { type: "bold", re: /\*\*([^*]+)\*\*/ },
  { type: "code", re: /`([^`]+)`/ },
  { type: "italic", re: /\*([^*]+)\*|_([^_]+)_/ },
];

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Find the earliest-matching inline pattern.
  let earliest: {
    index: number;
    length: number;
    node: React.ReactNode;
  } | null = null;

  for (const { type, re } of INLINE_PATTERNS) {
    const m = re.exec(text);
    if (!m) continue;
    if (earliest && m.index >= earliest.index) continue;

    const key = `${keyPrefix}-${type}-${m.index}`;
    let node: React.ReactNode;
    if (type === "image") {
      const src = safeUrl(m[2]);
      node =
        src === "#" ? (
          <span key={key}>{m[1]}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={src}
            alt={m[1] || ""}
            className="my-4 max-w-full rounded-lg ring-1 ring-slate-200"
          />
        );
    } else if (type === "link") {
      const href = safeUrl(m[2]);
      const external = /^https?:\/\//i.test(href);
      node = external ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline hover:text-brand-dark"
        >
          {m[1]}
        </a>
      ) : (
        <Link
          key={key}
          href={href}
          className="text-brand underline hover:text-brand-dark"
        >
          {m[1]}
        </Link>
      );
    } else if (type === "bold") {
      node = (
        <strong key={key} className="font-semibold text-ink">
          {m[1]}
        </strong>
      );
    } else if (type === "code") {
      node = (
        <code
          key={key}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800"
        >
          {m[1]}
        </code>
      );
    } else {
      node = <em key={key}>{m[1] ?? m[2]}</em>;
    }

    earliest = { index: m.index, length: m[0].length, node };
  }

  if (!earliest) return [text];

  const before = text.slice(0, earliest.index);
  const after = text.slice(earliest.index + earliest.length);
  return [
    ...(before ? [before] : []),
    earliest.node,
    ...parseInline(after, `${keyPrefix}-x`),
  ];
}

export default function Markdown({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className={`prose-content ${className}`}>
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        switch (block.type) {
          case "heading": {
            const cls =
              block.level <= 2
                ? "mt-8 mb-3 text-xl font-bold text-ink sm:text-2xl"
                : "mt-6 mb-2 text-lg font-bold text-ink";
            if (block.level <= 2) {
              return (
                <h2 key={key} className={cls}>
                  {parseInline(block.text, key)}
                </h2>
              );
            }
            return (
              <h3 key={key} className={cls}>
                {parseInline(block.text, key)}
              </h3>
            );
          }
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-6 border-l-4 border-brand bg-brand-light/40 px-5 py-4 text-lg italic text-ink"
              >
                {parseInline(block.text, key)}
              </blockquote>
            );
          case "ul":
            return (
              <ul
                key={key}
                className="my-4 list-disc space-y-2 pl-6 marker:text-brand"
              >
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{parseInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={key}
                className="my-4 list-decimal space-y-2 pl-6 marker:text-brand"
              >
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{parseInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case "p":
          default:
            return <p key={key}>{parseInline(block.text, key)}</p>;
        }
      })}
    </div>
  );
}
