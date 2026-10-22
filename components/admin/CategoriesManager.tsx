"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { ArtKind, Category, FlavourColor } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { FLAVOUR } from "@/lib/theme";
import { ProductArt } from "@/components/art/ProductArt";
import { Field, errProps } from "@/components/ui/Field";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { Drawer, PageHeader } from "./ui";

const ARTS: ArtKind[] = ["cup", "iced", "chai-glass", "matka", "cone", "sundae", "kulfi", "shake", "mojito", "can", "sandwich", "fries", "wrap", "burger", "samosa", "nuggets", "cake", "brownie", "waffle", "bowl"];
type Form = Omit<Category, "id" | "slug">;

export function CategoriesManager({ initial, counts }: { initial: Category[]; counts: Record<string, number> }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const api = useApi();
  const rowApi = useApi();

  const save = async () => {
    if (!form) return;
    const res = editing ? await api.call<Category>(`/api/admin/categories/${editing.id}`, { method: "PUT", body: form }) : await api.call<Category>("/api/admin/categories", { body: form });
    if (res) {
      setRows((r) => (editing ? r.map((x) => (x.id === res.id ? res : x)) : [...r, res]).sort((a, b) => a.sortOrder - b.sortOrder));
      setForm(null);
    }
  };
  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    if (await rowApi.call(`/api/admin/categories/${c.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== c.id));
  };

  return (
    <>
      <PageHeader title="Categories" sub="Each category gets its own flavour colour across the website." action={<button onClick={() => { setEditing(null); setForm({ name: "", tagline: "", color: "berry", art: "cone", sortOrder: rows.length }); }} className="btn-primary !py-2.5"><PlusIcon width={16} /> Add category</button>} />
      {rowApi.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{rowApi.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => (
          <div key={c.id} className={clsx("flex items-center gap-4 rounded-3xl border border-cocoa/10 p-4", FLAVOUR[c.color].light)}>
            <div className="h-16 w-16 shrink-0"><ProductArt kind={c.art} tint={FLAVOUR[c.color].hex} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold">{c.name}</p>
              <p className="truncate text-xs text-cocoa-muted">{c.tagline}</p>
              <p className="mt-1 text-xs font-bold">{counts[c.id] ?? 0} products · #{c.sortOrder}</p>
            </div>
            <button onClick={() => { setEditing(c); const { id: _i, slug: _s, ...rest } = c; setForm(rest); }} className="btn-ghost !px-2" aria-label={`Edit ${c.name}`}><EditIcon width={16} /></button>
            <button onClick={() => remove(c)} className="btn-ghost !px-2 text-berry-600" aria-label={`Delete ${c.name}`}><TrashIcon width={16} /></button>
          </div>
        ))}
      </div>
      <Drawer open={!!form} onClose={() => setForm(null)} title={editing ? `Edit ${editing.name}` : "New category"} footer={<div className="flex justify-end gap-2">{api.error && <p className="mr-auto text-sm font-bold text-berry-600">{api.error}</p>}<button onClick={() => setForm(null)} className="btn-ghost">Cancel</button><button onClick={save} disabled={api.busy} className="btn-primary !py-2.5">Save</button></div>}>
        {form && (
          <div className="space-y-5">
            <Field id="cf-n" label="Name *" error={api.fields.name}><input {...errProps("cf-n", api.fields.name)} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field id="cf-t" label="Tagline" error={api.fields.tagline}><input {...errProps("cf-t", api.fields.tagline)} className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
            <fieldset>
              <legend className="label">Flavour colour</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FLAVOUR) as FlavourColor[]).map((k) => (
                  <button key={k} type="button" aria-pressed={form.color === k} onClick={() => setForm({ ...form, color: k })} className={clsx("flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold", form.color === k ? "border-cocoa" : "border-cocoa/10")}>
                    <span className={clsx("h-4 w-4 rounded-full", FLAVOUR[k].bg)} /> {FLAVOUR[k].label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-[1fr_auto] items-end gap-4">
              <Field id="cf-a" label="Illustration">
                <select id="cf-a" className="input" value={form.art} onChange={(e) => setForm({ ...form, art: e.target.value as ArtKind })}>{ARTS.map((a) => <option key={a}>{a}</option>)}</select>
              </Field>
              <div className={clsx("h-[50px] w-[50px] rounded-2xl p-1", FLAVOUR[form.color].light)}><ProductArt kind={form.art} tint={FLAVOUR[form.color].hex} /></div>
            </div>
            <Field id="cf-s" label="Sort order"><input id="cf-s" type="number" className="input !w-32" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
