/**
 * Google OAuth helper — server-side only.
 * Uses the Authorization Code flow + id_token to create / sign in users.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

type GoogleTokens = {
  access_token: string;
  id_token: string;
  expires_in: number;
};

type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
};

/** Build the Google OAuth consent URL the user is redirected to. */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange an authorisation code for an access + ID token. */
async function exchangeCode(code: string): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<GoogleTokens>;
}

/** Decode the id_token JWT (simple decode, no verification — the token came fresh from Google). */
function decodeIdToken(idToken: string): GoogleProfile {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid id_token");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
}

/**
 * Exchange the authorisation code for a Google user profile.
 * Returns the user's email, name, and avatar URL.
 */
export async function getGoogleProfile(code: string): Promise<GoogleProfile> {
  const tokens = await exchangeCode(code);
  const profile = decodeIdToken(tokens.id_token);

  if (!profile.email) throw new Error("Google did not return an email address");
  if (!profile.email_verified) throw new Error("Google email is not verified");

  return profile;
}
