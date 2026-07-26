import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications, otpCodes, users } from "@/db/schema";
import {
  ApiError,
  createSession,
  destroySession,
  getSessionUser,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { sendOtpEmail } from "@/lib/resend";

type Ctx = { params: Promise<{ action: string }> };

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;
  if (action === "me") {
    const user = await getSessionUser();
    return json({ user });
  }
  return json({ error: "Not found" }, 404);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    switch (action) {
      /* ---- signup step 1: send OTP (shown in demo inbox) ---- */
      case "register": {
        const name = String(body.name ?? "").trim();
        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const phone = String(body.phone ?? "").trim();
        if (name.length < 2) throw new ApiError(400, "Please enter your full name");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          throw new ApiError(400, "That email doesn't look right");
        if (password.length < 6)
          throw new ApiError(400, "Password needs at least 6 characters");
        const exists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (exists.length)
          throw new ApiError(409, "This email is already registered — try signing in");
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await db.insert(otpCodes).values({
          email,
          code,
          meta: JSON.stringify({ name, password: hashPassword(password), phone }),
        });
        // Send real OTP email via Resend
        const sent = await sendOtpEmail(email, code, name);
        if (!sent) {
          // Log the error but don't block — delete the unused OTP record
          await db.delete(otpCodes).where(eq(otpCodes.email, email));
          throw new ApiError(500, "OTP bhejne mein error aaya. Dobara try karein.");
        }
        return json({ ok: true });
      }

      /* ---- signup step 2: verify OTP, create account + session ---- */
      case "verify": {
        const email = String(body.email ?? "").trim().toLowerCase();
        const code = String(body.code ?? "").trim();
        if (!email || !code) throw new ApiError(400, "Enter the 6-digit code");
        const rows = await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.email, email),
              eq(otpCodes.used, false),
              gt(otpCodes.createdAt, new Date(Date.now() - 10 * 60 * 1000)),
            ),
          )
          .orderBy(desc(otpCodes.id))
          .limit(1);
        const otp = rows[0];
        if (!otp || otp.code !== code)
          throw new ApiError(400, "That code didn't match — check and try again");
        await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));
        const meta = JSON.parse(otp.meta || "{}");
        const [user] = await db
          .insert(users)
          .values({
            name: meta.name,
            email,
            password: meta.password,
            phone: meta.phone ?? "",
          })
          .returning();
        await createSession(user.id);
        await db.insert(notifications).values({
          userId: user.id,
          title: "Welcome to Trivilla!",
          body: "Your account is ready. Khana khaya kya? Order something tasty!",
        });
        return json({ ok: true });
      }

      /* ---- resend OTP (for signup verification) ---- */
      case "resend-otp": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          throw new ApiError(400, "That email doesn't look right");
        // Preserve meta from existing OTP before deleting
        const existing = await db
          .select({ meta: otpCodes.meta })
          .from(otpCodes)
          .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false)))
          .orderBy(desc(otpCodes.id))
          .limit(1);
        const meta = existing[0]?.meta || "{}";
        await db.delete(otpCodes).where(eq(otpCodes.email, email));
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await db.insert(otpCodes).values({
          email,
          code,
          meta,
        });
        const sent = await sendOtpEmail(email, code, email.split("@")[0]);
        if (!sent)
          throw new ApiError(500, "OTP bhejne mein error aaya. Dobara try karein.");
        return json({ ok: true });
      }

      /* ---- email + password login ---- */
      case "login": {
        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        if (!email || !password)
          throw new ApiError(400, "Enter your email and password");
        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = rows[0];
        if (!user || !verifyPassword(password, user.password))
          throw new ApiError(401, "Email or password is incorrect");
        await createSession(user.id);
        return json({ ok: true });
      }

      /* ---- Google OAuth (legacy fallback — real OAuth is at /api/auth/google/authorize) ---- */
      case "google": {
        // Deprecated — kept for backward compatibility.
        // Real Google OAuth flow: GET /api/auth/google/authorize
        return json({ error: "Google OAuth is now handled via redirect. Use /api/auth/google/authorize" }, 400);
      }

      case "logout": {
        await destroySession();
        return json({ ok: true });
      }

      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side" }, 500);
  }
}
