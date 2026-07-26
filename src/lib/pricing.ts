/**
 * Dynamic Pricing — client-safe module (no server-only imports).
 *
 * Separated from src/lib/ai.ts to avoid server-only dependencies
 * being imported by client components.
 */

export type AiDynamicPrice = {
  menuItemId: number;
  name: string;
  /** Original base price */
  basePrice: number;
  /** Adjusted price (may be same as base) */
  adjustedPrice: number;
  /** Absolute change in ₹ */
  change: number;
  /** Label for display */
  label: "Happy Hour" | "Peak Surcharge" | "Standard";
  /** Explanation */
  reason: string;
};

/**
 * Calculate dynamic price for a menu item based on time of day.
 *   - Peak hours (lunch 12-2, dinner 7:30-9:30): +10%
 *   - Slow hours (3-5 PM, 10-11 PM): -15% "Happy Hour"
 *   - Otherwise: standard price
 *
 * Note: The actual stored price is never changed — this is a display-only overlay.
 */
export function getDynamicPrice(
  menuItemId: number,
  name: string,
  basePrice: number,
  category?: string,
): AiDynamicPrice {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const timeDecimal = hour + minute / 60;

  let label: AiDynamicPrice["label"] = "Standard";
  let multiplier = 1.0;
  let reason = "Standard pricing";

  // Happy Hour: 3-5 PM & 10-11 PM (sides/drinks/desserts get extra discount)
  if ((timeDecimal >= 15 && timeDecimal < 17) || (timeDecimal >= 22 && timeDecimal < 23)) {
    label = "Happy Hour";
    const happyDiscount = category === "Drinks" || category === "Sides" || category === "Desserts"
      ? 0.20
      : 0.10;
    multiplier = 1 - happyDiscount;
    reason = `Happy Hour! ${Math.round(happyDiscount * 100)}% off`;
  }
  // Peak hours: lunch 12-2 PM & dinner 7:30-9:30 PM
  else if (
    (timeDecimal >= 12 && timeDecimal < 14) ||
    (timeDecimal >= 19.5 && timeDecimal < 21.5)
  ) {
    label = "Peak Surcharge";
    multiplier = 1.10;
    reason = "Peak hours — 10% surcharge";
  }

  const adjustedPrice = Math.round(basePrice * multiplier);
  return {
    menuItemId,
    name,
    basePrice,
    adjustedPrice: Math.max(adjustedPrice, Math.round(basePrice * 0.5)),
    change: adjustedPrice - basePrice,
    label,
    reason,
  };
}
