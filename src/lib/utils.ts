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
  // Hero & interior — using browser-verified Unsplash food/restaurant photos
  hero: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=627&fit=crop",
  interior: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=900&fit=crop",
  interior2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=627&fit=crop",
  ritual: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=1200&h=627&fit=crop",

  // Dish images — exact links from food-images-link file
  thali: "https://5.imimg.com/data5/HU/PG/OE/SELLER-9770898/special-veg-thali.jpg",
  vegThali: "https://static.vecteezy.com/system/resources/previews/069/757/420/non_2x/delicious-vegetarian-thali-featuring-dal-sabzi-rice-yogurt-and-roti-perfect-for-wholesome-free-photo.jpeg",
  misal: "https://i.ytimg.com/vi/u59v30knN_c/maxresdefault.jpg",
  vegBiryani: "https://tse1.mm.bing.net/th/id/OIP.fGqnj5iqdXPtxhCtvsH2bwHaFE?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  chickenBiryani: "https://maharajaroyaldining.com/wp-content/uploads/2024/04/Chicken-Dum-Biryani-2.webp",
  roganJosh: "https://recipes.timesofindia.com/photo/53192600.cms",
  paneerButter: "https://www.indianhealthyrecipes.com/wp-content/uploads/2023/04/butter-chicken-recipe.jpg",
  butterChicken: "https://thehappyfoodie.co.uk/wp-content/uploads/2023/03/Butter_Chicken-1024x1536.jpg",
  dalMakhani: "https://th.bing.com/th/id/OIP.sF4b948SFHLbg4JSDLrzPgHaHa?w=196&h=197&c=7&r=0&o=7&pid=1.7&rm=3",
  palakPaneer: "https://tse1.mm.bing.net/th/id/OIP.5OVZdom2nBDUd3IaPfCSswHaEJ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  chettinad: "https://tse4.mm.bing.net/th/id/OIP.tS4gBcMHDYA6SlbSBx4wywHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  dosa: "https://th.bing.com/th/id/OIP.YmWzD7LZ6txTZ2OFPG9pUgHaE8?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
  naan: "https://th.bing.com/th/id/OIP.GoJ7X-VzOgaZjCOpGOjnqQHaHa?w=182&h=182&c=7&r=0&o=7&pid=1.7&rm=3",
  paratha: "https://th.bing.com/th/id/OIP.8DE6gB_yvLkqxVDtEHFE5QHaHa?w=191&h=191&c=7&r=0&o=7&pid=1.7&rm=3",
  pakora: "https://th.bing.com/th/id/OIP.OmrFKUb28G5Px27eHugC7AHaHa?w=188&h=188&c=7&r=0&o=7&pid=1.7&rm=3",
  chicken65: "https://th.bing.com/th/id/OIP.ga3Qt0FCuYmNpTWUYjx8GQHaJN?w=113&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
  samosa: "https://tse1.explicit.bing.net/th/id/OIP.uiSlJQFxdPdEYu2N2w7vfwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  gulabJamun: "https://tse1.explicit.bing.net/th/id/OIP.0TmBLPXRg4iDkzzclnaZCAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  kulfi: "https://tse3.mm.bing.net/th/id/OIP.iY51Nm9joxiEd9LxdPxb-QHaFe?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  chai: "https://masalaandchai.com/wp-content/uploads/2021/07/Masala-Chai-Featured.jpg",
  sweetLassi: "https://i.pinimg.com/originals/d8/57/38/d857383198c806345ba60fdd7d25f832.png",
  masalaChaas: "https://tse1.mm.bing.net/th/id/OIP.M9gDJ8_f-PK8WKZDBuweiwHaK_?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  freshLimeSoda: "https://tse3.mm.bing.net/th/id/OIP.L1X-FB5yhKI928eZYkDoYgHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  greenSalad: "https://bakeitwithlove.com/wp-content/uploads/2024/07/green-garden-salad-sq1.jpg",
  lacchaOnion: "https://th.bing.com/th/id/OIP.IQi4UP-XtyOM5dceVQroqQHaHb?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
  boondiRaita: "https://th.bing.com/th/id/OIP.3-LETnN6tiNHVceXGx1e4QHaGw?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
  freshCurd: "https://4.imimg.com/data4/HV/QM/ANDROID-41314966/product-500x500.jpeg",
  papad: "https://rahicafe.com/wp-content/uploads/2023/04/roasted-papad.png",
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
    friendly: "Order received — sent to kitchen",
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
