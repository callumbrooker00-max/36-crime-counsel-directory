import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export const config = { matcher: ["/counsel/:slug*", "/admin/:path*"] };

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin: refresh session + guard (redirect unauthenticated to sign-in) ---
  if (pathname.startsWith("/admin")) {
    const { user, response } = await updateSession(request);
    const isSignIn = pathname === "/admin/sign-in";
    if (!user && !isSignIn) {
      return NextResponse.redirect(new URL("/admin/sign-in", request.url));
    }
    if (user && isSignIn) {
      return NextResponse.redirect(new URL("/admin/members", request.url));
    }
    return response;
  }

  // --- Counsel profiles: strict 404 for unknown/unpublished/archived slugs ---
  const slug = pathname.split("/")[2];
  if (slug) {
    try {
      const res = await fetch(new URL("/api/internal/counsel-slugs", request.url), {
        headers: { "x-middleware": "counsel-404" },
      });
      if (res.ok) {
        const { slugs } = (await res.json()) as { slugs: string[] | null };
        // 404 only with a definitive list; otherwise fall through so a valid
        // profile is never wrongly blocked.
        if (Array.isArray(slugs) && !slugs.includes(slug)) {
          return NextResponse.rewrite(new URL("/profile-unavailable", request.url), { status: 404 });
        }
      }
    } catch {
      // Network/parse failure → let the request through.
    }
  }
  return NextResponse.next();
}
