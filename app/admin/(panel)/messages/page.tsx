import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { MessagesManager } from "@/components/admin/MessagesManager";

export const metadata = { title: "Messages" };
export default async function Page() {
  await requirePage("messages:read");
  return <MessagesManager initial={await db.messages.list()} />;
}
