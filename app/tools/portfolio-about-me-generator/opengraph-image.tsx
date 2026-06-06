import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TONES = ["Professional", "Friendly", "Confident", "Creative"];

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
        <div style={{ color: "#e7ecf2", fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginBottom: 30, maxWidth: 980 }}>
          Portfolio “About Me” Generator
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
          {TONES.map((t, i) => (
            <div key={i} style={{ display: "flex", background: "rgba(58,210,159,0.14)", border: "1px solid rgba(58,210,159,0.4)", borderRadius: 30, padding: "8px 20px" }}>
              <span style={{ color: "#3ad29f", fontSize: 26, fontWeight: 600 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "#93a0b0", fontSize: 32, fontWeight: 400, lineHeight: 1.4, maxWidth: 880 }}>
          Your role in, a polished bio out. Pick a tone. Free.
        </div>
      </div>
    ),
    { ...size }
  );
}
