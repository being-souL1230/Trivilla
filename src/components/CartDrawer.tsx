"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Field, Icon, Input, Select, Stepper, Textarea, VegMark } from "@/components/ui";
import { cx, inr, type MenuItem, type TableT } from "@/lib/utils";
import { get, post, useAuth, useCart, useFetch, useToast } from "@/store";
import type { AiReadyTime } from "@/lib/ai";

type Step = "cart" | "checkout" | "done";

/* Items worth nudging alongside a meal: drinks, sides, papad, salads, desserts. */
function useSuggestions() {
  const { data } = useFetch<MenuItem[]>("/api/data/menu");
  const { items } = useCart();
  return useMemo(() => {
    if (!data) return [];
    const inCart = new Set(items.map((i) => i.menuItemId));
    const hasMain = items.some((i) => i.price >= 180);
    const score = (m: MenuItem) => {
      if (!m.available || inCart.has(m.id)) return -1;
      let s = 0;
      if (/salad|raita|papad|chaas|lassi|curd|dahi|soda|lime/i.test(m.name)) s += 4;
      if (m.category === "Sides" || m.category === "Drinks") s += 3;
      if (m.category === "Desserts") s += 2;
      if (m.popular) s += 1;
      if (m.price <= 99) s += 1;
      if (hasMain && (m.category === "Sides" || m.category === "Drinks")) s += 2;
      return s;
    };
    return data
      .map((m) => ({ m, s: score(m) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.m.price - b.m.price)
      .slice(0, 6)
      .map((x) => x.m);
  }, [data, items]);
}

export default function CartDrawer() {
  const { cartOpen, setCartOpen, items, setQty, setNote, clear, subtotal } = useCart();
  const { user } = useAuth();
  const { push } = useToast();
  const suggestions = useSuggestions();

  const [step, setStep] = useState<Step>("cart");
  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [type, setType] = useState<"dine-in" | "takeaway">("dine-in");
  const [tableId, setTableId] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const [note, setOrderNote] = useState("");
  const [tables, setTables] = useState<TableT[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [placedCode, setPlacedCode] = useState("");
  const [placedId, setPlacedId] = useState<number | null>(null);
  const [readyTime, setReadyTime] = useState<AiReadyTime | null>(null);
  const [noteOpen, setNoteOpen] = useState<number | null>(null);

  const tax = Math.round(subtotal * 0.05);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (user) {
      setGName((n) => n || user.name);
      setGPhone((p) => p || user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (cartOpen && step === "checkout" && !tables.length) {
      get<TableT[]>("/api/data/tables")
        .then((t) => {
          setTables(t);
          const mine = t.find((x) => x.status === "occupied" || x.status === "free");
          if (mine) setTableId(mine.id);
        })
        .catch(() => {});
    }
  }, [cartOpen, step, tables.length]);

  useEffect(() => {
    if (!cartOpen) {
      const t = setTimeout(() => {
        setStep("cart");
        setErr("");
        setNoteOpen(null);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [cartOpen]);

  const close = () => setCartOpen(false);

  const placeOrder = async () => {
    if (!user && gName.trim().length < 2) {
      setErr("Please tell us your name");
      return;
    }
    if (!user && gPhone.replace(/\D/g, "").length < 10) {
      setErr("Enter a valid 10-digit phone number");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const itemNotes = items.filter((i) => i.note?.trim()).map((i) => `${i.name}: ${i.note!.trim()}`);
      const fullNote = [note.trim(), ...itemNotes].filter(Boolean).join(" • ").slice(0, 300);
      const r = await post<{ id: number; code: string }>("/api/data/orders", {
        items: items.map((i) => ({ menuItemId: i.menuItemId, qty: i.qty })),
        type,
        tableId: type === "dine-in" ? tableId || null : null,
        paymentMode,
        note: fullNote,
        name: user ? undefined : gName,
        phone: user ? undefined : gPhone,
      });
      setPlacedCode(r.code);
      setPlacedId(r.id);
      clear();
      setOrderNote("");
      setStep("done");
      push(`Order ${r.code} sent to the kitchen`);
      // Fetch ready-time estimate
      get<AiReadyTime>(`/api/ai/ready-time/${r.id}`)
        .then((rt) => setReadyTime(rt))
        .catch(() => {});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={close} />
          <aside className="anim-slidein absolute right-0 top-0 flex h-full w-[min(94vw,440px)] flex-col border-l border-line bg-cream shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <button onClick={() => (step === "checkout" ? setStep("cart") : close())} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white/70 text-ink transition hover:border-brand hover:text-brand" aria-label="Back">
                <Icon name={step === "checkout" ? "chevron" : "x"} size={step === "checkout" ? 16 : 15} className={step === "checkout" ? "rotate-90" : ""} />
              </button>
              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-ink">
                  {step === "cart" && "Your Tray"}
                  {step === "checkout" && "Almost there"}
                  {step === "done" && "Order placed!"}
                </h2>
                {step === "cart" && items.length > 0 && (
                  <p className="text-[11px] font-bold text-ink2">Review your items and proceed to checkout</p>
                )}
              </div>
              <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white/70 text-ink">
                <Icon name="tray" size={17} />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">{itemCount}</span>
                )}
              </div>
            </div>

            {/* ================= CART ================= */}
            {step === "cart" && (
              <>
                <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-sand text-brand">
                        <Icon name="tray" size={30} />
                      </div>
                      <p className="mt-4 font-display text-xl font-bold text-ink">Your tray is empty</p>
                      <p className="mt-1.5 max-w-56 text-[13px] font-medium text-ink2">
                        Browse the menu and add something tasty — it'll wait for you here.
                      </p>
                      <Link href="/menu" onClick={close} className="mt-5">
                        <Button icon="arrow">See the menu</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {items.map((i) => (
                        <article key={i.menuItemId} className="anim-up rounded-2xl border border-line bg-white/85 p-3.5 shadow-sm">
                          <div className="flex gap-3.5">
                            {i.image ? (
                              <img src={i.image} alt="" className="h-[88px] w-[88px] shrink-0 rounded-xl object-cover" />
                            ) : (
                              <span className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-xl bg-sand text-brand">
                                <Icon name="chef" size={26} />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="flex items-center gap-1.5 font-display text-[15.5px] font-bold leading-tight text-ink">
                                  <VegMark veg={i.veg} size={13} />
                                  <span className="truncate">{i.name}</span>
                                </h3>
                                <button
                                  onClick={() => setQty(i.menuItemId, 0)}
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink2/60 transition hover:bg-chili-soft hover:text-chili"
                                  aria-label={`Remove ${i.name}`}
                                >
                                  <Icon name="trash" size={15} />
                                </button>
                              </div>
                              {i.desc && <p className="clamp2 mt-1 text-[11.5px] font-medium leading-snug text-ink2">{i.desc}</p>}
                              <div className="mt-2 flex items-center justify-between">
                                <p className="text-[15.5px] font-extrabold tracking-tight text-ink">{inr(i.price)}</p>
                                <span className="rounded-full bg-sand px-1 py-0.5">
                                  <Stepper small qty={i.qty} onChange={(q) => setQty(i.menuItemId, q)} />
                                </span>
                              </div>
                              <button
                                onClick={() => setNoteOpen(noteOpen === i.menuItemId ? null : i.menuItemId)}
                                className={cx(
                                  "mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-extrabold underline-offset-2 hover:underline",
                                  i.note ? "text-leaf-deep" : "text-gold",
                                )}
                              >
                                <Icon name="edit" size={12} />
                                {i.note ? "Note added — edit" : "Add cooking instructions"}
                              </button>
                              {noteOpen === i.menuItemId && (
                                <input
                                  autoFocus
                                  value={i.note ?? ""}
                                  onChange={(e) => setNote(i.menuItemId, e.target.value)}
                                  placeholder="Less spicy, no onion, extra gravy…"
                                  maxLength={80}
                                  className="anim-down mt-2 w-full rounded-lg border border-line bg-cream px-3 py-2 text-[12px] font-semibold outline-none focus:border-brand"
                                />
                              )}
                              {i.note && noteOpen !== i.menuItemId && (
                                <p className="mt-1.5 flex items-center gap-1 rounded-lg bg-leaf-soft px-2.5 py-1.5 text-[11px] font-bold text-leaf-deep"><Icon name="note" size={12} /> {i.note}</p>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}

                      {/* ---- complete your meal ---- */}
                      {suggestions.length > 0 && (
                        <section className="anim-up -mx-4 mt-5 border-t border-dashed border-line px-4 pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-display text-[16px] font-bold text-ink">Complete your meal</h3>
                              <p className="text-[11px] font-bold text-ink2">Things people love to add with this</p>
                            </div>
                            <Icon name="sparkle" size={16} className="text-gold" />
                          </div>
                          <div className="scroll-thin -mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1.5">
                            {suggestions.map((s) => (
                              <SuggestionCard key={s.id} item={s} />
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </div>

                {/* bill + cta */}
                {items.length > 0 && (
                  <div className="border-t border-line bg-white/70 px-4 pb-4 pt-4">
                    <div className="rounded-2xl border border-line bg-cream px-4 py-3.5">
                      <div className="flex justify-between text-[13px] font-semibold text-ink2">
                        <span>Subtotal</span><span>{inr(subtotal)}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between text-[13px] font-semibold text-ink2">
                        <span>GST (5%)</span><span>{inr(tax)}</span>
                      </div>
                      <div className="mt-2.5 flex items-end justify-between border-t border-dashed border-line pt-2.5">
                        <span className="font-display text-[19px] font-bold text-ink">Total</span>
                        <span className="font-display text-[22px] font-black tracking-tight text-ink">{inr(subtotal + tax)}</span>
                      </div>
                    </div>
                    <Button full size="lg" variant="dark" className="mt-3 rounded-xl" onClick={() => setStep("checkout")}>
                      Proceed to Checkout <Icon name="arrow" size={16} />
                    </Button>
                    <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-ink2">
                      <Icon name="checkCircle" size={12} className="text-leaf" /> No sign-in needed • UPI, Card or Cash at counter
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ================= CHECKOUT ================= */}
            {step === "checkout" && (
              <>
                <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-5 py-4">
                  {!user && (
                    <div className="rounded-2xl border border-[#e6d3a3] bg-gold-soft/60 p-4">
                      <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-[#7a5a12]">
                        <Icon name="sparkle" size={15} /> Ordering as a guest — no account needed
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Your name">
                          <Input placeholder="e.g. Kavya Patil" value={gName} onChange={(e) => setGName(e.target.value)} />
                        </Field>
                        <Field label="Phone (for order updates)">
                          <Input placeholder="98xxx xxxxx" inputMode="tel" value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-1.5 text-[12.5px] font-bold text-ink">Where should we serve it?</p>
                    <div className="flex rounded-xl border border-line bg-white/60 p-1">
                      {(["dine-in", "takeaway"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={cx(
                            "flex-1 rounded-lg py-2 text-[13px] font-bold transition",
                            type === t ? "bg-leaf text-white shadow-sm" : "text-ink2 hover:text-ink",
                          )}
                        >
                          {t === "dine-in" ? "Eating here" : "Taking away"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {type === "dine-in" && (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-bold text-ink">Which table are you at?</p>
                      <Select value={tableId} onChange={(e) => setTableId(Number(e.target.value))}>
                        <option value="">— Pick your table —</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>Table {t.tableNo} • {t.seats} seats • {t.zone}</option>
                        ))}
                      </Select>
                      <p className="mt-1 text-[11.5px] font-medium text-ink2">Not seated yet? Book one from the Table Map first.</p>
                    </div>
                  )}

                  <div>
                    <p className="mb-1.5 text-[12.5px] font-bold text-ink">How will you pay?</p>
                    <div className="space-y-2">
                      {(
                        [
                          ["upi", "UPI", "GPay / PhonePe / Paytm — pay after food"],
                          ["card", "Card", "Pay at the counter"],
                          ["cash", "Cash", "Simple & classic"],
                        ] as const
                      ).map(([v, label, sub]) => (
                        <button
                          key={v}
                          onClick={() => setPaymentMode(v)}
                          className={cx(
                            "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition",
                            paymentMode === v ? "border-brand bg-brand-soft/60 shadow-sm" : "border-line bg-white/60 hover:border-brand/50",
                          )}
                        >
                          <span className={cx("grid h-4.5 w-4.5 place-items-center rounded-full border-2", paymentMode === v ? "border-brand" : "border-line")}>
                            {paymentMode === v && <span className="h-2 w-2 rounded-full bg-brand" />}
                          </span>
                          <span>
                            <span className="block text-[13px] font-extrabold text-ink">{label}</span>
                            <span className="block text-[11.5px] font-medium text-ink2">{sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[12.5px] font-bold text-ink">Anything else for the whole order?</p>
                    <Textarea placeholder="e.g. bring extra napkins, celebrate a birthday…" value={note} onChange={(e) => setOrderNote(e.target.value)} maxLength={300} />
                  </div>

                  {err && (
                    <p className="rounded-xl border border-[#ecc4ba] bg-chili-soft px-3.5 py-2.5 text-[12.5px] font-bold text-chili">{err}</p>
                  )}
                </div>
                <div className="border-t border-line bg-white/70 px-5 py-4">
                  <div className="flex items-end justify-between">
                    <span className="font-display text-[17px] font-bold text-ink">To pay</span>
                    <span className="font-display text-[21px] font-black text-ink">{inr(subtotal + tax)}</span>
                  </div>
                  <Button full size="lg" variant="dark" className="mt-3 rounded-xl" loading={busy} onClick={placeOrder}>
                    Place order • {inr(subtotal + tax)} <Icon name="arrow" size={16} />
                  </Button>
                </div>
              </>
            )}

            {/* ================= DONE ================= */}
            {step === "done" && (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="anim-pop grid h-20 w-20 place-items-center rounded-full border-4 border-leaf-soft bg-leaf text-white">
                  <Icon name="check" size={36} />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-ink">Shukriya! Order placed</h3>
                <p className="mt-2 text-[13.5px] font-medium text-ink2">Your order code is</p>
                <p className="mt-1 rounded-xl border border-dashed border-brand bg-brand-soft/60 px-5 py-2 font-mono text-xl font-extrabold tracking-widest text-brand-deep">
                  {placedCode}
                </p>

                {/* ⏰ Exact Ready Time */}
                {readyTime ? (
                  <div className="mt-4 w-full max-w-xs rounded-2xl border border-dashed border-leaf bg-leaf-soft/50 px-4 py-3">
                    <p className="flex items-center justify-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-leaf-deep">
                      <Icon name="clock" size={14} /> Ready by
                    </p>
                    <p className="mt-0.5 font-display text-2xl font-black tracking-tight text-ink">
                      {readyTime.estimatedReadyAt}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink2">
                      ~{readyTime.estimatedMinutes} min • {readyTime.reason}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 h-16 w-full max-w-xs animate-pulse rounded-2xl bg-sand" />
                )}

                <p className="mt-3 max-w-60 text-[12.5px] font-medium text-ink2">
                  The kitchen has it. We'll ping you the moment your food is ready
                </p>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" onClick={close}>Keep browsing</Button>
                  <Link href="/orders" onClick={close}>
                    <Button icon="arrow">Track order</Button>
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function SuggestionCard({ item }: { item: MenuItem }) {
  const { add } = useCart();
  const { push } = useToast();
  return (
    <div className="w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {item.image ? (
        <img src={item.image} alt={item.name} className="h-20 w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-20 w-full place-items-center bg-sand text-brand"><Icon name="chef" size={22} /></div>
      )}
      <div className="p-2.5">
        <p className="truncate text-[12px] font-extrabold text-ink">{item.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[12px] font-extrabold text-leaf-deep">{inr(item.price)}</span>
          <button
            onClick={() => {
              add({ menuItemId: item.id, name: item.name, price: item.price, veg: item.veg, image: item.image, desc: item.description });
              push(`${item.name} added`);
            }}
            className="rounded-lg border border-leaf/50 px-2 py-1 text-[10.5px] font-extrabold text-leaf-deep transition hover:bg-leaf hover:text-white active:scale-95"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
