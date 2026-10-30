"use client";

import { useTheme } from "next-themes";
import { AsciiOcean } from "@/vendor/ascii-sharks/react";

// Full-bleed landing hero: ASCII sharks (github.com/stackedlol/ascii-sharks, MIT) behind the title.
export function OceanHero() {
  const { resolvedTheme } = useTheme();
  return (
    <section className="relative left-1/2 -ml-[50vw] h-[70svh] w-screen overflow-hidden sm:h-[calc(100svh-4rem)]">
      <AsciiOcean theme={resolvedTheme === "dark" ? "dark" : "light"} className="absolute inset-0 size-full font-mono" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
        <div className="flex flex-col items-center rounded-full px-16 py-12 text-center [background:radial-gradient(closest-side,var(--background)_55%,transparent)]">
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
