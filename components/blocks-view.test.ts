import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import path from "node:path";
import { createElement, type FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// jiti can't transform .tsx, so compile the component with TypeScript and load it in place.
const file = path.join(__dirname, "blocks-view.tsx");
const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const mod = new Module(file) as Module & { _compile(code: string, filename: string): void; paths: string[] };
mod.paths = (Module as unknown as { _nodeModulePaths(dir: string): string[] })._nodeModulePaths(path.dirname(file));
mod._compile(outputText, file);
const { BlocksView } = mod.exports as { BlocksView: FC<{ blocks: unknown[] }> };

const t = (text: string, styles = {}) => ({ type: "text", text, styles });

test("renders BlockNote JSON as safe HTML", () => {
  const html = renderToStaticMarkup(
    createElement(BlocksView, {
      blocks: [
        { type: "heading", props: { level: 2 }, content: [t("Title")] },
        { type: "paragraph", content: [t("a "), t("bold", { bold: true }), { type: "link", href: "javascript:alert(1)", content: [t("bad")] }] },
        { type: "paragraph", content: [t("<script>alert(1)</script>")] },
        { type: "bulletListItem", content: [t("one")] },
        { type: "bulletListItem", content: [t("two")] },
        { type: "image", props: { url: "https://x.test/a.png", previewWidth: 320, caption: "cap" } },
        { type: "image", props: { url: "javascript:alert(1)" } },
        { type: "mystery", content: [t("skip me")] },
      ],
    }),
  );
  assert.match(html, /<h2[^>]*>.*Title.*<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.equal((html.match(/<ul/g) ?? []).length, 1, "consecutive list items share one <ul>");
  assert.match(html, /<li[^>]*>.*one.*<\/li><li[^>]*>.*two/);
  assert.match(html, /<img src="https:\/\/x.test\/a.png" alt="cap" style="width:320px"/);
  assert.ok(!html.includes("javascript:"), "unsafe URLs are dropped");
  assert.ok(!html.includes("<script>"), "text is escaped");
  assert.ok(!html.includes("skip me"), "unknown blocks are skipped");
});
