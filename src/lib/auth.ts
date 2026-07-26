import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { notifications, sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const COOKIE = "rasoi_sid";

export class ApiError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "manager";
  isGoogle: boolean;
  vegOnly: boolean;
  createdAt: Date;
};

const toSafe = (u: typeof users.$inferSelect): SafeUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role as "customer" | "manager",
  isGoogle: u.isGoogle,
  vegOnly: u.vegOnly,
  createdAt: u.createdAt,
});

export async function getSessionUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  return toSafe(row.user);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.delete(COOKIE);
}

export async function requireUser(): Promise<SafeUser> {
  const u = await getSessionUser();
  if (!u) throw new ApiError(401, "Please sign in first");
  return u;
}

export async function requireManager(): Promise<SafeUser> {
  const u = await requireUser();
  if (u.role !== "manager")
    throw new ApiError(403, "Only restaurant staff can do this");
  return u;
}

/** Drop a friendly notification for a user (used across the app). */
export async function notify(userId: number, title: string, body = "") {
  await db.insert(notifications).values({ userId, title, body });
}

/** Notify every manager (kitchen alerts). */
export async function notifyManagers(title: string, body = "") {
  const managers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "manager"));
  if (managers.length)
    await db.insert(notifications).values(
      managers.map((m) => ({ userId: m.id, title, body })),
    );
}
