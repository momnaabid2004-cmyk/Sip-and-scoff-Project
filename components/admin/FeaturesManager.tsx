"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { Feature, FeatureIcon as Key } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { FeatureIcon, FEATURE_ICONS } from "@/components/ui/FeatureIcon";
import { Field, errProps } from "@/components/ui/Field";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { Drawer, PageHeader, Panel, Toggle } from "./ui";

type Form = Omit<Feature, "id">;

/** Café features shown on Home & About ("Free Wi-Fi", "Open till 2 AM"…). The AI assistant knows them too. */
export function FeaturesManager({ initial }: { initial: Feature[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const api = useApi();
  const rowApi = useApi();

  const persist = async (f: Form, id?: string) => {
    const res = id ? await api.call<Feature>(`/api/admin/features/${id}`, { method: "PUT", body: f }) : await api.call<Feature>("/api/admin/features", { body: f });
    if (res) setRows((r) => (id ? r.map((x) => (x.id === res.id ? res : x)) : [...r, res]).sort((a, b) => a.sortOrder - b.sortOrder));
    return res;
  };
  const toggle = async (f: Feature, active: boolean) => {
    const { id, ...rest } = f;
    const res = await rowApi.call<Feature>(`/api/admin/features/${id}`, { method: "PUT", body: { ...rest, active } });
    if (res) setRows((r) => r.map((x) => (x.id === id ? res : x)));
  };
  const remove = async (f: Feature) => {
    if (!confirm(`Delete "${f.title}"?`)) return;
    if (await rowApi.call(`/api/admin/features/${f.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== f.id));
  };

  return (
    <>
      <PageHeader title="Features" sub="Highlights shown on the Home and About pages — and known by the AI assistant." action={<button onClick={() => { setEditing(null); setForm({ title: "", description: "", icon: "star", active: true, sortOrder: rows.length }); }} className="btn-primary !py-2.5"><PlusIcon width={16} /> Add feature</button>} />
      <Panel>
        <ul className="divide-y divide-cocoa/10">
          {rows.map((f) => (
            <li key={f.id} className={clsx("flex items-center gap-4 p-4", !f.active && "opacity-60")}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lagoon-light"><FeatureIcon icon={f.icon} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{f.title}</p>
                <p className="truncate text-sm text-cocoa-muted">{f.description}</p>
              </div>
              <Toggle checked={f.active} onChange={(v) => toggle(f, v)} label={`Show ${f.title}`} />
              <button onClick={() => { setEditing(f); const { id: _i, ...rest } = f; setForm(rest); }} className="btn-ghost !px-2" aria-label={`Edit ${f.title}`}><EditIcon width={16} /></button>
              <button onClick={() => remove(f)} className="btn-ghost !px-2 text-berry-600" aria-label={`Delete ${f.title}`}><TrashIcon width={16} /></button>
            </li>
          ))}
        </ul>
      </Panel>
      <Drawer open={!!form} onClose={() => setForm(null)} title={editing ? "Edit feature" : "New feature"} footer={<div className="flex justify-end gap-2">{api.error && <p className="mr-auto text-sm font-bold text-berry-600">{api.error}</p>}<button onClick={() => setForm(null)} className="btn-ghost">Cancel</button><button onClick={async () => { if (form && (await persist(form, editing?.id))) setForm(null); }} disabled={api.busy} className="btn-primary !py-2.5">Save</button></div>}>
        {form && (
          <div className="space-y-5">
            <Field id="ff-t" label="Title *" error={api.fields.title}><input {...errProps("ff-t", api.fields.title)} className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Live qawwali on Thursdays" /></Field>
            <Field id="ff-d" label="Description" error={api.fields.description}><textarea {...errProps("ff-d", api.fields.description)} rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <fieldset>
              <legend className="label">Icon</legend>
              <div className="flex flex-wrap gap-2">
                {FEATURE_ICONS.map((k: Key) => (
                  <button key={k} type="button" aria-pressed={form.icon === k} aria-label={k} onClick={() => setForm({ ...form, icon: k })} className={clsx("grid h-11 w-11 place-items-center rounded-2xl border-2", form.icon === k ? "border-cocoa bg-mango-light" : "border-cocoa/10 bg-white")}>
                    <FeatureIcon icon={k} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-bold"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Visible" /> Visible on website</label>
              <Field id="ff-s" label="Sort"><input id="ff-s" type="number" className="input !w-24" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
