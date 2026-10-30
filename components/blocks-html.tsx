import "server-only";
import "@blocknote/core/style.css";
import type { PartialBlock } from "@blocknote/core";

// Renders block-editor posts to static HTML on the server, so readers don't load the editor.
// Only the owner can write content (RLS), and BlockNote escapes text when serializing.
export async function BlocksHtml({ blocks }: { blocks: unknown[] }) {
  try {
    const { ServerBlockNoteEditor } = await import("@blocknote/server-util");
    const html = await ServerBlockNoteEditor.create().blocksToFullHTML(blocks as PartialBlock[]);
    return <div className="bn-container bn-default-styles post-blocks" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    // TEMPORARY diagnostics: surface the production-only failure. Remove once fixed.
    const err = e as Error;
    return <template data-blocks-error={`node ${process.version} | ${err.name}: ${err.message}\n${err.stack?.split("\n").slice(0, 6).join("\n")}`} />;
  }
}
