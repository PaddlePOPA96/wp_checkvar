"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import useHeroScroll from "./hooks/useHeroScroll";
import NextSection from "./NextSection";
import MembersSection from "./MembersSection";
import useCounterZoom from "./hooks/useCounterZoom";
import SignatureOverlay from "./SignatureOverlay";
import { MARQUEE_TEXTS } from "../config/ui";
import FluidReveal from "./FluidReveal";

export default function Hero() {
  const rangeRef = useRef(null); // wrapper 2 layar (section 1 + section 2)
  const heroBoxRef = useRef(null); // satu-satunya hero
  const heroZoomRef = useRef(null);
  useHeroScroll(rangeRef, heroBoxRef, { disableGoo: () => {}, enableGoo: () => {} });
  useCounterZoom(heroZoomRef);

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
              {/* SVG goo removed; FluidReveal handles reveal */}
              {/* Fluid reveal (lightweight mask driven by 2D canvas) */}
              <FluidReveal heroRef={heroBoxRef} />
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
