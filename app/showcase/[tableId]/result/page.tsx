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
      <div className="pt-6">
        <ShowcaseHeader />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: `${cfg.color}18` }}
        >
          <cfg.icon className="w-12 h-12" style={{ color: cfg.color }} strokeWidth={2} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-[#2d1810] text-center mb-3"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          {cfg.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-[#8a7866] text-center max-w-xs mb-8 leading-relaxed"
        >
          {cfg.message}
        </motion.p>

        {reference && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="px-4 py-2 rounded-full bg-white/60 border border-[#f4e4c8] mb-8"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#8a7866] font-mono">
              Ref · {reference}
            </p>
          </motion.div>
        )}

        {display === "APPROVED" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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
              <button className="w-full py-3.5 rounded-2xl bg-[#2d1810] hover:bg-[#1c0f0a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                Volver al menú
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        )}

        {(display === "DECLINED" || display === "ERROR" || display === "VOIDED") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-2 w-full max-w-xs"
          >
            <button
              onClick={() => router.back()}
              className="w-full py-3.5 rounded-2xl bg-[#c8102e] text-white font-bold text-sm"
            >
              Intentar de nuevo
            </button>
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
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-2 w-full max-w-xs"
          >
            <button
              onClick={verify}
              disabled={verifying}
              className="w-full py-3.5 rounded-2xl bg-[#2d1810] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar estado"
              )}
            </button>
          </motion.div>
        )}

        {!["APPROVED", "DECLINED", "ERROR", "VOIDED", "PENDING"].includes(display || "") && (
          <Link href="/showcase">
            <button className="py-3 px-6 rounded-2xl bg-white text-[#2d1810] font-bold text-sm border border-[#f4e4c8]">
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
