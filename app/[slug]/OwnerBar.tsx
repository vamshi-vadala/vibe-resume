"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";

// Owner-only slim bar on the public profile. The page has no platform chrome
// (it's the owner's identity, not a tool page), so a signed-in OWNER otherwise
// has no way back to edit/share. Renders nothing for anonymous visitors and
// non-owners — the public sees a clean profile. Env-guarded + anonymous
// fallback, same hard rule as HomeAccountBand / UserMenu.
export default function OwnerBar({ slug }: { slug: string }) {
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      // RLS: a user can SELECT their own slug rows. Match = viewer owns this one.
      const { data } = await supabase
        .from("slugs")
        .select("slug")
        .eq("slug", slug)
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!cancelled && data) setIsOwner(true);
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (!isOwner) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://viberesume.in/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  }

  return (
    <div
      role="status"
      className="print-hide"
      style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        marginBottom: 14, padding: "8px 14px", borderRadius: 10,
        border: "1px solid var(--line)", background: "var(--panel)", fontSize: 14,
      }}
    >
      <span style={{ color: "var(--muted)" }}>This is your live site</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", gap: 14, alignItems: "center" }}>
        <Link href={`/account/${slug}/settings`} style={{ color: "var(--accent)", fontWeight: 700 }}>
          Edit
        </Link>
        <button
          type="button"
          onClick={copy}
          style={{ background: "none", border: 0, color: "var(--accent)", fontWeight: 700, cursor: "pointer", font: "inherit", padding: 0 }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <Link href="/account" style={{ color: "var(--muted)", fontWeight: 600 }}>
          Account →
        </Link>
      </span>
    </div>
  );
}
