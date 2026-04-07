import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Store, Database, CreditCard, Crown } from "lucide-react";

const settingsSections = [
  {
    title: "General",
    description: "Nombre, logo y colores de tu restaurante",
    href: "/settings",
    icon: Store,
    current: true,
  },
  {
    title: "POS (Siigo)",
    description: "Credenciales de tu sistema de punto de venta",
    href: "/settings/pos",
    icon: Database,
  },
  {
    title: "Pagos (Wompi)",
    description: "Llaves de tu pasarela de pagos",
    href: "/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Suscripcion",
    description: "Tu plan actual y opciones de mejora",
    href: "/settings/subscription",
    icon: Crown,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra tu restaurante y conexiones
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Configuracion general</CardTitle>
          <CardDescription>
            Nombre, slug, logo y colores de tu restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Formulario de configuracion — Sprint 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
