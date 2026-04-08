import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function UpsellsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Productos sugeridos</h1>
          <p className="text-muted-foreground">
            Configura los productos para cross-selling
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos activos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Grid de productos con imagen, precio y toggle — Sprint 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
