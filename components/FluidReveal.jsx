"use client";

import { useEffect, useRef } from "react";
import { perlinNoise } from "../lib/perlinTopography";

// Lightweight 2D-canvas fluid-like reveal mask (no WebGL)
// Draws a fading mask (alpha) with radial splats that drift with a Perlin field,
// then composites scene1.png through that mask over bg.jpg.
export default function FluidReveal({ heroRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef?.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d");

    const img = new Image();
    img.src = "/images/scene1.png";

    let width = 0, height = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const pointers = [];
    // Hapus idle seeds agar tidak ada bulat-bulat reveal otomatis
    const idleSeeds = [];
    let mouseInside = false;

    function resize() {
      const r = hero.getBoundingClientRect();
      width = Math.max(2, Math.round(r.width));
      height = Math.max(2, Math.round(r.height));

      [canvas, mask, tmp].forEach(c => {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = width + "px";
        c.style.height = height + "px";
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // reset mask
      mctx.clearRect(0, 0, width, height);
      // center idle seeds
      idleSeeds.forEach(s => { s.x = width * 0.5; s.y = height * 0.5; s.r = 16; });
    }

    const ro = new ResizeObserver(resize);
    ro.observe(hero);
    resize();

    function splat(x, y, r = 42, a = 1) {
      const g = mctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      mctx.globalCompositeOperation = "source-over"; // paint white alpha
      mctx.fillStyle = g;
      mctx.beginPath();
      mctx.arc(x, y, r, 0, Math.PI * 2);
      mctx.fill();
    }

    function fadeMask(dt) {
      // reduce alpha a bit using destination-out
      mctx.save();
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = `rgba(0,0,0,${Math.min(0.08 * dt, 0.2)})`;
      mctx.fillRect(0, 0, width, height);
      mctx.restore();
    }

    function onPointer(e) {
      const b = canvas.getBoundingClientRect();
      const x = (e.clientX - b.left);
      const y = (e.clientY - b.top);
      // Reset mask agar area lama langsung tertutup; hanya posisi terbaru yang terlihat
      mctx.clearRect(0, 0, width, height);
      pointers.length = 0;
      pointers.push({ x, y, r: Math.max(width, height) * 0.12 });
      mouseInside = true;
    }
    function onEnter(e){ onPointer(e); mouseInside = true; }
    function onLeave(){ mouseInside = false; }

    hero.addEventListener("mousemove", onPointer, { passive: true });
    hero.addEventListener("mouseenter", onEnter, { passive: true });
    hero.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (!t) return;
      onPointer(t);
    }, { passive: true });
    hero.addEventListener("mouseleave", onLeave);

    let last = performance.now();
    let raf = 0; 

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.016, Math.min(0.05, (now - last) / 1000));
      last = now;

      // fade: saat pointer aktif, lambat agar reveal muncul cepat; saat idle, cepat hilang
      fadeMask(mouseInside || pointers.length ? dt * 0.5 : dt * 3.0);

      // tidak ada idle seeds; reveal hanya saat interaksi pointer

      // process pointer splats (decay radius)
      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        // dua lapis agar cepat terlihat
        splat(p.x, p.y, p.r, 1.0);
        splat(p.x, p.y, p.r * 0.6, 0.7);
        p.r *= 0.94;
        if (p.r < 8) { pointers.splice(i, 1); i--; }
      }

      // composite (hide when scrolling)
      let p = 0;
      try { p = parseFloat(getComputedStyle(hero).getPropertyValue('--heroP') || '0'); } catch(_) {}
      const show = p <= 0.001;
      canvas.style.opacity = show ? '1' : '0';
      if (!show) return;

      // composite
      ctx.clearRect(0, 0, width, height);
      if (img.complete) {
        // Draw scene1 with object-fit: cover behavior (preserve aspect, fill canvas)
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (iw && ih) {
          const scale = Math.max(width / iw, height / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(mask, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      hero.removeEventListener("mousemove", onPointer);
      hero.removeEventListener("mouseenter", onEnter);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, [heroRef]);

  return <canvas ref={canvasRef} className="fluid-reveal-canvas" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }} />;
}
