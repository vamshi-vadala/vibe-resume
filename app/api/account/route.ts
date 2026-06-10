import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.ts";

// DELETE: GDPR one-click purge. Removes every slug row the user owns (resume
// data + photos live inline in resume_data, so the row deletes ARE the data
// purge) and then deletes the auth user. The session cookie is cleared so the
// browser isn't left with a token for a user that no longer exists.
export async function DELETE(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createSupabaseAdminClient();

  const { error: slugErr } = await admin.from("slugs").delete().eq("user_id", user.id);
  if (slugErr) return NextResponse.json({ error: "purge_failed" }, { status: 500 });

  const { error: userErr } = await admin.auth.admin.deleteUser(user.id);
  if (userErr) return NextResponse.json({ error: "delete_user_failed" }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ status: "deleted" });
}
