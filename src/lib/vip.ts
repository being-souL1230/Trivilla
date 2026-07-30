/**
 * VIP Membership Discount Logic — client-safe module.
 *
 * Discount schedule (20 hours of discount, 4 hours blackout):
 *   01:00 – 05:00  → No discount (blackout)
 *   05:00 – 10:00  → 35% food, 50% drinks
 *   10:00 – 17:00  → 35% food, 50% drinks (VIP hours)
 *   17:00 – 22:00  → 35% food, 50% drinks
 *   22:00 – 24:00  → 50% ALL items (peak hours)
 *   24:00 – 01:00  → 35% food, 50% drinks
 */

export type VipDiscountInfo = {
  /** Whether VIP discount is currently active */
  active: boolean;
  /** Discount percentage for food items (0 if inactive) */
  foodDiscount: number;
  /** Discount percentage for drinks (0 if inactive) */
  drinksDiscount: number;
  /** Label for display */
  label: string;
  /** Human-readable reason */
  reason: string;
};

const DRINKS_CATEGORIES = ["Drinks"];

/**
 * Get the current VIP discount based on time of day.
 */
export function getVipDiscount(): VipDiscountInfo {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const timeDecimal = hour + minute / 60;
  const tzOffset = 5.5; // IST offset
  const istHour = (hour + tzOffset) % 24;
  const istDecimal = istHour + minute / 60;

  // Blackout: 01:00 – 05:00 IST
  if (istDecimal >= 1 && istDecimal < 5) {
    return {
      active: false,
      foodDiscount: 0,
      drinksDiscount: 0,
      label: "No discount",
      reason: "VIP discounts paused 1 AM – 5 AM",
    };
  }

  // Peak hours: 22:00 – 24:00 → 50% everything
  if (istDecimal >= 22 || istDecimal < 1) {
    return {
      active: true,
      foodDiscount: 50,
      drinksDiscount: 50,
      label: "Peak VIP",
      reason: "VIP Peak Hour — 50% off everything! 🌟",
    };
  }

  // Standard VIP hours: 35% food, 50% drinks
  return {
    active: true,
    foodDiscount: 35,
    drinksDiscount: 50,
    label: "VIP Discount",
    reason: "VIP — 35% off food, 50% off drinks 🪙",
  };
}

/**
 * Calculate the VIP-adjusted price for a menu item.
 */
export function getVipPrice(
  menuItemId: number,
  name: string,
  basePrice: number,
  category?: string,
): { originalPrice: number; vipPrice: number; discount: number; discountPct: number } {
  const info = getVipDiscount();
  if (!info.active) {
    return { originalPrice: basePrice, vipPrice: basePrice, discount: 0, discountPct: 0 };
  }

  const isDrink = category && DRINKS_CATEGORIES.includes(category);
  const pct = isDrink ? info.drinksDiscount : info.foodDiscount;
  const discounted = Math.round(basePrice * (1 - pct / 100));

  return {
    originalPrice: basePrice,
    vipPrice: Math.max(discounted, Math.round(basePrice * 0.3)), // never more than 70% off
    discount: basePrice - discounted,
    discountPct: pct,
  };
}

export type VipMembershipInfo = {
  id: number;
  vipId: string;
  plan: "monthly" | "yearly";
  amountPaid: number;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  daysLeft: number;
  discount: VipDiscountInfo;
};
