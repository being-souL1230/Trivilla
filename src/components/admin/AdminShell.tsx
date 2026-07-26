"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui";
import { cx, type Notif } from "@/lib/utils";
import { useAuth, useFetch, useSSE, useToast } from "@/store";

const NAV: { href: string; label: string; icon: IconName; end?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "home", end: true },
  { href: "/admin/orders", label: "Orders", icon: "receipt" },
  { href: "/admin/tables", label: "Tables", icon: "table" },
  { href: "/admin/menu", label: "Menu", icon: "chef" },
  { href: "/admin/reservations", label: "Reservations", icon: "calendar" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/staff", label: "Staff", icon: "user" },
  { href: "/admin/inventory", label: "Inventory", icon: "box" },
  { href: "/admin/bills", label: "Bills", icon: "wallet" },
];

type BadgeStats = { active: number; lowStock: unknown[]; pendingReservations: number };

export default function AdminShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { push } = useToast();
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const { data: badgeStats } = useSSE<BadgeStats>("/api/stats/events");
  const { data: notifs } = useFetch<Notif[]>("/api/data/notifications", { interval: 8000 });
  const unread = (notifs ?? []).filter((n) => !n.read).length;

  const isActive = (n: (typeof NAV)[number]) =>
    n.end ? pathname === n.href : pathname?.startsWith(n.href);

  const current = NAV.find(isActive);

  const badges: Record<string, number> = {
    "/admin/orders": badgeStats?.active ?? 0,
    "/admin/inventory": badgeStats?.lowStock.length ?? 0,
    "/admin/reservations": badgeStats?.pendingReservations ?? 0,
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-ink text-white">
      {/* brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-md">
          <Icon name="logo" size={22} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[17px] font-bold leading-tight">Trivilla</p>
          <p className="text-[11px] font-semibold text-brand-soft">Smart Restaurant</p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-1">
        {NAV.map((n) => {
          const active = isActive(n);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setDrawer(false)}
              className={cx(
                "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition-all",
                active
                  ? "bg-brand text-white shadow-lg shadow-brand/30"
                  : "text-[#c4a88a] hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon name={n.icon} size={17} className={active ? "" : "opacity-80 transition group-hover:opacity-100"} />
              <span className="flex-1">{n.label}</span>
              {badges[n.href] ? (
                <span
                  className={cx(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-extrabold",
                    active ? "bg-white/25 text-white" : "bg-chili text-white",
                  )}
                >
                  {badges[n.href]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* user */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#c4a88a] transition hover:bg-white/8 hover:text-white"
        >
          <Icon name="home" size={15} /> View website
        </Link>
        <button
          onClick={async () => {
            await signOut();
            push("Signed out — see you at the counter!", "info");
            router.push("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#c4a88a] transition hover:bg-white/8 hover:text-chili-soft"
        >
          <Icon name="logout" size={15} /> Sign out
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-[13px] font-extrabold text-white ring-2 ring-white/20">
            {userName[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-white">{userName}</p>
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#d4b8a0]">Manager</p>
          </div>
          <Icon name="chevron" size={14} className="text-[#d4b8a0]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="anim-slidein absolute left-0 top-0 h-full w-64 shadow-2xl" style={{ animationName: "drop" }}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink2 transition hover:bg-sand lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
            >
              <Icon name="burger" size={16} />
            </button>
            <h1 className="font-display text-[19px] font-bold tracking-tight text-ink">
              {current?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px] font-bold text-ink2 md:inline-flex">
              <Icon name="calendar" size={14} className="text-brand" />
              {now ? now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </span>
            <span className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px] font-bold tabular-nums text-ink2 sm:inline-flex">
              <Icon name="clock" size={14} className="text-brand" />
              {now ? now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}
            </span>
            <button
              onClick={() => router.push("/admin/orders")}
              className="relative grid h-9.5 w-9.5 place-items-center rounded-lg border border-line text-ink2 transition hover:bg-sand"
              aria-label="Notifications"
            >
              <Icon name="bell" size={16} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-chili px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
