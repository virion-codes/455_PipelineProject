"use server";

import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function placeOrder(formData: FormData) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const db = getDb();

  // Parse line items: productId_N => quantity_N pairs
  const items: { productId: number; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("qty_") && Number(value) > 0) {
      const productId = parseInt(key.replace("qty_", ""));
      items.push({ productId, quantity: Number(value) });
    }
  }

  if (items.length === 0) return;

  const insertOrder = db.transaction(() => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    // Calculate totals from products
    let subtotal = 0;
    const itemRows: { productId: number; quantity: number; unitPrice: number; lineTotal: number }[] = [];

    for (const item of items) {
      const product = db
        .prepare("SELECT price FROM products WHERE product_id = ?")
        .get(item.productId) as { price: number } | undefined;
      if (!product) continue;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      itemRows.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const shippingFee = 9.99;
    const taxAmount = parseFloat((subtotal * 0.07).toFixed(2));
    const orderTotal = parseFloat((subtotal + shippingFee + taxAmount).toFixed(2));

    const result = db
      .prepare(
        `INSERT INTO orders
         (customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
          payment_method, device_type, ip_country, promo_used, order_subtotal,
          shipping_fee, tax_amount, order_total)
         VALUES (?, ?, '00000', '00000', 'XX', 'card', 'web', 'US', 0, ?, ?, ?, ?)`
      )
      .run(customerId, now, subtotal, shippingFee, taxAmount, orderTotal);

    const orderId = result.lastInsertRowid;

    for (const row of itemRows) {
      db.prepare(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?)`
      ).run(orderId, row.productId, row.quantity, row.unitPrice, row.lineTotal);
    }

    return orderId;
  });

  insertOrder();
  redirect("/orders?placed=1");
}
