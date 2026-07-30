// Diff the client directory payload against the real DB columns, and flag any
// sensitive column that leaks into what the browser receives.
//
//   1) start the app (npm run dev), then
//   2) node --env-file=.env.local scripts/verify/payload-columns.mjs
//
// Pulls each table's real columns via the service role (select=*), pulls the
// exposed keys from GET /api/directory, and reports exposed / withheld / LEAKED.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.APP_URL || "http://localhost:3000";
const db = createClient(url, service, { auth: { persistSession: false } });

// Columns that must NEVER reach the client (tenant internals, workflow, authorship, drafts).
const SENSITIVE = new Set([
  "chambers_id", "status", "created_by", "updated_by", "created_at", "deleted_at",
  "is_published", "display_order", "storage_key", "mime_type", "search_vector",
]);

async function columnsOf(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const rows = await res.json();
  return rows[0] ? Object.keys(rows[0]) : [];
}

function keysDeep(obj, out = new Set()) {
  if (Array.isArray(obj)) obj.forEach((v) => keysDeep(v, out));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) { out.add(k); keysDeep(v, out); }
  return out;
}

// snake_case <-> camelCase so payload keys line up with DB columns.
const snake = (s) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

const payload = await fetch(`${APP}/api/directory`).then((r) => {
  if (!r.ok) throw new Error(`GET /api/directory returned ${r.status} (need the app running with the gate open locally)`);
  return r.json();
});
const exposed = new Set([...keysDeep(payload.counsel)].map(snake));

console.log(`Payload source: ${APP}/api/directory  (counsel in payload: ${payload.counsel.length})\n`);

let leaks = 0;
for (const table of ["counsel", "notable_cases", "panel_memberships", "counsel_practice_areas", "images"]) {
  const cols = await columnsOf(table);
  const shown = cols.filter((c) => exposed.has(c));
  const withheld = cols.filter((c) => !exposed.has(c));
  const leaked = shown.filter((c) => SENSITIVE.has(c));
  leaks += leaked.length;
  console.log(`── ${table} ──`);
  console.log(`   exposed in payload : ${shown.join(", ") || "(none)"}`);
  console.log(`   withheld           : ${withheld.join(", ") || "(none)"}`);
  console.log(`   SENSITIVE LEAKED   : ${leaked.length ? "⚠️  " + leaked.join(", ") : "none ✓"}\n`);
}

console.log(leaks === 0
  ? "RESULT: no sensitive columns exposed ✓"
  : `RESULT: ${leaks} sensitive column(s) exposed ✗`);
process.exit(leaks === 0 ? 0 : 1);
