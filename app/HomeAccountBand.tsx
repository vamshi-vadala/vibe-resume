"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";

// Signed-in personalization for the (fully static) homepage. Renders nothing
// for anonymous visitors and in env-less CI — the static HTML is the anon
// experience, this island only ADDS a band after mount for signed-in users.
// Same pattern and trade-offs as UserMenu: see that file's header comment.

type SiteRow = { slug: string; published_at: string | null };

export default function HomeAccountBand() {
  const [rows, setRows] = useState<SiteRow[] | null>(null);

  useEffect(() => {
    // Env guard — hard rule for global/static-page client islands.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      // RLS: slug + published_at are selectable; resume_data is not (revoked).
      const { data } = await supabase
        .from("slugs")
        .select("slug, published_at")
        .eq("user_id", session.user.id)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (!cancelled && data) setRows(data);
    });
    return () => { cancelled = true; };
  }, []);

  if (!rows) return null;
  const live = rows.find((r) => r.published_at);

  return (
    <div
      role="status"
      style={{
        maxWidth: 760, margin: "20px auto 0", padding: "12px 18px", borderRadius: 12,
        border: "1px solid var(--line)", background: "var(--panel)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap", fontSize: 14,
      }}
    >
      {live ? (
        <span>
          Your site is live:{" "}
          <a href={`/${live.slug}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
            viberesume.in/{live.slug} ↗
          </a>
        </span>
      ) : rows.length > 0 ? (
        <span>
          Welcome back — <strong>viberesume.in/{rows[0].slug}</strong> is reserved and waiting to go live.
        </span>
      ) : (
        <span>Welcome back — your website is about two minutes away.</span>
      )}
      <Link href="/account" style={{ color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }}>
        Manage your site →
      </Link>
    </div>
  );
}
