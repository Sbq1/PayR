"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Base",
    price: "$89.000",
    tagline: "Para restaurantes que están empezando con pago digital.",
    features: [
      "QR único por mesa",
      "Visualización de cuenta en vivo",
      "Todos los métodos de Wompi",
      "Dashboard de órdenes y pagos",
      "Reporte diario",
      "Soporte por correo",
    ],
    cta: "Empezar con Base",
    highlighted: false,
  },
  {
    name: "Avanzado",
    price: "$149.000",
    tagline: "Operación completa: upsells, analytics, integraciones.",
    features: [
      "Todo de Base, más:",
      "Integración con Siigo POS",
      "División de cuenta avanzada",
      "Motor de upsells contextuales",
      "Analytics y métricas en tiempo real",
      "Multi-usuario con roles",
      "Webhooks y API",
      "Soporte prioritario (<4h)",
    ],
    cta: "Empezar con Avanzado",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section
      id="precios"
      className="relative bg-white py-24 md:py-32 border-t border-gray-100 overflow-hidden"
    >
      {/* Backdrop gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgb(217 70 239 / 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-[1100px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            Estructura
          </span>
          <h2 className="text-[36px] md:text-[56px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900 mb-4">
            Precios claros.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Sin sorpresas.
            </span>
          </h2>
          <p className="text-[16px] text-gray-500 max-w-[520px] mx-auto leading-relaxed">
            Mensualidad fija. Sin comisión por transacción desde la app.
            Solo pagas Wompi por lo que procesas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              {plan.highlighted && (
                <div
                  aria-hidden="true"
                  className="absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-br from-indigo-500/25 via-violet-500/20 to-fuchsia-500/25 blur-3xl opacity-70"
                />
              )}

              <div
                className={`relative rounded-[24px] bg-white p-8 md:p-10 flex flex-col h-full ${
                  plan.highlighted
                    ? "conic-border"
                    : "border border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 right-8 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    Más popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-[22px] font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed min-h-[42px]">
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-gray-100">
                  <span
                    className={`text-[44px] md:text-[52px] font-[900] tracking-[-0.03em] tabular-nums ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
                        : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className="text-[14px] text-gray-400 font-medium">
                    /mes
                  </span>
                </div>

                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((feature, fi) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-[14px] text-gray-700"
                    >
                      <span
                        className={`flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 ${
                          plan.highlighted
                            ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${plan.highlighted ? "text-white" : "text-gray-700"}`}
                          strokeWidth={3}
                        />
                      </span>
                      <span
                        className={
                          fi === 0 && plan.highlighted
                            ? "font-semibold text-gray-900"
                            : ""
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    plan.highlighted
                      ? "bg-gray-900 text-white hover:bg-gray-800 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-gray-900"
                      : "bg-white border border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-900"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-[13px] text-gray-400 mt-10"
        >
          Todos los planes incluyen 14 días de prueba · Sin contrato · Cancelas cuando quieras
        </motion.p>
      </div>
    </section>
  );
}
