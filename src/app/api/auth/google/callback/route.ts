import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getGoogleProfile } from "@/lib/google";
import { createSession } from "@/lib/auth";
import { notifications } from "@/db/schema";

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * Handles the callback from Google OAuth:
 * 1. Verifies the `state` cookie (CSRF protection)
 * 2. Exchanges the authorisation `code` for user info (via id_token)
 * 3. Finds or creates the user in our DB with `isGoogle: true`
 * 4. Creates a session (cookie) for the user
 * 5. Drops a welcome notification for new users
 * 6. Redirects to the app home page
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user-declined consent gracefully
    if (error === "access_denied") {
      return NextResponse.redirect(
        new URL("/?google=denied", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      );
    }
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/?google=error", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/?google=missing_code", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      );
    }

    // CSRF check — verify the state matches our cookie
    const store = await cookies();
    const storedState = store.get("google_oauth_state")?.value;
    store.delete("google_oauth_state");

    if (!returnedState || !storedState || returnedState !== storedState) {
      console.error("Google OAuth state mismatch — possible CSRF attack");
      return NextResponse.redirect(
        new URL("/?google=csrf", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      );
    }

    // Exchange code for Google profile
    const profile = await getGoogleProfile(code);

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || email.split("@")[0];

    // Find existing user or create a new one
    let existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existing[0];

    if (!user) {
      // New Google user — create account
      const [created] = await db
        .insert(users)
        .values({
          name,
          email,
          phone: "",
          isGoogle: true,
        })
        .returning();
      user = created;

      // Welcome notification
      await db.insert(notifications).values({
        userId: user.id,
        title: "Welcome to Trivilla!",
        body: "Logged in with Google! Order something tasty — ghar jaisa khana, bina wait ke.",
      });
    }

    // Create session cookie
    await createSession(user.id);

    // Redirect back to the app
    const redirectUrl = new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    redirectUrl.searchParams.set("google", "success");

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/?google=fail&msg=${encodeURIComponent(msg)}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    );
  }
}
