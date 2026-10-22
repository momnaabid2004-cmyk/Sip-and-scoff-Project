import "server-only";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/guard";
import { can, type Permission } from "@/lib/auth/permissions";

/** Server-side page guard for role-restricted admin screens. */
export async function requirePage(p: Permission) {
  const a = await currentAdmin();
  if (!a) redirect("/admin/login");
  if (!can(a.role, p)) redirect("/admin");
  return a;
}
