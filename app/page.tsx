import { Suspense } from "react";
import { IdeaBoard } from "@/components/idea-board";
import { OceanHero } from "@/components/ocean-hero";
import { listIdeas } from "@/lib/ideas";

async function Board() {
  return <IdeaBoard ideas={await listIdeas()} />;
}

export default function Home() {
  return (
    <>
      <OceanHero />
      <h2 id="ideas" className="scroll-mt-16 py-8 text-4xl font-semibold sm:text-5xl">
        Ideas
      </h2>
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
