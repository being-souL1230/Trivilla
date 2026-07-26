"use client";
import { Icon, type IconName } from "@/components/ui";
import { cx, inr } from "@/lib/utils";

/* ---- premium delta pill: green/red arrow + % vs yesterday ---- */
function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#8994a8]">
      vs yesterday
      <span className={cx("inline-flex items-center gap-0.5 font-extrabold", up ? "text-[#16a34a]" : "text-[#dc2626]")}>
        <svg width="9" height="9" viewBox="0 0 10 10" className={up ? "" : "rotate-180"}>
          <path d="M5 1l4 6H1l4-6z" fill="currentColor" />
        </svg>
        {Math.abs(pct)}%
      </span>
    </span>
  );
}

type Item = {
  label: string;
  value: string;
  suffix?: string;
  sub: React.ReactNode;
  icon: IconName;
  tint: string;
};

type KpiHighlightsProps = {
  tablesOccupied?: number;
  tablesTotal?: number;
  tablesOccPct?: number;
  tablesFree?: number;
  todayRevenue?: number;
  revenueDeltaPct?: number;
  todayOrders?: number;
  ordersDeltaPct?: number;
  staffOn?: number;
  staffTotal?: number;
  staffPresentPct?: number;
};

export default function KpiHighlights({
  tablesOccupied = 1,
  tablesTotal = 12,
  tablesOccPct = 8,
  tablesFree = 9,
  todayRevenue = 408,
  revenueDeltaPct = 83,
  todayOrders = 1,
  ordersDeltaPct = 75,
  staffOn = 5,
  staffTotal = 6,
  staffPresentPct = 83,
}: KpiHighlightsProps) {
  const items: Item[] = [
    {
      label: "Active Tables",
      value: String(tablesOccupied),
      suffix: `/ ${tablesTotal}`,
      sub: <span className="text-[11.5px] font-bold text-[#8994a8]">{tablesOccPct}% Occupied • {tablesFree} free</span>,
      icon: "table",
      tint: "bg-[#f0f1f3] text-[#7a8599]",
    },
    {
      label: "Today's Revenue",
      value: inr(todayRevenue),
      sub: <Delta pct={revenueDeltaPct} />,
      icon: "wallet",
      tint: "bg-[#f0f3f1] text-[#6b8a7a]",
    },
    {
      label: "Today's Orders",
      value: String(todayOrders),
      sub: <Delta pct={ordersDeltaPct} />,
      icon: "receipt",
      tint: "bg-[#f3f1ef] text-[#8a7d6b]",
    },
    {
      label: "Staff Attendance",
      value: String(staffOn),
      suffix: `/ ${staffTotal}`,
      sub: <span className="text-[11.5px] font-bold text-[#8994a8]">{staffPresentPct}% Present today</span>,
      icon: "users",
      tint: "bg-[#f1f0f3] text-[#7a7599]",
    },
  ];

  return (
    <div className="isolate overflow-hidden border border-[#e7ebf3] bg-gradient-to-b from-white to-[#fafbfd] shadow-[0_1px_2px_rgba(15,47,87,0.04),0_20px_44px_-24px_rgba(15,47,87,0.22)] ring-1 ring-inset ring-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.label} className="relative flex items-center gap-4 px-6 py-6 transition hover:bg-[#f8fafc]/70">
            {i !== 0 && (
              <>
                {/* mobile: fading horizontal separator */}
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#dde4f0] to-transparent sm:hidden" />
                {/* desktop/tablet: fading vertical separator */}
                <span className="pointer-events-none absolute left-0 top-1/2 hidden h-[64%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#dde4f0] to-transparent sm:block" />
              </>
            )}
            <span className={cx("grid h-13 w-13 shrink-0 place-items-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]", item.tint)}>
              <Icon name={item.icon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold tracking-wide text-[#7c8aa0]">{item.label}</p>
              <p className="mt-1 truncate text-[25px] font-extrabold leading-none tracking-tight text-[#0e2f57]">
                {item.value}
                {item.suffix && <span className="text-[14px] font-bold text-[#a8b4c6]"> {item.suffix}</span>}
              </p>
              <div className="mt-1.5">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
