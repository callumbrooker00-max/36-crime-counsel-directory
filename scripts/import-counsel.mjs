// One-time counsel import from the chambers spreadsheet.
//
//   node --env-file=.env.local scripts/import-counsel.mjs <file.xlsx>          (dry-run: writes NOTHING)
//   node --env-file=.env.local scripts/import-counsel.mjs <file.xlsx> --apply  (writes; run only after sign-offs)
//
// Columns (header row): Name, Grading, Usual Role, Specialisms,
//   Recent and Forthcoming Cases, Specialist CPS Panels, Website URL,
//   Image URL, and optionally Year of Call.
//
// Rules: see docs — semicolon-split multi-values; Grading KC→King's Counsel role
// (no General Crime level), 4/3/2→General Crime at Level n; specialist panels
// "Name (Gn)"→panel + Level n (no (Gn) = membership-only); Nil/blank/N/A/- = no
// panels. Specialisms + roles are STRICT against the seeded taxonomy (unmatched
// / near-match reported, never created). Panels are DISCOVERED and reported for
// approval; created tenant-scoped on --apply. Headshots downloaded, EXIF-stripped,
// stored (never hot-linked). Members without a valid year of call import as DRAFT.
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const [, , filePath, ...flags] = process.argv;
const APPLY = flags.includes("--apply");
const CHAMBERS_SLUG = process.env.CHAMBERS_SLUG ?? "36-crime";
const BUCKET = "counsel-images";
const NATIONAL_PANELS = ["General Crime", "Serious Crime", "RASSO", "Fraud", "Proceeds of Crime", "Counter Terrorism", "Extradition"];
const NIL = new Set(["", "nil", "n/a", "na", "-", "none"]);

if (!filePath) {
  console.error("Usage: node --env-file=.env.local scripts/import-counsel.mjs <file.xlsx> [--apply]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// ---- helpers ----
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const splitMulti = (cell) => String(cell ?? "").split(";").map((x) => x.trim()).filter(Boolean);

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
// Nearest candidate by containment (catches abbreviations, e.g. "Cybercrime" →
// "Cybercrime and Cryptocurrency") or high edit-similarity (catches typos, e.g.
// "Seriuos Crime" → "Serious Crime"), while leaving genuinely distinct names
// (e.g. "Serious Organised Crime") unmatched.
function nearest(name, candidates) {
  const target = norm(name);
  if (!target) return null;
  let best = null, bestScore = 0;
  for (const c of candidates) {
    const cn = norm(c.name ?? c);
    if (!cn || cn === target) continue;
    const score = cn.includes(target) || target.includes(cn) ? 0.9 : 1 - levenshtein(target, cn) / Math.max(target.length, cn.length);
    if (score > bestScore) { bestScore = score; best = c.name ?? c; }
  }
  return bestScore >= 0.72 ? best : null;
}

// ---- load taxonomy ----
const { data: chambers } = await db.from("chambers").select("id, name").eq("slug", CHAMBERS_SLUG).single();
if (!chambers) { console.error(`Chambers "${CHAMBERS_SLUG}" not found.`); process.exit(1); }
const tenantOrGlobal = `chambers_id.eq.${chambers.id},chambers_id.is.null`;
const [{ data: paRows }, { data: roleRows }, { data: panelRows }, { data: gradeRows }] = await Promise.all([
  db.from("practice_areas").select("id, name").eq("is_active", true).or(tenantOrGlobal),
  db.from("roles").select("id, name").eq("is_active", true).or(tenantOrGlobal),
  db.from("panels").select("id, name, chambers_id").eq("is_active", true).or(tenantOrGlobal),
  db.from("grades").select("id, name, rank"),
]);
const paByNorm = new Map(paRows.map((r) => [norm(r.name), r]));
const roleByNorm = new Map(roleRows.map((r) => [norm(r.name), r]));
const panelByNorm = new Map(panelRows.map((r) => [norm(r.name), r]));
const gradeByRank = new Map(gradeRows.map((r) => [r.rank, r]));
const gcPanel = panelByNorm.get(norm("General Crime"));

// ---- read workbook ----
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);
const sheet = wb.worksheets[0];
const headers = {};
sheet.getRow(1).eachCell((cell, col) => { headers[String(cell.value).trim()] = col; });
const cell = (row, name) => (headers[name] ? row.getCell(headers[name]).value : null);
const text = (v) => (v == null ? "" : typeof v === "object" && v.text ? String(v.text) : String(v)).trim();

// ---- parse + resolve ----
const records = [];
const unmatchedSpecialisms = new Map(); // name -> {count, near}
const unmatchedRoles = new Map();
const discoveredPanels = new Map(); // norm -> {name, status: known|near|new, near, count}
const imageIssues = [];

for (let r = 2; r <= sheet.rowCount; r++) {
  const row = sheet.getRow(r);
  const name = text(cell(row, "Name"));
  if (!name) continue;

  const grading = text(cell(row, "Grading"));
  const usualRole = text(cell(row, "Usual Role"));
  const yoc = parseInt(text(cell(row, "Year of Call")), 10);
  const websiteUrl = text(cell(row, "Website URL"));
  const imageUrl = text(cell(row, "Image URL"));

  // specialisms — strict
  const specialismIds = [];
  for (const s of splitMulti(cell(row, "Specialisms"))) {
    const hit = paByNorm.get(norm(s));
    if (hit) specialismIds.push(hit.id);
    else {
      const near = nearest(s, paRows);
      const k = s;
      unmatchedSpecialisms.set(k, { count: (unmatchedSpecialisms.get(k)?.count ?? 0) + 1, near });
    }
  }

  // roles — Usual Role (strict) + King's Counsel when Grading = KC
  const roleIds = [];
  if (usualRole) {
    const hit = roleByNorm.get(norm(usualRole));
    if (hit) roleIds.push(hit.id);
    else unmatchedRoles.set(usualRole, { count: (unmatchedRoles.get(usualRole)?.count ?? 0) + 1, near: nearest(usualRole, roleRows) });
  }
  const isKC = norm(grading) === "kc";
  if (isKC) {
    const kc = roleByNorm.get(norm("King's Counsel")) ?? roleByNorm.get(norm("Kings Counsel"));
    if (kc) roleIds.push(kc.id);
    else unmatchedRoles.set("King's Counsel", { count: 1, near: null });
  }

  // panel memberships: General Crime from Grading (unless KC) + specialist panels
  const memberships = [];
  if (!isKC && /^[1-4]$/.test(grading) && gcPanel) {
    memberships.push({ panelName: "General Crime", panelId: gcPanel.id, gradeRank: Number(grading) });
  }
  for (const entry of splitMulti(cell(row, "Specialist CPS Panels"))) {
    if (NIL.has(norm(entry))) continue;
    const m = entry.match(/^(.*?)\s*\(\s*G\s*(\d)\s*\)\s*$/i);
    const panelName = (m ? m[1] : entry).trim();
    const gradeRank = m ? Number(m[2]) : null;
    if (!m && /\(.*\)/.test(entry)) imageIssues.push(`row ${r}: panel "${entry}" — parentheses not a (Gn) grade`);
    // resolve/collect the panel
    const known = panelByNorm.get(norm(panelName));
    let status = "new", near = null;
    if (known) status = "known";
    else if ((near = nearest(panelName, [...panelRows, ...NATIONAL_PANELS.map((n) => ({ name: n }))]))) status = "near";
    const rec = discoveredPanels.get(norm(panelName)) ?? { name: panelName, status, near, count: 0 };
    rec.count++; discoveredPanels.set(norm(panelName), rec);
    memberships.push({ panelName, panelId: known?.id ?? null, gradeRank });
  }

  // cases (title-only)
  const cases = splitMulti(cell(row, "Recent and Forthcoming Cases")).map((title) => ({ title }));

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) imageIssues.push(`row ${r}: image URL "${imageUrl}" is not http(s)`);

  const publishable = Boolean(name) && Number.isInteger(yoc) && specialismIds.length > 0;
  records.push({
    row: r, name, slug: slugify(name),
    yearOfCall: Number.isInteger(yoc) ? yoc : null,
    profileUrl: websiteUrl || null, imageUrl: imageUrl || null,
    specialismIds, roleIds, memberships, cases,
    publishable,
    draftReason: publishable ? null : [!Number.isInteger(yoc) && "no year of call", specialismIds.length === 0 && "no matched specialism"].filter(Boolean).join(", "),
  });
}

// ---- report ----
const line = (s = "") => console.log(s);
line(`\n=== ${APPLY ? "APPLY" : "DRY-RUN"} — ${records.length} counsel rows in ${filePath} ===`);
line(`Publishable now: ${records.filter((x) => x.publishable).length} · Draft on import: ${records.filter((x) => !x.publishable).length}`);
for (const rec of records) {
  line(`  ${rec.publishable ? "PUBLISH" : "draft  "}  ${rec.name}  ${rec.draftReason ? "(" + rec.draftReason + ")" : ""}`);
}
if (unmatchedSpecialisms.size) {
  line(`\n! Unmatched specialisms (STRICT — not imported, fix the sheet or add to taxonomy):`);
  for (const [name, v] of unmatchedSpecialisms) line(`    "${name}" ×${v.count}${v.near ? `  — did you mean "${v.near}"?` : ""}`);
}
if (unmatchedRoles.size) {
  line(`\n! Unmatched roles:`);
  for (const [name, v] of unmatchedRoles) line(`    "${name}" ×${v.count}${v.near ? `  — did you mean "${v.near}"?` : ""}`);
}
if (discoveredPanels.size) {
  line(`\n• Specialist panels found (approve this set; new ones created tenant-scoped on --apply):`);
  for (const [, v] of discoveredPanels) {
    const tag = v.status === "known" ? "known" : v.status === "near" ? `NEAR-MATCH → "${v.near}"?` : "NEW";
    line(`    ${tag.padEnd(24)} "${v.name}" ×${v.count}`);
  }
}
if (imageIssues.length) {
  line(`\n! Image / parse warnings:`);
  imageIssues.forEach((m) => line(`    ${m}`));
}
line("");

if (!APPLY) {
  line("Dry-run only — nothing was written. Re-run with --apply after sign-off.\n");
  process.exit(0);
}

// ---- apply (writes) ----
line("Applying…");
// 1) create discovered NEW panels (tenant-scoped)
for (const [k, v] of discoveredPanels) {
  if (v.status === "new") {
    const slug = slugify(v.name);
    const { data: existing } = await db.from("panels").select("id").eq("chambers_id", chambers.id).eq("slug", slug).maybeSingle();
    const id = existing?.id ?? (await db.from("panels").insert({ chambers_id: chambers.id, name: v.name, slug, type: "specialist" }).select("id").single()).data.id;
    panelByNorm.set(k, { id, name: v.name });
  }
}
async function downloadHeadshot(counselId, imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return `HTTP ${res.status}`;
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf).rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 82 }).toBuffer(); // strips EXIF
    const storageKey = `${chambers.id}/${counselId}/headshot-${Date.now()}.webp`;
    const up = await db.storage.from(BUCKET).upload(storageKey, out, { contentType: "image/webp", upsert: true });
    if (up.error) return up.error.message;
    await db.from("images").delete().eq("counsel_id", counselId).eq("type", "headshot").eq("is_primary", true);
    await db.from("images").insert({ chambers_id: chambers.id, counsel_id: counselId, type: "headshot", storage_key: storageKey, mime_type: "image/webp", width: 512, height: 512, is_primary: true });
    return null;
  } catch (e) {
    return e.message;
  }
}

let created = 0, updated = 0;
for (const rec of records) {
  const { data: existing } = await db.from("counsel").select("id").eq("chambers_id", chambers.id).eq("slug", rec.slug).maybeSingle();
  const fields = {
    chambers_id: chambers.id, full_name: rec.name, slug: rec.slug,
    year_of_call: rec.yearOfCall, practice_capacity: "both", profile_url: rec.profileUrl,
    status: rec.publishable ? "published" : "draft",
  };
  let counselId = existing?.id;
  if (counselId) { await db.from("counsel").update(fields).eq("id", counselId); updated++; }
  else { counselId = (await db.from("counsel").insert(fields).select("id").single()).data.id; created++; }

  // replace associations
  await db.from("counsel_practice_areas").delete().eq("counsel_id", counselId);
  if (rec.specialismIds.length) await db.from("counsel_practice_areas").insert(rec.specialismIds.map((practice_area_id, i) => ({ counsel_id: counselId, practice_area_id, is_primary: i === 0 })));
  await db.from("counsel_roles").delete().eq("counsel_id", counselId);
  if (rec.roleIds.length) await db.from("counsel_roles").insert([...new Set(rec.roleIds)].map((role_id) => ({ counsel_id: counselId, role_id })));
  await db.from("panel_memberships").delete().eq("counsel_id", counselId);
  const mships = rec.memberships.map((m) => ({
    counsel_id: counselId,
    panel_id: m.panelId ?? panelByNorm.get(norm(m.panelName))?.id,
    grade_id: m.gradeRank ? gradeByRank.get(m.gradeRank)?.id ?? null : null,
    status: "active",
  })).filter((m) => m.panel_id);
  if (mships.length) await db.from("panel_memberships").insert(mships);
  await db.from("notable_cases").delete().eq("counsel_id", counselId);
  if (rec.cases.length) await db.from("notable_cases").insert(rec.cases.map((c, i) => ({ counsel_id: counselId, title: c.title, display_order: i })));

  if (rec.imageUrl) {
    const err = await downloadHeadshot(counselId, rec.imageUrl);
    if (err) line(`    headshot failed for ${rec.name}: ${err}`);
  }
}
line(`\nDone. Counsel created: ${created}, updated: ${updated}. Review in /admin/members.\n`);
