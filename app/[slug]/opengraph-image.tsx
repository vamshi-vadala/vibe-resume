import { ImageResponse } from "next/og";
import { loadProfile, nameForMeta, subtitleForMeta } from "./profile.ts";

// Per-profile share card (LinkedIn/Twitter/Slack unfurls). Same brand styling
// as the tool OG images; falls back to a generic Vibe Resume card for
// unclaimed/unpublished slugs so the unfurl never breaks.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A personal website on Vibe Resume";

type Ctx = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Ctx) {
  const { slug } = await params;
  const loaded = await loadProfile(slug.toLowerCase());
  const isProfile = loaded?.kind === "profile";
  const name = isProfile ? nameForMeta(loaded.payload) : "Vibe Resume";
  const subtitle = isProfile
    ? subtitleForMeta(loaded.payload) || `viberesume.in/${slug}`
    : "Turn your resume into a website you own — free";

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
        <div style={{ display: "flex", background: "rgba(58,210,159,0.18)", border: "1px solid rgba(58,210,159,0.4)", borderRadius: 40, padding: "8px 22px", marginBottom: 36 }}>
          <span style={{ color: "#3ad29f", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
            viberesume.in/{slug}
          </span>
        </div>
        <div style={{ color: "#e7ecf2", fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginBottom: 28, maxWidth: 1000 }}>
          {name}
        </div>
        <div style={{ color: "#93a0b0", fontSize: 38, fontWeight: 400, lineHeight: 1.35, maxWidth: 960 }}>
          {subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
