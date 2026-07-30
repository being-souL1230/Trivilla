"use client";
import { Icon } from "@/components/ui";
import { cx, fmtDateFull } from "@/lib/utils";
import type { VipMembershipInfo } from "@/lib/vip";

export default function VipCard({
  membership,
  onClose,
}: {
  membership: VipMembershipInfo;
  onClose?: () => void;
}) {
  // Total days for plan
  const totalDays = membership.plan === "yearly" ? 365 : 30;
  const progress = Math.max(0, Math.min(1, (totalDays - membership.daysLeft) / totalDays));
  const pct = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-pop relative w-full max-w-sm">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -right-2 -top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink text-cream shadow-lg transition hover:scale-110"
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        )}

        {/* ── Golden VIP Card ── */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #1a1206 0%, #3d2e12 30%, #6b5018 60%, #3d2e12 85%, #1a1206 100%)",
          }}
        >
          {/* Shine overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -inset-10 animate-vip-shine"
              style={{
                background: "linear-gradient(105deg, transparent 20%, rgba(255,215,0,0.12) 45%, rgba(255,215,0,0.08) 50%, transparent 75%)",
                transform: "skewX(-12deg)",
              }}
            />
            {/* Sparkle dots */}
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-amber-300/40 animate-pulse"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.7}s`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 p-5">
            {/* Top bar */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="star" size={16} className="text-amber-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-400/80">
                    VIP Membership
                  </span>
                </div>
                <p className="mt-1 font-display text-xl font-black tracking-tight text-amber-300">
                  Trivilla
                </p>
              </div>
              <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  {membership.plan}
                </span>
              </div>
            </div>

            {/* ID */}
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-black/30 px-3.5 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400/60">VIP ID</p>
              <p className="font-mono text-[17px] font-extrabold tracking-widest text-amber-300">
                {membership.vipId}
              </p>
            </div>

            {/* Name */}
            <p className="mt-3 font-display text-[17px] font-bold tracking-tight text-cream">
              {membership.vipId}
            </p>

            {/* Validity */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-400/15 bg-black/20 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-400/60">Valid from</p>
                <p className="mt-0.5 text-[12px] font-bold text-cream/90">{fmtDateFull(membership.startDate)}</p>
              </div>
              <div className="rounded-xl border border-amber-400/15 bg-black/20 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-400/60">Expires</p>
                <p className="mt-0.5 text-[12px] font-bold text-cream/90">{fmtDateFull(membership.endDate)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400/70">
                <span>{membership.daysLeft} days left</span>
                <span>{pct}% used</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Discount summary */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Food", value: "35%", sub: "off" },
                { label: "Drinks", value: "50%", sub: "off" },
                { label: "Peak", value: "50%", sub: "22:00-24:00" },
              ].map((d) => (
                <div key={d.label} className="rounded-xl border border-amber-400/15 bg-amber-400/5 px-2 py-2 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400/70">{d.label}</p>
                  <p className="font-display text-[15px] font-black text-amber-300">{d.value}</p>
                  <p className="text-[9px] font-bold text-amber-400/50">{d.sub}</p>
                </div>
              ))}
            </div>

            {/* Active badge */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[12px] font-extrabold text-emerald-400">Active</span>
              <span className="text-[11px] font-medium text-emerald-400/60">• Unlimited visits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
