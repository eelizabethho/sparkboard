import { Suspense } from "react";
import { IdeaBoard } from "@/components/idea-board";
import { listIdeas } from "@/lib/ideas";

async function Board() {
  return <IdeaBoard ideas={await listIdeas()} />;
}

export default function Home() {
  return (
    <>
      <h1 className="py-8 text-5xl font-semibold sm:text-6xl">AI ideas, from spark to shipped.</h1>
      <Suspense
        fallback={
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mb-6 aspect-[4/5] animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        }
      >
        <Board />
      </Suspense>
    </>
  );
}
