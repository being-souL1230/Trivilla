"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserT } from "@/lib/utils";

/* ---------------- tiny fetch helper ---------------- */

export async function api<T = unknown>(
  path: string,
  opts?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method,
    headers: { "Content-Type": "application/json" },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong");
  return data as T;
}

export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: "POST", body });
export const patch = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: "PATCH", body });
export const del = <T,>(p: string) => api<T>(p, { method: "DELETE" });

/* ---------------- data hook ---------------- */

export function useFetch<T>(
  path: string | null,
  opts?: { interval?: number },
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!path) return;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const d = await get<T>(path);
        setData(d);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load");
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!opts?.interval || !path) return;
    const t = setInterval(() => load(true), opts.interval);
    return () => clearInterval(t);
  }, [opts?.interval, path, load]);

  return { data, loading, error, reload: load, setData };
}

/* ---------------- toasts ---------------- */

type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
const ToastCtx = createContext<{ push: (msg: string, kind?: Toast["kind"]) => void }>({
  push: () => {},
});
export const useToast = () => useContext(ToastCtx);

/* ---------------- auth ---------------- */

const AuthCtx = createContext<{
  user: UserT | null;
  booting: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}>({ user: null, booting: true, refresh: async () => {}, signOut: async () => {} });
export const useAuth = () => useContext(AuthCtx);

/* ---------------- cart + ui state ---------------- */

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  qty: number;
  veg: boolean;
  image: string;
  desc?: string;
  note?: string;
};

const CartCtx = createContext<{
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (menuItemId: number, qty: number) => void;
  setNote: (menuItemId: number, note: string) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
}>({
  items: [],
  count: 0,
  subtotal: 0,
  add: () => {},
  setQty: () => {},
  setNote: () => {},
  clear: () => {},
  cartOpen: false,
  setCartOpen: () => {},
  authOpen: false,
  setAuthOpen: () => {},
});
export const useCart = () => useContext(CartCtx);

/* ---------------- provider ---------------- */

let toastId = 0;

export function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const [user, setUser] = useState<UserT | null>(null);
  const [booting, setBooting] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const d = await get<{ user: UserT | null }>("/api/auth/me");
      setUser(d.user);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const signOut = useCallback(async () => {
    await post("/api/auth/logout", {});
    setUser(null);
  }, []);

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("trivilla-cart") || "[]");
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("trivilla-cart", JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.menuItemId === item.menuItemId);
      if (found)
        return list.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, qty: Math.min(10, i.qty + qty) }
            : i,
        );
      return [...list, { ...item, qty }];
    });
  }, []);
  const setQty = useCallback((menuItemId: number, qty: number) => {
    setItems((list) =>
      qty <= 0
        ? list.filter((i) => i.menuItemId !== menuItemId)
        : list.map((i) => (i.menuItemId === menuItemId ? { ...i, qty: Math.min(10, qty) } : i)),
    );
  }, []);
  const setNote = useCallback((menuItemId: number, note: string) => {
    setItems((list) =>
      list.map((i) => (i.menuItemId === menuItemId ? { ...i, note: note || undefined } : i)),
    );
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const cartValue = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      add,
      setQty,
      setNote,
      clear,
      cartOpen,
      setCartOpen,
      authOpen,
      setAuthOpen,
    }),
    [items, add, setQty, setNote, clear, cartOpen, authOpen],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      <AuthCtx.Provider value={{ user, booting, refresh, signOut }}>
        <CartCtx.Provider value={cartValue}>
          {children}
          {/* toast host */}
          <div className="fixed bottom-4 left-1/2 z-[90] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`anim-up flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${
                  t.kind === "ok"
                    ? "border-[#bcd8c4] bg-leaf-deep text-[#f0f7ef]"
                    : t.kind === "err"
                      ? "border-[#ecc4ba] bg-[#7c2018] text-[#fdf0ec]"
                      : "border-line bg-ink text-cream"
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                    t.kind === "ok" ? "bg-[#7fd6a4]" : t.kind === "err" ? "bg-[#ffb3a3]" : "bg-gold"
                  }`}
                />
                {t.msg}
              </div>
            ))}
          </div>
        </CartCtx.Provider>
      </AuthCtx.Provider>
    </ToastCtx.Provider>
  );
}
