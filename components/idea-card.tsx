import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { gradientFor } from "@/lib/gradient";

// Minimal local type; Phase 2 replaces it with the real Idea type.
export type IdeaCardData = {
  slug: string;
  title: string;
  pitch: string;
  status: string;
  category: string | null;
  cover_url: string | null;
};

export function IdeaCard({ idea }: { idea: IdeaCardData }) {
  return (
    <article className="group relative mb-6 break-inside-avoid overflow-hidden rounded-3xl bg-card text-card-foreground shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring">
      {idea.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={idea.cover_url}
          alt={`Cover for ${idea.title}`}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="aspect-[4/3] w-full"
          style={{ background: gradientFor(idea.title) }}
        />
      )}
      <div className="space-y-2 p-5 pr-16">
        <div className="flex items-center gap-2">
          {idea.category && <Badge variant="secondary">{idea.category}</Badge>}
          <span className="text-xs capitalize text-muted-foreground">{idea.status}</span>
        </div>
        <h2 className="text-xl font-semibold">{idea.title}</h2>
        <p className="truncate text-sm text-muted-foreground">{idea.pitch}</p>
      </div>
      <Link
        href={`/ideas/${idea.slug}`}
        aria-label={`Open ${idea.title}`}
        className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none"
      >
        <ArrowUpRightIcon className="size-5" />
      </Link>
    </article>
  );
}
