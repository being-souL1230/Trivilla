import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const h = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}

export function verifyPassword(pw: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  try {
    const test = scryptSync(pw, salt, 64);
    return timingSafeEqual(Buffer.from(h, "hex"), test);
  } catch {
    return false;
  }
}
