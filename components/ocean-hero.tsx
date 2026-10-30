import { AsciiOcean } from "@/vendor/ascii-sharks/react";
import type { SharkSpec } from "@/vendor/ascii-sharks";

// Biggest first; hammerheads read as sharks at a glance.
const SHARKS: SharkSpec[] = [
  { kind: "hammerhead", size: 1 },
  { kind: "classic", size: 0.86 },
  { kind: "greathammer", size: 0.78 },
  { kind: "mako", size: 0.7 },
];

// Full-bleed landing hero: ASCII sharks (github.com/stackedlol/ascii-sharks, MIT) behind the title.
// Light mode inverts the original black ocean (hue-rotate keeps the accent colours), as in the reference.
export function OceanHero() {
  return (
    <section className="relative left-1/2 -ml-[50vw] h-[70svh] w-screen overflow-hidden sm:h-[calc(100svh-4rem)]">
      <AsciiOcean
        sharks={SHARKS}
        className="absolute inset-0 size-full font-mono [filter:invert(0.96)_hue-rotate(180deg)] dark:[filter:none]"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
        <div className="absolute h-[min(70vw,30rem)] w-[min(100vw,52rem)] rounded-full backdrop-blur-[6px] [background:radial-gradient(closest-side,color-mix(in_oklab,var(--background)_85%,transparent),transparent)] [mask-image:radial-gradient(closest-side,#000_45%,transparent)]" />
        <div className="relative flex flex-col items-center text-center">
          <h1 className="text-6xl font-semibold sm:text-8xl">Sparkboard</h1>
          <p className="mt-3 text-lg text-muted-foreground sm:text-xl">AI ideas, from spark to shipped.</p>
        </div>
      </div>
      <a
        href="#ideas"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-4 py-2 text-sm backdrop-blur-[20px] transition active:scale-95"
      >
        ↓ See the ideas
      </a>
    </section>
  );
}
