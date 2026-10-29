import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorPage } from "@/components/editor-page";

export const metadata: Metadata = { title: "New idea", robots: { index: false } };

export default function NewPage() {
  return (
    <Suspense>
      <EditorPage />
    </Suspense>
  );
}
