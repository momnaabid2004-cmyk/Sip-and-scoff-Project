import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Sip & Scoop" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100svh] bg-[#FBF6EF]">{children}</div>;
}
