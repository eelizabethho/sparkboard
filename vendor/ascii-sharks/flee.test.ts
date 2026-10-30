// Sparkboard self-check: a shark the cursor sits on ends up farther from it than an unbothered one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "./world";

function distanceAfter(pointerActive: boolean) {
  const realRandom = Math.random;
  let seed = 7;
  Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // same ocean both runs
  try {
    const world = new World([{ kind: "classic", size: 1 }]);
    world.resize(1000, 800, 8, 12);
    const shark = world.sharks[0];
    const [px, py] = [shark.nodes[0], shark.nodes[1]];
    Object.assign(world.pointer, { x: px, y: py, active: pointerActive });
    for (let i = 0; i < 120; i++) world.step(1 / 60);
    return Math.hypot(shark.nodes[0] - px, shark.nodes[1] - py);
  } finally {
    Math.random = realRandom;
  }
}

test("sharks swim away from the cursor", () => {
  assert.ok(distanceAfter(true) > distanceAfter(false) * 1.2);
});
