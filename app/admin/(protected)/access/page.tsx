import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { AccessAdmin, type AccessRow } from "@/components/admin/access-admin";

export const metadata = { title: "Client access — 36 Crime admin" };

// Managing who can sign in is an admin-tier action (mirrors the client_access
// RLS write policy: chambers_admin / platform_admin only, not clerks). Clerks
// are redirected rather than shown a screen whose writes RLS would reject.
const ADMIN_ROLES = ["chambers_admin", "platform_admin"];

export default async function AccessPage() {
  const ctx = await requireAdminContext();
  if (!ADMIN_ROLES.includes(ctx.role)) redirect("/admin/members");
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_access")
    .select("id, label, code, issued_at, last_used_at, revoked_at")
    .eq("chambers_id", ctx.chambersId)
    .not("code", "is", null)
    .order("revoked_at", { ascending: true, nullsFirst: true })
    .order("issued_at", { ascending: false });

  const rows: AccessRow[] = (data ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    code: r.code ?? "",
    issuedAt: r.issued_at,
    lastUsedAt: r.last_used_at,
    revoked: r.revoked_at !== null,
  }));

  return <AccessAdmin rows={rows} />;
}
