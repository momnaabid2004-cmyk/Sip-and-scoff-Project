"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import type { PublicAdmin } from "@/lib/db/types";
import { can, ROLE_LABEL, type Permission } from "@/lib/auth/permissions";
import { LogoMark } from "@/components/art/Logo";
import { BoxIcon, ChatIcon, CloseIcon, DashboardIcon, ExternalIcon, LogoutIcon, MenuIcon, SettingsIcon, StarIcon, TagIcon, UsersIcon, BagIcon, PhoneIcon, MailIcon, HeartIcon } from "@/components/ui/Icons";
import { AdminContext } from "./AdminContext";

const NAV: { href: string; label: string; Icon: typeof BoxIcon; perm?: Permission }[] = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", Icon: BagIcon, perm: "orders:read" },
  { href: "/admin/products", label: "Products", Icon: BoxIcon, perm: "products:write" },
  { href: "/admin/categories", label: "Categories", Icon: TagIcon, perm: "categories:write" },
  { href: "/admin/features", label: "Features", Icon: StarIcon, perm: "features:write" },
  { href: "/admin/enquiries", label: "Requests", Icon: PhoneIcon, perm: "enquiries:read" },
  { href: "/admin/messages", label: "Messages", Icon: MailIcon, perm: "messages:read" },
  { href: "/admin/conversations", label: "AI chats", Icon: ChatIcon, perm: "chats:read" },
  { href: "/admin/subscribers", label: "Subscribers", Icon: HeartIcon, perm: "subscribers:read" },
  { href: "/admin/team", label: "Team", Icon: UsersIcon, perm: "team:read" },
  { href: "/admin/settings", label: "Settings & AI", Icon: SettingsIcon, perm: "settings:write" },
];

export function AdminShell({ admin, children }: { admin: PublicAdmin; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const items = NAV.filter((n) => !n.perm || can(admin.role, n.perm));
  const isActive = (h: string) => (h === "/admin" ? pathname === "/admin" : pathname.startsWith(h));

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin">
      <Link href="/admin" className="mb-6 flex items-center gap-2 px-2">
        <LogoMark className="h-9 w-9" />
        <span className="font-display text-lg font-extrabold text-vanilla">Admin</span>
      </Link>
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={clsx("focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors", isActive(href) ? "bg-vanilla text-cocoa" : "text-vanilla/75 hover:bg-white/10 hover:text-vanilla")}>
          <Icon width={18} /> {label}
        </Link>
      ))}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-vanilla/75 hover:bg-white/10"><ExternalIcon width={18} /> View website</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-vanilla/75 hover:bg-white/10"><LogoutIcon width={18} /> Log out</button>
      </div>
    </nav>
  );

  return (
    <AdminContext.Provider value={admin}>
      <div className="lg:grid lg:grid-cols-[250px_1fr]">
        <aside className="sticky top-0 hidden h-[100svh] bg-cocoa lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-cocoa/50" onClick={() => setOpen(false)} />
            <aside className="absolute bottom-0 left-0 top-0 w-72 bg-cocoa">{sidebar}</aside>
          </div>
        )}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cocoa/10 bg-[#FBF6EF]/90 px-4 backdrop-blur sm:px-8">
            <button onClick={() => setOpen(true)} className="focus-ring grid h-10 w-10 place-items-center rounded-full lg:hidden" aria-label="Open navigation">{open ? <CloseIcon /> : <MenuIcon />}</button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-extrabold leading-tight">{admin.name}</p>
                <p className="text-xs text-cocoa-muted">{ROLE_LABEL[admin.role]} · {admin.email}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-cocoa bg-mango font-extrabold">{admin.name.slice(0, 1).toUpperCase()}</span>
            </div>
          </header>
          <main className="p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
