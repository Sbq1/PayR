import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion de Pagos</h1>
        <p className="text-muted-foreground">Conecta tu cuenta Wompi</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Llaves Wompi</CardTitle>
          <CardDescription>
            Ingresa tus llaves de Wompi para recibir pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Formulario de llaves + URL de webhook — Sprint 4
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
