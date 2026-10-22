import type { Role } from "@/lib/db/types";

/** What each role may do in the admin panel. */
export const PERMISSIONS = {
  "products:write": ["owner", "admin", "editor"],
  "categories:write": ["owner", "admin", "editor"],
  "features:write": ["owner", "admin", "editor"],
  "orders:read": ["owner", "admin", "editor"],
  "orders:write": ["owner", "admin", "editor"],
  "messages:read": ["owner", "admin"],
  "enquiries:read": ["owner", "admin", "editor"],
  "enquiries:write": ["owner", "admin", "editor"],
  "chats:read": ["owner", "admin"],
  "chats:write": ["owner", "admin"],
  "subscribers:read": ["owner", "admin"],
  "settings:write": ["owner", "admin"],
  "team:read": ["owner", "admin"],
  "team:write": ["owner", "admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;
export const can = (role: Role, p: Permission) => (PERMISSIONS[p] as readonly Role[]).includes(role);

/** Owners manage everyone; admins can manage editors and other admins (never owners). */
export const canManageRole = (actor: Role, target: Role) => actor === "owner" || (actor === "admin" && target !== "owner");

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", editor: "Editor" };
export const ROLE_HELP: Record<Role, string> = {
  owner: "Full access, including team and settings",
  admin: "Everything except managing owners",
  editor: "Menu, features, orders and requests only",
};
