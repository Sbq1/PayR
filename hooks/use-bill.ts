"use client";

import { useEffect } from "react";
import { useBillStore } from "@/lib/stores/bill.store";

/**
 * Hook que carga la cuenta desde la API y la guarda en el store.
 */
export function useBill(slug: string, tableId: string) {
  const { data, isLoading, error, setData, setLoading, setError } =
    useBillStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchBill() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/bill?slug=${encodeURIComponent(slug)}&tableId=${encodeURIComponent(tableId)}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(body.error || `Error ${res.status}`);
        }

        const billData = await res.json();
        if (!cancelled) {
          setData(billData);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      }
    }

    fetchBill();
    return () => {
      cancelled = true;
    };
  }, [slug, tableId, setData, setLoading, setError]);

  return { data, isLoading, error };
}
