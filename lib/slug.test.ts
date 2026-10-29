import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug.ts";

test("slugify", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("  Café  Crème  "), "cafe-creme");
  assert.equal(slugify("日本語"), "idea");
  assert.equal(slugify("---"), "idea");
  const long = slugify("word ".repeat(40));
  assert.ok(long.length <= 60 && !long.endsWith("-") && !long.startsWith("-"));
});
