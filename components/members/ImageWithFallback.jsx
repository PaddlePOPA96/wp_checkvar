"use client";

import Image from "next/image";
import { useState } from "react";

export default function ImageWithFallback({ src, fallback, alt, className, sizes }) {
  const [current, setCurrent] = useState(src);
  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={className}
      onError={() => setCurrent(fallback)}
      sizes={sizes || "(max-width: 1024px) 50vw, 25vw"}
    />
  );
}

