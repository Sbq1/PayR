"use client";

import { useParams } from "next/navigation";
import { useBill } from "@/hooks/use-bill";
import { useBillStore } from "@/lib/stores/bill.store";
import { formatCOP } from "@/lib/utils/currency";
import { ThemeProvider } from "@/components/restaurant/theme-provider";
import { RestaurantHeader } from "@/components/restaurant/restaurant-header";
import { BillItemRow } from "@/components/bill/bill-item-row";
import { BillSummary } from "@/components/bill/bill-summary";
import { BillSkeleton } from "@/components/bill/bill-skeleton";
import { TipSelector } from "@/components/payment/tip-selector";
import { UpsellCarousel } from "@/components/upsell/upsell-carousel";
import { Receipt, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BillPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const { isLoading, error } = useBill(params.slug, params.tableId);
  const {
    data, tipPercentage, tipAmount, selectedUpsells,
    setTip, toggleUpsell, getTotal, getUpsellTotal,
  } = useBillStore();

  if (isLoading) return <BillSkeleton />;

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No pudimos cargar tu cuenta</h2>
        <p className="text-sm text-gray-500 mb-6">{error || "Cuenta no encontrada"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { restaurant, table, bill, upsellProducts } = data;
  const grandTotal = getTotal();
  const upsellTotal = getUpsellTotal();

  return (
    <ThemeProvider
      primaryColor={restaurant.primaryColor}
      secondaryColor={restaurant.secondaryColor}
      backgroundColor={restaurant.backgroundColor}
    >
      <div className="flex-1 flex flex-col">
        <RestaurantHeader
          name={restaurant.name}
          logoUrl={restaurant.logoUrl}
          tableLabel={table.label}
          tableNumber={table.tableNumber}
        />

        <div className="px-4 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">
            <Receipt className="w-3 h-3" />
            {bill.invoiceName || "Cuenta abierta"}
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 shadow-sm">
            {bill.items.map((item, i) => (
              <div
                key={item.productId || i}
                className="card-appear"
                style={{ "--delay": `${i * 0.06}s` } as React.CSSProperties}
              >
                <BillItemRow
                  name={item.name}
                  quantity={item.quantity}
                  unitPrice={item.unitPrice}
                  totalPrice={item.totalPrice}
                />
              </div>
            ))}
            <div className="card-appear shimmer" style={{ "--delay": `${bill.items.length * 0.06 + 0.1}s` } as React.CSSProperties}>
              <BillSummary
                subtotal={bill.subtotal}
                tax={bill.totalTax}
                tip={tipAmount + upsellTotal}
                total={grandTotal}
                tipPercentage={tipPercentage || null}
              />
            </div>
          </div>
        </div>

        {upsellProducts.length > 0 && (
          <div className="mt-5">
            <UpsellCarousel
              products={upsellProducts}
              selectedIds={selectedUpsells}
              onToggle={toggleUpsell}
            />
          </div>
        )}

        <div className="px-4 mt-5">
          <TipSelector subtotal={bill.subtotal} onTipChange={setTip} />
        </div>

        <div className="p-4 mt-4 pb-8">
          <Link href={`/${params.slug}/${params.tableId}/pay`}>
            <button
              className="glow-btn w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-lg"
              style={{
                backgroundColor: "var(--r-primary)",
                boxShadow: "0 8px 24px var(--r-primary)33",
              }}
            >
              Pagar {formatCOP(grandTotal)}
            </button>
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
}
