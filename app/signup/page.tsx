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

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
        Sign in to Vibe Resume
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
        Sign in or create your <strong>viberesume.in</strong> handle. We’ll email you a
        6-digit code — no password.
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
