"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";
import styles from "./chrome.module.css";

// Header user affordance. Runs client-side so the layout/SiteHeader can stay
// fully static-renderable — pulling auth into the layout would convert every
// static page in the app to dynamic rendering (cookies() poisons the cache).
//
// Initial render = anonymous CTA (matches what static HTML ships). After mount,
// Supabase JS reads the session synchronously from localStorage and we swap in
// the user pill. Brief flicker on first paint for signed-in users is the
// deliberate trade for keeping every public page statically prerendered.

type State =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "signed-in"; email: string };

export default function UserMenu() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setState(session?.user?.email
        ? { status: "signed-in", email: session.user.email }
        : { status: "anon" });
    });
    // Keep header in sync if the user signs in/out in another tab or via the
    // verifyOtp flow on this tab.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState(session?.user?.email
        ? { status: "signed-in", email: session.user.email }
        : { status: "anon" });
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  // Render the anon CTA during loading too — matches the static HTML, avoids
  // a layout shift when the result comes back as anon (the common case for
  // marketing/tool pages).
  if (state.status !== "signed-in") {
    return <Link href="/signup" className={styles.signin}>Sign in</Link>;
  }

  return (
    <Link href="/account" className={styles.userMenu} title={state.email}>
      <span className={styles.avatar} aria-hidden>{state.email[0]}</span>
      <span className={styles.userEmail}>{state.email}</span>
    </Link>
  );
}
