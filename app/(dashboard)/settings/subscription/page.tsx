"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";

interface PlanInfo {
  tier: string;
  name: string;
  maxTables: number;
}

const planFeatures: Record<string, string[]> = {
  STARTER: ["Pago QR integrado", "Selector de propina", "Panel admin básico", "Soporte por email"],
  PRO: ["Todo de Starter", "Cross-selling", "Dividir cuenta", "Reportes avanzados"],
  ENTERPRISE: ["Todo de Pro", "Analytics completo", "Soporte prioritario", "API personalizada"],
};

export default function SubscriptionPage() {
  const { restaurantId } = useSession();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        setPlan(r.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const features = planFeatures[plan?.tier || "STARTER"] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900">Suscripción</h1>
        <p className="text-[14px] text-gray-500 mt-1">Tu plan actual y límites</p>
      </div>

      <div className="max-w-lg rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{plan?.name || "Starter"}</h2>
            <p className="text-[13px] text-gray-500">
              {plan?.maxTables === -1 ? "Mesas ilimitadas" : `Hasta ${plan?.maxTables || 5} mesas`}
            </p>
          </div>
          <span className="px-3 py-1 text-[12px] font-semibold rounded-full bg-gray-100 text-gray-700 uppercase">
            {plan?.tier || "STARTER"}
          </span>
        </div>

        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[14px] text-gray-600">
              <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-[13px] text-gray-400">
            Para cambiar de plan o ver precios, contacta a soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
