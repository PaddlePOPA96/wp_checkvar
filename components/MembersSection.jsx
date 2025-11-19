"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useCounterZoom from "./hooks/useCounterZoom";

function ImageWithFallback({ src, fallback, alt, className }) {
  const [current, setCurrent] = useState(src);
  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={className}
      onError={() => setCurrent(fallback)}
      sizes="(max-width: 1024px) 50vw, 25vw"
    />
  );
}

export default function MembersSection() {
  const zoomRef = useRef(null);
  useCounterZoom(zoomRef);
  const members = [
    { name: "Member 1", role: "", src: "/images/hui.png", fallback: "/images/members/hui.png" },
    { name: "Member 2", role: "", src: "/images/owen.png", fallback: "/images/members/owen.png" },
    { name: "Member 3", role: "", src: "/images/member3.jpg", fallback: "/images/members/member3.svg" },
    { name: "Member 4", role: "", src: "/images/member4.jpg", fallback: "/images/members/member4.svg" },
  ];

  // Perlin lokal dihapus untuk menghindari dobel; kita blur perlin global saja

  return (
    <section className="members-section">
      {/* Sama seperti hero: pakai blur global saja (tidak ada overlay khusus section) */}
      <div className="members-container" ref={zoomRef}>
        {/* Animated title */}
        <div className="members-title-anim" aria-hidden="true">
          <h2 className="m-anim">
            MEMBER
            {/* Effect ini butuh dua span pertama berisi teks YANG SAMA */}
            <span>MEMBER</span>
            <span>MEMBER</span>
            {/* Garis kuning teks di tengah */}
            <span>CHECKVARNOW</span>
          </h2>
        </div>
        <h2 className="sr-only">OUR MEMBER</h2>
        <div className="members-grid">
          {members.map((m, i) => (
            <article className="member-card" key={i}>
              <div className="member-image-wrap">
                <ImageWithFallback src={m.src} fallback={m.fallback} alt={m.name} className="member-image" />
              </div>
              <div className="member-info">
                <h3 className="member-name">{m.name}</h3>
                {m.role ? <p className="member-role">{m.role}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
