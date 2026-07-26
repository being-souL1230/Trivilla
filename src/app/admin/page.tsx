"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState, Icon, Skeleton, type IconName } from "@/components/ui";
import { cx, fmtTime, inr, type InventoryItem, type Order } from "@/lib/utils";
import { useFetch } from "@/store";
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
    </div>
  );
}
