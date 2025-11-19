import { useEffect } from "react";

// Handles scroll range (2 viewports):
// - First viewport: scale 1 -> 0.8 + corner radius
// - Second viewport: keep compact
// Also toggles marquee visibility, goo state, overlay and compact styling.
export default function useHeroScroll(rangeRef, heroBoxRef, { disableGoo, enableGoo }) {
  useEffect(() => {
    const range = rangeRef.current;
    const hero = heroBoxRef.current;
    if (!range || !hero) return;

    let ticking = false;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function apply() {
      ticking = false;
      const vh = window.innerHeight;
      const start = range.offsetTop;
      const y = window.scrollY - start;
      const p = Math.min(Math.max(y / vh, 0), 1); // 0..1 for first viewport
      // Expose progress to dependents (e.g., signature overlay)
      try { hero.style.setProperty('--heroP', String(p)); } catch (_) {}
      const scale = 1 - 0.2 * easeOutCubic(p);
      const radius = 24 * p;
      hero.style.transform = `scale(${scale})`;
      hero.style.borderRadius = `${radius}px`;

      if (p > 0.001) {
        range.classList.add("marquee-active");
        hero.classList.add("goo-off");
        disableGoo();
      } else {
        range.classList.remove("marquee-active");
        hero.classList.remove("goo-off");
        enableGoo();
      }

      // Compact state when entering second viewport
      if (p >= 0.999) {
        hero.classList.add("hero-compact");
      } else {
        hero.classList.remove("hero-compact");
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }
    function onResize() {
      apply();
    }

    // initial state
    apply();
    range.classList.add("marquee-active");

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [rangeRef, heroBoxRef, disableGoo, enableGoo]);
}
