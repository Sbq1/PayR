import { create } from "zustand";
import type { BillResponse } from "@/lib/services/bill.service";

interface BillState {
  data: BillResponse | null;
  isLoading: boolean;
  error: string | null;

  // Tip
  tipPercentage: number;
  tipAmount: number;

  // Upsells
  selectedUpsells: Set<string>;

  // Actions
  setData: (data: BillResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTip: (percentage: number, amount: number) => void;
  toggleUpsell: (id: string) => void;
  getTotal: () => number;
  getUpsellTotal: () => number;
  reset: () => void;
}

const initialState = {
  data: null,
  isLoading: true,
  error: null,
  tipPercentage: 0,
  tipAmount: 0,
  selectedUpsells: new Set<string>(),
};

export const useBillStore = create<BillState>((set, get) => ({
  ...initialState,

  setData: (data) => set({ data, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading, error: null }),
  setError: (error) => set({ error, isLoading: false }),

  setTip: (percentage, amount) =>
    set({ tipPercentage: percentage, tipAmount: amount }),

  toggleUpsell: (id) =>
    set((state) => {
      const next = new Set(state.selectedUpsells);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedUpsells: next };
    }),

  getUpsellTotal: () => {
    const { data, selectedUpsells } = get();
    if (!data) return 0;
    return data.upsellProducts
      .filter((p) => selectedUpsells.has(p.id))
      .reduce((sum, p) => sum + p.price, 0);
  },

  getTotal: () => {
    const { data, tipAmount } = get();
    if (!data) return 0;
    return data.bill.total + tipAmount + get().getUpsellTotal();
  },

  reset: () => set({ ...initialState, selectedUpsells: new Set<string>() }),
}));
