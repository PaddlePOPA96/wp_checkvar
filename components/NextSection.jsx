"use client";

import { useEffect, useRef } from "react";
import { startPerlinTopography } from "../lib/perlinTopography";

export default function NextSection() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getSize = () => {
      const el = canvas.parentElement || canvas;
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    };
    // Samakan warna garis dengan section lain dan observe ukuran parent
    const cleanup = startPerlinTopography(canvas, {
      lineColor: "rgba(255,255,255,0.22)",
      getSize,
      observeElement: canvas.parentElement || undefined,
    });
    return () => cleanup && cleanup();
  }, []);

  return (
    <section className="layer-black-section" style={{ position: "relative" }}>
      {/* Soften transition from dark hero to light section */}
      <div className="section-top-fade" aria-hidden />
      {/* Perlin khusus section ini */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
        className="next-perlin"
      />
      {/* Blur overlay: semakin ke bawah semakin blurry (via gradient coverage) */}
      <div className="next-blur" aria-hidden />

      <div className="max-w-2xl" style={{ position: "relative", zIndex: 2 }}>
        <h1>Section berikutnya 🚀</h1>
        <p>Ini layer setelah jumbotron 80%.</p>
      </div>
    </section>
  );
}
