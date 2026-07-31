import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";
import { CLIENT_COOKIE, verifySession } from "@/lib/auth/client-session";

// The client portal gate (PRD D1). Enforcement is env-flagged so it can be
// switched on at launch (checklist REQUIRED) without a code change.
export function gateEnabled(): boolean {
  return process.env.CLIENT_GATE_ENABLED === "true";
}

// Local-only convenience for testing the gated portal without a code. Hard-dead
// in production: NODE_ENV is "production" at build/runtime there, so this
// returns false regardless of the env var.
export function devBypassActive(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.CLIENT_GATE_DEV_BYPASS === "true";
}

export type AccessStatus = "open" | "bypass" | "authorised" | "unauthenticated" | "forbidden";

export function isPermitted(status: AccessStatus): boolean {
  return status === "open" || status === "bypass" || status === "authorised";
}

/**
 * Resolve the caller's access to the client portal. Verifies the signed session
 * cookie, then re-checks the granting client_access row on every call — so
 * revoking a code takes effect on the client's very next request.
 */
export async function clientAccessStatus(): Promise<AccessStatus> {
  if (!gateEnabled()) return "open";
  if (devBypassActive()) return "bypass";

  const store = await cookies();
  const session = await verifySession(store.get(CLIENT_COOKIE)?.value);
  if (!session) return "unauthenticated";

  const db = createAdminClient();
  const { data: chambers } = await db.from("chambers").select("id").eq("slug", DEFAULT_CHAMBERS_SLUG).single();
  if (!chambers) return "forbidden";

  const { data } = await db
    .from("client_access")
    .select("id")
    .eq("id", session.gid)
    .eq("chambers_id", chambers.id)
    .not("code", "is", null)
    .is("revoked_at", null)
    .limit(1);

  return data?.length ? "authorised" : "forbidden";
}
