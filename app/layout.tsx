// app/layout.tsx
import "./globals.css";
import "./hero.css";
import PerlinBackground from "../components/PerlinBackground";

export const metadata = {
  title: "Perlin Topography",
  description: "Background topografi Perlin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <PerlinBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
