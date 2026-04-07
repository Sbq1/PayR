"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TableData {
  id: string;
  table_number: number;
  label: string | null;
  status: string;
  is_active: boolean;
  siigo_cost_center_id: string | null;
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({ tableNumber: "", label: "" });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.restaurantId) {
          setRestaurantId(s.restaurantId);
          loadTables(s.restaurantId);
        } else {
          setLoading(false);
        }
      });
  }, []);

  async function loadTables(rid: string) {
    const res = await fetch(`/api/restaurant/${rid}/tables`);
    if (res.ok) setTables(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    if (!restaurantId || !newTable.tableNumber) return;
    setCreating(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: Number(newTable.tableNumber),
        label: newTable.label || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Mesa creada");
      setNewTable({ tableNumber: "", label: "" });
      setOpen(false);
      loadTables(restaurantId);
    } else {
      const data = await res.json();
      toast.error(data.error || "Error creando mesa");
    }
    setCreating(false);
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-500/10 text-green-500",
    OCCUPIED: "bg-amber-500/10 text-amber-500",
    PAYING: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            {tables.length} mesa{tables.length !== 1 ? "s" : ""} registrada{tables.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Agregar mesa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Numero de mesa</Label>
                <Input
                  type="number"
                  min={1}
                  value={newTable.tableNumber}
                  onChange={(e) =>
                    setNewTable((p) => ({ ...p, tableNumber: e.target.value }))
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Etiqueta (opcional)</Label>
                <Input
                  value={newTable.label}
                  onChange={(e) =>
                    setNewTable((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Mesa 1 - Terraza"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating || !newTable.tableNumber}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crear mesa"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes mesas registradas. Crea tu primera mesa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {table.label || `Mesa ${table.table_number}`}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={statusColors[table.status] || ""}
                  >
                    {table.status === "AVAILABLE"
                      ? "Disponible"
                      : table.status === "OCCUPIED"
                        ? "Ocupada"
                        : "Pagando"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Mesa #{table.table_number}
                  {table.siigo_cost_center_id &&
                    ` | POS: ${table.siigo_cost_center_id}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
