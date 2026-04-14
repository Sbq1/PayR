"use client";

import { useMemo } from "react";
import { useShowcaseStore } from "@/lib/stores/showcase.store";
import type { ShowcaseSession } from "@/lib/services/showcase.service";
import { ShowcaseHero } from "./showcase-hero";
import { BillFeed } from "./bill-feed";
import { UpsellsFeed } from "./upsells-feed";
import { TipSelector } from "./tip-selector";
import { SummaryCard } from "./summary-card";
import { PayButton } from "./pay-button";

interface ShowcaseClientProps {
  session: ShowcaseSession;
}

export function ShowcaseClient({ session }: ShowcaseClientProps) {
  const {
    selectedUpsells,
    tipPercentage,
    customTipAmount,
    toggleUpsell,
    setTip,
    setCustomTip,
  } = useShowcaseStore();

  const upsellTotal = useMemo(() => {
    return session.upsells
      .filter((u) => selectedUpsells.has(u.id))
      .reduce((sum, u) => sum + u.price, 0);
  }, [session.upsells, selectedUpsells]);

  const tipOnSubtotal = useMemo(() => {
    if (customTipAmount !== null) return customTipAmount;
    return Math.round((session.subtotal * tipPercentage) / 100);
  }, [session.subtotal, tipPercentage, customTipAmount]);

  const total = session.subtotal + upsellTotal + tipOnSubtotal;

  // El backend suma (tip + upsells) como tipAmount único.
  // El flow existente ya acepta este patrón (/[slug]/[tableId]/pay hace lo mismo).
  const tipAmountForBackend = tipOnSubtotal + upsellTotal;

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#fef3e2" }}>
      <ShowcaseHero
        restaurantName={session.restaurant.name}
        tableLabel={session.restaurant.tableLabel}
      />

      <div className="flex-1 pb-2">
        <BillFeed items={session.items} />
        <UpsellsFeed
          upsells={session.upsells}
          selectedIds={selectedUpsells}
          onToggle={toggleUpsell}
        />
        <TipSelector
          subtotal={session.subtotal}
          selectedPercentage={tipPercentage}
          customAmount={customTipAmount}
          onSelect={setTip}
          onCustom={setCustomTip}
        />
        <SummaryCard
          subtotal={session.subtotal}
          upsellTotal={upsellTotal}
          tipAmount={tipOnSubtotal}
          total={total}
        />
      </div>

      <PayButton
        orderId={session.orderId}
        slug={session.slug}
        tableId={session.tableId}
        tipPercentage={tipPercentage}
        tipAmountInCents={tipAmountForBackend}
        total={total}
      />
    </div>
  );
}
