"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Confirm, Icon, Logo, Pill } from "@/components/ui";
import { cx, timeAgo, type Notif } from "@/lib/utils";
import { patch, useAuth, useCart, useFetch, useToast } from "@/store";
import AuthModal from "./AuthModal";
import CartDrawer from "./CartDrawer";
import VipCard from "./VipCard";
import type { AiWaitTime } from "@/lib/ai";
import type { VipMembershipInfo } from "@/lib/vip";

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
  const { data, reload, setData } = useFetch<Notif[]>(user ? "/api/data/notifications" : null, {
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
          <div className="max-h-80 overflow-y-auto scroll-notif">
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
                    setData(prev => prev ? prev.map(item => item.id === n.id ? { ...item, read: true } : item) : prev);
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
  const [showVipCard, setShowVipCard] = useState(false);
  const [showBuyVip, setShowBuyVip] = useState(false);
  const [vipInfo, setVipInfo] = useState<VipMembershipInfo | null>(null);
  const [vipBusy, setVipBusy] = useState(false);
  const [vipStep, setVipStep] = useState<"plan" | "payment">("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [vipPaymentMode, setVipPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  // Fetch VIP status on mount / user change
  useEffect(() => {
    if (!user || user.role !== "customer") { setVipInfo(null); return; }
    fetch("/api/vip/status")
      .then(r => r.json())
      .then(d => { if (d.vip && d.membership) setVipInfo(d.membership); })
      .catch(() => {});
  }, [user]);

  // Reset VIP step when modal opens
  useEffect(() => {
    if (showBuyVip) setVipStep("plan");
  }, [showBuyVip]);

  if (booting)
    return <div className="h-9.5 w-24 animate-pulse rounded-xl bg-sand" />;

  if (!user)
    return (
      <Button size="sm" variant="dark" onClick={() => setAuthOpen(true)} icon="user">
        Sign in
      </Button>
    );

  return (
    <>
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
            {user.role === "customer" && (
              <button
                onClick={async () => {
                  setOpen(false);
                  try {
                    const res = await fetch("/api/vip/status");
                    const data = await res.json();
                    if (data.vip && data.membership) {
                      setVipInfo(data.membership);
                      setShowVipCard(true);
                    } else {
                      setShowBuyVip(true);
                    }
                  } catch {
                    setShowBuyVip(true);
                  }
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-amber-700 transition hover:bg-amber-50"
              >
                <Icon name="star" size={15} className="text-amber-500" />
                {vipInfo ? "My VIP Card" : "Get VIP"}
                {vipInfo && <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700">Active</span>}
              </button>
            )}
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
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
                window.location.href = "/";
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-sand"
            >
              <Icon name="logout" size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
      <Confirm
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onYes={async () => {
          try {
            const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
            if (res.ok) {
              push("Account deleted successfully", "ok");
              window.location.href = "/";
            } else {
              push("Failed to delete account", "err");
            }
          } catch {
            push("Something went wrong", "err");
          }
        }}
        title="Delete your account?"
        body="This will permanently remove your account, order history, and all saved data. This cannot be undone."
        yesLabel="Yes, delete my account"
        danger
      />

      {/* VIP Card Modal */}
      {showVipCard && vipInfo && (
        <VipCard membership={vipInfo} onClose={() => setShowVipCard(false)} />
      )}

      {/* VIP Purchase Modal — with demo payment flow */}
      {showBuyVip && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setShowBuyVip(false)} />
          <div className="anim-pop relative w-full max-w-sm mt-[288px] overflow-hidden rounded-3xl border border-amber-400/30 shadow-2xl"
            style={{ background: "linear-gradient(145deg, #1a1206, #3d2e12, #1a1206)" }}
          >
            <button onClick={() => setShowBuyVip(false)} className="absolute right-3 top-3 text-amber-400/60 hover:text-amber-300">
              <Icon name="x" size={16} />
            </button>

            <div className="p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-amber-400/40 bg-amber-400/10">
                <Icon name="star" size={28} className="text-amber-400" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-black text-amber-300">
                {vipStep === "plan" ? "Go VIP" : "Complete Payment"}
              </h2>

              {/* ═══════ STEP 1: PLAN SELECTION ═══════ */}
              {vipStep === "plan" && (
                <>
                  <p className="mt-2 text-[13px] font-medium text-amber-100/70">
                    35% off food • 50% off drinks • Golden tables • 20h daily
                  </p>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => { setSelectedPlan("monthly"); setVipStep("payment"); }}
                      className="w-full rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3.5 font-display text-[15px] font-bold text-white shadow-lg transition hover:from-amber-500 hover:to-amber-400 active:scale-[0.97]"
                    >
                      ₹9,999 / month
                    </button>
                    <button
                      onClick={() => { setSelectedPlan("yearly"); setVipStep("payment"); }}
                      className="w-full rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-3 text-[13px] font-bold text-amber-300 transition hover:bg-amber-400/10 active:scale-[0.97]"
                    >
                      ₹99,999 / year <span className="text-amber-400/60">(save ₹20K)</span>
                    </button>
                  </div>
                  <p className="mt-4 text-[11px] font-medium text-amber-100/40">
                    20 hours daily discount • Golden VIP tables • Cancel anytime
                  </p>
                </>
              )}

              {/* ═══════ STEP 2: DEMO PAYMENT ═══════ */}
              {vipStep === "payment" && (
                <>
                  <p className="mt-2 text-[13px] font-medium text-amber-100/70">
                    {selectedPlan === "monthly" ? "₹9,999 / month" : "₹99,999 / year"}
                  </p>

                  {/* Payment method picker */}
                  <div className="mt-5 text-left">
                    <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-amber-200/70">Pay with</p>
                    <div className="space-y-2">
                      {([["upi", "UPI", "GPay / PhonePe / Paytm"], ["card", "Card", "Credit / Debit — pay at counter"], ["cash", "Cash", "Simple & classic"]] as const).map(([v, label, sub]) => (
                        <button
                          key={v}
                          onClick={() => setVipPaymentMode(v)}
                          className={cx(
                            "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition",
                            vipPaymentMode === v
                              ? "border-amber-400 bg-amber-400/15 shadow-sm"
                              : "border-amber-400/20 bg-amber-400/5 hover:border-amber-400/40",
                          )}
                        >
                          <span className={cx(
                            "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border-2",
                            vipPaymentMode === v ? "border-amber-400" : "border-amber-400/30",
                          )}>
                            {vipPaymentMode === v && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                          </span>
                          <span>
                            <span className="block text-[13px] font-extrabold text-amber-200">{label}</span>
                            <span className="block text-[11.5px] font-medium text-amber-200/50">{sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pay Now button */}
                  <button
                    disabled={vipBusy}
                    onClick={async () => {
                      setVipBusy(true);
                      // Demo payment delay — simulate processing
                      await new Promise((r) => setTimeout(r, 800));
                      try {
                        const res = await fetch("/api/vip/purchase", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ plan: selectedPlan }),
                        });
                        if (res.ok) {
                          push("🎉 Payment successful! You're now a VIP. Check your card.", "ok");
                          setShowBuyVip(false);
                          const r2 = await fetch("/api/vip/status");
                          const d = await r2.json();
                          if (d.membership) setVipInfo(d.membership);
                        } else {
                          const err = await res.json();
                          push(err.error || "Could not process payment", "err");
                        }
                      } catch {
                        push("Something went wrong", "err");
                      } finally {
                        setVipBusy(false);
                      }
                    }}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3.5 font-display text-[15px] font-bold text-white shadow-lg transition hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.97] disabled:opacity-50"
                  >
                    {vipBusy ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing…
                      </span>
                    ) : (
                      <>Pay ₹{selectedPlan === "monthly" ? "9,999" : "99,999"} • {vipPaymentMode === "upi" ? "UPI" : vipPaymentMode === "card" ? "Card" : "Cash"}</>
                    )}
                  </button>

                  {/* Back to plan selection */}
                  <button
                    disabled={vipBusy}
                    onClick={() => setVipStep("plan")}
                    className="mt-3 text-[12px] font-bold text-amber-400/60 transition hover:text-amber-300"
                  >
                    ← Choose a different plan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
              <span className={cx(
                "absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white transition-opacity",
                count > 0 ? "opacity-100" : "opacity-0 pointer-events-none",
              )}>
                {count}
              </span>
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
