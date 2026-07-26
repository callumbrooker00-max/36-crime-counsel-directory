"use server";

import { updateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { directoryTag, DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";
import type { ActionResult } from "@/lib/admin/member-actions";

// Kinds a chambers can add/edit as tenant-scoped rows (global rows stay
// read-only; grades/levels are national and not chambers-editable). Architected
// so tenant panels/roles work now without a rebuild (data-model.md §8).
export type TaxonomyKind = "practice-areas" | "roles" | "panels";
const TABLE: Record<TaxonomyKind, string> = {
  "practice-areas": "practice_areas",
  roles: "roles",
  panels: "panels",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function revalidate() {
  updateTag(directoryTag(DEFAULT_CHAMBERS_SLUG));
  revalidatePath("/admin/taxonomy");
}

// Ensure the row belongs to this chambers (tenant-owned). Global rows (null) are
// never editable here — RLS also blocks them.
async function assertTenantRow(kind: TaxonomyKind, id: string) {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data } = await supabase.from(TABLE[kind]).select("chambers_id").eq("id", id).single();
  if (!data || data.chambers_id !== ctx.chambersId) return null;
  return { ctx, supabase };
}

export async function createTerm(kind: TaxonomyKind, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a name." };
  const ctx = await requireAdminContext();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from(TABLE[kind])
    .select("display_order")
    .or(`chambers_id.eq.${ctx.chambersId},chambers_id.is.null`);
  const nextOrder = Math.max(0, ...(rows ?? []).map((r) => r.display_order ?? 0)) + 1;

  const base = { chambers_id: ctx.chambersId, name: trimmed, slug: slugify(trimmed), display_order: nextOrder };
  const row = kind === "panels" ? { ...base, type: "specialist" as const } : base;

  const { error } = await supabase.from(TABLE[kind]).insert(row);
  if (error) return { ok: false, error: "Couldn't add. A term with that name may already exist." };
  revalidate();
  return { ok: true };
}

export async function renameTerm(kind: TaxonomyKind, id: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a name." };
  const scope = await assertTenantRow(kind, id);
  if (!scope) return { ok: false, error: "This term is managed centrally." };
  const { error } = await scope.supabase.from(TABLE[kind]).update({ name: trimmed }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't rename. Retry." };
  revalidate();
  return { ok: true };
}

export async function setTermActive(kind: TaxonomyKind, id: string, isActive: boolean): Promise<ActionResult> {
  const scope = await assertTenantRow(kind, id);
  if (!scope) return { ok: false, error: "This term is managed centrally." };
  const { error } = await scope.supabase.from(TABLE[kind]).update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't update. Retry." };
  revalidate();
  return { ok: true };
}

// Delete only when unused; otherwise retire (api-contract.md §8 conflict).
export async function deleteTerm(kind: TaxonomyKind, id: string, usage: number): Promise<ActionResult> {
  if (usage > 0)
    return { ok: false, error: `In use by ${usage} counsel — retire it instead.` };
  const scope = await assertTenantRow(kind, id);
  if (!scope) return { ok: false, error: "This term is managed centrally." };
  const { error } = await scope.supabase.from(TABLE[kind]).delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete. Retry." };
  revalidate();
  return { ok: true };
}

// Swap display_order with the nearest editable (tenant) neighbour, skipping
// read-only global rows so RLS never blocks the move.
export async function reorderTerm(kind: TaxonomyKind, id: string, direction: "up" | "down"): Promise<ActionResult> {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from(TABLE[kind])
    .select("id, chambers_id, display_order")
    .or(`chambers_id.eq.${ctx.chambersId},chambers_id.is.null`)
    .order("display_order", { ascending: true });
  if (!rows) return { ok: false, error: "Couldn't reorder." };

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0 || rows[idx].chambers_id !== ctx.chambersId) return { ok: false, error: "This term is managed centrally." };

  const step = direction === "up" ? -1 : 1;
  let j = idx + step;
  while (j >= 0 && j < rows.length && rows[j].chambers_id !== ctx.chambersId) j += step;
  if (j < 0 || j >= rows.length) return { ok: true }; // no editable neighbour — no-op

  const a = rows[idx], b = rows[j];
  await supabase.from(TABLE[kind]).update({ display_order: b.display_order }).eq("id", a.id);
  await supabase.from(TABLE[kind]).update({ display_order: a.display_order }).eq("id", b.id);
  revalidate();
  return { ok: true };
}
