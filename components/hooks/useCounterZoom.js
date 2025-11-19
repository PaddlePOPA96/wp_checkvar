import { useEffect } from "react";

// Counter-zoom a specific container so its visual size appears stable
// while the user zooms the browser. Best-effort (Chrome/WebKit support 'zoom').
// Falls back to transform scale with width compensation.
export default function useCounterZoom(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const supportsZoom = typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "1");

    function currentScale() {
      if (typeof window.visualViewport !== "undefined") {
        return window.visualViewport.scale || 1;
      }
      // Fallback heuristic
      return 1;
    }

    function apply() {
      ticking = false;
      const z = currentScale();
      const adjust = 1 / (z || 1);

      if (supportsZoom) {
        el.style.zoom = String(adjust);
        // Clean transform fallback if any
        el.style.transform = "";
        el.style.width = "";
        el.style.marginLeft = "";
        el.style.marginRight = "";
        el.style.transformOrigin = "";
      } else {
        el.style.transformOrigin = "top center";
        el.style.transform = `scale(${adjust})`;
        // Compensate layout width so scaled element remains centered
        el.style.width = `${100 / adjust}%`;
        el.style.marginLeft = "auto";
        el.style.marginRight = "auto";
      }
    }

    function schedule() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    apply();
    window.addEventListener("resize", schedule, { passive: true });
    if (typeof window.visualViewport !== "undefined") {
      window.visualViewport.addEventListener("resize", schedule, { passive: true });
      window.visualViewport.addEventListener("scroll", schedule, { passive: true });
    }
    return () => {
      window.removeEventListener("resize", schedule);
      if (typeof window.visualViewport !== "undefined") {
        window.visualViewport.removeEventListener("resize", schedule);
        window.visualViewport.removeEventListener("scroll", schedule);
      }
    };
  }, [ref]);
}

