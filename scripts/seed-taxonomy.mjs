// Seed the controlled taxonomy for the real import (idempotent, tenant-scoped).
// Specialisms = the 19 confirmed practice areas; roles = Led Junior + Leading
// Junior (King's Counsel already exists globally; grades Level 1–4 exist).
// Panels are NOT seeded here — the importer discovers them from the sheet.
//
//   node --env-file=.env.local scripts/seed-taxonomy.mjs [--chambers 36-crime]
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const chambersSlug = process.argv.includes("--chambers")
  ? process.argv[process.argv.indexOf("--chambers") + 1]
  : "36-crime";

const SPECIALISMS = [
  "Child Witnesses/Vulnerable Complainants",
  "Complex Legal Issues",
  "Contraband into Prisons using Drones",
  "Counter Terrorism",
  "Cross Jurisdiction",
  "Cybercrime and Cryptocurrency",
  "Drug Conspiracies/Trafficking",
  "DV Cleared",
  "Fraud and Financial Crime",
  "Highly Sensitive Intelligence",
  "Homicide and Violence",
  "Institutional Abuse and Sex Trafficking",
  "IOPC Referrals (Police)",
  "Medical Evidence and Severe Mental Health",
  "Modern Slavery",
  "Organised Crime",
  "Protest/Public Disorder",
  "RASSO",
  "Small Boat Immigration Offences",
];
const ROLES = ["Led Junior", "Leading Junior"];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const db = createClient(url, key, { auth: { persistSession: false } });

async function upsertTerm(table, chambersId, name, order) {
  const slug = slugify(name);
  const { data: existing } = await db
    .from(table)
    .select("id")
    .eq("chambers_id", chambersId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    await db.from(table).update({ name, display_order: order, is_active: true }).eq("id", existing.id);
    return "updated";
  }
  await db.from(table).insert({ chambers_id: chambersId, name, slug, display_order: order, is_active: true });
  return "inserted";
}

const { data: chambers } = await db.from("chambers").select("id, name").eq("slug", chambersSlug).single();
if (!chambers) {
  console.error(`Chambers "${chambersSlug}" not found.`);
  process.exit(1);
}

let ins = 0;
let upd = 0;
for (let i = 0; i < SPECIALISMS.length; i++) {
  if ((await upsertTerm("practice_areas", chambers.id, SPECIALISMS[i], i + 1)) === "inserted") ins++;
  else upd++;
}
for (let i = 0; i < ROLES.length; i++) {
  if ((await upsertTerm("roles", chambers.id, ROLES[i], 10 + i)) === "inserted") ins++;
  else upd++;
}
console.log(`Taxonomy seeded for "${chambers.name}": ${ins} inserted, ${upd} updated (${SPECIALISMS.length} specialisms, ${ROLES.length} roles).`);
