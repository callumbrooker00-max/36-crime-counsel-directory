import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { MemberEditor, type EditorMember, type EditorVocab } from "@/components/admin/member-editor";

export const metadata = { title: "Edit member — 36 Crime admin" };

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireAdminContext();
  const supabase = await createClient();

  const { data: m } = await supabase
    .from("counsel")
    .select(
      `id, full_name, slug, year_of_call, practice_capacity, short_bio, status,
       counsel_roles ( role_id ),
       counsel_practice_areas ( practice_area_id, is_primary ),
       panel_memberships ( panel_id, grade_id, status ),
       notable_cases ( title, citation, year, court, role_in_case, summary, display_order )`,
    )
    .eq("id", id)
    .eq("chambers_id", ctx.chambersId)
    .single();
  if (!m) notFound();

  const tenantOrGlobal = `chambers_id.eq.${ctx.chambersId},chambers_id.is.null`;
  const [roles, areas, panels, grades] = await Promise.all([
    supabase.from("roles").select("id, slug, name").eq("is_active", true).or(tenantOrGlobal).order("display_order"),
    supabase.from("practice_areas").select("id, slug, name").eq("is_active", true).or(tenantOrGlobal).order("display_order"),
    supabase.from("panels").select("id, slug, name, type").eq("is_active", true).order("display_order"),
    supabase.from("grades").select("id, slug, name, rank").eq("is_active", true).order("rank"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const member: EditorMember = {
    id: m.id,
    fullName: m.full_name,
    slug: m.slug,
    yearOfCall: m.year_of_call,
    practiceCapacity: m.practice_capacity,
    shortBio: m.short_bio ?? "",
    status: m.status,
    roleIds: (m.counsel_roles ?? []).map((r: any) => r.role_id),
    areas: (m.counsel_practice_areas ?? []).map((a: any) => ({ id: a.practice_area_id, isPrimary: a.is_primary })),
    panels: (m.panel_memberships ?? [])
      .filter((pm: any) => pm.status === "active")
      .map((pm: any) => ({ panelId: pm.panel_id, gradeId: pm.grade_id })),
    cases: (m.notable_cases ?? [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((c: any) => ({
        title: c.title,
        citation: c.citation ?? "",
        year: c.year,
        court: c.court ?? "",
        roleInCase: c.role_in_case ?? "",
        summary: c.summary ?? "",
      })),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const vocab: EditorVocab = {
    roles: roles.data ?? [],
    practiceAreas: areas.data ?? [],
    panels: (panels.data ?? []) as EditorVocab["panels"],
    grades: grades.data ?? [],
  };

  return <MemberEditor member={member} vocab={vocab} />;
}
