"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Confirm, EmptyState, ErrorState, Icon, Input, Pill, Skeleton, type IconName } from "@/components/ui";
import { StarInput } from "@/components/StarRating";
import { cx, fmtDate, fmtTime, inr, ORDER_META, ORDER_STEPS, PAY_LABEL, type MenuItem, type Order } from "@/lib/utils";
import { patch, post, useAuth, useCart, useFetch, useToast } from "@/store";
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
  const [emailBillId, setEmailBillId] = useState<number | null>(null);
  const [emailBillAddr, setEmailBillAddr] = useState("");
  const [sendingBill, setSendingBill] = useState(false);

  // ── Rating state ──
  const [rateOrderId, setRateOrderId] = useState<number | null>(null);
  const [dishRatings, setDishRatings] = useState<Record<number, number>>({});
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<Record<number, boolean>>({});

  const active = useMemo(() => (orders ?? []).filter((o) => ["placed", "cooking", "ready"].includes(o.status)), [orders]);
  const past = useMemo(() => (orders ?? []).filter((o) => ["served", "completed", "cancelled"].includes(o.status)), [orders]);

  // Auto-open bill when arriving from QR code scan (?bill=CODE)
  useEffect(() => {
    if (!orders || !window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    const billCode = params.get("bill");
    if (billCode) {
      const match = orders.find((o) => o.code === billCode);
      if (match && (match.status === "served" || match.status === "completed")) {
        setViewBill(match);
        // Clean the URL so refresh doesn't re-open
        window.history.replaceState({}, "", "/orders");
      }
    }
  }, [orders]);

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

  // ── Unique items for rating ──
  const getUniqueItems = (o: Order) => {
    const seen = new Set<number>();
    return (o.items ?? []).filter((i) => {
      if (seen.has(i.menuItemId)) return false;
      seen.add(i.menuItemId);
      return true;
    });
  };

  const allRated = (o: Order) => {
    const unique = getUniqueItems(o);
    return unique.length > 0 && unique.every((i) => dishRatings[i.menuItemId] > 0);
  };

  const submitRatings = async (o: Order) => {
    setRatingBusy(true);
    const unique = getUniqueItems(o);
    try {
      for (const item of unique) {
        const r = dishRatings[item.menuItemId];
        if (r > 0) {
          await post("/api/data/ratings", { menuItemId: item.menuItemId, rating: r });
        }
      }
      setRatingSubmitted((prev) => ({ ...prev, [o.id]: true }));
      setRateOrderId(null);
      push("Thanks for rating your meal! 🙏", "ok");
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not submit ratings", "err");
    } finally {
      setRatingBusy(false);
    }
  };

  if (booting) return <div className="mx-auto max-w-3xl px-4 pt-10"><Skeleton className="h-40" /></div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 pt-10"><SignInPrompt /></div>;

  return (
    <div className="mx-auto max-w-3xl px-3 pt-6 sm:px-4 sm:pt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-brand">Live tracking</p>
          <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">My orders</h1>
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
              <article key={o.id} className="anim-up overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm">                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sand/50 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-extrabold tracking-wider text-ink sm:text-[15px]">{o.code}</span>
                    <Pill cls={ORDER_META[o.status].cls} dot={ORDER_META[o.status].dot}>
                      {ORDER_META[o.status].label}
                    </Pill>
                  </div>
                  <p className="text-[11px] font-bold text-ink2 sm:text-[12px]">
                    {o.type === "dine-in" && o.tableNo ? `Table ${o.tableNo} • ` : o.type === "takeaway" ? "Takeaway • " : ""}
                    placed {fmtTime(o.createdAt)}
                  </p>
                </div>
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  <StatusStepper status={o.status} />
                  <p className="mt-4 rounded-xl border border-dashed border-line bg-cream px-4 py-2.5 text-center text-[13px] font-bold text-ink">
                    {ORDER_META[o.status].friendly}
                    {o.status === "ready" && (o.type === "takeaway" ? " at the counter" : "")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="w-full text-[12px] font-semibold text-ink2 sm:w-auto sm:text-[12.5px]">
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
                  <button className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-sand/50 sm:px-5 sm:py-3.5" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <span className="flex items-center gap-2 sm:gap-3">
                      <span className="font-mono text-[12px] font-extrabold tracking-wider text-ink sm:text-[13.5px]">{o.code}</span>
                      <Pill cls={ORDER_META[o.status].cls} dot={ORDER_META[o.status].dot}>{ORDER_META[o.status].label}</Pill>
                    </span>
                    <span className="flex items-center gap-2 sm:gap-3">
                      <span className="hidden text-[12px] font-bold text-ink2 sm:inline">{fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}</span>
                      <span className="text-[13px] font-extrabold text-ink sm:text-[14px]">{inr(o.total)}</span>
                      <Icon name="chevron" size={15} className={cx("text-ink2 transition-transform", expanded === o.id && "rotate-180")} />
                    </span>
                  </button>
                  {expanded === o.id && (
                    <div className="anim-down border-t border-line px-4 py-3 sm:px-5 sm:py-4">
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
                        {(o.status === "served" || o.status === "completed") && (
                          <div className="flex gap-1.5 flex-wrap">
                            <Button size="xs" variant="outline" icon="receipt" onClick={() => setViewBill(o)}>
                              View Bill
                            </Button>
                            {emailBillId === o.id ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="email"
                                  placeholder="Enter email"
                                  value={emailBillAddr}
                                  onChange={(e) => setEmailBillAddr(e.target.value)}
                                  className="!h-7 w-40 text-[11px] rounded-lg"
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (!emailBillAddr.trim()) {
                                        push("Enter an email address", "err");
                                        return;
                                      }
                                      setSendingBill(true);
                                      try {
                                        await post("/api/data/send-bill", { orderId: o.id, email: emailBillAddr.trim() });
                                        push("Bill sent to " + emailBillAddr.trim(), "ok");
                                        setEmailBillId(null);
                                        setEmailBillAddr("");
                                      } catch (e) {
                                        push(e instanceof Error ? e.message : "Could not send", "err");
                                      } finally {
                                        setSendingBill(false);
                                      }
                                    }
                                  }}
                                />
                                <Button size="xs" variant="dark" loading={sendingBill} onClick={async () => {
                                  if (!emailBillAddr.trim()) {
                                    push("Enter an email address", "err");
                                    return;
                                  }
                                  setSendingBill(true);
                                  try {
                                    await post("/api/data/send-bill", { orderId: o.id, email: emailBillAddr.trim() });
                                    push("Bill sent to " + emailBillAddr.trim(), "ok");
                                    setEmailBillId(null);
                                    setEmailBillAddr("");
                                  } catch (e) {
                                    push(e instanceof Error ? e.message : "Could not send", "err");
                                  } finally {
                                    setSendingBill(false);
                                  }
                                }}>
                                  Send
                                </Button>
                                <button
                                  onClick={() => { setEmailBillId(null); setEmailBillAddr(""); }}
                                  className="text-[11px] font-bold text-ink2 hover:text-chili"
                                >
                                  <Icon name="x" size={14} />
                                </button>
                              </div>
                            ) : (
                              <Button size="xs" variant="outline" icon="mail" onClick={() => {
                                setEmailBillId(o.id);
                                setEmailBillAddr(user?.email ?? "");
                              }}>
                                Email Bill
                              </Button>
                            )}
                            <Button size="xs" variant="leaf" icon="refresh" onClick={() => reorder(o)}>
                              Order again
                            </Button>
                          </div>
                        )}

                        {/* ── Rate Dishes (only on completed orders) ── */}
                        {o.status === "completed" && (
                          <div className="mt-3 border-t border-dashed border-line pt-3">
                            {rateOrderId === o.id ? (
                              <div className="anim-down">
                                <div className="flex items-center gap-2 mb-3">
                                  <Icon name="star" size={14} className="text-gold" />
                                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink2">
                                    How was your meal?
                                  </span>
                                </div>
                                <div className="space-y-2.5">
                                  {getUniqueItems(o).map((item) => (
                                    <div key={item.menuItemId} className="flex items-center justify-between gap-3">
                                      <span className="text-[12px] font-semibold text-ink min-w-0 flex-1 truncate">
                                        {item.name}
                                      </span>
                                      <StarInput
                                        value={dishRatings[item.menuItemId] || 0}
                                        onChange={(v) => setDishRatings((prev) => ({ ...prev, [item.menuItemId]: v }))}
                                        size={18}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setRateOrderId(null); setDishRatings({}); }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="dark"
                                    loading={ratingBusy}
                                    disabled={!allRated(o)}
                                    onClick={() => submitRatings(o)}
                                  >
                                    {allRated(o) ? "Submit ratings" : "Rate all dishes"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              !ratingSubmitted[o.id] && (
                                <Button size="xs" variant="outline" icon="star" onClick={() => {
                                  setRateOrderId(o.id);
                                  setDishRatings({});
                                }}>
                                  Rate dishes
                                </Button>
                              )
                            )}
                            {ratingSubmitted[o.id] && (
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-gold">
                                <Icon name="star" size={14} className="text-gold" />
                                Rated ✓
                              </div>
                            )}
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
