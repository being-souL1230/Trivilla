"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import { Icon, Logo } from "@/components/ui";

function Footer() {
  return (
    <footer className="pattern-dark mt-16 border-t border-leaf-deep bg-leaf-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-[13px] font-medium leading-relaxed text-cream/75">
            A neighbourhood kitchen that runs on smart tech — live menu, live
            kitchen updates, and zero standing-in-line. Ghar jaisa khana,
            bina wait ke.
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
            <li className="flex justify-between gap-6"><span>Snacks & chai</span><span>4:00 – 6:30 PM</span></li>
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
              +91 98220 11223
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="user" size={16} className="text-gold" />
              namaste@trivilla.in
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
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
