"use client";

import { useSearchParams, useParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

function ResultContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ slug: string; tableId: string }>();

  const status = searchParams.get("status")?.toUpperCase();
  const reference = searchParams.get("ref");
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // When status is APPROVED, verify with backend to ensure payment is completed
  useEffect(() => {
    if (status !== "APPROVED" || !reference) return;

    setVerifying(true);

    // Small delay to let webhook arrive first
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        if (res.ok) {
          const data = await res.json();
          setVerifiedStatus(data.status);
        }
      } catch {}
      setVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, reference]);

  const displayStatus = verifiedStatus || status;
  const config = getStatusConfig(displayStatus);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 scale-in"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <config.icon className="w-10 h-10" style={{ color: config.color }} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 fade-in-up">
        {config.title}
      </h1>
      <p className="text-sm text-gray-500 mb-2 fade-in-up">
        {config.message}
      </p>

      {reference && (
        <p className="text-xs text-gray-400 font-mono mt-2 fade-in-up">
          Ref: {reference}
        </p>
      )}

      <div className="mt-8 space-y-3 w-full max-w-xs fade-in-up">
        {displayStatus === "APPROVED" && (
          <>
            <div className="flex justify-center mb-4">
              {verifying ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <div
                  className="w-3 h-3 rounded-full pulse-ring"
                  style={{ backgroundColor: config.color }}
                />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {verifying
                ? "Confirmando pago con el sistema..."
                : "Tu mesa se cerrará automáticamente en el sistema del restaurante."}
            </p>
          </>
        )}

        {(displayStatus === "DECLINED" || displayStatus === "ERROR" || displayStatus === "VOIDED") && (
          <Link href={`/${params.slug}/${params.tableId}`}>
            <button className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
              Intentar de nuevo
            </button>
          </Link>
        )}

        {displayStatus === "PENDING" && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
          >
            Verificar estado
          </button>
        )}

        {!["APPROVED", "DECLINED", "ERROR", "VOIDED", "PENDING"].includes(displayStatus || "") && (
          <Link href={`/${params.slug}/${params.tableId}`}>
            <button className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
              Volver a la cuenta
            </button>
          </Link>
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

function getStatusConfig(status: string | null | undefined) {
  switch (status) {
    case "APPROVED":
      return {
        icon: CheckCircle,
        title: "Pago exitoso",
        message: "Gracias por tu pago. Tu cuenta ha sido cerrada.",
        color: "#22c55e",
      };
    case "DECLINED":
      return {
        icon: XCircle,
        title: "Pago rechazado",
        message:
          "Tu pago no pudo ser procesado. Intenta con otro método de pago.",
        color: "#ef4444",
      };
    case "PENDING":
      return {
        icon: Clock,
        title: "Pago pendiente",
        message:
          "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
        color: "#f59e0b",
      };
    case "ERROR":
      return {
        icon: XCircle,
        title: "Error en el pago",
        message:
          "Hubo un error procesando tu pago. Intenta de nuevo.",
        color: "#ef4444",
      };
    case "VOIDED":
      return {
        icon: XCircle,
        title: "Pago anulado",
        message:
          "Tu pago fue anulado. Puedes intentar con otro método de pago.",
        color: "#ef4444",
      };
    default:
      return {
        icon: Clock,
        title: "Verificando pago...",
        message: "Estamos verificando el estado de tu transacción.",
        color: "#6366f1",
      };
  }
}
