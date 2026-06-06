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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "72px 80px", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ display: "flex", background: "rgba(91,140,255,0.18)", border: "1px solid rgba(91,140,255,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 32, alignSelf: "flex-start" }}>
            <span style={{ color: "#5b8cff", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Free Tool · Vibe Resume</span>
          </div>
          <div style={{ color: "#e7ecf2", fontSize: 70, fontWeight: 800, lineHeight: 1.1, marginBottom: 26 }}>
            Resume QR Code Generator
          </div>
          <div style={{ color: "#93a0b0", fontSize: 31, fontWeight: 400, lineHeight: 1.4 }}>
            One scan from paper to your portfolio. PNG or SVG. Free.
          </div>
        </div>
        {/* simple decorative QR-like motif */}
        <div style={{ display: "flex", flexWrap: "wrap", width: 240, height: 240, background: "#ffffff", borderRadius: 20, padding: 16 }}>
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} style={{ width: 26, height: 26, background: (i * 7 + (i % 5) + ((i >> 3) % 3)) % 3 === 0 ? "#0b0d10" : "#ffffff" }} />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
