/**
 * Trivilla AI Engine — Tier 1 + S-Tier Features
 *
 * All "smart" features live here:
 *  1. Dish Recommender  (collaborative + personal)
 *  2. Specials Engine   (inventory-driven Chef's Specials)
 *  3. Smart Wait Time   (per-order dynamic prep estimation)
 *  4. Exact Ready Time  (per-order "Ready by X:XX PM")
 *  5. Smart Table Assignment (auto best table for reservations)
 *  6. Combo Pairings    ("Frequently ordered together")
 *  7. Dynamic Pricing   (peak/slow hour price modulation)
 *  8. Auto Reorder Predictor (inventory restock alerts)
 *  9. Churn Detector    (inactive customer alerts)
 *  10. Staff Optimizer  (smart shift recommendations)
 *
 * No external AI API is called — everything is pure data-driven logic.
 */

import { db } from "@/db";
import {
  inventory,
  menuItems,
  orderItems,
  orders,
  reservations,
  staff,
  tables,
  users,
} from "@/db/schema";
import { eq, inArray, and, desc, sql, lt, gte, asc } from "drizzle-orm";
import { daysLeft } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  1. Dish Recommender                                                */
/* ------------------------------------------------------------------ */

export type AiRecommendation = {
  id: number;
  name: string;
  description: string;
  price: number;
  veg: boolean;
  image: string;
  spice: number;
  prepTime: number;
  available: boolean;
  /** Confidence score 0–100 */
  score: number;
  /** Why this was recommended */
  reason: "ordered_before" | "popular" | "similar_taste" | "veg_match" | "chef_pick";
  reasonLabel: string;
};

/**
 * Get personalised dish recommendations for a user.
 * Uses collaborative filtering: finds users with similar order patterns
 * and suggests dishes they loved but the target user hasn't tried.
 */
export async function getRecommendations(
  userId: number | null,
  userVegOnly: boolean,
): Promise<AiRecommendation[]> {
  const allDishes = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.available, true));

  if (!allDishes.length) return [];

  /* ---- Get user's order history ---- */
  let userOrderedIds = new Set<number>();
  let userOrderedNames = new Set<string>();
  let userCategoryPref: Record<string, number> = {};

  if (userId) {
    const userOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "served")));

    if (userOrders.length) {
      const userItems = await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            userOrders.map((o) => o.id),
          ),
        );

      for (const it of userItems) {
        userOrderedIds.add(it.menuItemId);
        userOrderedNames.add(it.name);
        const dish = allDishes.find((d) => d.id === it.menuItemId);
        if (dish) {
          userCategoryPref[dish.category] =
            (userCategoryPref[dish.category] ?? 0) + it.qty;
        }
      }
    }
  }

  /* ---- Collaborative: find similar users ---- */
  const similarUserDishScores = new Map<number, number>();
  if (userId && userOrderedIds.size > 0) {
    // Find users who ordered at least one of the same dishes
    const similarOrderItems = await db
      .select({
        userId: orders.userId,
        menuItemId: orderItems.menuItemId,
        qty: orderItems.qty,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          inArray(orderItems.menuItemId, [...userOrderedIds]),
          eq(orders.status, "served"),
          userId ? sql`${orders.userId} != ${userId}` : sql`1=1`,
        ),
      );

    // Count how many similar users ordered each dish
    const similarUserSet = new Set(
      similarOrderItems.map((s) => s.userId),
    );
    const allSimilarItems = await db
      .select({
        menuItemId: orderItems.menuItemId,
        qty: orderItems.qty,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          inArray(orders.userId, [...similarUserSet]),
          eq(orders.status, "served"),
        ),
      );

    for (const si of allSimilarItems) {
      if (!userOrderedIds.has(si.menuItemId)) {
        similarUserDishScores.set(
          si.menuItemId,
          (similarUserDishScores.get(si.menuItemId) ?? 0) + si.qty,
        );
      }
    }
  }

  /* ---- Score every dish ---- */
  const maxSimilar = Math.max(1, ...[...similarUserDishScores.values()]);
  const maxCatPref = Math.max(
    1,
    ...Object.values(userCategoryPref),
  );

  const scored: AiRecommendation[] = allDishes
    .filter((d) => !userOrderedIds.has(d.id)) // don't re-recommend what they already had
    .map((d) => {
      let score = 0;
      let reason: AiRecommendation["reason"] = "chef_pick";
      let reasonLabel = "Our chef's favourite tonight";

      // 1. Popularity boost (existing popular flag)
      if (d.popular) {
        score += 25;
        reason = "popular";
        reasonLabel = "Everyone's ordering this";
      }

      // 2. Veg preference match
      if (userVegOnly && d.veg) {
        score += 20;
        reason = "veg_match";
        reasonLabel = "Perfect for your veg preference";
      }

      // 3. Similar users ordered this
      const simScore = similarUserDishScores.get(d.id) ?? 0;
      if (simScore > 0) {
        const normalized = (simScore / maxSimilar) * 35;
        score += normalized;
        reason = "similar_taste";
        reasonLabel = "Loved by people with your taste";
      }

      // 4. Category preference match (they tend to order from this category)
      if (userCategoryPref[d.category]) {
        const catBoost =
          (userCategoryPref[d.category] / maxCatPref) * 15;
        score += catBoost;
      }

      // 5. Previously ordered (slightly boost re-ordering)
      if (userOrderedNames.has(d.name)) {
        score += 5;
        reason = "ordered_before";
        reasonLabel = "You'll love this again";
      }

      return {
        id: d.id,
        name: d.name,
        description: d.description,
        price: d.price,
        veg: d.veg,
        image: d.image,
        spice: d.spice,
        prepTime: d.prepTime,
        available: d.available,
        score: Math.round(Math.min(100, score)),
        reason,
        reasonLabel,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}

/* ------------------------------------------------------------------ */
/*  2. Specials Engine (Inventory → Menu)                              */
/* ------------------------------------------------------------------ */

export type AiSpecial = {
  id: number;
  name: string;
  description: string;
  price: number;
  veg: boolean;
  image: string;
  spice: number;
  prepTime: number;
  /** Why it's a special today */
  specialReason: string;
  /** urgency: "fresh" | "excess" | "low_stock" */
  urgency: "fresh" | "excess" | "low_stock";
};

/**
 * Scan inventory and figure out which menu items to promote as
 * "Today's Chef Specials".
 *
 * Logic:
 *  - Items with qty >> avgDailyUse → "extra fresh, use it up"
 *  - Items with daysLeft <= 2 → "before it runs out!"
 *  - Match inventory names to menu items via keyword overlap.
 */
export async function getSpecials(): Promise<AiSpecial[]> {
  const [allMenu, allInv] = await Promise.all([
    db.select().from(menuItems).where(eq(menuItems.available, true)),
    db.select().from(inventory),
  ]);

  if (!allMenu.length || !allInv.length) return [];

  // Build a map of inventory item → urgency signal
  const invSignals: { keyword: string; urgency: AiSpecial["urgency"]; label: string }[] = [];

  for (const inv of allInv) {
    const dl = daysLeft(inv);
    const excess = inv.qty > inv.avgDailyUse * 3 && inv.avgDailyUse > 0;
    const aboutToExpire = dl <= 2;

    if (excess) {
      invSignals.push({
        keyword: inv.name.toLowerCase(),
        urgency: "excess",
        label: `Fresh stock of ${inv.name} — at its best today!`,
      });
    } else if (aboutToExpire) {
      invSignals.push({
        keyword: inv.name.toLowerCase(),
        urgency: "low_stock",
        label: `Limited ${inv.name} left — grab it before it's gone!`,
      });
    }
  }

  // Match inventory items to menu items by keyword
  const matched = new Map<number, AiSpecial>();
  for (const signal of invSignals) {
    const words = signal.keyword.split(/\s+/);
    for (const dish of allMenu) {
      if (matched.has(dish.id)) continue;
      const dishText = `${dish.name} ${dish.description}`.toLowerCase();
      // Match if at least one keyword word appears in the dish name/description
      const matchCount = words.filter((w) => w.length > 2 && dishText.includes(w)).length;
      if (matchCount > 0) {
        matched.set(dish.id, {
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          veg: dish.veg,
          image: dish.image,
          spice: dish.spice,
          prepTime: dish.prepTime,
          specialReason: signal.label,
          urgency: signal.urgency,
        });
      }
    }
  }

  // Also always include "popular" items as Chef's Picks
  const popularDishes = allMenu.filter((d) => d.popular && !matched.has(d.id));
  for (const d of popularDishes) {
    matched.set(d.id, {
      id: d.id,
      name: d.name,
      description: d.description,
      price: d.price,
      veg: d.veg,
      image: d.image,
      spice: d.spice,
      prepTime: d.prepTime,
      specialReason: "Our chef's signature — always a crowd favourite",
      urgency: "fresh",
    });
  }

  return [...matched.values()].slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  3. Smart Wait Time Predictor                                       */
/* ------------------------------------------------------------------ */

export type AiWaitTime = {
  /** Average wait across all active orders (minutes) */
  averageWait: number;
  /** Current queue depth (how many orders ahead) */
  queueDepth: number;
  /** Number of chefs working right now */
  activeChefs: number;
  /** Peak multiplier (time-of-day factor) */
  peakMultiplier: number;
  /** Per-order estimates */
  orderEstimates: {
    orderId: number;
    code: string;
    estimatedMinutes: number;
    status: string;
  }[];
};

/**
 * Calculate smart wait times based on:
 *  - Prep time of items in each order
 *  - Number of chefs on duty
 *  - Time of day (peak vs off-peak multiplier)
 *  - Parallel cooking capacity
 */
export async function getWaitTime(): Promise<AiWaitTime> {
  const [activeOrders, staffRows, allMenu] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(inArray(orders.status, ["placed", "cooking"]))
      .orderBy(desc(orders.createdAt)),
    db.select().from(staff),
    db.select().from(menuItems),
  ]);

  // Count chefs on duty
  const activeChefs = staffRows.filter(
    (s) =>
      s.onDuty &&
      ["Head Chef", "Tandoor Chef"].includes(s.duty),
  ).length;
  const cookingCapacity = Math.max(1, activeChefs * 2); // each chef handles ~2 orders in parallel

  // Get all order items for active orders
  const orderIds = activeOrders.map((o) => o.id);
  const allItems = orderIds.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
    : [];

  const menuPrepMap = new Map(allMenu.map((m) => [m.id, m.prepTime]));
  const itemsByOrder = new Map<number, typeof allItems>();
  for (const it of allItems) {
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  // Time-of-day multiplier (peak hours = lunch 12-2, dinner 7:30-9:30)
  const hour = new Date().getHours();
  let peakMultiplier = 1.0;
  if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
    peakMultiplier = 1.4; // peak time — 40% slower
  } else if ((hour >= 11 && hour < 12) || (hour >= 18 && hour < 19)) {
    peakMultiplier = 1.15; // pre-rush
  } else {
    peakMultiplier = 0.85; // off-peak
  }

  // Calculate total prep minutes for all orders
  const orderEstimates = activeOrders.map((o) => {
    const items = itemsByOrder.get(o.id) ?? [];
    let totalPrep = 0;
    for (const it of items) {
      const prep = menuPrepMap.get(it.menuItemId) ?? 15;
      totalPrep += prep * it.qty;
    }
    // Base prep is the max item prep (cooked in parallel) + per-item buffer
    const maxItemPrep = Math.max(
      ...items.map((it) => menuPrepMap.get(it.menuItemId) ?? 15),
      10,
    );
    const buffer = items.reduce((s, it) => s + (it.qty - 1) * 3, 0); // extra qty adds ~3 min each
    const estimatedMinutes = Math.round(
      (maxItemPrep + buffer) * peakMultiplier,
    );
    return {
      orderId: o.id,
      code: o.code,
      estimatedMinutes,
      status: o.status,
    };
  });

  // Average wait = sum of all prep / cooking capacity + current order position
  const totalPrepTime = orderEstimates.reduce(
    (s, e) => s + e.estimatedMinutes,
    0,
  );
  const queueDepth = activeOrders.length;
  const averageWait = Math.max(
    5,
    Math.round(
      (totalPrepTime / cookingCapacity) * peakMultiplier +
        queueDepth * 1.5,
    ),
  );

  return {
    averageWait: Math.min(averageWait, 60),
    queueDepth,
    activeChefs,
    peakMultiplier,
    orderEstimates,
  };
}

/* ================================================================== */
/*                    S-TIER FEATURES                                  */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  4. Exact Ready Time (per-order "Ready by X:XX PM")                 */
/* ------------------------------------------------------------------ */

export type AiReadyTime = {
  /** Order identifier */
  orderId: number;
  code: string;
  /** Estimated minutes remaining */
  estimatedMinutes: number;
  /** Human-friendly estimated ready time (e.g. "7:42 PM") */
  estimatedReadyAt: string;
  /** ISO timestamp of estimated completion */
  estimatedReadyAtISO: string;
  /** Explanation */
  reason: string;
};

/**
 * Predict exactly when a given order will be ready.
 * Uses prep times of items, queue position, chefs on duty, and time-of-day.
 */
export async function getReadyTime(orderId: number): Promise<AiReadyTime | null> {
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) return null;

  const [allItems, allMenu, staffRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(menuItems),
    db.select().from(staff),
  ]);

  const menuPrepMap = new Map(allMenu.map((m) => [m.id, m.prepTime]));

  // Calculate prep time for this order
  let maxItemPrep = 0;
  let totalBuffer = 0;
  for (const it of allItems) {
    const prep = menuPrepMap.get(it.menuItemId) ?? 15;
    maxItemPrep = Math.max(maxItemPrep, prep);
    totalBuffer += (it.qty - 1) * 3;
  }

  // Count active chefs
  const activeChefs = staffRows.filter(
    (s) => s.onDuty && ["Head Chef", "Tandoor Chef"].includes(s.duty),
  ).length;

  // Queue position
  const queueOrders = await db
    .select({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["placed", "cooking"]),
        sql`${orders.createdAt} <= ${orderRow.createdAt}`,
      ),
    )
    .orderBy(asc(orders.createdAt));

  const queuePosition = queueOrders.findIndex((o) => o.id === orderId);

  // Time-of-day multiplier
  const hour = new Date().getHours();
  let peakMultiplier = 1.0;
  if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) peakMultiplier = 1.4;
  else if ((hour >= 11 && hour < 12) || (hour >= 18 && hour < 19)) peakMultiplier = 1.15;
  else peakMultiplier = 0.85;

  const basePrep = Math.max(maxItemPrep, 10) + totalBuffer;
  const queueDelay = Math.max(0, queuePosition) * 3;
  const chefFactor = Math.max(1, 2 - (activeChefs - 1) * 0.3);
  const estimatedMinutes = Math.round((basePrep + queueDelay) * peakMultiplier * chefFactor);

  const readyAt = new Date(Date.now() + estimatedMinutes * 60_000);
  const formatted = readyAt.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  const reasons: string[] = [];
  if (peakMultiplier > 1) reasons.push("peak hours");
  if (queuePosition > 0) reasons.push(`${queuePosition} order${queuePosition > 1 ? "s" : ""} ahead`);
  if (activeChefs < 2) reasons.push("limited chefs");

  return {
    orderId,
    code: orderRow.code,
    estimatedMinutes,
    estimatedReadyAt: formatted,
    estimatedReadyAtISO: readyAt.toISOString(),
    reason: reasons.length
      ? `Due ${reasons.join(" + ")}`
      : "Estimated from our kitchen AI",
  };
}

/* ------------------------------------------------------------------ */
/*  5. Smart Table Assignment (auto best table for reservations)       */
/* ------------------------------------------------------------------ */

export type AiTableSuggestion = {
  tableId: number;
  tableNo: number;
  seats: number;
  zone: string;
  score: number;
  reason: string;
};

/**
 * Find the best table for a reservation based on:
 *   - Party size (exact fit preferred)
 *   - Zone preference (if any)
 *   - Table status (free > cleaning > reserved)
 *   - Even distribution (don't always assign the same table)
 */
export async function getSmartTableSuggestion(
  guests: number,
  preferredZone?: string,
  excludeTableIds: number[] = [],
): Promise<AiTableSuggestion | null> {
  const [allTables, existingReservations] = await Promise.all([
    db.select().from(tables),
    db
      .select({ tableId: reservations.tableId })
      .from(reservations)
      .where(
        inArray(reservations.status, ["requested", "confirmed", "alternate_offered"]),
      ),
  ]);

  const reservedIds = new Set(
    existingReservations.map((r) => r.tableId).filter(Boolean),
  );
  const excludeIds = new Set(excludeTableIds);

  const scored = allTables
    .filter((t) => !excludeIds.has(t.id) && !reservedIds.has(t.id))
    .map((t) => {
      let score = 0;
      const reasons: string[] = [];

      // Free tables get a big boost
      if (t.status === "free") {
        score += 50;
        reasons.push("available now");
      } else if (t.status === "cleaning") {
        score += 20;
        reasons.push("being cleaned");
      }

      // Exact seat match is ideal
      if (t.seats === guests) {
        score += 30;
        reasons.push("perfect size");
      } else if (t.seats >= guests && t.seats - guests <= 2) {
        score += 20;
        reasons.push("good fit");
      } else if (t.seats >= guests) {
        score += 5;
      }

      // Zone preference match
      if (preferredZone && t.zone === preferredZone) {
        score += 25;
        reasons.push(`${preferredZone} table`);
      }

      // Slight random boost to distribute load (based on tableNo mod)
      score += (t.tableNo % 3) * 2;

      return {
        tableId: t.id,
        tableNo: t.tableNo,
        seats: t.seats,
        zone: t.zone,
        score,
        reason: reasons.length ? reasons.join(", ") : "available",
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  6. Combo Pairings ("Frequently ordered together")                  */
/* ------------------------------------------------------------------ */

export type AiPairing = {
  menuItemId: number;
  name: string;
  price: number;
  veg: boolean;
  image: string;
  /** How often this is ordered with the target item (0-100) */
  affinity: number;
};

/**
 * Find dishes that are frequently ordered together with a set of items.
 * Uses historical order data to calculate co-occurrence scores.
 */
export async function getComboPairings(
  currentMenuItemIds: number[],
  limit = 4,
): Promise<AiPairing[]> {
  if (!currentMenuItemIds.length) return [];

  // Find orders that contain any of the current items
  const relatedOrderItems = await db
    .select({
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      name: orderItems.name,
      price: orderItems.price,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        inArray(orderItems.menuItemId, currentMenuItemIds),
        eq(orders.status, "served"),
      ),
    );

  const relatedOrderIds = [...new Set(relatedOrderItems.map((r) => r.orderId))];
  if (relatedOrderIds.length < 2) return [];      // Find all other items in those same orders (using inArray for safety)
  const companionItems = await db
    .select({
      menuItemId: orderItems.menuItemId,
      name: orderItems.name,
      price: orderItems.price,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(orderItems)
    .where(
      and(
        inArray(orderItems.orderId, relatedOrderIds),
        currentMenuItemIds.length > 0
          ? sql`${orderItems.menuItemId} NOT IN ${sql.join(currentMenuItemIds.map((id) => sql`${id}`), sql`, `)}`
          : sql`1=1`,
      ),
    )
    .groupBy(orderItems.menuItemId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  // Get veg status & images from menu
  const companionIds = companionItems.map((c) => c.menuItemId);
  const menuRows = companionIds.length
    ? await db
        .select({ id: menuItems.id, veg: menuItems.veg, image: menuItems.image, available: menuItems.available })
        .from(menuItems)
        .where(inArray(menuItems.id, companionIds))
    : [];
  const menuMap = new Map(menuRows.map((m) => [m.id, m]));

  const maxCount = Math.max(1, ...companionItems.map((c) => c.count));

  return companionItems
    .filter((c) => {
      const m = menuMap.get(c.menuItemId);
      return m?.available !== false;
    })
    .map((c) => {
      const m = menuMap.get(c.menuItemId);
      return {
        menuItemId: c.menuItemId,
        name: c.name,
        price: c.price,
        veg: m?.veg ?? true,
        image: m?.image ?? "",
        affinity: Math.round((c.count / maxCount) * 100),
      };
    });
}

/* ------------------------------------------------------------------ */
/*  7. Dynamic Pricing (peak/slow hour price modulation)               */
/* ------------------------------------------------------------------ */

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

  // Happy Hour: 3-5 PM & 10-11 PM (non-veg & sides/drinks get extra discount)
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
    adjustedPrice: Math.max(adjustedPrice, Math.round(basePrice * 0.5)), // never more than 50% off
    change: adjustedPrice - basePrice,
    label,
    reason,
  };
}

/* ------------------------------------------------------------------ */
/*  8. Auto Reorder Predictor (inventory restock alerts)               */
/* ------------------------------------------------------------------ */

export type AiReorderAlert = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentQty: number;
  minQty: number;
  avgDailyUse: number;
  /** Predicted days until stockout */
  daysUntilStockout: number;
  /** Recommended reorder quantity */
  recommendedQty: number;
  /** Urgency level */
  urgency: "critical" | "warning" | "normal";
  /** Suggested action */
  suggestion: string;
};

/**
 * Scan inventory and predict which items need restocking.
 * Uses avg daily usage + current stock + supplier lead time estimates.
 */
export async function getReorderPredictions(): Promise<AiReorderAlert[]> {
  const allInv = await db.select().from(inventory);

  return allInv
    .map((item) => {
      const dl = daysLeft(item);
      const daysUntilStockout = dl >= 99 ? 99 : Math.max(0, dl);

      // Recommended reorder: enough for 7 days + buffer
      const recommendedQty = Math.max(
        item.minQty * 2,
        Math.ceil(item.avgDailyUse * 7) - item.qty,
      );

      let urgency: AiReorderAlert["urgency"] = "normal";
      let suggestion = "Stock is adequate";

      if (daysUntilStockout <= 1) {
        urgency = "critical";
        suggestion = `ORDER NOW! Only ${item.qty} ${item.unit} left — will run out today!`;
      } else if (daysUntilStockout <= 3) {
        urgency = "warning";
        suggestion = `Order ${Math.ceil(recommendedQty)} ${item.unit} within 2 days`;
      } else if (daysUntilStockout <= 7) {
        urgency = "warning";
        suggestion = `Plan to reorder ${Math.ceil(recommendedQty)} ${item.unit} this week`;
      } else {
        suggestion = `Stocked for ${daysUntilStockout} days — no rush`;
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentQty: item.qty,
        minQty: item.minQty,
        avgDailyUse: item.avgDailyUse,
        daysUntilStockout,
        recommendedQty: Math.ceil(recommendedQty),
        urgency,
        suggestion,
      };
    })
    .filter((a) => a.urgency !== "normal")
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/* ------------------------------------------------------------------ */
/*  9. Churn Detector (inactive customer alerts)                       */
/* ------------------------------------------------------------------ */

export type AiChurnAlert = {
  userId: number;
  name: string;
  email: string;
  phone: string;
  /** Total orders placed */
  totalOrders: number;
  /** Total spent */
  totalSpent: number;
  /** Days since last order */
  daysSinceLastOrder: number;
  /** Churn risk level */
  risk: "high" | "medium" | "low";
  /** Suggested action for manager */
  suggestion: string;
};

/**
 * Find customers who haven't ordered in a while.
 * "High risk" = 30+ days, "Medium risk" = 20-29 days.
 */
export async function getChurnedCustomers(): Promise<AiChurnAlert[]> {
  // Get all completed/served orders in a single query, grouped by user
  const allOrders = await db
    .select({
      userId: orders.userId,
      id: orders.id,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["served", "completed"]),
      ),
    )
    .orderBy(desc(orders.createdAt));

  // Group by userId
  const ordersByUser = new Map<number, typeof allOrders>();
  for (const o of allOrders) {
    const arr = ordersByUser.get(o.userId) ?? [];
    arr.push(o);
    ordersByUser.set(o.userId, arr);
  }

  // Only check users who have orders
  const userIdsWithOrders = [...ordersByUser.keys()];
  if (!userIdsWithOrders.length) return [];

  const allUsers = await db
    .select()
    .from(users)
    .where(
      and(
        inArray(users.id, userIdsWithOrders),
        sql`${users.role} = 'customer'`,
      ),
    );

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const alerts: AiChurnAlert[] = [];

  for (const [userId, userOrders] of ordersByUser) {
    const u = userMap.get(userId);
    if (!u) continue;

    const lastOrder = userOrders[0];
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(lastOrder.createdAt).getTime()) / 86400000,
    );

    if (daysSinceLastOrder < 20) continue;

    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((s, o) => s + o.total, 0);

    let risk: AiChurnAlert["risk"];
    let suggestion: string;

    if (daysSinceLastOrder >= 30) {
      risk = "high";
      suggestion = `Send "We miss you!" notification & offer ₹50 off`;
    } else {
      risk = "medium";
      suggestion = `Send a friendly reminder — recommend their favourite dishes`;
    }

    alerts.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      totalOrders,
      totalSpent,
      daysSinceLastOrder,
      risk,
      suggestion,
    });
  }

  return alerts.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
}

/* ------------------------------------------------------------------ */
/*  10. Staff Optimizer (smart shift recommendations)                  */
/* ------------------------------------------------------------------ */

export type AiStaffRecommendation = {
  /** Tomorrow's date string */
  date: string;
  /** Day of week */
  dayOfWeek: string;
  /** Predicted number of orders for tomorrow */
  predictedOrders: number;
  /** Recommended number of chefs */
  recommendedChefs: number;
  /** Recommended number of waiters */
  recommendedWaiters: number;
  /** Total staff recommended */
  recommendedTotal: number;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Explanation */
  reasoning: string;
};

/**
 * Predict optimal staff requirement for tomorrow based on:
 *   - Historical order volume for that day of week
 *   - Current week's trends
 *   - Known busy periods
 */
export async function getStaffRecommendation(): Promise<AiStaffRecommendation> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfWeek = tomorrow.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = tomorrow.toISOString().split("T")[0];

  // Get orders from past 4 weeks for this day of week
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const historicalOrders = await db
    .select({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .where(
      and(
        sql`${orders.createdAt} >= ${fourWeeksAgo}`,
        inArray(orders.status, ["placed", "cooking", "ready", "served", "completed"]),
      ),
    );

  // Group by day of week
  const ordersByDay: Record<string, number> = {};
  for (const o of historicalOrders) {
    const day = new Date(o.createdAt).toLocaleDateString("en-IN", { weekday: "long" });
    ordersByDay[day] = (ordersByDay[day] ?? 0) + 1;
  }

  const ordersForThisDay = ordersByDay[dayOfWeek] ?? 0;
  const weeksOfData = Math.max(1, 4);
  const predictedOrders = Math.round(ordersForThisDay / weeksOfData);

  // Get current staff
  const allStaff = await db.select().from(staff);
  const totalStaff = allStaff.length;
  const chefs = allStaff.filter((s) => ["Head Chef", "Tandoor Chef"].includes(s.duty)).length;
  const waiters = allStaff.filter((s) => s.duty === "Waiter").length;

  // Rule-based recommendation
  const recommendedChefs = Math.max(1, Math.min(chefs, Math.ceil(predictedOrders / 15)));
  const recommendedWaiters = Math.max(1, Math.min(waiters, Math.ceil(predictedOrders / 20)));
  const recommendedTotal = recommendedChefs + recommendedWaiters;

  // Confidence based on data volume
  let confidence: AiStaffRecommendation["confidence"] = "low";
  let reasoning: string;

  if (ordersForThisDay >= 20) {
    confidence = "high";
    reasoning = `Based on ${ordersForThisDay} orders from past 4 ${dayOfWeek}s`;
  } else if (ordersForThisDay >= 10) {
    confidence = "medium";
    reasoning = `Based on ${ordersForThisDay} orders from past ${dayOfWeek}s`;
  } else {
    reasoning = `Limited historical data (${ordersForThisDay} orders) — using default estimates`;
  }

  if (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    reasoning += ". Weekend — expect higher footfall";
  }

  return {
    date: dateStr,
    dayOfWeek,
    predictedOrders,
    recommendedChefs,
    recommendedWaiters,
    recommendedTotal,
    confidence,
    reasoning,
  };
}
