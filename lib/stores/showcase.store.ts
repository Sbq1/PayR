import { create } from "zustand";

interface ShowcaseState {
  selectedUpsells: string[];
  tipPercentage: number;
  customTipAmount: number | null;

  toggleUpsell: (productId: string) => void;
  isUpsellSelected: (productId: string) => boolean;
  setTip: (percentage: number) => void;
  setCustomTip: (amountInCents: number) => void;
  reset: () => void;
}

export const useShowcaseStore = create<ShowcaseState>((set, get) => ({
  selectedUpsells: [],
  tipPercentage: 10,
  customTipAmount: null,

  toggleUpsell: (productId) =>
    set((state) => ({
      selectedUpsells: state.selectedUpsells.includes(productId)
        ? state.selectedUpsells.filter((id) => id !== productId)
        : [...state.selectedUpsells, productId],
    })),

  isUpsellSelected: (productId) => get().selectedUpsells.includes(productId),

  setTip: (percentage) => set({ tipPercentage: percentage, customTipAmount: null }),

  setCustomTip: (amountInCents) =>
    set({ customTipAmount: amountInCents, tipPercentage: 0 }),

  reset: () =>
    set({
      selectedUpsells: [],
      tipPercentage: 10,
      customTipAmount: null,
    }),
}));
