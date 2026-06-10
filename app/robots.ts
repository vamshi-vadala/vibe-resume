import type { MetadataRoute } from "next";

const BASE = "https://viberesume.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/auth/", "/claim/"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
