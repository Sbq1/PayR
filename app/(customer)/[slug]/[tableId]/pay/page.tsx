"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBillStore } from "@/lib/stores/bill.store";
import { formatCOP } from "@/lib/utils/currency";
import {
  customerAuthHeader,
  clearCustomerSession,
} from "@/hooks/use-customer-session";
import { ThemeProvider } from "@/components/restaurant/theme-provider";
import { RestaurantHeader } from "@/components/restaurant/restaurant-header";
import { BillSummary } from "@/components/bill/bill-summary";
import { WompiCheckout } from "@/components/payment/wompi-checkout";
import { DemoCheckout } from "@/components/payment/demo-checkout";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { WompiWidgetConfig } from "@/lib/adapters/payment/types";
import { CURRENT_TIP_DISCLAIMER_VERSION } from "@/lib/constants/legal-texts";

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
  // Checkbox Ley 2300: obligatorio cuando hay propina. El server rechaza
  // 400 vía superRefine si tipAmount > 0 && !acceptedTipDisclaimer.
  const [acceptedTip, setAcceptedTip] = useState(false);

  // DIAN 5 UVT: documento del adquiriente, obligatorio si fe_regime
  // MANDATORY y total >= 5 UVT. Server rechaza 422 DOCUMENT_REQUIRED_5UVT.
  const [docType, setDocType] = useState<"CC" | "CE" | "NIT" | "PASSPORT">(
    "CC"
  );
  const [docNumber, setDocNumber] = useState("");

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
  const finalTip = tipAmount + upsellTotal;
  const needsDisclaimer = finalTip > 0;

  // Documento obligatorio: MANDATORY + total ≥ 5 UVT. El server es
  // autoritativo — si el cliente bypassa, 422 DOCUMENT_REQUIRED_5UVT.
  const needsDocument =
    restaurant.feRegime === "MANDATORY" && grandTotal >= restaurant.fiveUvtCents;
  const docNumberValid = /^[A-Z0-9-]{4,20}$/i.test(docNumber);
  const docValid = !needsDocument || docNumberValid;

  const canPay = (!needsDisclaimer || acceptedTip) && docValid;

  async function handleCreatePayment() {
    if (isCreating) return; // idem-safe pero barato: evita doble fire del mismo click.
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Bearer JWT del comensal. Sin esto el endpoint responde 401.
          ...customerAuthHeader(params.tableId),
          // Idempotency-Key: una por intento. Si el usuario hace retry,
          // genera una nueva — el backend dedupe por (key, session, endpoint)
          // + hash del body.
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          orderId: data!.orderId,
          slug: params.slug,
          tableId: params.tableId,
          tipPercentage,
          tipAmount: finalTip,
          customerEmail: undefined,
          // Lock optimista: si la orden avanzó mientras el comensal veía
          // el bill, el server devuelve 409 ORDER_VERSION_MISMATCH y el
          // frontend forza recarga.
          expectedVersion: data!.orderVersion,
          // Ley 2300: evidencia por pago. Se persiste en payments.
          acceptedTipDisclaimer: needsDisclaimer ? acceptedTip : false,
          tipDisclaimerTextVersion: CURRENT_TIP_DISCLAIMER_VERSION,
          // DIAN 5 UVT: documento del adquiriente (solo si aplica).
          customerDocument: needsDocument
            ? { type: docType, number: docNumber }
            : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ error: "Error creando pago" }));

        // 401: sesión expiró o fue revocada — limpia cache y devuelve al
        // bill para que el hook dispare /session/start con el qrToken.
        if (res.status === 401) {
          clearCustomerSession(params.tableId);
          router.replace(`/${params.slug}/${params.tableId}`);
          return;
        }
        // 409 ORDER_VERSION_MISMATCH: la orden cambió (mesero agregó
        // ítems, u otra sesión ganó el lock). Re-fetch el bill.
        if (res.status === 409 && body.code === "ORDER_VERSION_MISMATCH") {
          setError("La cuenta cambió. Actualizando...");
          setTimeout(() => {
            router.replace(`/${params.slug}/${params.tableId}`);
          }, 1200);
          return;
        }

        throw new Error(body.error || "Error creando pago");
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

          {/* Disclaimer Ley 2300/2023 — obligatorio si hay propina */}
          {needsDisclaimer && (
            <label
              htmlFor="tip-disclaimer"
              className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3 cursor-pointer select-none"
            >
              <input
                id="tip-disclaimer"
                type="checkbox"
                checked={acceptedTip}
                onChange={(e) => setAcceptedTip(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 flex-shrink-0"
                style={{ accentColor: "var(--r-primary, #6366f1)" }}
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Confirmo que la propina de{" "}
                <strong className="text-gray-900">{formatCOP(finalTip)}</strong>{" "}
                es <strong>voluntaria</strong> y la agrego libremente (Ley 2300
                de 2023).
              </span>
            </label>
          )}

          {/* DIAN 5 UVT — documento del adquiriente (solo MANDATORY + ≥5 UVT) */}
          {needsDocument && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Documento para factura electrónica
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Este pago supera el umbral DIAN de 5 UVT. Por ley requerimos
                  tu documento para emitir la factura.
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={docType}
                  onChange={(e) =>
                    setDocType(
                      e.target.value as "CC" | "CE" | "NIT" | "PASSPORT"
                    )
                  }
                  className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="NIT">NIT</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) =>
                    setDocNumber(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))
                  }
                  placeholder="Número"
                  maxLength={20}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  autoComplete="off"
                  inputMode="text"
                />
              </div>
              {docNumber.length > 0 && !docNumberValid && (
                <p className="text-[11px] text-red-500">
                  Debe tener 4-20 caracteres alfanuméricos
                </p>
              )}
            </div>
          )}

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
            <>
              <button
                onClick={handleCreatePayment}
                disabled={isCreating || !canPay}
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
              {needsDisclaimer && !acceptedTip && (
                <p className="mt-2 text-[11px] text-center text-gray-400">
                  Marca la casilla para confirmar la propina voluntaria
                </p>
              )}
              {needsDocument && !docNumberValid && (
                <p className="mt-2 text-[11px] text-center text-gray-400">
                  Completá tu documento para factura DIAN
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
