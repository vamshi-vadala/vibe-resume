import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  { label: "github.com/jordan", free: true },
  { label: "x.com/jordan", free: true },
  { label: "linkedin.com/in/jordan", free: false },
];

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
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", background: "rgba(91,140,255,0.18)", border: "1px solid rgba(91,140,255,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 32, alignSelf: "flex-start" }}>
            <span style={{ color: "#5b8cff", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Free Tool · Vibe Resume</span>
          </div>
          <div style={{ color: "#e7ecf2", fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 26 }}>
            Portfolio Handle Checker
          </div>
          <div style={{ color: "#93a0b0", fontSize: 31, fontWeight: 400, lineHeight: 1.4 }}>
            Is @yourname still free? Check and claim it. Free.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 360 }}>
          {ROWS.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "16px 20px" }}>
              <span style={{ color: "#cdd6e2", fontSize: 24, fontFamily: "monospace" }}>{r.label}</span>
              <span style={{ display: "flex", color: r.free ? "#06281d" : "#3a0d0d", background: r.free ? "#3ad29f" : "#ff6b6b", fontSize: 18, fontWeight: 800, borderRadius: 20, padding: "5px 14px" }}>
                {r.free ? "FREE" : "TAKEN"}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
