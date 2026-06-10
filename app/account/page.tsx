import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import { ReleaseHandleButton, UnpublishHandleButton, DeleteAccountButton } from "./DangerActions";
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
  searchParams: Promise<{ claimed?: string; published?: string; unpublished?: string; released?: string; error?: string; slug?: string }>;
}) {
  const { claimed, published, unpublished, released, error, slug: errSlug } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup?next=/account");

  const { data: slugs } = await supabase
    .from("slugs")
    // Project only the discriminator + a name-ish field from resume_data so
    // the dashboard doesn't pull a multi-KB JSONB per row. The name lives
    // nested per kind (resume->name / profile->name), so project both. Either
    // name doubles as truthiness ("has any data yet?").
    .select("slug, created_at, published_at, resume_kind:resume_data->>kind, resume_name:resume_data->resume->>name, profile_name:resume_data->profile->>name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Per-kind metadata: which tool to send the user back to when they want to
  // re-publish, and a human label. kind=resume gets the in-app editor;
  // developer/github only ever show "Re-publish from tool →" until we add a
  // generic non-resume editor.
  const KIND_LABEL: Record<string, { label: string; tool: string }> = {
    resume: { label: "Resume site", tool: "/tools/pdf-resume-to-website" },
    developer: { label: "Developer portfolio", tool: "/tools/developer-resume-to-portfolio" },
    github: { label: "GitHub portfolio", tool: "/tools/github-to-portfolio" },
  };
  // Missing kind on existing rows = "resume" (matches publish.ts default).
  const kindOf = (k: string | null | undefined) => (k && KIND_LABEL[k] ? k : "resume");

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
          ✓ Reserved <strong>viberesume.in/{claimed}</strong>. Generate a website from your PDF and publish it next.
        </div>
      )}
      {published && (() => {
        const row = slugs?.find((s) => s.slug === published);
        const isResume = kindOf(row?.resume_kind) === "resume";
        return (
          <div role="status" style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            background: "var(--panel)", border: "1px solid var(--accent)", color: "var(--text)",
          }}>
            <div>✓ Published to <strong>viberesume.in/{published}</strong>.</div>
            <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 14 }}>
              <Link href={`/${published}`} style={{ color: "var(--accent)", fontWeight: 600 }}>View live ↗</Link>
              {isResume && (
                <Link href={`/account/${published}/settings`} style={{ color: "var(--accent)", fontWeight: 600 }}>Edit profile →</Link>
              )}
            </div>
          </div>
        );
      })()}
      {unpublished && (
        <div role="status" style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 10,
          background: "var(--panel)", border: "1px solid var(--line)", color: "var(--text)",
        }}>
          Unpublished <strong>viberesume.in/{unpublished}</strong>. The handle is still yours — re-publish anytime from Edit.
        </div>
      )}
      {released && (
        <div role="status" style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 10,
          background: "var(--panel)", border: "1px solid var(--line)", color: "var(--text)",
        }}>
          Released <strong>viberesume.in/{released}</strong>. The page and its data are deleted; the handle is free to claim again.
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
          {error === "not_editable" && (
            <>To change <strong>viberesume.in/{errSlug}</strong>, re-publish from the source tool. Only resume-site profiles have an in-app editor today.</>
          )}
          {error === "bad_data" && <>Couldn’t open <strong>viberesume.in/{errSlug}</strong> — stored data is malformed. Try re-publishing.</>}
          {error === "limit" && <>You’ve reached the handle limit. Release one you’re not using to claim <strong>{errSlug}</strong>.</>}
          {!["taken", "reserved", "invalid", "not_editable", "bad_data", "limit"].includes(error) && (
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
            {slugs.map((s) => {
              const kind = kindOf(s.resume_kind);
              const meta = KIND_LABEL[kind];
              const hasData = !!(s.resume_name || s.profile_name);
              const canEditInApp = kind === "resume" && hasData;
              const action = canEditInApp
                ? { href: `/account/${s.slug}/settings`, label: "Edit →" }
                : hasData
                  ? { href: meta.tool, label: "Re-publish from tool →" }
                  : { href: "/tools/pdf-resume-to-website", label: "Publish →" };
              return (
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
                      {s.published_at ? `Live · ${meta.label}` : hasData ? `Unpublished · ${meta.label}` : "Reserved · not published yet"}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {s.published_at && <UnpublishHandleButton slug={s.slug} />}
                      <ReleaseHandleButton slug={s.slug} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    {s.published_at && (
                      <Link
                        href={`/${s.slug}`}
                        style={{ color: "var(--muted)", fontSize: 14 }}
                      >
                        View live ↗
                      </Link>
                    )}
                    <Link
                      href={action.href}
                      style={{ color: "var(--accent)", fontWeight: 600, fontSize: 14 }}
                    >
                      {action.label}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Danger zone</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
          Deleting your account permanently removes every handle, published page, and all stored data.
        </p>
        <DeleteAccountButton />
      </section>
    </main>
  );
}
