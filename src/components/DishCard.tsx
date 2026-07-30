"use client";
import { Button, Icon, Spice, Stepper, VegMark } from "@/components/ui";
import { RatingBadge } from "@/components/StarRating";
import { cx, inr, type MenuItem } from "@/lib/utils";
import { useCart, useToast } from "@/store";
import type { AiDynamicPrice } from "@/lib/pricing";

/**
 * Editorial dish card — warm photo up top, serif name, sage price.
 * Used on the menu page grid and the home "favourites" section.
 *
 * Pass `dynPrice` to show original (strikethrough) + adjusted price inside the card.
 */
export default function DishCard({ item, compact, dynPrice, rating }: { item: MenuItem; compact?: boolean; dynPrice?: AiDynamicPrice; rating?: { avg: number; count: number } }) {
  const { items, add, setQty } = useCart();
  const { push } = useToast();
  const inCart = items.find((i) => i.menuItemId === item.id);

  // Use dynPrice.adjustedPrice for add-to-cart and display if available
  const displayPrice = dynPrice && dynPrice.label !== "Standard" ? dynPrice.adjustedPrice : item.price;

  const doAdd = () => {
    add({ menuItemId: item.id, name: item.name, price: displayPrice, veg: item.veg, image: item.image, desc: item.description }, 1);
    push(`${item.name} added to your tray`);
  };

  return (
    <article
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(43,27,14,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8c9a8] hover:shadow-xl hover:shadow-brand/10",
        !item.available && "opacity-95",
      )}
    >
      {/* photo */}
      <div className={cx("relative overflow-hidden", compact ? "h-32" : "h-44")}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className={cx(
              "h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]",
              !item.available && "grayscale opacity-70",
            )}
          />
        ) : (
          <div className="pattern-paisley grid h-full w-full place-items-center bg-sand text-brand">
            <Icon name="chef" size={30} />
          </div>
        )}

        {/* availability pill */}
        <span
          className={cx(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm backdrop-blur",
            item.available ? "bg-cream/95 text-leaf-deep" : "bg-ink/75 text-cream",
          )}
        >
          <span className={cx("h-1.5 w-1.5 rounded-full", item.available ? "animate-pulse bg-leaf" : "bg-cream/60")} />
          {item.available ? "Available" : "Sold out today"}
        </span>

        {/* prep time */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/65 px-2 py-1 text-[10.5px] font-bold text-cream backdrop-blur">
          <Icon name="clock" size={11} /> {item.prepTime} min
        </span>

        {/* veg / non-veg mark on photo corner */}
        <span className="absolute bottom-2.5 right-2.5 grid h-6.5 w-6.5 place-items-center rounded-lg bg-cream/95 shadow-sm">
          <VegMark veg={item.veg} size={14} />
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-display text-[17px] font-bold leading-snug text-ink">
            {item.name}
            {item.popular && <Icon name="star" size={13} className="shrink-0 text-gold" />}
          </h3>
          <Spice level={item.spice} />
        </div>
        {/* Rating badge */}
        {rating && rating.count > 0 && (
          <div className="mt-1">
            <RatingBadge avg={rating.avg} count={rating.count} size={10} />
          </div>
        )}
        {!compact && (
          <p className="clamp2 mt-1.5 text-[12.5px] font-medium leading-relaxed text-ink2">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3.5">
          <div>
            {dynPrice && dynPrice.label === "Happy Hour" ? (
              /* Discount: show original (strikethrough) + discounted price */
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10.5px] font-bold text-ink2/50 line-through">{inr(dynPrice.basePrice)}</span>
                <span className="font-display text-[18px] font-bold tracking-tight text-emerald-600">
                  {inr(dynPrice.adjustedPrice)}
                </span>
              </div>
            ) : (
              <span className="font-display text-[18px] font-bold tracking-tight text-leaf-deep">
                {inr(dynPrice && dynPrice.label === "Peak Surcharge" ? dynPrice.adjustedPrice : item.price)}
              </span>
            )}
          </div>
          {item.available ? (
            inCart ? (
              <Stepper small qty={inCart.qty} onChange={(q) => setQty(item.id, q)} />
            ) : (
              <Button size="xs" onClick={doAdd} icon="plus">
                Add
              </Button>
            )
          ) : (
            <span className="text-[11.5px] font-bold text-ink2">Back tomorrow</span>
          )}
        </div>
      </div>
    </article>
  );
}
