"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState, Icon, Pill, Skeleton, type IconName } from "@/components/ui";
import { cx, fmtDateFull, fmtTime, inr, type InventoryItem, type Order } from "@/lib/utils";
import { useFetch } from "@/store";
import type { AiChurnAlert, AiStaffRecommendation } from "@/lib/ai";
import KpiHighlights from "@/components/admin/KpiHighlights";
import RevenueChart from "@/components/admin/RevenueChart";
import RecentOrdersCard from "@/components/admin/RecentOrdersCard";
import TopSellingCard from "@/components/admin/TopSellingCard";

type Stats = {
  todaySales: number;
  todayOrders: number;
  ySales: number;
  yOrders: number;
  avgOrder: number;
  yAvgOrder: number;
  staffOn: number;
  staffTotal: number;
  reservationsToday: number;
  repeatPct: number;
  active: number;
  statusCounts: Record<string, number>;
  week: { label: string; date: string; sales: number; orders: number }[];
  topItems: { name: string; qty: number; sales: number; image: string }[];
  lowStock: InventoryItem[];
  tables: { total: number; occupied: number; free: number };
};

const pct = (now: number, prev: number) =>
  prev > 0 ? Math.round(((now - prev) / prev) * 100) : null;

function Delta({ now, prev }: { now: number; prev: number }) {
  const p = pct(now, prev);
  if (p === null) return <span className="text-[11.5px] font-bold text-[#64748b]">vs yesterday —</span>;
  const up = p >= 0;
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#64748b]">
      vs yesterday
      <span className={cx("inline-flex items-center gap-0.5 font-extrabold", up ? "text-[#16a34a]" : "text-[#dc2626]")}>
        <svg width="10" height="10" viewBox="0 0 10 10" className={up ? "" : "rotate-180"}>
          <path d="M5 1l4 6H1l4-6z" fill="currentColor" />
        </svg>
        {Math.abs(p)}%
      </span>
    </span>
  );
}

export default function AdminOverview() {
  const router = useRouter();
  const { data, loading, error, reload } = useFetch<Stats>("/api/stats", { interval: 15000 });
  const { data: orders } = useFetch<Order[]>("/api/data/orders", { interval: 15000 });
  const { data: churn } = useFetch<AiChurnAlert[]>("/api/ai/churn", { interval: 60000 });
  const { data: staffRec } = useFetch<AiStaffRecommendation>("/api/ai/staff-optimizer", { interval: 300000 });
  const { data: vipCustomers } = useFetch<any[]>("/api/vip/customers", { interval: 60000 });
  const [page, setPage] = useState(0);
  const PAGE = 8;

  const paged = useMemo(() => {
    const list = orders ?? [];
    return list.slice(page * PAGE, page * PAGE + PAGE);
  }, [orders, page]);
  const totalPages = Math.max(1, Math.ceil((orders?.length ?? 0) / PAGE));

  if (error) return <ErrorState msg={error} retry={() => reload()} />;
  if (loading && !data)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid gap-4 xl:grid-cols-3"><Skeleton className="h-96 xl:col-span-2" /><Skeleton className="h-96" /></div>
      </div>
    );
  if (!data) return null;

  const d = data;
  const occPct = d.tables.total ? Math.round((d.tables.occupied / d.tables.total) * 100) : 0;
  const staffPct = d.staffTotal ? Math.round((d.staffOn / d.staffTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ============ KPI ROW ============ */}
      <KpiHighlights
        tablesOccupied={d.tables.occupied}
        tablesTotal={d.tables.total}
        tablesOccPct={occPct}
        tablesFree={d.tables.free}
        todayRevenue={d.todaySales}
        revenueDeltaPct={pct(d.todaySales, d.ySales) ?? 0}
        todayOrders={d.todayOrders}
        ordersDeltaPct={pct(d.todayOrders, d.yOrders) ?? 0}
        staffOn={d.staffOn}
        staffTotal={d.staffTotal}
        staffPresentPct={staffPct}
      />

      {/* ============ 👋 CHURN ALERTS ============ */}
      {churn && churn.length > 0 && (
        <div className="anim-up rounded-xl border border-[#ecc4ba] bg-chili-soft/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="frown" size={18} className="text-chili" />
              <h3 className="font-display text-[15px] font-bold text-chili">Churn Alert</h3>
            </div>
            <span className="rounded-full bg-chili/10 px-2.5 py-0.5 text-[11px] font-bold text-chili">
              {churn.filter((c) => c.risk === "high").length} high risk
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {churn.slice(0, 3).map((c) => (
              <div key={c.userId} className="flex items-center justify-between rounded-lg bg-white/70 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-extrabold text-ink">{c.name}</p>
                  <p className="text-[11px] font-semibold text-ink2">{c.daysSinceLastOrder} days ago • {c.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-chili">{c.risk === "high" ? "🔴 High" : "🟡 Medium"}</p>
                  <p className="text-[9.5px] font-medium text-ink2/70">{c.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ ORDERS + CHART ============ */}
      <div className="anim-up relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.02),0_1px_2px_rgba(15,23,42,0.03),0_4px_8px_-2px_rgba(15,23,42,0.05),0_16px_32px_-6px_rgba(15,23,42,0.08)]">
        {/* Premium top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a87c]/50 to-transparent" />
        <div className="grid gap-0 xl:grid-cols-3">

          {/* Recent Orders */}
          <div className="xl:col-span-2">
            <RecentOrdersCard
              paged={paged}
              totalCount={orders?.length ?? 0}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRowClick={(order) => router.push("/admin/orders")}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col relative">
            {/* Premium vertical separator (right side) */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

            {/* Revenue Chart */}
            <div className="flex-1">
              <RevenueChart
                week={d.week}
                revenueDeltaPct={pct(d.todaySales, d.ySales) ?? undefined}
              />
            </div>

            {/* Premium horizontal separator */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

            {/* Top Sellers */}
            <div className="flex-1">
              <TopSellingCard items={d.topItems} />
            </div>
          </div>
        </div>
      </div>

      {/* ============ 🪙 VIP CUSTOMERS ============ */}
      {vipCustomers && vipCustomers.length > 0 && (
        <div className="anim-up rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="star" size={18} className="text-amber-500" />
              <h3 className="font-display text-[15px] font-bold text-amber-800">VIP Members</h3>
            </div>
            <Pill cls="border-amber-300 bg-amber-100 text-amber-800">
              {vipCustomers.length} active
            </Pill>
          </div>
          <div className="mt-3 space-y-2">
            {vipCustomers.map((v: any) => (
              <div key={v.userId} className="flex items-center justify-between rounded-lg bg-white/80 px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-[11px] font-extrabold text-white shadow-sm">
                    {v.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-ink">
                      {v.name}
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-700">VIP</span>
                    </p>
                    <p className="text-[10.5px] font-semibold text-ink2/70">{v.vipId}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-amber-700 capitalize">{v.plan}</p>
                  <p className="text-[10px] font-medium text-ink2/60">{v.daysLeft} days left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ 📊 STAFF OPTIMIZER ============ */}
      {staffRec && (
        <div className="anim-up rounded-xl border border-[#d4e3d1] bg-[#f0f9ee] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="users" size={18} className="text-leaf" />
              <h3 className="font-display text-[15px] font-bold text-leaf-deep">Staff Optimizer</h3>
            </div>
            <span className={cx(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              staffRec.confidence === "high" ? "bg-leaf-soft text-leaf-deep" : "bg-sand text-ink2",
            )}>
              {staffRec.confidence} confidence
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/80 px-3.5 py-2.5 text-center">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink2">Tomorrow</p>
              <p className="mt-0.5 font-display text-[17px] font-black text-ink">{staffRec.dayOfWeek}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3.5 py-2.5 text-center">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink2">Predicted</p>
              <p className="mt-0.5 font-display text-[17px] font-black text-leaf-deep">{staffRec.predictedOrders} orders</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3.5 py-2.5 text-center">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink2">Staff needed</p>
              <p className="mt-0.5 font-display text-[17px] font-black text-ink">{staffRec.recommendedTotal} ({staffRec.recommendedChefs} chef{staffRec.recommendedChefs > 1 ? "s" : ""} + {staffRec.recommendedWaiters} waiter{staffRec.recommendedWaiters > 1 ? "s" : ""})</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-ink2/70">{staffRec.reasoning}</p>
        </div>
      )}
    </div>
  );
}
