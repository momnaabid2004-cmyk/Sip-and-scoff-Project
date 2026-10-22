import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
