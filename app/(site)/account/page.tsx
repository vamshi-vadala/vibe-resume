import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import JourneyStrip from "./JourneyStrip";
import PendingPublishNudge from "./PendingPublishNudge";
import CopyLinkButton from "./CopyLinkButton";
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
    .select("slug, created_at, published_at, resume_kind:resume_data->>kind, resume_name:resume_data->resume->>name, profile_name:resume_data->profile->>name, resume_photo:resume_data->resume->>photoUrl")
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
          ✓ Reserved <strong>viberesume.in/{claimed}</strong> — it’s yours. Publish a website to it whenever you’re ready.
        </div>
      )}
      {published && (() => {
        const row = slugs?.find((s) => s.slug === published);
        const isResume = kindOf(row?.resume_kind) === "resume";
        const liveUrl = `https://viberesume.in/${published}`;
        return (
          <div role="status" style={{
            marginBottom: 20, padding: "18px 20px", borderRadius: 12,
            background: "var(--panel)", border: "1px solid var(--accent)", color: "var(--text)",
          }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>🎉 Your website is live</div>
            <a
              href={liveUrl}
              style={{
                display: "inline-block", marginTop: 8, fontSize: 18, fontWeight: 700,
                color: "var(--accent)", wordBreak: "break-all",
              }}
            >
              viberesume.in/{published} ↗
            </a>
            <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 14, alignItems: "center", flexWrap: "wrap" }}>
              <CopyLinkButton url={liveUrl} />
              <Link href={`/tools/resume-qr-code-generator?url=${encodeURIComponent(liveUrl)}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                Make a QR code →
              </Link>
              {isResume && (
                <Link href={`/account/${published}/settings`} style={{ color: "var(--accent)", fontWeight: 600 }}>Edit profile →</Link>
              )}
            </div>
          </div>
        );
      })()}
      {!published && <PendingPublishNudge />}
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

      {(() => {
        const rows = slugs ?? [];
        const liveRow = rows.find((s) => s.published_at);
        return (
          <JourneyStrip
            generated={rows.some((s) => !!(s.resume_name || s.profile_name))}
            claimed={rows.length > 0}
            publishedSlug={liveRow?.slug ?? ""}
            personName={liveRow ? (liveRow.resume_name || liveRow.profile_name || "") : ""}
            needsPhoto={!!liveRow && kindOf(liveRow.resume_kind) === "resume" && !liveRow.resume_photo}
          />
        );
      })()}

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your site</h2>
        {!slugs || slugs.length === 0 ? (
          <div style={{ padding: 28, border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)" }}>
            {/* The journey strip above carries the step-by-step — keep this
                to the two things it can't: the CTA and the proof. */}
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>
              Nothing here yet — your website is about two minutes away.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/tools/pdf-resume-to-website"
                style={{
                  padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                  background: "var(--accent2)", color: "var(--on-accent2)",
                }}
              >
                Generate a website →
              </Link>
              <Link href="/example" style={{ color: "var(--accent)", fontSize: 14 }}>
                See a live example ↗
              </Link>
            </div>
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
                  : { href: "/account/publish", label: "Publish →" };
              const badge = s.published_at
                ? { text: "Live", bg: "var(--accent2)", fg: "var(--on-accent2)", border: "var(--accent2)" }
                : { text: hasData ? "Unpublished" : "Reserved", bg: "var(--panel2)", fg: "var(--muted)", border: "var(--line)" };
              return (
                <li
                  key={s.slug}
                  style={{
                    padding: "16px 20px",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    background: "var(--panel)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 16, wordBreak: "break-all" }}>viberesume.in/{s.slug}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                          background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}`,
                        }}>
                          {badge.text}
                        </span>
                        {kind === "resume" && s.resume_name === "Jane Doe" && (
                          <span
                            title="This handle is publishing the sample resume, not your own data"
                            style={{
                              fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                              background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)",
                            }}
                          >
                            ⚠ Demo data
                          </span>
                        )}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                        {(s.resume_name || s.profile_name) ? `${s.resume_name || s.profile_name} · ` : ""}{meta.label}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                      {s.published_at && (
                        <>
                          <CopyLinkButton url={`https://viberesume.in/${s.slug}`} />
                          <Link href={`/${s.slug}`} style={{ color: "var(--muted)", fontSize: 14 }}>
                            View live ↗
                          </Link>
                        </>
                      )}
                      <Link
                        href={action.href}
                        style={{
                          padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                          background: "var(--accent2)", color: "var(--on-accent2)",
                        }}
                      >
                        {action.label}
                      </Link>
                    </div>
                  </div>
                  {/* Destructive actions live behind a disclosure so the card
                      reads as "your site", not a row of ways to delete it. */}
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>Manage handle</summary>
                    <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {s.published_at && <UnpublishHandleButton slug={s.slug} />}
                      <ReleaseHandleButton slug={s.slug} />
                    </div>
                  </details>
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
