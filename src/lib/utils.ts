/* Shared helpers + plain TS types used across client & server. */

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

export const inr = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));

export const timeAgo = (d: string | Date) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const fmtDateFull = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const addDaysStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/* ---------------- Images ---------------- */

export const IMG = {
  hero: "https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  interior:
    "https://images.pexels.com/photos/37307273/pexels-photo-37307273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
  interior2:
    "https://images.pexels.com/photos/37968303/pexels-photo-37968303.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ritual:
    "https://images.pexels.com/photos/8818667/pexels-photo-8818667.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  thali:
    "https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  vegThali:
    "https://images.pexels.com/photos/35008222/pexels-photo-35008222.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  misal:
    "https://images.pexels.com/photos/17223837/pexels-photo-17223837.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  vegBiryani:
    "https://images.pexels.com/photos/28909537/pexels-photo-28909537.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  chickenBiryani:
    "https://images.pexels.com/photos/32083366/pexels-photo-32083366.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  roganJosh:
    "https://images.pexels.com/photos/4439740/pexels-photo-4439740.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  butterChicken:
    "https://images.pexels.com/photos/17050759/pexels-photo-17050759.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  paneerButter:
    "https://images.pexels.com/photos/5127316/pexels-photo-5127316.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dalMakhani:
    "https://images.pexels.com/photos/28125427/pexels-photo-28125427.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  palakPaneer:
    "https://images.pexels.com/photos/20446394/pexels-photo-20446394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  chettinad:
    "https://images.pexels.com/photos/9609869/pexels-photo-9609869.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dosa: "https://images.pexels.com/photos/20422123/pexels-photo-20422123.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  naan: "https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  paratha:
    "https://images.pexels.com/photos/20408462/pexels-photo-20408462.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  pakora:
    "https://images.pexels.com/photos/8585763/pexels-photo-8585763.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  chicken65:
    "https://images.pexels.com/photos/9738992/pexels-photo-9738992.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  samosa: "/images/samosa.jpg",
  gulabJamun: "/images/gulab-jamun.jpg",
  kulfi: "/images/kulfi.jpg",
  chai: "/images/masala-chai.jpg",
  drinks: "/images/indian-drinks.jpg",
  sides: "/images/indian-sides.jpg",
  papad: "/images/papad.jpg",
};

export const IMAGE_CHOICES = Object.entries(IMG)
  .filter(([k]) => k !== "hero" && k !== "ritual")
  .map(([k, url]) => ({ key: k, url }));

/* ---------------- Menu / status metadata ---------------- */

export const CATEGORIES = [
  "Starters",
  "Thali",
  "Main Course",
  "Rice & Biryani",
  "Breads",
  "South Indian",
  "Sides",
  "Desserts",
  "Drinks",
];

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  veg: boolean;
  available: boolean;
  popular: boolean;
  spice: number;
  prepTime: number;
  image: string;
  createdAt: string;
};

export type OrderItem = {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: number;
  code: string;
  userId: number;
  customerName: string;
  type: "dine-in" | "takeaway";
  tableId: number | null;
  tableNo?: number | null;
  paymentMode: "upi" | "card" | "cash";
  note: string;
  subtotal: number;
  tax: number;
  total: number;
  status: "placed" | "cooking" | "ready" | "served" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type TableT = {
  id: number;
  tableNo: number;
  seats: number;
  zone: string;
  status: "free" | "occupied" | "reserved" | "cleaning";
};

export type Reservation = {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  date: string;
  slot: string;
  guests: number;
  tableId: number | null;
  requestedTableId: number | null;
  tableNo?: number | null;
  note: string;
  status: "requested" | "alternate_offered" | "confirmed" | "seated" | "completed" | "cancelled";
  createdAt: string;
};

export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minQty: number;
  avgDailyUse: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
};

export type StaffT = {
  id: number;
  name: string;
  duty: string;
  phone: string;
  shift: string;
  onDuty: boolean;
  joinedOn: string;
};

export type UserT = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "manager" | "chef";
  isGoogle: boolean;
  vegOnly: boolean;
  createdAt: string;
};

export type Notif = {
  id: number;
  userId: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export const ORDER_STEPS = ["placed", "cooking", "ready", "served", "completed"] as const;

export const ORDER_META: Record<
  string,
  { label: string; friendly: string; cls: string; dot: string }
> = {
  placed: {
    label: "Placed",
    friendly: "Order received — kitchen ko bhej diya",
    cls: "bg-gold-soft text-[#7a5a12] border-[#e6d3a3]",
    dot: "bg-[#b98a2e]",
  },
  cooking: {
    label: "Cooking",
    friendly: "Chef is cooking your food",
    cls: "bg-brand-soft text-brand-deep border-[#eec9ad]",
    dot: "bg-brand",
  },
  ready: {
    label: "Ready",
    friendly: "Hot & ready — coming to you",
    cls: "bg-leaf-soft text-leaf-deep border-[#bcd8c4]",
    dot: "bg-leaf",
  },
  served: {
    label: "Served",
    friendly: "Served. Enjoy your meal!",
    cls: "bg-leaf-soft text-leaf-deep border-[#bcd8c4]",
    dot: "bg-leaf",
  },
  completed: {
    label: "Completed",
    friendly: "Order complete — bill generated",
    cls: "bg-sand text-ink2 border-line",
    dot: "bg-ink2/40",
  },
  cancelled: {
    label: "Cancelled",
    friendly: "This order was cancelled",
    cls: "bg-chili-soft text-chili border-[#ecc4ba]",
    dot: "bg-chili",
  },
};

export const RES_META: Record<string, { label: string; cls: string }> = {
  requested: { label: "Waiting for confirm", cls: "bg-gold-soft text-[#7a5a12] border-[#e6d3a3]" },
  alternate_offered: { label: "Alternate offered", cls: "bg-[#f0e6ff] text-[#6b3fa0] border-[#d4c0f0]" },
  confirmed: { label: "Booked", cls: "bg-leaf-soft text-leaf-deep border-[#bcd8c4]" },
  seated: { label: "Seated", cls: "bg-brand-soft text-brand-deep border-[#eec9ad]" },
  completed: { label: "Completed", cls: "bg-sand text-ink2 border-line" },
  cancelled: { label: "Cancelled", cls: "bg-chili-soft text-chili border-[#ecc4ba]" },
};

export const TABLE_META: Record<string, { label: string; cls: string; dot: string }> = {
  free: { label: "Free", cls: "bg-leaf-soft text-leaf-deep border-[#bcd8c4]", dot: "bg-leaf" },
  occupied: { label: "Occupied", cls: "bg-brand-soft text-brand-deep border-[#eec9ad]", dot: "bg-brand" },
  reserved: { label: "Reserved", cls: "bg-gold-soft text-[#7a5a12] border-[#e6d3a3]", dot: "bg-gold" },
  cleaning: { label: "Cleaning", cls: "bg-sand text-ink2 border-line", dot: "bg-ink2" },
};

export const PAY_LABEL: Record<string, string> = {
  upi: "UPI (GPay / PhonePe)",
  card: "Card",
  cash: "Cash at counter",
};

export const LUNCH_SLOTS = [
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
];

export const DINNER_SLOTS = [
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
];

export const ZONES = ["Main Hall", "Window Side", "Terrace", "Private"];

export const daysLeft = (i: { qty: number; avgDailyUse: number }) =>
  i.avgDailyUse > 0 ? Math.floor(i.qty / i.avgDailyUse) : 99;
