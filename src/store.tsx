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
import { Icon } from "@/components/ui";
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
    cache: "no-store",
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

/* ---------------- SSE hook (realtime server-sent events) ---------------- */

export function useSSE<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(url);
      setConnected(false);

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data) as T);
          setError(null);
        } catch {
          // ignore malformed data
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Auto-reconnect after 3s
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [url]);

  return { data, error, connected };
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
  refresh: () => Promise<UserT | null>;
  signOut: () => Promise<void>;
}>({ user: null, booting: true, refresh: async () => null, signOut: async () => {} });
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
      return d.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setBooting(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const signOut = useCallback(async () => {
    setUser(null);
    post("/api/auth/logout", {}).catch(() => {});
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
          <div className="pointer-events-none fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
            {toasts.map((t, i) => {
              const isOk = t.kind === "ok";
              const isErr = t.kind === "err";
              const iconName = isOk ? "checkCircle" as const : isErr ? "alert" as const : "info" as const;
              const gradient = isOk
                ? "from-emerald-600 to-emerald-800"
                : isErr
                  ? "from-red-600 to-rose-800"
                  : "from-slate-800 to-slate-950";
              const border = isOk
                ? "border-emerald-500/25"
                : isErr
                  ? "border-red-500/25"
                  : "border-white/10";
              const glow = isOk
                ? "shadow-emerald-500/15"
                : isErr
                  ? "shadow-red-500/15"
                  : "shadow-black/30";
              const bar = isOk
                ? "bg-emerald-300/60"
                : isErr
                  ? "bg-red-300/60"
                  : "bg-white/30";

              return (
                <div
                  key={t.id}
                  role="alert"
                  className={`pointer-events-auto relative flex w-[min(92vw,400px)] items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl ${border} ${glow}`}
                  style={{
                    background: `linear-gradient(135deg, ${isOk ? "#059669" : isErr ? "#dc2626" : "#1e293b"}dd, ${isOk ? "#065f46" : isErr ? "#9f1239" : "#0f172a"}ee)`,
                    animation: `bounce-in 0.4s ease-out`,
                    zIndex: 90 - i,
                  }}
                >
                  {/* Icon */}
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                      isOk ? "bg-emerald-400/20" : isErr ? "bg-red-400/20" : "bg-white/10"
                    }`}
                  >
                    <Icon name={iconName} size={17} />
                  </span>

                  {/* Message */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-bold leading-snug text-white">
                      {t.msg}
                    </p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                    className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/80"
                    aria-label="Dismiss"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>

                  {/* Progress bar */}
                  <span
                    className={`absolute bottom-0 left-0 h-[3px] rounded-full ${bar}`}
                    style={{
                      animation: `shrink 3.8s linear forwards`,
                    }}
                    role="presentation"
                  />
                </div>
              );
            })}
          </div>
        </CartCtx.Provider>
      </AuthCtx.Provider>
    </ToastCtx.Provider>
  );
}
