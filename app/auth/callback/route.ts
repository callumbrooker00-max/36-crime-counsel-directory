import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowlisted } from "@/lib/auth/client-gate";

// Magic-link landing: exchange the code for a session, then re-check the
// allowlist. A session is only kept for an allowlisted address.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && (await isAllowlisted(user.email))) {
      return NextResponse.redirect(`${origin}/`);
    }
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/access?denied=1`);
}
