"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function PendingAlertBanner() {
  const { restaurantId } = useSession();
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    const controller = new AbortController();

    fetch(`/api/restaurant/${restaurantId}/payments/stuck-count`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    return () => controller.abort();
  }, [restaurantId]);

  if (!loaded || count === 0) return null;

  const label = count === 1 ? "pago" : "pagos";
  const verb = count === 1 ? "pendiente" : "pendientes";

  return (
    <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-amber-900">
            {count} {label} en revisión
          </p>
          <p className="text-[13px] text-amber-800/80">
            {verb} hace más de 10 minutos — revisar para evitar reclamos.
          </p>
        </div>
      </div>
      <Link
        href="/payments?status=PENDING&stuck=1"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-900 hover:text-amber-950 hover:underline flex-shrink-0"
      >
        Ver detalles
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
