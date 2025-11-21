"use client";

import { Luckiest_Guy, Permanent_Marker } from "next/font/google";

const luckiest = Luckiest_Guy({ subsets: ["latin"], weight: "400" });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400" });

export default function AnimatedLogo() {
  return (
    <div className="logo-floating">
      <div className="logo-bounce logo-retro">
        <span className={`logo-word logo-check ${luckiest.className}`}>CHECK</span>
        <span className={`logo-word logo-var ${marker.className}`}>var</span>
        <span className={`logo-word logo-now ${luckiest.className}`}>NOW</span>
      </div>
    </div>
  );
}
