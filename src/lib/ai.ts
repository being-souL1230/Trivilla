/**
 * Trivilla AI Engine — Tier 1
 *
 * All "smart" features live here:
 *  1. Dish Recommender  (collaborative + personal)
 *  2. Specials Engine   (inventory-driven Chef's Specials)
 *  3. Smart Wait Time   (per-order dynamic prep estimation)
 *
 * No external AI API is called — everything is pure data-driven logic.
 */

import { db } from "@/db";
import {
  inventory,
  menuItems,
  orderItems,
  orders,
  staff,
  users,
} from "@/db/schema";
import { eq, inArray, and, desc, sql } from "drizzle-orm";
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
