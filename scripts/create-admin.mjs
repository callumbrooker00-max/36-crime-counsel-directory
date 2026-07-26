// One-off admin bootstrap. Creates a Supabase auth user and grants a
// chambers_admin membership in the chambers. Run against local or London.
//
//   Reads from the environment — never hardcode secrets:
//     NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (required)
//     ADMIN_EMAIL, ADMIN_PASSWORD                            (required)
//     CHAMBERS_SLUG                                          (default 36-crime)
//
//   Usage:
//     ADMIN_EMAIL=clerk@example.com ADMIN_PASSWORD='…' node scripts/create-admin.mjs
//
// The service-role key stays server-side: this script runs in Node only and is
// never imported by the app (which reaches Supabase via the anon key + RLS).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const chambersSlug = process.env.CHAMBERS_SLUG ?? "36-crime";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}
if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in env.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: chambers, error: chErr } = await db
  .from("chambers")
  .select("id, name")
  .eq("slug", chambersSlug)
  .single();
if (chErr || !chambers) {
  console.error(`Chambers "${chambersSlug}" not found. Apply migrations + seed first.`);
  process.exit(1);
}

// Create (or find) the auth user. The handle_new_user trigger mirrors it into public.users.
let userId;
const { data: created, error: createErr } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createErr) {
  // Already exists → look it up.
  const { data: list } = await db.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === email);
  if (!existing) {
    console.error("Could not create or find the user:", createErr.message);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`User already existed: ${email}`);
} else {
  userId = created.user.id;
  console.log(`Created user: ${email}`);
}

const { error: memErr } = await db
  .from("memberships")
  .upsert(
    { user_id: userId, chambers_id: chambers.id, role: "chambers_admin", status: "active" },
    { onConflict: "user_id,chambers_id" },
  );
if (memErr) {
  console.error("Failed to grant membership:", memErr.message);
  process.exit(1);
}

console.log(`Granted chambers_admin on "${chambers.name}". Sign in at /admin/sign-in.`);
