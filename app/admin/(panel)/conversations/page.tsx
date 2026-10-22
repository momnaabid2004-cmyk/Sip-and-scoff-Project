import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { can } from "@/lib/auth/permissions";
import { aiConfig } from "@/lib/ai/provider";
import { ConversationsManager } from "@/components/admin/ConversationsManager";

export const metadata = { title: "AI chats" };
export default async function Page() {
  const admin = await requirePage("chats:read");
  const startOfDay = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  startOfDay.setHours(0, 0, 0, 0);
  const offset = Date.now() - new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).getTime();
  const todayPk = new Date(startOfDay.getTime() + offset); // midnight Pakistan time, as a real instant
  const [initial, today, month] = await Promise.all([
    db.chat.listConversations({ page: 1, pageSize: 20 }),
    db.chat.usage(todayPk),
    db.chat.usage(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  ]);
  const inPerM = Number(process.env.AI_COST_INPUT_PER_MILLION);
  const outPerM = Number(process.env.AI_COST_OUTPUT_PER_MILLION);
  const { provider, model, enabled } = aiConfig();
  return (
    <ConversationsManager
      initial={initial}
      usage={{ today, month }}
      cost={inPerM > 0 && outPerM > 0 ? { inPerM, outPerM } : null}
      ai={{ provider, model, enabled }}
      canDelete={can(admin.role, "chats:write")}
    />
  );
}
