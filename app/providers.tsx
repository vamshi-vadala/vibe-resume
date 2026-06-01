"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Initialize once on the client, only when a key is configured.
// With no key, posthog.capture(...) calls elsewhere are harmless no-ops.
if (typeof window !== "undefined" && KEY) {
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // captured per-route below (App Router has no full reloads)
    capture_pageleave: true,
  });
}

export function Analytics({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (KEY) posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
