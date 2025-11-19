"use client";

import { useRef } from "react";
import useCounterZoom from "./hooks/useCounterZoom";
import MemberCard from "./members/MemberCard";
import { MEMBERS } from "../config/ui";

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
          {MEMBERS.map((m, i) => (
            <MemberCard member={m} key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
