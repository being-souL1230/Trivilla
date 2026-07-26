"use client";
import { Button, Icon, Modal } from "@/components/ui";
import { cx, fmtDateFull, fmtTime, inr, PAY_LABEL, type Order } from "@/lib/utils";

type BillInvoiceProps = {
  order: Order;
  open: boolean;
  onClose: () => void;
  /** If true, shows "Printed by" info at bottom for admin view */
  adminView?: boolean;
};

export default function BillInvoice({ order, open, onClose, adminView }: BillInvoiceProps) {
  if (!order) return null;

  const items = order.items ?? [];
  const subtotal = order.subtotal || items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = order.tax || Math.round(subtotal * 0.05);
  const total = order.total || subtotal + tax;
  const date = new Date(order.createdAt);

  return (
    <Modal open={open} onClose={onClose} title={`Invoice — ${order.code}`} wide>
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-ink to-[#3d2a18] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl font-bold tracking-tight">Trivilla</p>
              <p className="text-[11px] font-semibold text-gold uppercase tracking-wider">Smart Restaurant</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] font-bold text-gold/80 tracking-wider">{order.code}</p>
              <p className="text-[11px] font-semibold text-white/70">{fmtDateFull(date)}</p>
            </div>
          </div>
        </div>

        {/* Bill details */}
        <div className="px-6 py-4 border-b border-line bg-cream/50">
          <div className="grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <p className="font-bold text-ink2 uppercase tracking-wider text-[10px]">Customer</p>
              <p className="mt-0.5 font-extrabold text-ink">{order.customerName}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink2 uppercase tracking-wider text-[10px]">Time</p>
              <p className="mt-0.5 font-bold text-ink">{fmtTime(date)}</p>
            </div>
            <div>
              <p className="font-bold text-ink2 uppercase tracking-wider text-[10px]">Service</p>
              <p className="mt-0.5 font-bold text-ink">
                {order.type === "dine-in" && order.tableNo ? `Dine-in · Table ${order.tableNo}` : "Takeaway"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink2 uppercase tracking-wider text-[10px]">Payment</p>
              <p className="mt-0.5 font-bold text-ink">{PAY_LABEL[order.paymentMode]}</p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="px-6 py-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[10.5px] font-extrabold uppercase tracking-wider text-ink2">
                <th className="pb-2 pr-2">Item</th>
                <th className="pb-2 px-2 text-center">Qty</th>
                <th className="pb-2 px-2 text-right">Rate</th>
                <th className="pb-2 pl-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={i.id || idx} className="border-b border-dashed border-line/60">
                  <td className="py-2.5 pr-2 text-[13px] font-bold text-ink">{i.name}</td>
                  <td className="py-2.5 px-2 text-center text-[13px] font-semibold text-ink2">{i.qty}</td>
                  <td className="py-2.5 px-2 text-right text-[12.5px] font-semibold text-ink2">{inr(i.price)}</td>
                  <td className="py-2.5 pl-2 text-right text-[13px] font-extrabold text-ink">{inr(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-line bg-cream/30">
          <div className="ml-auto max-w-60 space-y-1.5">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-ink2">Subtotal</span>
              <span className="font-bold text-ink">{inr(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-ink2">GST (5%)</span>
              <span className="font-bold text-ink">{inr(tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-1.5 text-[15px]">
              <span className="font-extrabold text-ink">Total</span>
              <span className="font-display font-black text-leaf-deep">{inr(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line text-center">
          <p className="text-[10.5px] font-medium text-ink2">
            FSSAI Lic. 21426XXXXXX • Prices inclusive of all taxes
            {adminView && <span className="block mt-0.5">Printed — {fmtDateFull(new Date())}</span>}
          </p>
        </div>

        {order.note && (
          <div className="px-6 py-2.5 bg-gold-soft/40 border-t border-[#e6d3a3]">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7a5a12]">
              <Icon name="note" size={12} className="text-gold" /> Note: {order.note}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
