"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { cx } from "@/lib/utils";

type TopItem = { name: string; qty: number; sales: number; image: string };

type TopSellingCardProps = {
  items: TopItem[];
};

export default function TopSellingCard({ items }: TopSellingCardProps) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="font-display text-[16px] font-bold text-[#0e2f57]">Top Selling Items</h2>
        <Link href="/admin/menu" className="text-[12px] font-extrabold text-[#2563eb] hover:underline">View All</Link>
      </div>

      <ul className="px-3 pb-5">
        {items.length === 0 && (
          <p className="py-8 text-center text-[12.5px] font-semibold text-[#94a3b8]">Sales will rank here once orders come in.</p>
        )}
        {items.map((t, i) => {
          const isTop = i === 0;
          return (
            <li
              key={t.name}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#f8fafc]"
            >
              <span
                className={cx(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-extrabold",
                  isTop ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#f1f5f9] text-[#94a3b8]",
                )}
              >
                {i + 1}
              </span>

              {t.image ? (
                <img
                  src={t.image}
                  alt=""
                  className={cx(
                    "h-10 w-10 shrink-0 rounded-lg object-cover",
                    isTop && "ring-2 ring-[#fde68a] ring-offset-2",
                  )}
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
                  <Icon name="chef" size={16} />
                </span>
              )}

              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#334155]">{t.name}</span>

              <span className={cx("text-[14px] font-extrabold tabular-nums", isTop ? "text-[#2563eb]" : "text-[#0e2f57]")}>
                {t.qty}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
