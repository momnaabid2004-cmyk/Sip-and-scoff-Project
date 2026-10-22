/**
 * Domain types — the contract between UI, API routes and the database.
 * Swap the storage (JSON file → Postgres/Prisma, Supabase, MongoDB…) without touching these.
 */
export type FlavourColor = "cocoa" | "chai" | "berry" | "lagoon" | "pista" | "mango" | "ube";

export type ArtKind =
  | "cup" | "iced" | "chai-glass" | "matka" | "cone" | "sundae" | "kulfi" | "shake" | "mojito" | "can"
  | "sandwich" | "fries" | "wrap" | "burger" | "samosa" | "nuggets" | "cake" | "brownie" | "waffle" | "bowl";

export type ProductTag = "bestseller" | "new" | "veg" | "spicy" | "seasonal" | "low-caffeine";

export type OptionChoice = { id: string; label: string; priceDelta: number };
export type OptionGroup = { id: string; name: string; multi: boolean; required: boolean; choices: OptionChoice[] };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  price: number; // PKR
  image: string | null; // replaceable photo; null → illustrated placeholder
  art: ArtKind;
  tint: string; // placeholder liquid / scoop colour
  tags: ProductTag[];
  options: OptionGroup[];
  available: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  color: FlavourColor;
  art: ArtKind;
  sortOrder: number;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: FeatureIcon;
  active: boolean;
  sortOrder: number;
};
export type FeatureIcon = "wifi" | "moon" | "family" | "truck" | "halal" | "wallet" | "leaf" | "star" | "music" | "parking";

export type Role = "owner" | "admin" | "editor";
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  /** bumped on password change / deactivation so old login cookies stop working */
  sessionVersion: number;
  createdAt: string;
  lastLoginAt: string | null;
};
export type PublicAdmin = Omit<AdminUser, "passwordHash" | "sessionVersion">;

export type OrderStatus = "new" | "confirmed" | "preparing" | "on-the-way" | "completed" | "cancelled";
export type PaymentMethod = "cod" | "jazzcash" | "easypaisa" | "card";
export type OrderItem = { productId: string; name: string; unitPrice: number; qty: number; options: string };
export type Order = {
  id: string;
  code: string;
  type: "delivery" | "pickup";
  customer: { name: string; phone: string; email: string; address: string; area: string; notes: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  /** when each step happened — used by the public tracking page */
  timeline: { confirmedAt: string | null; preparingAt: string | null; dispatchedAt: string | null; completedAt: string | null; cancelledAt: string | null };
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Settings = {
  cafeName: string;
  /** Short promo shown in the bar at the top of every page (empty = hidden). */
  announcement?: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  mapsQuery: string;
  hours: { days: string; time: string }[];
  deliveryFee: number;
  freeDeliveryOver: number;
  deliveryAreas: string[];
  deliveryTime: string;
  socials: { instagram: string; facebook: string; tiktok: string };
  aiName: string;
  aiGreeting: string;
  /** Free-text facts the AI assistant should know (offers, events, policies). Editable in admin. */
  aiKnowledge: string;
  /** Suggested starter questions shown as chips in the chat widget. */
  aiStarters: string[];
};

export type Subscriber = { id: string; email: string; active: boolean; createdAt: string; unsubscribedAt: string | null };

export type EnquiryType = "table" | "catering" | "event" | "cake" | "callback" | "other";
export type EnquiryStatus = "new" | "contacted" | "confirmed" | "closed";
export type Enquiry = {
  id: string;
  type: EnquiryType;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number | null;
  details: string;
  status: EnquiryStatus;
  source: string;
  conversationId: string | null;
  createdAt: string;
};

export type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source: string;
  model: string;
  toolCalls: string[];
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
};
export type ChatConversationSummary = {
  id: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  firstMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  products: Product[];
  categories: Category[];
  features: Feature[];
  admins: AdminUser[];
  orders: Order[];
  messages: Message[];
  settings: Settings;
};
