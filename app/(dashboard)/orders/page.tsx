"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { formatCOP } from "@/lib/utils/currency";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_upsell: boolean;
}

interface OrderPayment {
  status: string;
  payment_method_type: string | null;
  amount_in_cents: number;
  paid_at: string | null;
}

interface OrderData {
  id: string;
  table_id: string;
  subtotal: number;
  tax: number;
  tip_amount: number;
  tip_percentage: number | null;
  total: number;
  customer_count: number;
  status: string;
  created_at: string;
  tables: { table_number: number; label: string | null };
  order_items: OrderItem[];
  payments: OrderPayment[];
}

interface OrdersResponse {
  orders: OrderData[];
  total: number;
  page: number;
  totalPages: number;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", label: "Pendiente" },
  PAYING: { bg: "bg-blue-50", text: "text-blue-600", label: "Pagando" },
  PAID: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Pagada" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-500", label: "Cancelada" },
};

const periodFilters = [
  { label: "Hoy", value: "today" },
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Todo", value: "all" },
];

function getDateRange(period: string): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { from: to, to };
    case "week": {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
      return { from: start.toISOString().split("T")[0], to };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split("T")[0], to };
    }
    default:
      return {};
  }
}

export default function OrdersPage() {
  const { restaurantId } = useSession();
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<OrderData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const range = getDateRange(periodFilter);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    params.set("page", String(page));

    const res = await fetch(
      `/api/restaurant/${restaurantId}/orders?${params.toString()}`
    );
    if (res.ok) {
      setData(await res.json());
    } else {
      toast.error("Error cargando órdenes");
    }
    setLoading(false);
  }, [restaurantId, statusFilter, periodFilter, page]);

  useEffect(() => {
    if (!restaurantId) return;
    // loadOrders is async — setState inside runs after await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [restaurantId, loadOrders]);

  async function handleCancel(orderId: string) {
    if (!restaurantId) return;
    setCancelling(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "CANCELLED" }),
    });

    if (res.ok) {
      toast.success("Orden cancelada");
      setDetailOrder(null);
      loadOrders();
    } else {
      const err = await res.json();
      toast.error(err.error || "Error cancelando orden");
    }
    setCancelling(false);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Ordenes</h1>
          <p className="text-[13px] text-gray-500">
            {data ? `${data.total} orden${data.total !== 1 ? "es" : ""}` : "Cargando..."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Period */}
        <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
          {periodFilters.map((p) => (
            <button
              key={p.value}
              onClick={() => { setPeriodFilter(p.value); setPage(1); }}
              className={`px-3 py-1 text-[12px] font-medium rounded-md transition-colors ${
                periodFilter === p.value
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-[12px] font-medium border border-gray-200 rounded-lg bg-white text-gray-700 outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="PAYING">Pagando</option>
          <option value="PAID">Pagada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[13px] text-gray-500">
              No hay órdenes para este período
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Orden</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Mesa</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Items</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-2.5">Total</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-2.5">Propina</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Estado</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Pago</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const st = statusConfig[order.status] || statusConfig.PENDING;
                  const payment = order.payments[0];
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-600">
                        #{order.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {order.tables.label || `Mesa ${order.tables.table_number}`}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCOP(order.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {order.tip_percentage ? `${order.tip_percentage}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={`${st.bg} ${st.text} border-0 text-[11px]`}
                        >
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {payment?.payment_method_type || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <p>
            Página {data.page} de {data.totalPages} ({data.total} órdenes)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              Orden #{detailOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {detailOrder && (
            <div className="space-y-5 pt-2">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <p className="text-gray-400">Mesa</p>
                  <p className="font-medium text-gray-900">
                    {detailOrder.tables.label || `Mesa ${detailOrder.tables.table_number}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Fecha</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(detailOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Estado</p>
                  <Badge
                    variant="secondary"
                    className={`${statusConfig[detailOrder.status]?.bg} ${statusConfig[detailOrder.status]?.text} border-0 text-[11px]`}
                  >
                    {statusConfig[detailOrder.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400">Personas</p>
                  <p className="font-medium text-gray-900">{detailOrder.customer_count}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Items
                </p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {detailOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{item.name}</span>
                        {item.is_upsell && (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-0 text-[10px]">
                            Sugerido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>x{item.quantity}</span>
                        <span className="font-medium text-gray-900 w-24 text-right">
                          {formatCOP(item.total_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCOP(detailOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA</span>
                  <span>{formatCOP(detailOrder.tax)}</span>
                </div>
                {detailOrder.tip_amount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Propina ({detailOrder.tip_percentage}%)</span>
                    <span>{formatCOP(detailOrder.tip_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCOP(detailOrder.total)}</span>
                </div>
              </div>

              {/* Payment info */}
              {detailOrder.payments[0] && (
                <div className="text-[12px] text-gray-400">
                  Pago: {detailOrder.payments[0].payment_method_type || "N/A"} · {formatCOP(detailOrder.payments[0].amount_in_cents)}
                  {detailOrder.payments[0].paid_at && (
                    <> · {formatDate(detailOrder.payments[0].paid_at)}</>
                  )}
                </div>
              )}

              {/* Cancel button — only for PENDING */}
              {detailOrder.status === "PENDING" && (
                <button
                  onClick={() => handleCancel(detailOrder.id)}
                  disabled={cancelling}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-[13px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Cancelar orden
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
