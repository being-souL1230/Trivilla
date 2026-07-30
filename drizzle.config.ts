import "dotenv/config";
import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

// For sqlite dialect, authToken is not part of dbCredentials type.
// If DATABASE_URL is remote (Turso), drizzle-kit connects via the url directly.
const config: Config = {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
};

// Add authToken only when it's a remote Turso URL (not file:)
if (!url.startsWith("file:") && authToken) {
  (config as any).dbCredentials = { url, authToken };
} else {
  (config as any).dbCredentials = { url };
}

export default config;
