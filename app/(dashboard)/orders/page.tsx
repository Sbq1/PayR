"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  UtensilsCrossed,
} from "lucide-react";
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
  reference?: string;
  status: string;
  payment_method_type: string | null;
  amount_in_cents: number;
  paid_at: string | null;
}

interface CancelledBy {
  id: string;
  name: string | null;
  email: string;
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
  cancelled_at: string | null;
  cancelled_by: CancelledBy | null;
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
  PENDING: { bg: "bg-amber-50", text: "text-amber-800", label: "Pendiente" },
  PAYING: { bg: "bg-blue-50", text: "text-blue-800", label: "Pagando" },
  PAID: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Pagada" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-800", label: "Cancelada" },
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
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const range = getDateRange(periodFilter);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    params.set("page", String(page));
    if (searchDebounced) params.set("q", searchDebounced);

    const res = await fetch(
      `/api/restaurant/${restaurantId}/orders?${params.toString()}`
    );
    if (res.ok) {
      setData(await res.json());
    } else if (res.status === 429) {
      toast.error("Demasiadas solicitudes — espera un momento");
    } else {
      toast.error("Error cargando órdenes");
    }
    setLoading(false);
  }, [restaurantId, statusFilter, periodFilter, page, searchDebounced]);

  useEffect(() => {
    if (!restaurantId) return;
    loadOrders();
  }, [restaurantId, loadOrders]);

  async function handleExport() {
    if (!restaurantId) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const range = getDateRange(periodFilter);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);

      const res = await fetch(
        `/api/restaurant/${restaurantId}/orders/export?${params.toString()}`
      );

      if (!res.ok) {
        if (res.status === 429) toast.error("Demasiadas exportaciones — espera un momento");
        else if (res.status === 400) {
          const err = await res.json().catch(() => ({ error: "Rango inválido" }));
          toast.error(err.error || "Rango inválido");
        } else toast.error("No se pudo exportar");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `ordenes-${new Date().toISOString().slice(0, 10)}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportación lista");
    } catch {
      toast.error("No se pudo exportar");
    } finally {
      setExporting(false);
    }
  }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#1c1410] font-serif">Órdenes</h1>
          <p className="text-[14px] text-[#78716c] mt-1">
            {data ? `${data.total} orden${data.total !== 1 ? "es" : ""} este período` : "Cargando órdenes..."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Pills */}
        <div className="flex items-center gap-1 bg-[#f5f5f4] p-1 rounded-xl">
          {periodFilters.map((p) => {
            const isActive = periodFilter === p.value;
            return (
              <button
                key={p.value}
                onClick={() => { setPeriodFilter(p.value); setPage(1); }}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-[10px] transition-all ${
                  isActive
                    ? "bg-[#c2410c] text-white shadow-sm elev-sm"
                    : "text-[#78716c] hover:text-[#1c1410]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-4 pr-10 py-2 h-auto text-[13px] font-medium border border-[#e7e5e4] rounded-[10px] bg-white text-[#1c1410] outline-none hover:border-[#d6d3d1] transition-colors focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-1 elev-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAYING">Pagando</option>
            <option value="PAID">Pagada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronRight className="w-4 h-4 text-[#78716c] rotate-90" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-grow md:flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716c] pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.slice(0, 80))}
            placeholder="Buscar por mesa, ID..."
            aria-label="Buscar órdenes"
            className="pl-9 pr-8 py-2 w-full md:w-[280px] h-auto text-[13px] border border-[#e7e5e4] rounded-[10px] bg-white text-[#1c1410] outline-none hover:border-[#d6d3d1] transition-colors focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-1 elev-sm placeholder:text-[#78716c]/70"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#1c1410] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border border-[#e7e5e4] rounded-[10px] bg-white text-[#1c1410] hover:text-[#c2410c] hover:border-[#c2410c]/30 hover:bg-[#c2410c]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-1 elev-sm"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          CSV
        </button>
      </div>

      {/* Main List / Table Area */}
      {loading ? (
        <div className="flex flex-col gap-3 py-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-5 bg-white border border-[#e7e5e4] rounded-[12px] h-20">
              <div className="flex gap-4 items-center w-1/2">
                <div className="w-16 h-4 bg-[#f5f5f4] rounded"></div>
                <div className="w-24 h-4 bg-[#f5f5f4] rounded"></div>
                <div className="w-16 h-4 bg-[#f5f5f4] rounded hidden md:block"></div>
              </div>
              <div className="w-20 h-6 bg-[#f5f5f4] rounded-full"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f4] flex items-center justify-center mb-6">
              <UtensilsCrossed className="w-8 h-8 text-[#78716c]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[20px] font-serif text-[#1c1410] font-bold mb-2">
              No hay órdenes para este período
            </h3>
            <p className="text-[14px] text-[#78716c]">
              Intenta cambiando los filtros o ajustando la fecha.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = statusConfig[order.status] || statusConfig.PENDING;
            const payment = order.payments[0];
            return (
              <div
                key={order.id}
                onClick={() => setDetailOrder(order)}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-5 md:py-4 bg-white border border-[#e7e5e4] rounded-[12px] elev-sm card-lift hover:bg-[#fdfaf6] cursor-pointer"
              >
                {/* Left side / Mobile Top */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-5 flex-grow">
                  <div className="flex justify-between items-start md:items-center md:hidden w-full mb-1">
                    <span className="font-serif font-bold text-[18px] text-[#1c1410]">{formatCOP(order.total)}</span>
                    <Badge variant="secondary" className={`${st.bg} ${st.text} border-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium`}>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="text-[13px] flex items-center gap-3 text-[#1c1410]">
                    <span className="font-mono text-[#78716c] uppercase tracking-wider text-[12px]">
                      #{order.id.slice(-6)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#d6d3d1] hidden md:block"></span>
                    <span className="font-medium">{order.tables.label || `Mesa ${order.tables.table_number}`}</span>
                  </div>

                  <span className="w-1 h-1 rounded-full bg-[#d6d3d1] hidden md:block"></span>

                  <div className="text-[13px] text-[#78716c] flex items-center gap-3">
                    <span>{order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}</span>
                    <span className="w-1 h-1 rounded-full bg-[#d6d3d1]"></span>
                    <span>{payment?.payment_method_type || "--"}</span>
                    <span className="w-1 h-1 rounded-full bg-[#d6d3d1]"></span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>

                {/* Right side / Mobile Bottom */}
                <div className="flex items-center justify-between md:justify-end gap-5">
                  <Badge variant="secondary" className={`${st.bg} ${st.text} border-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium hidden md:inline-flex whitespace-nowrap`}>
                    {st.label}
                  </Badge>

                  <div className="text-right hidden md:block">
                    <div className="font-serif font-bold text-[16px] text-[#1c1410]">
                      {formatCOP(order.total)}
                    </div>
                  </div>

                  <div className="text-[#d6d3d1] group-hover:text-[#c2410c] transition-colors md:ml-2">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[#e7e5e4] text-[13px] text-[#78716c]">
          <p>
            Página {data.page} de {data.totalPages} ({data.total} órdenes)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-[#e7e5e4] rounded-[10px] bg-white hover:bg-[#f5f5f4] hover:text-[#1c1410] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-2 border border-[#e7e5e4] rounded-[10px] bg-white hover:bg-[#f5f5f4] hover:text-[#1c1410] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal (Receipt Style) */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg bg-[#fdfaf6] border-[#e7e5e4] p-0 overflow-hidden shadow-2xl rounded-[24px]">
          <DialogTitle className="sr-only">
            Detalle de orden {detailOrder ? `#${detailOrder.id.slice(-8)}` : ""}
          </DialogTitle>
          {detailOrder && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Receipt Header */}
              <div className="bg-white px-6 py-6 border-b border-dashed border-[#d6d3d1] relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-[#c2410c]"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="secondary" className={`${statusConfig[detailOrder.status]?.bg} ${statusConfig[detailOrder.status]?.text} border-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium mb-3`}>
                      {statusConfig[detailOrder.status]?.label}
                    </Badge>
                    <h2 className="text-[22px] font-serif font-bold text-[#1c1410] mb-1">
                      {detailOrder.tables.label || `Mesa ${detailOrder.tables.table_number}`}
                    </h2>
                    <p className="text-[13px] text-[#78716c] font-mono">
                      #{detailOrder.id.slice(-8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-[#1c1410] font-medium mb-1">
                      {formatDate(detailOrder.created_at).split(",")[0]}
                    </p>
                    <p className="text-[13px] text-[#78716c]">
                      {formatDate(detailOrder.created_at).split(",")[1]}
                    </p>
                    <p className="text-[13px] text-[#78716c] mt-2">
                      {detailOrder.customer_count} personas
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Body (Scrollable) */}
              <div className="px-6 py-6 overflow-y-auto scrollbar-hide flex-grow bg-[#fdfaf6]">
                <p className="text-[11px] font-bold text-[#78716c] uppercase tracking-widest mb-4">
                  Detalle del Consumo
                </p>
                <div className="space-y-4">
                  {detailOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between text-[14px]">
                      <div className="pr-4">
                        <p className="text-[#1c1410] font-medium leading-snug">
                          {item.quantity}x {item.name}
                        </p>
                        {item.is_upsell && (
                          <Badge variant="secondary" className="mt-1.5 bg-[#c2410c]/10 text-[#c2410c] border-0 text-[10px] px-2 py-0">
                            Sugerido
                          </Badge>
                        )}
                      </div>
                      <p className="text-[#1c1410] font-medium whitespace-nowrap pt-[1px]">
                        {formatCOP(item.total_price)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="my-6 border-b border-dashed border-[#d6d3d1]"></div>

                {/* Subtotals & Total */}
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between text-[#78716c]">
                    <span>Subtotal</span>
                    <span>{formatCOP(detailOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#78716c]">
                    <span>IVA & Impoconsumo</span>
                    <span>{formatCOP(detailOrder.tax)}</span>
                  </div>
                  {detailOrder.tip_amount > 0 && (
                    <div className="flex justify-between text-[#78716c]">
                      <span>Propina voluntaria ({detailOrder.tip_percentage}%)</span>
                      <span>{formatCOP(detailOrder.tip_amount)}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 pb-2 mt-4 flex justify-between items-end border-t border-[#e7e5e4]">
                    <span className="text-[16px] font-bold text-[#1c1410]">Total</span>
                    <span className="text-[28px] font-serif font-bold text-[#1c1410] leading-none">
                      {formatCOP(detailOrder.total)}
                    </span>
                  </div>
                </div>

                {/* Payment & Audit Info */}
                <div className="mt-8 bg-white rounded-xl p-4 border border-[#e7e5e4] text-[13px]">
                  {detailOrder.payments[0] && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[#78716c]">
                        <span>Método de pago</span>
                        <span className="font-medium text-[#1c1410]">{detailOrder.payments[0].payment_method_type || "N/A"}</span>
                      </div>
                      {detailOrder.payments[0].reference && (
                        <div className="flex justify-between items-center text-[#78716c]">
                          <span>Referencia</span>
                          <span className="font-mono text-[12px]">{detailOrder.payments[0].reference}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detailOrder.status === "CANCELLED" && detailOrder.cancelled_by && (
                    <div className="mt-4 pt-4 border-t border-[#e7e5e4] text-red-700">
                      <p className="font-medium">Cancelada por {detailOrder.cancelled_by.name || detailOrder.cancelled_by.email}</p>
                      {detailOrder.cancelled_at && <p className="text-red-500/80 mt-0.5">{formatDate(detailOrder.cancelled_at)}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Footer Actions */}
              {detailOrder.status === "PENDING" && (
                <div className="p-4 bg-white border-t border-[#e7e5e4]">
                  <button
                    onClick={() => handleCancel(detailOrder.id)}
                    disabled={cancelling}
                    className="flex items-center justify-center gap-2 w-full py-3.5 text-[14px] font-medium text-red-600 border border-red-200 rounded-[12px] bg-red-50/50 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Cancelar esta orden
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
