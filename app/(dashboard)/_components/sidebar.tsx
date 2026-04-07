"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Table2,
  QrCode,
  Receipt,
  CreditCard,
  ShoppingBag,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tables", label: "Mesas", icon: Table2 },
  { href: "/qr-codes", label: "Códigos QR", icon: QrCode },
  { href: "/orders", label: "Ordenes", icon: Receipt },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/upsells", label: "Sugeridos", icon: ShoppingBag },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 px-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-gray-900">Smart Checkout</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-500/5"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors duration-300",
                    isActive && "text-indigo-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
