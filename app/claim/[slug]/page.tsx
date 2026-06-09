import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";
import { checkSlugLocal } from "@/lib/slugAvailability.ts";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Server-side claim landing. The handle checker (and any future surface) sends
// the user here with the slug they want. If signed out, we bounce through
// magic-link sign-in with `next` set so they come back here after the link.
// If signed in, we run the insert and route to /account with a status banner.

type Ctx = { params: Promise<{ slug: string }> };

export default async function ClaimPage({ params }: Ctx) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();

  const local = checkSlugLocal(slug);
  if (local) redirect(`/account?error=${local.status}&slug=${slug}`);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/signup?next=${encodeURIComponent(`/claim/${slug}`)}`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("slugs").insert({ slug, user_id: user.id });

  if (error) {
    if (error.code === "23505") redirect(`/account?error=taken&slug=${slug}`);
    redirect(`/account?error=insert_failed&slug=${slug}`);
  }

  redirect(`/account?claimed=${slug}`);
}
