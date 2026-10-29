import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorPage } from "@/components/editor-page";

export const metadata: Metadata = { title: "Edit idea", robots: { index: false } };

async function Editor({ params }: { params: PageProps<"/ideas/[slug]/edit">["params"] }) {
  return <EditorPage slug={(await params).slug} />;
}

export default function EditPage(props: PageProps<"/ideas/[slug]/edit">) {
  return (
    <Suspense>
      <Editor params={props.params} />
    </Suspense>
  );
}
