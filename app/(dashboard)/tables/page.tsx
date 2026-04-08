"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import { Plus, Loader2, Pencil, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

interface TableData {
  id: string;
  table_number: number;
  label: string | null;
  status: string;
  is_active: boolean;
  siigo_cost_center_id: string | null;
}

const POLL_INTERVAL = 15_000; // 15 seconds

export default function TablesPage() {
  const { restaurantId } = useSession();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: "", label: "" });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentlyPaid, setRecentlyPaid] = useState<Set<string>>(new Set());

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTable, setEditTable] = useState<TableData | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const prevStatusRef = useRef<Map<string, string>>(new Map());

  const playPaymentSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      // Two-tone chime
      [520, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    if (!restaurantId) return;
    loadTables(restaurantId);

    // Polling
    const interval = setInterval(() => {
      loadTables(restaurantId, true);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [restaurantId]);

  async function loadTables(rid: string, isPolling = false) {
    const res = await fetch(`/api/restaurant/${rid}/tables`);
    if (!res.ok) { setLoading(false); return; }

    const newTables: TableData[] = await res.json();

    // Detect newly paid tables (status changed from OCCUPIED/PAYING → AVAILABLE)
    if (isPolling && prevStatusRef.current.size > 0) {
      const newlyPaid = new Set<string>();
      for (const t of newTables) {
        const prev = prevStatusRef.current.get(t.id);
        if (prev && (prev === "OCCUPIED" || prev === "PAYING") && t.status === "AVAILABLE") {
          const label = t.label || `Mesa ${t.table_number}`;
          toast.success(`${label} pagó y está libre`, { duration: 8000 });
          newlyPaid.add(t.id);
        }
      }
      if (newlyPaid.size > 0) {
        playPaymentSound();
        setRecentlyPaid(newlyPaid);
        setTimeout(() => setRecentlyPaid(new Set()), 10000);
      }
    }

    // Update prev status map
    const map = new Map<string, string>();
    for (const t of newTables) map.set(t.id, t.status);
    prevStatusRef.current = map;

    setTables(newTables);
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

  async function handleEdit() {
    if (!restaurantId || !editTable) return;
    setSaving(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/tables`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: editTable.id,
        label: editLabel,
      }),
    });

    if (res.ok) {
      toast.success("Mesa actualizada");
      setEditOpen(false);
      setEditTable(null);
      loadTables(restaurantId);
    } else {
      const data = await res.json();
      toast.error(data.error || "Error actualizando mesa");
    }
    setSaving(false);
  }

  async function handleDelete(tableId: string) {
    if (!restaurantId) return;
    setDeleting(true);

    const res = await fetch(
      `/api/restaurant/${restaurantId}/tables?tableId=${tableId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      toast.success("Mesa eliminada");
      setDeleteConfirm(null);
      loadTables(restaurantId);
    } else {
      const data = await res.json();
      toast.error(data.error || "Error eliminando mesa");
    }
    setDeleting(false);
  }

  function openEdit(table: TableData) {
    setEditTable(table);
    setEditLabel(table.label || `Mesa ${table.table_number}`);
    setEditOpen(true);
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    AVAILABLE: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Disponible" },
    OCCUPIED: { bg: "bg-amber-50", text: "text-amber-600", label: "Ocupada", pulse: true },
    PAYING: { bg: "bg-blue-50", text: "text-blue-600", label: "Pagando", pulse: true },
  };

  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const payingCount = tables.filter((t) => t.status === "PAYING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Mesas</h1>
          <p className="text-[13px] text-gray-500">
            {tables.length} mesa{tables.length !== 1 ? "s" : ""}
            {occupiedCount > 0 && ` · ${occupiedCount} ocupada${occupiedCount !== 1 ? "s" : ""}`}
            {payingCount > 0 && ` · ${payingCount} pagando`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                : "border-gray-200 text-gray-300"
            }`}
            title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
            <Plus className="h-4 w-4" />
            Agregar mesa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Número de mesa</Label>
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
                  maxLength={100}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[13px] text-gray-500">
              No tienes mesas registradas. Crea tu primera mesa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.AVAILABLE;
            const isConfirmingDelete = deleteConfirm === table.id;

            return (
              <Card key={table.id} className={recentlyPaid.has(table.id) ? "ring-2 ring-emerald-400 ring-offset-2 transition-all" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[14px]">
                      {table.label || `Mesa ${table.table_number}`}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={`${status.bg} ${status.text} border-0 text-[11px] ${status.pulse ? "status-pulse" : ""}`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-[12px] text-gray-400 mb-3">
                    Mesa #{table.table_number}
                    {table.siigo_cost_center_id &&
                      ` · POS: ${table.siigo_cost_center_id}`}
                  </p>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] text-red-500 flex-1">Eliminar?</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[12px]"
                        onClick={() => handleDelete(table.id)}
                        disabled={deleting}
                      >
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[12px]"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(table)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(table.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mesa #{editTable?.table_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Mesa 1 - Terraza"
                maxLength={100}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
