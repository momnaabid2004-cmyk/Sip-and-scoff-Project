import { db } from "@/lib/db";
import { FeaturesManager } from "@/components/admin/FeaturesManager";

export const metadata = { title: "Features" };
export default async function Page() {
  return <FeaturesManager initial={await db.features.list()} />;
}
