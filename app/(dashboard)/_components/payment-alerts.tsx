"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "@/hooks/use-session";
import { Check, X, Bell } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";

interface TableSnapshot {
  id: string;
  table_number: number;
  label: string | null;
  status: string;
}

interface PaymentAlert {
  id: string;
  tableLabel: string;
  timestamp: Date;
}

const POLL_INTERVAL = 10_000; // 10 seconds

export function PaymentAlerts() {
  const { restaurantId } = useSession();
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const initialLoadDone = useRef(false);

  const fetchTables = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/tables`);
      if (!res.ok) return;

      const tables: TableSnapshot[] = await res.json();

      // Detect newly paid tables
      if (initialLoadDone.current && prevStatusRef.current.size > 0) {
        for (const t of tables) {
          const prev = prevStatusRef.current.get(t.id);
          if (prev && (prev === "OCCUPIED" || prev === "PAYING") && t.status === "AVAILABLE") {
            const label = t.label || `Mesa ${t.table_number}`;
            setAlerts((prev) => [
              { id: `${t.id}-${Date.now()}`, tableLabel: label, timestamp: new Date() },
              ...prev,
            ]);
          }
        }
      }

      // Update snapshot
      const map = new Map<string, string>();
      for (const t of tables) map.set(t.id, t.status);
      prevStatusRef.current = map;
      initialLoadDone.current = true;
    } catch {}
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchTables();
    const interval = setInterval(fetchTables, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [restaurantId, fetchTables]);

  function dismiss(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  function dismissAll() {
    setAlerts([]);
  }

  if (alerts.length === 0) return null;

  return (
    <div className="border-b border-emerald-200 bg-emerald-50 px-4 md:px-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white flex-shrink-0">
            <Bell className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto min-w-0">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-2.5 py-1 flex-shrink-0"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-[12px] font-medium text-emerald-800">
                  {alert.tableLabel} pagó
                </span>
                <button
                  onClick={() => dismiss(alert.id)}
                  className="ml-1 p-0.5 rounded hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {alerts.length > 1 && (
          <button
            onClick={dismissAll}
            className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 flex-shrink-0 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>
    </div>
  );
}
