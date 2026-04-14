"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ArrowRight, Sparkles, Building, BriefcaseBusiness, Globe, TerminalSquare, Info } from "lucide-react";

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
    tagline: "Esencial para operar y cobrar desde la mesa sin fricción.",
    cta: "Empezar Gratis",
    href: "/register",
    highlighted: false,
    icon: Building,
    features: [
      "5 mesas activas",
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
      "Hasta 15 mesas",
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
    period: "Para franquicias sólidas",
    tagline: "Cadena de franquicias, API developers, SLAs duros y account manager.",
    cta: "Hablar con ventas",
    href: "mailto:hola@smartcheckout.co",
    highlighted: false,
    icon: Globe,
    features: [
      "Ilimitadas mesas y multi-sucursal",
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
      { name: "Límite de mesas locales", sub: "", starter: "5 mesas", pro: "Hasta 15 mesas", enterprise: "Ilimitadas" },
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
    a: "Sí. Por ahora los cambios se gestionan por contacto directo (escríbenos a hola@smartcheckout.co). El auto-billing nativo con prorrateo está en roadmap.",
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
    a: "No para Starter ni Pro: configuras Wompi y Siigo en pocos minutos y empiezas a operar el mismo día. En Enterprise puede haber un setup negociado según las customizaciones (multi-sucursal, migración de APIs, branding).",
  },
];

/* ─── Components ─── */

function MetricCell({ value, minReqName }: { value: boolean | string; minReqName?: string }) {
  if (typeof value === "string") {
    return <span className="text-[14px] font-bold text-[#1c1410] tabular-nums">{value}</span>;
  }
  
  if (value === true) {
    return <Check className="w-[18px] h-[18px] text-[#c2410c] stroke-[3]" />;
  }

  return (
    <div className="relative group inline-flex items-center justify-center cursor-help">
      <div className="w-2 h-0.5 rounded bg-[#e7e5e4]" />
      {minReqName && (
        <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1c1410] text-[#fdfaf6] text-[10px] font-bold uppercase tracking-wider px-2 py-1 flex items-center shadow-lg pointer-events-none transition-all duration-200 whitespace-nowrap z-20">
          Disponible desde {minReqName}
        </div>
      )}
    </div>
  );
}

function AccordionFAQ({ faq, expanded, onToggle }: { faq: { q: string; a: string }; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#e7e5e4] bg-white rounded-none border-t-0 first:border-t hover:bg-[#fdfaf6] transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 px-4 text-left focus:outline-none"
      >
        <span className="font-serif text-[18px] font-bold text-[#1c1410]">{faq.q}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180 text-[#c2410c]' : 'text-[#78716c]'}`}>
           <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-8 pt-0 text-[15px] leading-relaxed text-[#78716c] font-medium max-w-3xl">
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
    <div className="bg-[#fdfaf6] min-h-screen font-sans selection:bg-[#c2410c]/20 selection:text-[#c2410c]">
      
      {/* ── HERO ── */}
      <section className="pt-32 lg:pt-40 pb-16 px-6 relative">
         <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
           <motion.div
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, ease: "easeOut" }}
           >
              <h1 className="font-serif text-[44px] md:text-[64px] font-black tracking-[-0.02em] leading-[1.05] text-[#1c1410]">
                Cobra sin colas,<br /> <span className="text-[#c2410c]">sin propinas perdidas.</span>
              </h1>
              <p className="mt-6 text-[18px] md:text-[20px] text-[#78716c] max-w-2xl mx-auto leading-relaxed">
                Aumenta la facturación de tus mesas eliminando fricción. PayR se sincroniza con tu flujo actual de forma transparente.
              </p>
           </motion.div>

           {/* Toggle Billing */}
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.4, delay: 0.15 }}
             className="flex flex-col items-center justify-center pt-8"
           >
              <div className="relative flex items-center bg-[#f5f5f4] p-[5px] rounded-full border border-[#e7e5e4]">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`relative z-10 px-6 py-2.5 text-[14px] font-bold rounded-full transition-colors ${billingCycle === "monthly" ? "text-[#1c1410] shadow-[0_2px_4px_rgba(0,0,0,0.05)] bg-white" : "text-[#78716c] hover:text-[#1c1410]"}`}
                >
                   Mensual
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => { /* Proximamente */ }}
                    className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold rounded-full transition-colors cursor-not-allowed ${billingCycle === "annual" ? "text-[#1c1410] shadow-[0_2px_4px_rgba(0,0,0,0.05)] bg-white" : "text-[#a8a29e]"}`}
                  >
                     Anual
                     <span className="px-2 py-0.5 bg-[#c2410c]/10 text-[#c2410c] text-[10px] font-black rounded uppercase tracking-widest border border-[#c2410c]/20">
                       -20%
                     </span>
                  </button>
                  <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1c1410] text-[#fdfaf6] text-[11px] font-bold px-3 py-1.5 rounded shadow-xl pointer-events-none transition-all duration-200 whitespace-nowrap">
                    Facturación anual próximamente
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
                       ? "bg-white border-2 border-[#c2410c] shadow-[0_16px_40px_rgba(194,65,12,0.1)] md:scale-105 z-10"
                       : "bg-white border border-[#e7e5e4] shadow-sm"
                   }`}
                 >
                    {tier.highlighted && (
                      <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-[#c2410c] text-white px-5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                        <Sparkles className="w-3.5 h-3.5" /> {tier.badge}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${tier.highlighted ? "bg-[#c2410c]/10 border-[#c2410c]/20 text-[#c2410c]" : "bg-[#f5f5f4] border-[#e7e5e4] text-[#1c1410]"}`}>
                          <Icon className="w-6 h-6" />
                       </div>
                       <h3 className={`font-serif text-[24px] font-bold tracking-tight ${tier.highlighted ? "text-[#c2410c]" : "text-[#1c1410]"}`}>{tier.name}</h3>
                    </div>

                    <div className="mb-6">
                       <div className="flex items-baseline gap-1">
                          {tier.price !== "Custom" && <span className="font-serif text-[26px] font-bold text-[#a8a29e] -translate-y-3">$</span>}
                          <span className="font-serif text-[48px] lg:text-[56px] font-black text-[#1c1410] tracking-tighter tabular-nums leading-none">
                             {tier.price}
                          </span>
                       </div>
                       <span className="block mt-2 text-[14px] font-bold text-[#78716c]">{tier.period}</span>
                       <p className="mt-6 text-[15px] leading-relaxed text-[#78716c]">
                          {tier.tagline}
                       </p>
                    </div>

                    <div className="mt-auto pt-6 mb-8 border-t border-[#e7e5e4]/50">
                       <ul className="space-y-4 pt-2">
                         {tier.features.map((feat) => (
                           <li key={feat} className="flex items-start gap-3">
                              <Check className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${tier.highlighted ? "text-[#c2410c]" : "text-[#1c1410]"}`} strokeWidth={2.5} />
                              <span className="text-[14px] font-medium text-[#1c1410] leading-snug">{feat}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <Link
                      href={tier.href}
                      className={`group w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold transition-all ${
                         tier.highlighted
                           ? "bg-[#c2410c] text-white shadow-[0_4px_16px_rgba(194,65,12,0.3)] hover:bg-[#a3360a]"
                           : "bg-white border border-[#e7e5e4] text-[#1c1410] hover:bg-[#f5f5f4]"
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

      {/* ── COMPARISON MATRIX HERO ── */}
      <section className="px-6 pb-24">
         <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 fade-in-up">
               <h2 className="font-serif text-[36px] md:text-[44px] font-black text-[#1c1410] tracking-tight">Arquitectura Transparente</h2>
               <p className="text-[16px] text-[#78716c] mt-3">Características directas mapeadas desde el core de PayR para cada nivel.</p>
            </div>

            <div className="border border-[#e7e5e4] bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden overflow-x-auto relative hidden md:block fade-in-up">
               {/* Sticky Global Header */}
               <div className="sticky top-0 bg-white z-20 border-b border-[#e7e5e4] grid grid-cols-[1fr_120px_120px_120px] lg:grid-cols-[1fr_160px_160px_160px]">
                  <div className="p-6 font-bold text-[14px] text-[#1c1410] uppercase tracking-widest flex items-center">Desglose de funciones</div>
                  <div className="p-6 text-center font-bold text-[14px] text-[#78716c] border-l border-[#e7e5e4]">Starter</div>
                  <div className="p-6 text-center font-bold text-[14px] text-[#c2410c] bg-[#c2410c]/5 border-l border-[#c2410c]/10">Pro Business</div>
                  <div className="p-6 text-center font-bold text-[14px] text-[#1c1410] border-l border-[#e7e5e4]">Enterprise</div>
               </div>

               {/* Table Body */}
               <div className="divide-y divide-[#e7e5e4]/50">
                 {matrixCategories.map((group) => (
                    <div key={group.category}>
                       <div className="bg-[#f5f5f4] px-6 py-4 border-b border-[#e7e5e4]/50 flex items-center gap-2">
                          <TerminalSquare className="w-4 h-4 text-[#78716c]" />
                          <span className="text-[12px] font-bold uppercase tracking-widest text-[#78716c]">{group.category}</span>
                       </div>
                       
                       {group.features.map(feat => {
                          const getPlanName = () => feat.pro && !feat.starter ? "PRO" : feat.enterprise && !feat.pro && !feat.starter ? "ENTERPRISE" : undefined;
                          const req = getPlanName();

                          return (
                            <div key={feat.name} className="grid grid-cols-[1fr_120px_120px_120px] lg:grid-cols-[1fr_160px_160px_160px] hover:bg-[#fdfaf6] transition-colors">
                               <div className="p-6 flex flex-col justify-center">
                                  <span className="text-[14px] font-bold text-[#1c1410]">{feat.name}</span>
                                  {feat.sub && <span className="text-[12px] font-medium text-[#78716c] mt-0.5">{feat.sub}</span>}
                               </div>
                               <div className="p-6 flex items-center justify-center border-l border-[#e7e5e4]/50">
                                  <MetricCell value={feat.starter} minReqName={!feat.starter ? req : undefined} />
                               </div>
                               <div className="p-6 flex items-center justify-center bg-[#c2410c]/5 border-l border-[#c2410c]/10 transition-colors">
                                  <MetricCell value={feat.pro} minReqName={!feat.pro ? "ENTERPRISE" : undefined} />
                               </div>
                               <div className="p-6 flex items-center justify-center border-l border-[#e7e5e4]/50">
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
            <div className="md:hidden border border-[#e7e5e4] bg-white p-6 rounded-2xl flex items-start gap-4">
               <Info className="w-6 h-6 text-[#c2410c] shrink-0" />
               <p className="text-[14px] font-medium text-[#78716c] leading-relaxed">
                  Estás viéndolo en un móvil. Para revisar la matriz arquitectónica pura gira la pantalla o ingresa desde una tableta.
               </p>
            </div>
         </div>
      </section>

      {/* ── FAQs ── */}
      <section className="px-6 pb-32">
         <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-[36px] md:text-[44px] font-bold text-[#1c1410] mb-12 tracking-tight text-center fade-in-up">Preguntas Frecuentes</h2>
            <div className="flex flex-col fade-in-up" style={{ animationDelay: "0.1s" }}>
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
      <section className="px-6 pb-24 fade-in-up">
         <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden bg-[#1c1410] rounded-[32px] shadow-2xl border border-[#3f2a24]">
               {/* Warm accent blobs inside */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#c2410c] rounded-full blur-[160px] opacity-20 mix-blend-screen pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#fbbf24] rounded-full blur-[160px] opacity-10 mix-blend-screen pointer-events-none" />
               
               <div className="relative px-8 py-20 md:py-28 text-center z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#2d1810] rounded-2xl flex items-center justify-center border border-[#3f2a24] mb-8 shadow-inner">
                     <BriefcaseBusiness className="w-7 h-7 text-[#fbbf24]" />
                  </div>
                  <h2 className="font-serif text-[36px] md:text-[52px] font-black text-[#fdfaf6] tracking-tight mb-6 leading-[1.05]">
                     ¿Vincularás una cadena? <br className="hidden sm:block" /> Hablemos de volumen.
                  </h2>
                  <p className="text-[18px] text-[#a8a29e] max-w-2xl font-medium leading-relaxed mb-10">
                     Infraestructura dedicada (Single-tenant), desarrollo de marca blanca y un SLA que te deje dormir tranquilo por las noches.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                     <Link
                       href="mailto:hola@smartcheckout.co"
                       className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c2410c] text-white text-[15px] font-bold rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(194,65,12,0.3)] transition-all"
                     >
                        Agendar Diagnóstico <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                     <Link
                       href="mailto:hola@smartcheckout.co"
                       className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-[#3f2a24] text-[#fdfaf6] text-[15px] font-bold rounded-2xl hover:bg-[#2d1810] transition-colors"
                     >
                        Hablar con Ingeniería
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>
      
    </div>
  );
}
