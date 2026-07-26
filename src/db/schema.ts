import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

/* ---------------- People & auth ---------------- */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"), // "salt:hash" — null for Google users
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("customer"), // customer | manager
  isGoogle: integer("is_google", { mode: "boolean" }).notNull().default(false),
  vegOnly: integer("veg_only", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const otpCodes = sqliteTable("otp_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  code: text("code").notNull(),
  meta: text("meta").notNull().default("{}"), // pending signup data (name, password, phone)
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/* ---------------- Restaurant ---------------- */

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  veg: integer("veg", { mode: "boolean" }).notNull().default(true),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  popular: integer("popular", { mode: "boolean" }).notNull().default(false),
  spice: integer("spice").notNull().default(1), // 0 mild – 3 fiery
  prepTime: integer("prep_time").notNull().default(15), // minutes
  image: text("image").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableNo: integer("table_no").notNull().unique(),
  seats: integer("seats").notNull().default(4),
  zone: text("zone").notNull().default("Main Hall"),
  status: text("status").notNull().default("free"), // free | occupied | reserved | cleaning
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  customerName: text("customer_name").notNull(),
  type: text("type").notNull().default("dine-in"), // dine-in | takeaway
  tableId: integer("table_id").references(() => tables.id),
  paymentMode: text("payment_mode").notNull().default("upi"), // upi | card | cash
  note: text("note").notNull().default(""),
  subtotal: integer("subtotal").notNull(),
  tax: integer("tax").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("placed"), // placed | cooking | ready | served | cancelled
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  qty: integer("qty").notNull(),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull().default(""),
  date: text("date").notNull(), // YYYY-MM-DD stored as text
  slot: text("slot").notNull(),
  guests: integer("guests").notNull().default(2),
  tableId: integer("table_id").references(() => tables.id),
  requestedTableId: integer("requested_table_id").references(() => tables.id),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("requested"), // requested | alternate_offered | confirmed | seated | completed | cancelled
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default("Vegetables"),
  unit: text("unit").notNull().default("kg"),
  qty: real("qty").notNull().default(0),
  minQty: real("min_qty").notNull().default(5),
  avgDailyUse: real("avg_daily_use").notNull().default(1),
  costPerUnit: integer("cost_per_unit").notNull().default(0),
  supplier: text("supplier").notNull().default(""),
  lastRestocked: integer("last_restocked", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  duty: text("duty").notNull().default("Waiter"),
  phone: text("phone").notNull().default(""),
  shift: text("shift").notNull().default("Full Day"),
  onDuty: integer("on_duty", { mode: "boolean" }).notNull().default(true),
  joinedOn: text("joined_on").notNull(), // stored as text YYYY-MM-DD
});
