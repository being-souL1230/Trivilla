import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

const client = createClient({ url, authToken: authToken || undefined });

async function main() {
  // Check if VIP tables already exist
  const existing = await client.execute("SELECT table_no FROM tables WHERE table_no IN (13, 14, 15, 16)");
  const existingNos = new Set(existing.rows.map(r => Number(r.table_no)));

  const vips = [
    { tableNo: 13, seats: 2, zone: "Main Hall", vip: 1 },
    { tableNo: 14, seats: 4, zone: "Main Hall", vip: 1 },
    { tableNo: 15, seats: 2, zone: "Patio", vip: 1 },
    { tableNo: 16, seats: 6, zone: "Private", vip: 1 },
  ];

  for (const v of vips) {
    if (existingNos.has(v.tableNo)) {
      // Update existing table to vip
      await client.execute({
        sql: "UPDATE tables SET vip = ? WHERE table_no = ?",
        args: [1, v.tableNo],
      });
      console.log(`→ Table ${v.tableNo} updated to VIP`);
    } else {
      await client.execute({
        sql: "INSERT INTO tables (table_no, seats, zone, status, vip) VALUES (?, ?, ?, 'free', ?)",
        args: [v.tableNo, v.seats, v.zone, 1],
      });
      console.log(`✓ VIP Table ${v.tableNo} created (${v.seats} seats, ${v.zone})`);
    }
  }

  console.log("✓ All VIP tables ready!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
