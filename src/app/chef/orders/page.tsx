"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Logo, Skeleton, type IconName } from "@/components/ui";
import { cx, ORDER_META, timeAgo, type Order, type OrderItem } from "@/lib/utils";
import { patch, useAuth, useFetch, useToast } from "@/store";

const KITCHEN_STEPS = ["placed", "cooking", "ready"] as const;

const NEXT: Record<string, { label: string; to: string; variant: "primary" | "leaf" | "dark"; icon: IconName }[]> = {
  placed: [{ label: "Start cooking", to: "cooking", variant: "primary", icon: "flame" as const }],
  cooking: [{ label: "Mark ready", to: "ready", variant: "leaf", icon: "bell" as const }],
  ready: [{ label: "Served", to: "served", variant: "dark", icon: "check" as const }],
};

export default function ChefOrders() {
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const { data: orders, loading, reload } = useFetch<Order[]>("/api/data/orders", { interval: 6000 });
  const [busyId, setBusyId] = useState<number | null>(null);

  // Redirect chef away if they somehow end up elsewhere
  useEffect(() => {
    if (user && user.role !== "chef") router.push("/");
  }, [user, router]);

  // Only show active kitchen orders
  const active = useMemo(() => (orders ?? []).filter((o) => KITCHEN_STEPS.includes(o.status as typeof KITCHEN_STEPS[number])), [orders]);
  const recentServed = useMemo(() => (orders ?? []).filter((o) => o.status === "served").slice(0, 5), [orders]);

  const advance = async (o: Order, status: string) => {
    setBusyId(o.id);
    try {
      await patch(`/api/data/orders/${o.id}`, { status });
      push(`${o.code} → ${ORDER_META[status as keyof typeof ORDER_META]?.label ?? status}`);
      reload(true);
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setBusyId(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "placed": return "border-l-brand";
      case "cooking": return "border-l-gold";
      case "ready": return "border-l-leaf";
      default: return "border-l-line";
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-5">
      {/* Header */}
      <header className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Logo small />
          <div className="h-5 w-px bg-line" />
          <div>
            <p className="text-[12px] font-bold text-ink">Kitchen</p>
            <p className="text-[9px] font-semibold text-ink2">Chef view</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-line bg-sand/50 px-2.5 py-1 text-[11px] font-bold tabular-nums text-brand">
            <Icon name="flame" size={11} className="inline" /> {active.length}
          </span>
          {user && (
            <span className="hidden sm:inline text-[10px] font-semibold text-ink2">
              {user.name.split(" ")[0]}
            </span>
          )}
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="rounded-lg px-2 py-1 text-[10px] font-semibold text-ink2 transition hover:bg-sand hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      {loading && !orders ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : active.length === 0 && recentServed.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-white/40 text-brand">
            <Icon name="tray" size={20} />
          </div>
          <h2 className="mt-3 font-display text-lg font-bold text-ink">All clear!</h2>
          <p className="mt-0.5 text-[13px] font-medium text-ink2">No orders in the queue right now.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {/* Active orders section */}
          {active.length > 0 && (
            <>
              <div className="flex items-center gap-2 border-b border-line bg-sand/40 px-4 py-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink2">Active orders — {active.length}</span>
              </div>
              {active.map((o, idx) => (
                <div key={o.id} className={cx(idx > 0 && "border-t border-line")}>
                  <div className={cx("border-l-[3px]", statusColor(o.status))}>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 px-4 pt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-extrabold tracking-wider text-ink">{o.code}</span>
                        <span className={cx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          o.status === "placed" ? "bg-gold-soft text-[#7a5a12]" :
                          o.status === "cooking" ? "bg-brand-soft text-brand-deep" :
                          "bg-leaf-soft text-leaf-deep"
                        )}>
                          {ORDER_META[o.status]?.label ?? o.status}
                        </span>
                        {o.type === "takeaway" && (
                          <span className="rounded-full bg-sand px-1.5 py-0.5 text-[9px] font-bold text-ink2">Takeaway</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-ink2">
                        {o.type === "dine-in" && o.tableNo && <span>T{o.tableNo}</span>}
                        <span className="text-ink2/60">{timeAgo(o.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 px-4 pb-2.5 pt-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-ink2">
                          {(o.items ?? []).map((i: OrderItem) => `${i.qty}× ${i.name}`).join(", ")}
                        </p>
                        {o.note && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#7a5a12]">
                            <Icon name="note" size={10} className="text-gold" />
                            {o.note}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {(NEXT[o.status] ?? []).map((a) => (
                          <Button
                            key={a.to}
                            size="xs"
                            variant={a.variant}
                            icon={a.icon}
                            loading={busyId === o.id}
                            onClick={() => advance(o, a.to)}
                          >
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Separator between active and served */}
          {active.length > 0 && recentServed.length > 0 && (
            <div className="border-t border-dashed border-line/60" />
          )}

          {/* Recent served section */}
          {recentServed.length > 0 && (
            <>
              <div className="flex items-center gap-2 border-b border-line bg-sand/30 px-4 py-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink2/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink2/60">Recently served</span>
              </div>
              <div className="divide-y divide-line/60">
                {recentServed.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] font-bold text-ink2/50">{o.code}</span>
                      {o.tableNo && <span className="text-[11px] font-semibold text-ink2/60">Table {o.tableNo}</span>}
                    </div>
                    <span className="shrink-0 text-[9px] font-semibold text-ink2/40">{timeAgo(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
