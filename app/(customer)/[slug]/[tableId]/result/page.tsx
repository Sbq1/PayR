"use client";

import { useSearchParams, useParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  usePaymentPolling,
  isTerminalPaymentStatus,
} from "@/hooks/use-payment-polling";

// Estados de presentación derivados (no los del backend):
//   PROCESSING  — pollingando, aún sin terminal
//   SLOW        — 2min sin terminal → hand-off al cron, mensaje reassurance
//   APPROVED/DECLINED/VOIDED/ERROR — terminales del backend
//   ERROR_FATAL — 404/409 del reconcile (no transitorio)
type DisplayStatus =
  | "PROCESSING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR"
  | "SLOW"
  | "ERROR_FATAL";

function ResultContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ slug: string; tableId: string }>();

  const urlStatus = searchParams.get("status")?.toUpperCase() ?? null;
  const reference = searchParams.get("ref");

  const { status, isPolling, isSlow, timedOut, error } = usePaymentPolling(
    reference,
    params.tableId,
    urlStatus
  );

  const displayStatus = resolveDisplayStatus({
    serverStatus: status,
    urlStatus,
    isPolling,
    timedOut,
    fatalError: error,
  });

  const config = getStatusConfig(displayStatus, isSlow);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 scale-in"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <config.icon
          className={`w-10 h-10 ${config.spin ? "animate-spin" : ""}`}
          style={{ color: config.color }}
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 fade-in-up">
        {config.title}
      </h1>
      <p className="text-sm text-gray-500 mb-2 fade-in-up max-w-sm">
        {config.message}
      </p>

      {error && (
        <p className="text-xs text-red-500 mt-2 fade-in-up">{error}</p>
      )}

      {reference && (
        <p className="text-xs text-gray-400 font-mono mt-2 fade-in-up">
          Ref: {reference}
        </p>
      )}

      <div className="mt-8 space-y-3 w-full max-w-xs fade-in-up">
        {displayStatus === "PROCESSING" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              {isSlow
                ? "Tomando más tiempo de lo normal. Seguimos verificando..."
                : "Confirmando pago con el sistema..."}
            </p>
          </div>
        )}

        {displayStatus === "APPROVED" && (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="w-3 h-3 rounded-full pulse-ring"
                style={{ backgroundColor: config.color }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Tu mesa se cerrará automáticamente en el sistema del restaurante.
            </p>
          </>
        )}

        {(displayStatus === "DECLINED" ||
          displayStatus === "ERROR" ||
          displayStatus === "VOIDED" ||
          displayStatus === "ERROR_FATAL") && (
          <Link href={`/${params.slug}/${params.tableId}`}>
            <button className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
              Intentar de nuevo
            </button>
          </Link>
        )}

        {displayStatus === "SLOW" && (
          <>
            <p className="text-xs text-gray-500">
              Puedes cerrar esta página — el restaurante registrará tu pago
              automáticamente cuando el banco confirme.
            </p>
            <Link href={`/${params.slug}/${params.tableId}`}>
              <button className="w-full py-3 rounded-xl text-gray-400 text-sm font-medium transition-colors hover:text-gray-600">
                Volver a la cuenta
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-400 animate-pulse" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

/**
 * Resolver de prioridades del display.
 *
 * Orden de precedencia:
 *   1. Error fatal del reconcile (404/409) → render error
 *   2. Server ya confirmó terminal → render ese terminal
 *   3. URL trae terminal y no estamos pollingando activamente → usar URL
 *   4. Timeout sin terminal → "SLOW" (hand-off al cron)
 *   5. Default → "PROCESSING"
 *
 * Clave: un `status=APPROVED` del URL NO se downgrade a PROCESSING por un
 * PENDING del server (race con webhook). Y un PENDING tardío no pisa un
 * APPROVED anterior (el hook ya lo garantiza internamente).
 */
function resolveDisplayStatus(args: {
  serverStatus: string | null;
  urlStatus: string | null;
  isPolling: boolean;
  timedOut: boolean;
  fatalError: string | null;
}): DisplayStatus {
  if (args.fatalError) return "ERROR_FATAL";

  if (isTerminalPaymentStatus(args.serverStatus)) {
    return args.serverStatus as DisplayStatus;
  }

  if (isTerminalPaymentStatus(args.urlStatus) && !args.isPolling) {
    return args.urlStatus as DisplayStatus;
  }

  if (args.timedOut) return "SLOW";

  return "PROCESSING";
}

function getStatusConfig(status: DisplayStatus, isSlow: boolean) {
  switch (status) {
    case "APPROVED":
      return {
        icon: CheckCircle,
        title: "Pago exitoso",
        message: "Gracias por tu pago. Tu cuenta ha sido cerrada.",
        color: "#22c55e",
        spin: false,
      };
    case "DECLINED":
      return {
        icon: XCircle,
        title: "Pago rechazado",
        message:
          "Tu pago no pudo ser procesado. Intenta con otro método de pago.",
        color: "#ef4444",
        spin: false,
      };
    case "VOIDED":
      return {
        icon: XCircle,
        title: "Pago anulado",
        message:
          "Tu pago fue anulado. Puedes intentar con otro método de pago.",
        color: "#ef4444",
        spin: false,
      };
    case "ERROR":
    case "ERROR_FATAL":
      return {
        icon: XCircle,
        title: "Error en el pago",
        message: "Hubo un error procesando tu pago. Intenta de nuevo.",
        color: "#ef4444",
        spin: false,
      };
    case "SLOW":
      return {
        icon: Clock,
        title: "Pago en proceso",
        message:
          "El banco se está demorando en confirmar. No cierres por unos minutos, o te notificaremos cuando se confirme.",
        color: "#f59e0b",
        spin: false,
      };
    case "PROCESSING":
    default:
      return {
        icon: Loader2,
        title: isSlow ? "Casi listo..." : "Verificando pago...",
        message: isSlow
          ? "Tu banco se está tomando más tiempo de lo habitual. Sigue en curso."
          : "Estamos confirmando tu transacción con el banco.",
        color: "#6366f1",
        spin: true,
      };
  }
}
