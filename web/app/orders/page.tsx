import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const params = await searchParams;
  const justPlaced = params.placed === "1";

  const db = getDb();
  const orders = db
    .prepare(
      `SELECT o.order_id, o.order_datetime, o.order_total,
              CASE WHEN s.shipment_id IS NOT NULL THEN 1 ELSE 0 END AS fulfilled,
              COALESCE(s.late_delivery, -1) AS late_delivery
       FROM orders o
       LEFT JOIN shipments s ON s.order_id = o.order_id
       WHERE o.customer_id = ?
       ORDER BY o.order_datetime DESC`
    )
    .all(customerId) as {
    order_id: number;
    order_datetime: string;
    order_total: number;
    fulfilled: number;
    late_delivery: number;
  }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
        <Link
          href="/place-order"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Order
        </Link>
      </div>

      {justPlaced && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">
          Order placed successfully!
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-400">No orders yet.</p>
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
            {orders.map((o) => (
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
                  {o.order_datetime.slice(0, 10)}
                </td>
                <td className="px-4 py-2">${o.order_total.toFixed(2)}</td>
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
  );
}
