"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { PublicAdmin, Role } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { canManageRole, ROLE_HELP, ROLE_LABEL } from "@/lib/auth/permissions";
import { timeAgo } from "@/lib/admin-format";
import { Field, errProps } from "@/components/ui/Field";
import { PlusIcon, TrashIcon, EditIcon } from "@/components/ui/Icons";
import { useAdmin } from "./AdminContext";
import { Drawer, PageHeader, Panel, Toggle, badge } from "./ui";

const ROLES: Role[] = ["owner", "admin", "editor"];
type Form = { name: string; email: string; role: Role; password: string };

/** Add admin members, change roles, reset passwords, deactivate or remove. */
export function TeamManager({ initial }: { initial: PublicAdmin[] }) {
  const me = useAdmin();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<PublicAdmin | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const api = useApi();
  const rowApi = useApi();
  const canEdit = me.role !== "editor";
  const allowedRoles = ROLES.filter((r) => canManageRole(me.role, r));

  const save = async () => {
    if (!form) return;
    let res: PublicAdmin | null;
    if (editing) {
      const body: Record<string, unknown> = { name: form.name };
      if (editing.id !== me.id || me.role === "owner") body.role = form.role;
      if (form.password) body.password = form.password;
      res = await api.call<PublicAdmin>(`/api/admin/team/${editing.id}`, { method: "PUT", body });
    } else {
      res = await api.call<PublicAdmin>("/api/admin/team", { body: form });
    }
    if (res) {
      setRows((r) => (editing ? r.map((x) => (x.id === res!.id ? res! : x)) : [...r, res!]));
      setForm(null);
    }
  };
  const setActive = async (a: PublicAdmin, active: boolean) => {
    const res = await rowApi.call<PublicAdmin>(`/api/admin/team/${a.id}`, { method: "PUT", body: { active } });
    if (res) setRows((r) => r.map((x) => (x.id === a.id ? res : x)));
  };
  const remove = async (a: PublicAdmin) => {
    if (!confirm(`Remove ${a.name} from the team? They will lose access immediately.`)) return;
    if (await rowApi.call(`/api/admin/team/${a.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== a.id));
  };

  return (
    <>
      <PageHeader title="Team" sub="People who can sign in to this admin panel." action={canEdit && <button onClick={() => { setEditing(null); setForm({ name: "", email: "", role: "editor", password: "" }); }} className="btn-primary !py-2.5"><PlusIcon width={16} /> Add member</button>} />
      {rowApi.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{rowApi.error}</p>}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r} className="rounded-3xl border border-cocoa/10 bg-white p-4">
            <span className={badge(r === "owner" ? "purple" : r === "admin" ? "blue" : "grey")}>{ROLE_LABEL[r]}</span>
            <p className="mt-2 text-xs text-cocoa-muted">{ROLE_HELP[r]}</p>
          </div>
        ))}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-cocoa-muted">
              <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-cocoa/10">
              {rows.map((a) => {
                const self = a.id === me.id;
                const manageable = canEdit && canManageRole(me.role, a.role);
                return (
                  <tr key={a.id} className={clsx(!a.active && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-mango-light font-extrabold">{a.name[0]?.toUpperCase()}</span>
                        <div><p className="font-extrabold">{a.name} {self && <span className="text-xs text-cocoa-muted">(you)</span>}</p><p className="text-xs text-cocoa-muted">{a.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={badge(a.role === "owner" ? "purple" : a.role === "admin" ? "blue" : "grey")}>{ROLE_LABEL[a.role]}</span></td>
                    <td className="px-4 py-3 text-xs text-cocoa-muted">{a.lastLoginAt ? timeAgo(a.lastLoginAt) : "Never"}</td>
                    <td className="px-4 py-3"><Toggle checked={a.active} onChange={(v) => setActive(a, v)} label={`${a.name} active`} /></td>
                    <td className="px-4 py-3 text-right">
                      {(manageable || self) && <button onClick={() => { setEditing(a); setForm({ name: a.name, email: a.email, role: a.role, password: "" }); }} className="btn-ghost !px-2" aria-label={`Edit ${a.name}`}><EditIcon width={16} /></button>}
                      {manageable && !self && <button onClick={() => remove(a)} className="btn-ghost !px-2 text-berry-600" aria-label={`Remove ${a.name}`}><TrashIcon width={16} /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={!!form} onClose={() => setForm(null)} title={editing ? `Edit ${editing.name}` : "Add team member"} footer={<div className="flex justify-end gap-2">{api.error && <p className="mr-auto text-sm font-bold text-berry-600">{api.error}</p>}<button onClick={() => setForm(null)} className="btn-ghost">Cancel</button><button onClick={save} disabled={api.busy} className="btn-primary !py-2.5">{editing ? "Save" : "Add member"}</button></div>}>
        {form && (
          <div className="space-y-5">
            <Field id="tm-n" label="Full name *" error={api.fields.name}><input {...errProps("tm-n", api.fields.name)} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field id="tm-e" label="Email *" error={api.fields.email}><input {...errProps("tm-e", api.fields.email)} type="email" disabled={!!editing} className="input disabled:opacity-60" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <fieldset disabled={!!editing && (editing.id === me.id ? me.role !== "owner" : !canManageRole(me.role, editing.role))}>
              <legend className="label">Role</legend>
              <div className="grid gap-2">
                {allowedRoles.map((r) => (
                  <label key={r} className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3", form.role === r ? "border-cocoa bg-mango-light" : "border-cocoa/10 bg-white")}>
                    <input type="radio" name="role" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} className="mt-1" />
                    <span><span className="block text-sm font-extrabold">{ROLE_LABEL[r]}</span><span className="block text-xs text-cocoa-muted">{ROLE_HELP[r]}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="tm-p" label={editing ? "New password (leave blank to keep)" : "Temporary password *"} error={api.fields.password} hint="At least 8 characters. Share it privately.">
              <input {...errProps("tm-p", api.fields.password)} type="text" autoComplete="new-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
