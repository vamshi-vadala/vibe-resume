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
        {/* pill tag */}
        <div style={{ display: "flex", background: "rgba(58,210,159,0.18)", border: "1px solid rgba(58,210,159,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 36 }}>
          <span style={{ color: "#3ad29f", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Free Tool · Vibe Resume</span>
        </div>
        {/* headline */}
        <div style={{ color: "#e7ecf2", fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 32, maxWidth: 900 }}>
          PDF Resume to Website Converter
        </div>
        {/* sub */}
        <div style={{ color: "#93a0b0", fontSize: 34, fontWeight: 400, lineHeight: 1.4, maxWidth: 820 }}>
          Upload your PDF → get a clean personal website. Instant, free, private.
        </div>
      </div>
    ),
    { ...size }
  );
}
