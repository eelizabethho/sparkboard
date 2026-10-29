import assert from "node:assert/strict";
import { test } from "node:test";
import { filterIdeas } from "./filter-ideas.ts";

const mk = (title: string, status: string, created_at: string, updated_at: string, category: string | null = null, tags: string[] = []) =>
  ({ title, pitch: "", tags, category, status, created_at, updated_at }) as Parameters<typeof filterIdeas>[0][number];
const a = mk("A", "shipped", "2024-01-01", "2024-03-01", "X", ["Ai"]);
const b = mk("B", "spark", "2024-02-01", "2024-02-02", "Y");
const c = mk("C", "spark", "2024-03-01", "2024-01-05", "X");

test("sorts", () => {
  const t = (s: "latest" | "updated" | "status") => filterIdeas([a, b, c], "", "", s).map((i) => i.title).join("");
  assert.equal(t("latest"), "CBA");
  assert.equal(t("updated"), "ABC");
  assert.equal(t("status"), "CBA");
});
test("filters", () => {
  assert.equal(filterIdeas([a, b, c], "X", "", "latest").length, 2);
  assert.equal(filterIdeas([a, b, c], "", "ai", "latest")[0], a);
  assert.equal(filterIdeas([a, b, c], "Y", "zzz", "latest").length, 0);
});
