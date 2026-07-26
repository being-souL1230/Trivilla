"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { cx, fmtTime, inr, type Order } from "@/lib/utils";

const TBL: Record<string, { l: string; cls: string; dot: string }> = {
  placed: { l: "New", cls: "bg-[#eef2ff] text-[#4338ca]", dot: "bg-[#4338ca]" },
  cooking: { l: "Preparing", cls: "bg-[#eff6ff] text-[#1d4ed8]", dot: "bg-[#1d4ed8]" },
  ready: { l: "Ready", cls: "bg-[#fffbeb] text-[#b45309]", dot: "bg-[#b45309]" },
  served: { l: "Completed", cls: "bg-[#f0fdf4] text-[#15803d]", dot: "bg-[#15803d]" },
  cancelled: { l: "Cancelled", cls: "bg-[#fef2f2] text-[#b91c1c]", dot: "bg-[#b91c1c]" },
};

type RecentOrdersCardProps = {
  paged: Order[];
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (order: Order) => void;
};

export default function RecentOrdersCard({
  paged, totalCount, page, totalPages, onPageChange, onRowClick,
}: RecentOrdersCardProps) {
  const PAGE = 8;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="font-display text-[16px] font-bold text-[#0e2f57]">Recent Orders</h2>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-[#dbe3f0] px-3.5 py-1.5 text-[12px] font-extrabold text-[#2563eb] transition hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
        >
          View All Orders
        </Link>
      </div>

      <div className="scroll-thin overflow-x-auto border-t border-[#eef2f8]">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[#eef2f8] bg-[#f8fafc]/70 text-[11px] font-extrabold uppercase tracking-wide text-[#94a3b8]">
              <th className="px-6 py-3">Order ID</th>
              <th className="px-3 py-3">Table</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Items</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-6 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((o) => (
              <tr
                key={o.id}
                onClick={() => onRowClick(o)}
                className="cursor-pointer border-b border-[#f1f5f9] text-[13px] transition last:border-0 hover:bg-[#f8fafc]"
              >
                <td className="px-6 py-3.5 font-extrabold text-[#0e2f57]">#{o.code}</td>
                <td className="px-3 py-3.5 font-bold text-[#64748b]">{o.tableNo ? `T-${String(o.tableNo).padStart(2, "0")}` : "—"}</td>
                <td className="px-3 py-3.5 font-semibold text-[#334155]">{o.customerName}</td>
                <td className="px-3 py-3.5 font-bold text-[#64748b]">{(o.items ?? []).reduce((s, i) => s + i.qty, 0)}</td>
                <td className="px-3 py-3.5 text-right font-extrabold text-[#0e2f57]">{inr(o.total)}</td>
                <td className="px-3 py-3.5">
                  <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-extrabold", TBL[o.status]?.cls ?? TBL.placed.cls)}>
                    <span className={cx("h-1.5 w-1.5 rounded-full", TBL[o.status]?.dot ?? TBL.placed.dot)} />
                    {TBL[o.status]?.l ?? o.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-semibold text-[#94a3b8]">{fmtTime(o.createdAt)}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-[13px] font-semibold text-[#94a3b8]">No orders yet — they'll appear here live.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f8] px-6 py-4">
        <p className="text-[12px] font-bold text-[#94a3b8]">
          Showing {totalCount === 0 ? 0 : page * PAGE + 1} to {Math.min((page + 1) * PAGE, totalCount)} of {totalCount} orders
        </p>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#dbe3f0] text-[#475569] transition enabled:hover:bg-[#f1f5f9] disabled:opacity-40"
            aria-label="Previous page"
          >
            <Icon name="chevron" size={14} className="rotate-90" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={cx(
                "grid h-8 w-8 place-items-center rounded-lg text-[12.5px] font-extrabold transition",
                page === i ? "bg-[#0e2f57] text-white" : "border border-[#dbe3f0] text-[#475569] hover:bg-[#f1f5f9]",
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#dbe3f0] text-[#475569] transition enabled:hover:bg-[#f1f5f9] disabled:opacity-40"
            aria-label="Next page"
          >
            <Icon name="chevron" size={14} className="-rotate-90" />
          </button>
        </div>
      </div>
    </>
  );
}
