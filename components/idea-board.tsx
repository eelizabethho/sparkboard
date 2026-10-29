"use client";

import { useMemo, useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import { filterIdeas, type Sort } from "@/lib/filter-ideas";
import type { Idea } from "@/lib/ideas";

export function IdeaBoard({ ideas }: { ideas: Idea[] }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  const categories = useMemo(
    () => [...new Set(ideas.flatMap((i) => (i.category ? [i.category] : [])))].sort(),
    [ideas],
  );
  const shown = useMemo(() => filterIdeas(ideas, category, query, sort), [ideas, category, query, sort]);

  if (ideas.length === 0) {
    return <p className="py-24 text-center text-lg text-muted-foreground">No ideas yet</p>;
  }

  return (
    <>
      <div className="frosted sticky top-16 z-30 -mx-4 mb-6 space-y-3 bg-background/70 px-4 py-3 backdrop-blur-[20px] backdrop-saturate-[180%] sm:-mx-6 sm:px-6">
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {["", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95 ${
                category === c ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
              }`}
            >
              {c || "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas"
            aria-label="Search ideas"
            className="h-10 min-w-0 flex-1 rounded-full bg-card px-4 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:text-sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort ideas"
            className="h-10 rounded-full bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:text-sm"
          >
            <option value="latest">Latest</option>
            <option value="updated">Recently updated</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="py-24 text-center text-lg text-muted-foreground">No ideas match your search.</p>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {shown.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </>
  );
}
