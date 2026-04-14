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
          "linear-gradient(to top, #fef3e2 65%, rgba(254,243,226,0) 100%)",
      }}
    >
      <div className="px-5 pt-6 pb-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-100"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={disabled}
          onClick={handlePay}
          className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(200,16,46,0.3)] transition-all disabled:opacity-70"
          style={{
            background: disabled ? "#e7a9b2" : "#c8102e",
          }}
        >
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
              Pagar {formatCOP(total)}
            </>
          )}
        </motion.button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-[#8a7866]">
          <ShieldCheck className="w-3 h-3" />
          <span>Pago seguro · Wompi sandbox</span>
        </div>
      </div>
    </div>
  );
}
