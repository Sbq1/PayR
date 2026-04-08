import {
  LayoutDashboard,
  Table2,
  QrCode,
  Receipt,
  CreditCard,
  ShoppingBag,
  Settings,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tables", label: "Mesas", icon: Table2 },
  { href: "/qr-codes", label: "Códigos QR", icon: QrCode },
  { href: "/orders", label: "Ordenes", icon: Receipt },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/upsells", label: "Sugeridos", icon: ShoppingBag },
  { href: "/settings", label: "Configuración", icon: Settings },
];
