"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ChevronDown, ArrowRight, Sparkles, Building, BriefcaseBusiness, Globe, TerminalSquare, Info } from "lucide-react";

/* ─── Sync with Backend features (`lib/utils/plan-gate`) ─── */
const TIERS = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

const FEATURE_GATES = {
  qrColorsCustom: TIERS.PRO,
  qrErrorCorrectionCustom: TIERS.PRO,
  qrLogoEmbedded: TIERS.ENTERPRISE,
  qrFrameCustom: TIERS.ENTERPRISE,
  qrPrintableTemplate: TIERS.ENTERPRISE,
  splitBill: TIERS.PRO,
  siigoIntegration: TIERS.PRO,
  upsellEngine: TIERS.PRO,
  advancedReports: TIERS.PRO,
  multiUserRoles: TIERS.PRO,
  multiLocation: TIERS.ENTERPRISE,
  apiWebhooks: TIERS.ENTERPRISE,
  customBranding: TIERS.ENTERPRISE,
};

function isEnabled(feature: keyof typeof FEATURE_GATES, tier: number) {
  return tier >= FEATURE_GATES[feature];
}

/* ─── Presentation Data ─── */
const pricingCards = [
  {
    id: "STARTER",
    tierValue: TIERS.STARTER,
    name: "Starter",
    price: "89.000",
    period: "/mes",
    tagline: "Esencial para operar y cobrar desde la mesa sin fricción urbana.",
    cta: "Empezar Gratis",
    href: "/register",
    highlighted: false,
    icon: Building,
    features: [
      "Hasta 5 mesas activas",
      "Órdenes y cobros ilimitados",
      "Conexión directa pasarela Wompi",
      "Reportes de corte de caja",
    ],
  },
  {
    id: "PRO",
    tierValue: TIERS.PRO,
    name: "Pro Business",
    price: "149.000",
    period: "/mes",
    tagline: "Desbloquea el crecimiento. Integraciones contables y operación madura.",
    cta: "Seleccionar Pro",
    href: "/register",
    highlighted: true,
    badge: "Más Popular",
    icon: Sparkles,
    features: [
      "Hasta 15 mesas activas",
      "Integración bidireccional Siigo POS",
      "División de cuenta avanzada",
      "Motor dinámico de Upsells",
    ],
  },
  {
    id: "ENTERPRISE",
    tierValue: TIERS.ENTERPRISE,
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Cadena de franquicias, API developers, SLAs duros y account manager.",
    cta: "Hablar con ventas",
    href: "mailto:hola@smartcheckout.co",
    highlighted: false,
    icon: Globe,
    features: [
      "Multi-sucursal centralizada",
      "API directa & Webhooks transaccionales",
      "100% Marca Blanca sin logos de PayR",
      "Plantillas QR impresas de marca",
    ],
  },
];

const matrixCategories = [
  {
    category: "Operación Física",
    features: [
      { name: "QR Único en mesa", sub: "Menú vivo", starter: true, pro: true, enterprise: true },
      { name: "Límite de mesas locales", sub: "", starter: "5 mesas", pro: "15 mesas", enterprise: "Ilimitadas" },
      { name: "Multi-usuario", sub: "Roles de caja/admin", starter: isEnabled('multiUserRoles', TIERS.STARTER), pro: isEnabled('multiUserRoles', TIERS.PRO), enterprise: isEnabled('multiUserRoles', TIERS.ENTERPRISE) },
      { name: "Multi-sucursal", sub: "Franquicias", starter: isEnabled('multiLocation', TIERS.STARTER), pro: isEnabled('multiLocation', TIERS.PRO), enterprise: isEnabled('multiLocation', TIERS.ENTERPRISE) },
    ]
  },
  {
    category: "Checkouts y Pagos",
    features: [
      { name: "Routing de dinero directo", sub: "A tu cuenta NIT", starter: true, pro: true, enterprise: true },
      { name: "Propina sugerida obligatoria", sub: "", starter: true, pro: true, enterprise: true },
      { name: "División de cuenta inteligente", sub: "Múltiples pagos", starter: isEnabled('splitBill', TIERS.STARTER), pro: isEnabled('splitBill', TIERS.PRO), enterprise: isEnabled('splitBill', TIERS.ENTERPRISE) },
      { name: "Motor Upsell Pospago", sub: "Café y postres extras", starter: isEnabled('upsellEngine', TIERS.STARTER), pro: isEnabled('upsellEngine', TIERS.PRO), enterprise: isEnabled('upsellEngine', TIERS.ENTERPRISE) },
    ]
  },
  {
    category: "Aesthetics y QR",
    features: [
      { name: "Gestión QR Base", sub: "Alta legibilidad", starter: true, pro: true, enterprise: true },
      { name: "Colores HSL dedicados", sub: "", starter: isEnabled('qrColorsCustom', TIERS.STARTER), pro: isEnabled('qrColorsCustom', TIERS.PRO), enterprise: isEnabled('qrColorsCustom', TIERS.ENTERPRISE) },
      { name: "Corrección Error avanzada", sub: "", starter: isEnabled('qrErrorCorrectionCustom', TIERS.STARTER), pro: isEnabled('qrErrorCorrectionCustom', TIERS.PRO), enterprise: isEnabled('qrErrorCorrectionCustom', TIERS.ENTERPRISE) },
      { name: "Logo del Restaurante Embebido", sub: "Branding core", starter: isEnabled('qrLogoEmbedded', TIERS.STARTER), pro: isEnabled('qrLogoEmbedded', TIERS.PRO), enterprise: isEnabled('qrLogoEmbedded', TIERS.ENTERPRISE) },
      { name: "Marcos QR Impresión PDF (A4)", sub: "", starter: isEnabled('qrPrintableTemplate', TIERS.STARTER), pro: isEnabled('qrPrintableTemplate', TIERS.PRO), enterprise: isEnabled('qrPrintableTemplate', TIERS.ENTERPRISE) },
      { name: "Hide PayR Logo (Marca Blanca)", sub: "", starter: isEnabled('customBranding', TIERS.STARTER), pro: isEnabled('customBranding', TIERS.PRO), enterprise: isEnabled('customBranding', TIERS.ENTERPRISE) },
    ]
  },
  {
    category: "Developers & Infra",
    features: [
      { name: "Panel Web", sub: "SaaS estándar", starter: true, pro: true, enterprise: true },
      { name: "Sincronización POS", sub: "Siigo", starter: isEnabled('siigoIntegration', TIERS.STARTER), pro: isEnabled('siigoIntegration', TIERS.PRO), enterprise: isEnabled('siigoIntegration', TIERS.ENTERPRISE) },
      { name: "Reportes Transaccionales (XLSX)", sub: "", starter: isEnabled('advancedReports', TIERS.STARTER), pro: isEnabled('advancedReports', TIERS.PRO), enterprise: isEnabled('advancedReports', TIERS.ENTERPRISE) },
      { name: "Acceso Headless API REST", sub: "", starter: isEnabled('apiWebhooks', TIERS.STARTER), pro: isEnabled('apiWebhooks', TIERS.PRO), enterprise: isEnabled('apiWebhooks', TIERS.ENTERPRISE) },
    ]
  }
];

const faqs = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Por ahora los cambios se gestionan por contacto directo (escribinos a hola@smartcheckout.co). El auto-billing nativo con prorrateo está en roadmap.",
  },
  {
    q: "¿Qué pasa si excedo el límite de mesas de mi plan?",
    a: "PayR dejará de permitirte crear mesas nuevas en el dashboard hasta que subas al siguiente plan. Las mesas que ya tenías nunca se bloquean para recibir pagos.",
  },
  {
    q: "¿Cobran comisión por transacción de las comandas?",
    a: "Cero. Nosotros cobramos la suscripción del software. Las comisiones de Wompi (normalmente 1.5% - 2%) se mantienen inalteradas y aisladas — PayR no toca tus transacciones.",
  },
  {
    q: "¿Cómo facturan el servicio SaaS?",
    a: "Al cierre de cada mes te enviamos la factura electrónica vía email. El auto-billing con tarjeta y panel de facturación nativo están en roadmap.",
  },
  {
    q: "¿Hay setup fee de onboarding?",
    a: "No para Starter ni Pro: configurás Wompi y Siigo en pocos minutos y empezás a operar el mismo día. En Enterprise puede haber un setup negociado según las customizaciones (multi-sucursal, migración de APIs, branding).",
  },
];

/* ─── Components ─── */

function MetricCell({ value, minReqName }: { value: boolean | string; minReqName?: string }) {
  if (typeof value === "string") {
    return <span className="text-[14px] font-bold text-gray-900 tabular-nums">{value}</span>;
  }
  
  if (value === true) {
    return <Check className="w-[18px] h-[18px] text-[#4648d4] stroke-[3]" />;
  }

  return (
    <div className="relative group inline-flex items-center justify-center">
      <Minus className="w-[18px] h-[18px] text-gray-300" />
      {minReqName && (
        <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-lg pointer-events-none transition-all duration-200 whitespace-nowrap z-20">
          Añadido en {minReqName}
        </div>
      )}
    </div>
  );
}

function AccordionFAQ({ faq, expanded, onToggle }: { faq: { q: string; a: string }; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200/60 rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:border-gray-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#4648d4] focus:ring-inset"
      >
        <span className="text-[16px] font-bold text-gray-900">{faq.q}</span>
        <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 transition-transform duration-300 ${expanded ? 'rotate-180 bg-gray-100' : ''}`}>
           <ChevronDown className="w-4 h-4 text-gray-600" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-0 text-[14px] leading-relaxed text-gray-600">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="bg-[#fcfcff] min-h-screen selection:bg-[#4648d4]/10 selection:text-[#4648d4] font-sans">
      
      {/* ── HERO ── */}
      <section className="pt-32 lg:pt-40 pb-16 px-6 relative overflow-hidden">
         {/* Intergalactic mesh flare behind text */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#4648d4]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
         
         <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
           <motion.div
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, ease: "easeOut" }}
           >
              <h1 className="text-[44px] md:text-[64px] font-black tracking-[-0.03em] leading-[1.05] text-gray-900 drop-shadow-sm">
                Cobrá sin colas,<br /> <span className="bg-gradient-to-r from-[#4648d4] to-[#6b38d4] bg-clip-text text-transparent">sin propinas perdidas.</span>
              </h1>
              <p className="mt-6 text-[18px] md:text-[20px] text-gray-500 font-medium max-w-2xl mx-auto leading-snug">
                Sube la facturación de tus mesas eliminando el cuello de botella físico. PayR se acopla a lo que ya tienes sin hardware adicional.
              </p>
           </motion.div>

           {/* Toggle Billing */}
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.4, delay: 0.15 }}
             className="flex flex-col items-center justify-center pt-8"
           >
              <div className="relative flex items-center bg-gray-200/60 p-1.5 rounded-full border border-gray-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`relative z-10 px-6 py-2.5 text-[14px] font-bold rounded-full transition-colors ${billingCycle === "monthly" ? "text-gray-900 shadow-sm bg-white" : "text-gray-500 hover:text-gray-700"}`}
                >
                   Mensualmente
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => { /* Do not change to annual, it's coming soon */ }}
                    className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold rounded-full transition-colors cursor-not-allowed ${billingCycle === "annual" ? "text-gray-900 shadow-sm bg-white" : "text-gray-400"}`}
                  >
                     Anualmente
                     <span className="px-2 py-0.5 bg-[#4648d4]/10 text-[#4648d4] text-[10px] font-black rounded uppercase tracking-widest border border-[#4648d4]/20">
                       -20%
                     </span>
                  </button>
                  <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xl pointer-events-none transition-all duration-200 whitespace-nowrap">
                    Próximamente
                    <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                  </div>
                </div>
              </div>
           </motion.div>
         </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="px-6 pb-24 relative z-20">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-4">
            {pricingCards.map((tier, i) => {
               const Icon = tier.icon;
               return (
                 <motion.div
                   key={tier.id}
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                   className={`relative flex flex-col rounded-[32px] p-8 md:p-10 transition-transform duration-500 ease-out hover:-translate-y-1 ${
                     tier.highlighted 
                       ? "bg-white border-[3px] border-[#4648d4] shadow-[0_24px_80px_-16px_rgba(70,72,212,0.2)] md:scale-105 z-10"
                       : "bg-white border border-gray-200 shadow-sm"
                   }`}
                 >
                    {tier.highlighted && (
                      <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4648d4] to-[#714ef9] text-white px-5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {tier.badge}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tier.highlighted ? "bg-[#4648d4]/10 border-[#4648d4]/20 text-[#4648d4]" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                          <Icon className="w-5 h-5" />
                       </div>
                       <h3 className={`text-[18px] font-bold tracking-tight ${tier.highlighted ? "text-[#4648d4]" : "text-gray-900"}`}>{tier.name}</h3>
                    </div>

                    <div className="mb-6">
                       <div className="flex items-baseline gap-1">
                          {tier.price !== "Custom" && <span className="text-[26px] font-bold text-gray-400 -translate-y-3">$</span>}
                          <span className="text-[48px] lg:text-[56px] font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                             {tier.price}
                          </span>
                       </div>
                       <span className="block mt-2 text-[14px] font-semibold text-gray-500 uppercase tracking-widest">{tier.period || "Volumen Customizado"}</span>
                       <p className="mt-4 text-[14px] leading-relaxed text-gray-600 font-medium">
                          {tier.tagline}
                       </p>
                    </div>

                    <div className="mt-auto pt-6 mb-8">
                       <ul className="space-y-4">
                         {tier.features.map((feat) => (
                           <li key={feat} className="flex items-start gap-3">
                              <Check className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${tier.highlighted ? "text-[#4648d4]" : "text-gray-800"}`} strokeWidth={2.5} />
                              <span className="text-[14px] font-semibold text-gray-700 leading-snug">{feat}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <Link
                      href={tier.href}
                      className={`group w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold transition-all ${
                         tier.highlighted
                           ? "bg-[#4648d4] text-white shadow-lg shadow-[#4648d4]/30 hover:-translate-y-0.5 hover:bg-[#3b3db1]"
                           : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                       {tier.cta}
                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </motion.div>
               );
            })}
         </div>
      </section>

      {/* ── COMPARISON MATRIX HEADER STICKY ── */}
      <section className="px-6 pb-24">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-[32px] md:text-[40px] font-black text-gray-900 tracking-tight">Comparativa de Arquitectura</h2>
               <p className="text-[16px] text-gray-500 mt-3 font-medium">Características directas mapeadas desde el core de PayR.</p>
            </div>

            <div className="border border-gray-200 bg-white rounded-3xl shadow-sm overflow-hidden overflow-x-auto relative hidden md:block">
               {/* Sticky Global Header */}
               <div className="sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm grid grid-cols-[1fr_120px_120px_120px] lg:grid-cols-[1fr_140px_140px_140px]">
                  <div className="p-5 font-bold text-[14px] text-gray-800 uppercase tracking-widest flex items-center">Feature Central</div>
                  <div className="p-5 text-center font-bold text-[14px] text-gray-600 border-l border-gray-100">Starter</div>
                  <div className="p-5 text-center font-bold text-[14px] text-[#4648d4] bg-[#4648d4]/5 border-l border-[#4648d4]/10">Pro</div>
                  <div className="p-5 text-center font-bold text-[14px] text-gray-900 border-l border-gray-100">Enterprise</div>
               </div>

               {/* Table Body */}
               <div className="divide-y divide-gray-100">
                 {matrixCategories.map((group) => (
                    <div key={group.category}>
                       <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                          <TerminalSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-[12px] font-bold uppercase tracking-widest text-gray-600">{group.category}</span>
                       </div>
                       
                       {group.features.map(feat => {
                          const getPlanName = () => feat.pro && !feat.starter ? "PRO" : feat.enterprise && !feat.pro && !feat.starter ? "ENTERPRISE" : undefined;
                          const req = getPlanName();

                          return (
                            <div key={feat.name} className="grid grid-cols-[1fr_120px_120px_120px] lg:grid-cols-[1fr_140px_140px_140px] hover:bg-gray-50/50 transition-colors">
                               <div className="p-5 lg:pl-12 flex flex-col justify-center">
                                  <span className="text-[14px] font-bold text-gray-900">{feat.name}</span>
                                  {feat.sub && <span className="text-[12px] font-medium text-gray-400 mt-0.5">{feat.sub}</span>}
                               </div>
                               <div className="p-5 flex items-center justify-center border-l border-gray-100">
                                  <MetricCell value={feat.starter} minReqName={!feat.starter ? req : undefined} />
                               </div>
                               <div className="p-5 flex items-center justify-center bg-[#4648d4]/5 border-l border-[#4648d4]/10">
                                  <MetricCell value={feat.pro} minReqName={!feat.pro ? "ENTERPRISE" : undefined} />
                               </div>
                               <div className="p-5 flex items-center justify-center border-l border-gray-100">
                                  <MetricCell value={feat.enterprise} />
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 ))}
               </div>
            </div>

            {/* Mobile simplified message */}
            <div className="md:hidden border border-blue-100 bg-blue-50 p-6 rounded-3xl flex items-start gap-4">
               <Info className="w-6 h-6 text-blue-600 shrink-0" />
               <p className="text-[14px] font-medium text-blue-900 leading-relaxed">
                  Estás viéndolo en un móvil. Para revisar la tabla arquitectónica y ver la matriz comparativa de código puro ingresa desde tu escritorio o tableta gráfica.
               </p>
            </div>
         </div>
      </section>

      {/* ── FAQs ── */}
      <section className="px-6 pb-32">
         <div className="max-w-2xl mx-auto">
            <h2 className="text-[32px] font-black text-gray-900 mb-10 tracking-tight text-center">Despejemos dudas</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionFAQ
                  key={i}
                  faq={faq}
                  expanded={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
         </div>
      </section>

      {/* ── ENTERPRISE CTA ── */}
      <section className="px-6 pb-24">
         <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden bg-gray-950 rounded-[40px] shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/10" />
               <div className="absolute top-0 right-0 p-32 blur-[150px] opacity-20 bg-fuchsia-500 rounded-full mix-blend-screen" />
               
               <div className="relative px-8 py-20 md:py-28 text-center z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 mb-6 drop-shadow-xl">
                     <BriefcaseBusiness className="w-7 h-7 text-indigo-300" />
                  </div>
                  <h2 className="text-[36px] md:text-[56px] font-black text-white tracking-tight mb-6 leading-[1.1]">
                     ¿Más de 10 sucursales? <br className="hidden sm:block" /> Hablemos seriamente.
                  </h2>
                  <p className="text-[18px] text-gray-300 max-w-2xl font-medium leading-relaxed mb-10">
                     Infraestructura dedicada, contratos de SLA asilados (Single-tenant), desarrollo de marca blanca y endpoints customizados. Vuela en primera clase.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                     <Link
                       href="mailto:ventas@smartcheckout.co"
                       className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 text-[15px] font-bold rounded-[18px] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all"
                     >
                        Agendar Diagnóstico <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                     <Link
                       href="/contact"
                       className="inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-md text-white text-[15px] font-bold rounded-[18px] hover:bg-white/10 transition-colors"
                     >
                        Documentación Enterprise
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>
      
    </div>
  );
}
