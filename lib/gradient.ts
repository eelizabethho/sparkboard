// Deterministic gradient from a string: hash -> two HSL hues.
export function gradientFor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  const a = h % 360;
  const b = (a + 40 + ((h >>> 9) % 80)) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 60%), hsl(${b} 70% 50%))`;
}
