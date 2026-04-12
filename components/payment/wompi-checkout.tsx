"use client";

import { useEffect, useRef, useState } from "react";
import type { WompiWidgetConfig } from "@/lib/adapters/payment/types";
import { Loader2 } from "lucide-react";

interface WompiCheckoutProps {
  config: WompiWidgetConfig;
  onClose?: () => void;
}

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => {
      open: (callback: (result: { transaction?: { status: string } }) => void) => void;
    };
  }
}

export function WompiCheckout({ config, onClose }: WompiCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Cargar script de Wompi si no existe
    if (scriptLoaded.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const existing = document.querySelector(
      'script[src*="checkout.wompi.co"]'
    );
    if (existing) {
      scriptLoaded.current = true;
      setIsLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      setIsLoading(false);
    };
    script.onerror = () => {
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  function openWidget() {
    if (!window.WidgetCheckout) {
      console.error("Wompi widget not loaded");
      return;
    }

    const checkout = new window.WidgetCheckout({
      currency: config.currency,
      amountInCents: config.amountInCents,
      reference: config.reference,
      publicKey: config.publicKey,
      "signature:integrity": config.signatureIntegrity,
      redirectUrl: config.redirectUrl,
      customerData: config.customerEmail
        ? { email: config.customerEmail }
        : undefined,
    });

    checkout.open((result) => {
      const status = result?.transaction?.status;
      if (status) {
        // Redirigir a resultado (APPROVED, DECLINED, PENDING, etc.)
        window.location.href = `${config.redirectUrl}&status=${status}`;
      } else {
        // Usuario cerró el widget sin completar — permitir reintentar
        onClose?.();
      }
    });
  }

  if (isLoading) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold flex items-center justify-center gap-2"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando pasarela...
      </button>
    );
  }

  return (
    <button
      onClick={openWidget}
      className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg"
      style={{
        backgroundColor: "var(--r-primary)",
        boxShadow: "0 8px 32px var(--r-primary)33",
      }}
    >
      Confirmar pago
    </button>
  );
}
