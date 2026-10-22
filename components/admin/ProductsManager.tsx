"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import type { ArtKind, Category, OptionGroup, Product, ProductTag } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { formatPKR } from "@/lib/pricing";
import { FLAVOUR, TAG_LABEL } from "@/lib/theme";
import { ProductImage } from "@/components/art/ProductImage";
import { Field, errProps } from "@/components/ui/Field";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, UploadIcon, StarIcon } from "@/components/ui/Icons";
import { Drawer, Empty, PageHeader, Panel, Toggle } from "./ui";

const ARTS: ArtKind[] = ["cup", "iced", "chai-glass", "matka", "cone", "sundae", "kulfi", "shake", "mojito", "can", "sandwich", "fries", "wrap", "burger", "samosa", "nuggets", "cake", "brownie", "waffle", "bowl"];
const TAGS: ProductTag[] = ["bestseller", "new", "veg", "spicy", "seasonal", "low-caffeine"];

const uid = () => Math.random().toString(36).slice(2, 8);
const preset = (name: string, multi: boolean, required: boolean, choices: [string, number][]): OptionGroup => {
  const id = `${name.toLowerCase().replace(/\W+/g, "-")}-${uid()}`;
  return { id, name, multi, required, choices: choices.map(([label, priceDelta], i) => ({ id: `${id}-${i}`, label, priceDelta })) };
};
const PRESETS: Record<string, () => OptionGroup> = {
  Size: () => preset("Size", false, true, [["Regular", 0], ["Large", 150]]),
  Milk: () => preset("Milk", false, true, [["Full cream", 0], ["Oat milk", 180], ["Almond milk", 180]]),
  Sugar: () => preset("Sugar", false, true, [["Normal", 0], ["Less sugar", 0], ["No sugar", 0]]),
  Scoops: () => preset("Scoops", false, true, [["Single", 0], ["Double", 250], ["Triple", 450]]),
  Toppings: () => preset("Toppings", true, false, [["Sprinkles", 50], ["Chocolate sauce", 80], ["Nuts", 120]]),
  Spice: () => preset("Spice level", false, true, [["Mild", 0], ["Medium", 0], ["Spicy", 0]]),
};

type Form = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt">;
const blank = (categoryId: string): Form => ({ name: "", description: "", categoryId, price: 0, image: null, art: "cup", tint: "#C7843F", tags: [], options: [], available: true, featured: false, sortOrder: 0 });

export function ProductsManager({ initial, categories }: { initial: Product[]; categories: Category[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const api = useApi();
  const rowApi = useApi();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("new")) openNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => rows.filter((p) => (cat === "all" || p.categoryId === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [rows, q, cat]);
  const catName = (id: string) => categories.find((c) => c.id === id);

  function openNew() {
    setEditing(null);
    setForm(blank(cat !== "all" ? cat : categories[0]?.id ?? ""));
    api.setError(null);
    api.setFields({});
  }
  function openEdit(p: Product) {
    setEditing(p);
    const { id: _i, slug: _s, createdAt: _c, updatedAt: _u, ...rest } = p;
    setForm(structuredClone(rest));
    api.setError(null);
    api.setFields({});
  }
  async function save() {
    if (!form) return;
    const res = editing ? await api.call<Product>(`/api/admin/products/${editing.id}`, { method: "PUT", body: form }) : await api.call<Product>("/api/admin/products", { body: form });
    if (res) {
      setRows((r) => (editing ? r.map((x) => (x.id === res.id ? res : x)) : [...r, res]));
      setForm(null);
    }
  }
  async function quickPatch(p: Product, patch: Partial<Form>) {
    const { id: _i, slug: _s, createdAt: _c, updatedAt: _u, ...rest } = p;
    const res = await rowApi.call<Product>(`/api/admin/products/${p.id}`, { method: "PUT", body: { ...rest, ...patch } });
    if (res) setRows((r) => r.map((x) => (x.id === res.id ? res : x)));
  }
  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    const ok = await rowApi.call(`/api/admin/products/${p.id}`, { method: "DELETE" });
    if (ok) setRows((r) => r.filter((x) => x.id !== p.id));
  }

  return (
    <>
      <PageHeader title="Products" sub={`${rows.length} items · changes go live on the website instantly`} action={<button onClick={openNew} className="btn-primary !py-2.5"><PlusIcon width={16} /> Add product</button>} />
      {rowApi.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{rowApi.error}</p>}
      <Panel>
        <div className="flex flex-col gap-3 border-b border-cocoa/10 p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <SearchIcon width={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input !pl-10" />
          </label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input sm:!w-56" aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {list.length === 0 ? (
          <Empty>No products match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-cocoa-muted">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Options</th>
                  <th className="px-4 py-3">Live</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa/10">
                {list.map((p) => {
                  const c = catName(p.categoryId);
                  return (
                    <tr key={p.id} className={clsx(!p.available && "opacity-60")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage product={p} bg={c ? FLAVOUR[c.color].lightHex : undefined} className="h-12 w-12 shrink-0 rounded-xl" sizes="48px" />
                          <div className="min-w-0">
                            <p className="font-extrabold">{p.name}</p>
                            <p className="max-w-[16rem] truncate text-xs text-cocoa-muted">{p.tags.map((t) => TAG_LABEL[t]).join(" ") || p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{c?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-bold tabular-nums">{formatPKR(p.price)}</td>
                      <td className="px-4 py-3 text-xs text-cocoa-muted">{p.options.map((o) => o.name).join(", ") || "—"}</td>
                      <td className="px-4 py-3"><Toggle checked={p.available} onChange={(v) => quickPatch(p, { available: v })} label={`${p.name} available`} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => quickPatch(p, { featured: !p.featured })} className={clsx("grid h-8 w-8 place-items-center rounded-full", p.featured ? "bg-mango text-cocoa" : "text-cocoa/30 hover:bg-cocoa/5")} aria-pressed={p.featured} aria-label={`Feature ${p.name} on home page`}>
                          <StarIcon width={16} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(p)} className="btn-ghost !px-3" aria-label={`Edit ${p.name}`}><EditIcon width={16} /></button>
                        <button onClick={() => remove(p)} className="btn-ghost !px-3 text-berry-600" aria-label={`Delete ${p.name}`}><TrashIcon width={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Drawer
        open={!!form}
        onClose={() => setForm(null)}
        title={editing ? `Edit ${editing.name}` : "New product"}
        footer={
          <div className="flex items-center justify-between gap-3">
            {api.error ? <p role="alert" className="text-sm font-bold text-berry-600">{api.error}</p> : <span />}
            <div className="flex gap-2">
              <button onClick={() => setForm(null)} className="btn-ghost">Cancel</button>
              <button onClick={save} disabled={api.busy} className="btn-primary !py-2.5">{api.busy ? "Saving…" : editing ? "Save changes" : "Create product"}</button>
            </div>
          </div>
        }
      >
        {form && <ProductForm form={form} setForm={setForm} categories={categories} errors={api.fields} />}
      </Drawer>
    </>
  );
}

function ProductForm({ form, setForm, categories, errors }: { form: Form; setForm: (f: Form) => void; categories: Category[]; errors: Record<string, string> }) {
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const upload = useApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await upload.call<{ url: string }>("/api/admin/upload", { body: fd });
    if (res) set("image", res.url);
  };
  const updateGroup = (i: number, g: OptionGroup) => set("options", form.options.map((x, j) => (j === i ? g : x)));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <ProductImage product={{ ...form, name: form.name || "Preview" }} bg="#FFF4E6" className="h-28 w-28 shrink-0 rounded-2xl border border-cocoa/10" sizes="112px" />
        <div className="flex-1 space-y-2">
          <p className="label">Photo</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={upload.busy} className="btn-light !py-2 !text-xs"><UploadIcon width={14} /> {upload.busy ? "Uploading…" : "Upload image"}</button>
            {form.image && <button type="button" onClick={() => set("image", null)} className="btn-ghost !text-xs text-berry-600">Remove photo</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <input value={form.image ?? ""} onChange={(e) => set("image", e.target.value || null)} placeholder="…or paste an image URL" className="input !py-2 text-xs" aria-label="Image URL" />
          {upload.error && <p className="text-xs font-bold text-berry-600">{upload.error}</p>}
          <p className="text-xs text-cocoa-muted">No photo? The illustration below is shown instead.</p>
        </div>
      </div>

      <Field id="pf-name" label="Name *" error={errors.name}><input {...errProps("pf-name", errors.name)} className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pf-cat" label="Category *" error={errors.categoryId}>
          <select {...errProps("pf-cat", errors.categoryId)} className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field id="pf-price" label="Price (Rs) *" error={errors.price}><input {...errProps("pf-price", errors.price)} type="number" min={1} inputMode="numeric" className="input" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} /></Field>
      </div>
      <Field id="pf-desc" label="Description" error={errors.description}><textarea {...errProps("pf-desc", errors.description)} rows={2} className="input resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field id="pf-art" label="Placeholder illustration">
          <select id="pf-art" className="input" value={form.art} onChange={(e) => set("art", e.target.value as ArtKind)}>
            {ARTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field id="pf-tint" label="Colour" error={errors.tint}><input {...errProps("pf-tint", errors.tint)} type="color" className="h-[50px] w-20 cursor-pointer rounded-2xl border-2 border-cocoa/15 bg-white p-1" value={form.tint} onChange={(e) => set("tint", e.target.value)} /></Field>
      </div>

      <fieldset>
        <legend className="label">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const on = form.tags.includes(t);
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => set("tags", on ? form.tags.filter((x) => x !== t) : [...form.tags, t])} className={clsx("rounded-full border-2 px-3 py-1.5 text-xs font-bold", on ? "border-cocoa bg-cocoa text-vanilla" : "border-cocoa/15 bg-white")}>
                {TAG_LABEL[t]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm font-bold"><Toggle checked={form.available} onChange={(v) => set("available", v)} label="Available" /> Available on menu</label>
        <label className="flex items-center gap-3 text-sm font-bold"><Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Featured" /> Feature on home page</label>
      </div>
      <Field id="pf-sort" label="Sort order" hint="Lower numbers show first"><input id="pf-sort" type="number" className="input !w-32" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></Field>

      {/* options editor */}
      <fieldset className="rounded-3xl border border-cocoa/10 bg-white p-4">
        <legend className="px-2 text-sm font-extrabold">Customisation options</legend>
        <p className="text-xs text-cocoa-muted">Size, milk, sugar, scoops, toppings, spice… Customers choose these before adding to cart.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([k, fn]) => (
            <button key={k} type="button" onClick={() => set("options", [...form.options, fn()])} className="rounded-full border-2 border-dashed border-cocoa/25 px-3 py-1.5 text-xs font-bold hover:border-cocoa">+ {k}</button>
          ))}
          <button type="button" onClick={() => set("options", [...form.options, preset("New option", false, true, [["Choice 1", 0]])])} className="rounded-full border-2 border-dashed border-cocoa/25 px-3 py-1.5 text-xs font-bold hover:border-cocoa">+ Custom</button>
        </div>
        <div className="mt-4 space-y-4">
          {form.options.map((g, i) => (
            <div key={g.id} className="rounded-2xl border border-cocoa/10 bg-vanilla-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input value={g.name} onChange={(e) => updateGroup(i, { ...g, name: e.target.value })} className="input !w-auto flex-1 !py-2 font-bold" aria-label="Option name" />
                <label className="flex items-center gap-1.5 text-xs font-bold"><input type="checkbox" checked={g.multi} onChange={(e) => updateGroup(i, { ...g, multi: e.target.checked })} /> Multiple</label>
                <label className="flex items-center gap-1.5 text-xs font-bold"><input type="checkbox" checked={g.required} onChange={(e) => updateGroup(i, { ...g, required: e.target.checked })} /> Required</label>
                <button type="button" onClick={() => set("options", form.options.filter((_, j) => j !== i))} className="btn-ghost !px-2 text-berry-600" aria-label="Remove option group"><TrashIcon width={14} /></button>
              </div>
              <div className="mt-2 space-y-2">
                {g.choices.map((c, ci) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input value={c.label} onChange={(e) => updateGroup(i, { ...g, choices: g.choices.map((x, k) => (k === ci ? { ...x, label: e.target.value } : x)) })} className="input flex-1 !py-2" aria-label="Choice label" />
                    <span className="text-xs font-bold text-cocoa-muted">+Rs</span>
                    <input type="number" min={0} value={c.priceDelta} onChange={(e) => updateGroup(i, { ...g, choices: g.choices.map((x, k) => (k === ci ? { ...x, priceDelta: Number(e.target.value) } : x)) })} className="input !w-24 !py-2" aria-label="Extra price" />
                    <button type="button" disabled={g.choices.length < 2} onClick={() => updateGroup(i, { ...g, choices: g.choices.filter((_, k) => k !== ci) })} className="btn-ghost !px-2 disabled:opacity-30" aria-label="Remove choice"><TrashIcon width={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => updateGroup(i, { ...g, choices: [...g.choices, { id: `${g.id}-${uid()}`, label: "", priceDelta: 0 }] })} className="text-xs font-bold text-berry-600">+ Add choice</button>
              </div>
            </div>
          ))}
          {Object.keys(errors).some((k) => k.startsWith("options")) && <p className="text-xs font-bold text-berry-600">Every option needs a name and each choice a label.</p>}
        </div>
      </fieldset>
    </div>
  );
}
