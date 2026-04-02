"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/select-customer", label: "Select Customer" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/place-order", label: "Place Order" },
  { href: "/orders", label: "Order History" },
  { href: "/warehouse/priority", label: "Priority Queue" },
  { href: "/scoring", label: "Run Scoring" },
];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function Nav() {
  const pathname = usePathname();
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    const name = getCookie("customer_name");
    setCustomerName(name);
  }, [pathname]);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        {customerName && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Customer: <strong>{customerName}</strong>
          </span>
        )}
      </div>
    </nav>
  );
}
