import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { CLIENT_COOKIE, verifySession } from "@/lib/auth/client-session";

export const config = { matcher: ["/", "/counsel/:path*", "/admin/:path*"] };

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Client access gate (PRD D1). Flag-controlled; the dev bypass is inert in
  // production (NODE_ENV is "production" there), so it can never open prod.
  const gateActive =
    process.env.CLIENT_GATE_ENABLED === "true" &&
    !(process.env.NODE_ENV !== "production" && process.env.CLIENT_GATE_DEV_BYPASS === "true");

  // --- Admin: refresh session + guard ---
  if (pathname.startsWith("/admin")) {
    const { user, response } = await updateSession(request);
    const isSignIn = pathname === "/admin/sign-in";
    if (!user && !isSignIn) return NextResponse.redirect(new URL("/admin/sign-in", request.url));
    if (user && isSignIn) return NextResponse.redirect(new URL("/admin/members", request.url));
    return response;
  }

  // --- Client portal pages: require a valid access-code session when the gate
  //     is on (true 307 before the page renders). Signature check only here;
  //     the authoritative revoked-row re-check + API 401s live in the server
  //     entrypoints (clientAccessStatus). ---
  if (gateActive) {
    const session = await verifySession(request.cookies.get(CLIENT_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/access", request.url));
  }

  // --- Counsel profiles: strict 404 for unknown/unpublished/archived slugs ---
  const slug = pathname.split("/")[2];
  if (pathname.startsWith("/counsel") && slug) {
    try {
      const res = await fetch(new URL("/api/internal/counsel-slugs", request.url), {
        headers: { "x-middleware": "counsel-404" },
      });
      if (res.ok) {
        const { slugs } = (await res.json()) as { slugs: string[] | null };
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
