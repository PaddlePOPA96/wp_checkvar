"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import useGooAnimation from "./hooks/useGooAnimation";
import useHeroScroll from "./hooks/useHeroScroll";
import NextSection from "./NextSection";
import MembersSection from "./MembersSection";
import useCounterZoom from "./hooks/useCounterZoom";
import SignatureOverlay from "./SignatureOverlay";
import { MARQUEE_TEXTS } from "../config/ui";

export default function Hero() {
  const rangeRef = useRef(null); // wrapper 2 layar (section 1 + section 2)
  const heroBoxRef = useRef(null); // satu-satunya hero
  const heroZoomRef = useRef(null);
  const svgRef = useRef(null);
  const { disableGoo, enableGoo } = useGooAnimation(heroBoxRef);
  useHeroScroll(rangeRef, heroBoxRef, { disableGoo, enableGoo });
  useCounterZoom(heroZoomRef);

  // Samakan koordinat SVG dengan ukuran hero agar layer scene1 tidak tampak kecil
  useEffect(() => {
    const svg = svgRef.current;
    const hero = heroBoxRef.current;
    if (!svg || !hero) return;
    const update = () => {
      const r = hero.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(hero);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="hero-sticky-root">
      <div ref={heroZoomRef}>
        {/* Range 2 layar: Section 1 (full) + Section 2 (80%) */}
        <div className="hero-scroll-range" ref={rangeRef}>
          <div className="hero-sticky">
            {/* Marquee di belakang container hero */}
          {/* Baris 1: kanan → kiri, posisikan di tengah */}
          <div className="hero-marquee hero-marquee--primary" aria-hidden>
            <div className="hero-marquee__track hero-marquee__track--rtl">{MARQUEE_TEXTS.primary}</div>
          </div>
          {/* Baris 2: kiri → kanan, geser sedikit di bawah tengah */}
          <div className="hero-marquee hero-marquee--secondary" aria-hidden>
            <div className="hero-marquee__track hero-marquee__track--ltr">{MARQUEE_TEXTS.secondary}</div>
          </div>
          <div className="hero-box" ref={heroBoxRef}>
            <div className="hero-box-inner">
              <Image src="/images/bg.jpg" alt="Locker room" fill className="hero-box-bg" priority />
              <Image src="/images/scene.png" alt="Scene base" fill className="hero-box-scene" priority />
              <svg ref={svgRef} viewBox="0 0 1851 953" preserveAspectRatio="xMidYMid slice" className="hero-liquid-svg">
                <defs>
                <filter id="goo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                  </filter>
                <mask id="liquidMask">
                  <rect width="100%" height="100%" fill="black" />
                  <g filter="url(#goo)" fill="white">
                    {/* lebih banyak partikel drip untuk pola perlin yang kaya */}
                    <ellipse cx="0" cy="-300" rx="170" ry="0" className="drip" data-ry="680" />
                    <ellipse cx="0" cy="-300" rx="140" ry="0" className="drip" data-ry="720" />
                    <ellipse cx="0" cy="-300" rx="200" ry="0" className="drip" data-ry="650" />
                    <ellipse cx="0" cy="-300" rx="110" ry="0" className="drip" data-ry="750" />
                    <ellipse cx="0" cy="-300" rx="160" ry="0" className="drip" data-ry="700" />
                    <ellipse cx="0" cy="-300" rx="130" ry="0" className="drip" data-ry="740" />
                    <ellipse cx="0" cy="-300" rx="185" ry="0" className="drip" data-ry="690" />
                    <ellipse cx="0" cy="-300" rx="120" ry="0" className="drip" data-ry="730" />
                    <ellipse cx="0" cy="-300" rx="150" ry="0" className="drip" data-ry="710" />
                    <ellipse cx="0" cy="-300" rx="100" ry="0" className="drip" data-ry="760" />
                    <ellipse cx="0" cy="-300" rx="210" ry="0" className="drip" data-ry="640" />
                    <ellipse cx="0" cy="-300" rx="90"  ry="0" className="drip" data-ry="770" />
                  </g>
                </mask>
                </defs>
                <image
                  href="/images/scene1.png"
                  width="100%"
                  height="100%"
                  mask="url(#liquidMask)"
                  preserveAspectRatio="xMidYMid slice"
                />
              </svg>
              {/* Signature overlay di tengah hero-box */}
              <SignatureOverlay heroRef={heroBoxRef} />
              {/* Overlay hijau gelap dengan blur saat goo dimatikan */}
              <div className="hero-overlay" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Section 3: Our Member cards */}
      <MembersSection />

      {/* Section 4: Layer khusus dengan Perlin abu-abu */}
      <NextSection />
    </section>
  );
}
