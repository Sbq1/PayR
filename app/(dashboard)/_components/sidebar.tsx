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
  { href: "/qr-codes", label: "Codigos QR", icon: QrCode },
  { href: "/orders", label: "Ordenes", icon: Receipt },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/upsells", label: "Sugeridos", icon: ShoppingBag },
  { href: "/settings", label: "Configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 px-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-indigo-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
