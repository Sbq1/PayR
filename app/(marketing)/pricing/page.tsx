"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, ChevronDown, ArrowRight } from "lucide-react";

/* ─── Data ─────────────────────────────────────────── */

const tiers = [
  {
    id: "STARTER",
    name: "Starter",
    price: "$89.000",
    period: "/mes",
    tagline: "Para restaurantes que están empezando con pago digital.",
    cta: "Empezar Gratis",
    href: "/register",
    highlighted: false,
    features: [
      "QR único por mesa",
      "Cuenta en vivo para clientes",
      "Todos los métodos de Wompi",
      "Dashboard de órdenes y pagos",
      "Hasta 10 mesas",
      "Soporte por email",
    ],
  },
  {
    id: "PRO",
    name: "Pro Business",
    price: "$149.000",
    period: "/mes",
    tagline: "Operación completa con upsells, integración POS y división de cuenta.",
    cta: "Seleccionar Pro",
    href: "/register",
    highlighted: true,
    badge: "Más Popular",
    features: [
      "Todo de Starter, más:",
      "Hasta 25 mesas",
      "Integración con Siigo POS",
      "División de cuenta avanzada",
      "Motor de upsells contextuales",
      "Multi-usuario con roles",
      "Reportes avanzados",
      "Soporte prioritario (<4h)",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Sucursales ilimitadas, API personalizada, account manager dedicado.",
    cta: "Contactar Ventas",
    href: "mailto:hola@smart-checkout.co",
    highlighted: false,
    features: [
      "Todo de Pro, más:",
      "Mesas ilimitadas",
      "Sucursales ilimitadas",
      "Analytics completo",
      "Tema y branding custom",
      "API + Webhooks",
      "Account manager dedicado",
      "SLA garantizado",
    ],
  },
] as const;

type FeatureRow = {
  name: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
};

const comparisonFeatures: { category: string; features: FeatureRow[] }[] = [
  {
    category: "Pagos",
    features: [
      { name: "QR por mesa", starter: true, pro: true, enterprise: true },
      { name: "Cuenta en vivo", starter: true, pro: true, enterprise: true },
      { name: "Métodos Wompi (PSE, tarjeta, Nequi)", starter: true, pro: true, enterprise: true },
      { name: "División de cuenta", starter: false, pro: true, enterprise: true },
      { name: "Propina configurable", starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: "Gestión",
    features: [
      { name: "Dashboard admin", starter: true, pro: true, enterprise: true },
      { name: "Mesas", starter: "Hasta 10", pro: "Hasta 25", enterprise: "Ilimitadas" },
      { name: "Multi-usuario con roles", starter: false, pro: true, enterprise: true },
      { name: "Multi-sucursal", starter: false, pro: false, enterprise: true },
      { name: "Motor de upsells", starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: "Integraciones",
    features: [
      { name: "Integración Siigo POS", starter: false, pro: true, enterprise: true },
      { name: "API + Webhooks", starter: false, pro: false, enterprise: true },
      { name: "Tema y branding custom", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: "Analytics y Soporte",
    features: [
      { name: "Reporte diario", starter: true, pro: true, enterprise: true },
      { name: "Reportes avanzados", starter: false, pro: true, enterprise: true },
      { name: "Analytics completo", starter: false, pro: false, enterprise: true },
      { name: "Soporte", starter: "Email", pro: "Prioritario (<4h)", enterprise: "Dedicado + SLA" },
    ],
  },
];

const faqs = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica al siguiente ciclo de facturación sin penalización.",
  },
  {
    q: "¿Existe comisión adicional por transacción?",
    a: "Smart Checkout no cobra comisión por transacción. Solo pagas la comisión estándar de Wompi por cada pago procesado (varía según método de pago).",
  },
  {
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Todos los planes incluyen 14 días de prueba sin necesidad de tarjeta de crédito. Al terminar, eliges el plan que mejor se adapte a tu operación.",
  },
  {
    q: "¿Qué métodos de pago acepta Wompi?",
    a: "Tarjeta de crédito/débito (Visa, Mastercard, Amex), PSE (transferencia bancaria), Nequi y más. Todo sin hardware adicional.",
  },
  {
    q: "¿Se necesita un software de punto de venta?",
    a: "No es obligatorio. Smart Checkout funciona de forma independiente. Si ya usas Siigo, el plan Pro y Enterprise incluyen integración directa.",
  },
];

/* ─── Components ───────────────────────────────────── */

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-[13px] font-medium text-[#141b2b]">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-[#4648d4]" strokeWidth={2.5} />
  ) : (
    <Minus className="w-4 h-4 text-[#c7c4d7]" />
  );
}

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#e1e8fd]/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={open}
      >
        <span className="font-[var(--font-manrope)] text-[16px] font-bold text-[#141b2b] pr-4">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#767586] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-[14px] text-[#464554] leading-relaxed max-w-2xl">
          {a}
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────── */

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-[var(--font-manrope)] text-[40px] md:text-[56px] font-extrabold text-[#141b2b] leading-[1.1] tracking-tight mb-4">
              Planes que crecen con{" "}
              <span className="bg-gradient-to-r from-[#4648d4] to-[#6b38d4] bg-clip-text text-transparent">
                tu negocio
              </span>
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#464554] max-w-xl mx-auto leading-relaxed">
              Invierte tu facturación con una plataforma diseñada para restaurantes. Sin hardware. Sin sorpresas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col rounded-3xl p-8 md:p-9 ${
                tier.highlighted
                  ? "bg-white border-2 border-[#4648d4] shadow-[0_20px_60px_-15px_rgba(70,72,212,0.15)] scale-[1.03] z-10"
                  : "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <p
                  className={`text-[12px] font-bold uppercase tracking-wider mb-3 ${
                    tier.highlighted ? "text-[#4648d4]" : "text-[#464554]"
                  }`}
                >
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-[40px] md:text-[48px] font-extrabold tracking-tight font-[var(--font-manrope)] ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-[#4648d4] to-[#6063ee] bg-clip-text text-transparent"
                        : "text-[#141b2b]"
                    }`}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-[14px] text-[#767586] font-medium">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#464554] mt-2 leading-relaxed min-h-[40px]">
                  {tier.tagline}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feat, fi) => (
                  <li
                    key={feat}
                    className="flex items-start gap-3 text-[14px] text-[#141b2b]"
                  >
                    <span
                      className={`flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 ${
                        tier.highlighted
                          ? "bg-gradient-to-br from-[#4648d4] to-[#6063ee]"
                          : "bg-[#e1e0ff]"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${tier.highlighted ? "text-white" : "text-[#4648d4]"}`}
                        strokeWidth={3}
                      />
                    </span>
                    <span className={fi === 0 && tier.id !== "STARTER" ? "font-semibold" : ""}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`inline-flex items-center justify-center w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-2 ${
                  tier.highlighted
                    ? "bg-gradient-to-br from-[#4648d4] to-[#6063ee] text-white hover:opacity-90 active:scale-[0.98]"
                    : "bg-[#f1f3ff] text-[#4648d4] hover:bg-[#e1e8fd] active:scale-[0.98]"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[#767586] mt-8">
          Todos los planes incluyen 14 días de prueba · Sin contrato · Cancelas cuando quieras
        </p>
      </section>

      {/* ── Comparison Table ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[36px] font-bold text-[#141b2b] mb-3">
              Comparativa detallada
            </h2>
            <p className="text-[15px] text-[#464554]">
              Encuentra el plan perfecto para la etapa actual de tu negocio.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-[#f1f3ff]">
                  <th className="text-left py-4 px-6 text-[13px] font-bold text-[#464554] uppercase tracking-wider w-[40%]">
                    Funcionalidad
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold text-[#464554] uppercase tracking-wider">
                    Starter
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold text-[#4648d4] uppercase tracking-wider">
                    Pro Business
                  </th>
                  <th className="text-center py-4 px-4 text-[13px] font-bold text-[#464554] uppercase tracking-wider">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((group) => (
                  <Fragment key={group.category}>
                    <tr>
                      <td
                        colSpan={4}
                        className="pt-6 pb-2 px-6 text-[12px] font-bold text-[#767586] uppercase tracking-wider"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.features.map((feat) => (
                      <tr
                        key={feat.name}
                        className="border-b border-[#f1f3ff] hover:bg-[#f9f9ff] transition-colors"
                      >
                        <td className="py-3.5 px-6 text-[14px] text-[#141b2b]">
                          {feat.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            <CellValue value={feat.starter} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center bg-[#f9f9ff]/50">
                          <div className="flex justify-center">
                            <CellValue value={feat.pro} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            <CellValue value={feat.enterprise} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[36px] font-bold text-[#141b2b] mb-3">
              Preguntas frecuentes
            </h2>
          </div>

          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise CTA ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[48px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#312e81] via-[#3730a3] to-[#1e1b4b]" />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative z-10 px-8 py-14 md:px-16 md:py-20 text-center">
              <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[40px] font-extrabold text-white mb-4 leading-tight">
                ¿Operas a gran escala?
              </h2>
              <p className="text-[16px] text-indigo-200 max-w-xl mx-auto mb-8 leading-relaxed">
                Diseñamos infraestructura de pago a tu medida con contratos de
                confidencialidad, soporte dedicado y SLA garantizado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="mailto:hola@smart-checkout.co"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#312e81] rounded-2xl font-bold text-[15px] hover:scale-[1.02] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]"
                >
                  Agendar Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="mailto:hola@smart-checkout.co"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border border-indigo-400/30 backdrop-blur-sm rounded-2xl font-bold text-[15px] hover:bg-white/20 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]"
                >
                  Contactar Ventas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
