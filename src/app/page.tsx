"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import DishCard from "@/components/DishCard";
import { Bunting, Button, Icon, Ornament, Reveal, Skeleton, type IconName } from "@/components/ui";
import { cx, addDaysStr, IMG, inr, todayStr, type MenuItem } from "@/lib/utils";
import { getVipPrice } from "@/lib/vip";
import { useAuth, useCart, useFetch, useToast } from "@/store";
import type { AiSpecial, AiWaitTime } from "@/lib/ai";

type PublicStats = { estWait: number; availableDishes: number; totalDishes: number };

const OPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "receipt", title: "Smart Orders", body: "Order from your table — the kitchen gets it instantly, word-for-word." },
  { icon: "table", title: "Table Booking", body: "Reserve a slot in 30 seconds; your table waits 15 minutes past it." },
  { icon: "bell", title: "Live Updates", body: "A bell ping at every step — cooking, ready, served. No counter hovering." },
  { icon: "box", title: "Inventory Control", body: "The store predicts stock-outs days ahead and nudges us to restock." },
  { icon: "chart", title: "Honest Analytics", body: "Sales, busy hours & top sellers — the whole day on one calm screen." },
];

export default function Landing() {
  const router = useRouter();
  const { user } = useAuth();
  const { add } = useCart();
  const { push } = useToast();
  const heroRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.setAttribute("fetchpriority", "high");
    }
  }, []);
  const { data: menu, loading } = useFetch<MenuItem[]>("/api/data/menu");
  const { data: stats } = useFetch<PublicStats>("/api/stats?public=1", { interval: 20000 });
  const { data: aiSpecials } = useFetch<AiSpecial[]>("/api/ai/specials", { interval: 30000 });
  const { data: aiWait } = useFetch<AiWaitTime>(user?.role === "manager" ? "/api/ai/wait-time" : null, { interval: 15000 });
  const { data: ratingsMap } = useFetch<Record<number, { avg: number; count: number }>>("/api/data/ratings", { interval: 20000 });
  const { data: vipStatus } = useFetch<{ vip: boolean }>("/api/vip/status", { interval: 30000 });
  const [date, setDate] = useState(addDaysStr(1));
  const [guests, setGuests] = useState(2);

  const popular = (menu ?? []).filter((m) => m.popular).slice(0, 4);
  const special = (menu ?? []).find((m) => m.name.includes("Special Thali"));

  /* 🪙 VIP pricing for popular dishes */
  const vipPricing = useMemo(() => {
    if (!vipStatus?.vip) return null;
    const map: Record<number, { originalPrice: number; vipPrice: number; discountPct: number }> = {};
    for (const m of menu ?? []) {
      map[m.id] = getVipPrice(m.id, m.name, m.price, m.category);
    }
    return map;
  }, [menu, vipStatus?.vip]);

  return (
    <div>
      <Bunting />

      {/* ================= HERO ================= */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[46%_54%]">
          {/* left copy */}
          <div className="flex flex-col justify-center px-4 pb-12 pt-12 sm:px-8 lg:pb-20 lg:pt-16">
            <Reveal>
              <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">
                Hello {user ? user.name.split(" ")[0] : "there"} • Laxmi Road, Pune
              </p>
              <h1 className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-tight text-ink sm:text-[52px] lg:text-[68px]">
                Smart Kitchen.
                <br />
                Soulful Food.
              </h1>
              <Ornament className="mt-7" />
              <p className="mt-6 max-w-md text-[15px] font-medium leading-relaxed text-ink2">
                Trivilla is a neighbourhood kitchen running on quiet technology —
                see what's available right now, order in two taps, and we'll
                ping you the moment your plate is hot. Home-style love, without
                any waiting.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/book">
                  <Button size="lg" variant="dark" className="rounded-xl">
                    Book a Table <Icon name="arrow" size={16} />
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline" icon="book" className="rounded-xl bg-white/50">
                    Digital Menu
                  </Button>
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[12.5px] font-bold text-ink2">
                {stats && (
                  <>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
                      {stats.availableDishes} of {stats.totalDishes} dishes live
                    </span>
                    {user?.role === "manager" && aiWait ? (
                      <>
                        <span className="inline-flex items-center gap-2">
                          <Icon name="timer" size={14} className="text-brand" />
                          ~{aiWait.averageWait} min • {aiWait.queueDepth} orders in queue
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Icon name="chef" size={13} className="text-gold" />
                          {aiWait.activeChefs} chefs on duty
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Icon name="clock" size={14} className="text-brand" />
                        ~{stats.estWait} min average wait
                      </span>
                    )}
                  </>
                )}
                <span className="inline-flex items-center gap-2">
                  <Icon name="star" size={13} className="text-gold" />
                  4.8 from 2,000+ foodies
                </span>
              </div>
            </Reveal>
          </div>

          {/* right photo */}
          <div className="relative min-h-[340px] lg:min-h-[620px]">
            <img
              ref={heroRef}
              src={IMG.interior}
              alt="Inside Trivilla at dinner time"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cream/70 via-transparent to-transparent lg:from-cream" />
            {/* floating thali card */}
            {special && (
              <div className="anim-up absolute bottom-4 right-3 flex w-56 items-center gap-3 rounded-2xl border border-line bg-cream/95 p-3 shadow-2xl backdrop-blur sm:bottom-6 sm:right-5 sm:w-64" style={{ animationDelay: "0.35s" }}>
                <img src={special.image || IMG.thali} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold">Chef's special today</p>
                  <p className="truncate text-[13px] font-extrabold text-ink">{special.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-[15px] font-bold text-leaf-deep">
                      {vipPricing?.[special.id] ? (
                        <>
                          <span className="text-[10px] font-bold text-ink2/50 line-through">{inr(vipPricing[special.id].originalPrice)}</span>{' '}
                          {inr(vipPricing[special.id].vipPrice)}
                        </>
                      ) : (
                        inr(special.price)
                      )}
                    </span>
                    <button
                      onClick={() => {
                        const p = vipPricing?.[special.id] ? vipPricing[special.id].vipPrice : special.price;
                        add({ menuItemId: special.id, name: special.name, price: p, veg: special.veg, image: special.image, desc: special.description });
                        push(`${special.name} added to your tray`);
                      }}
                      className="rounded-lg bg-brand px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-brand-deep"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* live badge */}
            <div className="absolute left-5 top-6 rounded-xl border border-gold/40 bg-ink/70 px-3.5 py-2 text-center backdrop-blur">
              <p className="font-display text-[15px] font-bold leading-none text-gold">Newly</p>
              <p className="mt-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-cream/80">Opened</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OPERATIONAL EXCELLENCE ================= */}
      <section className="border-y border-line bg-white/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.6fr] lg:gap-16 lg:py-16">
          <Reveal>
            <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">Operational excellence</p>
            <h2 className="mt-3 font-display text-[28px] font-black leading-tight tracking-tight text-ink sm:text-[34px] lg:text-[40px]">
              Streamline.
              <br />
              Automate. Delight.
            </h2>
            <p className="mt-4 max-w-sm text-[14px] font-medium leading-relaxed text-ink2">
              Everything between "what's available?" and "shukriya, see you
              again" runs digitally — so our people spend their time on you,
              not on paperwork.
            </p>
            <span className="mt-6 block h-0.5 w-12 bg-gold" />
          </Reveal>
          <Reveal delay={120}>
            <div className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-line">
              {OPS.map((o) => (
                <div key={o.title} className="group lg:px-5 lg:first:pl-0">
                  <Icon name={o.icon} size={21} className="text-gold transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <h3 className="mt-3.5 text-[14px] font-extrabold tracking-tight text-ink">{o.title}</h3>
                  <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-ink2">{o.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= FAVOURITES ================= */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-8">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">Everyone's favourites</p>
              <h2 className="mt-2.5 font-display text-[28px] font-black tracking-tight text-ink sm:text-[34px] lg:text-[42px]">
                Plates worth crossing the city for
              </h2>
            </div>
            <Link href="/menu" className="group hidden shrink-0 items-center gap-2 text-[13.5px] font-extrabold text-brand sm:inline-flex">
              Full menu
              <Icon name="arrow" size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)
            : popular.map((m, i) => (
                <Reveal key={m.id} delay={i * 80}>
                  <DishCard item={m} rating={ratingsMap?.[m.id]} vipPrice={vipPricing?.[m.id]} />
                </Reveal>
              ))}
        </div>
        <Link href="/menu" className="mt-7 block text-center sm:hidden">
          <Button variant="outline" icon="arrow">See full menu</Button>
        </Link>
      </section>

      {/* ================= TODAY'S CHEF SPECIALS (AI) ================= */}
      {aiSpecials && aiSpecials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">From market to kitchen</p>
                <h2 className="mt-2.5 font-display text-[28px] font-black tracking-tight text-ink sm:text-[34px] lg:text-[42px]">
                  Today's Chef Specials
                </h2>
                <p className="mt-1 text-[14px] font-medium text-ink2">
                  Based on what's freshest in the kitchen right now
                </p>
              </div>
              <Link href="/menu" className="group hidden shrink-0 items-center gap-2 text-[13.5px] font-extrabold text-brand sm:inline-flex">
                Full menu
                <Icon name="arrow" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiSpecials.slice(0, 3).map((s, i) => {
              return (
                <Reveal key={s.id} delay={i * 80}>
                  <div className="group flex overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative w-28 shrink-0 overflow-hidden sm:w-32">
                      {s.image && (
                        <img src={s.image} alt={s.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      )}
                      <div className={cx(
                        "absolute left-1.5 top-1.5 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold",
                        s.urgency === "low_stock" ? "text-chili border-chili/30 bg-chili-soft/70" : "text-leaf-deep border-leaf/30 bg-leaf-soft/70"
                      )}>
                        {s.urgency === "low_stock" ? "Limited stock" : s.urgency === "excess" ? "Fresh today" : "Chef's pick"}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-3.5">
                      <h3 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-ink">
                        <span className="truncate">{s.name}</span>
                      </h3>
                      <p className="mt-0.5 text-[10.5px] font-semibold text-leaf-deep">{s.specialReason}</p>
                      <p className="clamp2 mt-1 text-[11.5px] font-medium leading-snug text-ink2">{s.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-display text-[15px] font-bold text-leaf-deep">
                          {vipPricing?.[s.id] ? (
                            <>
                              <span className="text-[10px] font-bold text-ink2/50 line-through">{inr(vipPricing[s.id].originalPrice)}</span>{' '}
                              {inr(vipPricing[s.id].vipPrice)}
                            </>
                          ) : (
                            inr(s.price)
                          )}
                        </span>
                        <button
                          onClick={() => {
                            const p = vipPricing?.[s.id] ? vipPricing[s.id].vipPrice : s.price;
                            add({ menuItemId: s.id, name: s.name, price: p, veg: s.veg, image: s.image, desc: s.description });
                            push(`${s.name} added to your tray`);
                          }}
                          className="rounded-lg bg-brand px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-brand-deep"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Link href="/menu" className="mt-5 block text-center sm:hidden">
            <Button variant="outline" icon="arrow">See full menu</Button>
          </Link>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">No technical jargon, simple work</p>
              <h2 className="mt-2.5 font-display text-[28px] font-black tracking-tight text-ink sm:text-[34px] lg:text-[42px]">How Trivilla works</h2>
          </div>
        </Reveal>
        <div className="relative mt-12 grid gap-10 md:grid-cols-3">
          <span className="absolute left-[17%] right-[17%] top-7 hidden border-t border-dashed border-[#d8c9a8] md:block" />
          {[
            { n: "01", icon: "tray" as IconName, t: "Pick your dishes", b: "The menu shows what's actually in the kitchen right now — sold-out items say so themselves." },
            { n: "02", icon: "chef" as IconName, t: "Kitchen gets it instantly", b: "Your order lands on the chef's screen. No waiter hunt, no misheard 'thoda less spicy'." },
            { n: "03", icon: "bell" as IconName, t: "We ping you", b: "The bell buzzes at every step — cooking, ready, served. You just sit back and relax." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <div className="relative text-center">
                <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#d8c9a8] bg-cream shadow-sm">
                  <Icon name={s.icon} size={22} className="text-brand" />
                </div>
                <span className="absolute left-1/2 top-0 z-10 ml-5 font-display text-[13px] font-bold text-gold">{s.n}</span>
                <h3 className="mt-5 font-display text-[19px] font-bold text-ink">{s.t}</h3>
                <p className="mx-auto mt-2 max-w-64 text-[13px] font-medium leading-relaxed text-ink2">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 🪙 VIP MEMBERSHIP ================= */}
      {!vipStatus?.vip && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">
          <Reveal>
            <div className="pattern-dark overflow-hidden rounded-3xl border border-gold/30 bg-leaf-deep shadow-2xl">
              <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:py-12">
                {/* subtle gold shine */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -inset-10 animate-vip-shine"
                    style={{
                      background: "linear-gradient(105deg, transparent 20%, rgba(212,175,55,0.08) 45%, rgba(212,175,55,0.05) 50%, transparent 75%)",
                      transform: "skewX(-12deg)",
                    }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold">New</span>
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-gold/60">Trivilla VIP</span>
                  </div>
                  <h2 className="mt-3 font-display text-[28px] font-black leading-tight tracking-tight text-cream sm:text-[32px] lg:text-[40px]">
                    The Golden Experience
                  </h2>
                  <p className="mt-4 max-w-md text-[14px] font-medium leading-relaxed text-cream/75">
                    20 hours of discounts every day. Golden tables reserved just
                    for you. 35% off on food, 50% off on drinks — because you
                    deserve the best.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[13px] font-bold text-cream/85">
                    <li className="flex items-center gap-2.5"><Icon name="star" size={15} className="text-gold" /> 35% off food · 50% off drinks</li>
                    <li className="flex items-center gap-2.5"><Icon name="star" size={15} className="text-gold" /> Exclusive golden VIP tables</li>
                    <li className="flex items-center gap-2.5"><Icon name="star" size={15} className="text-gold" /> 20 hours daily · 1AM-5AM excluded</li>
                  </ul>
                </div>
                <div className="relative z-10 rounded-2xl bg-cream p-6 shadow-2xl sm:p-8">
                  <div className="text-center">
                    <p className="font-display text-4xl font-black text-leaf-deep">₹9,999</p>
                    <p className="mt-1 text-[13px] font-medium text-ink2">per month</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => {
                        if (!user) {
                          push("Sign in first, then tap 'Get VIP' in your profile menu! 🪙", "info");
                          router.push("/?signin=1");
                        } else {
                          push("Open your profile menu and tap 'Get VIP'! 🪙", "info");
                        }
                      }}
                      className="w-full rounded-2xl border border-gold/40 bg-gradient-to-r from-gold to-amber-500 px-5 py-3.5 font-display text-[15px] font-bold text-white shadow-lg transition hover:from-amber-500 hover:to-amber-400"
                    >
                      Go VIP 🪙
                    </button>
                    <p className="text-center text-[12px] font-bold text-ink2/60">
                      ₹99,999/year <span className="text-gold">• Save ₹20,000</span>
                    </p>
                  </div>
                  <p className="mt-4 text-center text-[11px] font-medium text-ink2/50">
                    Cancel anytime · Golden card with unique VIP ID · Priority service
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ================= BOOK BAND ================= */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">
        <Reveal>
          <div className="pattern-dark overflow-hidden rounded-3xl border border-leaf-deep bg-leaf-deep">
            <div className="grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:py-12">
              <div>
                <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">Weekend rush? Sorted.</p>
                <h2 className="mt-3 font-display text-[28px] font-black leading-tight tracking-tight text-cream sm:text-[32px] lg:text-[40px]">
                  Skip the wait at the door
                </h2>
                <p className="mt-4 max-w-md text-[14px] font-medium leading-relaxed text-cream/75">
                  Book your table in 30 seconds. We hold it 15 minutes past
                  your slot, keep a welcome sherbet ready, and ping you the
                  moment it's confirmed.
                </p>
                <ul className="mt-6 space-y-2.5 text-[13px] font-bold text-cream/85">
                  <li className="flex items-center gap-2.5"><Icon name="check" size={15} className="text-gold" /> Window, terrace & private zones</li>
                  <li className="flex items-center gap-2.5"><Icon name="check" size={15} className="text-gold" /> Tables for 2 to 10 people</li>
                  <li className="flex items-center gap-2.5"><Icon name="check" size={15} className="text-gold" /> Free cancellation, no drama</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-cream p-5 shadow-2xl sm:p-6">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink2">Quick check</p>
                <div className="mt-3.5 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-bold text-ink">Date</span>
                    <input
                      type="date"
                      min={todayStr()}
                      max={addDaysStr(14)}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-bold text-ink">Guests</span>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1}>{i + 1} {i === 0 ? "guest" : "guests"}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button full size="lg" className="mt-4 rounded-xl" icon="arrow" onClick={() => router.push(`/book?date=${date}&guests=${guests}`)}>
                  Check available slots
                </Button>
                <p className="mt-2.5 text-center text-[11.5px] font-medium text-ink2">Lunch 12–3:30 PM • Dinner 7–11 PM</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= STORY ================= */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border-[5px] border-white shadow-xl">
              <img src={IMG.ritual} alt="A quiet moment before the meal — tradition at Trivilla" className="h-80 w-full object-cover sm:h-[420px]" />
            </div>
            <div className="absolute -bottom-5 -right-3 rounded-2xl border border-line bg-cream px-5 py-3.5 shadow-xl sm:-right-6">
              <p className="font-display text-[26px] font-black leading-none text-brand">3</p>
              <p className="mt-1 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-ink2">generations of flavor</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100} className="order-1 lg:order-2">
          <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">Our story</p>
          <h2 className="mt-3 font-display text-[28px] font-black leading-tight tracking-tight text-ink sm:text-[32px] lg:text-[40px]">
            Home-style love in every plate
          </h2>
          <Ornament className="mt-5" />
          <p className="mt-5 text-[14.5px] font-medium leading-relaxed text-ink2">
            Trivilla is a modern smart kitchen built for the way people eat
            today — live menu, two-tap ordering, and real-time kitchen updates
            that put you in control. No waiting, no confusion, just great food
            served the way it should be.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: "leaf" as IconName, t: "Market-fresh", b: "Vegetables picked every morning" },
              { icon: "flame" as IconName, t: "Slow-cooked", b: "Dal on fire for 12 hours" },
              { icon: "checkCircle" as IconName, t: "FSSAI certified", b: "Clean kitchen, always" },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-line bg-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <Icon name={x.icon} size={19} className="text-brand" />
                <p className="mt-2.5 text-[12.5px] font-extrabold text-ink">{x.t}</p>
                <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-ink2">{x.b}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
