import type { Idea } from "@/lib/ideas";

export type Sort = "latest" | "updated" | "status";
type Item = Pick<Idea, "title" | "pitch" | "tags" | "category" | "status" | "created_at" | "updated_at">;

const STATUS_ORDER = ["spark", "exploring", "building", "shipped", "shelved"];
const desc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0); // ISO timestamps compare lexically

export function filterIdeas<T extends Item>(ideas: T[], category: string, query: string, sort: Sort): T[] {
  const q = query.trim().toLowerCase();
  const out = ideas.filter(
    (i) =>
      (!category || i.category === category) &&
      (!q || [i.title, i.pitch, ...i.tags].some((s) => s.toLowerCase().includes(q))),
  );
  return out.sort((a, b) =>
    sort === "updated"
      ? desc(a.updated_at, b.updated_at)
      : sort === "status"
        ? STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || desc(a.created_at, b.created_at)
        : desc(a.created_at, b.created_at),
  );
}
