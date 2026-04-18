"use client";

import { useEffect, useRef } from "react";
import { useBillStore } from "@/lib/stores/bill.store";
import { clearCustomerSession } from "@/hooks/use-customer-session";

/**
 * Carga la cuenta desde /api/bill con Bearer del token de sesión del
 * comensal. No dispara fetch hasta que `token` esté disponible; así la
 * page puede gatear la carga con useCustomerSession sin fetches previos.
 *
 * Si la API devuelve 401 (sesión expirada/revocada), limpia sessionStorage
 * para que el siguiente escaneo del QR genere una sesión fresca.
 */
export function useBill(slug: string, tableId: string, token: string | null) {
  const store = useBillStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    store.reset();

    if (!token) {
      // Sin token, no hay fetch. El loading del bill.store arranca en true
      // (para casos legacy); lo bajamos para que la page decida desde el
      // hook de sesión si muestra skeleton, error o nada.
      store.setLoading(false);
      return;
    }

    const abortCtrl = new AbortController();
    abortRef.current = abortCtrl;

    async function fetchBill() {
      store.setLoading(true);
      try {
        const res = await fetch(
          `/api/bill?slug=${encodeURIComponent(slug)}&tableId=${encodeURIComponent(tableId)}`,
          {
            signal: abortCtrl.signal,
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 401) {
          clearCustomerSession(tableId);
          store.setError("Tu sesión expiró. Vuelve a escanear el QR.");
          return;
        }

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
  }, [slug, tableId, token]);

  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
  };
}
