import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin-page";
import { aiConfig } from "@/lib/ai/provider";
import { emailEnabled } from "@/lib/email";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const metadata = { title: "Settings" };
export default async function Page() {
  await requirePage("settings:write");
  const { provider, model, enabled, keyVar } = aiConfig();
  return <SettingsManager initial={await db.settings.get()} ai={{ provider, model, enabled, keyVar }} emailOn={emailEnabled()} />;
}
