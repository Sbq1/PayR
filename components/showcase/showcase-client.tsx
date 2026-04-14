"use client";

import { useMemo, useSyncExternalStore } from "react";
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

const EMPTY_SUBSCRIBE = () => () => {};
const GET_TRUE = () => true;
const GET_FALSE = () => false;

export function ShowcaseClient({ session }: ShowcaseClientProps) {
  const mounted = useSyncExternalStore(EMPTY_SUBSCRIBE, GET_TRUE, GET_FALSE);

  const {
    selectedUpsells,
    tipPercentage,
    customTipAmount,
    toggleUpsell,
    setTip,
    setCustomTip,
  } = useShowcaseStore();

  const selectedSet = useMemo(
    () => new Set(selectedUpsells),
    [selectedUpsells]
  );

  const upsellTotal = useMemo(() => {
    return session.upsells
      .filter((u) => selectedSet.has(u.id))
      .reduce((sum, u) => sum + u.price, 0);
  }, [session.upsells, selectedSet]);

  const tipOnSubtotal = useMemo(() => {
    if (customTipAmount !== null) return customTipAmount;
    return Math.round((session.subtotal * tipPercentage) / 100);
  }, [session.subtotal, tipPercentage, customTipAmount]);

  const total = session.subtotal + upsellTotal + tipOnSubtotal;

  const tipAmountForBackend = tipOnSubtotal + upsellTotal;

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fef3e2" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="text-4xl"
            style={{
              fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
              color: "#c8102e",
            }}
          >
            crepes & waffles
          </div>
          <div className="w-10 h-1 rounded-full bg-[#d4a574] animate-pulse" />
        </div>
      </div>
    );
  }

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
          selectedIds={selectedSet}
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
