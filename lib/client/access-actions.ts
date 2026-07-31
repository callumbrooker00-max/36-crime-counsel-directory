"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";
import { rateLimit } from "@/lib/rate-limit";
import { CLIENT_COOKIE, CLIENT_MAX_AGE, signSession } from "@/lib/auth/client-session";

export interface AccessState {
  error?: string;
}

// Normalise what the client typed: codes are 32-char-alphabet, uppercase, no
// separators — so accept spaces/dashes and any case.
function canonical(input: string): string {
  return input.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

// Enter an access code. A non-revoked match mints a signed session cookie and
// drops the client into the directory. Runs against the trusted service-role
// client (the visitor is unauthenticated) and is IP rate-limited to blunt
// brute-force guessing of the shared code.
export async function submitAccessCode(_prev: AccessState, formData: FormData): Promise<AccessState> {
  const code = canonical(String(formData.get("code") ?? ""));
  if (!code) return { error: "Enter your access code." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok } = await rateLimit(`access-code:${ip}`, 5, 60_000);
  if (!ok) return { error: "Too many attempts. Wait a minute and try again." };

  const db = createAdminClient();
  const { data: chambers } = await db.from("chambers").select("id").eq("slug", DEFAULT_CHAMBERS_SLUG).single();
  if (!chambers) return { error: "Something went wrong. Try again." };

  const { data: row } = await db
    .from("client_access")
    .select("id")
    .eq("chambers_id", chambers.id)
    .eq("code", code)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (!row) return { error: "That code isn't valid. Check it with your clerk." };

  await db.from("client_access").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);

  const token = await signSession(row.id);
  const store = await cookies();
  store.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLIENT_MAX_AGE,
  });

  redirect("/");
}

export async function signOutClient(): Promise<void> {
  const store = await cookies();
  store.delete(CLIENT_COOKIE);
  redirect("/access");
}
