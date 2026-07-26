"use client";
import { useMemo, useState } from "react";
import { Button, Confirm, EmptyState, ErrorState, Icon, Pill, Skeleton, type IconName } from "@/components/ui";
import { cx, fmtDate, fmtTime, inr, ORDER_META, ORDER_STEPS, PAY_LABEL, type MenuItem, type Order } from "@/lib/utils";
import { patch, useAuth, useCart, useFetch, useToast } from "@/store";
import BillInvoice from "@/components/BillInvoice";

const STEP_ICONS: Record<string, IconName> = {
  placed: "check",
  cooking: "flame",
  ready: "bell",
  served: "tray",
};

function StatusStepper({ status }: { status: string }) {
  const idx = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return (
    <div className="flex items-center">
      {ORDER_STEPS.map((s, i) => {
        const done = i < idx || status === "served";
        const current = i === idx && status !== "served";
        return (
          <div key={s} className={cx("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <span className={cx("mx-1.5 h-0.5 flex-1 rounded-full transition-colors sm:mx-2", done || current ? "bg-leaf" : "bg-line")} />
            )}
            <div className="flex flex-col items-center">
              <span
                className={cx(
                  "grid h-9 w-9 place-items-center rounded-full border-2 transition-all",
                  done && "border-leaf bg-leaf text-white",
                  current && "animate-pulse border-brand bg-brand-soft text-brand-deep",
                  !done && !current && "border-line bg-white text-ink2/50",
                )}
              >
                <Icon name={STEP_ICONS[s]} size={15} />
              </span>
              <span className={cx("mt-1 text-[10px] font-extrabold uppercase tracking-wide", done || current ? "text-ink" : "text-ink2/50")}>
                {ORDER_META[s].label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignInPrompt() {
  const { setAuthOpen } = useCart();
  return (
    <EmptyState
      icon="receipt"
      title="Sign in to see your orders"
      body="Your live orders, cooking updates and order history — all in one place. Sign in takes 30 seconds."
      action={<Button onClick={() => setAuthOpen(true)} icon="user">Sign in</Button>}
    />
  );
}

export default function OrdersPage() {
  const { user, booting } = useAuth();
  const { data: orders, loading, error, reload, setData } = useFetch<Order[]>(user ? "/api/data/orders" : null, { interval: 8000 });
  const { data: menu } = useFetch<MenuItem[]>("/api/data/menu");
  const { add, setCartOpen } = useCart();
  const { push } = useToast();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [viewBill, setViewBill] = useState<Order | null>(null);

  const active = useMemo(() => (orders ?? []).filter((o) => ["placed", "cooking", "ready"].includes(o.status)), [orders]);
  const past = useMemo(() => (orders ?? []).filter((o) => ["served", "cancelled"].includes(o.status)), [orders]);

  const reorder = (o: Order) => {
    const menuMap = new Map((menu ?? []).map((m) => [m.id, m]));
    let added = 0;
    for (const it of o.items ?? []) {
      const m = menuMap.get(it.menuItemId);
      if (m && m.available) {
        add({ menuItemId: m.id, name: m.name, price: m.price, veg: m.veg, image: m.image, desc: m.description }, it.qty);
        added++;
      }
    }
    if (!added) {
      push("Those dishes are sold out today", "err");
      return;
    }
    push(`${added} dish${added > 1 ? "es" : ""} added back to your tray`);
    setCartOpen(true);
  };

  const cancel = async (id: number) => {
    setBusyId(id);
    const prev = orders;
    setData((orders ?? []).map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o)));
    try {
      await patch(`/api/data/orders/${id}`, { status: "cancelled" });
      push("Order cancelled — amount will be refunded", "info");
    } catch (e) {
      if (prev) setData(prev);
      push(e instanceof Error ? e.message : "Could not cancel", "err");
    } finally {
      setBusyId(null);
      reload(true);
    }
  };

  if (booting) return <div className="mx-auto max-w-3xl px-4 pt-10"><Skeleton className="h-40" /></div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 pt-10"><SignInPrompt /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-brand">Live tracking</p>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">My orders</h1>
        </div>
        {active.length > 0 && (
          <Pill cls="border-[#eec9ad] bg-brand-soft text-brand-deep" dot="bg-brand animate-pulse">
            {active.length} in kitchen • auto-refreshing
          </Pill>
        )}
      </div>

      {error ? (
        <div className="mt-6"><ErrorState msg={error} retry={() => reload()} /></div>
      ) : loading && !orders ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-5">
            {active.map((o) => (
              <article key={o.id} className="anim-up overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sand/50 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[15px] font-extrabold tracking-wider text-ink">{o.code}</span>
                    <Pill cls={ORDER_META[o.status].cls} dot={ORDER_META[o.status].dot}>
                      {ORDER_META[o.status].label}
                    </Pill>
                  </div>
                  <p className="text-[12px] font-bold text-ink2">
                    {o.type === "dine-in" && o.tableNo ? `Table ${o.tableNo} • ` : o.type === "takeaway" ? "Takeaway • " : ""}
                    placed {fmtTime(o.createdAt)}
                  </p>
                </div>
                <div className="px-5 py-5">
                  <StatusStepper status={o.status} />
                  <p className="mt-4 rounded-xl border border-dashed border-line bg-cream px-4 py-2.5 text-center text-[13px] font-bold text-ink">
                    {ORDER_META[o.status].friendly}
                    {o.status === "ready" && (o.type === "takeaway" ? " at the counter" : "")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[12.5px] font-semibold text-ink2">
                      {(o.items ?? []).map((i) => `${i.qty}× ${i.name}`).join(" • ")}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[16px] font-extrabold text-ink">{inr(o.total)}</p>
                      {o.status === "placed" && (
                        <Button size="xs" variant="outline" className="border-chili/40 text-chili hover:border-chili hover:text-chili" loading={busyId === o.id} onClick={() => setCancelId(o.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  {o.note && (
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-ink2"><Icon name="note" size={13} className="text-gold" /> Your note: “{o.note}”</p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-10 font-display text-xl font-bold text-ink">Earlier orders</h2>
          {past.length === 0 && active.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="tray"
                title="No orders yet"
                body="Your tummy and our kitchen haven't met. Fix that right now!"
                action={<a href="/menu"><Button icon="arrow">Browse the menu</Button></a>}
              />
            </div>
          ) : past.length === 0 ? (
            <p className="mt-3 text-[13px] font-medium text-ink2">Past orders will show up here.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {past.map((o) => (
                <li key={o.id} className="anim-up overflow-hidden rounded-2xl border border-line bg-white/70">
                  <button className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-left transition hover:bg-sand/50" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[13.5px] font-extrabold tracking-wider text-ink">{o.code}</span>
                      <Pill cls={ORDER_META[o.status].cls} dot={ORDER_META[o.status].dot}>{ORDER_META[o.status].label}</Pill>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-ink2">{fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}</span>
                      <span className="text-[14px] font-extrabold text-ink">{inr(o.total)}</span>
                      <Icon name="chevron" size={15} className={cx("text-ink2 transition-transform", expanded === o.id && "rotate-180")} />
                    </span>
                  </button>
                  {expanded === o.id && (
                    <div className="anim-down border-t border-line px-5 py-4">
                      <ul className="space-y-1.5">
                        {(o.items ?? []).map((i) => (
                          <li key={i.id} className="flex items-center justify-between text-[13px] font-semibold text-ink">
                            <span>{i.qty}× {i.name}</span>
                            <span className="text-ink2">{inr(i.price * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
                        <p className="text-[11.5px] font-bold text-ink2">
                          {PAY_LABEL[o.paymentMode]} • GST {inr(o.tax)} included
                        </p>
                        {o.status === "served" && (
                          <div className="flex gap-1.5">
                            <Button size="xs" variant="outline" icon="receipt" onClick={() => setViewBill(o)}>
                              View Bill
                            </Button>
                            <Button size="xs" variant="leaf" icon="refresh" onClick={() => reorder(o)}>
                              Order again
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Confirm
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        onYes={async () => {
          if (cancelId) await cancel(cancelId);
        }}
        title="Cancel this order?"
        body="The kitchen hasn't started yet, so it's safe to cancel. Once cooking begins, we can't stop it from here."
        yesLabel="Yes, cancel it"
        danger
      />

      {viewBill && (
        <BillInvoice order={viewBill} open={!!viewBill} onClose={() => setViewBill(null)} />
      )}
    </div>
  );
}
