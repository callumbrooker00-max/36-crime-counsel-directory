import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DirectoryPayload,
  DirectoryCounsel,
  PracticeCapacity,
} from "@/types/directory";

export const DEFAULT_CHAMBERS_SLUG = process.env.NEXT_PUBLIC_CHAMBERS_SLUG ?? "36-crime";
export const directoryTag = (slug: string) => `directory:${slug}`;

const CAPACITIES: PracticeCapacity[] = ["prosecution", "defence", "both"];

/**
 * Build the whole published, client-safe directory for a chambers in one pass.
 * Runs in a trusted server context (service role) — the browser never queries
 * these tables directly. Only published counsel and client-safe fields; snake
 * case is translated to camelCase here (CLAUDE.md).
 */
async function buildDirectoryPayload(slug: string): Promise<DirectoryPayload> {
  const db = createAdminClient();

  const { data: chambers, error: chErr } = await db
    .from("chambers")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (chErr || !chambers) throw new Error(`Directory: chambers "${slug}" not found`);

  const tenantOrGlobal = `chambers_id.eq.${chambers.id},chambers_id.is.null`;

  const [panels, grades, practiceAreas, roles, counselRes] = await Promise.all([
    db.from("panels").select("slug, name, type").eq("is_active", true).order("display_order"),
    db.from("grades").select("slug, name, rank").eq("is_active", true).order("rank"),
    db.from("practice_areas").select("slug, name").eq("is_active", true).or(tenantOrGlobal).order("display_order"),
    db.from("roles").select("slug, name, abbreviation").eq("is_active", true).or(tenantOrGlobal).order("display_order"),
    db
      .from("counsel")
      .select(
        `id, slug, full_name, year_of_call, practice_capacity, short_bio, updated_at,
         counsel_roles ( roles ( slug, name, abbreviation ) ),
         counsel_practice_areas ( is_primary, practice_areas ( slug, name ) ),
         panel_memberships ( status, grades ( slug, name, rank ), panels ( slug, name, type ) ),
         notable_cases ( title, citation, year, court, role_in_case, summary, is_published, display_order ),
         images ( storage_key, alt_text, is_primary, type )`,
      )
      .eq("chambers_id", chambers.id)
      .eq("status", "published")
      .order("year_of_call", { ascending: true }),
  ]);

  if (counselRes.error) throw new Error(`Directory: ${counselRes.error.message}`);

  const counsel: DirectoryCounsel[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (counselRes.data ?? []).map(async (c: any) => {
      const headshot = (c.images ?? []).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (im: any) => im.is_primary && im.type === "headshot",
      );
      let image = null;
      if (headshot) {
        const { data: signed } = await db.storage
          .from("counsel-images")
          .createSignedUrl(headshot.storage_key, 3600);
        if (signed?.signedUrl) image = { url: signed.signedUrl, alt: headshot.alt_text ?? c.full_name };
      }

      return {
        id: c.id,
        slug: c.slug,
        fullName: c.full_name,
        yearOfCall: c.year_of_call,
        practiceCapacity: c.practice_capacity as PracticeCapacity,
        shortBio: c.short_bio,
        updatedAt: c.updated_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roles: (c.counsel_roles ?? []).map((cr: any) => ({
          slug: cr.roles.slug,
          name: cr.roles.name,
          abbreviation: cr.roles.abbreviation,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        practiceAreas: (c.counsel_practice_areas ?? []).map((cpa: any) => ({
          slug: cpa.practice_areas.slug,
          name: cpa.practice_areas.name,
          isPrimary: cpa.is_primary,
        })),
        panels: (c.panel_memberships ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((pm: any) => pm.status === "active")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((pm: any) => ({
            panelSlug: pm.panels.slug,
            panelName: pm.panels.name,
            type: pm.panels.type,
            grade: pm.grades?.name ?? null,
            gradeRank: pm.grades?.rank ?? null,
          })),
        notableCases: (c.notable_cases ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((n: any) => n.is_published)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => a.display_order - b.display_order)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((n: any) => ({
            title: n.title,
            citation: n.citation,
            year: n.year,
            court: n.court,
            roleInCase: n.role_in_case,
            summary: n.summary,
          })),
        image,
      } satisfies DirectoryCounsel;
    }),
  );

  return {
    chambers: { name: chambers.name, slug: chambers.slug },
    generatedAt: new Date().toISOString(),
    filters: {
      panels: panels.data ?? [],
      grades: grades.data ?? [],
      practiceAreas: practiceAreas.data ?? [],
      roles: (roles.data ?? []).map((r) => ({ slug: r.slug, name: r.name, abbreviation: r.abbreviation })),
      practiceCapacities: CAPACITIES,
    },
    counsel,
  };
}

/** Cached directory read. Admin writes revalidate `directoryTag(slug)` (slice 6). */
export function getDirectory(slug: string = DEFAULT_CHAMBERS_SLUG): Promise<DirectoryPayload> {
  return unstable_cache(() => buildDirectoryPayload(slug), ["directory", slug], {
    tags: [directoryTag(slug)],
    revalidate: 60,
  })();
}
