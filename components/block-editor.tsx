"use client";

import "@blocknote/shadcn/style.css";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { useEffect, type RefObject } from "react";

export type BlockDoc = { content: unknown[]; body: string };

// Notion-style editor (BlockNote): `/` for blocks, drag handles to reorder, resizable images.
// Client-only; load it with next/dynamic({ ssr: false }).
export default function BlockEditor({
  initialContent,
  markdown,
  uploadFile,
  docRef,
}: {
  initialContent: unknown[] | null;
  /** Older posts have only markdown; it's converted to blocks on open. */
  markdown: string;
  uploadFile: (file: File) => Promise<string>;
  docRef: RefObject<(() => BlockDoc) | null>;
}) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? (initialContent as PartialBlock[]) : undefined,
    uploadFile,
  });
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!initialContent?.length && markdown.trim()) {
      editor.replaceBlocks(editor.document, editor.tryParseMarkdownToBlocks(markdown));
    }
    // Markdown copy is kept for search engines, share previews and as a fallback.
    docRef.current = () => ({ content: editor.document, body: editor.blocksToMarkdownLossy() });
    // Runs once: the editor owns the document after it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return <BlockNoteView editor={editor} theme={resolvedTheme === "dark" ? "dark" : "light"} className="min-h-[50vh]" />;
}
