"use client";

import { useEffect, useState, Fragment } from "react";
import { Loader2, Check, Zap, ArrowUpCircle, Info, ShieldAlert, BadgeInfo } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { type PlanTier, canUseFeature } from "@/lib/utils/plan-gate";

interface PlanAPI {
  tier: PlanTier;
  name: string;
  maxTables: number;
}

const matrixCategories = [
  {
    category: "Operación Física",
    features: [
      { id: "base_qr", name: "QR Único en mesa", starter: true, pro: true, enterprise: true, tooltip: "Código en vivo enrutado a tus comandas." },
      { id: "base_tables", name: "Límite de mesas locales", starter: "5 mesas", pro: "15 mesas", enterprise: "Ilimitadas", tooltip: "Número de QR activos en el local." },
      { id: "multiUserRoles", name: "Multi-usuario", starter: canUseFeature("STARTER", "multiUserRoles"), pro: canUseFeature("PRO", "multiUserRoles"), enterprise: canUseFeature("ENTERPRISE", "multiUserRoles"), tooltip: "Emplea cajas, meseros y administradores distintos." },
      { id: "multiLocation", name: "Multi-sucursal", starter: canUseFeature("STARTER", "multiLocation"), pro: canUseFeature("PRO", "multiLocation"), enterprise: canUseFeature("ENTERPRISE", "multiLocation"), tooltip: "Unifica toda tu cadena de restaurantes bajo un NIT." },
    ]
  },
  {
    category: "Checkouts y Pagos",
    features: [
      { id: "base_route", name: "Recaudo Wompi", starter: true, pro: true, enterprise: true, tooltip: "Dinero fondeado directo a tu pasarela." },
      { id: "base_tip", name: "Motor de Propinas", starter: true, pro: true, enterprise: true, tooltip: "Recauda propina legalmente en el flujo de pago." },
      { id: "splitBill", name: "División Inteligente de Cuenta", starter: canUseFeature("STARTER", "splitBill"), pro: canUseFeature("PRO", "splitBill"), enterprise: canUseFeature("ENTERPRISE", "splitBill"), tooltip: "Mitad/Mitad o Pagar ítems específicos." },
      { id: "upsellEngine", name: "Upsell Pospago", starter: canUseFeature("STARTER", "upsellEngine"), pro: canUseFeature("PRO", "upsellEngine"), enterprise: canUseFeature("ENTERPRISE", "upsellEngine"), tooltip: "Recomienda postres al momento crucial." },
    ]
  },
  {
    category: "Aesthetics y QR",
    features: [
      { id: "base_estetica", name: "QR Base legibilidad", starter: true, pro: true, enterprise: true, tooltip: "Blanco y negro estandarizado." },
      { id: "qrColorsCustom", name: "Colores HSL dedicados", starter: canUseFeature("STARTER", "qrColorsCustom"), pro: canUseFeature("PRO", "qrColorsCustom"), enterprise: canUseFeature("ENTERPRISE", "qrColorsCustom"), tooltip: "Aplica tu paleta de marca a los pixeles." },
      { id: "qrErrorCorrectionCustom", name: "Corrección Error avanzada", starter: canUseFeature("STARTER", "qrErrorCorrectionCustom"), pro: canUseFeature("PRO", "qrErrorCorrectionCustom"), enterprise: canUseFeature("ENTERPRISE", "qrErrorCorrectionCustom"), tooltip: "Configuración matemática contra daños (H)." },
      { id: "qrLogoEmbedded", name: "Logo Embebido", starter: canUseFeature("STARTER", "qrLogoEmbedded"), pro: canUseFeature("PRO", "qrLogoEmbedded"), enterprise: canUseFeature("ENTERPRISE", "qrLogoEmbedded"), tooltip: "Imagen SVG central." },
      { id: "qrFrameCustom", name: "Marcos perimetrales arquitectónicos", starter: canUseFeature("STARTER", "qrFrameCustom"), pro: canUseFeature("PRO", "qrFrameCustom"), enterprise: canUseFeature("ENTERPRISE", "qrFrameCustom"), tooltip: "Llamados a la acción tipo 'Escanea Aquí'." },
      { id: "qrPrintableTemplate", name: "Láminas de Impresión", starter: canUseFeature("STARTER", "qrPrintableTemplate"), pro: canUseFeature("PRO", "qrPrintableTemplate"), enterprise: canUseFeature("ENTERPRISE", "qrPrintableTemplate"), tooltip: "PDF automáticos por cada mesa a la medida requerida." },
      { id: "customBranding", name: "Look and Feel Vírgen", starter: canUseFeature("STARTER", "customBranding"), pro: canUseFeature("PRO", "customBranding"), enterprise: canUseFeature("ENTERPRISE", "customBranding"), tooltip: "Destruye cualquier marca de agua de PayR." },
    ]
  },
  {
    category: "Developers & Infra",
    features: [
      { id: "base_web", name: "Dashboard Cloud", starter: true, pro: true, enterprise: true, tooltip: "Acceso perpetuo al sistema web." },
      { id: "siigoIntegration", name: "Sincronización POS Siigo", starter: canUseFeature("STARTER", "siigoIntegration"), pro: canUseFeature("PRO", "siigoIntegration"), enterprise: canUseFeature("ENTERPRISE", "siigoIntegration"), tooltip: "Automatiza la factura contable final con DIAN." },
      { id: "advancedReports", name: "Reportes XGB / Excel", starter: canUseFeature("STARTER", "advancedReports"), pro: canUseFeature("PRO", "advancedReports"), enterprise: canUseFeature("ENTERPRISE", "advancedReports"), tooltip: "Reporte con desglose de métodos y mesas calientes." },
      { id: "apiWebhooks", name: "API & Webhooks", starter: canUseFeature("STARTER", "apiWebhooks"), pro: canUseFeature("PRO", "apiWebhooks"), enterprise: canUseFeature("ENTERPRISE", "apiWebhooks"), tooltip: "Integración pura de desarrollador." },
    ]
  }
];

export default function SubscriptionSettingsPage() {
  const { restaurantId } = useSession();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanAPI | null>(null);
  const [tablesUsed, setTablesUsed] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        // r.plan y r.tableCount exactos de DB
        if (r.plan) {
           setPlan(r.plan);
           setTablesUsed(typeof r.tableCount === 'number' ? r.tableCount : 0);
        } else {
           // Fallback tolerante si la api estuviese pelada
           setPlan({ tier: r.planTier || "STARTER", name: "Starter", maxTables: r.planMaxTables || 5 });
           setTablesUsed(r.tableCount || 0);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error cargando metadatos de facturación");
        setLoading(false);
      });
  }, [restaurantId]);

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const isUnlimited = plan.maxTables < 0 || plan.maxTables > 10000;
  const tablePercent = isUnlimited ? 0 : Math.min((tablesUsed / plan.maxTables) * 100, 100);
  const isNearLimit = tablePercent >= 80 && tablePercent < 100;
  const isOverLimit = tablePercent >= 100 && !isUnlimited;

  const currentPrice = plan.tier === "STARTER" ? "89.000" : plan.tier === "PRO" ? "149.000" : "Custom";

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Suscripción y Uso</h1>
        <p className="text-[14px] text-gray-500 max-w-xl leading-relaxed">
          Toma control de los módulos asignados a tu restaurante actual. Adquiere expansiones para reducir fricción.
        </p>
      </div>

      {/* ── 1. & 2. HERO DEL PLAN ACTUAL + BARRAS DE USO ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
         {/* Plan Hero Card */}
         <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm p-8 flex flex-col justify-between items-start gap-8 group">
            <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700
              ${plan.tier === "STARTER" ? "bg-gray-500" : plan.tier === "PRO" ? "bg-emerald-500 group-hover:bg-emerald-400 opacity-20" : "bg-indigo-500"}
            `} />
            
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start w-full">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50/80 backdrop-blur rounded-full text-[12px] font-bold text-gray-800 tracking-wide border border-gray-200 mb-4">
                    Licencia actual
                 </div>
                 {plan.tier === "PRO" && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                       <Zap className="w-3 h-3" /> Motor Premium
                    </div>
                 )}
              </div>

              <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 {plan.name}
              </h2>
              
              <div className="mt-4 flex items-baseline gap-1">
                 {currentPrice !== "Custom" && <span className="text-[20px] font-bold text-gray-400 -translate-y-1">$</span>}
                 <span className="text-[36px] font-black text-gray-900 tracking-tight tabular-nums">{currentPrice}</span>
                 <span className="text-[13px] text-gray-500 font-medium ml-1">/ mes</span>
              </div>
            </div>

            <div className="w-full relative z-10">
               {plan.tier === "STARTER" && (
                 <button className="flex justify-center items-center gap-2 w-full py-3.5 bg-gray-900 text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] border-t border-white/20 transition-all">
                    <ArrowUpCircle className="w-4 h-4" /> Mejorar a Pro Business
                 </button>
               )}
               {plan.tier === "PRO" && (
                 <button className="flex justify-center items-center gap-2 w-full py-3.5 bg-gray-900 text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] border-t border-white/20 transition-all">
                    <ArrowUpCircle className="w-4 h-4" /> Hablar para Enterprise
                 </button>
               )}
               {plan.tier === "ENTERPRISE" && (
                 <button className="flex justify-center items-center gap-2 w-full py-3.5 bg-white border border-gray-200 text-gray-800 text-[13px] font-bold rounded-xl hover:bg-gray-50 hover:scale-[1.01] active:scale-[0.99] transition-all">
                    Gestionar Account Manager
                 </button>
               )}
            </div>
         </div>

         {/* Uso Widget */}
         <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            {isOverLimit && <div className="absolute inset-0 bg-red-50/50 pointer-events-none" />}
            {isNearLimit && <div className="absolute inset-0 bg-amber-50/30 pointer-events-none" />}
            
            <div className="relative z-10 mb-6">
               <h3 className="text-[14px] font-bold text-gray-900 mb-0.5">Cuota Operacional</h3>
               <p className="text-[12px] text-gray-500">Volumen máximo de mesas simultáneas.</p>
            </div>

            <div className="relative z-10">
               <div className="flex justify-between items-end mb-2">
                  <span className={`text-[28px] font-black tracking-tight tabular-nums leading-none ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
                     {tablesUsed}
                  </span>
                  <span className="text-[14px] font-bold text-gray-400 mb-1">
                     / {isUnlimited ? "∞" : plan.maxTables}
                  </span>
               </div>
               
               {!isUnlimited ? (
                 <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out 
                        ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-gray-900'}
                      `}
                      style={{ width: `${Math.min(tablePercent, 100)}%` }} 
                    />
                 </div>
               ) : (
                 <div className="h-2.5 w-full border border-gray-200 rounded-full bg-[linear-gradient(45deg,#f9fafb_25%,transparent_25%,transparent_50%,#f9fafb_50%,#f9fafb_75%,transparent_75%,transparent)] bg-[length:16px_16px]" />
               )}

               <div className="mt-4 min-h-[48px]">
                 {isOverLimit ? (
                   <p className="text-[12px] font-semibold text-red-600 flex items-start gap-1.5 leading-snug">
                     <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                     Brake activo. Creación de mesas bloqueada. Libera espacio o sube de plan urgente.
                   </p>
                 ) : isNearLimit ? (
                   <p className="text-[12px] font-semibold text-amber-600 flex items-start gap-1.5 leading-snug">
                     <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                     Estás en la frontera. Previene bloqueos actualizando hoy.
                   </p>
                 ) : (
                   <p className="text-[12px] text-gray-500 leading-snug">
                     Espacio saludable.
                   </p>
                 )}
               </div>

               {isOverLimit && (
                 <button className="mt-4 w-full bg-red-600 text-white font-bold text-[12px] py-2.5 rounded-xl hover:bg-red-700 transition-colors">
                    Soporte Urgente Upgrade
                 </button>
               )}
            </div>
         </div>
      </div>

      {/* ── 3. MATRIZ DE FEATURES (Dashboard View) ── */}
      <div className="border border-gray-200 bg-white rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
         <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
               <h3 className="text-[16px] font-bold text-gray-900">Detalles de la Licencia</h3>
               <p className="text-[13px] text-gray-500 mt-0.5">Analiza exactamente tu hardware digital actual.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 py-1 px-3 bg-white border border-gray-200 rounded-full">
               Columnas dinámicas por Tier
            </div>
         </div>

         <div className="min-w-[640px]">
            <div className="grid grid-cols-[1fr_120px_120px_120px] border-b border-gray-100">
               <div className="p-4 font-bold text-[12px] text-gray-500 uppercase tracking-widest pl-6">Feature</div>
               <div className={`p-4 text-center font-bold text-[12px] uppercase tracking-wider ${plan.tier === "STARTER" ? "bg-blue-50/60 text-blue-800" : "text-gray-500"}`}>
                  Starter {plan.tier === "STARTER" && <span className="block mt-0.5 text-[10px] text-blue-600/80">Activo</span>}
               </div>
               <div className={`p-4 text-center font-bold text-[12px] uppercase tracking-wider ${plan.tier === "PRO" ? "bg-blue-50/60 text-blue-800" : "text-[#4648d4]"}`}>
                  Pro {plan.tier === "PRO" && <span className="block mt-0.5 text-[10px] text-blue-600/80">Activo</span>}
               </div>
               <div className={`p-4 text-center font-bold text-[12px] uppercase tracking-wider ${plan.tier === "ENTERPRISE" ? "bg-blue-50/60 text-blue-800" : "text-gray-900"}`}>
                  Ent. {plan.tier === "ENTERPRISE" && <span className="block mt-0.5 text-[10px] text-blue-600/80">Activo</span>}
               </div>
            </div>

            <div className="divide-y divide-gray-100/60 pb-2">
              {matrixCategories.map((group) => (
                 <Fragment key={group.category}>
                    <div className="bg-gray-50/50 px-6 py-3 text-[11px] font-bold text-gray-400 tracking-widest uppercase border-y border-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                       {group.category}
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(group as any).features.map((feat: any) => (
                      <div key={feat.name} className="grid grid-cols-[1fr_120px_120px_120px] hover:bg-gray-50 transition-colors group/row">
                         <div className="p-4 pl-6 flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-gray-700">{feat.name}</span>
                            <div className="relative flex items-center group/tooltip">
                               <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
                               <div className="absolute opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 left-full ml-2 w-48 bg-gray-900 text-white text-[11px] font-medium px-3 py-2 rounded-lg shadow-xl pointer-events-none transition-all duration-200 z-20">
                                 {feat.tooltip}
                               </div>
                            </div>
                         </div>

                         {/* CELL: Starter */}
                         <div className={`flex items-center justify-center p-4 transition-colors ${plan.tier === "STARTER" ? "bg-blue-50/30" : ""}`}>
                            {typeof feat.starter === "string" ? (
                               <span className="text-[12px] font-bold text-gray-700">{feat.starter}</span>
                            ) : feat.starter ? (
                               <Check className={`w-4 h-4 ${plan.tier === "STARTER" ? "text-blue-600" : "text-gray-400"}`} strokeWidth={3} />
                            ) : (
                               <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            )}
                         </div>

                         {/* CELL: Pro */}
                         <div className={`flex items-center justify-center p-4 transition-colors border-l border-gray-100/50 ${plan.tier === "PRO" ? "bg-blue-50/30" : ""}`}>
                            {typeof feat.pro === "string" ? (
                               <span className="text-[12px] font-bold text-gray-700">{feat.pro}</span>
                            ) : feat.pro ? (
                               <Check className={`w-4 h-4 ${plan.tier === "PRO" ? "text-blue-600" : "text-[#4648d4] opacity-50"}`} strokeWidth={3} />
                            ) : (
                               <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            )}
                         </div>

                         {/* CELL: Enterprise */}
                         <div className={`flex items-center justify-center p-4 transition-colors border-l border-gray-100/50 ${plan.tier === "ENTERPRISE" ? "bg-blue-50/30" : ""}`}>
                            {typeof feat.enterprise === "string" ? (
                               <span className="text-[12px] font-bold text-gray-700">{feat.enterprise}</span>
                            ) : feat.enterprise ? (
                               <Check className={`w-4 h-4 ${plan.tier === "ENTERPRISE" ? "text-blue-600" : "text-gray-300"}`} strokeWidth={3} />
                            ) : (
                               <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            )}
                         </div>
                      </div>
                    ))}
                 </Fragment>
              ))}
            </div>
         </div>
      </div>

      {/* ── 4. SECCIÓN DE FACTURACIÓN (Placeholder Honesto) ── */}
      <div className="border border-gray-200 bg-white rounded-3xl p-8 flex items-center justify-center flex-col gap-3 shadow-sm min-h-[200px]">
         <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
            <BadgeInfo className="w-5 h-5 text-gray-400" />
         </div>
         <h3 className="text-[16px] font-bold text-gray-900 mt-2">Facturación Histórica Mensual</h3>
         <p className="text-[13px] text-gray-500 text-center max-w-md leading-relaxed">
           Facturación automática pronto disponible. Por ahora, contáctanos manualmente para ver tu historial u operaciones asociadas a Wompi. No bloquearemos tus pagos vigentes.
         </p>
         <button className="mt-2 text-[13px] font-bold text-gray-900 hover:text-gray-600 transition-colors bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
            Solicitar facturas manualmente &rarr;
         </button>
      </div>

      {/* ── 5. DOWNGRADE SUTIL ── */}
      <div className="w-full flex justify-center py-4 px-4 text-center">
         <p className="text-[12px] text-gray-400 max-w-lg leading-relaxed">
           ¿Necesitas bajar de tier o cancelar tu pago? Ten en cuenta que si bajas a STARTER perderás instantáneamente acceso a <span className="font-semibold text-gray-500">colores de QR custom, división de cuenta y Motor Siigo</span>.{" "}
           <a href="mailto:hello@smartcheckout.co" className="text-gray-500 font-bold hover:text-gray-800 transition-colors whitespace-nowrap">
              Escríbenos a soporte
           </a>
         </p>
      </div>

    </div>
  );
}
