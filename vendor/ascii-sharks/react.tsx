"use client";

import { useEffect, useRef } from "react";
import { OceanEngine } from "./engine";
import type { OceanTheme } from "./renderer";
import type { SharkSpec } from "./world";

/** Glyphs come from the canvas's font-family, so give it (or a parent) a monospace font. */
export function AsciiOcean({
  className,
  sharks,
  theme = "dark",
}: {
  className?: string;
  sharks?: SharkSpec[];
  theme?: OceanTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OceanEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new OceanEngine(canvas, sharks);
    engineRef.current = engine;
    return () => engine.destroy();
    // The roster is fixed for the life of the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sparkboard addition: follow the site's light/dark theme.
  useEffect(() => {
    engineRef.current?.setTheme(theme);
  }, [theme]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`ascii-ocean ${className ?? ""}`} />;
}
