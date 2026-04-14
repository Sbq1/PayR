"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Building,
  Zap,
  Sparkles,
  MoveRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import {
  FEATURE_MIN_TIER,
  type PlanTier,
  canUseFeature,
} from "@/lib/utils/plan-gate";

const FEATURE_LABELS: Record<string, string> = {
  qrColorsCustom: "Editor de colores de QR",
  qrErrorCorrectionCustom: "Corrección matemática (L a H)",
  splitBill: "Cobros con división de cuenta",
  siigoIntegration: "Sincronización POS Siigo",
  upsellEngine: "Algoritmo de recomendaciones",
  advancedReports: "Reportes CSV/Excel",
  multiUserRoles: "Usuarios y roles de operador",
  qrLogoEmbedded: "Logotipo embebido en centro de QR",
  qrFrameCustom: "Marcos de impresión arquitectónicos",
  qrPrintableTemplate: "Descarga de laminas PDF (A4)",
  multiLocation: "Multi-sucursal centralizado",
  apiWebhooks: "Acceso Developer SDK/Webhooks",
  customBranding: "Look & Feel 100% Marca Blanca",
};

export default function SubscriptionSettingsPage() {
  const { restaurantId } = useSession();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<PlanTier>("STARTER");
  const [tablesUsed, setTablesUsed] = useState(0);
  const [maxTables, setMaxTables] = useState(999);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        setTier((r.plan?.tier as PlanTier) || "STARTER");
        setTablesUsed(r.tableCount ?? 0);
        setMaxTables(r.plan?.maxTables ?? 999);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error cargando suscripción");
        setLoading(false);
      });
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const tablePercent = Math.min((tablesUsed / maxTables) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Planes y Facturación</h1>
        <p className="text-[14px] text-gray-500 max-w-lg leading-relaxed">
          PayR escala junto con tus ingresos. Administra la membresía de este restaurante y desbloquea módulos premium financieros y visuales.
        </p>
      </div>

      {/* Hero Current Tier */}
      <div className="relative rounded-3xl overflow-hidden p-[1px] bg-gradient-to-br from-gray-200 to-gray-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent pointer-events-none" />
        <div className="bg-white rounded-[23px] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row gap-10 md:items-center justify-between">
           
           {/* Abstract Background Decoration */}
           <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none ${
             tier === "STARTER" ? "bg-gray-400" :
             tier === "PRO" ? "bg-emerald-500" : "bg-indigo-500"
           }`} />

           <div className="space-y-4 relative z-10 flex-1">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[12px] font-bold text-gray-800 tracking-wide uppercase border border-gray-200 shadow-sm">
                Tu Plan Actual
             </div>
             <div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   {tier}
                   {tier === "STARTER" && <Building className="w-8 h-8 text-gray-400" />}
                   {tier === "PRO" && <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500" />}
                   {tier === "ENTERPRISE" && <Sparkles className="w-8 h-8 text-indigo-500 fill-indigo-500" />}
                </h2>
                <p className="text-[15px] text-gray-500 mt-3 max-w-md font-medium leading-relaxed">
                  {tier === "STARTER" && "Funciones core exclusivas de pagos digitales en tu local."}
                  {tier === "PRO" && "Potenciador de tickets y personalización masiva para retención."}
                  {tier === "ENTERPRISE" && "Escala arquitectónica completa para franquicias sin fricción."}
                </p>
             </div>
           </div>

           <div className="relative z-10 w-full md:w-auto md:min-w-[280px]">
             <div className="border border-gray-200 bg-gray-50/80 backdrop-blur-md rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-[13px] font-bold text-gray-900">Mesas creadas</h4>
                   <span className="text-[13px] font-mono font-semibold text-gray-600">{tablesUsed} / {maxTables === 99999 ? "∞" : maxTables}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
                   <div 
                     className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out" 
                     style={{ width: `${Math.max(2, tablePercent)}%` }} 
                   />
                </div>

                <div className="flex gap-2">
                   {tier !== "ENTERPRISE" ? (
                     <button className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-gray-900 text-white text-[13px] font-bold rounded-xl shadow-md shadow-gray-900/10 hover:bg-gray-800 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        Mejorar Plan <MoveRight className="w-4 h-4" />
                     </button>
                   ) : (
                     <button className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-800 text-[13px] font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                        Soporte Premium
                     </button>
                   )}
                </div>
             </div>
           </div>
        </div>
      </div>

{/* Features Matrix Gate */}
      <div className="space-y-6">
        <div>
           <h3 className="text-xl font-bold text-gray-900">Matriz de Acceso</h3>
           <p className="text-[13px] text-gray-500 mt-1">Comparativa arquitectónica de módulos del ecosistema PayR basados en `plan-gate.ts`.</p>
        </div>

        <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
           <div className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_120px_120px_120px] bg-gray-50 border-b border-gray-200 p-4">
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider flex items-center">Feature</div>
              <div className="text-[12px] font-bold text-gray-800 uppercase tracking-wider text-center">Starter</div>
              <div className="text-[12px] font-bold text-emerald-700 uppercase tracking-wider text-center">Pro</div>
              <div className="text-[12px] font-bold text-indigo-700 uppercase tracking-wider text-center">Ent.</div>
           </div>
           
           <div className="divide-y divide-gray-100">
             {Object.keys(FEATURE_MIN_TIER).map((key) => {
               const featureKey = key as keyof typeof FEATURE_MIN_TIER;
               const label = FEATURE_LABELS[featureKey] || featureKey;
               
               const hasStarter = canUseFeature("STARTER", featureKey);
               const hasPro = canUseFeature("PRO", featureKey);
               const hasEnt = canUseFeature("ENTERPRISE", featureKey);

               return (
                 <div key={featureKey} className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_120px_120px_120px] p-4 items-center hover:bg-gray-50/50 transition-colors group">
                    <div className="text-[13px] font-medium text-gray-700">{label}</div>
                    <div className="flex justify-center">
                       {hasStarter ? <Check className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" /> : <X className="w-4 h-4 text-gray-200" />}
                    </div>
                    <div className="flex justify-center">
                       {hasPro ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-4 h-4 text-gray-200" />}
                    </div>
                    <div className="flex justify-center">
                       {hasEnt ? <Check className="w-5 h-5 text-indigo-500" /> : <X className="w-4 h-4 text-gray-200" />}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
