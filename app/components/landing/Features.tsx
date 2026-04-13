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
    bg: "bg-[#e1e0ff]",
    color: "text-[#4648d4]",
  },
  {
    icon: Percent,
    title: "Propinas configurables",
    desc: "5%, 10%, 15% o custom. Las defines tú, las elige el cliente.",
    bg: "bg-[#e9ddff]",
    color: "text-[#6b38d4]",
  },
  {
    icon: CreditCard,
    title: "Todos los métodos",
    desc: "Nequi, Daviplata, tarjetas, PSE. Lo que Wompi ofrezca, tú lo ofreces.",
    bg: "bg-[#e1e0ff]",
    color: "text-[#4648d4]",
  },
  {
    icon: Sparkles,
    title: "Upsell contextual",
    desc: "Sugiere postres o bebidas justo antes del pago. Conversión real.",
    bg: "bg-[#ffd6fd]",
    color: "text-[#9e00b5]",
  },
  {
    icon: Lock,
    title: "PCI compliant",
    desc: "La tarjeta nunca toca tu sistema. Cumples sin auditoría.",
    bg: "bg-[#d6f5e0]",
    color: "text-emerald-600",
  },
  {
    icon: LineChart,
    title: "Analytics incluidos",
    desc: "Platos estrella, horas pico, métodos preferidos. Data decisiva.",
    bg: "bg-[#e9ddff]",
    color: "text-[#6b38d4]",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 px-6 bg-[#f1f3ff]/30">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[44px] font-bold text-[#141b2b] mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-[16px] text-[#464554] max-w-xl mx-auto">
            Features pensadas para restaurantes reales. Sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="rounded-3xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(20,27,43,0.05)] transition-shadow duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${f.bg} ${f.color} mb-5`}
              >
                <f.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="font-[var(--font-manrope)] text-[17px] font-bold text-[#141b2b] tracking-tight mb-2">
                {f.title}
              </h3>
              <p className="text-[14px] text-[#464554] leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
