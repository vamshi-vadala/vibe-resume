import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The "natural" longer slug some people/sites guess for the ATS tool —
      // 301 it to the canonical slug instead of 404ing.
      {
        source: "/tools/ats-plain-text-resume-converter",
        destination: "/tools/ats-plain-text-converter",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
