import { getDirectory } from "@/lib/directory/get-directory";

// Lightweight published-slug list for the middleware 404 check. Cached like the
// directory (only published counsel appear here).
export async function GET() {
  try {
    const { counsel } = await getDirectory();
    return Response.json(
      { slugs: counsel.map((c) => c.slug) },
      { headers: { "cache-control": "private, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return Response.json({ slugs: null }, { status: 500 });
  }
}
