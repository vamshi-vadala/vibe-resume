import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        <div style={{ color: "#e7ecf2", fontSize: 74, fontWeight: 800, lineHeight: 1.1, marginBottom: 30, maxWidth: 960 }}>
          LinkedIn URL Customizer
        </div>
        {/* before / after URL chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#93a0b0", fontSize: 28, fontFamily: "monospace", textDecoration: "line-through" }}>linkedin.com/in/jordan-rivera-8a4b21902</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#3ad29f", fontSize: 34, fontFamily: "monospace", fontWeight: 700 }}>linkedin.com/in/jordan-rivera</span>
          </div>
        </div>
        <div style={{ color: "#93a0b0", fontSize: 30, fontWeight: 400, lineHeight: 1.4, maxWidth: 860 }}>
          Type your name. Get a clean, professional URL. Free.
        </div>
      </div>
    ),
    { ...size }
  );
}
