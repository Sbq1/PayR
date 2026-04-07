import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground">
          Historial de transacciones y pagos recibidos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Tabla con estado, metodo de pago y monto — Sprint 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
