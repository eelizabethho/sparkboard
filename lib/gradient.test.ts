import assert from "node:assert/strict";
import { test } from "node:test";
import { gradientFor } from "./gradient.ts";

test("same input gives same output; different inputs usually differ", () => {
  assert.equal(gradientFor("Sparkboard"), gradientFor("Sparkboard"));
  const seeds = ["a", "b", "c", "Idea one", "Idea two", "Idea three"];
  assert.ok(new Set(seeds.map(gradientFor)).size >= 5);
});
