import "server-only";
import { NextResponse } from "next/server";
import type { z, ZodTypeAny } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import type { Permission } from "@/lib/auth/permissions";
import { notFound, parseBody, refreshSite } from "@/lib/api";

type Coll = {
  list(): Promise<unknown[]>;
  get(id: string): Promise<unknown | null>;
  create(input: never): Promise<unknown>;
  update(id: string, patch: never): Promise<unknown | null>;
  remove(id: string): Promise<boolean>;
};

type Hooks<T> = {
  /** extra checks before create/update (e.g. category exists). Return an error message to reject. */
  validate?: (data: T, id?: string) => Promise<string | null>;
  /** checks before delete (e.g. category still has products). */
  beforeDelete?: (id: string) => Promise<string | null>;
};

/** Admin list + create handlers for a collection. */
export function collectionRoutes<S extends ZodTypeAny, T = z.output<S>>(coll: () => Coll, schema: S, perm: Permission, label: string, hooks: Hooks<T> = {}) {
  return {
    async GET() {
      const { error } = await requireAdmin();
      if (error) return error;
      return NextResponse.json(await coll().list());
    },
    async POST(req: Request) {
      const { error } = await requireAdmin(perm);
      if (error) return error;
      const body = await parseBody(req, schema);
      if (body.error) return body.error;
      const problem = await hooks.validate?.(body.data);
      if (problem) return NextResponse.json({ error: problem }, { status: 422 });
      const row = await coll().create(body.data as never);
      refreshSite();
      return NextResponse.json(row, { status: 201 });
    },
  };
}

type Ctx = { params: Promise<{ id: string }> };

/** Admin get / update / delete handlers for one item. */
export function itemRoutes<S extends ZodTypeAny, T = z.output<S>>(coll: () => Coll, schema: S, perm: Permission, label: string, hooks: Hooks<T> = {}) {
  return {
    async GET(_req: Request, { params }: Ctx) {
      const { error } = await requireAdmin();
      if (error) return error;
      const row = await coll().get((await params).id);
      return row ? NextResponse.json(row) : notFound(label);
    },
    async PUT(req: Request, { params }: Ctx) {
      const { error } = await requireAdmin(perm);
      if (error) return error;
      const { id } = await params;
      const body = await parseBody(req, schema);
      if (body.error) return body.error;
      const problem = await hooks.validate?.(body.data, id);
      if (problem) return NextResponse.json({ error: problem }, { status: 422 });
      const row = await coll().update(id, body.data as never);
      if (!row) return notFound(label);
      refreshSite();
      return NextResponse.json(row);
    },
    async DELETE(_req: Request, { params }: Ctx) {
      const { error } = await requireAdmin(perm);
      if (error) return error;
      const { id } = await params;
      const problem = await hooks.beforeDelete?.(id);
      if (problem) return NextResponse.json({ error: problem }, { status: 409 });
      const ok = await coll().remove(id);
      if (!ok) return notFound(label);
      refreshSite();
      return NextResponse.json({ ok: true });
    },
  };
}
