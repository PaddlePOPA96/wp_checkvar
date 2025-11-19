// app/layout.tsx
import "./globals.css";
import "./hero.css";
import "./sections.css";
import PerlinBackground from "../components/PerlinBackground";

export const metadata = {
  title: "WEB PROFILE CHECKVAR",
  description: "Background topografi Perlin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <PerlinBackground />
        {/* Global blur overlay on Perlin background (top -> bottom stronger) */}
        <div className="global-perlin-blur" aria-hidden />
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
