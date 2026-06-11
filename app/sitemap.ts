import type { MetadataRoute } from "next";

const BASE = "https://viberesume.in";

// Re-generate hourly so newly published profiles show up without a deploy.
export const revalidate = 3600;

const STATIC_ENTRIES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  { url: `${BASE}/tools/pdf-resume-to-website`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/ats-plain-text-converter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/developer-resume-to-portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/github-to-portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/theme-picker`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/linkedin-url-customizer`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/portfolio-about-me-generator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/resume-qr-code-generator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/case-study-template`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/tools/portfolio-handle-checker`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/example`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Env guard: unit tests and CI run with no Supabase env — static list only.
  // Dynamic import so those environments never load the supabase client.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return STATIC_ENTRIES;
  }
  try {
    const { createSupabaseAdminClient } = await import("../lib/supabase/admin.ts");
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("slugs")
      .select("slug, updated_at")
      .not("published_at", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1000);
    const profiles: MetadataRoute.Sitemap = (data ?? []).map((r) => ({
      url: `${BASE}/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
    return [...STATIC_ENTRIES, ...profiles];
  } catch {
    return STATIC_ENTRIES;
  }
}
