import { NextResponse, type NextRequest } from "next/server";

// Strict 404 for counsel profiles: resolve the slug against the live published
// set BEFORE the page renders, so unknown / unpublished / archived slugs return
// a true HTTP 404 (Next otherwise streams the not-found body with a 200 for
// dynamic routes). The published payload excludes drafts and archived counsel,
// so this one check covers all three cases.
export const config = { matcher: "/counsel/:slug*" };

export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (!slug) return NextResponse.next();

  try {
    const res = await fetch(new URL("/api/internal/counsel-slugs", request.url), {
      headers: { "x-middleware": "counsel-404" },
    });
    if (res.ok) {
      const { slugs } = (await res.json()) as { slugs: string[] | null };
      // Only 404 when we have a definitive list and the slug isn't in it. If the
      // list can't be built, fall through — the page still renders the branded
      // not-found (200) rather than wrongly blocking a valid profile.
      if (Array.isArray(slugs) && !slugs.includes(slug)) {
        return NextResponse.rewrite(new URL("/profile-unavailable", request.url), { status: 404 });
      }
    }
  } catch {
    // Network/parse failure → let the request through.
  }
  return NextResponse.next();
}
