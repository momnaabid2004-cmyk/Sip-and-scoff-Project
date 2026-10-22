import { promises as fs } from "fs";
import path from "path";
import { localUploadDir } from "@/lib/storage";

const DIR = localUploadDir;
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(DIR, name));
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": MIME[name.split(".").pop()!], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
