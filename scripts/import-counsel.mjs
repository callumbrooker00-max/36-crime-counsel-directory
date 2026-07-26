// One-time / repeatable counsel import from an .xlsx list.
//
//   DRY-RUN by default — parses, validates, and reports; writes NOTHING.
//   Pass --apply to write. Pass --create-terms to create tenant taxonomy rows
//   for unmatched terms during --apply.
//
//   node --env-file=.env.local scripts/import-counsel.mjs path/to/list.xlsx
//   node --env-file=.env.local scripts/import-counsel.mjs list.xlsx --apply
//
//   Secrets come from env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
//
// ── COLUMN MAPPING ───────────────────────────────────────────────────────────
// Adjust these header names to your sheet (finalised against your anonymised
// sample). Multi-value cells are split on ";"; panels are "Panel:Grade".
const MAP = {
  fullName: "Name",
  yearOfCall: "Year of call",
  capacity: "Capacity", // prosecution | defence | both
  bio: "Bio",
  appointments: "Appointments", // "King's Counsel; Recorder"
  specialisms: "Specialisms", // "Homicide; Fraud & financial crime"
  panels: "CPS panels", // "RASSO:Level 4; General Crime:Level 4"
};
const SPLIT = ";";
const CHAMBERS_SLUG = process.env.CHAMBERS_SLUG ?? "36-crime";
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const CREATE_TERMS = args.includes("--create-terms");
if (!file) { console.error("Usage: import-counsel.mjs <file.xlsx> [--apply] [--create-terms]"); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing Supabase env."); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (s) => norm(s).replace(/\s+/g, "-").slice(0, 60);
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// ── Load taxonomy ────────────────────────────────────────────────────────────
const { data: chambers } = await db.from("chambers").select("id").eq("slug", CHAMBERS_SLUG).single();
if (!chambers) { console.error(`Chambers "${CHAMBERS_SLUG}" not found.`); process.exit(1); }
const tenantOrGlobal = `chambers_id.eq.${chambers.id},chambers_id.is.null`;
const [pa, roles, panels, grades] = await Promise.all([
  db.from("practice_areas").select("id,name").or(tenantOrGlobal),
  db.from("roles").select("id,name").or(tenantOrGlobal),
  db.from("panels").select("id,name").or(tenantOrGlobal),
  db.from("grades").select("id,name"),
]);
const vocab = { specialisms: pa.data ?? [], appointments: roles.data ?? [], panels: panels.data ?? [], grades: grades.data ?? [] };
const indexOf = (list) => new Map(list.map((r) => [norm(r.name), r]));
const idx = { specialisms: indexOf(vocab.specialisms), appointments: indexOf(vocab.appointments), panels: indexOf(vocab.panels), grades: indexOf(vocab.grades) };

const flags = { unmatched: new Map(), nearMatch: new Map(), duplicate: new Map() };
function resolve(kind, raw) {
  const key = norm(raw);
  if (!key) return null;
  const hit = idx[kind].get(key);
  if (hit) {
    if (hit.name !== String(raw).trim()) flags.duplicate.set(`${kind}:${raw}`, `“${raw}” matches existing “${hit.name}” (surface differs)`);
    return hit;
  }
  // near-match: small edit distance or containment against known terms
  let best = null, bestD = Infinity;
  for (const r of vocab[kind]) {
    const d = lev(key, norm(r.name));
    if (d < bestD) { bestD = d; best = r; }
  }
  if (best && (bestD <= 2 || norm(best.name).includes(key) || key.includes(norm(best.name))))
    flags.nearMatch.set(`${kind}:${raw}`, `“${raw}” ≈ “${best.name}” — did you mean this?`);
  else flags.unmatched.set(`${kind}:${raw}`, `“${raw}” (${kind}) has no match`);
  return null;
}

// ── Parse sheet ──────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const ws = wb.worksheets[0];
const headers = ws.getRow(1).values.map((v) => String(v ?? "").trim());
const colOf = (name) => headers.indexOf(name);
const rows = [];
ws.eachRow((row, n) => {
  if (n === 1) return;
  const get = (field) => { const c = colOf(MAP[field]); return c > 0 ? String(row.values[c] ?? "").trim() : ""; };
  const multi = (field) => get(field).split(SPLIT).map((s) => s.trim()).filter(Boolean);
  rows.push({
    fullName: get("fullName"),
    yearOfCall: get("yearOfCall") ? Number(get("yearOfCall")) : null,
    capacity: (get("capacity") || "both").toLowerCase(),
    bio: get("bio"),
    appointments: multi("appointments"),
    specialisms: multi("specialisms"),
    panels: multi("panels").map((p) => { const [panel, grade] = p.split(":").map((x) => x.trim()); return { panel, grade }; }),
  });
});

// ── Resolve + validate ───────────────────────────────────────────────────────
let publishable = 0, draftOnly = 0;
for (const r of rows) {
  r.appointments.forEach((a) => resolve("appointments", a));
  r.specialisms.forEach((a) => resolve("specialisms", a));
  r.panels.forEach((p) => { resolve("panels", p.panel); if (p.grade) resolve("grades", p.grade); });
  const missing = [];
  if (!r.fullName) missing.push("name");
  if (r.yearOfCall == null) missing.push("year of call");
  if (r.specialisms.length === 0) missing.push("a specialism");
  r.canPublish = missing.length === 0;
  r.missing = missing;
  if (r.canPublish) publishable++; else draftOnly++;
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\n=== Import ${APPLY ? "(APPLY)" : "(DRY-RUN — no writes)"} · ${file} ===`);
console.log(`Rows: ${rows.length}  |  publishable: ${publishable}  |  draft-only: ${draftOnly}`);
const dump = (title, map) => { if (map.size) { console.log(`\n${title} (${map.size}):`); for (const v of map.values()) console.log("  - " + v); } };
dump("UNMATCHED taxonomy", flags.unmatched);
dump("NEAR-MATCH taxonomy (review)", flags.nearMatch);
dump("DUPLICATE / surface mismatch", flags.duplicate);
rows.filter((r) => !r.canPublish).forEach((r) => console.log(`  draft: ${r.fullName || "(no name)"} — needs ${r.missing.join(", ")}`));

if (!APPLY) {
  console.log("\nDry-run only. Re-run with --apply to write (and --create-terms to add unmatched taxonomy).\n");
  process.exit(0);
}

// ── Apply (idempotent upsert by slug) ────────────────────────────────────────
if (CREATE_TERMS) {
  for (const k of flags.unmatched.keys()) {
    const [kind, ...rest] = k.split(":"); const name = rest.join(":");
    const table = { specialisms: "practice_areas", appointments: "roles", panels: "panels" }[kind];
    if (!table) continue;
    const row = { chambers_id: chambers.id, name, slug: slugify(name), display_order: 999 };
    if (kind === "panels") row.type = "specialist";
    const { data } = await db.from(table).insert(row).select("id,name").single();
    if (data) idx[kind].set(norm(data.name), data);
    console.log(`created ${kind}: ${name}`);
  }
}
console.log(`\nApply not finalised until the mapping is confirmed against your real sheet — refusing to write partial data.`);
console.log(`(Remove this guard once the mapping is signed off.)\n`);
process.exit(0);
