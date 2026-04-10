"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBillStore } from "@/lib/stores/bill.store";
import { formatCOP } from "@/lib/utils/currency";
import { ThemeProvider } from "@/components/restaurant/theme-provider";
import { RestaurantHeader } from "@/components/restaurant/restaurant-header";
import { BillSummary } from "@/components/bill/bill-summary";
import { WompiCheckout } from "@/components/payment/wompi-checkout";
import { DemoCheckout } from "@/components/payment/demo-checkout";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { WompiWidgetConfig } from "@/lib/adapters/payment/types";

export default function PayPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const router = useRouter();
  const { data, tipPercentage, tipAmount, getTotal, getUpsellTotal } =
    useBillStore();

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WompiWidgetConfig | null>(
    null
  );

  // Si no hay data en store, redirigir a la cuenta
  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-500 mb-4">No se encontro la cuenta</p>
        <Link
          href={`/${params.slug}/${params.tableId}`}
          className="text-sm font-medium underline"
          style={{ color: "var(--r-primary, #6366f1)" }}
        >
          Volver a la cuenta
        </Link>
      </div>
    );
  }

  const { restaurant, table, bill } = data;
  const grandTotal = getTotal();
  const upsellTotal = getUpsellTotal();

  async function handleCreatePayment() {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data!.orderId,
          slug: params.slug,
          tableId: params.tableId,
          tipPercentage,
          tipAmount: tipAmount + upsellTotal,
          customerEmail: undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Error creando pago" }));
        throw new Error(body.error);
      }

      const result = await res.json();
      setWidgetConfig(result.widgetConfig);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ThemeProvider
      primaryColor={restaurant.primaryColor}
      secondaryColor={restaurant.secondaryColor}
      backgroundColor={restaurant.backgroundColor}
    >
      <div className="flex-1 flex flex-col">
        {/* Header con boton atras */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href={`/${params.slug}/${params.tableId}`}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Confirmar pago</h1>
        </div>

        <RestaurantHeader
          name={restaurant.name}
          logoUrl={restaurant.logoUrl}
          tableLabel={table.label}
          tableNumber={table.tableNumber}
        />

        {/* Resumen de pago */}
        <div className="flex-1 px-4 mt-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Resumen del pago
            </h2>
            <BillSummary
              subtotal={bill.subtotal}
              tax={bill.totalTax}
              tip={tipAmount + upsellTotal}
              total={grandTotal}
              tipPercentage={tipPercentage || null}
            />
          </div>

          {/* Metodos de pago info */}
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Pago seguro procesado por Wompi. Acepta tarjeta, Nequi, PSE,
              Bancolombia y mas.
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Boton de pago */}
        <div className="p-4 pb-8">
          {widgetConfig ? (
            widgetConfig.publicKey === "pub_test_DEMO" ? (
              <DemoCheckout config={widgetConfig} />
            ) : (
              <WompiCheckout
              config={widgetConfig}
              onClose={() => {
                setError("Pago cancelado. Haz clic en Confirmar pago para intentar de nuevo.");
              }}
            />
            )
          ) : (
            <button
              onClick={handleCreatePayment}
              disabled={isCreating}
              className="glow-btn w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--r-primary)",
                boxShadow: "0 8px 24px var(--r-primary)33",
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparando...
                </>
              ) : (
                `Pagar ${formatCOP(grandTotal)}`
              )}
            </button>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
