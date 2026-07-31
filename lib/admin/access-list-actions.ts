"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import type { ActionResult } from "@/lib/admin/member-actions";

// Manage the client portal access codes (client_access). Each row is one client
// firm: a label and a code they enter to sign in. Revoking sets revoked_at — the
// gate re-checks every request (lib/auth/client-gate.ts) so it takes effect
// immediately, and the row stays as an audit trail. All writes are tenant-scoped
// via requireAdminContext; RLS (app.is_chambers_admin) enforces the same
// isolation as defence in depth.

export type CodeResult = ActionResult & { code?: string };

function revalidate() {
  revalidatePath("/admin/access");
}

// Unambiguous 32-char alphabet (no I/L/O/U → no 1/l or 0/O confusion). 32 divides
// 256 evenly, so byte-modulo is bias-free. 12 chars ≈ 60 bits of entropy.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function generateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

function isUniqueViolation(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("duplicate") || m.includes("unique");
}

export async function createAccessCode(label: string): Promise<CodeResult> {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Enter a firm or team name." };

  const ctx = await requireAdminContext();
  const supabase = await createClient();

  // Retry on the (rare) code collision within this chambers.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("client_access").insert({
      chambers_id: ctx.chambersId,
      label: trimmed,
      code,
      method: "access_code",
      issued_by: ctx.userId,
    });
    if (!error) {
      revalidate();
      return { ok: true, code };
    }
    if (!isUniqueViolation(error.message)) return { ok: false, error: "Couldn't create. Retry." };
  }
  return { ok: false, error: "Couldn't generate a unique code. Retry." };
}

// Scope the target row to this chambers before mutating (RLS also enforces this).
async function scoped(id: string) {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data } = await supabase.from("client_access").select("id, chambers_id").eq("id", id).single();
  if (!data || data.chambers_id !== ctx.chambersId) return null;
  return supabase;
}

// Rotate a firm's code (e.g. if it leaks) without losing the row/label/history.
// Also un-revokes, since a fresh code is meant to be usable.
export async function regenerateCode(id: string): Promise<CodeResult> {
  const supabase = await scoped(id);
  if (!supabase) return { ok: false, error: "Not found." };
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("client_access").update({ code, revoked_at: null }).eq("id", id);
    if (!error) {
      revalidate();
      return { ok: true, code };
    }
    if (!isUniqueViolation(error.message)) return { ok: false, error: "Couldn't rotate. Retry." };
  }
  return { ok: false, error: "Couldn't generate a unique code. Retry." };
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
