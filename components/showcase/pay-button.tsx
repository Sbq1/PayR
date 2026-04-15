"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, AlertCircle, CreditCard } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => {
      open: (
        callback: (result: { transaction?: { status: string } }) => void
      ) => void;
    };
  }
}

interface PayButtonProps {
  orderId: string;
  slug: string;
  tableId: string;
  tipPercentage: number;
  tipAmountInCents: number;
  total: number;
  customerEmail?: string;
}

export function PayButton({
  orderId,
  slug,
  tableId,
  tipPercentage,
  tipAmountInCents,
  total,
  customerEmail,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const scriptAttached = useRef(false);

  useEffect(() => {
    if (scriptAttached.current) return;
    scriptAttached.current = true;

    if (typeof window !== "undefined" && window.WidgetCheckout) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector('script[src*="checkout.wompi.co"]');
    if (existing) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      setError("No pudimos cargar la pasarela. Reintentá en unos segundos.");
    document.head.appendChild(script);
  }, []);

  async function handlePay() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          slug,
          tableId,
          tipPercentage,
          tipAmount: tipAmountInCents,
          customerEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos preparar el pago");

      const cfg = data.widgetConfig;
      if (!window.WidgetCheckout) {
        throw new Error("Pasarela no disponible. Reintentá.");
      }

      const checkout = new window.WidgetCheckout({
        currency: cfg.currency,
        amountInCents: cfg.amountInCents,
        reference: cfg.reference,
        publicKey: cfg.publicKey,
        "signature:integrity": cfg.signatureIntegrity,
        redirectUrl: cfg.redirectUrl,
        customerData: cfg.customerEmail ? { email: cfg.customerEmail } : undefined,
      });

      checkout.open((result) => {
        const status = result?.transaction?.status;
        if (status) {
          window.location.href = `${cfg.redirectUrl}&status=${status}`;
        } else {
          setLoading(false);
          setError("Cerraste la pasarela. Podés volver a intentar.");
        }
      });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const disabled = loading || !scriptReady || total <= 0;

  return (
    <div
      className="sticky bottom-0 inset-x-0 z-20"
      style={{
        background:
          "linear-gradient(to top, #fef3e2 60%, rgba(254,243,226,0) 100%)",
        backdropFilter: "blur(1px)",
        WebkitBackdropFilter: "blur(1px)",
      }}
    >
      <div className="px-5 pt-5 pb-7">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3 flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-100"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.975 }}
          disabled={disabled}
          onClick={handlePay}
          className="relative w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2.5 overflow-hidden transition-opacity disabled:opacity-65"
          style={{
            background: disabled
              ? "linear-gradient(135deg, #e7a9b2 0%, #d48090 100%)"
              : "linear-gradient(135deg, #c8102e 0%, #a50d26 100%)",
            boxShadow: disabled
              ? "none"
              : "0 10px 32px rgba(200,16,46,0.35), 0 2px 8px rgba(200,16,46,0.15)",
          }}
        >
          {/* Pulse ring sutil cuando está listo */}
          {!disabled && !loading && (
            <motion.span
              className="absolute inset-0 rounded-2xl"
              animate={{ opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.18) 0%, transparent 70%)",
              }}
            />
          )}

          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Abriendo pasarela...
            </>
          ) : !scriptReady ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" strokeWidth={2.2} />
              <span>
                Pagar{" "}
                <span
                  className="font-normal"
                  style={{ fontFamily: "var(--font-fraunces), serif" }}
                >
                  {formatCOP(total)}
                </span>
              </span>
            </>
          )}
        </motion.button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[#8a7866]">
          <ShieldCheck className="w-3 h-3" strokeWidth={2} />
          <span>Pago seguro · Wompi sandbox</span>
        </div>
      </div>
    </div>
  );
}
