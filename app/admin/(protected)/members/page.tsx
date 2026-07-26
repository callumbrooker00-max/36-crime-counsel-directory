import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { MemberTable, type AdminMember } from "@/components/admin/member-table";

export const metadata = { title: "Members — 36 Crime admin" };

// Reads via the user-scoped client — RLS returns this chambers' counsel,
// including drafts (unlike the public directory).
export default async function MembersPage() {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("counsel")
    .select("id, full_name, year_of_call, status, updated_at, panel_memberships(status, grades(name, rank))")
    .eq("chambers_id", ctx.chambersId)
    .order("full_name");

  const members: AdminMember[] = (data ?? []).map((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graded = ((m.panel_memberships ?? []) as any[])
      .filter((pm) => pm.status === "active" && pm.grades)
      .sort((a, b) => (b.grades.rank ?? 0) - (a.grades.rank ?? 0));
    return {
      id: m.id,
      fullName: m.full_name,
      yearOfCall: m.year_of_call,
      status: m.status,
      updatedAt: m.updated_at,
      topLevel: graded[0]?.grades?.name ?? null,
    };
  });

  return <MemberTable members={members} />;
}
