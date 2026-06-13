import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A row of mini theme swatches to convey "pick a look".
const SWATCHES = [
  { bg: "#141a2e", accent: "#5b8cff" },
  { bg: "#ffffff", accent: "#111111" },
  { bg: "#0f150f", accent: "#38d65b" },
  { bg: "#251521", accent: "#ff7a59" },
  { bg: "#ffffff", accent: "#7c3aed" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #0b0d10 0%, #1b2a4a 60%, #163a31 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          padding: "72px 80px", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", background: "rgba(91,140,255,0.18)", border: "1px solid rgba(91,140,255,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 36 }}>
          <span style={{ color: "#5b8cff", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Free Tool · Vibe Resume</span>
        </div>
        <div style={{ color: "#e7ecf2", fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginBottom: 28, maxWidth: 960 }}>
          Dev Portfolio Theme Picker
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 30 }}>
          {SWATCHES.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", width: 96, height: 64, borderRadius: 12, background: s.bg, border: "1px solid rgba(255,255,255,0.14)", padding: 10 }}>
              <div style={{ width: 30, height: 10, borderRadius: 6, background: s.accent }} />
            </div>
          ))}
        </div>
        <div style={{ color: "#93a0b0", fontSize: 32, fontWeight: 400, lineHeight: 1.4, maxWidth: 860 }}>
          Swipe portfolio themes. Keep the look you love. Free.
        </div>
      </div>
    ),
    { ...size }
  );
}
