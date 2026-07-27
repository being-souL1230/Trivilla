"use client";
import { useEffect, useMemo, useState } from "react";
import FloorPlan from "@/components/FloorPlan";
import { Button, ErrorState, Field, Icon, Input, Pill, Skeleton, Stepper, Textarea } from "@/components/ui";
import { cx, addDaysStr, DINNER_SLOTS, fmtDateFull, LUNCH_SLOTS, RES_META, todayStr, type Reservation, type TableT } from "@/lib/utils";
import { get, patch, post, useAuth, useFetch, useToast } from "@/store";
import type { AiTableSuggestion } from "@/lib/ai";

const LEGEND = [
  { s: "free", label: "Available", cls: "bg-[#7fa36b]" },
  { s: "occupied", label: "Occupied", cls: "bg-[#cf8a3e]" },
  { s: "reserved", label: "Reserved", cls: "bg-[#a7a29a]" },
  { s: "cleaning", label: "Cleaning", cls: "border-2 border-dashed border-[#b7a684] bg-[#ece2cd]" },
];

const shiftDate = (iso: string, delta: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export default function BookPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const { data: tables, loading, error, reload } = useFetch<TableT[]>("/api/data/tables", { interval: 20000 });
  const { data: myBookings } = useFetch<Reservation[]>(user ? "/api/data/reservations" : null);

  const [date, setDate] = useState(todayStr());
  const [selected, setSelected] = useState<TableT | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [slot, setSlot] = useState("");
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ tableNo: number; slot: string; date: string; name: string } | null>(null);
  const [aiSuggest, setAiSuggest] = useState<AiTableSuggestion | null>(null);

  useEffect(() => {
    if (user) {
      setName((n) => n || user.name);
      setPhone((p) => p || user.phone);
    }
  }, [user]);

  // keep guests within the selected table's capacity
  useEffect(() => {
    if (selected) setGuests((g) => Math.min(Math.max(1, g), selected.seats));
  }, [selected]);

  /* 🪑 Smart table suggestion — AI picks the best table for party size */
  useEffect(() => {
    if (!selected && tables && freeCount > 0) {
      get<AiTableSuggestion[]>("/api/ai/smart-table?suggest=1&guests=" + guests)
        .then((suggestions) => {
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            setAiSuggest(suggestions[0]);
          }
        })
        .catch(() => {});
    } else {
      setAiSuggest(null);
    }
  }, [selected, guests, tables]);

  // if the table we picked got taken meanwhile, let go
  useEffect(() => {
    if (selected && tables) {
      const fresh = tables.find((t) => t.id === selected.id);
      if (fresh && fresh.status !== "free") {
        setSelected(null);
        push(`Table ${fresh.tableNo} just got taken — pick another one`, "info");
      }
    }
  }, [tables, selected, push]);

  const upcoming = useMemo(
    () =>
      (myBookings ?? [])
        .filter((r) => !["completed", "cancelled"].includes(r.status) && r.date >= todayStr())
        .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
        .slice(0, 4),
    [myBookings],
  );

  const pickTable = (t: TableT) => {
    if (t.status !== "free") {
      const why =
        t.status === "occupied" ? "is occupied right now" : t.status === "reserved" ? "is already reserved" : "is being cleaned";
      push(`Table ${t.tableNo} ${why} — tap a free table`, "info");
      return;
    }
    setDone(null);
    setSelected(t);
  };

  const submit = async () => {
    if (!selected) return;
    if (!slot) return push("Pick a time slot first", "err");
    if (!user && name.trim().length < 2) return push("Please tell us your name", "err");
    if (!user && phone.replace(/\D/g, "").length < 10) return push("Enter a valid 10-digit phone", "err");
    setBusy(true);
    try {
      await post("/api/data/reservations", {
        date,
        slot,
        guests,
        phone,
        note,
        name: user ? undefined : name,
        tableId: selected.id,
      });
      setDone({ tableNo: selected.tableNo, slot, date, name: user ? user.name.split(" ")[0] : name.split(" ")[0] });
      push(`Table ${selected.tableNo} held for you`);
      setNote("");
      setSlot("");
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not book", "err");
    } finally {
      setBusy(false);
    }
  };

  const freeCount = (tables ?? []).filter((t) => t.status === "free").length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-7">
      {/* top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-extrabold uppercase tracking-[0.22em] text-gold">Pick your spot</p>
          <h1 className="mt-1 flex items-center gap-2.5 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
            The Table Map
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd8c4] bg-leaf-soft px-2.5 py-1 text-[10.5px] font-extrabold text-leaf-deep">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" /> LIVE
            </span>
          </h1>
        </div>          <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-white/80 shadow-sm">
            <button
              onClick={() => setDate((d) => shiftDate(d, -1))}
              disabled={date <= todayStr()}
              className="grid h-11 w-10 place-items-center rounded-l-xl text-ink2 transition hover:bg-sand hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous day"
            >
              <Icon name="chevron" size={15} className="rotate-90" />
            </button>
            <span className="min-w-36 border-x border-line px-4 py-2.5 text-center text-[13.5px] font-extrabold text-ink">
              {fmtDateFull(date)}
            </span>
            <button
              onClick={() => setDate((d) => shiftDate(d, 1))}
              disabled={date >= addDaysStr(14)}
              className="grid h-11 w-10 place-items-center rounded-r-xl text-ink2 transition hover:bg-sand hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next day"
            >
              <Icon name="chevron" size={15} className="-rotate-90" />
            </button>
          </div>
          <Button variant={date === todayStr() ? "dark" : "outline"} onClick={() => setDate(todayStr())} icon="calendar">
            Today
          </Button>
        </div>
      </div>
      <p className="mt-2 text-[13.5px] font-medium text-ink2">
        Tap any <span className="font-extrabold text-leaf-deep">green table</span> to hold it for your visit —{" "}
        <span className="font-extrabold text-brand">no sign-in needed</span>, we'll call to confirm.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ============ floor plan ============ */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-[#f6f0e2] shadow-sm">
          {error ? (
            <div className="p-6"><ErrorState msg={error} retry={() => reload()} /></div>
          ) : loading && !tables ? (
            <Skeleton className="aspect-[1000/620] w-full rounded-none" />
          ) : (
            <div className="anim-up p-2 sm:p-4">
              <FloorPlan tables={tables ?? []} selectedId={selected?.id ?? null} onSelect={pickTable} />
            </div>
          )}
          {/* legend */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-2xl border border-line bg-cream/95 px-4 py-3.5 shadow-lg backdrop-blur">
            {LEGEND.map((l) => (
              <span key={l.s} className="flex items-center gap-2.5 text-[12px] font-extrabold text-ink">
                <span className={cx("h-4 w-4 rounded-md", l.cls)} />
                {l.label}
              </span>
            ))}
          </div>
          {/* stats chip */}
          <div className="absolute right-4 top-4 rounded-xl border border-line bg-ink/85 px-3.5 py-2 text-[12px] font-extrabold text-cream backdrop-blur">
            {freeCount} tables free right now
          </div>
        </div>

        {/* ============ booking panel ============ */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-line bg-white/80 p-5 shadow-sm">
            {done ? (
              <div className="anim-pop text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-leaf-soft bg-leaf text-white">
                  <Icon name="check" size={30} />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">Table {done.tableNo} held!</h3>
                <p className="mt-2 text-[13.5px] font-medium text-ink2">
                  {fmtDateFull(done.date)} • {done.slot}
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-brand bg-brand-soft/50 px-4 py-3 text-left">
                  <p className="text-[12px] font-bold text-brand-deep">
                    Shukriya {done.name}! Our host will call you within 15 minutes to confirm. Walk in, say your name, and your table will be waiting. 🪑
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" full onClick={() => { setDone(null); setSelected(null); }}>
                    Done
                  </Button>
                  <Button full icon="refresh" onClick={() => { setDone(null); }}>
                    Book another
                  </Button>
                </div>
              </div>
            ) : selected ? (
              <div className="anim-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-display text-[18px] font-bold text-gold">
                      T{selected.tableNo}
                    </span>
                    <div>
                      <p className="font-display text-[18px] font-bold text-ink">Table {selected.tableNo}</p>
                      <p className="text-[12px] font-bold text-ink2">{selected.zone} • up to {selected.seats} guests</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-ink2 transition hover:bg-sand hover:text-ink" aria-label="Deselect table">
                    <Icon name="x" size={15} />
                  </button>
                </div>

                <div className="mt-4 space-y-3.5">
                  {!user && (
                    <>
                      <Field label="Your name">
                        <Input placeholder="e.g. Kavya Patil" value={name} onChange={(e) => setName(e.target.value)} />
                      </Field>
                      <Field label="Phone (we'll call to confirm)">
                        <Input placeholder="98xxx xxxxx" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </Field>
                    </>
                  )}

                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><Icon name="sun" size={14} className="text-gold" /> Lunch</div>
                    <div className="flex flex-wrap gap-1.5">
                      {LUNCH_SLOTS.map((s) => (
                        <button key={s} onClick={() => setSlot(s)}
                          className={cx("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition active:scale-95",
                            slot === s ? "border-leaf-deep bg-leaf text-white shadow-sm" : "border-line bg-white text-ink2 hover:border-leaf hover:text-leaf")}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="mb-1.5 mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><Icon name="moon" size={14} className="text-gold" /> Dinner</div>
                    <div className="flex flex-wrap gap-1.5">
                      {DINNER_SLOTS.map((s) => (
                        <button key={s} onClick={() => setSlot(s)}
                          className={cx("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition active:scale-95",
                            slot === s ? "border-leaf-deep bg-leaf text-white shadow-sm" : "border-line bg-white text-ink2 hover:border-leaf hover:text-leaf")}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-line bg-cream px-3.5 py-2.5">
                    <span className="text-[12.5px] font-bold text-ink">Guests</span>
                    <Stepper small qty={guests} onChange={(q) => setGuests(Math.min(selected.seats, Math.max(1, q)))} />
                  </div>

                  <Textarea placeholder="Birthday? Window view? Tell us anything…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="min-h-16" />

                  <Button full size="lg" icon="check" loading={busy} onClick={submit}>
                    Hold Table {selected.tableNo} • {slot || "pick a slot"}
                  </Button>
                  <p className="text-center text-[11.5px] font-medium text-ink2">
                    Free cancellation • Held 15 min past your slot
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-line bg-sand text-brand">
                  <Icon name="table" size={30} />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">Choose your table</h3>
                <p className="mx-auto mt-1.5 max-w-60 text-[13px] font-medium text-ink2">
                  Tap a <span className="font-extrabold text-leaf-deep">green table</span> on the map — window, patio or a private booth.
                </p>
                <div className="mt-5 space-y-2 text-left">
                  {(["Window Side", "Patio", "Main Hall", "Private"] as const).map((z) => {
                    const n = (tables ?? []).filter((t) => t.zone === (z === "Patio" ? "Terrace" : z) && t.status === "free").length;
                    const zoneIcon = z === "Window Side" ? "window" : z === "Patio" ? "leaf" : z === "Main Hall" ? "chef" : "door";
                    return (
                      <div key={z} className="flex items-center justify-between rounded-xl border border-line bg-cream px-3.5 py-2.5">
                        <span className="flex items-center gap-2 text-[13px] font-extrabold text-ink"><Icon name={zoneIcon as any} size={14} className="text-gold" /> {z}</span>
                        <span className={cx("text-[12px] font-extrabold", n ? "text-leaf-deep" : "text-ink2/60")}>
                          {n ? `${n} free` : "full"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* signed-in: their bookings */}
          {user && upcoming.length > 0 && (
            <div className="rounded-3xl border border-line bg-white/80 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-[16px] font-bold text-ink">
                <Icon name="calendar" size={16} className="text-brand" /> Your upcoming bookings
              </h3>
              <ul className="mt-3 space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 rounded-xl border border-line bg-cream px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-extrabold text-ink">{fmtDateFull(r.date)} • {r.slot}</p>
                        <p className="text-[11.5px] font-bold text-ink2">{r.guests} guests{r.tableNo ? ` • Table ${r.tableNo}` : ""}</p>
                      </div>
                      <Pill cls={RES_META[r.status]?.cls || "bg-sand text-ink2 border-line"}>{RES_META[r.status]?.label || r.status}</Pill>
                    </div>
                    {/* Accept / Decline for alternate table offers */}
                    {r.status === "alternate_offered" && r.tableNo && (
                      <div className="flex items-center gap-2 border-t border-dashed border-line pt-2">
                        <p className="flex-1 text-[11.5px] font-semibold text-[#6b3fa0]">
                          Manager suggested Table {r.tableNo} — accept?
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              await patch(`/api/data/reservations/${r.id}`, { status: "confirmed" });
                              push("Alternate accepted! Table confirmed", "ok");
                              window.location.reload();
                            } catch (e) {
                              push(e instanceof Error ? e.message : "Failed", "err");
                            }
                          }}
                          className="rounded-lg bg-leaf px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-leaf-deep"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await patch(`/api/data/reservations/${r.id}`, { status: "requested" });
                              push("Declined — manager notified ↩️", "info");
                              window.location.reload();
                            } catch (e) {
                              push(e instanceof Error ? e.message : "Failed", "err");
                            }
                          }}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-400 transition hover:bg-red-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pattern-dark rounded-3xl border border-leaf-deep bg-leaf-deep p-5 text-cream">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">Good to know</p>
            <ul className="mt-3 space-y-2 text-[12.5px] font-bold text-cream/85">
              <li className="flex items-start gap-2.5"><Icon name="clock" size={14} className="mt-0.5 shrink-0 text-gold" /> Table held 15 minutes past your slot</li>
              <li className="flex items-start gap-2.5"><Icon name="sparkle" size={14} className="mt-0.5 shrink-0 text-gold" /> Welcome sherbet on the house</li>
              <li className="flex items-start gap-2.5"><Icon name="phone" size={14} className="mt-0.5 shrink-0 text-gold" /> Big group of 8+? Call +91 98220 11223</li>
            </ul>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-center text-[12px] font-semibold text-ink2">
        Map updates live as tables get seated & freed • Lunch 12–3:30 PM • Dinner 7–11 PM
      </p>
    </div>
  );
}
