"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
}

export default function SelectForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const customer = customers.find((c) => c.customer_id === selected)!;
    document.cookie = `customer_id=${customer.customer_id}; path=/; max-age=86400`;
    document.cookie = `customer_name=${encodeURIComponent(customer.full_name)}; path=/; max-age=86400`;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="border border-gray-200 rounded max-h-80 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No customers found.</p>
        ) : (
          filtered.map((c) => (
            <label
              key={c.customer_id}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                selected === c.customer_id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="customer"
                value={c.customer_id}
                checked={selected === c.customer_id}
                onChange={() => setSelected(c.customer_id)}
                className="accent-blue-600"
              />
              <div>
                <div className="text-sm font-medium">{c.full_name}</div>
                <div className="text-xs text-gray-400">{c.email}</div>
              </div>
            </label>
          ))
        )}
      </div>
      <button
        type="submit"
        disabled={!selected}
        className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue as this customer →
      </button>
    </form>
  );
}
