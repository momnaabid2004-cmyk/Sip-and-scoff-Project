import type { ReactNode } from "react";

/** Label + control + inline error, wired for screen readers. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-cherry-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-espresso-muted">{hint}</p> : null}
    </div>
  );
}
export const errProps = (id: string, error?: string) => ({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined });
