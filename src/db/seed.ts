import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  inventory,
  menuItems,
  notifications,
  orderItems,
  orders,
  otpCodes,
  ratings,
  reservations,
  sessions,
  staff,
  tables,
  users,
  vipMemberships,
} from "./schema";
import { hashPassword } from "@/lib/hash";
import { IMG } from "@/lib/utils";

/* Run: npx tsx src/db/seed.ts — wipes & refills the demo restaurant. */

/* Create a Date interpreted as IST (UTC+5:30), regardless of where seed runs.
   This ensures times display correctly in Indian timezone on the client.
   
   Approach: Compute the date in IST first, then convert to UTC so that 
   the stored epoch milliseconds correctly represent the intended IST time. */
const d = (daysBack: number, h: number, m = 0) => {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 min in ms
  // Get current time in IST
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  // Build the target date+time in IST
  const targetUTC = Date.UTC(
    nowIST.getFullYear(),
    nowIST.getMonth(),
    nowIST.getDate() - daysBack,
    h, m, 0,
  );
  // Convert back from IST to actual UTC
  return new Date(targetUTC - IST_OFFSET_MS);
};

const dateStr = (daysFromNow: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
};

async function main() {
  console.log("Seeding Trivilla…");

  // Create ratings table if it doesn't exist (bypasses drizzle-kit push hanging on Turso)
  await db.run(sql`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating REAL NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(julianday('now') - 2440587.5 as integer) * 86400000)
)`);
  console.log("✓ ratings table ready");

  await db.delete(ratings);
  await db.delete(notifications);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(reservations);
  await db.delete(sessions);
  await db.delete(otpCodes);
  await db.delete(menuItems);
  await db.delete(tables);
  await db.delete(inventory);
  await db.delete(staff);
  await db.delete(users);

  /* ---------- People ---------- */
  const [manager, priya, rahul, sneha, chef] = await db
    .insert(users)
    .values([
      {
        name: "Anand Mehta",
        email: "manager@trivilla.in",
        password: hashPassword("trivilla123"),
        phone: "98220 11223",
        role: "manager",
      },
      {
        name: "Priya Sharma",
        email: "priya@example.com",
        password: hashPassword("priya123"),
        phone: "98500 22331",
        vegOnly: true,
      },
      {
        name: "Rahul Verma",
        email: "rahul@example.com",
        password: hashPassword("rahul123"),
        phone: "99700 45110",
      },
      {
        name: "Sneha Kulkarni",
        email: "sneha@example.com",
        password: hashPassword("sneha123"),
        phone: "90110 87432",
      },
      {
        name: "Suresh Iyer",
        email: "chef@trivilla.in",
        password: hashPassword("chef123"),
        phone: "98900 12001",
        role: "chef",
      },
    ])
    .returning();

  /* ---------- Menu (20 dishes) ---------- */
  const menu = await db
    .insert(menuItems)
    .values([
      { name: "Trivilla Special Thali", description: "Dal, 2 vegetables, paneer, rice, 3 rotis, salad, papad & a sweet — the full experience.", category: "Thali", price: 449, veg: true, popular: true, spice: 1, prepTime: 20, image: IMG.thali },
      { name: "Veg Thali", description: "Home-style meal — dal, 2 seasonal vegetables, rice, 2 rotis & salad.", category: "Thali", price: 329, veg: true, spice: 1, prepTime: 18, image: IMG.vegThali },
      { name: "Misal Pav Thali", description: "Pune-style spicy misal with soft pav, onions, sev and a glass of taak.", category: "Thali", price: 249, veg: true, spice: 3, prepTime: 15, image: IMG.misal },
      { name: "Hyderabadi Veg Biryani", description: "Dum-cooked basmati with veggies, saffron & fried onions. Comes with salan & raita.", category: "Rice & Biryani", price: 269, veg: true, spice: 2, prepTime: 25, image: IMG.vegBiryani },
      { name: "Chicken Dum Biryani", description: "Slow-cooked on coal with marinated chicken, mint & saffron. Serves 1 hungry soul.", category: "Rice & Biryani", price: 389, veg: false, popular: true, spice: 2, prepTime: 28, image: IMG.chickenBiryani },
      { name: "Mutton Rogan Josh", description: "Kashmiri-style slow simmered mutton in a rich red gravy.", category: "Main Course", price: 429, veg: false, spice: 2, prepTime: 30, available: false, image: IMG.roganJosh },
      { name: "Butter Chicken", description: "Tandoori chicken simmered in silky tomato-makhani gravy. Our bestseller since day one.", category: "Main Course", price: 349, veg: false, popular: true, spice: 1, prepTime: 22, image: IMG.butterChicken },
      { name: "Paneer Butter Masala", description: "Soft paneer in creamy tomato-cashew gravy, finished with dried fenugreek.", category: "Main Course", price: 299, veg: true, popular: true, spice: 1, prepTime: 18, image: IMG.paneerButter },
      { name: "Dal Makhani", description: "Black lentils simmered overnight on slow fire with butter & cream.", category: "Main Course", price: 229, veg: true, spice: 1, prepTime: 15, image: IMG.dalMakhani },
      { name: "Palak Paneer", description: "Fresh spinach purée with charred paneer cubes & a hint of garlic.", category: "Main Course", price: 289, veg: true, spice: 1, prepTime: 16, image: IMG.palakPaneer },
      { name: "Chicken Chettinad", description: "Fiery South-Indian style chicken with black pepper & curry leaves.", category: "Main Course", price: 359, veg: false, spice: 3, prepTime: 22, image: IMG.chettinad },
      { name: "Masala Dosa", description: "Crisp golden dosa with potato masala, sambar & 2 chutneys.", category: "South Indian", price: 179, veg: true, popular: true, spice: 2, prepTime: 12, image: IMG.dosa },
      { name: "Butter Naan", description: "Tandoor-fresh, brushed with white butter.", category: "Breads", price: 59, veg: true, spice: 0, prepTime: 8, image: IMG.naan },
      { name: "Aloo Paratha", description: "Stuffed with spiced potatoes, served with curd & pickle.", category: "Breads", price: 149, veg: true, spice: 1, prepTime: 12, image: IMG.paratha },
      { name: "Paneer Pakora", description: "Crisp chickpea flour-fried paneer bites with mint chutney.", category: "Starters", price: 189, veg: true, spice: 2, prepTime: 12, image: IMG.pakora },
      { name: "Chicken 65", description: "Tangy, spicy fried chicken — a South-Indian classic starter.", category: "Starters", price: 279, veg: false, spice: 3, prepTime: 15, image: IMG.chicken65 },
      { name: "Samosa Platter", description: "2 crisp samosas with chole, chutneys & masala chai dust.", category: "Starters", price: 149, veg: true, spice: 2, prepTime: 10, image: IMG.samosa },
      { name: "Gulab Jamun (2 pc)", description: "Warm khoya jamuns soaked in rose-cardamom syrup.", category: "Desserts", price: 119, veg: true, popular: true, spice: 0, prepTime: 6, image: IMG.gulabJamun },
      { name: "Kesar Kulfi", description: "Slow-churned saffron kulfi with pistachio crunch.", category: "Desserts", price: 129, veg: true, spice: 0, prepTime: 5, image: IMG.kulfi },
      { name: "Masala Chai", description: "Clay-pot tea brewed with ginger, cardamom & lots of love.", category: "Drinks", price: 59, veg: true, spice: 0, prepTime: 5, image: IMG.chai },
      { name: "Sweet Lassi", description: "Thick churned curd drink topped with cream & a pinch of saffron.", category: "Drinks", price: 79, veg: true, spice: 0, prepTime: 5, image: IMG.sweetLassi, popular: true },
      { name: "Masala Chaas", description: "Cool spiced buttermilk with cumin, mint & black salt.", category: "Drinks", price: 49, veg: true, spice: 0, prepTime: 4, image: IMG.masalaChaas },
      { name: "Fresh Lime Soda", description: "Sweet, salted or mixed — squeezed to order with mint.", category: "Drinks", price: 89, veg: true, spice: 0, prepTime: 4, image: IMG.freshLimeSoda },
      { name: "Green Garden Salad", description: "Cucumber, tomato, carrot & lettuce with lemon dressing.", category: "Sides", price: 69, veg: true, spice: 0, prepTime: 5, image: IMG.greenSalad },
      { name: "Laccha Onion Salad", description: "Thin onion rings with lemon, chilli & chaat masala.", category: "Sides", price: 59, veg: true, spice: 1, prepTime: 5, image: IMG.lacchaOnion },
      { name: "Boondi Raita", description: "Cool curd with crispy boondi & roasted cumin.", category: "Sides", price: 69, veg: true, spice: 0, prepTime: 4, image: IMG.boondiRaita },
      { name: "Fresh Curd (Dahi)", description: "Set in-house every morning — thick & cooling.", category: "Sides", price: 49, veg: true, spice: 0, prepTime: 2, image: IMG.freshCurd },
      { name: "Roasted Papad (2 pc)", description: "Fire-roasted and crisp — the classic crunch.", category: "Sides", price: 39, veg: true, spice: 0, prepTime: 3, image: IMG.papad, popular: true },
    ])
    .returning();

  /* ---------- Tables (16 — 12 standard + 4 VIP golden) ---------- */
  const tbl = await db
    .insert(tables)
    .values([
      { tableNo: 1, seats: 2, zone: "Window Side" },
      { tableNo: 2, seats: 2, zone: "Window Side" },
      { tableNo: 3, seats: 4, zone: "Main Hall", status: "occupied" },
      { tableNo: 4, seats: 4, zone: "Main Hall" },
      { tableNo: 5, seats: 4, zone: "Main Hall", status: "reserved" },
      { tableNo: 6, seats: 4, zone: "Terrace" },
      { tableNo: 7, seats: 6, zone: "Terrace", status: "occupied" },
      { tableNo: 8, seats: 6, zone: "Main Hall" },
      { tableNo: 9, seats: 2, zone: "Terrace" },
      { tableNo: 10, seats: 4, zone: "Window Side", status: "cleaning" },
      { tableNo: 11, seats: 8, zone: "Private" },
      { tableNo: 12, seats: 10, zone: "Private" },
      // VIP Golden Tables
      { tableNo: 13, seats: 4, zone: "Window Side", vip: true },
      { tableNo: 14, seats: 4, zone: "Main Hall", vip: true },
      { tableNo: 15, seats: 6, zone: "Terrace", vip: true },
      { tableNo: 16, seats: 2, zone: "Private", vip: true },
    ])
    .returning();

  /* ---------- Orders (last 7 days) ---------- */
  const P = (i: number) => menu[i];
  const mk = async (
    o: {
      user: typeof priya;
      ago: [number, number, number];
      type?: "dine-in" | "takeaway";
      table?: number;
      pay?: "upi" | "card" | "cash";
      status: string;
      items: [number, number][];
      note?: string;
    },
    idx: number,
  ) => {
    const created = d(o.ago[0], o.ago[1], o.ago[2]);
    const subtotal = o.items.reduce((s, [mi, q]) => s + P(mi).price * q, 0);
    const tax = Math.round(subtotal * 0.05);
    const [ord] = await db
      .insert(orders)
      .values({
        code: `RS-${1001 + idx}`,
        userId: o.user.id,
        customerName: o.user.name,
        type: o.type ?? "dine-in",
        tableId: o.table !== undefined ? tbl[o.table].id : null,
        paymentMode: o.pay ?? "upi",
        note: o.note ?? "",
        subtotal,
        tax,
        total: subtotal + tax,
        status: o.status,
        createdAt: created,
        updatedAt: new Date(created.getTime() + 14 * 60 * 1000),
      })
      .returning();
    await db.insert(orderItems).values(
      o.items.map(([mi, q]) => ({
        orderId: ord.id,
        menuItemId: P(mi).id,
        name: P(mi).name,
        price: P(mi).price,
        qty: q,
      })),
    );
    return ord;
  };

  const orderList: Parameters<typeof mk>[0][] = [
    // Past orders (bill paid → completed)
    { user: rahul, ago: [6, 13, 10], status: "completed", items: [[11, 2], [19, 2]], pay: "cash" },
    { user: priya, ago: [6, 20, 25], status: "completed", items: [[0, 1], [17, 1]], pay: "upi" },
    { user: sneha, ago: [5, 13, 40], status: "completed", items: [[2, 2], [19, 2]], pay: "upi" },
    { user: rahul, ago: [5, 21, 5], status: "completed", items: [[4, 1], [15, 1]], pay: "card", type: "takeaway" },
    { user: priya, ago: [4, 12, 45], status: "completed", items: [[7, 1], [12, 2]], pay: "upi" },
    { user: sneha, ago: [4, 20, 10], status: "completed", items: [[6, 1], [12, 3], [18, 2]], pay: "card", table: 3 },
    { user: rahul, ago: [3, 13, 20], status: "completed", items: [[3, 2]], pay: "upi", type: "takeaway" },
    { user: priya, ago: [3, 19, 50], status: "completed", items: [[1, 1], [13, 1], [17, 1]], pay: "cash", table: 1 },
    { user: sneha, ago: [2, 13, 15], status: "completed", items: [[9, 1], [12, 2], [19, 1]], pay: "upi" },
    { user: rahul, ago: [2, 20, 40], status: "completed", items: [[10, 1], [12, 2]], pay: "upi", table: 6 },
    { user: priya, ago: [1, 13, 5], status: "completed", items: [[2, 1], [16, 1], [19, 1]], pay: "upi" },
    { user: sneha, ago: [1, 20, 15], status: "completed", items: [[0, 2], [18, 2]], pay: "card", table: 8 },
    { user: rahul, ago: [1, 21, 30], status: "completed", items: [[4, 2]], pay: "upi", type: "takeaway" },
    { user: rahul, ago: [0, 12, 35], status: "completed", items: [[11, 2], [19, 2]], pay: "cash", table: 0 },
    { user: priya, ago: [0, 13, 5], status: "completed", items: [[0, 1], [17, 1]], pay: "upi", table: 1 },
    // Live orders (still active in kitchen)
    { user: sneha, ago: [0, 13, 28], status: "ready", items: [[2, 2], [18, 2]], pay: "upi", table: 6, note: "Less spicy misal please" },
    { user: priya, ago: [0, 13, 42], status: "cooking", items: [[7, 1], [12, 2], [19, 1]], pay: "upi", table: 2, note: "Extra butter naan, no onion in gravy" },
    { user: rahul, ago: [0, 13, 50], status: "placed", items: [[4, 1], [15, 1]], pay: "card", type: "takeaway" },
  ];

  for (let i = 0; i < orderList.length; i++) await mk(orderList[i], i);

  /* ---------- Reservations ---------- */
  await db.insert(reservations).values([
    { userId: priya.id, customerName: priya.name, phone: priya.phone, date: dateStr(1), slot: "8:00 PM", guests: 4, note: "Window side please, one birthday", status: "requested" },
    { userId: rahul.id, customerName: rahul.name, phone: rahul.phone, date: dateStr(0), slot: "7:30 PM", guests: 2, tableId: tbl[4].id, status: "confirmed" },
    { userId: sneha.id, customerName: sneha.name, phone: sneha.phone, date: dateStr(2), slot: "8:30 PM", guests: 6, note: "Anniversary dinner", status: "requested" },
    { userId: priya.id, customerName: priya.name, phone: priya.phone, date: dateStr(-3), slot: "1:00 PM", guests: 3, tableId: tbl[1].id, status: "completed" },
  ]);

  /* ---------- Inventory ---------- */
  await db.insert(inventory).values([
    { name: "Tomatoes", category: "Vegetables", unit: "kg", qty: 14, minQty: 8, avgDailyUse: 3, costPerUnit: 40, supplier: "Sabzi Mandi, Camp" },
    { name: "Onions", category: "Vegetables", unit: "kg", qty: 22, minQty: 10, avgDailyUse: 4, costPerUnit: 25, supplier: "Sabzi Mandi, Camp" },
    { name: "Paneer", category: "Dairy", unit: "kg", qty: 3.5, minQty: 4, avgDailyUse: 1.5, costPerUnit: 320, supplier: "Gokul Dairy" },
    { name: "Chicken", category: "Meat & Poultry", unit: "kg", qty: 6, minQty: 5, avgDailyUse: 2.2, costPerUnit: 220, supplier: "Al-Falah Poultry" },
    { name: "Basmati Rice", category: "Grains", unit: "kg", qty: 28, minQty: 12, avgDailyUse: 3.5, costPerUnit: 95, supplier: "Rahul Traders" },
    { name: "Wheat Flour (Atta)", category: "Grains", unit: "kg", qty: 18, minQty: 10, avgDailyUse: 4, costPerUnit: 45, supplier: "Rahul Traders" },
    { name: "Butter", category: "Dairy", unit: "kg", qty: 2.2, minQty: 3, avgDailyUse: 1.2, costPerUnit: 480, supplier: "Amul Distributor" },
    { name: "Milk", category: "Dairy", unit: "L", qty: 9, minQty: 6, avgDailyUse: 4, costPerUnit: 56, supplier: "Gokul Dairy" },
    { name: "Cooking Oil", category: "Grocery", unit: "L", qty: 24, minQty: 10, avgDailyUse: 3, costPerUnit: 135, supplier: "Rahul Traders" },
    { name: "Garam Masala", category: "Spices", unit: "kg", qty: 1.8, minQty: 1, avgDailyUse: 0.2, costPerUnit: 720, supplier: "Mahavir Spices" },
    { name: "Coriander Leaves", category: "Vegetables", unit: "kg", qty: 1.2, minQty: 2, avgDailyUse: 1, costPerUnit: 60, supplier: "Sabzi Mandi, Camp" },
    { name: "Packing Boxes", category: "Packaging", unit: "pcs", qty: 60, minQty: 100, avgDailyUse: 35, costPerUnit: 8, supplier: "PackNBox, Hadapsar" },
  ]);

  /* ---------- Staff ---------- */
  await db.insert(staff).values([
    { name: "Suresh Iyer", duty: "Head Chef", phone: "98900 12001", shift: "Morning", onDuty: true, joinedOn: "2019-03-12" },
    { name: "Farhan Shaikh", duty: "Tandoor Chef", phone: "98900 12002", shift: "Evening", onDuty: true, joinedOn: "2021-07-01" },
    { name: "Lakshmi Devi", duty: "Waiter", phone: "98900 12003", shift: "Full Day", onDuty: true, joinedOn: "2022-01-15" },
    { name: "Vikas Rathore", duty: "Waiter", phone: "98900 12004", shift: "Evening", onDuty: false, joinedOn: "2023-05-20" },
    { name: "Meena Joshi", duty: "Cashier", phone: "98900 12005", shift: "Full Day", onDuty: true, joinedOn: "2020-11-02" },
    { name: "Ravi Kumar", duty: "Cleaning", phone: "98900 12006", shift: "Morning", onDuty: true, joinedOn: "2024-02-10" },
  ]);

  /* ---------- Ratings (sample) ---------- */
  await db.insert(ratings).values([
    // Trivilla Special Thali (menu[0])
    { menuItemId: menu[0].id, userId: priya.id, rating: 4.5 },
    { menuItemId: menu[0].id, userId: sneha.id, rating: 5 },
    { menuItemId: menu[0].id, userId: rahul.id, rating: 4 },
    // Veg Thali (menu[1])
    { menuItemId: menu[1].id, userId: priya.id, rating: 4 },
    // Misal Pav (menu[2])
    { menuItemId: menu[2].id, userId: sneha.id, rating: 4.5 },
    { menuItemId: menu[2].id, userId: priya.id, rating: 3.5 },
    // Chicken Dum Biryani (menu[4])
    { menuItemId: menu[4].id, userId: rahul.id, rating: 5 },
    { menuItemId: menu[4].id, userId: sneha.id, rating: 4.5 },
    // Masala Dosa (menu[11])
    { menuItemId: menu[11].id, userId: rahul.id, rating: 4 },
    { menuItemId: menu[11].id, userId: priya.id, rating: 5 },
    { menuItemId: menu[11].id, userId: sneha.id, rating: 4 },
    // Paneer Butter Masala (menu[7])
    { menuItemId: menu[7].id, userId: priya.id, rating: 4.5 },
    { menuItemId: menu[7].id, userId: sneha.id, rating: 5 },
    // Butter Chicken (menu[6])
    { menuItemId: menu[6].id, userId: rahul.id, rating: 5 },
    { menuItemId: menu[6].id, userId: sneha.id, rating: 4 },
    // Gulab Jamun (menu[17])
    { menuItemId: menu[17].id, userId: priya.id, rating: 5 },
    { menuItemId: menu[17].id, userId: sneha.id, rating: 4.5 },
    { menuItemId: menu[17].id, userId: rahul.id, rating: 4 },
    // Sweet Lassi (menu[20])
    { menuItemId: menu[20].id, userId: priya.id, rating: 4 },
    { menuItemId: menu[20].id, userId: sneha.id, rating: 3.5 },
  ]);

  /* ---------- VIP Memberships ---------- */
  // Give Priya a VIP membership (monthly) for demo
  const start = new Date();
  const vipEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  await db.run(sql`CREATE TABLE IF NOT EXISTS vip_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vip_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    amount_paid INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date INTEGER NOT NULL,
    end_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(julianday('now') - 2440587.5 as integer) * 86400000)
  )`);
  await db.delete(vipMemberships);
  await db.insert(vipMemberships).values({
    userId: priya.id,
    vipId: "TRI-VIP-00001",
    plan: "monthly",
    amountPaid: 9999,
    status: "active",
    startDate: start,
    endDate: vipEnd,
  });

  /* ---------- Notifications ---------- */
  await db.insert(notifications).values([
    { userId: priya.id, title: "Welcome to Trivilla!", body: "Sign-up bonus: free masala chai on your next order above ₹499." },
    { userId: priya.id, title: "RS-1015 served", body: "Hope you loved it! See you soon." },
    { userId: priya.id, title: "🎉 You're now a VIP!", body: "Enjoy 35% off on food & 50% off on drinks (1AM-5AM excluded). Show your golden card at the table." },
    { userId: manager.id, title: "3 orders in kitchen", body: "RS-1016, RS-1017 & RS-1018 are waiting for you." },
  ]);

  console.log("Done! Manager: manager@trivilla.in / trivilla123 · Chef: chef@trivilla.in / chef123 · Customer: priya@example.com / priya123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
