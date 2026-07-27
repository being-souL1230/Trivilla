"use client";
import { useEffect, useState } from "react";
import { Button, Field, Icon, Input } from "@/components/ui";
import { fmtDateFull, fmtTime, inr, PAY_LABEL, type Order } from "@/lib/utils";
import { post, useAuth, useToast } from "@/store";

type BillInvoiceProps = {
  order: Order;
  open: boolean;
  onClose: () => void;
  adminView?: boolean;
};

export default function BillInvoice({ order, open, onClose, adminView }: BillInvoiceProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const [emailOpen, setEmailOpen] = useState(false);
  const [billEmail, setBillEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setBillEmail(user?.email ?? "");
      setEmailOpen(false);
    }
  }, [open, user]);

  const sendBill = async () => {
    if (!billEmail.trim()) {
      push("Please enter an email address", "err");
      return;
    }
    setSending(true);
    try {
      await post("/api/data/send-bill", { orderId: order.id, email: billEmail.trim() });
      push(`Bill sent to ${billEmail.trim()}`, "ok");
      setEmailOpen(false);
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not send bill", "err");
    } finally {
      setSending(false);
    }
  };

  if (!order || !open) return null;

  const items = order.items ?? [];
  const subtotal = order.subtotal || items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxTotal = order.tax || Math.round(subtotal * 0.05);
  const cgst = Math.round(taxTotal / 2);
  const sgst = taxTotal - cgst;
  const total = order.total || subtotal + taxTotal;
  const date = new Date(order.createdAt);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-line/70 bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-3.5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Trivilla</h1>
              <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-white/60">
                Smart Restaurant, Linking Road · Bandra West, Mumbai - 400050
              </p>
              <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">
                GSTIN: 27AABCT1234Q1Z5
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={onClose} className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">
                <Icon name="x" size={14} />
              </button>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-line/40 bg-cream/40 px-5 py-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Invoice</p>
            <p className="mt-0.5 text-[12px] font-bold text-ink">{order.code}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Date</p>
            <p className="mt-0.5 text-[12px] font-bold text-ink">{fmtDateFull(date)} · {fmtTime(date)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Table</p>
            <p className="mt-0.5 text-[12px] font-bold text-ink">
              {order.type === "dine-in" && order.tableNo ? `T${order.tableNo}` : "Takeaway"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Payment</p>
            <p className="mt-0.5 text-[12px] font-bold text-ink">{PAY_LABEL[order.paymentMode]}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="border-b border-line/40 px-5 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Bill To</p>
          <p className="mt-0.5 text-[12.5px] font-bold text-ink">{order.customerName}</p>
        </div>

        {/* Items */}
        <div className="max-h-[260px] overflow-y-auto scroll-thin px-5 pb-1 pt-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-ink2/50">Order Details</p>
          <div className="mt-2">
            <div className="flex items-center gap-2 border-b border-line/40 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-ink2/40">
              <span className="flex-1">Item</span>
              <span className="w-9 text-center">Qty</span>
              <span className="w-14 text-right">Amt</span>
            </div>
            <div className="divide-y divide-line/20">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink">{item.name}</p>
                  </div>
                  <span className="w-9 text-center text-[11px] font-medium text-ink2">×{item.qty}</span>
                  <span className="w-14 text-right text-[12px] font-bold text-ink">{inr(item.qty * item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-line bg-cream/30 px-5 py-3">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-ink2">Subtotal</span>
            <span className="font-bold text-ink">{inr(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-ink2">CGST (2.5%)</span>
            <span className="font-medium text-ink2">{inr(cgst)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-ink2">SGST (2.5%)</span>
            <span className="font-medium text-ink2">{inr(sgst)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-line/60 pt-2">
            <span className="text-[13px] font-bold text-ink">Grand Total</span>
            <span className="text-[16px] font-extrabold tracking-tight text-ink">{inr(total)}</span>
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div className="border-t border-line/40 bg-amber-50/70 px-5 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <Icon name="note" size={11} className="text-amber-500" /> {order.note}
            </p>
          </div>
        )}

        {/* Email Bill Button */}
        <div className="border-t border-line/40 px-5 py-2.5">
          {!emailOpen ? (
            <Button full size="sm" variant="dark" icon="mail" onClick={() => setEmailOpen(true)}>
              Email this bill
            </Button>
          ) : (
            <div className="anim-down space-y-2">
              <Field label="Send to email">
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={billEmail}
                  onChange={(e) => setBillEmail(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" full onClick={() => setEmailOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="dark" full loading={sending} onClick={sendBill}>
                  Send Bill
                </Button>
              </div>
              <p className="text-[9px] text-center font-medium text-ink2/50">
                Bill will include a QR code for scanning
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line/40 bg-cream/60 px-5 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-ink2/60">Thank you for dining with us!</p>
          <p className="mt-0.5 text-[9px] font-medium text-ink2/40">Computer generated invoice</p>
          {adminView && (
            <p className="mt-0.5 text-[9px] font-medium text-ink2/30">Printed — {fmtDateFull(new Date())}</p>
          )}
        </div>
      </div>
    </div>
  );
}
