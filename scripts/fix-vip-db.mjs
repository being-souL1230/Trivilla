import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

const client = createClient({ url, authToken: authToken || undefined });

async function main() {
  // Add vip column to tables (if it doesn't already exist)
  try {
    await client.execute("ALTER TABLE tables ADD COLUMN vip INTEGER NOT NULL DEFAULT 0");
    console.log("✓ vip column added to 'tables'");
  } catch (e) {
    if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
      console.log("→ vip column already exists, skipping");
    } else {
      throw e;
    }
  }

  // Create vip_memberships table
  await client.execute(`CREATE TABLE IF NOT EXISTS vip_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vip_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    amount_paid INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date INTEGER NOT NULL,
    end_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(julianday('now') - 2440587.5 as integer) * 86400000)
  )`);
  console.log("✓ vip_memberships table created");

  // Now insert a sample VIP membership for Priya (user_id = 2)
  const users = await client.execute("SELECT id, name FROM users WHERE email = 'priya@example.com'");
  if (users.rows.length > 0) {
    const userId = users.rows[0].id;
    // Store Unix seconds (Drizzle mode: "timestamp" expects seconds, not milliseconds)
    const startSec = Math.floor(Date.now() / 1000);
    const endSec = startSec + 30 * 24 * 60 * 60;
    await client.execute({
      sql: "INSERT OR REPLACE INTO vip_memberships (user_id, vip_id, plan, amount_paid, status, start_date, end_date) VALUES (?, ?, ?, ?, 'active', ?, ?)",
      args: [userId, "TRI-VIP-00001", "monthly", 9999, startSec, endSec],
    });
    console.log(`✓ Sample VIP membership created for ${users.rows[0].name}`);
  }

  console.log("✓ Database migration complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
