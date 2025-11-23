"use client";

const DEFAULT_SPONSORS = ["HUI777", "OLXBOLA", "BET77", "STAKE", "INDOSAT", "SPRITE", "KANTORBOLA"];

function SponsorMark({ label }) {
  return (
    <div className="sponsor-pill" aria-label={label}>
      <svg viewBox="0 0 120 26" role="img" aria-hidden="true" focusable="false">
        <rect x="4" y="6" width="112" height="14" rx="7" ry="7" opacity="0.12" />
        <circle cx="18" cy="13" r="6" />
        <text x="34" y="17" textLength="78" lengthAdjust="spacingAndGlyphs">
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function SponsorMarquee({ sponsors = DEFAULT_SPONSORS }) {
  const list = sponsors.length ? sponsors : DEFAULT_SPONSORS;
  return (
    <div className="sponsor-marquee" aria-label="Sponsor logo ticker">
      <div className="sponsor-track">
        {[...list, ...list].map((s, idx) => (
          <SponsorMark key={`${s}-${idx}`} label={s} />
        ))}
      </div>
    </div>
  );
}
