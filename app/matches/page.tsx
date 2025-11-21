import Link from "next/link";
import styles from "./matches.module.css";

const LOGO_BASE = process.env.NEXT_PUBLIC_LOGO_BASE || "https://backend-wp-checkvar-7o54.vercel.app";
const DAY_MS = 24 * 60 * 60 * 1000;

type Team = { name: string; logo_url?: string; score?: number | null };
type Match = { id: string; date: string; competition: string; home_team: Team; away_team: Team };
type ApiResp = { today_matches: Match[]; last_matches: Match[]; next_matches: Match[]; last_updated: string };

async function getMatches(): Promise<ApiResp> {
  const res = await fetch("https://backend-wp-checkvar-7o54.vercel.app/api/matches", {
    // tambahkan header secret jika perlu
    headers: { "x-secret": "BACOT" },
    next: { revalidate: 60 }, // ISR 60 detik
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

function pickPriorityMatches(data: ApiResp) {
  const today = filterWindow([...data.today_matches, ...(data.next_matches || [])], 0, 0);
  if (today.length) return { list: today, note: "" };
  const next7 = filterWindow(data.next_matches || [], 1, 7);
  if (next7.length) return { list: next7, note: "Menampilkan 7 hari ke depan." };
  const next14 = filterWindow(data.next_matches || [], 8, 14);
  return { list: next14, note: "Menampilkan hari ke-8 s/d ke-14." };
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
    <div className={styles.score}>
      <span>{hs}</span>
      <span style={{ margin: "0 6px" }}>-</span>
      <span>{as}</span>
    </div>
  );
}

function MatchCard({ m, index }: { m: Match; index: number }) {
  return (
    <div className={styles.card} style={{ animationDelay: `${index * 90}ms` }}>
      <div className={styles.meta}>
        <span className={styles.date}>{formatDateLabel(m.date)}</span>
        {m.competition && <span className={styles.pill}>{m.competition}</span>}
      </div>
      <div className={styles.row}>
        <div className={styles.team}>
          {resolveLogo(m.home_team.logo_url) && <img src={resolveLogo(m.home_team.logo_url)} alt={m.home_team.name} />}
          <span>{m.home_team.name}</span>
        </div>
        <Score match={m} />
        <div className={styles.team}>
          {resolveLogo(m.away_team.logo_url) && <img src={resolveLogo(m.away_team.logo_url)} alt={m.away_team.name} />}
          <span>{m.away_team.name}</span>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const data = await getMatches();
  const { list: prioritizedToday, note } = pickPriorityMatches(data);
  const todayOnly = filterWindow([...data.today_matches, ...(data.next_matches || [])], 0, 0);
  const next7 = filterWindow(data.next_matches || [], 1, 7);
  const next14 = filterWindow(data.next_matches || [], 8, 14);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.muted}>Last updated: {data.last_updated || "-"}</p>
          {note && <p className={styles.hint}>Belum ada pertandingan hari ini. {note}</p>}
        </div>
        <Link href="/">Kembali</Link>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.heading}>Pertandingan Hari Ini / Terdekat</h2>
          <span className={styles.tag}>Live / Jadwal</span>
        </div>
        <div className={styles.grid}>
          {prioritizedToday.length ? (
            prioritizedToday.map((m, idx) => <MatchCard key={m.id} m={m} index={idx} />)
          ) : (
            <p>Belum ada.</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.heading}>Hasil 7 Hari Terakhir</h2>
          <span className={styles.tag}>Final</span>
        </div>
        <div className={styles.grid}>
          {data.last_matches?.length ? (
            data.last_matches.map((m, idx) => <MatchCard key={m.id} m={m} index={idx} />)
          ) : (
            <p>Belum ada.</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.heading}>Jadwal 7 Hari Ke Depan</h2>
          <span className={styles.tag}>Upcoming</span>
        </div>
        <div className={styles.grid}>
          {next7.length
            ? next7.map((m, idx) => <MatchCard key={m.id} m={m} index={idx} />)
            : next14.length
              ? next14.map((m, idx) => <MatchCard key={m.id} m={m} index={idx} />)
              : <p>Belum ada.</p>}
        </div>
      </section>
    </main>
  );
}
