"use server";

import { updateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { directoryTag, DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";

export interface ActionResult {
  ok: boolean;
  error?: string;
  missing?: string[];
}

// Every successful write refreshes the cached /directory payload (and, via the
// shared tag, the counsel-slugs 404 gate) so client changes go live in seconds.
// updateTag (Next 16) invalidates the directory cache tag from a Server Action
// with read-your-own-writes semantics — getDirectory + the counsel-slugs 404
// gate share this tag, so both refresh.
function revalidateDirectory() {
  updateTag(directoryTag(DEFAULT_CHAMBERS_SLUG));
  revalidatePath("/admin/members");
}

export async function createMember(): Promise<void> {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const slug = `draft-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("counsel")
    .insert({
      chambers_id: ctx.chambersId,
      full_name: "New member",
      slug,
      practice_capacity: "both",
      status: "draft",
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not create member");
  revalidatePath("/admin/members");
  redirect(`/admin/members/${data.id}`);
}

export async function publishMember(id: string): Promise<ActionResult> {
  const ctx = await requireAdminContext();
  const supabase = await createClient();

  // Publish is gated on required fields (api-contract.md §5 publish_blocked).
  const { data: m } = await supabase
    .from("counsel")
    .select("full_name, year_of_call, counsel_practice_areas(practice_area_id)")
    .eq("id", id)
    .single();
  if (!m) return { ok: false, error: "Member not found." };

  const missing: string[] = [];
  if (!m.full_name?.trim() || m.full_name === "New member") missing.push("name");
  if (m.year_of_call == null) missing.push("year of call");
  if (!m.counsel_practice_areas?.length) missing.push("a practice area");
  if (missing.length) return { ok: false, error: `Add ${missing.join(", ")} before publishing.`, missing };

  const { error } = await supabase
    .from("counsel")
    .update({ status: "published", updated_by: ctx.userId })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't publish. Retry." };
  revalidateDirectory();
  return { ok: true };
}

export async function unpublishMember(id: string): Promise<ActionResult> {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("counsel")
    .update({ status: "draft", updated_by: ctx.userId })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't unpublish. Retry." };
  revalidateDirectory();
  return { ok: true };
}

export interface MemberInput {
  fullName: string;
  yearOfCall: number | null;
  practiceCapacity: "prosecution" | "defence" | "both";
  shortBio: string;
  profileUrl: string | null;
  roleIds: string[];
  areas: { id: string; isPrimary: boolean }[];
  panels: { panelId: string; gradeId: string | null }[];
  cases: {
    title: string;
    citation: string;
    year: number | null;
    court: string;
    roleInCase: string;
    summary: string;
  }[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Replace associations (delete + insert). Not a single transaction — acceptable
// at this scale; an atomic RPC is a possible follow-up.
export async function saveMember(id: string, input: MemberInput): Promise<ActionResult> {
  const ctx = await requireAdminContext();
  const supabase = await createClient();

  // Derive a stable slug from the name; keep it unique within the chambers.
  let slug = slugify(input.fullName) || `member-${id.slice(0, 6)}`;
  const { data: clash } = await supabase
    .from("counsel")
    .select("id")
    .eq("chambers_id", ctx.chambersId)
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();
  if (clash) slug = `${slug}-${id.slice(0, 4)}`;

  const { error: updErr } = await supabase
    .from("counsel")
    .update({
      full_name: input.fullName.trim(),
      slug,
      year_of_call: input.yearOfCall,
      practice_capacity: input.practiceCapacity,
      short_bio: input.shortBio.trim() || null,
      profile_url: input.profileUrl?.trim() || null,
      updated_by: ctx.userId,
    })
    .eq("id", id);
  if (updErr) return { ok: false, error: "Couldn't save. Retry." };

  await supabase.from("counsel_roles").delete().eq("counsel_id", id);
  if (input.roleIds.length)
    await supabase.from("counsel_roles").insert(input.roleIds.map((role_id) => ({ counsel_id: id, role_id })));

  await supabase.from("counsel_practice_areas").delete().eq("counsel_id", id);
  if (input.areas.length)
    await supabase
      .from("counsel_practice_areas")
      .insert(input.areas.map((a) => ({ counsel_id: id, practice_area_id: a.id, is_primary: a.isPrimary })));

  await supabase.from("panel_memberships").delete().eq("counsel_id", id);
  if (input.panels.length)
    await supabase.from("panel_memberships").insert(
      input.panels.map((p) => ({
        counsel_id: id,
        panel_id: p.panelId,
        grade_id: p.gradeId,
        status: "active" as const,
      })),
    );

  await supabase.from("notable_cases").delete().eq("counsel_id", id);
  if (input.cases.length)
    await supabase.from("notable_cases").insert(
      input.cases
        .filter((c) => c.title.trim())
        .map((c, i) => ({
          counsel_id: id,
          title: c.title.trim(),
          citation: c.citation.trim() || null,
          year: c.year,
          court: c.court.trim() || null,
          role_in_case: c.roleInCase.trim() || null,
          summary: c.summary.trim() || null,
          display_order: i,
        })),
    );

  revalidateDirectory();
  revalidatePath(`/admin/members/${id}`);
  return { ok: true };
}
