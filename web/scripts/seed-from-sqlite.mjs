/**
 * Copy web/data/shop.db into Supabase. Requires DATABASE_URL and applied migration.
 *   cd web && export DATABASE_URL="postgresql://..." && npm run db:seed
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.resolve(__dirname, "../data/shop.db");

const TABLES = [
  "customers",
  "products",
  "orders",
  "order_items",
  "shipments",
  "product_reviews",
];

function assertIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error(`Invalid identifier: ${name}`);
}

async function resetSequence(sql, table, col) {
  assertIdent(table);
  assertIdent(col);
  await sql.unsafe(`
    SELECT setval(
      pg_get_serial_sequence('${table}', '${col}'),
      (SELECT COALESCE(MAX(${col}), 1) FROM ${table})
    )
  `);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL.");
    process.exit(1);
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const sql = postgres(url, { max: 1 });

  try {
    await sql.begin(async (s) => {
      await s.unsafe(`
        TRUNCATE TABLE
          order_predictions,
          product_reviews,
          order_items,
          shipments,
          orders,
          products,
          customers
        RESTART IDENTITY CASCADE
      `);

      for (const table of TABLES) {
        const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
        for (const row of rows) {
          await s`insert into ${s(table)} ${s(row)}`;
        }
        console.error(`Seeded ${table}: ${rows.length} rows`);
      }
    });

    await resetSequence(sql, "customers", "customer_id");
    await resetSequence(sql, "products", "product_id");
    await resetSequence(sql, "orders", "order_id");
    await resetSequence(sql, "order_items", "order_item_id");
    await resetSequence(sql, "shipments", "shipment_id");
    await resetSequence(sql, "product_reviews", "review_id");

    console.error("Done. Sequences reset.");
  } finally {
    await sql.end();
    sqlite.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
