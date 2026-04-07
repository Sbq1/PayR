"use client";

import { useEffect, useRef } from "react";
import { useBillStore } from "@/lib/stores/bill.store";

/**
 * Hook que carga la cuenta desde la API y la guarda en el store.
 * Limpia el store al cambiar de mesa y aborta fetch en unmount.
 */
export function useBill(slug: string, tableId: string) {
  const store = useBillStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Limpiar store al cambiar de mesa para evitar datos stale
    store.reset();

    const abortCtrl = new AbortController();
    abortRef.current = abortCtrl;

    async function fetchBill() {
      store.setLoading(true);
      try {
        const res = await fetch(
          `/api/bill?slug=${encodeURIComponent(slug)}&tableId=${encodeURIComponent(tableId)}`,
          { signal: abortCtrl.signal }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(body.error || `Error ${res.status}`);
        }

        const billData = await res.json();
        if (!abortCtrl.signal.aborted) {
          store.setData(billData);
        }
      } catch (err) {
        if (abortCtrl.signal.aborted) return;
        store.setError((err as Error).message);
      }
    }

    fetchBill();

    return () => {
      abortCtrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tableId]);

  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
  };
}
