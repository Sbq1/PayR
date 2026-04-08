"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { navItems } from "@/lib/constants/nav";

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-white">
          <div className="flex items-center h-14 px-6 border-b border-gray-200">
            <span className="font-semibold text-gray-900 text-[15px]">Smart Checkout</span>
          </div>
          <nav className="px-3 py-4 space-y-0.5">
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
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-[11px] font-medium text-gray-600">SB</span>
        </div>
      </div>
    </header>
  );
}
