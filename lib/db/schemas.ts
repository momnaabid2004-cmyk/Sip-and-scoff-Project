import { z } from "zod";

/** Input validation for every write (shared by API routes; reuse for your DB layer). */
const flavour = z.enum(["cocoa", "chai", "berry", "lagoon", "pista", "mango", "ube"]);
const art = z.enum(["cup", "iced", "chai-glass", "matka", "cone", "sundae", "kulfi", "shake", "mojito", "can", "sandwich", "fries", "wrap", "burger", "samosa", "nuggets", "cake", "brownie", "waffle", "bowl"]);
const tag = z.enum(["bestseller", "new", "veg", "spicy", "seasonal", "low-caffeine"]);

export const optionGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  multi: z.boolean(),
  required: z.boolean(),
  choices: z.array(z.object({ id: z.string().min(1), label: z.string().trim().min(1).max(40), priceDelta: z.coerce.number().int().min(0).max(100000) })).min(1).max(12),
});

export const productInput = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  description: z.string().trim().max(240).default(""),
  categoryId: z.string().min(1, "Choose a category"),
  price: z.coerce.number().int("Whole rupees only").min(1, "Price must be above 0").max(100000),
  image: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .default(null)
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https:\/\//i.test(v) || /^\/api\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(v), "Use an https:// image link or upload a photo"),
  art: art.default("cup"),
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #C7843F").default("#C7843F"),
  tags: z.array(tag).max(6).default([]),
  options: z.array(optionGroupSchema).max(6).default([]),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const categoryInput = z.object({
  name: z.string().trim().min(2).max(40),
  tagline: z.string().trim().max(120).default(""),
  color: flavour,
  art: art,
  sortOrder: z.coerce.number().int().default(0),
});

export const featureInput = z.object({
  title: z.string().trim().min(2).max(50),
  description: z.string().trim().max(160).default(""),
  icon: z.enum(["wifi", "moon", "family", "truck", "halal", "wallet", "leaf", "star", "music", "parking"]),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const adminCreateInput = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["owner", "admin", "editor"]),
  password: z.string().min(8, "At least 8 characters").max(100),
});
export const adminUpdateInput = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  role: z.enum(["owner", "admin", "editor"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "At least 8 characters").max(100).optional(),
});

export const orderInput = z.object({
  type: z.enum(["delivery", "pickup"]),
  customer: z.object({
    name: z.string().trim().min(2, "Name is required").max(60),
    phone: z.string().trim().regex(/^(\+92|0)3\d{2}[- ]?\d{7}$/, "Use a Pakistani mobile number, e.g. 0300 1234567"),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address").max(120)]).default(""),
    address: z.string().trim().max(200).default(""),
    area: z.string().trim().max(60).default(""),
    notes: z.string().trim().max(240).default(""),
  }),
  items: z
    .array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(50), choiceIds: z.array(z.string()).max(30).default([]) }))
    .min(1, "Your cart is empty")
    .max(60),
  payment: z.enum(["cod", "jazzcash", "easypaisa", "card"]),
});

export const messageInput = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(60),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20).default(""),
  subject: z.string().trim().max(120).default(""),
  message: z.string().trim().min(10, "At least 10 characters").max(2000),
});

// only http(s) links (or empty) — blocks javascript: URLs being rendered as social links
const socialUrl = z.string().trim().max(200).refine((v) => v === "" || /^https?:\/\//i.test(v), "Use a full link starting with https://");

export const settingsInput = z.object({
  cafeName: z.string().trim().min(2).max(40),
  announcement: z.string().trim().max(140).default(""),
  tagline: z.string().trim().max(140),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email(),
  address: z.string().trim().max(160),
  city: z.string().trim().max(40),
  mapsQuery: z.string().trim().max(160),
  hours: z.array(z.object({ days: z.string().trim().min(1).max(40), time: z.string().trim().min(1).max(40) })).min(1).max(7),
  deliveryFee: z.coerce.number().int().min(0).max(5000),
  freeDeliveryOver: z.coerce.number().int().min(0).max(100000),
  deliveryAreas: z.array(z.string().trim().min(1).max(40)).max(30),
  deliveryTime: z.string().trim().max(40),
  socials: z.object({ instagram: socialUrl, facebook: socialUrl, tiktok: socialUrl }),
  aiName: z.string().trim().min(1).max(30),
  aiGreeting: z.string().trim().max(240),
  aiKnowledge: z.string().trim().max(8000),
  aiStarters: z.array(z.string().trim().min(2).max(60)).max(6).default([]),
});

export const loginInput = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

/** Turn a ZodError into { field: message } for forms. */
export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
