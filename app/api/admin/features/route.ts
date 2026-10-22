import { db } from "@/lib/db";
import { featureInput } from "@/lib/db/schemas";
import { collectionRoutes } from "@/lib/crud";

export const { GET, POST } = collectionRoutes(() => db.features, featureInput, "features:write", "Feature");
