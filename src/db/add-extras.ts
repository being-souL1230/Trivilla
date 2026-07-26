import "dotenv/config";
import { db } from "./index";
import { menuItems } from "./schema";
import { inArray } from "drizzle-orm";
import { IMG } from "@/lib/utils";

/* Idempotent: adds the "complete your meal" side items if they're missing. */

const EXTRAS = [
  { name: "Sweet Lassi", description: "Thick churned curd drink topped with malai & a pinch of kesar.", category: "Drinks", price: 79, veg: true, spice: 0, prepTime: 5, image: IMG.sweetLassi, popular: true },
  { name: "Masala Chaas", description: "Cool spiced buttermilk with jeera, mint & black salt.", category: "Drinks", price: 49, veg: true, spice: 0, prepTime: 4, image: IMG.masalaChaas },
  { name: "Fresh Lime Soda", description: "Sweet, salted or mixed — squeezed to order with mint.", category: "Drinks", price: 89, veg: true, spice: 0, prepTime: 4, image: IMG.freshLimeSoda },
  { name: "Green Garden Salad", description: "Cucumber, tomato, carrot & lettuce with lemon dressing.", category: "Sides", price: 69, veg: true, spice: 0, prepTime: 5, image: IMG.greenSalad },
  { name: "Laccha Onion Salad", description: "Thin onion rings with lemon, chilli & chaat masala.", category: "Sides", price: 59, veg: true, spice: 1, prepTime: 5, image: IMG.lacchaOnion },
  { name: "Boondi Raita", description: "Cool curd with crispy boondi & roasted jeera.", category: "Sides", price: 69, veg: true, spice: 0, prepTime: 4, image: IMG.boondiRaita },
  { name: "Fresh Curd (Dahi)", description: "Set in-house every morning — thick & cooling.", category: "Sides", price: 49, veg: true, spice: 0, prepTime: 2, image: IMG.freshCurd },
  { name: "Roasted Papad (2 pc)", description: "Fire-roasted and crisp — the classic crunch.", category: "Sides", price: 39, veg: true, spice: 0, prepTime: 3, image: IMG.papad, popular: true },
];

async function main() {
  const existing = await db.select({ name: menuItems.name }).from(menuItems);
  const names = new Set(existing.map((e) => e.name));
  const missing = EXTRAS.filter((e) => !names.has(e.name));
  if (!missing.length) {
    console.log("Extras already present — nothing to do.");
    process.exit(0);
  }
  await db.insert(menuItems).values(missing);
  console.log(`Added ${missing.length} extras: ${missing.map((m) => m.name).join(", ")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
