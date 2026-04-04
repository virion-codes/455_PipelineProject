import { getSql } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { placeOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlaceOrderPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const sql = getSql();
  const products = await sql`
    SELECT product_id, product_name, category, price
    FROM products
    WHERE is_active = 1
    ORDER BY category, product_name
  `;

  const categories = [...new Set(products.map((p) => p.category))].sort();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Place Order</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter quantities for the products you want to order. Leave blank or 0 to skip.
      </p>
      <form action={placeOrder} className="space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {cat}
            </h2>
            <div className="border border-gray-200 rounded divide-y divide-gray-100">
              {products
                .filter((p) => p.category === cat)
                .map((p) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <div className="text-sm font-medium">{p.product_name}</div>
                      <div className="text-xs text-gray-400">${Number(p.price).toFixed(2)} each</div>
                    </div>
                    <input
                      type="number"
                      name={`qty_${p.product_id}`}
                      min="0"
                      max="99"
                      defaultValue=""
                      placeholder="0"
                      className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}
