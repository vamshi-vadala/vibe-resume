"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client.ts";

export default function SignOutButton() {
  const router = useRouter();
  async function onClick() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600,
        background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
