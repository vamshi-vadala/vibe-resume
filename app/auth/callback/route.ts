import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

// Supabase magic-link redirect target. Exchanges the one-time code for a
// session cookie, then redirects to `next` (defaults to /account).

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/signup?error=auth", url.origin));
}
