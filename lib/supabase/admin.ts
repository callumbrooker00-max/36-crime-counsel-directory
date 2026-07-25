import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — BYPASSES RLS. Server-only (guarded by `server-only`).
 * Use exclusively for trusted operations like building the cached /directory
 * payload; never expose the key or import this into client code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
