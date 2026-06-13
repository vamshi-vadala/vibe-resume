import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "./SignInForm";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

export const metadata: Metadata = {
  title: "Sign in — Vibe Resume",
  description: "Sign in or create your viberesume.in handle. We’ll email you a 6-digit code — no password.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next || "/account");

  // Funnel-aware copy: someone arriving from a tool's Publish button (or a
  // claim link) is mid-task — acknowledge what they just made and where it is,
  // instead of a generic sign-in wall that reads as "your work is gone."
  const publishing = next?.startsWith("/account/publish") ?? false;
  const claimSlug = next?.startsWith("/claim/")
    ? decodeURIComponent(next.slice("/claim/".length)).split("?")[0]
    : "";

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
        {publishing
          ? "Your website is ready 🎉"
          : claimSlug
            ? <>Claim viberesume.in/{claimSlug}</>
            : "Sign in to Vibe Resume"}
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
        {publishing ? (
          <>
            It’s saved in this browser — nothing is lost. Sign in with your email to
            publish it to your own <strong>viberesume.in</strong> URL. We’ll send a
            6-digit code — no password, no spam.
          </>
        ) : claimSlug ? (
          <>
            One step left: sign in with your email and the handle is yours. We’ll
            send a 6-digit code — no password, no spam.
          </>
        ) : (
          <>
            Sign in or create your <strong>viberesume.in</strong> handle. We’ll email you a
            6-digit code — no password.
          </>
        )}
      </p>
      <SignInForm next={next} />
      {error === "auth" && (
        <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14, marginTop: 16 }}>
          That sign-in link expired or was already used. Send a fresh code above.
        </p>
      )}
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 24 }}>
        <a href="/" style={{ color: "var(--accent)" }}>← Explore the free tools</a>
      </p>
    </main>
  );
}
