import { getSql } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const sql = getSql();

  const [customer] = await sql`
    SELECT * FROM customers WHERE customer_id = ${customerId}
  `;

  if (!customer) redirect("/select-customer");

  const [stats] = await sql`
    SELECT COUNT(*)::int AS order_count,
           COALESCE(ROUND(SUM(order_total)::numeric, 2), 0)::float AS total_spend
    FROM orders WHERE customer_id = ${customerId}
  `;

  const recentOrders = await sql`
    SELECT o.order_id, o.order_datetime, o.order_total,
           COALESCE(s.late_delivery, -1) AS late_delivery,
           CASE WHEN s.shipment_id IS NOT NULL THEN 1 ELSE 0 END AS fulfilled
    FROM orders o
    LEFT JOIN shipments s ON s.order_id = o.order_id
    WHERE o.customer_id = ${customerId}
    ORDER BY o.order_datetime DESC
    LIMIT 5
  `;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{customer.full_name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {customer.email} &middot; {customer.city}, {customer.state} &middot;{" "}
          <span className="capitalize">{customer.loyalty_tier}</span> &middot;{" "}
          <span className="capitalize">{customer.customer_segment}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Orders" value={String(stats.order_count)} />
        <StatCard
          label="Total Spend"
          value={`$${Number(stats.total_spend ?? 0).toFixed(2)}`}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <tr key={o.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/orders/${o.order_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      #{o.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {String(o.order_datetime).slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">${Number(o.order_total).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    {o.fulfilled ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.late_delivery === 1
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {o.late_delivery === 1 ? "Late" : "On time"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/place-order"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Place New Order
        </Link>
        <Link
          href="/orders"
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
