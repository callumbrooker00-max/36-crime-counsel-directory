import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { TaxonomyAdmin, type Term, type TaxonomyData } from "@/components/admin/taxonomy-admin";

export const metadata = { title: "Taxonomy — 36 Crime admin" };

export default async function TaxonomyPage() {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const tenantOrGlobal = `chambers_id.eq.${ctx.chambersId},chambers_id.is.null`;

  const [pa, roles, panels, grades, cpa, cr, pm] = await Promise.all([
    supabase.from("practice_areas").select("id, name, display_order, is_active, chambers_id").or(tenantOrGlobal).order("display_order"),
    supabase.from("roles").select("id, name, display_order, is_active, chambers_id").or(tenantOrGlobal).order("display_order"),
    supabase.from("panels").select("id, name, display_order, is_active, chambers_id").or(tenantOrGlobal).order("display_order"),
    supabase.from("grades").select("id, name, rank, is_active, chambers_id").order("rank"),
    supabase.from("counsel_practice_areas").select("practice_area_id"),
    supabase.from("counsel_roles").select("role_id"),
    supabase.from("panel_memberships").select("panel_id, grade_id"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const tally = (rows: any[] | null, key: string) => {
    const m = new Map<string, number>();
    (rows ?? []).forEach((r) => r[key] && m.set(r[key], (m.get(r[key]) ?? 0) + 1));
    return m;
  };
  const paU = tally(cpa.data, "practice_area_id");
  const rU = tally(cr.data, "role_id");
  const pU = tally(pm.data, "panel_id");
  const gU = tally(pm.data, "grade_id");
  const toTerm = (r: any, usage: Map<string, number>): Term => ({
    id: r.id,
    name: r.name,
    usage: usage.get(r.id) ?? 0,
    editable: r.chambers_id === ctx.chambersId,
    isActive: r.is_active,
  });
  const data: TaxonomyData = {
    practiceAreas: (pa.data ?? []).map((r) => toTerm(r, paU)),
    roles: (roles.data ?? []).map((r) => toTerm(r, rU)),
    panels: (panels.data ?? []).map((r) => toTerm(r, pU)),
    grades: (grades.data ?? []).map((r) => toTerm(r, gU)),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return <TaxonomyAdmin data={data} />;
}
