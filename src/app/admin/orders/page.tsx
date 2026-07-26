"use client";
import { useMemo, useState } from "react";
import { Button, EmptyState, ErrorState, Icon, Input, Pill, Skeleton, type IconName } from "@/components/ui";
import { cx, fmtTime, inr, ORDER_META, PAY_LABEL, timeAgo, type Order } from "@/lib/utils";
import { patch, useFetch, useToast } from "@/store";

const TABS = ["all", "placed", "cooking", "ready", "served", "cancelled"] as const;

const NEXT: Record<string, { label: string; to: string; variant: "primary" | "leaf" | "dark"; icon: IconName }[]> = {
  placed: [{ label: "Start cooking", to: "cooking", variant: "primary", icon: "flame" }],
  cooking: [{ label: "Mark ready", to: "ready", variant: "leaf", icon: "bell" }],
  ready: [{ label: "Served / picked up", to: "served", variant: "dark", icon: "check" }],
};

/* ── tiny helper: status accent bar ── */
function StatusBar({ status }: { status: string }) {
  const color =
    status === "placed"
      ? "bg-brand"
      : status === "cooking"
        ? "bg-gold"
        : status === "ready"
          ? "bg-leaf"
          : status === "cancelled"
            ? "bg-chili"
            : "bg-ink2/30";
  return <span className={cx("absolute left-0 top-0 h-full w-[3px] rounded-l-2xl", color)} />;
}

export default function AdminOrders() {
  const { data: orders, loading, error, reload, setData } = useFetch<Order[]>("/api/data/orders", { interval: 10000 });
  const { push } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    for (const t of TABS.slice(1)) c[t] = (orders ?? []).filter((o) => o.status === t).length;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders ?? [];
    if (tab !== "all") list = list.filter((o) => o.status === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((o) => o.code.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s));
    }
    return list;
  }, [orders, tab, q]);

  const setStatus = async (o: Order, status: string, msg: string) => {
    setBusyId(o.id);
    const prev = orders;
    setData((orders ?? []).map((x) => (x.id === o.id ? { ...x, status: status as Order["status"], updatedAt: new Date().toISOString() } : x)));
    try {
      await patch(`/api/data/orders/${o.id}`, { status });
      push(msg);
    } catch (e) {
      if (prev) setData(prev);
      push(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setBusyId(null);
      reload(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-black tracking-tight text-ink">Order queue</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-ink2">Kitchen view • auto-refreshes every 10 s</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2/60" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8 text-[13px] rounded-lg" />
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-0.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-bold capitalize transition",
              tab === t
                ? "border-ink bg-ink text-cream shadow-sm"
                : "border-line bg-white/60 text-ink2 hover:border-brand/50 hover:text-brand",
            )}
          >
            {t}
            <span
              className={cx(
                "min-w-[18px] rounded-full px-1 text-center text-[10px] leading-[18px] font-extrabold",
                tab === t ? "bg-cream/20" : "bg-sand/80",
              )}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* ── order list container ── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm backdrop-blur-sm">
        {error ? (
          <div className="p-5">
            <ErrorState msg={error} retry={() => reload()} />
          </div>
        ) : loading && !orders ? (
          <div className="divide-y divide-line">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="receipt"
              title={q ? "No match found" : "No orders here"}
              body={q ? "Try a different code or customer name." : "Nothing in this bucket right now — the kitchen is breathing easy. 🧘"}
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((o) => {
              const isOpen = openId === o.id;
              const isPlaced = o.status === "placed";
              return (
                <li key={o.id} className="relative">
                  <StatusBar status={o.status} />

                  {/* ── compact row ── */}
                  <button
                    className={cx(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      isPlaced && "bg-brand/[0.03]",
                      "hover:bg-sand/30",
                    )}
                    onClick={() => setOpenId(isOpen ? null : o.id)}
                  >
                    {/* code */}
                    <span className="w-[72px] shrink-0 font-mono text-[12.5px] font-extrabold tracking-wide text-ink">
                      {o.code}
                    </span>

                    {/* customer + items */}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink leading-tight">
                        {o.customerName}
                        {o.type === "dine-in" && o.tableNo ? (
                          <span className="ml-1 text-ink2">• T{o.tableNo}</span>
                        ) : o.type === "takeaway" ? (
                          <span className="ml-1 text-ink2">• Takeaway</span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink2 leading-tight">
                        {(o.items ?? []).map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </span>
                    </div>

                    {/* time */}
                    {["placed", "cooking"].includes(o.status) && (
                      <span className="hidden shrink-0 text-[11px] font-bold text-brand sm:block">{timeAgo(o.createdAt)}</span>
                    )}

                    {/* pill */}
                    <Pill cls={ORDER_META[o.status].cls} dot={ORDER_META[o.status].dot}>
                      {ORDER_META[o.status].label}
                    </Pill>

                    {/* total */}
                    <span className="w-[72px] shrink-0 text-right text-[13px] font-extrabold tabular-nums text-ink">
                      {inr(o.total)}
                    </span>

                    {/* chevron */}
                    <Icon
                      name="chevron"
                      size={14}
                      className={cx("shrink-0 text-ink2/50 transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </button>

                  {/* ── expanded detail panel ── */}
                  {isOpen && (
                    <div className="anim-down border-t border-line bg-cream/50 px-4 py-4">
                      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                        {/* items column */}
                        <div>
                          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ink2">Items</p>
                          <ul className="mt-2 divide-y divide-dashed divide-line">
                            {(o.items ?? []).map((i) => (
                              <li key={i.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                                <span className="text-[12.5px] font-semibold text-ink">{i.qty}× {i.name}</span>
                                <span className="text-[12px] font-bold tabular-nums text-ink2">{inr(i.price * i.qty)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                            <span className="text-[11.5px] font-bold text-ink2">GST 5%</span>
                            <span className="text-[12px] font-bold tabular-nums text-ink2">{inr(o.tax)}</span>
                          </div>
                          {o.note && (
                            <p className="mt-3 rounded-lg border border-[#e6d3a3] bg-gold-soft/60 px-3 py-2 text-[12px] font-semibold text-[#7a5a12]">
                              📝 "{o.note}"
                            </p>
                          )}
                        </div>

                        {/* details column */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ink2">Details</p>
                            <ul className="mt-1.5 space-y-1 text-[12px] font-semibold text-ink">
                              <li className="flex items-center gap-1.5">
                                <Icon name="clock" size={12} className="text-ink2" />
                                {fmtTime(o.createdAt)} ({timeAgo(o.createdAt)})
                              </li>
                              <li className="flex items-center gap-1.5">
                                <Icon name="wallet" size={12} className="text-ink2" />
                                {PAY_LABEL[o.paymentMode]}
                              </li>
                              <li className="flex items-center gap-1.5">
                                <Icon name="table" size={12} className="text-ink2" />
                                {o.type === "dine-in" && o.tableNo ? `Table ${o.tableNo}` : "Counter pickup"}
                              </li>
                            </ul>
                          </div>

                          {/* action buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            {(NEXT[o.status] ?? []).map((a) => (
                              <Button
                                key={a.to}
                                size="xs"
                                variant={a.variant}
                                icon={a.icon}
                                loading={busyId === o.id}
                                onClick={() => setStatus(o, a.to, `${o.code} → ${ORDER_META[a.to].label} ✅`)}
                              >
                                {a.label}
                              </Button>
                            ))}
                            {["placed", "cooking", "ready"].includes(o.status) && (
                              <Button
                                size="xs"
                                variant="outline"
                                className="border-chili/30 text-chili hover:border-chili hover:bg-chili/5"
                                loading={busyId === o.id}
                                onClick={() => setStatus(o, "cancelled", `${o.code} cancelled`)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* footer count */}
        {filtered.length > 0 && (
          <div className="bg-cream/40 px-4 py-2 text-center text-[11px] font-semibold text-ink2">
            Showing {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
