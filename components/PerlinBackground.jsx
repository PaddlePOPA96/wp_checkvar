"use client";

import { useEffect, useRef } from "react";
import { startPerlinTopography } from "../lib/perlinTopography";

export default function PerlinBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = startPerlinTopography(canvas, {
      // Samakan warna garis dengan section lain
      lineColor: "rgb(15, 106, 22)",
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
