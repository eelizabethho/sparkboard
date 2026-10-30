import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { BlocksView } from "@/components/blocks-view";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { gradientFor } from "@/lib/gradient";
import { getIdea, isOwner } from "@/lib/ideas";

const load = cache(getIdea);
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });

export async function generateMetadata({ params }: PageProps<"/ideas/[slug]">): Promise<Metadata> {
  const idea = await load((await params).slug);
  if (!idea) return {};
  return {
    title: idea.title,
    description: idea.pitch,
    openGraph: { title: idea.title, description: idea.pitch, images: idea.cover_url ? [idea.cover_url] : undefined },
  };
}

async function Detail({ params }: { params: PageProps<"/ideas/[slug]">["params"] }) {
  const idea = await load((await params).slug);
  if (!idea) notFound();
  const owner = await isOwner();
  return (
    <article className="mx-auto max-w-3xl">
      {idea.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={idea.cover_url}
          alt={`Cover for ${idea.title}`}
          style={{ objectPosition: `center ${idea.cover_y}%` }}
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div aria-hidden className="aspect-[16/9] w-full" style={{ background: gradientFor(idea.title) }} />
      )}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {idea.category && <Badge variant="secondary">{idea.category}</Badge>}
        <span className="text-sm capitalize text-muted-foreground">{idea.status}</span>
        {idea.is_private && <Badge variant="outline">Private</Badge>}
        {owner && (
          <Link
            href={`/ideas/${idea.slug}/edit`}
            className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95"
          >
            Edit
          </Link>
        )}
      </div>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{idea.title}</h1>
      {idea.pitch && <p className="mt-3 text-xl text-muted-foreground">{idea.pitch}</p>}
      {idea.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {idea.tags.map((t) => (
            <li key={t} className="rounded-full bg-card px-3 py-1 text-sm text-muted-foreground">#{t}</li>
          ))}
        </ul>
      )}
      {idea.links.length > 0 && (
        <ul className="mt-6 space-y-1">
          {idea.links.map((l) => (
            <li key={l}>
              <a href={l} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4">
                {l}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="prose-idea mt-8">
        {idea.content?.length ? <BlocksView blocks={idea.content} /> : <Markdown>{idea.body}</Markdown>}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Created {fmt(idea.created_at)} · Updated {fmt(idea.updated_at)}
      </p>
    </article>
  );
}

export default function IdeaPage(props: PageProps<"/ideas/[slug]">) {
  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1 py-6 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> All ideas
      </Link>
      <Suspense fallback={<div className="mx-auto aspect-[16/9] max-w-3xl animate-pulse bg-card" />}>
        <Detail params={props.params} />
      </Suspense>
    </>
  );
}
