"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

export default function ImageWithFallback({ src, fallback, alt, className, sizes }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const resolvedSrc = useMemo(() => (src?.startsWith("http") ? src : `${base}${src}`), [src, base]);
  const resolvedFallback = useMemo(() => (fallback ? (fallback.startsWith("http") ? fallback : `${base}${fallback}`) : undefined), [fallback, base]);
  const [current, setCurrent] = useState(resolvedSrc);
  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={className}
      onError={() => resolvedFallback && setCurrent(resolvedFallback)}
      sizes={sizes || "(max-width: 1024px) 50vw, 25vw"}
      unoptimized
    />
  );
}
