import { createHash } from "crypto";
import { getDirectory } from "@/lib/directory/get-directory";

// GET /api/directory — the whole published directory in one cached payload
// (api-contract.md §4). One request, then all search/filter is client-side.
export async function GET(request: Request) {
  let payload;
  try {
    payload = await getDirectory();
  } catch {
    return Response.json(
      { error: { code: "server_error", message: "Couldn't load the directory." } },
      { status: 500 },
    );
  }

  const body = JSON.stringify(payload);
  // ETag reflects meaningful content, not the generatedAt timestamp — so a
  // conditional GET yields 304 whenever the directory data is unchanged.
  const signature = JSON.stringify({
    chambers: payload.chambers,
    filters: payload.filters,
    counsel: payload.counsel,
  });
  const etag = `"${createHash("sha1").update(signature).digest("hex")}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, max-age=60, stale-while-revalidate=300",
      etag,
    },
  });
}
