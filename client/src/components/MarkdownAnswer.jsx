import React from "react";

// Small, deliberately safe Markdown renderer for interview solutions. It
// creates React text nodes instead of injecting HTML, so raw HTML in an answer
// is displayed as text and cannot execute in the student's browser.
const inlineToken = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function renderInline(text, keyPrefix) {
  return text.split(inlineToken).filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={key} className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[0.9em]">{token.slice(1, -1)}</code>;
    }
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) {
      try {
        const url = new URL(link[2]);
        if (url.protocol === "http:" || url.protocol === "https:") {
          return <a key={key} href={url.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">{link[1]}</a>;
        }
      } catch { /* Render malformed links as text. */ }
    }
    return <React.Fragment key={key}>{token}</React.Fragment>;
  });
}

function parseBlocks(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const fence = line.match(/^\s*```([\w+-]*)\s*$/);
    if (fence) {
      flushParagraph();
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language: fence[1], text: code.join("\n") });
      continue;
    }
    const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }
    const listItem = line.match(/^\s*([-*+] |\d+\. )(.+)$/);
    if (listItem) {
      flushParagraph();
      const ordered = /^\d/.test(listItem[1]);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*([-*+] |\d+\. )(.+)$/);
        if (!match || /^\d/.test(match[1]) !== ordered) break;
        items.push(match[2]);
        index += 1;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }
    paragraph.push(line.trim());
    index += 1;
  }
  flushParagraph();
  return blocks;
}

export default function MarkdownAnswer({ value }) {
  const blocks = parseBlocks(value);
  return <div className="space-y-3 text-sm leading-6 text-gray-700">
    {blocks.map((block, index) => {
      if (block.type === "code") return <pre key={index} className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-5 text-gray-100"><code>{block.text}</code></pre>;
      if (block.type === "heading") {
        const Tag = `h${block.level + 2}`;
        return <Tag key={index} className="font-bold text-gray-900">{renderInline(block.text, `h-${index}`)}</Tag>;
      }
      if (block.type === "ul" || block.type === "ol") {
        const Tag = block.type;
        return <Tag key={index} className={`${block.type === "ul" ? "list-disc" : "list-decimal"} space-y-1 pl-6`}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `l-${index}-${itemIndex}`)}</li>)}</Tag>;
      }
      return <p key={index}>{renderInline(block.text, `p-${index}`)}</p>;
    })}
  </div>;
}
