"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Header from "@/components/Header";
import { Button, Icon, Logo } from "@/components/ui";
import { useAuth } from "@/store";

function Footer() {
  return (
    <footer className="pattern-dark mt-16 border-t border-leaf-deep bg-leaf-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-[13px] font-medium leading-relaxed text-cream/75">
            A neighbourhood kitchen that runs on smart tech — live menu, live
            kitchen updates, and zero standing-in-line. Home-style food,
            no waiting.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-[12px] font-bold text-gold">
            <Icon name="sparkle" size={15} />
            Built for VibeAthon 6.0 — Smart Restaurant Challenge
          </div>
        </div>
        <div>
          <h4 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold">Kitchen hours</h4>
          <ul className="mt-3.5 space-y-2 text-[13.5px] font-semibold text-cream/85">
            <li className="flex justify-between gap-6"><span>Lunch</span><span>12:00 – 3:30 PM</span></li>
            <li className="flex justify-between gap-6"><span>Snacks & tea</span><span>4:00 – 6:30 PM</span></li>
            <li className="flex justify-between gap-6"><span>Dinner</span><span>7:00 – 11:00 PM</span></li>
            <li className="flex justify-between gap-6 text-gold"><span>Open all 7 days</span><span>🪔</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold">Find us</h4>
          <ul className="mt-3.5 space-y-2.5 text-[13.5px] font-semibold text-cream/85">
            <li className="flex items-start gap-2.5">
              <Icon name="pin" size={16} className="mt-0.5 text-gold" />
              14, Laxmi Road, opp. Kelkar Bag, Shukrawar Peth, Pune 411002
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="phone" size={16} className="text-gold" />
              +91 8887529037
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="user" size={16} className="text-gold" />
              rishabdixit402@gmail.com
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/menu" className="rounded-lg border border-cream/25 px-3 py-1.5 text-[12px] font-bold transition hover:border-gold hover:text-gold">
              Menu
            </Link>
            <Link href="/book" className="rounded-lg border border-cream/25 px-3 py-1.5 text-[12px] font-bold transition hover:border-gold hover:text-gold">
              Book a table
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/15 py-4 text-center text-[11.5px] font-semibold text-cream/55">
        © 2026 Trivilla Smart Restaurant • FSSAI Lic. 21426XXXXXX • Prices inclusive of GST • Made with lots of tadka
      </div>
    </footer>
  );
}

export default function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, booting, signOut } = useAuth();

  // Chef guard: chefs can only access /chef/* — show prohibition instead of page
  // Small delay prevents flash during route transitions (e.g. after login redirect)
  const [showChefBlock, setShowChefBlock] = useState(false);
  const chefTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (chefTimer.current) clearTimeout(chefTimer.current);
    if (!booting && user?.role === "chef" && !pathname?.startsWith("/chef")) {
      chefTimer.current = setTimeout(() => setShowChefBlock(true), 200);
    } else {
      setShowChefBlock(false);
    }
    return () => {
      if (chefTimer.current) clearTimeout(chefTimer.current);
    };
  }, [user, booting, pathname]);

  if (showChefBlock) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-cream">
        <div className="mx-auto w-full max-w-sm px-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-200 bg-red-50">
            <Icon name="alert" size={28} className="text-red-500" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-ink">Access Restricted</h1>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-ink2">
            You are signed in as a <strong className="text-ink">chef</strong>. The kitchen queue is the only section available to chef accounts.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              variant="dark"
              icon="right"
              onClick={() => router.push("/chef/orders")}
            >
              Go to Kitchen Orders
            </Button>
            <span className="text-[11px] font-semibold text-ink2/50">or</span>
            <button
              onClick={async () => {
                signOut();
                router.push("/");
              }}
              className="text-[12.5px] font-bold text-ink2 underline underline-offset-2 transition hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
