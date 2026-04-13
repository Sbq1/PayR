"use client";

import { motion } from "framer-motion";
import {
  SplitSquareHorizontal,
  Percent,
  CreditCard,
  Sparkles,
  Lock,
  LineChart,
} from "lucide-react";

const features = [
  {
    icon: SplitSquareHorizontal,
    title: "División de cuenta",
    desc: "El grupo divide por ítem o en partes iguales, sin salir del QR.",
    accent: "text-indigo-500",
  },
  {
    icon: Percent,
    title: "Propinas configurables",
    desc: "5%, 10%, 15% o custom. Las defines tú, las elige el cliente.",
    accent: "text-violet-500",
  },
  {
    icon: CreditCard,
    title: "Todos los métodos",
    desc: "Nequi, Daviplata, tarjetas, PSE. Lo que Wompi ofrezca, tú lo ofreces.",
    accent: "text-fuchsia-500",
  },
  {
    icon: Sparkles,
    title: "Upsell contextual",
    desc: "Sugiere postres o bebidas justo antes del pago. Conversión real.",
    accent: "text-pink-500",
  },
  {
    icon: Lock,
    title: "PCI compliant",
    desc: "La tarjeta nunca toca tu sistema. Cumples sin auditoría.",
    accent: "text-emerald-500",
  },
  {
    icon: LineChart,
    title: "Analytics incluidos",
    desc: "Platos estrella, horas pico, métodos preferidos. Data decisiva.",
    accent: "text-teal-500",
  },
];

export function Features() {
  return (
    <section id="features" className="relative bg-white py-24 md:py-32 border-t border-gray-100">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-[720px] mb-14"
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            Todo lo que necesitas
          </span>
          <h2 className="text-[36px] md:text-[52px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900">
            Features pensadas
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              para restaurantes reales.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-7 hover:border-gray-300 transition-colors"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 ${f.accent} mb-5 group-hover:scale-110 transition-transform`}
              >
                <f.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight mb-2">
                {f.title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
