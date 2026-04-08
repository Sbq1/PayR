"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/utils/currency";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import type { WompiWidgetConfig } from "@/lib/adapters/payment/types";

interface DemoCheckoutProps {
  config: WompiWidgetConfig;
}

type DemoStep = "select" | "processing" | "done";

const PAYMENT_METHODS = [
  { id: "card", label: "Tarjeta", icon: "💳" },
  { id: "nequi", label: "Nequi", icon: "📱" },
  { id: "pse", label: "PSE", icon: "🏦" },
  { id: "bancolombia", label: "Bancolombia", icon: "🟡" },
];

export function DemoCheckout({ config }: DemoCheckoutProps) {
  const [step, setStep] = useState<DemoStep>("select");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  async function handlePay() {
    if (!selectedMethod) return;
    setStep("processing");

    await new Promise((r) => setTimeout(r, 2000));
    setStep("done");

    try {
      await fetch("/api/payment/demo-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: config.reference,
          paymentMethodType: selectedMethod.toUpperCase(),
        }),
      });
    } catch {
      // Ignore errors in demo
    }

    await new Promise((r) => setTimeout(r, 1000));
    window.location.href = `${config.redirectUrl}&status=APPROVED`;
  }

  if (step === "processing") {
    return (
      <div className="text-center py-8 space-y-4 fade-in-up">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[var(--r-primary)] animate-spin" />
        </div>
        <p className="text-sm text-gray-600 font-medium">Procesando tu pago...</p>
        <p className="text-xs text-gray-400">(Simulación demo)</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="scale-in">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
        </div>
        <p className="text-base text-gray-900 font-bold fade-in-up fade-in-up-delay-1">
          Pago aprobado
        </p>
        <p className="text-xs text-gray-500 fade-in-up fade-in-up-delay-2">
          Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in-up">
      {/* Amount card */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
          Modo demo
        </p>
        <p className="text-lg font-bold text-gray-900 mt-1">
          {formatCOP(config.amountInCents)}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Ref: {config.reference}
        </p>
      </div>

      {/* Payment methods with hover lift */}
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((method, i) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`p-3 rounded-xl border text-sm font-medium card-appear transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
              selectedMethod === method.id
                ? "border-[var(--r-primary)] bg-indigo-50 text-gray-900 scale-[1.02] shadow-md"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5"
            }`}
            style={{ "--delay": `${i * 0.06}s` } as React.CSSProperties}
          >
            <span className="text-lg block mb-1">{method.icon}</span>
            {method.label}
          </button>
        ))}
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={!selectedMethod}
        className="glow-btn w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        style={{
          backgroundColor: "var(--r-primary)",
          boxShadow: selectedMethod
            ? "0 8px 24px var(--r-primary)33"
            : "none",
        }}
      >
        Simular pago
      </button>
    </div>
  );
}
