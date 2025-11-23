import Hero from "../components/Hero";
import styles from "./home-rail.module.css";
import ClientMatchRail from "../components/ClientMatchRail";

const LOGO_BASE = process.env.NEXT_PUBLIC_LOGO_BASE || "https://backend-wp-checkvar-7o54.vercel.app";
const YT_CHANNEL_ID = "UC3AuMqMDz9h8Fbgv_gvrTng";
const DAY_MS = 24 * 60 * 60 * 1000;

type Team = { name: string; logo_url?: string; score?: number | null };
type Match = { id: string; date: string; competition: string; home_team: Team; away_team: Team };
type ApiResp = { today_matches: Match[]; last_matches: Match[]; next_matches: Match[]; last_updated: string };
type VideoItem = { id: string; title: string; published: string; thumbnail: string; url: string; embedUrl: string };

async function getMatches(): Promise<ApiResp> {
  const res = await fetch("https://backend-wp-checkvar-7o54.vercel.app/api/matches", {
    headers: { "x-secret": "BACOT" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Gagal memuat data");
  return res.json();
}

function resolveLogo(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${LOGO_BASE}/${url.replace(/^\//, "")}`;
}

function dayStartTs(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d)).getTime();
}

function parseDateTs(date: string) {
  const [y, m, d] = date.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return dayStartTs(y, m - 1, d);
}

function filterWindow(matches: Match[], startOffsetDays: number, endOffsetDays: number) {
  const now = new Date();
  const base = dayStartTs(now.getFullYear(), now.getMonth(), now.getDate());
  const start = base + startOffsetDays * DAY_MS;
  const end = base + endOffsetDays * DAY_MS + (DAY_MS - 1);
  return matches.filter((m) => {
    const ts = parseDateTs(m.date);
    if (ts === null) return false;
    return ts >= start && ts <= end;
  });
}

function pickPriorityMatches(data: ApiResp | null) {
  if (!data) return [];
  const today = filterWindow([...data.today_matches, ...(data.next_matches || [])], 0, 0);
  if (today.length) return today;
  const next7 = filterWindow(data.next_matches || [], 1, 7);
  if (next7.length) return next7;
  return filterWindow(data.next_matches || [], 8, 14);
}

async function getLatestVideos(limit = 3): Promise<VideoItem[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    const videos: VideoItem[] = [];
    for (const raw of entries) {
      const entry = `<entry>${raw}`;
      const id = entry.match(/<yt:videoId>([^<]+)</)?.[1];
      const title = entry.match(/<title>([^<]+)</)?.[1];
      const thumb = entry.match(/media:thumbnail[^>]+url="([^"]+)"/)?.[1];
      const published = entry.match(/<published>([^<]+)</)?.[1] || "";
      if (!id || !title) continue;
      videos.push({
        id,
        title,
        published,
        thumbnail: thumb || "",
        url: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube.com/embed/${id}`,
      });
      if (videos.length >= limit) break;
    }
    return videos;
  } catch (err) {
    console.error("Failed to fetch youtube feed", err);
    return [];
  }
}

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

function Score({ match }: { match: Match }) {
  const hs = match.home_team.score ?? "-";
  const as = match.away_team.score ?? "-";
  return (
    <div className={styles.railScore}>
      <span>{hs}</span>
      <span style={{ margin: "0 6px" }}>-</span>
      <span>{as}</span>
    </div>
  );
}

function MatchRailCard({ m, index }: { m: Match; index: number }) {
  return (
    <div className={styles.railCard} style={{ animationDelay: `${index * 80}ms` }}>
      <div className={styles.railMeta}>
        <span className={styles.railDate}>{formatDateLabel(m.date)}</span>
      </div>
      <div className={styles.railRow}>
        <div className={styles.railTeam}>
          {resolveLogo(m.home_team.logo_url) && <img src={resolveLogo(m.home_team.logo_url)} alt={m.home_team.name} />}
          <span className={styles.railNameBar} aria-hidden />
        </div>
        <Score match={m} />
        <div className={styles.railTeam}>
          {resolveLogo(m.away_team.logo_url) && <img src={resolveLogo(m.away_team.logo_url)} alt={m.away_team.name} />}
          <span className={styles.railNameBar} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let data: ApiResp | null = null;
  try {
    data = await getMatches();
  } catch (err) {
    console.error("Failed to load matches", err);
  }
  const videos = await getLatestVideos();

  const priorityMatches = pickPriorityMatches(data);
  const hasToday = filterWindow([...((data && data.today_matches) || []), ...((data && data.next_matches) || [])], 0, 0).length > 0;
  const hasNext7 = filterWindow((data && data.next_matches) || [], 1, 7).length > 0;
  const fallbackMessage = hasToday
    ? ""
    : hasNext7
      ? "Menampilkan 7 hari ke depan."
      : "Menampilkan hari ke-8 s/d ke-14.";

  return (
    <main style={{ position: "relative" }}>
      <ClientMatchRail
        matches={priorityMatches}
        logoBase={LOGO_BASE}
        emptyMessage={`Belum ada pertandingan hari ini. ${fallbackMessage}`}
      />
      <Hero videos={videos} channelUrl="https://www.youtube.com/@checkvarnow/streams" />
    </main>
  );
}
