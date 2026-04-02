import { getDb } from "@/lib/db";

export default function SchemaPage() {
  const db = getDb();

  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    )
    .all() as { name: string }[];

  const schema = tables.map(({ name }) => {
    const cols = db.prepare(`PRAGMA table_info(${name})`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }[];
    const count = (db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n;
    return { name, cols, count };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Database Schema</h1>
        <p className="text-gray-500 text-sm">
          Live view of all tables in <code>shop.db</code>.
        </p>
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
                <th className="px-4 py-1.5 text-gray-500">PK</th>
                <th className="px-4 py-1.5 text-gray-500">Not Null</th>
                <th className="px-4 py-1.5 text-gray-500">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cols.map((c) => (
                <tr key={c.cid} className="font-mono">
                  <td className="px-4 py-1.5 font-semibold">{c.name}</td>
                  <td className="px-4 py-1.5 text-gray-500">{c.type || "—"}</td>
                  <td className="px-4 py-1.5">{c.pk ? "✓" : ""}</td>
                  <td className="px-4 py-1.5">{c.notnull ? "✓" : ""}</td>
                  <td className="px-4 py-1.5 text-gray-400">{c.dflt_value ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
