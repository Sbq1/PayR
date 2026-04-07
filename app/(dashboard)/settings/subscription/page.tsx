import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suscripcion</h1>
        <p className="text-muted-foreground">Tu plan actual y opciones</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actual</CardTitle>
              <CardDescription>Administra tu suscripcion</CardDescription>
            </div>
            <Badge variant="secondary">Starter</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Detalles del plan, uso y opciones de upgrade — Sprint 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
