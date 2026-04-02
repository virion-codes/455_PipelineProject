import { getDb } from "@/lib/db";
import SelectForm from "./SelectForm";

export const dynamic = "force-dynamic";

export default function SelectCustomerPage() {
  const db = getDb();
  const customers = db
    .prepare(
      "SELECT customer_id, full_name, email FROM customers WHERE is_active = 1 ORDER BY full_name"
    )
    .all() as { customer_id: number; full_name: string; email: string }[];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Select Customer</h1>
      <p className="text-gray-500 mb-6">
        Choose a customer to act as for this session.
      </p>
      <SelectForm customers={customers} />
    </div>
  );
}
