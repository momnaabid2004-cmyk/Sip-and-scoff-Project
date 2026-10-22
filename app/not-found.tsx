import Link from "next/link";
import { ProductArt } from "@/components/art/ProductArt";

export default function NotFound() {
  return (
    <section className="grid min-h-[100svh] place-items-center p-6 text-center">
      <div>
        <div className="mx-auto h-40 w-40"><ProductArt kind="cone" tint="#F7C9D4" /></div>
        <h1 className="h-display mt-4 text-5xl">Oops, scoop dropped!</h1>
        <p className="mt-2 text-cocoa-muted">This page doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary mt-6">Back home</Link>
      </div>
    </section>
  );
}
