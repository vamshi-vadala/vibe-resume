import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STEPS = ["Overview", "Challenge", "Approach", "Outcome"];

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
        <div style={{ display: "flex", background: "rgba(91,140,255,0.18)", border: "1px solid rgba(91,140,255,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 34 }}>
          <span style={{ color: "#5b8cff", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Free Tool · Vibe Resume</span>
        </div>
        <div style={{ color: "#e7ecf2", fontSize: 74, fontWeight: 800, lineHeight: 1.1, marginBottom: 30, maxWidth: 980 }}>
          Case Study Template for Designers
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", background: "rgba(58,210,159,0.14)", border: "1px solid rgba(58,210,159,0.4)", borderRadius: 12, padding: "8px 18px" }}>
                <span style={{ color: "#3ad29f", fontSize: 25, fontWeight: 600 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <span style={{ color: "#5b8cff", fontSize: 28 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ color: "#93a0b0", fontSize: 31, fontWeight: 400, lineHeight: 1.4, maxWidth: 880 }}>
          A project in, a structured case study out. Markdown export. Free.
        </div>
      </div>
    ),
    { ...size }
  );
}
