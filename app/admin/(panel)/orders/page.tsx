import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const metadata = { title: "Orders" };
export default async function Page() {
  await requirePage("orders:read");
  return <OrdersManager initial={await db.orders.list()} />;
}
