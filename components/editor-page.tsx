import { notFound } from "next/navigation";
import { IdeaEditor } from "@/components/idea-editor";
import { getIdea, isOwner, listIdeas } from "@/lib/ideas";

// Request-time: render inside <Suspense>. slug omitted = new idea.
export async function EditorPage({ slug }: { slug?: string }) {
  if (!(await isOwner())) notFound();
  const idea = slug ? await getIdea(slug) : undefined;
  if (slug && !idea) notFound();
  const categories = [...new Set((await listIdeas()).map((i) => i.category).filter((c): c is string => !!c))].sort();
  return <IdeaEditor idea={idea ?? undefined} categories={categories} />;
}
