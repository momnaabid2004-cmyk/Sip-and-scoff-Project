/** Normalise a Pakistani mobile number to 03XXXXXXXXX ("+92 300-1234567" → "03001234567"). Returns "" if invalid. */
export function normalizePkPhone(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("0092")) local = "0" + local.slice(4);
  else if (local.startsWith("92")) local = "0" + local.slice(2);
  else if (local.startsWith("3") && local.length === 10) local = "0" + local;
  return /^03\d{9}$/.test(local) ? local : "";
}

/** "03001234567" → "0300 1234567" */
export const formatPkPhone = (p: string) => (p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4)}` : p);

/** Digits-only for wa.me links: "+92 300 0000000" → "923000000000" */
export function waNumber(input: string) {
  const d = (input ?? "").replace(/\D/g, "");
  return d.startsWith("0") ? "92" + d.slice(1) : d;
}
