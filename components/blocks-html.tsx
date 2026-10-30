import "server-only";
import "@blocknote/core/style.css";
import type { PartialBlock } from "@blocknote/core";
import { ServerBlockNoteEditor } from "@blocknote/server-util";

// Renders block-editor posts to static HTML on the server, so readers don't load the editor.
// Only the owner can write content (RLS), and BlockNote escapes text when serializing.
export async function BlocksHtml({ blocks }: { blocks: unknown[] }) {
  const html = await ServerBlockNoteEditor.create().blocksToFullHTML(blocks as PartialBlock[]);
  return <div className="bn-container bn-default-styles post-blocks" dangerouslySetInnerHTML={{ __html: html }} />;
}
