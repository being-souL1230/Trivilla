"use client";
import { useMemo, useState } from "react";
import DishCard from "@/components/DishCard";
import { Button, EmptyState, ErrorState, Icon, Skeleton, Stepper, VegMark, type IconName } from "@/components/ui";
import { cx, inr, type MenuItem, type Order } from "@/lib/utils";
import type { AiRecommendation, AiSpecial } from "@/lib/ai";
import { useAuth, useCart, useFetch, useToast } from "@/store";
import type { AiDynamicPrice } from "@/lib/pricing";
import { getDynamicPrice } from "@/lib/pricing";

const CAT_META: Record<string, { sub: string; icon: IconName }> = {
  All: { sub: "Everything the kitchen is firing today", icon: "grid" },
  Starters: { sub: "Light bites to begin the journey", icon: "flame" },
  Thali: { sub: "The full Trivilla experience on one plate", icon: "tray" },
  "Main Course": { sub: "Slow-cooked curries & soulful gravies", icon: "chef" },
  "Rice & Biryani": { sub: "Fragrant, dum-cooked & generous", icon: "bowl" },
  Breads: { sub: "Puffed & brushed, straight from the tandoor", icon: "wheat" },
  "South Indian": { sub: "Crisp, tangy & comforting", icon: "leaf" },
  Desserts: { sub: "A sweet ending, the way it should be", icon: "star" },
  Drinks: { sub: "Kulhad chai & cool things", icon: "cup" },
};

export default function MenuPage() {
  const { user } = useAuth();
  const { count, subtotal, setCartOpen } = useCart();
  const { push } = useToast();
  const { data: menu, loading, error, reload } = useFetch<MenuItem[]>("/api/data/menu");
  const { data: myOrders } = useFetch<Order[]>(user ? "/api/data/orders" : null);
  const { data: aiPicks } = useFetch<AiRecommendation[]>("/api/ai/recommendations");
  const { data: aiSpecials } = useFetch<AiSpecial[]>("/api/ai/specials", { interval: 30000 });

  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [veg, setVeg] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [chefOnly, setChefOnly] = useState(false);


  const cats = useMemo(() => {
    const present = [...new Set((menu ?? []).map((m) => m.category))];
    return ["All", ...present];
  }, [menu]);

  const filtered = useMemo(() => {
    let list = menu ?? [];
    if (cat !== "All") list = list.filter((m) => m.category === cat);
    if (veg) list = list.filter((m) => m.veg);
    if (spicy) list = list.filter((m) => m.spice >= 2);
    if (chefOnly) list = list.filter((m) => m.popular);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(s) || m.description.toLowerCase().includes(s));
    }
    return [...list].sort((a, b) => Number(b.available) - Number(a.available) || Number(b.popular) - Number(a.popular));
  }, [menu, cat, veg, spicy, chefOnly, q]);

  /* personal "picked for you" for the chef's band */
  const chefsPicks = useMemo(() => {
    const avail = (menu ?? []).filter((m) => m.available);
    if (user && myOrders?.length) {
      const past = new Set(myOrders.flatMap((o) => (o.items ?? []).map((i) => i.name)));
      const score = (m: MenuItem) =>
        (m.popular ? 2 : 0) + (user.vegOnly && m.veg ? 2 : 0) + (past.has(m.name) ? 3 : 0);
      return [...avail].sort((a, b) => score(b) - score(a)).slice(0, 3);
    }
    return avail.filter((m) => m.popular).slice(0, 3);
  }, [menu, user, myOrders]);  /* 🧠 Dynamic pricing — compute once for all dishes */
  const dynPricing = useMemo(() => {
    const map: Record<number, AiDynamicPrice> = {};
    for (const m of menu ?? []) {
      map[m.id] = getDynamicPrice(m.id, m.name, m.price, m.category);
    }
    return map;
  }, [menu]);

  const availCount = (menu ?? []).filter((m) => m.available).length;
  const meta = CAT_META[cat] ?? { sub: "Fresh from the kitchen", icon: "grid" as IconName };
  const filterActive = veg || spicy || chefOnly || q.trim() !== "";

  const FilterRow = ({
    on, toggle, icon, label, hint,
  }: { on: boolean; toggle: () => void; icon: IconName; label: string; hint: string }) => (
    <button
      onClick={toggle}
      className={cx(
        "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition",
        on ? "bg-brand-soft/70 text-brand-deep" : "text-ink2 hover:bg-sand/70 hover:text-ink",
      )}
    >
      <Icon name={icon} size={16} className={on ? "text-brand" : "text-ink2/70"} />
      <span className="flex-1 text-[13px] font-bold">{label}</span>
      <span
        className={cx(
          "relative h-4.5 w-8 rounded-full border transition-colors",
          on ? "border-brand/40 bg-brand" : "border-line bg-white",
        )}
      >
        <span className={cx("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all", on ? "left-4" : "left-0.5")} />
      </span>
      <span className="sr-only">{hint}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 lg:pt-10">
      <div className="lg:grid lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* ============ sidebar ============ */}
        <aside className="mb-6 lg:mb-0">
          <div className="rounded-2xl border border-line bg-white/70 p-3.5 lg:sticky lg:top-22">
            <p className="px-2 pb-2 pt-1 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-ink2">
              Categories
            </p>
            <nav className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {cats.map((c) => {
                const m = CAT_META[c] ?? { sub: "", icon: "grid" as IconName };
                const active = cat === c;
                const n = c === "All" ? (menu ?? []).length : (menu ?? []).filter((x) => x.category === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={cx(
                      "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition",
                      active
                        ? "bg-leaf-soft text-leaf-deep shadow-sm"
                        : "text-ink2 hover:bg-sand/70 hover:text-ink",
                    )}
                  >
                    <Icon name={m.icon} size={16} className={active ? "text-leaf" : "text-ink2/70"} />
                    <span className="text-[13.5px] font-bold">{c}</span>
                    <span className={cx("ml-auto hidden text-[11px] font-extrabold lg:block", active ? "text-leaf" : "text-ink2/50")}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="my-3 h-px bg-line" />
            <p className="px-2 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-ink2">
              Quick filters
            </p>
            <div className="space-y-0.5">
              <FilterRow on={chefOnly} toggle={() => setChefOnly((v) => !v)} icon="award" label="Chef's picks" hint="popular" />
              <FilterRow on={veg} toggle={() => setVeg((v) => !v)} icon="leaf" label="Vegetarian" hint="veg" />
              <FilterRow on={spicy} toggle={() => setSpicy((v) => !v)} icon="flame" label="Spicy" hint="spicy" />
            </div>

            <div className="my-3 h-px bg-line" />
            <p className="px-2 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-ink2">
              Today's kitchen
            </p>
            <div className="mx-1 rounded-xl bg-cream px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-leaf-deep">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
                {availCount} of {menu?.length ?? "…"} available
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-ink2">Menu updates live as the mandi runs out.</p>
            </div>

            {/* view order */}
            <button
              onClick={() => {
                if (!count) {
                  push("Your tray is empty — add something tasty first", "info");
                  return;
                }
                setCartOpen(true);
              }}
              className={cx(
                "mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-sm transition active:scale-[0.98]",
                count ? "bg-leaf text-white hover:bg-leaf-deep" : "cursor-not-allowed bg-sand text-ink2",
              )}
            >
              <Icon name="tray" size={19} />
              <span className="flex-1">
                <span className="block text-[13.5px] font-extrabold">View Order</span>
                <span className={cx("block text-[11.5px] font-bold", count ? "text-white/80" : "text-ink2/70")}>
                  {count ? inr(subtotal) : "Nothing added yet"}
                </span>
              </span>
              {count > 0 && (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-extrabold text-leaf-deep">
                  {count}
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* ============ main ============ */}
        <div className="min-w-0">
          {/* heading + search */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 font-display text-4xl font-black tracking-tight text-ink sm:text-[44px]">
                {cat === "All" ? "Today's Menu" : cat}
                <Icon name={meta.icon} size={22} className="text-leaf/70" />
              </h1>
              <p className="mt-2 text-[14.5px] font-medium text-ink2">{meta.sub}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink2/70" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for dishes…"
                className="h-11.5 w-full rounded-full border border-line bg-white/80 pl-11 pr-4 text-[13.5px] font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink2/60 focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </div>

          {/* grid */}
          <div className="mt-7">
            {error ? (
              <ErrorState msg={error} retry={() => reload()} />
            ) : loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="search"
                title="Nothing on the plate"
                body={
                  filterActive
                    ? "No dish matches those filters. Try clearing one — or ask the kitchen, they might surprise you."
                    : "This category is resting today. Try another one!"
                }
                action={
                  filterActive ? (
                    <Button
                      variant="outline"
                      icon="refresh"
                      onClick={() => { setQ(""); setVeg(false); setSpicy(false); setChefOnly(false); }}
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {filtered.map((m, i) => (
                  <div key={m.id} className="anim-up relative" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                    {/* 🧠 Dynamic Pricing Badge — inside card now */}
                    <DishCard
                      item={m}
                      dynPrice={dynPricing[m.id]?.label !== "Standard" ? dynPricing[m.id] : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI: Picked for you — personalised recommendations */}
          {aiPicks && aiPicks.length > 0 && !q && !filterActive && (
            <section className="mt-10 rounded-3xl border border-[#c9d6e8] bg-[#eef3fa]/70 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[#6b8fc0]/40 bg-[#dce6f2] text-[#4a7ab5]">
                  <Icon name="sparkle" size={19} />
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Picked for You</h2>
                <p className="text-[13px] font-semibold text-ink2">
                  {aiPicks[0]?.reasonLabel
                    ? `Based on your tastes — ${aiPicks[0].reasonLabel.toLowerCase()}`
                    : "Smart recommendations from your order history"}
                </p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {aiPicks.slice(0, 3).map((rec, i) => (
                  <AiPickCard key={rec.id} item={rec} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* AI: Today's Chef Specials — inventory-driven */}
          {aiSpecials && aiSpecials.length > 0 && !q && !filterActive && (
            <section className="mt-8 rounded-3xl border border-[#d4e3d1] bg-[#f0f9ee]/70 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-leaf/40 bg-leaf-soft text-leaf-deep">
                  <Icon name="award" size={19} />
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Today's Chef Specials</h2>
                <p className="text-[13px] font-semibold text-ink2">
                  Fresh from the mandi — chef recommends these right now
                </p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {aiSpecials.slice(0, 3).map((s) => (
                  <SpecialCard key={s.id} item={s} />
                ))}
              </div>
            </section>
          )}

          {/* existing chef's choice band as fallback */}
          {!aiPicks && !aiSpecials && chefsPicks.length > 0 && !q && (
            <section className="mt-10 rounded-3xl border border-[#e3d9c2] bg-[#f3ede0]/70 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-gold-soft text-gold">
                  <Icon name="award" size={19} />
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Chef's Choice</h2>
                <p className="text-[13px] font-semibold text-ink2">
                  {user ? `Top recommendations picked for you, ${user.name.split(" ")[0]}` : "Our chef's top recommendations for you"}
                </p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {chefsPicks.map((m) => (
                  <ChefPick key={m.id} item={m} />
                ))}
              </div>
            </section>
          )}

          {/* footer note */}
          <p className="mt-8 flex items-center justify-center gap-2 border-t border-line pt-6 text-center text-[12.5px] font-medium text-ink2">
            <Icon name="leaf" size={14} className="text-leaf" />
            All prices are inclusive of taxes. Please inform our staff of any allergies.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChefPick({ item }: { item: MenuItem }) {
  const { items, add, setQty } = useCart();
  const { push } = useToast();
  const inCart = items.find((i) => i.menuItemId === item.id);
  return (
    <div className="group flex overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative w-30 shrink-0 overflow-hidden sm:w-34">
        {item.image && (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <h3 className="flex items-center gap-1.5 font-display text-[15.5px] font-bold text-ink">
          <span className="truncate">{item.name}</span>
          <span className="shrink-0"><VegDot veg={item.veg} /></span>
        </h3>
        <p className="clamp2 mt-1 text-[11.5px] font-medium leading-snug text-ink2">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-[15.5px] font-bold text-leaf-deep">{inr(item.price)}</span>
          {inCart ? (
            <Stepper small qty={inCart.qty} onChange={(q) => setQty(item.id, q)} />
          ) : (
            <Button
              size="xs"
              variant="outline"
              icon="plus"
              onClick={() => {
                add({ menuItemId: item.id, name: item.name, price: item.price, veg: item.veg, image: item.image, desc: item.description });
                push(`${item.name} added to your tray`);
              }}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AiPickCard({ item, index }: { item: AiRecommendation; index: number }) {
  const { items, add, setQty } = useCart();
  const { push } = useToast();
  const inCart = items.find((i) => i.menuItemId === item.id);
  const conf = Math.min(100, item.score);
  return (
    <div className="group flex overflow-hidden rounded-2xl border border-[#d0deee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative w-28 shrink-0 overflow-hidden sm:w-32">
        {item.image && (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-1.5 top-1.5 rounded-md bg-[#4a7ab5]/90 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
          {conf}% match
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-display text-[15px] font-bold text-ink">{item.name}</h3>
          <VegMark veg={item.veg} size={12} />
        </div>
        <p className="mt-0.5 text-[10.5px] font-semibold text-[#4a7ab5]">{item.reasonLabel}</p>
        <p className="clamp2 mt-1 text-[11.5px] font-medium leading-snug text-ink2">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-[15px] font-bold text-leaf-deep">{inr(item.price)}</span>
          {inCart ? (
            <Stepper small qty={inCart.qty} onChange={(q) => setQty(item.id, q)} />
          ) : (
            <Button size="xs" variant="outline" icon="plus" onClick={() => {
              add({ menuItemId: item.id, name: item.name, price: item.price, veg: item.veg, image: item.image, desc: item.description });
              push(`${item.name} added to your tray`);
            }}>
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecialCard({ item }: { item: AiSpecial }) {
  const { items, add, setQty } = useCart();
  const { push } = useToast();
  const inCart = items.find((i) => i.menuItemId === item.id);
  const urgencyCls = item.urgency === "low_stock" ? "text-chili border-chili/30 bg-chili-soft/70" : "text-leaf-deep border-leaf/30 bg-leaf-soft/70";
  const urgencyLabel = item.urgency === "low_stock" ? "Limited stock" : "Chef's pick";
  return (
    <div className="group flex overflow-hidden rounded-2xl border border-[#cde0c8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative w-28 shrink-0 overflow-hidden sm:w-32">
        {item.image && (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className={cx("absolute left-1.5 top-1.5 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold", urgencyCls)}>
          {urgencyLabel}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-display text-[15px] font-bold text-ink">{item.name}</h3>
          <VegMark veg={item.veg} size={12} />
        </div>
        <p className="mt-0.5 text-[10.5px] font-semibold text-leaf-deep">{item.specialReason}</p>
        <p className="clamp2 mt-1 text-[11.5px] font-medium leading-snug text-ink2">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-[15px] font-bold text-leaf-deep">{inr(item.price)}</span>
          {inCart ? (
            <Stepper small qty={inCart.qty} onChange={(q) => setQty(item.id, q)} />
          ) : (
            <Button size="xs" variant="outline" icon="plus" onClick={() => {
              add({ menuItemId: item.id, name: item.name, price: item.price, veg: item.veg, image: item.image, desc: item.description });
              push(`${item.name} added to your tray`);
            }}>
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function VegDot({ veg }: { veg: boolean }) {
  return <VegMark veg={veg} size={12} />;
}
