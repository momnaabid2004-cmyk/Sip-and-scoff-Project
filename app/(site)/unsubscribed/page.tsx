import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };

export default async function Unsubscribed({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const ok = (await searchParams).ok === "1";
  return (
    <section className="container-site py-20">
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h1 className="h-display text-4xl">{ok ? "You're unsubscribed" : "Link expired"}</h1>
        <p className="mt-3 text-espresso-muted">{ok ? "You won't receive our newsletter any more. You can join again from the home page any time." : "This unsubscribe link is invalid or was already used."}</p>
        <Link href="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </section>
  );
}
