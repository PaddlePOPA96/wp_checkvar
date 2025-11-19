import { useEffect, useRef } from "react";

// Controls the liquid goo SVG animation inside the provided hero node.
// Returns { disableGoo, enableGoo, enabledRef } to be used by scroll logic.
export default function useGooAnimation(heroBoxRef) {
  const dripsRef = useRef([]);
  const enabledRef = useRef(true);
  const rafIdRef = useRef(0);

  useEffect(() => {
    const hero = heroBoxRef.current;
    if (!hero) return;

    const svg = hero.querySelector(".hero-liquid-svg");
    const drips = hero.querySelectorAll(".drip");
    dripsRef.current = Array.from(drips);

    const mouse = { x: 925, y: 476 };

    function loop() {
      // Keep a lightweight loop so we can re-enable smoothly when needed
      if (!enabledRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }
      const now = performance.now() * 0.001;
      mouse.x = 925 + Math.sin(now * 0.35) * 320;
      mouse.y = 476 + Math.cos(now * 0.28) * 220;

      dripsRef.current.forEach((drip, i) => {
        const sway = Math.sin(now * (0.7 + i * 0.1)) * 90;
        const jiggle = Math.sin(now * (0.9 + i * 0.08)) * 30;
        drip.setAttribute("cx", String(mouse.x + sway));
        drip.setAttribute("cy", String(mouse.y - 160 + jiggle));
        const baseRy = parseFloat(drip.dataset.ry || "0");
        const targetRy = baseRy * (1 + Math.sin(now * 1.2 + i) * 0.08);
        const currRy = parseFloat(drip.getAttribute("ry") || "0");
        drip.setAttribute("ry", String(currRy + (targetRy - currRy) * 0.34));
      });

      rafIdRef.current = requestAnimationFrame(loop);
    }

    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [heroBoxRef]);

  const disableGoo = () => {
    if (!enabledRef.current) return;
    enabledRef.current = false;
    const hero = heroBoxRef.current;
    if (!hero) return;
    const svg = hero.querySelector(".hero-liquid-svg");
    if (svg) svg.style.opacity = "0";
  };

  const enableGoo = () => {
    if (enabledRef.current) return;
    enabledRef.current = true;
    const hero = heroBoxRef.current;
    if (!hero) return;
    const svg = hero.querySelector(".hero-liquid-svg");
    if (svg) svg.style.opacity = "1";
  };

  return { disableGoo, enableGoo, enabledRef };
}

