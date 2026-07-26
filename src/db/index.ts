import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

const globalForDb = globalThis as typeof globalThis & {
  __sqliteClient?: ReturnType<typeof createClient>;
};

export const client =
  globalForDb.__sqliteClient ??
  createClient({
    url: databaseUrl,
    authToken: authToken || undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sqliteClient = client;
}

export const db = drizzle(client, { schema });
