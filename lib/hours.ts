/**
 * Opening-hours helper — reads the hours typed in Admin → Settings, e.g.
 *   { days: "Mon – Thu", time: "9:00 AM – 1:00 AM" }, { days: "Fri – Sun", time: "9:00 AM – 2:00 AM" }
 * Understands day ranges (Mon–Thu, Fri - Sun), lists (Sat, Sun), "Daily"/"Everyday", 12/24-hour times,
 * "Closed", "24 hours", and closing times after midnight. Times are Pakistan time (Asia/Karachi).
 */
type Hours = { days: string; time: string }[];
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dayIndex(word: string) {
  const w = word.trim().toLowerCase().slice(0, 3);
  return DAY_NAMES.indexOf(w);
}

/** "Mon – Thu" → [1,2,3,4];  "Sat, Sun" → [6,0];  "Daily" → all */
export function parseDays(spec: string): number[] {
  const s = spec.toLowerCase();
  if (/daily|every ?day|all week|7 days/.test(s)) return [0, 1, 2, 3, 4, 5, 6];
  const out = new Set<number>();
  for (const part of s.split(/[,&/]|\band\b/)) {
    const range = part.split(/\s*(?:–|—|-|to)\s*/).map((x) => x.trim()).filter(Boolean);
    if (range.length === 2) {
      const a = dayIndex(range[0]);
      const b = dayIndex(range[1]);
      if (a < 0 || b < 0) continue;
      for (let i = a; ; i = (i + 1) % 7) {
        out.add(i);
        if (i === b) break;
      }
    } else if (range.length === 1) {
      const a = dayIndex(range[0]);
      if (a >= 0) out.add(a);
    }
  }
  return [...out];
}

/** "9:00 AM" → 540, "21:30" → 1290, "12 AM" → 0, "noon" → 720 */
function parseClock(t: string): number | null {
  const s = t.trim().toLowerCase();
  if (s === "noon") return 720;
  if (s === "midnight") return 0;
  const m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

/** "9:00 AM – 1:00 AM" → { open: 540, close: 1500 } (close may pass midnight). null = closed / unreadable. */
export function parseTimeRange(spec: string): { open: number; close: number } | null {
  const s = spec.toLowerCase();
  if (/closed/.test(s)) return null;
  if (/24\s*(hours|hrs|h)|open all day/.test(s)) return { open: 0, close: 24 * 60 };
  const parts = s.split(/\s*(?:–|—|-|to)\s*/);
  if (parts.length !== 2) return null;
  const open = parseClock(parts[0]);
  let close = parseClock(parts[1]);
  if (open === null || close === null) return null;
  if (close <= open) close += 24 * 60; // closes after midnight
  return { open, close };
}

/** Current day-of-week and minutes-since-midnight in Pakistan. */
export function pakistanNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return { day: dayIndex(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Is the café open right now? Also handles last night's hours running past midnight. */
export function isOpenNow(hours: Hours, now = new Date()): boolean | null {
  const { day, minutes } = pakistanNow(now);
  let understood = false;
  for (const h of hours) {
    const days = parseDays(h.days);
    const range = parseTimeRange(h.time);
    if (days.length) understood = true;
    if (!range) continue;
    // today's opening
    if (days.includes(day) && minutes >= range.open && minutes < range.close) return true;
    // yesterday's opening that runs past midnight
    const yesterday = (day + 6) % 7;
    if (days.includes(yesterday) && range.close > 24 * 60 && minutes < range.close - 24 * 60) return true;
  }
  return understood ? false : null; // null = hours couldn't be read, don't guess
}

/** Human summary used by the assistant. */
export const hoursText = (hours: Hours) => hours.map((h) => `${h.days}: ${h.time}`).join("\n");

/** "Sunday 3:41 PM" in Pakistan time. */
export const pakistanTimeLabel = (now = new Date()) =>
  new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "long", hour: "numeric", minute: "2-digit", day: "numeric", month: "long", year: "numeric" }).format(now);
