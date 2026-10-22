import "server-only";
import { randomBytes } from "crypto";
import { and, asc, count, desc, eq, gte, inArray, lt, sql, sum } from "drizzle-orm";
import { orm, schema as t } from "./client";
import type { DataStore } from "./repository";
import type {
  AdminUser,
  ArtKind,
  Category,
  ChatConversationSummary,
  ChatMessageRow,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  Feature,
  FeatureIcon,
  FlavourColor,
  Message,
  OptionGroup,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductTag,
  Settings,
  Subscriber,
} from "./types";
import { SEED_SETTINGS } from "./seed";
import { isId } from "./id";
import { normalizePkPhone } from "@/lib/phone";

// ───────────── helpers ─────────────
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";

const ORDER_CODE_OFFSET = 1000;
export const orderCode = (n: number) => `SS-${n + ORDER_CODE_OFFSET}`;
/** "SS-1001", "ss 1001" or "1001" → 1 */
export const parseOrderCode = (code: string) => {
  const m = /^\s*(?:SS)?[-\s#]*(\d{4,9})\s*$/i.exec(code ?? "");
  if (!m) return null;
  const n = Number(m[1]) - ORDER_CODE_OFFSET;
  return n > 0 && Number.isSafeInteger(n) ? n : null;
};

/** Strip undefined keys so a partial update never overwrites a column with NULL. */
function defined<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ───────────── mappers ─────────────
type Row<K extends keyof typeof t> = (typeof t)[K] extends { $inferSelect: infer R } ? R : never;

const toProduct = (p: Row<"products">): Product => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  categoryId: p.categoryId,
  price: p.price,
  image: p.image,
  art: p.art as ArtKind,
  tint: p.tint,
  tags: p.tags as ProductTag[],
  options: (p.options ?? []) as OptionGroup[],
  available: p.available,
  featured: p.featured,
  sortOrder: p.sortOrder,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

const toCategory = (c: Row<"categories">): Category => ({ ...c, color: c.color as FlavourColor, art: c.art as ArtKind });
const toFeature = (f: Row<"features">): Feature => ({ ...f, icon: f.icon as FeatureIcon });

const toAdmin = (a: Row<"adminUsers">): AdminUser => ({
  id: a.id,
  name: a.name,
  email: a.email,
  role: a.role,
  passwordHash: a.passwordHash,
  active: a.active,
  sessionVersion: a.sessionVersion,
  createdAt: a.createdAt.toISOString(),
  lastLoginAt: iso(a.lastLoginAt),
});

const toOrder = (o: Row<"orders">, items: Row<"orderItems">[]): Order => ({
  id: o.id,
  code: orderCode(o.number),
  type: o.type as Order["type"],
  customer: { name: o.customerName, phone: o.customerPhone, email: o.customerEmail, address: o.address, area: o.area, notes: o.notes },
  items: items.map((i) => ({ productId: i.productId ?? "", name: i.name, unitPrice: i.unitPrice, qty: i.qty, options: i.options })),
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
  total: o.total,
  payment: o.payment as PaymentMethod,
  status: o.status as OrderStatus,
  createdAt: o.createdAt.toISOString(),
  updatedAt: o.updatedAt.toISOString(),
  timeline: { confirmedAt: iso(o.confirmedAt), preparingAt: iso(o.preparingAt), dispatchedAt: iso(o.dispatchedAt), completedAt: iso(o.completedAt), cancelledAt: iso(o.cancelledAt) },
});

/** Attach items to orders with one extra query (no N+1). */
async function withItems(rows: Row<"orders">[]): Promise<Order[]> {
  if (!rows.length) return [];
  const items = await orm.select().from(t.orderItems).where(inArray(t.orderItems.orderId, rows.map((r) => r.id)));
  const by = new Map<string, Row<"orderItems">[]>();
  for (const i of items) by.set(i.orderId, [...(by.get(i.orderId) ?? []), i]);
  return rows.map((o) => toOrder(o, by.get(o.id) ?? []));
}

const toMessage = (m: Row<"messages">): Message => ({ ...m, createdAt: m.createdAt.toISOString() });
const toSubscriber = (s: Row<"subscribers">): Subscriber => ({ id: s.id, email: s.email, active: s.active, createdAt: s.createdAt.toISOString(), unsubscribedAt: iso(s.unsubscribedAt) });
const toEnquiry = (e: Row<"enquiries">): Enquiry => ({ ...e, type: e.type as EnquiryType, status: e.status as EnquiryStatus, createdAt: e.createdAt.toISOString() });
const toChatMessage = (m: Row<"chatMessages">): ChatMessageRow => ({
  id: m.id,
  role: m.role as ChatMessageRow["role"],
  content: m.content,
  source: m.source,
  model: m.model,
  toolCalls: m.toolCalls,
  inputTokens: m.inputTokens,
  outputTokens: m.outputTokens,
  createdAt: m.createdAt.toISOString(),
});
const toSummary = (c: Row<"chatConversations">, firstMessage: string): ChatConversationSummary => ({
  id: c.id,
  messageCount: c.messageCount,
  inputTokens: c.inputTokens,
  outputTokens: c.outputTokens,
  firstMessage,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

/** Unique category slug ("Ice Cream" → "ice-cream", then "ice-cream-2" …). */
async function uniqueCategorySlug(name: string, exceptId?: string) {
  const base = slugify(name);
  const taken = await orm.select({ id: t.categories.id, slug: t.categories.slug }).from(t.categories).where(sql`${t.categories.slug} like ${base + "%"}`);
  const used = new Set(taken.filter((r) => r.id !== exceptId).map((r) => r.slug));
  if (!used.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/** Stored settings merged over defaults, so fields added in later versions always have a value. */
const withDefaults = (data: unknown): Settings => ({ ...SEED_SETTINGS, ...((data ?? {}) as Partial<Settings>) });
const first = <T>(rows: T[]) => rows[0] ?? null;

// ───────────── store ─────────────
export const store: DataStore = {
  products: {
    async list() {
      return (await orm.select().from(t.products).orderBy(asc(t.products.sortOrder), asc(t.products.createdAt))).map(toProduct);
    },
    async get(id) {
      const p = first(await orm.select().from(t.products).where(eq(t.products.id, id)));
      return p ? toProduct(p) : null;
    },
    async create(input) {
      const [p] = await orm.insert(t.products).values({ ...input, slug: slugify(input.name) }).returning();
      return toProduct(p);
    },
    async update(id, patch) {
      const p = first(
        await orm
          .update(t.products)
          .set(defined({ ...patch, ...(patch.name ? { slug: slugify(patch.name) } : {}) }))
          .where(eq(t.products.id, id))
          .returning(),
      );
      return p ? toProduct(p) : null;
    },
    async remove(id) {
      return (await orm.delete(t.products).where(eq(t.products.id, id)).returning({ id: t.products.id })).length > 0;
    },
    async countByCategory(categoryId) {
      return orm.$count(t.products, eq(t.products.categoryId, categoryId));
    },
  },

  categories: {
    async list() {
      return (await orm.select().from(t.categories).orderBy(asc(t.categories.sortOrder), asc(t.categories.name))).map(toCategory);
    },
    async get(id) {
      const c = first(await orm.select().from(t.categories).where(eq(t.categories.id, id)));
      return c ? toCategory(c) : null;
    },
    async getBySlug(slug) {
      const c = first(await orm.select().from(t.categories).where(eq(t.categories.slug, slug)));
      return c ? toCategory(c) : null;
    },
    async create(input) {
      const [c] = await orm.insert(t.categories).values({ ...input, slug: await uniqueCategorySlug(input.name) }).returning();
      return toCategory(c);
    },
    async update(id, patch) {
      const slug = patch.name ? await uniqueCategorySlug(patch.name, id) : undefined;
      const c = first(await orm.update(t.categories).set(defined({ ...patch, slug })).where(eq(t.categories.id, id)).returning());
      return c ? toCategory(c) : null;
    },
    async remove(id) {
      return (await orm.delete(t.categories).where(eq(t.categories.id, id)).returning({ id: t.categories.id })).length > 0;
    },
  },

  features: {
    async list() {
      return (await orm.select().from(t.features).orderBy(asc(t.features.sortOrder))).map(toFeature);
    },
    async get(id) {
      const f = first(await orm.select().from(t.features).where(eq(t.features.id, id)));
      return f ? toFeature(f) : null;
    },
    async create(input) {
      const [f] = await orm.insert(t.features).values(input).returning();
      return toFeature(f);
    },
    async update(id, patch) {
      const f = first(await orm.update(t.features).set(defined(patch)).where(eq(t.features.id, id)).returning());
      return f ? toFeature(f) : null;
    },
    async remove(id) {
      return (await orm.delete(t.features).where(eq(t.features.id, id)).returning({ id: t.features.id })).length > 0;
    },
  },

  admins: {
    async list() {
      return (await orm.select().from(t.adminUsers).orderBy(asc(t.adminUsers.createdAt))).map(toAdmin);
    },
    async get(id) {
      const a = first(await orm.select().from(t.adminUsers).where(eq(t.adminUsers.id, id)));
      return a ? toAdmin(a) : null;
    },
    async getByEmail(email) {
      const a = first(await orm.select().from(t.adminUsers).where(eq(t.adminUsers.email, email.trim().toLowerCase())));
      return a ? toAdmin(a) : null;
    },
    async create(input) {
      const [a] = await orm.insert(t.adminUsers).values({ ...input, email: input.email.toLowerCase() }).returning();
      return toAdmin(a);
    },
    async update(id, patch) {
      const { lastLoginAt, ...rest } = patch;
      // a new password, a role change or deactivation invalidates every existing login cookie for this member
      const revoke = rest.passwordHash !== undefined || rest.active === false || rest.role !== undefined;
      const a = first(
        await orm
          .update(t.adminUsers)
          .set({
            ...defined(rest),
            ...(lastLoginAt !== undefined ? { lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : null } : {}),
            ...(revoke ? { sessionVersion: sql`${t.adminUsers.sessionVersion} + 1` } : {}),
          })
          .where(eq(t.adminUsers.id, id))
          .returning(),
      );
      return a ? toAdmin(a) : null;
    },
    async remove(id) {
      return (await orm.delete(t.adminUsers).where(eq(t.adminUsers.id, id)).returning({ id: t.adminUsers.id })).length > 0;
    },
    async countActiveOwners() {
      return orm.$count(t.adminUsers, and(eq(t.adminUsers.role, "owner"), eq(t.adminUsers.active, true)));
    },
  },

  orders: {
    async list(opts = {}) {
      const q = orm.select().from(t.orders).orderBy(desc(t.orders.createdAt));
      return withItems(await (opts.limit ? q.limit(opts.limit) : q));
    },
    async get(id) {
      return first(await withItems(await orm.select().from(t.orders).where(eq(t.orders.id, id))));
    },
    async track(code, phone) {
      const number = parseOrderCode(code);
      const normalized = normalizePkPhone(phone);
      if (!number || !normalized) return null;
      // both must match — knowing an order code alone reveals nothing
      return first(await withItems(await orm.select().from(t.orders).where(and(eq(t.orders.number, number), eq(t.orders.customerPhone, normalized)))));
    },
    async create(input) {
      return orm.transaction(async (tx) => {
        const [o] = await tx
          .insert(t.orders)
          .values({
            type: input.type,
            customerName: input.customer.name,
            customerPhone: normalizePkPhone(input.customer.phone) || input.customer.phone,
            customerEmail: input.customer.email ?? "",
            address: input.customer.address,
            area: input.customer.area,
            notes: input.customer.notes,
            subtotal: input.subtotal,
            deliveryFee: input.deliveryFee,
            total: input.total,
            payment: input.payment,
          })
          .returning();
        const items = await tx
          .insert(t.orderItems)
          .values(input.items.map((i) => ({ orderId: o.id, productId: i.productId || null, name: i.name, unitPrice: i.unitPrice, qty: i.qty, options: i.options })))
          .returning();
        return toOrder(o, items);
      });
    },
    async setStatus(id, status) {
      const now = new Date();
      const stamp =
        status === "confirmed" ? { confirmedAt: now } : status === "preparing" ? { preparingAt: now } : status === "on-the-way" ? { dispatchedAt: now } : status === "completed" ? { completedAt: now } : status === "cancelled" ? { cancelledAt: now } : {};
      const o = first(await orm.update(t.orders).set({ status, ...stamp }).where(eq(t.orders.id, id)).returning());
      return o ? first(await withItems([o])) : null;
    },
  },

  messages: {
    async list() {
      return (await orm.select().from(t.messages).orderBy(desc(t.messages.createdAt))).map(toMessage);
    },
    async create(input) {
      const [m] = await orm.insert(t.messages).values(input).returning();
      return toMessage(m);
    },
    async setRead(id, read) {
      const m = first(await orm.update(t.messages).set({ read }).where(eq(t.messages.id, id)).returning());
      return m ? toMessage(m) : null;
    },
    async remove(id) {
      return (await orm.delete(t.messages).where(eq(t.messages.id, id)).returning({ id: t.messages.id })).length > 0;
    },
  },

  subscribers: {
    async list() {
      return (await orm.select().from(t.subscribers).orderBy(desc(t.subscribers.createdAt))).map(toSubscriber);
    },
    async subscribe(email) {
      const e = email.trim().toLowerCase();
      const hit = first(await orm.select().from(t.subscribers).where(eq(t.subscribers.email, e)));
      if (hit?.active) return "exists";
      if (hit) {
        await orm.update(t.subscribers).set({ active: true, unsubscribedAt: null }).where(eq(t.subscribers.id, hit.id));
        return "reactivated";
      }
      const inserted = await orm
        .insert(t.subscribers)
        .values({ email: e, unsubscribeToken: randomBytes(24).toString("hex") })
        .onConflictDoNothing() // double-click race
        .returning({ id: t.subscribers.id });
      return inserted.length ? "created" : "exists";
    },
    async unsubscribe(token) {
      if (!/^[a-f0-9]{48}$/.test(token)) return false;
      const r = await orm
        .update(t.subscribers)
        .set({ active: false, unsubscribedAt: new Date() })
        .where(and(eq(t.subscribers.unsubscribeToken, token), eq(t.subscribers.active, true)))
        .returning({ id: t.subscribers.id });
      return r.length > 0;
    },
    async tokenFor(email) {
      return first(await orm.select({ token: t.subscribers.unsubscribeToken }).from(t.subscribers).where(eq(t.subscribers.email, email.trim().toLowerCase())))?.token ?? null;
    },
    async remove(id) {
      return (await orm.delete(t.subscribers).where(eq(t.subscribers.id, id)).returning({ id: t.subscribers.id })).length > 0;
    },
  },

  enquiries: {
    async list() {
      return (await orm.select().from(t.enquiries).orderBy(desc(t.enquiries.createdAt))).map(toEnquiry);
    },
    async create(input) {
      const [e] = await orm.insert(t.enquiries).values(input).returning();
      return toEnquiry(e);
    },
    async setStatus(id, status) {
      const e = first(await orm.update(t.enquiries).set({ status }).where(eq(t.enquiries.id, id)).returning());
      return e ? toEnquiry(e) : null;
    },
    async remove(id) {
      return (await orm.delete(t.enquiries).where(eq(t.enquiries.id, id)).returning({ id: t.enquiries.id })).length > 0;
    },
  },

  chat: {
    async createConversation(meta) {
      const [c] = await orm.insert(t.chatConversations).values({ ipHash: meta.ipHash, userAgent: meta.userAgent.slice(0, 200) }).returning({ id: t.chatConversations.id });
      return c.id;
    },
    async exists(id) {
      if (!isId(id)) return false;
      return (await orm.$count(t.chatConversations, eq(t.chatConversations.id, id))) > 0;
    },
    async history(conversationId, limit) {
      const rows = await orm.select().from(t.chatMessages).where(eq(t.chatMessages.conversationId, conversationId)).orderBy(desc(t.chatMessages.createdAt), desc(t.chatMessages.id)).limit(limit);
      return rows.reverse().map(toChatMessage);
    },
    async addMessage(conversationId, msg) {
      await orm.transaction(async (tx) => {
        await tx.insert(t.chatMessages).values({ conversationId, ...msg });
        await tx
          .update(t.chatConversations)
          .set({
            messageCount: sql`${t.chatConversations.messageCount} + 1`,
            inputTokens: sql`${t.chatConversations.inputTokens} + ${msg.inputTokens}`,
            outputTokens: sql`${t.chatConversations.outputTokens} + ${msg.outputTokens}`,
          })
          .where(eq(t.chatConversations.id, conversationId));
      });
    },
    async listConversations({ page, pageSize }) {
      const [total, rows] = await Promise.all([
        orm.$count(t.chatConversations),
        orm
          .select()
          .from(t.chatConversations)
          .orderBy(desc(t.chatConversations.updatedAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
      ]);
      const firsts = rows.length
        ? await orm
            .selectDistinctOn([t.chatMessages.conversationId], { conversationId: t.chatMessages.conversationId, content: t.chatMessages.content })
            .from(t.chatMessages)
            .where(and(inArray(t.chatMessages.conversationId, rows.map((r) => r.id)), eq(t.chatMessages.role, "user")))
            .orderBy(t.chatMessages.conversationId, asc(t.chatMessages.createdAt))
        : [];
      const fm = new Map(firsts.map((f) => [f.conversationId, f.content]));
      return { total, rows: rows.map((c) => toSummary(c, fm.get(c.id) ?? "")) };
    },
    async getConversation(id) {
      if (!isId(id)) return null;
      const c = first(await orm.select().from(t.chatConversations).where(eq(t.chatConversations.id, id)));
      if (!c) return null;
      const msgs = (await orm.select().from(t.chatMessages).where(eq(t.chatMessages.conversationId, id)).orderBy(asc(t.chatMessages.createdAt), asc(t.chatMessages.id))).map(toChatMessage);
      return { summary: toSummary(c, msgs.find((m) => m.role === "user")?.content ?? ""), messages: msgs };
    },
    async removeConversation(id) {
      return (await orm.delete(t.chatConversations).where(eq(t.chatConversations.id, id)).returning({ id: t.chatConversations.id })).length > 0;
    },
    async usage(since) {
      const [conversations, [agg]] = await Promise.all([
        orm.$count(t.chatConversations, gte(t.chatConversations.createdAt, since)),
        orm
          .select({ messages: count(), inputTokens: sum(t.chatMessages.inputTokens), outputTokens: sum(t.chatMessages.outputTokens) })
          .from(t.chatMessages)
          .where(gte(t.chatMessages.createdAt, since)),
      ]);
      return { conversations, messages: Number(agg?.messages ?? 0), inputTokens: Number(agg?.inputTokens ?? 0), outputTokens: Number(agg?.outputTokens ?? 0) };
    },
    async userMessagesSince(since) {
      return orm.$count(t.chatMessages, and(eq(t.chatMessages.role, "user"), gte(t.chatMessages.createdAt, since)));
    },
  },

  settings: {
    async get() {
      const row = first(await orm.select().from(t.settings).where(eq(t.settings.id, 1)));
      if (row) return withDefaults(row.data);
      await orm.insert(t.settings).values({ id: 1, data: SEED_SETTINGS }).onConflictDoNothing();
      return withDefaults(first(await orm.select().from(t.settings).where(eq(t.settings.id, 1)))?.data);
    },
    async update(input) {
      const [row] = await orm
        .insert(t.settings)
        .values({ id: 1, data: input })
        .onConflictDoUpdate({ target: t.settings.id, set: { data: input, updatedAt: new Date() } })
        .returning();
      return withDefaults(row.data);
    },
  },

  maintenance: {
    async cleanup(chatCutoff) {
      const [conversations, rateLimits] = await Promise.all([
        orm.delete(t.chatConversations).where(lt(t.chatConversations.updatedAt, chatCutoff)).returning({ id: t.chatConversations.id }),
        orm.delete(t.rateLimits).where(lt(t.rateLimits.expiresAt, new Date())).returning({ key: t.rateLimits.key }),
      ]);
      return { conversations: conversations.length, rateLimits: rateLimits.length };
    },
  },
};
