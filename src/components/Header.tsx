"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Logo, Pill } from "@/components/ui";
import { cx, timeAgo, type Notif } from "@/lib/utils";
import { patch, useAuth, useCart, useFetch, useToast } from "@/store";
import AuthModal from "./AuthModal";
import CartDrawer from "./CartDrawer";
import type { AiWaitTime } from "@/lib/ai";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "My Orders" },
  { href: "/book", label: "Book a Table" },
];

function LiveChip() {
  const { user } = useAuth();
  const isMgr = user?.role === "manager";
  const { data: aiWait } = useFetch<AiWaitTime>(isMgr ? "/api/ai/wait-time" : null, { interval: 15000 });
  const { data: stats } = useFetch<{ estWait: number }>("/api/stats?public=1", { interval: 20000 });
  if (!stats) return null;
  const wait = isMgr && aiWait ? aiWait.averageWait : stats.estWait;
  return (
    <div className="flex items-center gap-1.5">
      <Pill cls="border-[#bcd8c4] bg-leaf-soft text-leaf-deep" dot="bg-leaf animate-pulse">
        Kitchen live
      </Pill>
      <Pill cls="border-[#e3d9c2] bg-[#f3ede0] text-[#7a5a12]">
        <span className="inline-flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
          ~{wait} min
        </span>
      </Pill>
      {isMgr && aiWait && aiWait.queueDepth > 0 && (
        <Pill cls="border-[#d4c0f0] bg-[#f0e6ff] text-[#6b3fa0]">
          {aiWait.queueDepth} ahead
        </Pill>
      )}
      {isMgr && aiWait && (
        <span className="sr-only">{aiWait.activeChefs} chefs working</span>
      )}
    </div>
  );
}

function Bell() {
  const { user } = useAuth();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, reload } = useFetch<Notif[]>(user ? "/api/data/notifications" : null, {
    interval: 15000,
  });
  const unread = (data ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9.5 w-9.5 place-items-center rounded-xl border border-line bg-white/70 text-ink transition hover:border-brand hover:text-brand"
        aria-label="Notifications"
      >
        <Icon name="bell" size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="anim-pop absolute right-0 top-12 z-50 w-[min(88vw,340px)] overflow-hidden rounded-2xl border border-line bg-cream shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-[13px] font-extrabold text-ink">Updates for you</p>
            {unread > 0 && (
              <button
                className="text-[11.5px] font-bold text-brand hover:underline"
                onClick={async () => {
                  await patch("/api/data/notifications/all", {});
                  reload(true);
                  push("All caught up");
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(data ?? []).length === 0 && (
              <p className="px-4 py-8 text-center text-[12.5px] font-medium text-ink2">
                No updates yet — order something tasty!
              </p>
            )}
            {(data ?? []).map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  if (!n.read) {
                    await patch(`/api/data/notifications/${n.id}`, {});
                    reload(true);
                  }
                }}
                className={cx(
                  "block w-full border-b border-line/60 px-4 py-3 text-left transition hover:bg-sand/60",
                  !n.read && "bg-brand-soft/40",
                )}
              >
                <p className="flex items-start gap-2 text-[13px] font-bold text-ink">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                  {n.title}
                </p>
                {n.body && <p className="mt-0.5 pl-3.5 text-[12px] font-medium text-ink2">{n.body}</p>}
                <p className="mt-1 pl-3.5 text-[10.5px] font-bold uppercase tracking-wide text-ink2/70">
                  {timeAgo(n.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, booting, signOut } = useAuth();
  const { setAuthOpen } = useCart();
  const { push } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  if (booting)
    return <div className="h-9.5 w-24 animate-pulse rounded-xl bg-sand" />;

  if (!user)
    return (
      <Button size="sm" variant="dark" onClick={() => setAuthOpen(true)} icon="user">
        Sign in
      </Button>
    );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9.5 items-center gap-2 rounded-xl border border-line bg-white/70 pl-1.5 pr-2.5 transition hover:border-brand"
      >
        <span className="grid h-6.5 w-6.5 place-items-center rounded-lg bg-leaf text-[12px] font-extrabold text-white">
          {user.name[0]?.toUpperCase()}
        </span>
        <span className="hidden truncate text-[13px] font-bold text-ink sm:inline max-w-16 md:max-w-20">{user.name.split(" ")[0]}</span>
        <Icon name="chevron" size={13} className="text-ink2" />
      </button>
      {open && (
        <div className="anim-pop absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-cream shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13.5px] font-extrabold text-ink">{user.name}</p>
            <p className="truncate text-[11.5px] font-medium text-ink2">{user.email}</p>
          </div>
          {user.role === "manager" && (
            <button
              onClick={() => router.push("/admin")}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-sand"
            >
              <Icon name="grid" size={15} className="text-brand" /> Manager dashboard
            </button>
          )}
          <button
            onClick={() => router.push("/orders")}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-sand"
          >
            <Icon name="receipt" size={15} className="text-brand" /> My orders
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                fetch("/api/auth/delete-account", { method: "DELETE" })
                  .then(res => {
                    if (res.ok) {
                      push("Account deleted successfully", "ok");
                      router.push("/");
                      window.location.reload();
                    } else {
                      push("Failed to delete account", "err");
                    }
                  })
                  .catch(() => push("Something went wrong", "err"));
              }
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-[13px] font-bold text-chili transition hover:bg-chili-soft/50"
          >
            <Icon name="trash" size={15} /> Delete account
          </button>
          <button
            onClick={async () => {
              await signOut();
              setOpen(false);
              push("Signed out — see you again!", "info");
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-sand"
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { count, setCartOpen } = useCart();
  const [mobile, setMobile] = useState(false);

  useEffect(() => setMobile(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cx(
                    "relative py-1.5 text-[13.5px] font-bold tracking-tight transition",
                    active ? "text-ink" : "text-ink2 hover:text-ink",
                  )}
                >
                  {n.label}
                  <span
                    className={cx(
                      "absolute -bottom-0.5 left-0 h-[2px] rounded-full bg-gold transition-all duration-300",
                      active ? "w-full" : "w-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden lg:block">
              <LiveChip />
            </span>
            <Bell />
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid h-9.5 w-9.5 place-items-center rounded-xl border border-line bg-white/70 text-ink transition hover:border-brand hover:text-brand"
              aria-label="Your tray"
            >
              <Icon name="tray" size={18} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">
                  {count}
                </span>
              )}
            </button>
            <UserMenu />
            <button
              className="grid h-9.5 w-9.5 place-items-center rounded-xl border border-line bg-white/70 text-ink md:hidden"
              onClick={() => setMobile((m) => !m)}
              aria-label="Menu"
            >
              <Icon name={mobile ? "x" : "burger"} size={17} />
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="anim-down border-t border-line bg-cream px-4 py-3 md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cx(
                  "block rounded-lg px-3.5 py-2.5 text-[14px] font-bold",
                  pathname === n.href ? "bg-ink text-cream" : "text-ink2 hover:bg-sand",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <AuthModal />
      <CartDrawer />
    </>
  );
}
