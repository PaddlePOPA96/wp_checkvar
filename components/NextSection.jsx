"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { startPerlinTopography } from "../lib/perlinTopography";
import { PERLIN_LINE_COLOR } from "../config/ui";
import SponsorMarquee from "./SponsorMarquee";

const FALLBACK_PLAYLIST = "https://www.youtube.com/embed?listType=playlist&list=UU3AuMqMDz9h8Fbgv_gvrTng";

export default function NextSection({ videos = [], channelUrl }) {
  const canvasRef = useRef(null);
  const [showList, setShowList] = useState(false);
  const primaryVideo = videos[0];
  const channelHref = channelUrl || "https://www.youtube.com/@checkvarnow/streams";
  const embedSrc = useMemo(() => {
    if (primaryVideo?.embedUrl) return `${primaryVideo.embedUrl}?rel=0&modestbranding=1`;
    return `${FALLBACK_PLAYLIST}&rel=0&modestbranding=1`;
  }, [primaryVideo]);

  // Render iframe hanya setelah mount di client untuk menghindari biaya di server render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getSize = () => {
      const el = canvas.parentElement || canvas;
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    };
    const cleanup = startPerlinTopography(canvas, {
      lineColor: PERLIN_LINE_COLOR,
      getSize,
      observeElement: canvas.parentElement || undefined,
    });
    return () => cleanup && cleanup();
  }, []);

  const embedClass = "video-embed";
  const stageClass = showList ? "video-stage video-stage--with-rail" : "video-stage";
  const railClass = "video-rail";

  return (
    <section className="layer-black-section video-layer" style={{ position: "relative" }}>
      <div className="section-top-fade" aria-hidden />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
        className="next-perlin"
      />
      <div className="next-blur" aria-hidden />

      <div className="video-shell">
        <div className="video-frame">
          <div className="video-frame__badge">
            <span className="badge-dot" aria-hidden />
            <span>Latest stream</span>
          </div>
          <div className={stageClass}>
            <div className={embedClass}>
              {mounted && (
                <iframe
                  src={embedSrc}
                  title={primaryVideo?.title || "Checkvar terbaru"}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              )}
              <div className="video-curve" aria-hidden />
            </div>

            <div className={railClass} id="last-tracks" aria-hidden={!showList}>
              <div style={{ padding: "6px" }}>
                {videos.slice(0, 3).map((vid) => (
                  <a key={vid.id} href={vid.url} target="_blank" rel="noreferrer" className="video-rail__item">
                    <div className="video-rail__thumb">
                      {vid.thumbnail ? (
                        <img src={vid.thumbnail} alt={vid.title} loading="lazy" />
                      ) : (
                        <div className="thumb-fallback" aria-hidden />
                      )}
                      <span className="video-chip">New</span>
                    </div>
                    <div className="video-rail__body">
                      <div className="video-rail__title">{vid.title}</div>
                      <div className="video-rail__meta">{new Date(vid.published || Date.now()).toLocaleDateString("id-ID")}</div>
                    </div>
                  </a>
                ))}
                {videos.length === 0 && <div className="video-rail__empty">Belum ada video</div>}
              </div>
            </div>
          </div>

          {videos.length > 0 && (
            <div className="video-toggle">
              <div className="toggle-line" aria-hidden />
              <button
                className={`last-track-toggle${showList ? " is-active" : ""}`}
                type="button"
                onClick={() => setShowList((v) => !v)}
                aria-expanded={showList}
                aria-controls="last-tracks"
                title="Tampilkan 3 video terakhir"
              >
                <span aria-hidden>⏮</span>
                <span className="last-track-label">{showList ? "Tutup last tracks" : "Last tracks"}</span>
              </button>
            </div>
          )}
        </div>

        <SponsorMarquee />
      </div>
    </section>
  );
}
