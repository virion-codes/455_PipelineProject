"use server";

import { getSql } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type SqlConn = ReturnType<typeof getSql>;

export async function placeOrder(formData: FormData) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const sql = getSql();

  const items: { productId: number; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("qty_") && Number(value) > 0) {
      const productId = parseInt(key.replace("qty_", ""), 10);
      items.push({ productId, quantity: Number(value) });
    }
  }

  if (items.length === 0) return;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  await sql.begin(async (txn) => {
    const q = txn as unknown as SqlConn;
    let subtotal = 0;
    const itemRows: {
      productId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const item of items) {
      const [product] = await q`
        SELECT price FROM products WHERE product_id = ${item.productId}
      `;
      if (!product) continue;
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemRows.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    const shippingFee = 9.99;
    const taxAmount = parseFloat((subtotal * 0.07).toFixed(2));
    const orderTotal = parseFloat((subtotal + shippingFee + taxAmount).toFixed(2));

    const [inserted] = await q`
      INSERT INTO orders (
        customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
        payment_method, device_type, ip_country, promo_used, order_subtotal,
        shipping_fee, tax_amount, order_total, risk_score, is_fraud
      )
      VALUES (
        ${customerId},
        ${now},
        '00000',
        '00000',
        'XX',
        'card',
        'desktop',
        'US',
        0,
        ${subtotal},
        ${shippingFee},
        ${taxAmount},
        ${orderTotal},
        0,
        0
      )
      RETURNING order_id
    `;

    const orderId = inserted.order_id;

    for (const row of itemRows) {
      await q`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
        VALUES (${orderId}, ${row.productId}, ${row.quantity}, ${row.unitPrice}, ${row.lineTotal})
      `;
    }
  });

  redirect("/orders?placed=1");
}
