import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation/enquiry";
import { rateLimit } from "@/lib/rate-limit";
import { notifyEnquiryReceived } from "@/lib/email/notify-enquiry";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";
import { clientAccessStatus, isPermitted } from "@/lib/auth/client-gate";

function envelope(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message, fields, requestId: `req_${randomUUID().slice(0, 8)}` } },
    { status },
  );
}

// POST /enquiries — route a "Contact clerks" enquiry (api-contract.md §4).
// Public write, so: validate, rate-limit, then insert via the trusted server
// context (service role). Client can never write this table directly.
export async function POST(request: Request) {
  // Enquiries are part of the gated portal — no valid client session → 401.
  if (!isPermitted(await clientAccessStatus())) {
    return envelope("unauthenticated", "Sign in to send an enquiry.", 401);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return envelope("validation_error", "Malformed request body.", 400);
  }

  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fields[key]) fields[key] = issue.message;
    }
    return envelope("validation_error", "Please check the highlighted fields.", 400, fields);
  }
  const data = parsed.data;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`enquiry:${ip}:${data.email.toLowerCase()}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "That's a few enquiries now — try again in a minute." } },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const db = createAdminClient();
  const { data: chambers } = await db
    .from("chambers")
    .select("id")
    .eq("slug", DEFAULT_CHAMBERS_SLUG)
    .single();
  if (!chambers) return envelope("server_error", "Couldn't route your enquiry.", 500);

  const { data: inserted, error } = await db
    .from("enquiries")
    .insert({
      chambers_id: chambers.id,
      counsel_ids: data.counselIds,
      enquirer_name: data.enquirerName,
      firm: data.firm || null,
      email: data.email,
      case_type: data.caseType || null,
      urgency: data.urgency,
      message: data.message,
    })
    .select("id")
    .single();
  if (error || !inserted) return envelope("server_error", "Couldn't send your enquiry.", 500);

  await notifyEnquiryReceived({ ...data, id: inserted.id });

  return NextResponse.json({ id: inserted.id, status: "received" }, { status: 202 });
}
