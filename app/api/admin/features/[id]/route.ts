import { db } from "@/lib/db";
import { featureInput } from "@/lib/db/schemas";
import { itemRoutes } from "@/lib/crud";

export const { GET, PUT, DELETE } = itemRoutes(() => db.features, featureInput, "features:write", "Feature");
