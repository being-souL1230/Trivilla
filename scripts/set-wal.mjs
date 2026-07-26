// Sets the SQLite journal mode to WAL so Turso accepts the file.
// Run: node scripts/set-wal.mjs

import { createClient } from "@libsql/client";

const db = createClient({ url: "file:local.db" });

try {
  await db.execute("PRAGMA journal_mode=WAL;");
  const { rows } = await db.execute("PRAGMA journal_mode;");
  console.log("✅ journal_mode set to:", rows[0]?.journal_mode ?? "unknown");
} catch (e) {
  console.error("❌ Error:", e);
  process.exit(1);
}

db.close();
