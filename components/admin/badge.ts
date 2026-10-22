import { clsx } from "clsx";

/** Status pill classes (server- and client-safe). */
export const badge = (tone: "green" | "amber" | "red" | "blue" | "grey" | "purple") =>
  clsx("chip", {
    "bg-pista-light text-pista-600": tone === "green",
    "bg-mango-light text-mango-600": tone === "amber",
    "bg-berry-light text-berry-700": tone === "red",
    "bg-lagoon-light text-lagoon-600": tone === "blue",
    "bg-cocoa/10 text-cocoa-muted": tone === "grey",
    "bg-ube-light text-ube-600": tone === "purple",
  });
