"use client";
import { useMemo, useState } from "react";
import { Button, EmptyState, ErrorState, Icon, Input, Pill, Skeleton } from "@/components/ui";
import { cx, fmtDate, fmtTime, inr, PAY_LABEL, type Order } from "@/lib/utils";
import { useFetch } from "@/store";
import BillInvoice from "@/components/BillInvoice";

export default function AdminBills() {
  const { data: bills, loading, error, reload } = useFetch<Order[]>("/api/data/bills", { interval: 15000 });
  const [q, setQ] = useState("");
  const [viewBill, setViewBill] = useState<Order | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = bills ?? [];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.code.toLowerCase().includes(s) ||
          b.customerName.toLowerCase().includes(s) ||
          (b.tableNo && `t${b.tableNo}`.includes(s)),
      );
    }
    return sortAsc ? [...list].reverse() : list;
  }, [bills, q, sortAsc]);

  const totalRevenue = useMemo(
    () => (bills ?? []).reduce((s, b) => s + b.total, 0),
    [bills],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Bills & Invoices</h2>
          <p className="text-[12px] font-semibold text-ink2">
            {bills ? `${bills.length} paid bills · ${inr(totalRevenue)} total revenue` : "All settled orders"}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2/60" />
            <Input placeholder="Search bills…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8 text-[13px] rounded-lg" />
          </div>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className={cx(
              "grid h-9 w-9 place-items-center rounded-lg border transition text-[12px] font-bold",
              sortAsc ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink2 hover:border-brand",
            )}
            title={sortAsc ? "Newest first" : "Oldest first"}
          >
            <Icon name="chevron" size={13} className={sortAsc ? "" : "rotate-180"} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Bills", value: bills?.length ?? 0, icon: "wallet" as const },
          { label: "Revenue", value: inr(totalRevenue), icon: "chart" as const },
          { label: "Avg. Bill", value: bills?.length ? inr(Math.round(totalRevenue / bills.length)) : inr(0), icon: "star" as const },
          { label: "Today", value: (bills ?? []).filter((b) => new Date(b.createdAt).toDateString() === new Date().toDateString()).length, icon: "calendar" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-white/70 px-3.5 py-3 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink2">
              <Icon name={s.icon} size={12} className="text-gold" /> {s.label}
            </p>
            <p className="mt-0.5 font-display text-xl font-black text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bills list */}
      <div className="mt-4 rounded-2xl border border-line bg-white/75">
        {error ? (
          <div className="p-4"><ErrorState msg={error} retry={() => reload()} /></div>
        ) : loading && !bills ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="wallet"
              title={q ? "No matching bills" : "No bills yet"}
              body={q ? "Try a different search term." : "Bills will appear here once orders are marked as served."}
            />
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line bg-sand/60 text-[11px] font-extrabold uppercase tracking-wider text-ink2">
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 hidden md:table-cell">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => (
                  <tr key={b.id} className={cx(
                    "border-b border-line/60 transition hover:bg-cream/70",
                    idx === 0 && "rounded-t-2xl",
                    idx === filtered.length - 1 && "rounded-b-2xl border-0",
                  )}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0f4e8] text-leaf-deep">
                          <Icon name="wallet" size={16} />
                        </span>
                        <div>
                          <p className="text-[13px] font-extrabold text-ink">{b.code}</p>
                          <p className="text-[11px] font-bold text-ink2">
                            {b.type === "dine-in" && b.tableNo ? `T${b.tableNo}` : "Takeaway"} · {b.items?.length ?? 0} item{(b.items?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-extrabold text-ink">{b.customerName}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[12.5px] font-bold text-ink2">{fmtDate(b.createdAt)}</p>
                      <p className="text-[11px] font-semibold text-ink2/70">{fmtTime(b.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Pill cls="bg-sand text-ink2 border-line text-[10.5px]">{PAY_LABEL[b.paymentMode]}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-display text-[15px] font-bold text-leaf-deep">{inr(b.total)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="outline" icon="receipt" onClick={() => setViewBill(b)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill modal */}
      {viewBill && (
        <BillInvoice order={viewBill} open={!!viewBill} onClose={() => setViewBill(null)} adminView />
      )}
    </div>
  );
}
