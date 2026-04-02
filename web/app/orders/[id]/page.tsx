import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const { id } = await params;
  const db = getDb();

  const order = db
    .prepare(
      `SELECT o.*, c.full_name,
              CASE WHEN s.shipment_id IS NOT NULL THEN 1 ELSE 0 END AS fulfilled,
              COALESCE(s.late_delivery, -1) AS late_delivery,
              s.carrier, s.shipping_method, s.actual_days, s.promised_days
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       LEFT JOIN shipments s ON s.order_id = o.order_id
       WHERE o.order_id = ? AND o.customer_id = ?`
    )
    .get(id, customerId) as
    | {
        order_id: number;
        order_datetime: string;
        order_total: number;
        order_subtotal: number;
        shipping_fee: number;
        tax_amount: number;
        payment_method: string;
        full_name: string;
        fulfilled: number;
        late_delivery: number;
        carrier: string | null;
        shipping_method: string | null;
        actual_days: number | null;
        promised_days: number | null;
      }
    | undefined;

  if (!order) notFound();

  const lineItems = db
    .prepare(
      `SELECT oi.quantity, oi.unit_price, oi.line_total, p.product_name, p.category
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(id) as {
    quantity: number;
    unit_price: number;
    line_total: number;
    product_name: string;
    category: string;
  }[];

  const prediction = db
    .prepare(
      `SELECT late_delivery_probability, predicted_late_delivery, prediction_timestamp
       FROM order_predictions WHERE order_id = ?`
    )
    .get(id) as
    | {
        late_delivery_probability: number;
        predicted_late_delivery: number;
        prediction_timestamp: string;
      }
    | undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-sm text-gray-400 hover:text-gray-600">
          ← Orders
        </Link>
        <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
        {order.fulfilled ? (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              order.late_delivery === 1
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {order.late_delivery === 1 ? "Late" : "On time"}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
            Pending
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Customer</div>
          <div className="font-medium">{order.full_name}</div>
        </div>
        <div>
          <div className="text-gray-500">Order Date</div>
          <div className="font-medium">{order.order_datetime.slice(0, 10)}</div>
        </div>
        <div>
          <div className="text-gray-500">Payment</div>
          <div className="font-medium capitalize">{order.payment_method}</div>
        </div>
        {order.carrier && (
          <div>
            <div className="text-gray-500">Carrier</div>
            <div className="font-medium">
              {order.carrier} · {order.shipping_method} · {order.actual_days}d
              {order.promised_days && ` (promised ${order.promised_days}d)`}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Line Items</h2>
        <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Unit Price</th>
              <th className="px-4 py-2">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <div>{item.product_name}</div>
                  <div className="text-xs text-gray-400">{item.category}</div>
                </td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">${item.unit_price.toFixed(2)}</td>
                <td className="px-4 py-2">${item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-200 rounded p-4 text-sm space-y-1 bg-white">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>${order.order_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          <span>${order.shipping_fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax</span>
          <span>${order.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t border-gray-100 pt-1 mt-1">
          <span>Total</span>
          <span>${order.order_total.toFixed(2)}</span>
        </div>
      </div>

      {prediction && (
        <div className="border border-blue-200 rounded p-4 bg-blue-50 text-sm">
          <h3 className="font-semibold text-blue-800 mb-1">ML Prediction</h3>
          <div className="text-blue-700 space-y-0.5">
            <div>
              Late delivery probability:{" "}
              <strong>{(prediction.late_delivery_probability * 100).toFixed(1)}%</strong>
            </div>
            <div>
              Predicted:{" "}
              <strong>{prediction.predicted_late_delivery ? "Late" : "On time"}</strong>
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Scored at {prediction.prediction_timestamp.slice(0, 19).replace("T", " ")} UTC
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
