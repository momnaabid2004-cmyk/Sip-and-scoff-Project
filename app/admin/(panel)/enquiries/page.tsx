import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { can } from "@/lib/auth/permissions";
import { EnquiriesManager } from "@/components/admin/EnquiriesManager";

export const metadata = { title: "Requests" };
export default async function Page() {
  const admin = await requirePage("enquiries:read");
  return <EnquiriesManager initial={await db.enquiries.list()} canWrite={can(admin.role, "enquiries:write")} />;
}
