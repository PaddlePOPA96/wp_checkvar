"use client";

import { useEffect, useRef, useState } from "react";

export default function SignatureOverlay({ heroRef }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const lengthsRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
        const res = await fetch(`${base}/images/signature.svg`);
        const txt = await res.text();
        if (cancelled) return;
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = txt;
        // Normalisasi viewBox agar konten tersejajarkan di tengah
        const svg = el.querySelector('svg');
        if (svg) {
          try {
            const bbox = svg.getBBox();
            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          } catch (_) {}
        }
        setupPaths();
        setLoaded(true);
      } catch (_) {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function setupPaths() {
    const el = containerRef.current;
    if (!el) return;
    const paths = el.querySelectorAll("path, polyline, line");
    lengthsRef.current = [];
    paths.forEach((p, i) => {
      try {
        const length = p.getTotalLength ? p.getTotalLength() : 600;
        p.style.strokeDasharray = `${length}`;
        p.style.strokeDashoffset = `${length}`;
        p.style.stroke = p.style.stroke || "#facc15";
        p.style.fill = p.style.fill || "#facc15";
        p.style.fillOpacity = "0";
        p.style.strokeWidth = p.style.strokeWidth || "4";
        p.style.vectorEffect = "non-scaling-stroke";
        lengthsRef.current[i] = length;
      } catch (_) {}
    });
  }

  // Bind progress to hero scroll (0..1).
  useEffect(() => {
    let rafId = 0;
    function tick() {
      rafId = requestAnimationFrame(tick);
      const hero = heroRef?.current;
      const el = containerRef.current;
      if (!hero || !el || !loaded) return;
      const styles = getComputedStyle(hero);
      const p = Math.max(0, Math.min(1, parseFloat(styles.getPropertyValue('--heroP') || '0')));
      const show = p > 0.02 && p < 1.01;
      setActive(show);
      if (!lengthsRef.current.length) return;
      const paths = el.querySelectorAll('path, polyline, line');
      paths.forEach((pth, i) => {
        const L = lengthsRef.current[i] || 600;
        const drawn = Math.max(0, Math.min(1, p));
        pth.style.strokeDashoffset = String(L * (1 - drawn));
        // Fill starts near end of draw
        const fillProg = Math.max(0, Math.min(0.9, (drawn - 0.85) * 6));
        pth.style.fillOpacity = String(fillProg);
      });
      // Opacity follows progress a bit
      el.style.opacity = String(Math.min(0.95, Math.max(0, p * 1.2)));
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [heroRef, loaded]);

  // Watch hero compact state as a fallback for visibility
  useEffect(() => {
    const hero = heroRef?.current;
    if (!hero) return;
    const update = () => {
      const isActive = hero.classList.contains("hero-compact");
      setActive(isActive);
      // progress-driven drawing handles animation
    };
    update();
    let mo;
    try {
      mo = new MutationObserver(update);
      mo.observe(hero, { attributes: true, attributeFilter: ["class"] });
    } catch (_) {}
    return () => {
      try { mo && mo.disconnect(); } catch (_) {}
    };
  }, [heroRef, loaded]);

  return (
    <div
      className="signature-overlay"
      aria-hidden
      ref={containerRef}
      data-loaded={loaded ? "1" : "0"}
      data-active={active ? "1" : "0"}
    />
  );
}
