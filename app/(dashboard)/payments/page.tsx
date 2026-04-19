"use client";

// TODO v2: search por referencia, date range, export CSV,
// rotación QR y refund history.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Loader2, Receipt, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { formatCOP } from "@/lib/utils/currency";
import { RefundModal, type RefundablePayment } from "./_components/refund-modal";

interface PaymentRow {
  id: string;
  reference: string;
  status: string;
  amount_in_cents: number;
  refunded_amount: number;
  payment_method_type: string | null;
  tip_amount: number;
  dian_doc_type: string | null;
  order_id: string;
  order_status: string;
  table_label: string;
  created_at: string;
  paid_at: string | null;
}

interface PaymentsResponse {
  payments: PaymentRow[];
  nextCursor: string | null;
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "APPROVED", label: "Aprobado" },
  { value: "PENDING", label: "Pendiente" },
  { value: "DECLINED", label: "Rechazado" },
  { value: "VOIDED", label: "Anulado" },
  { value: "ERROR", label: "Error" },
  { value: "REFUNDED", label: "Devuelto" },
  { value: "PARTIALLY_REFUNDED", label: "Devuelto parcial" },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-800", label: "Pendiente" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Aprobado" },
  DECLINED: { bg: "bg-red-50", text: "text-red-800", label: "Rechazado" },
  VOIDED: { bg: "bg-stone-100", text: "text-stone-700", label: "Anulado" },
  ERROR: { bg: "bg-red-50", text: "text-red-800", label: "Error" },
  REFUNDED: { bg: "bg-slate-50", text: "text-slate-700", label: "Devuelto" },
  PARTIALLY_REFUNDED: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    label: "Devuelto parcial",
  },
};

const STUCK_THRESHOLD_MS = 10 * 60 * 1000;

function isStuck(p: PaymentRow): boolean {
  if (p.status !== "PENDING") return false;
  return Date.now() - new Date(p.created_at).getTime() > STUCK_THRESHOLD_MS;
}

function isRefundable(p: PaymentRow): boolean {
  if (p.status !== "APPROVED" && p.status !== "PARTIALLY_REFUNDED") return false;
  return p.refunded_amount < p.amount_in_cents;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentsPage() {
  const { restaurantId } = useSession();

  const [statusFilter, setStatusFilter] = useState("");
  const [stuckOnly, setStuckOnly] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refundTarget, setRefundTarget] = useState<RefundablePayment | null>(null);

  // Rol granular: hoy un user = un restaurant por owner_id y el endpoint
  // /api/payment/refund ya valida ownership. Cuando exista User.role,
  // filtrar por OWNER | MANAGER acá.
  // TODO: gate por session.user.role cuando el schema lo soporte.
  const canRefund = true;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    const stuck = params.get("stuck");
    if (s) setStatusFilter(s);
    if (stuck === "1" || stuck === "true") setStuckOnly(true);
  }, []);

  const loadPayments = useCallback(
    async (cursor: string | null) => {
      if (!restaurantId) return;
      const isInitial = cursor === null;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (stuckOnly) params.set("stuck_only", "1");
      else if (statusFilter) params.set("status", statusFilter);
      if (cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(
          `/api/restaurant/${restaurantId}/payments?${params.toString()}`,
        );
        if (res.status === 429) {
          toast.error("Demasiadas solicitudes — esperá un momento");
          return;
        }
        if (!res.ok) {
          toast.error("Error cargando pagos");
          return;
        }
        const data: PaymentsResponse = await res.json();
        setPayments((prev) =>
          isInitial ? data.payments : [...prev, ...data.payments],
        );
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Error de red");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [restaurantId, statusFilter, stuckOnly],
  );

  useEffect(() => {
    if (!restaurantId) return;
    loadPayments(null);
  }, [restaurantId, loadPayments]);

  function toggleStuck() {
    setStuckOnly((prev) => {
      const next = !prev;
      if (next) setStatusFilter("PENDING");
      return next;
    });
  }

  function openRefund(p: PaymentRow) {
    setRefundTarget({
      id: p.id,
      reference: p.reference,
      amount_in_cents: p.amount_in_cents,
      refunded_amount: p.refunded_amount,
      dian_doc_type: p.dian_doc_type,
      table_label: p.table_label,
    });
  }

  const visiblePayments = useMemo(() => payments, [payments]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#1c1410] font-serif">
          Pagos
        </h1>
        <p className="text-[14px] text-[#78716c] mt-1">
          Historial de transacciones — {visiblePayments.length}
          {nextCursor ? "+" : ""} cargado
          {visiblePayments.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={stuckOnly}
            className="appearance-none pl-4 pr-10 py-2 h-auto text-[13px] font-medium border border-[#e7e5e4] rounded-[10px] bg-white text-[#1c1410] outline-none hover:border-[#d6d3d1] transition-colors focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-1 elev-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={stuckOnly ? "Stuck implica Pendiente" : undefined}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronRight className="w-4 h-4 text-[#78716c] rotate-90" />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleStuck}
          className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border rounded-[10px] transition-all elev-sm ${
            stuckOnly
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-white border-[#e7e5e4] text-[#1c1410] hover:border-[#d6d3d1]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stuckOnly ? "bg-amber-500" : "bg-[#d6d3d1]"
            }`}
          />
          Solo colgados (&gt;10min)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-5 bg-white border border-[#e7e5e4] rounded-[12px] h-20"
            >
              <div className="flex gap-4 items-center w-1/2">
                <div className="w-28 h-4 bg-[#f5f5f4] rounded"></div>
                <div className="w-20 h-4 bg-[#f5f5f4] rounded"></div>
              </div>
              <div className="w-24 h-6 bg-[#f5f5f4] rounded-full"></div>
            </div>
          ))}
        </div>
      ) : visiblePayments.length === 0 ? (
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f4] flex items-center justify-center mb-5">
              <Receipt className="w-8 h-8 text-[#78716c]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[20px] font-serif text-[#1c1410] font-bold mb-1.5">
              No hay pagos para mostrar
            </h3>
            <p className="text-[14px] text-[#78716c]">
              {stuckOnly
                ? "Ningún pago colgado — todo bajo control."
                : "Probá cambiando el filtro de estado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-[#e7e5e4] rounded-[16px] overflow-hidden elev-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#fdfaf6] border-b border-[#e7e5e4]">
                <tr className="text-[11px] font-medium text-[#78716c] uppercase tracking-widest">
                  <th className="text-left px-4 py-3">Referencia</th>
                  <th className="text-left px-4 py-3">Mesa</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Monto</th>
                  <th className="text-right px-4 py-3">Devuelto</th>
                  <th className="text-left px-4 py-3">Creado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((p) => {
                  const st = statusConfig[p.status] || statusConfig.PENDING;
                  const stuck = isStuck(p);
                  const refundable = isRefundable(p);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-[#e7e5e4] last:border-0 transition-colors ${
                        stuck ? "bg-orange-50/60" : "hover:bg-[#fdfaf6]"
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono text-[12px] text-[#1c1410]">
                        {p.reference}
                      </td>
                      <td className="px-4 py-3.5 text-[#1c1410]">
                        {p.table_label}
                      </td>
                      <td className="px-4 py-3.5 text-[#78716c]">
                        {p.payment_method_type || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="secondary"
                          className={`${st.bg} ${st.text} border-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap`}
                        >
                          {st.label}
                        </Badge>
                        {stuck && (
                          <span className="ml-1.5 text-[10px] font-medium text-orange-700">
                            · colgado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#1c1410] tabular-nums">
                        {formatCOP(p.amount_in_cents)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-[#78716c] whitespace-nowrap">
                        {p.refunded_amount > 0 ? (
                          <span>
                            {formatCOP(p.refunded_amount)}
                            <span className="text-[#d6d3d1] ml-1">
                              ({Math.round(
                                (p.refunded_amount / p.amount_in_cents) * 100,
                              )}
                              %)
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#78716c] whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {refundable && canRefund ? (
                          <button
                            onClick={() => openRefund(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#c2410c] border border-[#c2410c]/20 hover:border-[#c2410c]/40 hover:bg-[#c2410c]/5 rounded-[8px] transition-all"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Devolver
                          </button>
                        ) : (
                          <span className="text-[#d6d3d1]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="px-4 py-3 bg-[#fdfaf6] border-t border-[#e7e5e4] flex items-center justify-center">
              <button
                onClick={() => loadPayments(nextCursor)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#1c1410] hover:text-[#c2410c] disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Cargar más
              </button>
            </div>
          )}
        </div>
      )}

      <RefundModal
        payment={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          loadPayments(null);
        }}
      />
    </div>
  );
}
