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
    <div className="rounded-2xl bg-[#fef3e6] px-6 py-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-full bg-[#f6dbb8] flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#b45309]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#1c1410] leading-tight">
            {count} {label} en revisión
          </p>
          <p className="text-[13px] italic text-[#78716c] mt-0.5">
            {verb} hace más de 10 minutos — revisar para evitar reclamos.
          </p>
        </div>
      </div>
      <Link
        href="/payments?status=PENDING&stuck=1"
        className="group inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b45309] hover:text-[#9a2a02] flex-shrink-0"
      >
        Ver detalles
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
