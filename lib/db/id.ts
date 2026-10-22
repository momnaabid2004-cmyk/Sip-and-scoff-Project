import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Collision-resistant, URL-safe id: "c" + 24 lowercase letters/digits (≈124 bits of randomness). */
export function createId() {
  const bytes = randomBytes(24);
  let out = "c";
  for (let i = 0; i < 24; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
export const isId = (s: string) => /^c[a-z0-9]{24}$/.test(s);
