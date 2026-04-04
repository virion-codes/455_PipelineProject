import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchemaPage() {
  const sql = getSql();

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const schema = await Promise.all(
    tables.map(async ({ table_name: name }) => {
      const cols = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${name}
        ORDER BY ordinal_position
      `;

      let count = 0;
      if (/^[a-z_][a-z0-9_]*$/i.test(name)) {
        const [{ n }] = await sql.unsafe(
          `SELECT COUNT(*)::int AS n FROM ${name.replace(/"/g, "")}`
        );
        count = n;
      }

      return { name, cols, count };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Database Schema</h1>
        <p className="text-gray-500 text-sm">Live view of public tables (Supabase Postgres).</p>
      </div>

      {schema.map(({ name, cols, count }) => (
        <div key={name} className="border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="font-semibold text-sm">{name}</span>
            <span className="text-xs text-gray-400">{count.toLocaleString()} rows</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left border-b border-gray-200">
              <tr>
                <th className="px-4 py-1.5 text-gray-500">Column</th>
                <th className="px-4 py-1.5 text-gray-500">Type</th>
                <th className="px-4 py-1.5 text-gray-500">Nullable</th>
                <th className="px-4 py-1.5 text-gray-500">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cols.map((c) => (
                <tr key={c.column_name} className="font-mono">
                  <td className="px-4 py-1.5 font-semibold">{c.column_name}</td>
                  <td className="px-4 py-1.5 text-gray-500">{c.data_type || "—"}</td>
                  <td className="px-4 py-1.5">{c.is_nullable === "YES" ? "NULL" : "NOT NULL"}</td>
                  <td className="px-4 py-1.5 text-gray-400">
                    {c.column_default != null ? String(c.column_default) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
