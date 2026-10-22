import Link from "next/link";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { formatPKR } from "@/lib/pricing";
import { STATUS, timeAgo } from "@/lib/admin-format";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { badge } from "@/components/admin/badge";

export default async function Dashboard() {
  const admin = (await currentAdmin())!;
  const [products, orders, messages, admins, categories, enquiries] = await Promise.all([db.products.list(), db.orders.list({ limit: 500 }), db.messages.list(), db.admins.list(), db.categories.list(), db.enquiries.list()]);
  const pkDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const today = pkDay(new Date());
  const todays = orders.filter((o) => pkDay(o.createdAt) === today && o.status !== "cancelled");
  const revenue = todays.reduce((a, o) => a + o.total, 0);
  const open = orders.filter((o) => ["new", "confirmed", "preparing", "on-the-way"].includes(o.status)).length;
  const unread = messages.filter((m) => !m.read).length;

  const sold = new Map<string, number>();
  orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((i) => sold.set(i.name, (sold.get(i.name) ?? 0) + i.qty)));
  const top = [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = [
    { label: "Revenue today", value: formatPKR(revenue), bg: "bg-pista-light" },
    { label: "Orders today", value: todays.length, bg: "bg-mango-light" },
    { label: "Open orders", value: open, bg: "bg-berry-light" },
    { label: "Unread messages", value: unread, bg: "bg-lagoon-light" },
    { label: "New requests", value: enquiries.filter((e) => e.status === "new").length, bg: "bg-berry-light" },
    { label: "Products live", value: `${products.filter((p) => p.available).length}/${products.length}`, bg: "bg-ube-light" },
    { label: "Team members", value: admins.filter((a) => a.active).length, bg: "bg-chai-light" },
  ];

  return (
    <>
      <PageHeader title={`Salam, ${admin.name.split(" ")[0]} 👋`} sub="Here's what's happening at the café today." action={<div className="flex gap-2"><Link href="/admin/products?new=1" className="btn-primary !py-2.5">+ Add product</Link></div>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-3xl border border-cocoa/10 p-4 ${s.bg}`}>
            <p className="text-xs font-bold text-cocoa-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between border-b border-cocoa/10 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold">Recent orders</h2>
            {can(admin.role, "orders:read") && <Link href="/admin/orders" className="text-sm font-bold text-berry-600">View all</Link>}
          </div>
          {orders.length === 0 ? (
            <Empty>No orders yet. Place a test order from the website checkout to see it here.</Empty>
          ) : (
            <ul className="divide-y divide-cocoa/10">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="font-extrabold">{o.code}</span>
                  <span className="text-cocoa-muted">{o.customer.name} · {o.items.reduce((a, i) => a + i.qty, 0)} items</span>
                  <span className={badge(STATUS[o.status].tone)}>{STATUS[o.status].label}</span>
                  <span className="ml-auto font-bold">{formatPKR(o.total)}</span>
                  <span className="w-20 text-right text-xs text-cocoa-muted">{timeAgo(o.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="font-display text-lg font-extrabold">Top sellers</h2>
            {top.length ? (
              <ol className="mt-3 space-y-2 text-sm">
                {top.map(([name, n], i) => (
                  <li key={name} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-mango-light text-xs font-extrabold">{i + 1}</span>{name}<span className="ml-auto font-bold">{n}</span></li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-cocoa-muted">Appears once orders come in.</p>}
          </Panel>
          <Panel className="p-5">
            <h2 className="font-display text-lg font-extrabold">Menu at a glance</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="font-bold">{products.filter((p) => p.categoryId === c.id).length}</span></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
