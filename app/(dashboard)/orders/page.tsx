import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ordenes</h1>
        <p className="text-muted-foreground">
          Historial de ordenes procesadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de ordenes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Tabla con filtros por fecha y estado — Sprint 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
