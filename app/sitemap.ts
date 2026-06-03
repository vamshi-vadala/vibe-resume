import type { MetadataRoute } from "next";

const BASE = "https://vibe-resumes.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/tools/pdf-resume-to-website`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/tools/ats-plain-text-converter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];
}
