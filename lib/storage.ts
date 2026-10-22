import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Product photo storage.
 * - Production: Supabase Storage (public bucket) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
 * - Development fallback: ./data/uploads, served by /api/uploads/[name] (does NOT persist on Vercel).
 */
export const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;
export type ImageMime = keyof typeof IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const LOCAL_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
const BUCKET = process.env.SUPABASE_BUCKET || "product-images";

/** Check the file's real bytes (not just the browser-supplied type) — blocks HTML/SVG/scripts renamed to .jpg. */
export function sniffImage(buf: Uint8Array): ImageMime | null {
  const b = (i: number) => buf[i];
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /^(avif|avis)$/.test(ascii(8, 12))) return "image/avif";
  return null;
}

export const storageMode = () => (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local");

export async function saveImage(buf: Uint8Array, mime: ImageMime): Promise<string> {
  const name = `${randomUUID()}.${IMAGE_TYPES[mime]}`;
  if (storageMode() === "supabase") {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(BUCKET).upload(`products/${name}`, buf, { contentType: mime, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(`products/${name}`).data.publicUrl;
  }
  if (process.env.VERCEL) throw new Error("Image uploads need Supabase Storage on Vercel — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), buf);
  return `/api/uploads/${name}`;
}

export const localUploadDir = LOCAL_DIR;
