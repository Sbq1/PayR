"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Table2,
  QrCode,
  Receipt,
  CreditCard,
  ShoppingBag,
  Settings,
  Menu,
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

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile menu */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center h-16 px-6 border-b border-gray-100">
            <span className="font-bold text-gray-900">Smart Checkout</span>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-indigo-600">SB</span>
        </div>
      </div>
    </header>
  );
}
