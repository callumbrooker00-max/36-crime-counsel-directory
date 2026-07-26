// Add a client-access allowlist entry (PRD D1). Grants portal access to an exact
// email or a whole firm domain. Reads secrets from env — never hardcode.
//
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (required)
//   CLIENT_LABEL                                          (required, firm name)
//   CLIENT_EMAIL  and/or  CLIENT_DOMAIN                   (at least one)
//   CHAMBERS_SLUG                                         (default 36-crime)
//
//   e.g. CLIENT_LABEL="CPS London" CLIENT_DOMAIN="cps.gov.uk" \
//        node --env-file=.env.local scripts/grant-client-access.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const label = process.env.CLIENT_LABEL;
const email = process.env.CLIENT_EMAIL?.trim().toLowerCase() || null;
const domain = process.env.CLIENT_DOMAIN?.trim().toLowerCase().replace(/^@/, "") || null;
const slug = process.env.CHAMBERS_SLUG ?? "36-crime";

if (!url || !key) { console.error("Missing Supabase env."); process.exit(1); }
if (!label) { console.error("Missing CLIENT_LABEL."); process.exit(1); }
if (!email && !domain) { console.error("Provide CLIENT_EMAIL and/or CLIENT_DOMAIN."); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });
const { data: ch } = await db.from("chambers").select("id").eq("slug", slug).single();
if (!ch) { console.error(`Chambers "${slug}" not found.`); process.exit(1); }

const { error } = await db.from("client_access").insert({
  chambers_id: ch.id,
  label,
  email,
  domain,
  method: "magic_link",
});
if (error) { console.error("Failed:", error.message); process.exit(1); }
console.log(`Granted access — ${label} (${email ?? ""}${email && domain ? " / " : ""}${domain ? "@" + domain : ""}).`);
