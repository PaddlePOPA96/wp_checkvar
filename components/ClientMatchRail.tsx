"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "../app/home-rail.module.css";

type Team = { name: string; logo_url?: string; score?: number | null };
type Match = { id: string; date: string; competition: string; home_team: Team; away_team: Team };

function formatDateLabel(date: string) {
  const parts = date.split("-");
  if (parts.length === 3) {
    const matchDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    const isToday =
      matchDate.getFullYear() === today.getFullYear() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getDate() === today.getDate();
    if (isToday) return "TODAY";
  }
  return date;
}

export default function ClientMatchRail({
  matches,
  logoBase,
  emptyMessage,
}: {
  matches: Match[];
  logoBase: string;
  emptyMessage: string;
}) {
  const [progress, setProgress] = useState(0);
  const [fullyHidden, setFullyHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hideStart = 0;
      const hideEnd = 520; // px scroll distance to begin fade/slide
      const p = Math.min(1, Math.max(0, (window.scrollY - hideStart) / (hideEnd - hideStart)));
      setProgress(p);
      // Saat melewati hero+member (>= 1.2 viewport), sembunyikan total
      const cutoff = window.innerHeight * 1.2;
      setFullyHidden(window.scrollY > cutoff);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const resolveLogo = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${logoBase}/${url.replace(/^\//, "")}`;
  };

  const slideStyle: CSSProperties = {
    transform: fullyHidden ? "translate(-200%, 0)" : `translate(calc(-50% - ${progress * 120}%), 0)`,
    opacity: fullyHidden ? 0 : 1 - progress * 0.8,
    pointerEvents: fullyHidden ? "none" : "auto",
  };

  const source = matches.length ? matches : [];
  const loopItems = source.length ? [...source, ...source] : [];

  return (
    <section className={styles.matchesRail} style={slideStyle}>
      {loopItems.length ? (
        <div className={styles.railTrack}>
          <div className={styles.railLoop}>
            {loopItems.map((m, idx) => (
              <div className={styles.railCard} key={`${m.id}-${idx}`}>
                <div className={styles.railMeta}>
                  <span className={styles.railDate}>{formatDateLabel(m.date)}</span>
                </div>
                <div className={styles.railRow}>
                  <div className={styles.railTeam}>
                    {resolveLogo(m.home_team.logo_url) && (
                      <img src={resolveLogo(m.home_team.logo_url)} alt={m.home_team.name} />
                    )}
                    <span className={styles.railNameBar} aria-hidden />
                  </div>
                  <div className={styles.railScore}>
                    <span>{m.home_team.score ?? "-"}</span>
                    <span style={{ margin: "0 6px" }}>-</span>
                    <span>{m.away_team.score ?? "-"}</span>
                  </div>
                  <div className={styles.railTeam}>
                    {resolveLogo(m.away_team.logo_url) && (
                      <img src={resolveLogo(m.away_team.logo_url)} alt={m.away_team.name} />
                    )}
                    <span className={styles.railNameBar} aria-hidden />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.railTrack}>
          <p className={styles.railEmpty}>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
