import { notFound } from "next/navigation";

export const metadata = { title: "DB check — dev" };
export const dynamic = "force-dynamic"; // always read live, never cache this probe

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      chambers: { name: string; slug: string }[] | null;
      counsel: { full_name: string; year_of_call: number | null; practice_capacity: string; status: string }[] | null;
      counts: { panels: number | null; grades: number | null; areas: number | null; roles: number | null };
    };

async function probe(): Promise<Result> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Supabase env not set — add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local." };
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const db = createAdminClient();
  const [chambers, counsel, panels, grades, areas, roles] = await Promise.all([
    db.from("chambers").select("name, slug"),
    db.from("counsel").select("full_name, year_of_call, practice_capacity, status").order("year_of_call", { ascending: true }),
    db.from("panels").select("id", { count: "exact", head: true }),
    db.from("grades").select("id", { count: "exact", head: true }),
    db.from("practice_areas").select("id", { count: "exact", head: true }),
    db.from("roles").select("id", { count: "exact", head: true }),
  ]);
  if (counsel.error) return { ok: false, error: counsel.error.message };
  return {
    ok: true,
    chambers: chambers.data,
    counsel: counsel.data,
    counts: { panels: panels.count, grades: grades.count, areas: areas.count, roles: roles.count },
  };
}

export default async function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  const r = await probe();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ribbon">Database · dev</p>
      <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight text-ink">Connectivity check</h1>

      {!r.ok ? (
        <p className="mt-6 rounded-control border border-line bg-card p-4 text-md text-ink-2">{r.error}</p>
      ) : (
        <div className="mt-6 space-y-6">
          <p className="text-md text-ink-2">
            Connected to{" "}
            <span className="font-medium text-ink">{r.chambers?.[0]?.name ?? "—"}</span>. Taxonomy: {r.counts.panels}{" "}
            panels · {r.counts.grades} grades · {r.counts.areas} practice areas · {r.counts.roles} appointments.
          </p>
          <div className="overflow-hidden rounded-card border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 font-mono text-xs uppercase tracking-[0.08em] text-ink-3">
                <tr>
                  <th className="px-3 py-2 font-medium">Counsel</th>
                  <th className="px-3 py-2 font-medium">Called</th>
                  <th className="px-3 py-2 font-medium">Capacity</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {r.counsel?.map((c) => (
                  <tr key={c.full_name} className="border-t border-line-2">
                    <td className="px-3 py-2 text-ink">{c.full_name}</td>
                    <td className="px-3 py-2 text-ink-2">{c.year_of_call}</td>
                    <td className="px-3 py-2 text-ink-2">{c.practice_capacity}</td>
                    <td className="px-3 py-2 text-ink-2">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
