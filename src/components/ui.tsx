"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";

/* ================= icons (inline SVG, stroke style) ================= */

const P: Record<string, ReactNode> = {
  logo: (
    <>
      <path d="M12 3c1.8 2.2 2.8 3.9 2.8 5.6A2.8 2.8 0 0 1 12 11.4a2.8 2.8 0 0 1-2.8-2.8C9.2 6.9 10.2 5.2 12 3Z" fill="currentColor" stroke="none" />
      <path d="M5 13.5h14l-1.2 4.2a2 2 0 0 1-1.9 1.4H8.1a2 2 0 0 1-1.9-1.4L5 13.5Z" />
      <path d="M3 21h18" />
    </>
  ),
  burger: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  tray: (
    <>
      <path d="M6 7h12l1.5 3H4.5L6 7Z" />
      <path d="M4.5 10h15v6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-6Z" />
      <path d="M9 3.5h6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.8-3.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  flame: (
    <path d="M12 3c1 3 5 4.6 5 9a5 5 0 0 1-10 0c0-1.8.7-3.2 1.7-4.5.4 1 1 1.7 1.8 2C10 7 10.6 4.6 12 3Z" />
  ),
  leaf: (
    <>
      <path d="M5 19C5 9 12 5 20 5c0 9-5 14-13 14" />
      <path d="M5 19c2-5 6-8 10-9" />
    </>
  ),
  table: (
    <>
      <circle cx="12" cy="10" r="5.5" />
      <path d="M12 15.5V21M7 21h10M5 6.5 3.5 5M19 6.5 20.5 5" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  box: (
    <>
      <path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 19.5a6 6 0 0 1 12 0M16 5.5a3.5 3.5 0 0 1 0 6.6M17.5 14.5a6 6 0 0 1 3.5 5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.5 20 7 8 19l-4.5 1L4.5 15.5 16.5 3.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  check: <path d="M4.5 12.5 10 18 19.5 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12.5l2.8 2.8L16.5 9.5" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10h16M8 3v5M16 3v5" />
    </>
  ),
  phone: (
    <path d="M5 4h4l1.5 4.5-2.2 1.7a13 13 0 0 0 5.5 5.5l1.7-2.2L20 15v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.5 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  ),
  sparkle: (
    <>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </>
  ),
  chef: (
    <>
      <path d="M7 13a4 4 0 0 1-.9-7.9 5 5 0 0 1 9.4-1.2A4.2 4.2 0 0 1 17 12v5H7v-4Z" />
      <path d="M7 17h10M7 20h10" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 3v4h-4" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  alert: (
    <>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4M12 17.2v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8v.3" />
    </>
  ),
  home: (
    <>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M16 6V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M15 12.5h3" />
    </>
  ),
  google: (
    <path
      d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z M12 21.5c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A9.9 9.9 0 0 0 12 21.5Z M6.4 13.4a6 6 0 0 1 0-3.8V7H3.1a10 10 0 0 0 0 9l3.3-2.6Z M12 6.4c1.5 0 2.8.5 3.8 1.5L18.7 5A9.6 9.6 0 0 0 12 2.5 9.9 9.9 0 0 0 3.1 7l3.3 2.6C7.2 7.2 9.4 6.4 12 6.4Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  bowl: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" />
      <path d="M8 11c0-3 1.5-5 4-7 2.5 2 4 4 4 7" />
    </>
  ),
  cup: (
    <>
      <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16M7.5 4.5c.6.8.6 1.7 0 2.5M10.5 4.5c.6.8.6 1.7 0 2.5M13.5 4.5c.6.8.6 1.7 0 2.5" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9c-2.6 0-4-1.6-4-4 2.6 0 4 1.6 4 4Zm0 0c2.6 0 4-1.6 4-4-2.6 0-4 1.6-4 4Zm0 5c-2.6 0-4-1.6-4-4 2.6 0 4 1.6 4 4Zm0 0c2.6 0 4-1.6 4-4-2.6 0-4 1.6-4 4Z" />
    </>
  ),
  book: (
    <>
      <path d="M12 6c-1.8-1.6-4.4-2-8-2v14c3.6 0 6.2.4 8 2 1.8-1.6 4.4-2 8-2V4c-3.6 0-6.2.4-8 2Z" />
      <path d="M12 6v14" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 8 21l4-2.2L16 21l-1-7.5" />
    </>
  ),
  hands: (
    <>
      <path d="M7 10V4a1 1 0 0 1 2 0v6" />
      <path d="M11 10V3a1 1 0 0 1 2 0v7" />
      <path d="M15 10V5a1 1 0 0 1 2 0v5" />
      <path d="M7 14c0-2 1-3 3-3h4c2 0 3 1 3 3v1c0 4-3 6-5 6a7 7 0 0 1-5-3" />
    </>
  ),
  heart: (
    <path d="M20.5 9.5C20.5 5.5 17 4 14.5 5.5 13 6.5 12 8 12 8s-1-1.5-2.5-2.5C7 4 3.5 5.5 3.5 9.5 3.5 13 7 16 12 19.5c5-3.5 8.5-6.5 8.5-10Z" />
  ),
  mail: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 8l9 5.5L21 8" />
    </>
  ),
  note: (
    <>
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 10h8M8 14h5M10 2v4h4V2" />
    </>
  ),
  wave: (
    <>
      <path d="M3 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5Z" />
      <path d="M7 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5Z" />
      <path d="M11 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </>
  ),
  door: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2h3" />
      <path d="M10 12h0M9 4v4h6V4" />
    </>
  ),
  window: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </>
  ),
  frown: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 15c1.3-1 2.8-1.5 4-1.5s2.7.5 4 1.5M8.5 9.5v.5M15.5 9.5v.5" />
    </>
  ),
  cake: (
    <>
      <path d="M4 15h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z" />
      <path d="M4 12h16v3H4Z" />
      <path d="M8 12V9M12 12V9M16 12V9" />
      <path d="M10 7.5C10 5 12 3 12 3s2 2 2 4.5" />
    </>
  ),
  celebration: (
    <>
      <path d="M5 21c2-5 5-8 9-10" />
      <path d="M15 5c1.5 3 4 5.5 7 6" />
      <path d="M11 9c1.5 1.5 3 2.5 5 3" />
      <path d="M8 13c1 1.5 2.5 2.5 4 3" />
      <path d="M17 3l4 4" />
      <path d="M20 8l-1 3" />
      <path d="M3 20l3-2" />
      <path d="M6 18l-1 3" />
    </>
  ),
  takeout: (
    <>
      <path d="M8 8h8l1.5 8H6.5L8 8Z" />
      <path d="M6.5 16H5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1.5" />
      <path d="M9.5 4.5 12 7l2.5-2.5" />
      <path d="M12 7V3" />
    </>
  ),
  chili: (
    <>
      <path d="M15 8c-.5 3-2.5 5-5 6" />
      <path d="M18 5c-1 2-3 4-6 4.5" />
      <path d="M13 13c-1 1-2 2-2 3a3 3 0 0 0 3 3c2 0 4-1.5 5.5-4.5" />
      <path d="M14 5c0 2-1.5 3-3 4" />
      <path d="M7 16c-1.5 0-3 1-3 3 0 1.5 1 2.5 2 3" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 8v5l3 2M9 2h6" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", className)}
      aria-hidden
    >
      {P[name]}
    </svg>
  );
}

/* ================= primitives ================= */

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cx("animate-spin", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  full,
  className,
  type = "button",
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "dark" | "outline" | "ghost" | "danger" | "leaf";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const v = {
    primary: "bg-brand text-[#fff7ef] hover:bg-brand-deep border border-brand-deep/20 shadow-sm",
    dark: "bg-ink text-cream hover:bg-[#3d2a18] border border-ink shadow-sm",
    leaf: "bg-leaf text-[#eef6ee] hover:bg-leaf-deep border border-leaf-deep/30 shadow-sm",
    outline: "bg-transparent text-ink border border-line hover:border-brand hover:text-brand",
    ghost: "bg-transparent text-ink2 hover:bg-sand border border-transparent",
    danger: "bg-chili text-[#fff4f1] hover:bg-[#8e2318] border border-[#8e2318]/30 shadow-sm",
  }[variant];
  const s = {
    xs: "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
    sm: "h-8.5 px-3.5 text-[13px] gap-1.5 rounded-lg",
    md: "h-10 px-4.5 text-sm gap-2 rounded-xl",
    lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center font-bold tracking-tight transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        v,
        s,
        full && "w-full",
        className,
      )}
    >
      {loading ? <Spinner size={size === "xs" ? 12 : 15} /> : icon ? <Icon name={icon} size={size === "xs" ? 13 : size === "sm" ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

export function Pill({ cls, children, dot }: { cls: string; children: ReactNode; dot?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold", cls)}>
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

export function VegMark({ veg, size = 15 }: { veg: boolean; size?: number }) {
  const c = veg ? "#1f7a4d" : "#a62e1c";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-label={veg ? "Veg" : "Non-veg"} className="shrink-0">
      <rect x="1" y="1" width="14" height="14" rx="2.5" fill="none" stroke={c} strokeWidth="1.6" />
      {veg ? <circle cx="8" cy="8" r="3.4" fill={c} /> : <path d="M8 4.8 11.4 11H4.6L8 4.8Z" fill={c} />}
    </svg>
  );
}

export function Spice({ level }: { level: number }) {
  if (!level) return <span className="text-[11px] font-bold text-ink2">No heat</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-chili" title={["", "Mild", "Medium", "Fiery"][level]}>
      {[...Array(level)].map((_, i) => (
        <Icon key={i} name="flame" size={12} />
      ))}
    </span>
  );
}

/* ================= form bits ================= */

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[12.5px] font-bold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11.5px] text-ink2">{hint}</span>}
      {error && <span className="mt-1 block text-[11.5px] font-semibold text-chili">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white/70 px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink2/60 focus:border-brand focus:ring-2 focus:ring-brand/15";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, "min-h-20 resize-y", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, "appearance-none", props.className)} />;
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cx(
          "relative h-5.5 w-10 rounded-full border transition-colors",
          on ? "border-leaf-deep/40 bg-leaf" : "border-line bg-sand",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            on ? "left-5" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-[12.5px] font-bold text-ink2">{label}</span>}
    </button>
  );
}

export function Stepper({
  qty,
  onChange,
  small,
}: {
  qty: number;
  onChange: (q: number) => void;
  small?: boolean;
}) {
  const btn =
    "grid place-items-center rounded-lg border border-line bg-white text-ink transition hover:border-brand hover:text-brand active:scale-90";
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(qty - 1)} className={cx(btn, small ? "h-6.5 w-6.5" : "h-8 w-8")}>
        <Icon name="minus" size={small ? 12 : 14} />
      </button>
      <span className={cx("min-w-6 text-center font-extrabold tabular-nums", small ? "text-[13px]" : "text-sm")}>{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} className={cx(btn, small ? "h-6.5 w-6.5" : "h-8 w-8")}>
        <Icon name="plus" size={small ? 12 : 14} />
      </button>
    </span>
  );
}

/* ================= modal / confirm ================= */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          "anim-pop relative max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-line bg-cream shadow-2xl",
          wide ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-cream/95 px-5 py-3.5 backdrop-blur">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink2 transition hover:bg-sand hover:text-ink">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onClose,
  onYes,
  title,
  body,
  yesLabel = "Yes, do it",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onYes: () => Promise<void> | void;
  title: string;
  body: string;
  yesLabel?: string;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm font-medium text-ink2">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Keep it
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onYes();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {yesLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ================= states ================= */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-up flex flex-col items-center rounded-2xl border border-dashed border-line bg-white/40 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-sand text-brand">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm font-medium text-ink2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-sand", className)} />;
}

export function ErrorState({ msg, retry }: { msg: string; retry?: () => void }) {
  return (
    <div className="anim-up flex flex-col items-center rounded-2xl border border-[#ecc4ba] bg-chili-soft/60 px-6 py-10 text-center">
      <Icon name="alert" size={26} className="text-chili" />
      <p className="mt-3 text-sm font-bold text-chili">{msg}</p>
      {retry && (
        <Button variant="outline" size="sm" className="mt-4" icon="refresh" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ================= brand bits ================= */

export function Logo({ light, small }: { light?: boolean; small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cx(
          "grid place-items-center rounded-xl border shadow-sm",
          small ? "h-8 w-8" : "h-9.5 w-9.5",
          light ? "border-gold/40 bg-gold/15 text-gold" : "border-brand-deep/25 bg-brand text-[#fff3e6]",
        )}
      >
        <Icon name="logo" size={small ? 17 : 20} />
      </span>
      <span className={cx("font-display font-bold leading-none tracking-tight", small ? "text-[17px]" : "text-xl")}>
        <span className={light ? "text-cream" : "text-ink"}>Trivilla</span>
        <span className={light ? "ml-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-gold" : "ml-1.5 align-middle text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-brand"}>
          Smart Restaurant
        </span>
      </span>
    </span>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cx("reveal", seen && "reveal-in", className)}>
      {children}
    </div>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-2.5 text-gold", className)} aria-hidden>
      <span className="h-px w-16 bg-gold/50" />
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="5" cy="5" r="3" />
        <circle cx="13" cy="5" r="3" />
      </svg>
      <span className="h-px w-16 bg-gold/50" />
    </div>
  );
}

export function Bunting() {
  return (
    <svg className="h-6 w-full" preserveAspectRatio="none" viewBox="0 0 1200 26" aria-hidden>
      <line x1="0" y1="2" x2="1200" y2="2" stroke="#b98a2e" strokeWidth="1.5" />
      {Array.from({ length: 30 }).map((_, i) => (
        <path
          key={i}
          d={`M${i * 40 + 2} 2 L${i * 40 + 38} 2 L${i * 40 + 20} 24 Z`}
          fill={["#bc4a10", "#1e5a46", "#c2913a"][i % 3]}
          opacity="0.9"
        />
      ))}
    </svg>
  );
}
