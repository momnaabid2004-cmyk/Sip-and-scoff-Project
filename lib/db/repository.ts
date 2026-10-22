import type {
  AdminUser,
  Category,
  ChatConversationSummary,
  ChatMessageRow,
  Enquiry,
  EnquiryStatus,
  Feature,
  Message,
  Order,
  OrderStatus,
  Product,
  Settings,
  Subscriber,
} from "./types";

/**
 * Storage contract. Pages and API routes only talk to this interface (via `db` in lib/db/index.ts).
 * The implementation is lib/db/prisma-store.ts (PostgreSQL on Supabase).
 */
export interface Collection<T extends { id: string }, CreateInput, UpdateInput = Partial<CreateInput>> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(input: CreateInput): Promise<T>;
  update(id: string, patch: UpdateInput): Promise<T | null>;
  remove(id: string): Promise<boolean>;
}

export type ProductCreate = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt">;
export type CategoryCreate = Omit<Category, "id" | "slug">;
export type FeatureCreate = Omit<Feature, "id">;
export type AdminCreate = Pick<AdminUser, "name" | "email" | "role" | "passwordHash" | "active">;
export type AdminUpdate = Partial<Pick<AdminUser, "name" | "role" | "active" | "passwordHash" | "lastLoginAt">>;
export type OrderCreate = Omit<Order, "id" | "code" | "status" | "createdAt" | "updatedAt" | "timeline">;
export type MessageCreate = Omit<Message, "id" | "read" | "createdAt">;
export type EnquiryCreate = Omit<Enquiry, "id" | "status" | "createdAt">;
export type ChatMessageCreate = Omit<ChatMessageRow, "id" | "createdAt">;

export type Page<T> = { rows: T[]; total: number };

export interface DataStore {
  products: Collection<Product, ProductCreate> & { countByCategory(categoryId: string): Promise<number> };
  categories: Collection<Category, CategoryCreate> & { getBySlug(slug: string): Promise<Category | null> };
  features: Collection<Feature, FeatureCreate>;
  admins: Collection<AdminUser, AdminCreate, AdminUpdate> & {
    getByEmail(email: string): Promise<AdminUser | null>;
    countActiveOwners(): Promise<number>;
  };
  orders: {
    list(opts?: { limit?: number }): Promise<Order[]>;
    get(id: string): Promise<Order | null>;
    /** Public tracking: matches the code AND the phone number used at checkout. */
    track(code: string, phone: string): Promise<Order | null>;
    create(input: OrderCreate): Promise<Order>;
    setStatus(id: string, status: OrderStatus): Promise<Order | null>;
  };
  messages: {
    list(): Promise<Message[]>;
    create(input: MessageCreate): Promise<Message>;
    setRead(id: string, read: boolean): Promise<Message | null>;
    remove(id: string): Promise<boolean>;
  };
  subscribers: {
    list(): Promise<Subscriber[]>;
    /** Returns "created", "exists" (already active) or "reactivated". */
    subscribe(email: string): Promise<"created" | "exists" | "reactivated">;
    unsubscribe(token: string): Promise<boolean>;
    tokenFor(email: string): Promise<string | null>;
    remove(id: string): Promise<boolean>;
  };
  enquiries: {
    list(): Promise<Enquiry[]>;
    create(input: EnquiryCreate): Promise<Enquiry>;
    setStatus(id: string, status: EnquiryStatus): Promise<Enquiry | null>;
    remove(id: string): Promise<boolean>;
  };
  chat: {
    createConversation(meta: { ipHash: string; userAgent: string }): Promise<string>;
    exists(id: string): Promise<boolean>;
    history(conversationId: string, limit: number): Promise<ChatMessageRow[]>;
    addMessage(conversationId: string, msg: ChatMessageCreate): Promise<void>;
    listConversations(opts: { page: number; pageSize: number }): Promise<Page<ChatConversationSummary>>;
    getConversation(id: string): Promise<{ summary: ChatConversationSummary; messages: ChatMessageRow[] } | null>;
    removeConversation(id: string): Promise<boolean>;
    usage(since: Date): Promise<{ conversations: number; messages: number; inputTokens: number; outputTokens: number }>;
    /** Messages sent by users since `since` (all visitors) — for the global daily cap. */
    userMessagesSince(since: Date): Promise<number>;
  };
  settings: {
    get(): Promise<Settings>;
    update(input: Settings): Promise<Settings>;
  };
  maintenance: {
    /** Deletes chats older than `chatCutoff` and expired rate-limit rows. */
    cleanup(chatCutoff: Date): Promise<{ conversations: number; rateLimits: number }>;
  };
}
