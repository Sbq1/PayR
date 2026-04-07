"use client";

import { useSearchParams, useParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ResultContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ slug: string; tableId: string }>();

  const status = searchParams.get("status")?.toUpperCase();
  const reference = searchParams.get("ref");

  const config = getStatusConfig(status);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <config.icon className="w-10 h-10" style={{ color: config.color }} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
      <p className="text-sm text-gray-500 mb-2">{config.message}</p>

      {reference && (
        <p className="text-xs text-gray-400 font-mono mt-2">
          Ref: {reference}
        </p>
      )}

      <div className="mt-8 space-y-3 w-full max-w-xs">
        {status === "APPROVED" && (
          <p className="text-xs text-gray-500">
            Tu mesa se cerrara automaticamente en el sistema del restaurante.
          </p>
        )}

        {status === "DECLINED" && (
          <Link href={`/${params.slug}/${params.tableId}`}>
            <button className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
              Intentar de nuevo
            </button>
          </Link>
        )}

        {status === "PENDING" && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
          >
            Verificar estado
          </button>
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
          <Clock className="w-8 h-8 text-zinc-500 animate-pulse" />
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
          "Tu pago no pudo ser procesado. Intenta con otro metodo de pago.",
        color: "#ef4444",
      };
    case "PENDING":
      return {
        icon: Clock,
        title: "Pago pendiente",
        message:
          "Tu pago esta siendo procesado. Te notificaremos cuando se confirme.",
        color: "#f59e0b",
      };
    default:
      return {
        icon: Clock,
        title: "Verificando pago...",
        message: "Estamos verificando el estado de tu transaccion.",
        color: "#6366f1",
      };
  }
}
