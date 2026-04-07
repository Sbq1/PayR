import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PosSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion POS</h1>
        <p className="text-muted-foreground">Conecta tu sistema Siigo</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Credenciales Siigo</CardTitle>
          <CardDescription>
            Ingresa tus credenciales de la API de Siigo para leer comandas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Formulario de credenciales + test de conexion — Sprint 2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
