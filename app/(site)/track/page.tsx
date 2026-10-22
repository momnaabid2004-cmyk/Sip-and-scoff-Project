import type { Metadata } from "next";
import { TrackOrder } from "@/components/sections/track/TrackOrder";

export const metadata: Metadata = { title: "Track your order", description: "Check the live status of your Sip & Scoop order." };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <section className="container-site py-12 sm:py-16">
      <TrackOrder initialCode={typeof code === "string" ? code.slice(0, 20) : ""} />
    </section>
  );
}
