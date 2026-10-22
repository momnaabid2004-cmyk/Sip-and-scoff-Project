import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { SubscribersManager } from "@/components/admin/SubscribersManager";

export const metadata = { title: "Subscribers" };
export default async function Page() {
  await requirePage("subscribers:read");
  return <SubscribersManager initial={await db.subscribers.list()} />;
}
