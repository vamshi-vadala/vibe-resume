import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

export const metadata: Metadata = {
  title: "Your account — Vibe Resume",
  description: "Your reserved viberesume.in handles.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string; error?: string; slug?: string }>;
}) {
  const { claimed, error, slug: errSlug } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup?next=/account");

  const { data: slugs } = await supabase
    .from("slugs")
    .select("slug, created_at, published_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px", fontFamily: "inherit" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Your account</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      {claimed && (
        <div role="status" style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 10,
          background: "var(--panel)", border: "1px solid var(--accent)", color: "var(--text)",
        }}>
          ✓ Reserved <strong>viberesume.in/{claimed}</strong>.
          Publishing comes next — we’ll email you when it’s ready.
        </div>
      )}
      {error && (
        <div role="alert" style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 10,
          background: "var(--panel)", border: "1px solid var(--danger, #e5484d)", color: "var(--text)",
        }}>
          {error === "taken" && <>Sorry — <strong>{errSlug}</strong> was just taken.</>}
          {error === "reserved" && <>That handle is a reserved name on Vibe Resume.</>}
          {error === "invalid" && <>That handle isn’t a valid format.</>}
          {error !== "taken" && error !== "reserved" && error !== "invalid" && (
            <>Couldn’t complete the claim — try again.</>
          )}
        </div>
      )}

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your handles</h2>
        {!slugs || slugs.length === 0 ? (
          <div style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)" }}>
            <p style={{ color: "var(--muted)", marginBottom: 12 }}>
              You haven’t reserved a handle yet. Pick one from the handle checker.
            </p>
            <Link
              href="/tools/portfolio-handle-checker"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              Check a handle →
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {slugs.map((s) => (
              <li
                key={s.slug}
                style={{
                  padding: "14px 18px",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  background: "var(--panel)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>viberesume.in/{s.slug}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                    {s.published_at ? "Live" : "Reserved · publishing coming soon"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
