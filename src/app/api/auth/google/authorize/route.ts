import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getGoogleAuthUrl } from "@/lib/google";

/**
 * GET /api/auth/google/authorize
 *
 * Redirects the user to Google's OAuth consent page.
 * Stores a random `state` in a cookie for CSRF verification on the callback.
 */
export async function GET() {
  // Generate a random state value for CSRF protection
  const state = randomBytes(16).toString("hex");

  // Store state in a secure httpOnly cookie (valid for 10 minutes)
  const store = await cookies();
  store.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min
  });

  const url = getGoogleAuthUrl(state);

  return NextResponse.redirect(url);
}
