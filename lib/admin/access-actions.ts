"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowlisted } from "@/lib/auth/client-gate";

export interface AccessState {
  sent?: boolean;
  error?: string;
}

// Request a magic link. A link is only SENT to an allowlisted address, but the
// response is identical whether or not the address has access (no enumeration).
export async function requestAccessLink(_prev: AccessState, formData: FormData): Promise<AccessState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  if (await isAllowlisted(email)) {
    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("host")}`;
    const supabase = await createClient();
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  }
  return { sent: true };
}

export async function signOutClient(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/access");
}
