"use client";
import { useState } from "react";

/** fetch JSON with loading / error / per-field errors (422 from zod). */
export function useApi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function call<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T | null> {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch(url, {
        method: init.method ?? (init.body ? "POST" : "GET"),
        headers: init.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: init.body instanceof FormData ? init.body : init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setFields(Object.fromEntries(Object.entries(data.errors ?? {}).filter(([, v]) => v)) as Record<string, string>);
        return null;
      }
      return data as T;
    } catch {
      setError("Network error — check your connection.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { call, busy, error, fields, setError, setFields };
}
