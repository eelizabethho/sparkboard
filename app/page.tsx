import { IdeaCard, type IdeaCardData } from "@/components/idea-card";

const cats = ["All", "Productivity", "Creative", "Health", "Dev tools"];

const ideas: IdeaCardData[] = [
  { slug: "pocket-tutor", title: "Pocket Tutor", pitch: "A voice tutor that quizzes you on whatever you read today.", status: "spark", category: "Productivity", cover_url: null },
  { slug: "mood-garden", title: "Mood Garden", pitch: "Plants grow from your daily check-ins.", status: "exploring", category: "Health", cover_url: null },
  { slug: "diff-poet", title: "Diff Poet", pitch: "Turns your git diff into a haiku.", status: "building", category: "Dev tools", cover_url: null },
  { slug: "sketch-to-song", title: "Sketch to Song", pitch: "Doodle a shape, hear a melody.", status: "shipped", category: "Creative", cover_url: null },
  { slug: "inbox-zen", title: "Inbox Zen", pitch: "Summarises your inbox into three calm sentences every morning.", status: "spark", category: "Productivity", cover_url: null },
  { slug: "recipe-remix", title: "Recipe Remix", pitch: "Swap any ingredient and get a recipe that still works.", status: "shelved", category: "Creative", cover_url: null },
];

export default function Home() {
  return (
    <>
      <h1 className="py-8 text-5xl font-semibold sm:text-6xl">AI ideas, from spark to shipped.</h1>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {cats.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-pressed={i === 0}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring outline-none ${
              i === 0 ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {ideas.map((idea) => (
          <IdeaCard key={idea.slug} idea={idea} />
        ))}
      </div>
    </>
  );
}
