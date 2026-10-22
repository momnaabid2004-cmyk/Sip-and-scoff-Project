import { db } from "@/lib/db";
import { toPublic } from "@/lib/auth/guard";
import { requirePage } from "@/lib/admin-page";
import { TeamManager } from "@/components/admin/TeamManager";

export const metadata = { title: "Team" };
export default async function Page() {
  await requirePage("team:read");
  return <TeamManager initial={(await db.admins.list()).map(toPublic)} />;
}
