"use client";
import { cx } from "@/lib/utils";
import { useId, useMemo } from "react";

/* ================= Star Display ================= */

export function Stars({
  rating,
  size = 13,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const stars = useMemo(() => {
    const clamped = Math.max(0, Math.min(5, rating));
    const full = Math.floor(clamped);
    const remainder = clamped - full;
    const hasHalf = remainder >= 0.25;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return { full, half: hasHalf, empty };
  }, [rating]);

  return (
    <span className={cx("inline-flex items-center gap-[1px]", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: stars.full }, (_, i) => (
        <svg key={`f-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="#be8f35" stroke="#be8f35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {stars.half && (
        <svg width={size} height={size} viewBox="0 0 24 24" stroke="#be8f35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="#be8f35" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfStar)" />
        </svg>
      )}
      {Array.from({ length: stars.empty }, (_, i) => (
        <svg key={`e-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d8c9a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ================= Rating Badge (compact, for DishCard) ================= */

export function RatingBadge({
  avg,
  count,
  size = 11,
}: {
  avg: number;
  count: number;
  size?: number;
}) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold-soft/70 px-1.5 py-0.5 text-[10px] font-bold text-[#7a5a12]">
      <Stars rating={avg} size={size} />
      <span className="tabular-nums">{avg.toFixed(1)}</span>
      <span className="text-[#7a5a12]/50">({count})</span>
    </span>
  );
}

/* ================= Interactive Star Input (1-5, 0.5 step) ================= */

export function StarInput({
  value,
  onChange,
  size = 24,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  className?: string;
}) {
  const uid = useId();

  return (
    <span className={cx("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = value >= s;
        const half = !filled && value >= s - 0.5;
        const gradId = `${uid}-half-${s}`;

        return (
          <span key={s} className="relative inline-flex">
            <button
              type="button"
              onClick={() => onChange(s - 0.5)}
              className="absolute left-0 top-0 z-10 h-full w-1/2 cursor-pointer"
              aria-label={`${s - 0.5} stars`}
            />
            <button
              type="button"
              onClick={() => onChange(s)}
              className="absolute right-0 top-0 z-10 h-full w-1/2 cursor-pointer"
              aria-label={`${s} stars`}
            />
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              stroke={filled || half ? "#be8f35" : "#d8c9a8"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-150"
            >
              <defs>
                <linearGradient id={gradId}>
                  <stop offset={half ? "50%" : "0%"} stopColor="#be8f35" />
                  <stop offset={half ? "50%" : "0%"} stopColor="transparent" />
                </linearGradient>
              </defs>
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                fill={filled ? "#be8f35" : half ? `url(#${gradId})` : "none"}
                className="transition-colors duration-150"
              />
            </svg>
          </span>
        );
      })}
    </span>
  );
}
