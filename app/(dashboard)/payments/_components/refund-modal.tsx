"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/lib/utils/currency";

export interface RefundablePayment {
  id: string;
  reference: string;
  amount_in_cents: number;
  refunded_amount: number;
  dian_doc_type: string | null;
  table_label: string;
}

interface Props {
  payment: RefundablePayment | null;
  onClose: () => void;
  onSuccess: (update: {
    paymentId: string;
    amountInCentsAdded: number;
  }) => void;
}

export function RefundModal({ payment, onClose, onSuccess }: Props) {
  const maxRefundableCents = payment
    ? payment.amount_in_cents - payment.refunded_amount
    : 0;
  const maxRefundableCop = Math.floor(maxRefundableCents / 100);

  const [amountCop, setAmountCop] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  // UUID generado por apertura. Se mantiene entre submits (doble-click
  // del mismo modal bloqueado por el servidor vía Idempotency-Key).
  const paymentId = payment?.id;
  const idempotencyKey = useMemo(
    () => (paymentId ? crypto.randomUUID() : ""),
    [paymentId],
  );

  function reset() {
    setAmountCop("");
    setReason("");
    setSubmitting(false);
    setAmountError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payment) return;

    const parsed = Number(amountCop);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAmountError("Monto inválido");
      return;
    }
    const amountInCents = Math.round(parsed * 100);
    if (amountInCents > maxRefundableCents) {
      setAmountError(
        `Máximo ${formatCOP(maxRefundableCents)} disponible para devolver`,
      );
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Motivo muy corto (mínimo 5 caracteres)");
      return;
    }

    setSubmitting(true);
    setAmountError(null);

    try {
      const res = await fetch("/api/payment/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          paymentId: payment.id,
          amountInCents,
          reason: reason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Registro de devolución creado");
        reset();
        onSuccess({
          paymentId: payment.id,
          amountInCentsAdded: amountInCents,
        });
        return;
      }

      const code = data?.code as string | undefined;
      if (res.status === 401) {
        toast.error("Sesión expirada, volvé a iniciar sesión");
      } else if (res.status === 403) {
        toast.error("Sin permisos para ejecutar devoluciones");
      } else if (res.status === 404) {
        toast.error("Pago no encontrado");
      } else if (code === "REFUND_EXCEEDS_PAYMENT") {
        setAmountError(data.error || "El monto excede el saldo del pago");
      } else if (code === "IDEMPOTENCY_CONFLICT" || code === "REFUND_DUPLICATE") {
        toast.error("Ya existe una devolución con estos datos");
      } else if (code === "IDEMPOTENCY_IN_FLIGHT") {
        toast.error("Procesando devolución previa, esperá unos segundos");
      } else if (code === "PAYMENT_NOT_REFUNDABLE") {
        toast.error(data.error || "El pago no está en estado refundable");
      } else if (res.status === 429) {
        toast.error("Demasiadas solicitudes — esperá un momento");
      } else {
        toast.error(data.error || "No se pudo procesar la devolución");
      }
    } catch {
      toast.error("Error de red — revisá tu conexión");
    } finally {
      setSubmitting(false);
    }
  }

  const isEInvoice = payment?.dian_doc_type === "E_INVOICE";

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg bg-white border-[#e7e5e4] p-0 overflow-hidden rounded-[20px]">
        <DialogTitle className="sr-only">
          Devolver pago {payment?.reference}
        </DialogTitle>
        {payment && (
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-[#e7e5e4]">
              <h2 className="text-[20px] font-serif font-bold text-[#1c1410] mb-1">
                Registrar devolución
              </h2>
              <p className="text-[13px] text-[#78716c] font-mono">
                {payment.reference} · {payment.table_label}
              </p>
            </div>

            <div className="px-6 py-5 overflow-y-auto scrollbar-hide flex-grow space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
                <div className="flex gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <div className="text-[12.5px] leading-relaxed text-amber-900">
                    <p className="font-medium mb-2">
                      Esto crea un <span className="font-bold">registro</span>{" "}
                      de devolución. Para que el dinero vuelva al comensal:
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-amber-900/90">
                      <li>Panel Wompi → Transacciones → buscar por referencia</li>
                      <li>Ejecutá el refund manualmente allí</li>
                      {isEInvoice && (
                        <li>Emití la nota crédito en Siigo (factura electrónica)</li>
                      )}
                      <li>Volvé acá y actualizá el refund con los IDs devueltos</li>
                    </ol>
                    {!isEInvoice && (
                      <p className="mt-2 text-amber-800/80">
                        Documento POS equivalente — no requiere nota crédito.
                      </p>
                    )}
                    <p className="mt-2 text-amber-800/80">
                      Tiempo estimado de devolución al banco: 3-10 días hábiles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="refund-amount"
                  className="block text-[13px] font-medium text-[#1c1410]"
                >
                  Monto a devolver (COP)
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  step="1"
                  min="1"
                  max={maxRefundableCop}
                  value={amountCop}
                  onChange={(e) => {
                    setAmountCop(e.target.value);
                    setAmountError(null);
                  }}
                  placeholder={String(maxRefundableCop)}
                  disabled={submitting}
                  className={`w-full px-3 py-2.5 text-[14px] border rounded-[10px] bg-white text-[#1c1410] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 elev-sm ${
                    amountError
                      ? "border-red-300 focus-visible:ring-red-400"
                      : "border-[#e7e5e4] hover:border-[#d6d3d1] focus-visible:ring-[#c2410c]"
                  }`}
                />
                <div className="flex items-center justify-between text-[12px]">
                  {amountError ? (
                    <span className="text-red-600">{amountError}</span>
                  ) : (
                    <span className="text-[#78716c]">
                      Disponible: {formatCOP(maxRefundableCents)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAmountCop(String(maxRefundableCop));
                      setAmountError(null);
                    }}
                    disabled={submitting}
                    className="text-[#c2410c] font-medium hover:underline"
                  >
                    Usar máximo
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="refund-reason"
                  className="block text-[13px] font-medium text-[#1c1410]"
                >
                  Motivo
                </label>
                <textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  placeholder="Ej: cobro duplicado, pedido no servido, error del sistema"
                  rows={3}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 text-[14px] border border-[#e7e5e4] rounded-[10px] bg-white text-[#1c1410] outline-none transition-colors hover:border-[#d6d3d1] focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-1 elev-sm resize-none"
                />
                <div className="flex items-center justify-between text-[12px] text-[#78716c]">
                  <span>Mínimo 5 caracteres</span>
                  <span>{reason.length}/500</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#fdfaf6] border-t border-[#e7e5e4] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-[13px] font-medium text-[#78716c] hover:text-[#1c1410] rounded-[10px] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !amountCop || reason.trim().length < 5}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#c2410c] hover:bg-[#a8360a] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed elev-sm"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar devolución
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
