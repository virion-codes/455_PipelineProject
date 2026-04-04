import postgres from "postgres";

const globalForSql = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

/** Postgres via Supabase. On Vercel use the Transaction pooler connection string (port 6543). */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel (Settings → Environment Variables) and in web/.env.local for local dev."
    );
  }
  if (!globalForSql.sql) {
    globalForSql.sql = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 20,
    });
  }
  return globalForSql.sql;
}
