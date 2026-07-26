import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";

// The client portal gate (PRD D1). Enforcement is env-flagged so it can be
// switched on at launch (checklist REQUIRED) without a code change.
export function gateEnabled(): boolean {
  return process.env.CLIENT_GATE_ENABLED === "true";
}

// Local-only convenience for testing the gated portal without the email flow.
// Hard-dead in production: NODE_ENV is "production" at build/runtime there, so
// this returns false regardless of the env var.
export function devBypassActive(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.CLIENT_GATE_DEV_BYPASS === "true";
}

export type AccessStatus = "open" | "bypass" | "authorised" | "unauthenticated" | "forbidden";

export function isPermitted(status: AccessStatus): boolean {
  return status === "open" || status === "bypass" || status === "authorised";
}

/** Is this email currently allowlisted (exact email or firm domain, not revoked)? */
export async function isAllowlisted(email: string, chambersSlug: string = DEFAULT_CHAMBERS_SLUG): Promise<boolean> {
  const db = createAdminClient();
  const { data: chambers } = await db.from("chambers").select("id").eq("slug", chambersSlug).single();
  if (!chambers) return false;

  const lower = email.trim().toLowerCase();
  const domain = lower.split("@")[1] ?? "";
  const matchers = [`email.eq.${lower}`];
  if (domain) matchers.push(`domain.eq.${domain}`);

  const { data } = await db
    .from("client_access")
    .select("id")
    .eq("chambers_id", chambers.id)
    .is("revoked_at", null)
    .or(matchers.join(","))
    .limit(1);
  return !!data?.length;
}

/**
 * Resolve the caller's access to the client portal. Re-checks the allowlist on
 * every call so revoking a firm takes effect immediately.
 */
export async function clientAccessStatus(): Promise<AccessStatus> {
  if (!gateEnabled()) return "open";
  if (devBypassActive()) return "bypass";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return "unauthenticated";

  return (await isAllowlisted(user.email)) ? "authorised" : "forbidden";
}
