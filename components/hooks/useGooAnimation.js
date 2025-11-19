import { useEffect, useRef } from "react";
import { perlinNoise } from "../../lib/perlinTopography";

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
    const blurNode = svg ? svg.querySelector('feGaussianBlur') : null;
    const drips = hero.querySelectorAll(".drip");
    dripsRef.current = Array.from(drips);

    // Base point near center of hero-box
    const base = { x: 0, y: 0 };
    let bounds = hero.getBoundingClientRect();
    base.x = bounds.width * 0.5;
    base.y = bounds.height * 0.5;
    let t = 0;

    // Seeded randomness per particle
    const seed = Math.floor(Math.random() * 1e9) >>> 0;
    const rand = (s) => {
      // mulberry32
      let a = (s >>> 0) + 0x6D2B79F5;
      a = Math.imul(a ^ (a >>> 15), a | 1);
      a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
      return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
    };

    // Particle state per drip (position/velocity + personal params)
    const N = dripsRef.current.length;
    const pos = new Array(N);
    const vel = new Array(N);
    const pOff = new Array(N); // personal noise offset
    const pSpd = new Array(N); // speed multiplier
    const pRad = new Array(N); // orbit radius multiplier
    const pSize = new Array(N); // base blob radius (visual)
    for (let i = 0; i < N; i++) {
      const r1 = rand(seed + i * 97);
      const r2 = rand(seed ^ (i * 193));
      const r3 = rand(seed + i * 389);
      pos[i] = {
        x: base.x + (r1 - 0.5) * bounds.width * 0.9,
        y: base.y + (r2 - 0.5) * bounds.height * 0.9,
      };
      vel[i] = { x: 0, y: 0 };
      pOff[i] = { x: r1 * 1000 + 10 * i, y: r2 * 1000 - 7 * i, z: r3 * 1000 };
      pSpd[i] = 0.7 + r3 * 0.9; // 0.7..1.6
      pRad[i] = 0.7 + r2 * 0.8; // 0.7..1.5
      // visual size ~ 8% - 14% dari sisi terpendek (lebih besar)
      pSize[i] = (Math.min(bounds.width, bounds.height) * (0.08 + r1 * 0.06));
    }

    // Curl-noise helper (approximate derivs)
    const curl2D = (x, y, z) => {
      const e = 0.0008 * Math.max(1, 1200 / Math.max(bounds.width, 1));
      const n1 = perlinNoise(x, y + e, z);
      const n2 = perlinNoise(x, y - e, z);
      const n3 = perlinNoise(x + e, y, z);
      const n4 = perlinNoise(x - e, y, z);
      const dx = (n1 - n2) / (2 * e);
      const dy = (n3 - n4) / (2 * e);
      // curl = (∂n/∂y, -∂n/∂x)
      return { x: dx, y: -dy };
    };

    // Mouse attraction
    const mouse = { x: 0, y: 0, inside: false };
    function onMove(e) {
      const b = hero.getBoundingClientRect();
      bounds = b;
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
      mouse.inside = true;
    }
    function onLeave() { mouse.inside = false; }
    function onEnter(e){ onMove(e); mouse.inside = true; }
    hero.addEventListener('mousemove', onMove, { passive: true });
    hero.addEventListener('mouseenter', onEnter, { passive: true });
    hero.addEventListener('mouseleave', onLeave);

    function loop() {
      // Keep a lightweight loop so we can re-enable smoothly when needed
      if (!enabledRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }
      t += 0.012; // perlin time

      // Recalc bounds occasionally to follow layout changes
      if ((Math.floor(t * 120) % 45) === 0) {
        bounds = hero.getBoundingClientRect();
        base.x = bounds.width * 0.7;
        base.y = bounds.height * 0.7;
      }

      const scale = 0.0014 * Math.min(1, 2000 / Math.max(bounds.width, 1));
      const flowSpeed = Math.max(bounds.width, bounds.height) * 0.0032; // px/frame
      const radius = Math.min(bounds.width, bounds.height) * 0.9; // orbit radius hampir seluruh hero

      dripsRef.current.forEach((drip, i) => {
        const p = pos[i];
        const v = vel[i];
        // Curl-noise field (randomized per particle offset)
        const of = pOff[i];
        const c = curl2D((p.x + of.x) * scale, (p.y + of.y) * scale, t + of.z);
        const tx = c.x * flowSpeed * pSpd[i];
        const ty = c.y * flowSpeed * pSpd[i];
        // Mouse interaction: pecah (repel) saat dekat, tarik lemah saat jauh
        const minDim = Math.max(1, Math.min(bounds.width, bounds.height));
        const repelRadius = minDim * 0.35;
        if (mouse.inside) {
          const mx = mouse.x - p.x;
          const my = mouse.y - p.y;
          const md = Math.hypot(mx, my) + 0.0001;
          const dirx = mx / md;
          const diry = my / md;
          const inside = md < repelRadius;
          if (inside) {
            // REPULSION: dorong menjauh dari mouse, kecilkan blur biar tidak menggumpal
            const k = (1 - md / repelRadius); // 0..1
            v.x -= dirx * (0.012 * k * minDim * 0.001);
            v.y -= diry * (0.012 * k * minDim * 0.001);
            if (blurNode) blurNode.setAttribute('stdDeviation', '2.2');
          } else {
            // ATTRACTION LEMAH untuk tetap mengikuti mouse dari jauh
            const k = Math.min(1, (md - repelRadius) / (repelRadius * 1.5));
            v.x += dirx * (0.002 * k * minDim * 0.001);
            v.y += diry * (0.002 * k * minDim * 0.001);
            if (blurNode) blurNode.setAttribute('stdDeviation', '3.2');
          }
          // Pusat orbit ikut bergeser ringan
          base.x += (mouse.x - base.x) * 0.04;
          base.y += (mouse.y - base.y) * 0.04;
        } else if (blurNode) {
          blurNode.setAttribute('stdDeviation', '3.5');
        }
        // Smooth velocity
        v.x += (tx - v.x) * 0.08;
        v.y += (ty - v.y) * 0.08;
        // Integrate position
        p.x += v.x;
        p.y += v.y;
        // Soft tether around base center (keep within radius)
        const dx = p.x - base.x;
        const dy = p.y - base.y - bounds.height * 0.06; // slight upward bias
        const dist = Math.hypot(dx, dy);
        const lim = radius * pRad[i];
        if (dist > lim) {
          p.x = base.x + (dx / dist) * lim;
          p.y = base.y + (dy / dist) * lim;
          v.x *= 0.7; v.y *= 0.7;
        }

        drip.setAttribute("cx", String(p.x));
        drip.setAttribute("cy", String(p.y));

        // Visual blob size — override huge data-ry from SVG
        let pulse = 0.9 + (perlinNoise(t * 1.2 + of.z, i * 0.19 + of.x, t * 0.55 + of.y) - 0.5) * 0.7; // ~0.55..1.25
        let r = pSize[i] * pulse;
        // Kecilkan blob di sekitar mouse supaya terlihat "pecah"
        if (mouse.inside) {
          const md = Math.hypot((mouse.x - p.x), (mouse.y - p.y));
          const shrink = Math.max(0, 1 - md / (repelRadius * 1.05)); // 0..1
          r *= (1 - 0.45 * shrink);
        }
        const currRx = parseFloat(drip.getAttribute("rx") || "0");
        const currRy = parseFloat(drip.getAttribute("ry") || "0");
        const targetRx = r;
        const targetRy = r; // lebih bulat agar tampak besar
        drip.setAttribute("rx", String(currRx + (targetRx - currRx) * 0.25));
        drip.setAttribute("ry", String(currRy + (targetRy - currRy) * 0.25));
      });

      rafIdRef.current = requestAnimationFrame(loop);
    }

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      hero.removeEventListener('mousemove', onMove);
      hero.removeEventListener('mouseenter', onEnter);
      hero.removeEventListener('mouseleave', onLeave);
    };
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
