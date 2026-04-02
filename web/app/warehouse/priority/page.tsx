import { getDb } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function WarehousePriorityPage() {
  const db = getDb();

  // Check if order_predictions table exists
  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='order_predictions'`
    )
    .get();

  if (!tableExists) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Late Delivery Priority Queue</h1>
        <p className="text-gray-500 text-sm mb-6">
          Orders most likely to arrive late are surfaced here so the warehouse can
          prioritize fulfillment.
        </p>
        <div className="border border-yellow-200 bg-yellow-50 rounded p-5 text-sm text-yellow-800">
          <strong>No predictions yet.</strong> The <code>order_predictions</code> table
          does not exist. Run the ML pipeline (ETL → Train → Inference) to generate
          predictions, then refresh this page.
          <div className="mt-3">
            <Link
              href="/scoring"
              className="inline-block bg-yellow-600 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-yellow-700 transition-colors"
            >
              Go to Run Scoring →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rows = db
    .prepare(
      `SELECT
         o.order_id,
         o.order_datetime,
         o.order_total,
         c.customer_id,
         c.full_name AS customer_name,
         p.late_delivery_probability,
         p.predicted_late_delivery,
         p.prediction_timestamp
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN order_predictions p ON p.order_id = o.order_id
       LEFT JOIN shipments s ON s.order_id = o.order_id
       WHERE s.shipment_id IS NULL
       ORDER BY p.late_delivery_probability DESC, o.order_datetime ASC
       LIMIT 50`
    )
    .all() as {
    order_id: number;
    order_datetime: string;
    order_total: number;
    customer_id: number;
    customer_name: string;
    late_delivery_probability: number;
    predicted_late_delivery: number;
    prediction_timestamp: string;
  }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Late Delivery Priority Queue</h1>
        <Link
          href="/scoring"
          className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          Refresh Scores
        </Link>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Unfulfilled orders ranked by predicted late-delivery risk. Process high-risk
        orders first to reduce late shipments. Top 50 shown.
      </p>

      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No unfulfilled orders with predictions found.
        </p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Risk %</th>
              <th className="px-4 py-2">Predicted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const risk = r.late_delivery_probability;
              const riskColor =
                risk >= 0.7
                  ? "text-red-700 font-semibold"
                  : risk >= 0.4
                  ? "text-yellow-700 font-semibold"
                  : "text-green-700";
              return (
                <tr key={r.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/orders/${r.order_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      #{r.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.customer_name}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {r.order_datetime.slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">${r.order_total.toFixed(2)}</td>
                  <td className={`px-4 py-2 ${riskColor}`}>
                    {(risk * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.predicted_late_delivery
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.predicted_late_delivery ? "Late" : "On time"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
