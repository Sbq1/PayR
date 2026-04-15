"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useShowcaseStore } from "@/lib/stores/showcase.store";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reset } = useShowcaseStore();

  const status = searchParams.get("status")?.toUpperCase();
  const reference = searchParams.get("ref");

  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const verify = useCallback(async () => {
    if (!reference) return;
    setVerifying(true);
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
  }, [reference]);

  useEffect(() => {
    if (!reference) return;
    const timer = setTimeout(verify, 1600);
    return () => clearTimeout(timer);
  }, [reference, verify]);

  const display = verifiedStatus || status;

  useEffect(() => {
    if (display === "APPROVED") {
      reset();
    }
  }, [display, reset]);

  const cfg = getStatusConfig(display);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fef3e2" }}>
      {/* Header */}
      <div className="pt-6">
        <ShowcaseHeader />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        {/* Círculo de estado */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="w-28 h-28 rounded-full flex items-center justify-center mb-7"
          style={{
            background: `${cfg.color}14`,
            boxShadow: `0 0 0 10px ${cfg.color}0a`,
          }}
        >
          <cfg.icon
            strokeWidth={1.75}
            style={{ color: cfg.color, width: 56, height: 56 }}
          />
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[38px] font-bold text-[#2d1810] text-center mb-3 leading-tight"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          {cfg.title}
        </motion.h1>

        {/* Mensaje empático */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="text-base text-[#8a7866] text-center max-w-[280px] mb-8 leading-relaxed"
        >
          {cfg.message}
        </motion.p>

        {/* Referencia */}
        {reference && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="px-4 py-2 rounded-full bg-white border border-[#f4e4c8] shadow-sm mb-8"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a7866] font-mono">
              Ref · {reference}
            </p>
          </motion.div>
        )}

        {/* Acciones según estado */}
        {display === "APPROVED" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="flex flex-col items-center gap-3 w-full max-w-xs"
          >
            <div className="flex items-center gap-2 text-xs text-[#8a7866]">
              {verifying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
              <span>
                {verifying ? "Confirmando con el sistema..." : "Confirmado en el sistema"}
              </span>
            </div>

            <Link href="/showcase" className="w-full">
              <motion.button
                whileTap={{ scale: 0.975 }}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #2d1810 0%, #1c0f0a 100%)",
                  boxShadow: "0 8px 24px rgba(45,24,16,0.22)",
                }}
              >
                Volver al menú
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        )}

        {(display === "DECLINED" || display === "ERROR" || display === "VOIDED") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="flex flex-col gap-2.5 w-full max-w-xs"
          >
            <motion.button
              whileTap={{ scale: 0.975 }}
              onClick={() => router.back()}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #c8102e 0%, #a50d26 100%)",
                boxShadow: "0 8px 24px rgba(200,16,46,0.28)",
              }}
            >
              Intentar de nuevo
            </motion.button>
            <Link href="/showcase">
              <button className="w-full py-3 text-sm text-[#8a7866] hover:text-[#2d1810] transition-colors">
                Volver al menú
              </button>
            </Link>
          </motion.div>
        )}

        {display === "PENDING" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="flex flex-col gap-2 w-full max-w-xs"
          >
            <motion.button
              whileTap={{ scale: 0.975 }}
              onClick={verify}
              disabled={verifying}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #2d1810 0%, #1c0f0a 100%)",
                boxShadow: "0 8px 24px rgba(45,24,16,0.22)",
              }}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar estado"
              )}
            </motion.button>
          </motion.div>
        )}

        {!["APPROVED", "DECLINED", "ERROR", "VOIDED", "PENDING"].includes(display || "") && (
          <Link href="/showcase">
            <button className="py-3 px-6 rounded-2xl bg-white text-[#2d1810] font-bold text-sm border border-[#f4e4c8] shadow-sm">
              Volver al menú
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
        <div className="min-h-screen flex items-center justify-center">
          <Clock className="w-6 h-6 text-[#c8102e] animate-pulse" />
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
        title: "¡Pago recibido!",
        message: "Tu pedido está confirmado. Gracias por probar Crepes & Waffles Showcase.",
        color: "#16a34a",
      };
    case "DECLINED":
      return {
        icon: XCircle,
        title: "Pago rechazado",
        message: "Tu banco no aprobó la transacción. Probá otra tarjeta.",
        color: "#c8102e",
      };
    case "PENDING":
      return {
        icon: Clock,
        title: "Pago en proceso",
        message: "Estamos esperando la confirmación del banco. Esto puede tardar unos segundos.",
        color: "#d4a574",
      };
    case "ERROR":
      return {
        icon: XCircle,
        title: "Algo salió mal",
        message: "Hubo un error procesando tu pago. Volvé a intentarlo.",
        color: "#c8102e",
      };
    case "VOIDED":
      return {
        icon: XCircle,
        title: "Pago anulado",
        message: "La transacción fue anulada. Podés reintentar cuando quieras.",
        color: "#c8102e",
      };
    default:
      return {
        icon: Clock,
        title: "Verificando tu pago...",
        message: "Estamos confirmando el estado de la transacción.",
        color: "#2d1810",
      };
  }
}
