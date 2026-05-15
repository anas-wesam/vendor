"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/inventory", label: "Inventory", icon: "🗃️" },
  { href: "/suppliers", label: "Suppliers", icon: "🏭" },
  { href: "/calculator", label: "حاسبة التسعير", icon: "🧮" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="font-bold text-sm text-gray-900">Vendor Manager</p>
            <p className="text-xs text-gray-500">Amazon Vendor Central</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-orange-50 text-orange-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">Amazon Vendor Tool</p>
      </div>
    </aside>
  );
}
