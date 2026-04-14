import { create } from "zustand";

interface ShowcaseState {
  selectedUpsells: Set<string>;
  tipPercentage: number;
  customTipAmount: number | null;

  toggleUpsell: (productId: string) => void;
  setTip: (percentage: number) => void;
  setCustomTip: (amountInCents: number) => void;
  reset: () => void;
}

const initialState = {
  selectedUpsells: new Set<string>(),
  tipPercentage: 10,
  customTipAmount: null as number | null,
};

export const useShowcaseStore = create<ShowcaseState>((set) => ({
  ...initialState,

  toggleUpsell: (productId) =>
    set((state) => {
      const next = new Set(state.selectedUpsells);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return { selectedUpsells: next };
    }),

  setTip: (percentage) => set({ tipPercentage: percentage, customTipAmount: null }),

  setCustomTip: (amountInCents) =>
    set({ customTipAmount: amountInCents, tipPercentage: 0 }),

  reset: () =>
    set({
      selectedUpsells: new Set<string>(),
      tipPercentage: 10,
      customTipAmount: null,
    }),
}));
