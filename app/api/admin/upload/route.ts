import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, saveImage, sniffImage, type ImageMime } from "@/lib/storage";

/** Product photo upload (admins with products:write). Stored in Supabase Storage in production. */
export async function POST(req: Request) {
  const { error } = await requireAdmin("products:write");
  if (error) return error;
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_IMAGE_BYTES + 64 * 1024) return NextResponse.json({ error: "Image must be under 3 MB." }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!(file.type in IMAGE_TYPES)) return NextResponse.json({ error: "Use a JPG, PNG, WEBP or AVIF image." }, { status: 415 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image must be under 3 MB." }, { status: 413 });
  const buf = new Uint8Array(await file.arrayBuffer());
  const real = sniffImage(buf);
  if (!real || real !== (file.type as ImageMime)) return NextResponse.json({ error: "That file isn't a valid image." }, { status: 415 });
  try {
    return NextResponse.json({ url: await saveImage(buf, real) }, { status: 201 });
  } catch (e) {
    console.error("[upload]", (e as Error).message);
    return NextResponse.json({ error: "Upload failed — please try again or paste an image URL instead." }, { status: 500 });
  }
}
