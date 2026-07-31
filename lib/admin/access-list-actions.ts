"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import type { ActionResult } from "@/lib/admin/member-actions";

// Manage the client portal allowlist (client_access). A row grants access to the
// gated directory by exact email OR by firm domain (one domain row covers a whole
// team, e.g. "cps.gov.uk"). Revoking sets revoked_at — the gate re-checks every
// request (lib/auth/client-gate.ts) so it takes effect immediately, and the row
// stays as an audit trail. All writes are tenant-scoped via requireAdminContext;
// RLS (app.is_chambers_admin) enforces the same isolation as defence in depth.

function revalidate() {
  revalidatePath("/admin/access");
}

// Split the operator's single input into an email or a domain matcher.
// Presence of "@" means an exact address; otherwise it's a firm domain.
function parseMatcher(input: string): { email?: string; domain?: string; error?: string } {
  const raw = input.trim().toLowerCase();
  if (!raw) return { error: "Enter an email address or a firm domain." };

  if (raw.includes("@")) {
    const [local, domain, ...rest] = raw.split("@");
    if (rest.length || !local || !domain || !domain.includes(".") || /\s/.test(raw))
      return { error: "Enter a valid email address." };
    return { email: raw };
  }

  const domain = raw.replace(/^@/, "");
  if (!domain.includes(".") || /[\s@]/.test(domain))
    return { error: "Enter a valid firm domain, e.g. cps.gov.uk." };
  return { domain };
}

export async function addAccess(label: string, matcher: string): Promise<ActionResult> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return { ok: false, error: "Enter a firm or team name." };

  const parsed = parseMatcher(matcher);
  if (parsed.error) return { ok: false, error: parsed.error };

  const ctx = await requireAdminContext();
  const supabase = await createClient();

  // Reject a duplicate active matcher so the list stays honest.
  const value = parsed.email ?? parsed.domain!;
  const column = parsed.email ? "email" : "domain";
  const { data: dupe } = await supabase
    .from("client_access")
    .select("id")
    .eq("chambers_id", ctx.chambersId)
    .is("revoked_at", null)
    .eq(column, value)
    .limit(1);
  if (dupe?.length) return { ok: false, error: `${value} already has access.` };

  const { error } = await supabase.from("client_access").insert({
    chambers_id: ctx.chambersId,
    label: trimmedLabel,
    email: parsed.email ?? null,
    domain: parsed.domain ?? null,
    issued_by: ctx.userId,
  });
  if (error) return { ok: false, error: "Couldn't add. Retry." };
  revalidate();
  return { ok: true };
}

// Scope the target row to this chambers before mutating (RLS also enforces this).
async function scoped(id: string) {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_access")
    .select("id, chambers_id")
    .eq("id", id)
    .single();
  if (!data || data.chambers_id !== ctx.chambersId) return null;
  return supabase;
}

export async function revokeAccess(id: string): Promise<ActionResult> {
  const supabase = await scoped(id);
  if (!supabase) return { ok: false, error: "Not found." };
  const { error } = await supabase.from("client_access").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't revoke. Retry." };
  revalidate();
  return { ok: true };
}

export async function restoreAccess(id: string): Promise<ActionResult> {
  const supabase = await scoped(id);
  if (!supabase) return { ok: false, error: "Not found." };
  const { error } = await supabase.from("client_access").update({ revoked_at: null }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't restore. Retry." };
  revalidate();
  return { ok: true };
}

// Hard-delete is for mistakes only; revoking is the norm (keeps the audit trail).
export async function deleteAccess(id: string): Promise<ActionResult> {
  const supabase = await scoped(id);
  if (!supabase) return { ok: false, error: "Not found." };
  const { error } = await supabase.from("client_access").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete. Retry." };
  revalidate();
  return { ok: true };
}
