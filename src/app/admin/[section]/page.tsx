"use client";
import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  Button, Confirm, EmptyState, ErrorState, Field, Icon, Input, Modal, Pill, Select, Skeleton, Spice, Textarea, Toggle, VegMark,
} from "@/components/ui";
import {
  CATEGORIES, cx, daysLeft, fmtDate, IMAGE_CHOICES, inr, RES_META, TABLE_META, ZONES,
  type Reservation, type TableT,
} from "@/lib/utils";
import { del, patch, post, useFetch, useToast } from "@/store";

/* =============== generic CRUD engine =============== */

type Ctx = { save: (id: number, body: Record<string, unknown>) => Promise<void> };
type Col = { label: string; className?: string; render: (row: any, ctx: Ctx) => ReactNode };
type FSpec = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "toggle" | "date" | "image";
  options?: { v: string; l: string }[];
  required?: boolean;
  placeholder?: string;
  dflt?: unknown;
};
type Config = {
  title: string;
  sub: string;
  resource: string;
  cols: Col[];
  fields: FSpec[];
  addLabel: string;
  searchKeys: string[];
  readOnly?: boolean;
  empty: { title: string; body: string };
};

function CrudPage({ cfg }: { cfg: Config }) {
  const { data, loading, error, reload, setData } = useFetch<any[]>(`/api/data/${cfg.resource}`);
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: number | null; values: Record<string, unknown> } | null>(null);
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter((r) => cfg.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)));
  }, [data, q, cfg.searchKeys]);

  const ctxSave: Ctx["save"] = async (id, body) => {
    const prev = data;
    setData((data ?? []).map((r) => (r.id === id ? { ...r, ...body } : r)));
    try {
      await patch(`/api/data/${cfg.resource}/${id}`, body);
      push("Saved");
    } catch (e) {
      if (prev) setData(prev);
      push(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      reload(true);
    }
  };

  const openAdd = () => {
    const values: Record<string, unknown> = {};
    for (const f of cfg.fields) values[f.key] = f.dflt ?? (f.type === "toggle" ? false : f.type === "number" ? "" : "");
    setEditing({ id: null, values });
    setFormErr("");
  };

  const openEdit = (row: any) => {
    const values: Record<string, unknown> = {};
    for (const f of cfg.fields) values[f.key] = row[f.key] ?? (f.type === "toggle" ? false : "");
    setEditing({ id: row.id, values });
    setFormErr("");
  };

  const submit = async () => {
    if (!editing) return;
    for (const f of cfg.fields) {
      if (f.required && (editing.values[f.key] === "" || editing.values[f.key] === undefined)) {
        setFormErr(`"${f.label}" is required`);
        return;
      }
    }
    const body: Record<string, unknown> = { ...editing.values };
    for (const f of cfg.fields) if (f.type === "number") body[f.key] = body[f.key] === "" ? 0 : Number(body[f.key]);
    setBusy(true);
    try {
      if (editing.id) {
        await patch(`/api/data/${cfg.resource}/${editing.id}`, body);
        push("Changes saved");
      } else {
        await post(`/api/data/${cfg.resource}`, body);
        push("Added");
      }
      setEditing(null);
      reload(true);
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: any) => {
    const prev = data;
    setData((data ?? []).filter((r) => r.id !== row.id));
    try {
      await del(`/api/data/${cfg.resource}/${row.id}`);
      push("Deleted", "info");
    } catch (e) {
      if (prev) setData(prev);
      push(e instanceof Error ? e.message : "Delete failed", "err");
    } finally {
      reload(true);
    }
  };

  const renderField = (f: FSpec) => {
    const v = editing?.values[f.key];
    const setV = (val: unknown) => setEditing((e) => (e ? { ...e, values: { ...e.values, [f.key]: val } } : e));
    if (f.type === "toggle")
      return <Toggle on={!!v} onChange={setV} label={v ? "Yes" : "No"} />;
    if (f.type === "select")
      return (
        <Select value={String(v ?? "")} onChange={(e) => setV(e.target.value)}>
          <option value="">— pick —</option>
          {(f.options ?? []).map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </Select>
      );
    if (f.type === "textarea") return <Textarea value={String(v ?? "")} onChange={(e) => setV(e.target.value)} placeholder={f.placeholder} />;
    if (f.type === "image")
      return (
        <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
          {IMAGE_CHOICES.map((img) => (
            <button key={img.key} type="button" onClick={() => setV(img.url)}
              className={cx("h-16 w-22 shrink-0 overflow-hidden rounded-lg border-2 transition", v === img.url ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand/50")}>
              <img src={img.url} alt={img.key} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      );
    return (
      <Input
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
        value={String(v ?? "")}
        min={f.type === "number" ? 0 : undefined}
        step={f.type === "number" ? "any" : undefined}
        onChange={(e) => setV(e.target.value)}
        placeholder={f.placeholder}
      />
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">{cfg.title}</h2>
          <p className="text-[12.5px] font-semibold text-ink2">{cfg.sub}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink2" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9.5" />
          </div>
          {!cfg.readOnly && (
            <Button icon="plus" onClick={openAdd} className="shrink-0">
              <span className="hidden sm:inline">{cfg.addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white/75">
        {error ? (
          <div className="p-4"><ErrorState msg={error} retry={() => reload()} /></div>
        ) : loading && !data ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={cfg.readOnly ? "users" : "box"}
              title={q ? "No match found" : cfg.empty.title}
              body={q ? "Try a different search." : cfg.empty.body}
              action={!cfg.readOnly && !q ? <Button icon="plus" onClick={openAdd}>{cfg.addLabel}</Button> : undefined}
            />
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line bg-sand/60 text-[11px] font-extrabold uppercase tracking-wider text-ink2">
                  {cfg.cols.map((c) => (
                    <th key={c.label} className={cx("px-4 py-3", c.className)}>{c.label}</th>
                  ))}
                  {!cfg.readOnly && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={row.id} className={cx("border-b border-line/60 transition last:border-0 hover:bg-cream/70", idx === 0 && "rounded-t-2xl", idx === filtered.length - 1 && "rounded-b-2xl")}>
                    {cfg.cols.map((c) => (
                      <td key={c.label} className={cx("px-4 py-3 align-middle", c.className)}>
                        {c.render(row, { save: ctxSave })}
                      </td>
                    ))}
                    {!cfg.readOnly && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEdit(row)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink2 transition hover:border-brand hover:text-brand" title="Edit">
                            <Icon name="edit" size={14} />
                          </button>
                          <button onClick={() => setDeleting(row)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink2 transition hover:border-chili hover:text-chili" title="Delete">
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${cfg.title.toLowerCase().replace(/s$/, "")}` : cfg.addLabel} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          {cfg.fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}>
              <Field label={f.label + (f.required ? " *" : "")}>{renderField(f)}</Field>
            </div>
          ))}
        </div>
        {formErr && <p className="mt-3 rounded-xl border border-[#ecc4ba] bg-chili-soft px-3.5 py-2.5 text-[12.5px] font-bold text-chili">{formErr}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button loading={busy} icon="check" onClick={submit}>{editing?.id ? "Save changes" : "Add it"}</Button>
        </div>
      </Modal>

      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onYes={async () => { if (deleting) await remove(deleting); }}
        title="Delete this?"
        body={`"${deleting?.name ?? "this item"}" will be removed. Past orders keep their own copy of the details, so history stays safe.`}
        yesLabel="Yes, delete"
        danger
      />
    </div>
  );
}

/* =============== section configs =============== */

const CONFIGS: Record<string, Config> = {
  menu: {
    title: "Menu",
    sub: "Dishes, prices & live availability — changes show to customers instantly",
    resource: "menu",
    addLabel: "New dish",
    searchKeys: ["name", "category"],
    empty: { title: "Menu is empty", body: "Add your first dish — customers will see it the moment you save." },
    cols: [
      {
        label: "Dish",
        render: (r) => (
          <div className="flex items-center gap-3">
            {r.image ? (
              <img src={r.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand text-brand"><Icon name="chef" size={18} /></span>
            )}
            <div>
              <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-ink">
                <VegMark veg={r.veg} size={13} /> {r.name}
                {r.popular && <Icon name="star" size={12} className="text-gold" />}
              </p>
              <p className="text-[11.5px] font-bold text-ink2"><Spice level={r.spice} /> • {r.prepTime} min</p>
            </div>
          </div>
        ),
      },
      { label: "Category", render: (r) => <span className="text-[12.5px] font-bold text-ink2">{r.category}</span> },
      { label: "Price", render: (r) => <span className="text-[13.5px] font-extrabold text-ink">{inr(r.price)}</span> },
      {
        label: "Available",
        render: (r, ctx) => (
          <Toggle on={r.available} onChange={(v) => ctx.save(r.id, { available: v })} label={r.available ? "Live" : "Sold out"} />
        ),
      },
    ],
    fields: [
      { key: "name", label: "Dish name", required: true, placeholder: "e.g. Paneer Tikka" },
      { key: "category", label: "Category", type: "select", options: CATEGORIES.map((c) => ({ v: c, l: c })), dflt: "Main Course" },
      { key: "price", label: "Price (₹)", type: "number", required: true, placeholder: "249" },
      { key: "prepTime", label: "Prep time (min)", type: "number", dflt: 15 },
      { key: "spice", label: "Spice level", type: "select", options: [{ v: "0", l: "No heat" }, { v: "1", l: "Mild" }, { v: "2", l: "Medium" }, { v: "3", l: "Fiery" }], dflt: "1" },
      { key: "veg", label: "Pure veg?", type: "toggle", dflt: true },
      { key: "available", label: "Available today?", type: "toggle", dflt: true },
      { key: "popular", label: "Mark as favourite ⭐", type: "toggle" },
      { key: "image", label: "Photo", type: "image" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Short & tasty — what makes it special?" },
    ],
  },
  tables: {
    title: "Tables",
    sub: "Hall map — tap a status to update it live",
    resource: "tables",
    addLabel: "New table",
    searchKeys: ["zone"],
    empty: { title: "No tables yet", body: "Add your tables so customers can pick one while ordering." },
    cols: [
      {
        label: "Table",
        render: (r) => (
          <span className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-[15px] font-bold text-gold">T{r.tableNo}</span>
            <span className="text-[13px] font-extrabold text-ink">{r.seats} seats</span>
          </span>
        ),
      },
      { label: "Zone", render: (r) => <span className="text-[12.5px] font-bold text-ink2">{r.zone}</span> },
      {
        label: "Status",
        render: (r, ctx) => (
          <span className="relative inline-flex w-fit">
            <select
              value={r.status}
              onChange={(e) => ctx.save(r.id, { status: e.target.value })}
              aria-label="Table status"
              className="h-8 appearance-none rounded-lg border border-line bg-white pl-2.5 pr-7 text-[12px] font-bold text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              {Object.entries(TABLE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink2" width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        ),
      },
    ],
    fields: [
      { key: "tableNo", label: "Table number", type: "number", required: true, placeholder: "13" },
      { key: "seats", label: "Seats", type: "number", dflt: 4 },
      { key: "zone", label: "Zone", type: "select", options: ZONES.map((z) => ({ v: z, l: z })), dflt: "Main Hall" },
      { key: "status", label: "Status", type: "select", options: Object.entries(TABLE_META).map(([k, v]) => ({ v: k, l: v.label })), dflt: "free" },
    ],
  },
  inventory: {
    title: "Inventory",
    sub: "Store room — with smart days-left prediction from daily usage",
    resource: "inventory",
    addLabel: "New item",
    searchKeys: ["name", "category", "supplier"],
    empty: { title: "Store is empty", body: "Track ingredients here and never run out mid-service again." },
    cols: [
      {
        label: "Item",
        render: (r) => (
          <div>
            <p className="text-[13.5px] font-extrabold text-ink">{r.name}</p>
            <p className="text-[11.5px] font-bold text-ink2">{r.category} • {r.supplier || "no supplier"}</p>
          </div>
        ),
      },
      {
        label: "In stock",
        render: (r) => (
          <div>
            <p className={cx("text-[13.5px] font-extrabold", r.qty <= r.minQty ? "text-chili" : "text-ink")}>
              {r.qty} {r.unit}
            </p>
            <p className="text-[11px] font-bold text-ink2">min {r.minQty} {r.unit}</p>
          </div>
        ),
      },
      {
        label: "Days left",
        render: (r) => {
          const dl = daysLeft(r);
          const pct = Math.min(100, (dl / 7) * 100);
          return (
            <div className="w-28">
              <p className={cx("text-[12px] font-extrabold", dl <= 2 ? "text-chili" : dl <= 4 ? "text-[#7a5a12]" : "text-leaf-deep")}>
                ~{dl >= 99 ? "99+" : dl} day{dl === 1 ? "" : "s"}
                {dl <= 2 && " • order now!"}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                <div className={cx("h-full rounded-full", dl <= 2 ? "bg-chili" : dl <= 4 ? "bg-gold" : "bg-leaf")} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
      { label: "Cost / unit", render: (r) => <span className="text-[12.5px] font-bold text-ink2">{inr(r.costPerUnit)}</span> },
      {
        label: "Smart refill",
        render: (r, ctx) => (
          <Button size="xs" variant={r.qty <= r.minQty ? "primary" : "outline"} onClick={() => ctx.save(r.id, { restock: true })}>
            Restock to {Math.max(r.minQty * 4, r.qty)} {r.unit}
          </Button>
        ),
      },
    ],
    fields: [
      { key: "name", label: "Item name", required: true, placeholder: "e.g. Paneer" },
      { key: "category", label: "Category", type: "select", options: ["Vegetables", "Dairy", "Meat & Poultry", "Grains", "Spices", "Grocery", "Packaging"].map((c) => ({ v: c, l: c })), dflt: "Vegetables" },
      { key: "unit", label: "Unit", type: "select", options: ["kg", "L", "pcs", "g"].map((u) => ({ v: u, l: u })), dflt: "kg" },
      { key: "qty", label: "Current stock", type: "number", dflt: 10 },
      { key: "minQty", label: "Minimum level", type: "number", dflt: 5 },
      { key: "avgDailyUse", label: "Avg daily use", type: "number", dflt: 1 },
      { key: "costPerUnit", label: "Cost per unit (₹)", type: "number", dflt: 0 },
      { key: "supplier", label: "Supplier", placeholder: "e.g. Sabzi Mandi, Camp" },
    ],
  },
  staff: {
    title: "Staff",
    sub: "Team roster & duty status",
    resource: "staff",
    addLabel: "New member",
    searchKeys: ["name", "duty"],
    empty: { title: "No staff yet", body: "Add your team so shifts and duties are always clear." },
    cols: [
      {
        label: "Member",
        render: (r) => (
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-[13px] font-extrabold text-white">{r.name[0]}</span>
            <div>
              <p className="text-[13.5px] font-extrabold text-ink">{r.name}</p>
              <p className="text-[11.5px] font-bold text-ink2">{r.phone || "no phone"}</p>
            </div>
          </div>
        ),
      },
      { label: "Duty", render: (r) => <span className="text-[12.5px] font-bold text-ink">{r.duty}</span> },
      { label: "Shift", render: (r) => <span className="text-[12.5px] font-bold text-ink2">{r.shift}</span> },
      { label: "Joined", render: (r) => <span className="text-[12px] font-bold text-ink2">{fmtDate(r.joinedOn)}</span> },
      {
        label: "On duty",
        render: (r, ctx) => <Toggle on={r.onDuty} onChange={(v) => ctx.save(r.id, { onDuty: v })} label={r.onDuty ? "Working" : "Off"} />,
      },
    ],
    fields: [
      { key: "name", label: "Full name", required: true },
      { key: "duty", label: "Duty", type: "select", options: ["Head Chef", "Tandoor Chef", "Waiter", "Cashier", "Cleaning", "Manager"].map((d) => ({ v: d, l: d })), dflt: "Waiter" },
      { key: "phone", label: "Phone", placeholder: "98xxx xxxxx" },
      { key: "shift", label: "Shift", type: "select", options: ["Morning", "Evening", "Full Day"].map((s) => ({ v: s, l: s })), dflt: "Full Day" },
      { key: "joinedOn", label: "Joined on", type: "date", dflt: "2024-01-01" },
      { key: "onDuty", label: "On duty today?", type: "toggle", dflt: true },
    ],
  },
  customers: {
    title: "Customers",
    sub: "Everyone who has eaten with you — read only",
    resource: "customers",
    addLabel: "",
    searchKeys: ["name", "email"],
    readOnly: true,
    empty: { title: "No customers yet", body: "Once people sign up and order, they'll appear here with their lifetime spend." },
    cols: [
      {
        label: "Customer",
        render: (r) => (
          <div className="flex items-center gap-3">
            <span className={cx(
              "grid h-9 w-9 place-items-center text-[13px] font-extrabold rounded-xl",
              r.vip ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm" : "bg-brand-soft text-brand-deep",
            )}>{r.name[0]}</span>
            <div>
              <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-ink">
                {r.name}
                {r.vip && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-amber-700">
                    🪙 VIP
                  </span>
                )}
                {r.vegOnly && <span className="rounded-md bg-leaf-soft px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-leaf-deep">Veg</span>}
                {r.isGoogle && <Icon name="google" size={11} className="text-[#4285F4]" />}
              </p>
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink2">
                {r.email}
                {r.vip && (
                  <span className="text-[10px] font-bold text-amber-600">• {r.vip.vipId}</span>
                )}
              </p>
            </div>
          </div>
        ),
      },
      { label: "Phone", render: (r) => <span className="text-[12.5px] font-bold text-ink2">{r.phone || "—"}</span> },
      { label: "Joined", render: (r) => <span className="text-[12px] font-bold text-ink2">{fmtDate(r.createdAt)}</span> },
      { label: "Orders", render: (r) => <span className="text-[13.5px] font-extrabold text-ink">{r.orders}</span> },
      { label: "Total spent", render: (r) => <span className="text-[13.5px] font-extrabold text-leaf-deep">{inr(r.spent)}</span> },
    ],
    fields: [],
  },
};

/* =============== reservations (custom flow) with AI Smart Table =============== */

type AiSuggestionMap = Record<number, {
  tableId: number;
  tableNo: number;
  seats: number;
  zone: string;
  score: number;
  reason: string;
}>;

function ReservationsAdmin() {
  const { data: list, loading, error, reload, setData } = useFetch<Reservation[]>("/api/data/reservations", { interval: 12000 });
  const { data: tables } = useFetch<TableT[]>("/api/data/tables");
  const { push } = useToast();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionMap>({});
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => {
    const rows = list ?? [];
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [list, filter]);

  /* ── AI Smart Table: fetch suggestions for pending reservations ── */
  useEffect(() => {
    if (!list || !tables) return;
    const pending = list.filter((r) =>
      ["requested", "alternate_offered"].includes(r.status) && !r.tableId
    );
    if (!pending.length) return;

    for (const r of pending) {
      if (aiSuggestions[r.id] || aiLoading[r.id]) continue; // skip if already fetched or fetching

      setAiLoading((prev) => ({ ...prev, [r.id]: true }));

      const alreadyAssignedIds = list
        .filter((x) => x.id !== r.id && x.tableId && ["requested", "confirmed", "alternate_offered"].includes(x.status))
        .map((x) => x.tableId!)
        .filter(Boolean);

      // Also exclude tables that are occupied or being cleaned (real-time status)
      const occupiedIds = tables
        .filter((t) => t.status === "occupied" || t.status === "reserved" || t.status === "cleaning")
        .map((t) => t.id);

      const excludeIds = [...new Set([...alreadyAssignedIds, ...occupiedIds])];
      const zone = tables.find((t) => t.id === r.requestedTableId)?.zone;

      fetch(`/api/ai/smart-table?guests=${r.guests}${zone ? `&zone=${encodeURIComponent(zone)}` : ""}${excludeIds.length ? `&exclude=${excludeIds.join(",")}` : ""}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const s = data[0] as { tableId: number; tableNo: number; seats: number; zone: string; score: number; reason: string };
            setAiSuggestions((prev) => ({ ...prev, [r.id]: s }));
            // Auto-select the AI suggestion in the dropdown (using functional updater to avoid stale closure)
            if (!r.tableId) {
              setData((prev) => (prev ?? []).map((x) =>
                x.id === r.id ? { ...x, tableId: s.tableId } : x
              ));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setAiLoading((prev) => ({ ...prev, [r.id]: false }));
        });
    }
  }, [list, tables]);

  const act = async (r: Reservation, body: Record<string, unknown>, msg: string) => {
    setBusyId(r.id);
    const prev = list;
    setData((list ?? []).map((x) => (x.id === r.id ? { ...x, ...body } : x)));
    try {
      await patch(`/api/data/reservations/${r.id}`, body);
      push(msg);
    } catch (e) {
      if (prev) setData(prev);
      push(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setBusyId(null);
      reload(true);
    }
  };

  const autoTable = (r: Reservation) => {
    // First try AI suggestion
    if (aiSuggestions[r.id]) return aiSuggestions[r.id].tableId;
    // Fallback to basic logic
    const suitable = (tables ?? [])
      .filter((t) => t.seats >= r.guests)
      .sort((a, b) => Number(a.status !== "free") - Number(b.status !== "free") || a.seats - b.seats);
    return suitable[0]?.id ?? null;
  };

  const chips = ["all", "requested", "alternate_offered", "confirmed", "seated", "completed", "cancelled"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Bookings</h2>
          <p className="text-[12px] font-semibold text-ink2">Confirm, seat & complete — customers get pinged at every step</p>
        </div>
      </div>

      {/* Filter chips — premium compact */}
      <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-0.5">
        {chips.map((c) => {
          const count = c === "all" ? list?.length ?? 0 : (list ?? []).filter((r) => r.status === c).length;
          return (
            <button key={c} onClick={() => setFilter(c)}
              className={cx(
                "shrink-0 rounded-lg border px-3 py-1.5 text-[11.5px] font-bold capitalize transition-all duration-200",
                filter === c
                  ? "border-ink bg-ink text-cream shadow-[0_2px_8px_-2px_rgba(15,23,42,0.3)]"
                  : "border-slate-200 bg-white text-ink2 hover:border-slate-300 hover:bg-slate-50/80",
              )}>
              {c === "all" ? "All" : RES_META[c].label}
              <span className={cx("ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold", filter === c ? "bg-white/20 text-cream" : "bg-slate-100 text-ink2")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bookings list */}
      <div className="space-y-0 rounded-xl border border-slate-200/80 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.02),0_1px_2px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.06)]">
        {/* Premium top accent */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a87c]/40 to-transparent" />

        {error ? (
          <div className="p-5"><ErrorState msg={error} retry={() => reload()} /></div>
        ) : loading && !list ? (
          <div className="space-y-0">{[...Array(3)].map((_, i) => <Skeleton key={i} className="min-h-[72px] rounded-none border-b border-slate-100 last:border-0" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8"><EmptyState icon="calendar" title="No bookings here" body="New table requests will land here the moment customers send them." /></div>
        ) : (
          filtered.map((r, idx) => {
            const suitable = (tables ?? []).filter((t) => t.seats >= r.guests);
            return (
              <div key={r.id} className="anim-up group relative">
                {/* Premium row separator */}
                {idx > 0 && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors duration-200 hover:bg-slate-50/50">
                  {/* Customer info */}
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a87c]/15 to-[#c9a87c]/5 text-[11px] font-extrabold text-[#8a6d44]">
                        {r.customerName[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold text-ink">
                          {r.customerName}
                          <span className="ml-1.5 text-[11px] font-bold text-ink2">• {r.guests} guests</span>
                        </p>
                        <p className="flex items-center gap-1 text-[11px] font-semibold text-ink2/70">
                          <span>{r.date}</span>
                          <span className="text-slate-300">·</span>
                          <span>{r.slot}</span>
                          {r.phone && <><span className="text-slate-300">·</span><span className="inline-flex items-center gap-1"><Icon name="phone" size={11} className="text-ink2/60" /> {r.phone}</span></>}
                        </p>
                      </div>
                    </div>
                    {r.note && <p className="mt-1 pl-9 flex items-center gap-1 truncate text-[11px] font-semibold text-[#8a6d44]"><Icon name="note" size={11} /> {r.note}</p>}
                  </div>

                  {/* Show requested table preference */}
                  {r.requestedTableId && (
                    <div className="shrink-0">
                      <Pill cls="bg-[#f0ead6] text-[#7a6a44] border-[#d4c8a8] text-[10.5px] px-2 py-0.5">
                        Requested: T{((tables ?? []).find(t => t.id === r.requestedTableId))?.tableNo ?? "?"}
                      </Pill>
                    </div>
                  )}

                  {/* AI Recommendation badge */}
                  {aiSuggestions[r.id] && !r.tableId && r.status === "requested" && (
                    <div className="shrink-0 anim-pop">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#b8d4f0] bg-[#e8f1fb] px-2 py-1 text-[10px] font-extrabold text-[#2a6a9e] shadow-[0_0_8px_-2px_rgba(42,106,158,0.3)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3c.5 1.5 2.5 2.5 4 3-1.5 1-2.5 3-2 5-.5-1-2-2-4-2s-3.5 1-4 2c.5-2-.5-4-2-5 1.5-.5 3.5-1.5 4-3Z"/>
                        </svg>
                        AI: T{aiSuggestions[r.id].tableNo} · {aiSuggestions[r.id].reason}
                      </span>
                    </div>
                  )}

                  {/* AI loading indicator */}
                  {aiLoading[r.id] && (
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-ink2">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        AI finding best table…
                      </span>
                    </div>
                  )}

                  {/* Table selector — locked after confirmed */}
                  <div className="relative z-10 shrink-0">
                    <select
                      value={r.tableId ?? ""}
                      onChange={(e) => {
                        const newTid = e.target.value ? Number(e.target.value) : null;
                        // Don't send status — just update tableId; API handles this separately
                        act(r, { tableId: newTid }, "Table updated");
                      }}
                      disabled={["confirmed", "seated", "completed", "cancelled"].includes(r.status)}
                      className={cx(
                        "h-8 w-auto min-w-[130px] appearance-none rounded-lg border pl-2.5 pr-7 text-[11.5px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-slate-100",
                        aiSuggestions[r.id] && r.tableId === aiSuggestions[r.id].tableId && !["confirmed", "seated", "completed", "cancelled"].includes(r.status)
                          ? "border-[#4a90c9] bg-[#e8f1fb] text-[#1a4a7a] ring-1 ring-[#4a90c9]/30 animate-pulse"
                          : "border-slate-200 bg-white text-ink hover:border-slate-300 focus:border-brand focus:ring-brand/20",
                      )}
                    >
                      <option value="">No table</option>
                      {suitable.map((t) => (
                        <option key={t.id} value={t.id}>
                          T{t.tableNo} · {t.seats} seats{t.zone !== "Main Hall" ? ` · ${t.zone}` : ""}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink2" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>

                  {/* Status pill — compact */}
                  <Pill cls={cx(RES_META[r.status].cls, "text-[11px] px-2.5 py-0.5")}>{RES_META[r.status].label}</Pill>

                  {/* Action buttons — premium compact */}
                  <div className="flex shrink-0 gap-1">
                    {r.status === "requested" && (
                      <>
                        {/* Quick Assign button — shown when AI has a suggestion */}
                        {aiSuggestions[r.id] && (
                          <button
                            disabled={busyId === r.id}
                            onClick={() => {
                              const isAlternate = r.requestedTableId && aiSuggestions[r.id].tableId !== r.requestedTableId;
                              act(r, { status: "confirmed", tableId: aiSuggestions[r.id].tableId },
                                isAlternate
                                  ? `${r.customerName.split(" ")[0]} — alternate offered, awaiting response`
                                  : `${r.customerName.split(" ")[0]}'s table confirmed (AI assigned T${aiSuggestions[r.id].tableNo})`
                              );
                            }}
                            className={cx(
                              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-[0.97]",
                              busyId === r.id
                                ? "pointer-events-none opacity-50 bg-[#4a90c9]/10 text-[#2a6a9e]"
                                : "bg-[#4a90c9] text-white shadow-[0_2px_8px_-2px_rgba(42,106,158,0.4)] hover:bg-[#3a7ab5] hover:shadow-[0_4px_12px_-2px_rgba(42,106,158,0.5)]",
                            )}
                          >
                            {busyId === r.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3c.5 1.5 2.5 2.5 4 3-1.5 1-2.5 3-2 5-.5-1-2-2-4-2s-3.5 1-4 2c.5-2-.5-4-2-5 1.5-.5 3.5-1.5 4-3Z"/>
                              </svg>
                            )}
                            AI Assign T{aiSuggestions[r.id].tableNo}
                          </button>
                        )}
                        <button
                          disabled={busyId === r.id || !(r.tableId || autoTable(r))}
                          onClick={() => {
                            const tid = r.tableId ?? autoTable(r);
                            const isAlternate = r.requestedTableId && tid !== r.requestedTableId;
                            act(r, { status: "confirmed", tableId: tid }, isAlternate ? `${r.customerName.split(" ")[0]} — alternate offered, awaiting response` : `${r.customerName.split(" ")[0]}'s table confirmed`);
                          }}
                          className={cx("inline-flex items-center gap-1 rounded-lg bg-[#16a34a]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#16a34a] transition-all duration-200 hover:bg-[#16a34a] hover:text-white hover:shadow-[0_2px_8px_-2px_rgba(22,163,74,0.4)] active:scale-[0.97]", busyId === r.id && "pointer-events-none opacity-50")}
                        >
                          {busyId === r.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" /> : <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {aiSuggestions[r.id] ? "Manual" : "Confirm"}
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => act(r, { status: "cancelled" }, "Booking declined")}
                          className={cx("inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-400 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-500 active:scale-[0.97]", busyId === r.id && "pointer-events-none opacity-50")}
                        >
                          {busyId === r.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-transparent" /> : <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                          Decline
                        </button>
                      </>
                    )}
                    {r.status === "alternate_offered" && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0e6ff] px-2.5 py-1.5 text-[11px] font-bold text-[#6b3fa0]">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        Waiting for customer
                      </span>
                    )}
                    {r.status === "confirmed" && (
                      <>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => act(r, { status: "seated" }, "Guests seated")}
                          className={cx("inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-cream transition-all duration-200 hover:bg-ink/90 hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.4)] active:scale-[0.97]", busyId === r.id && "pointer-events-none opacity-50")}
                        >
                          {busyId === r.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-cream border-t-transparent" /> : <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                          Seat
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => act(r, { status: "cancelled" }, "Booking cancelled")}
                          className={cx("inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-400 transition-all duration-200 hover:border-red-200 hover:text-red-400 active:scale-[0.97]", busyId === r.id && "pointer-events-none opacity-50")}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {r.status === "seated" && (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => act(r, { status: "completed" }, "Visit completed — table freed")}
                        className={cx("inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-ink to-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-cream transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.4)] active:scale-[0.97]", busyId === r.id && "pointer-events-none opacity-50")}
                      >
                        {busyId === r.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-cream border-t-transparent" /> : <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* =============== page =============== */

export default function SectionPage(props: { params: Promise<{ section: string }> }) {
  const { section } = use(props.params);
  if (section === "reservations") return <ReservationsAdmin />;
  const cfg = CONFIGS[section];
  if (!cfg) notFound();
  return <CrudPage cfg={cfg} />;
}
