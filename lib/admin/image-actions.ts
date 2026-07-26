"use server";

import sharp from "sharp";
import { updateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth/admin-context";
import { directoryTag, DEFAULT_CHAMBERS_SLUG } from "@/lib/directory/get-directory";
import type { ActionResult } from "@/lib/admin/member-actions";

const BUCKET = "counsel-images";

async function ownedCounsel(counselId: string) {
  const ctx = await requireAdminContext();
  const supabase = await createClient();
  const { data } = await supabase.from("counsel").select("id, chambers_id").eq("id", counselId).single();
  if (!data || data.chambers_id !== ctx.chambersId) return null;
  return { ctx, supabase };
}

export async function uploadHeadshot(
  counselId: string,
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const scope = await ownedCounsel(counselId);
  if (!scope) return { ok: false, error: "Not found." };
  const { ctx, supabase } = scope;

  const file = formData.get("image");
  const alt = String(formData.get("alt") ?? "").trim();
  if (!(file instanceof File)) return { ok: false, error: "No image supplied." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Image too large (max 8MB)." };

  // Optimise: auto-orient from EXIF, crop to a square, re-encode as webp. Output
  // carries NO metadata — sharp drops EXIF/GPS unless withMetadata() is called.
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input).rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 82 }).toBuffer();

  const key = `${ctx.chambersId}/${counselId}/headshot-${Date.now()}.webp`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, output, { contentType: "image/webp", upsert: true });
  if (upErr) return { ok: false, error: "Upload failed. Retry." };

  // Replace any previous primary headshot (row + stored object).
  const { data: old } = await supabase
    .from("images")
    .select("id, storage_key")
    .eq("counsel_id", counselId)
    .eq("type", "headshot")
    .eq("is_primary", true);
  if (old?.length) {
    await supabase.storage.from(BUCKET).remove(old.map((o) => o.storage_key));
    await supabase.from("images").delete().in("id", old.map((o) => o.id));
  }

  const { error: insErr } = await supabase.from("images").insert({
    chambers_id: ctx.chambersId,
    counsel_id: counselId,
    type: "headshot",
    storage_key: key,
    alt_text: alt || null,
    mime_type: "image/webp",
    width: 512,
    height: 512,
    is_primary: true,
    created_by: ctx.userId,
  });
  if (insErr) return { ok: false, error: "Couldn't save the image." };

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(key, 3600);
  updateTag(directoryTag(DEFAULT_CHAMBERS_SLUG));
  revalidatePath(`/admin/members/${counselId}`);
  return { ok: true, url: signed?.signedUrl };
}

export async function removeHeadshot(counselId: string): Promise<ActionResult> {
  const scope = await ownedCounsel(counselId);
  if (!scope) return { ok: false, error: "Not found." };
  const { supabase } = scope;
  const { data: old } = await supabase
    .from("images")
    .select("id, storage_key")
    .eq("counsel_id", counselId)
    .eq("type", "headshot")
    .eq("is_primary", true);
  if (old?.length) {
    await supabase.storage.from(BUCKET).remove(old.map((o) => o.storage_key));
    await supabase.from("images").delete().in("id", old.map((o) => o.id));
  }
  updateTag(directoryTag(DEFAULT_CHAMBERS_SLUG));
  revalidatePath(`/admin/members/${counselId}`);
  return { ok: true };
}
