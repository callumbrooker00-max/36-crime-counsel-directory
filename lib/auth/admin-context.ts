import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";

const EDITOR_ROLES = ["clerk", "chambers_admin", "platform_admin"];

export interface AdminContext {
  userId: string;
  email: string;
  chambersId: string;
  chambersName: string;
  role: string;
}

/**
 * Resolve the signed-in user's admin context for THIS chambers. Tenant-scoped:
 * requires an active membership in the chambers with a clerk-or-above role —
 * not merely holding a role somewhere. Returns null if unauthenticated or not
 * authorised. RLS also enforces this on every subsequent write (defence in depth).
 */
export async function getAdminContext(
  chambersSlug: string = DEFAULT_CHAMBERS_SLUG,
): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: chambers } = await supabase
    .from("chambers")
    .select("id, name")
    .eq("slug", chambersSlug)
    .single();
  if (!chambers) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("chambers_id", chambers.id)
    .eq("status", "active")
    .single();
  if (!membership || !EDITOR_ROLES.includes(membership.role)) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    chambersId: chambers.id,
    chambersName: chambers.name,
    role: membership.role,
  };
}

/** Throwing variant for server actions. */
export async function requireAdminContext(chambersSlug?: string): Promise<AdminContext> {
  const ctx = await getAdminContext(chambersSlug);
  if (!ctx) throw new Error("forbidden");
  return ctx;
}
