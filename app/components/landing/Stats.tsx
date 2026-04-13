"use client";

import { motion } from "framer-motion";
import { Timer, MonitorSmartphone, RefreshCw } from "lucide-react";

const stats = [
  {
    value: "30s",
    label: "Tiempo de pago",
    desc: "Reducimos el tiempo de espera en caja un 40%. Tus clientes lo agradecerán.",
    icon: Timer,
    bg: "bg-[#e1e0ff]",
    color: "text-[#4648d4]",
  },
  {
    value: "0",
    label: "Hardware adicional",
    desc: "Usa lo que ya tienes. Sin cables, sin terminales costosas, sin complicaciones.",
    icon: MonitorSmartphone,
    bg: "bg-[#e9ddff]",
    color: "text-[#6b38d4]",
  },
  {
    value: "100%",
    label: "Sincronización POS",
    desc: "Tus inventarios y ventas actualizados en tiempo real en todos tus dispositivos.",
    icon: RefreshCw,
    bg: "bg-[#ffd6fd]",
    color: "text-[#9e00b5]",
  },
];

export function Stats() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[44px] font-bold text-[#141b2b] mb-4">
            Eficiencia que se siente
          </h2>
          <p className="text-[16px] text-[#464554] max-w-xl mx-auto">
            Diseñado para negocios que no tienen un segundo que perder. Menos pasos, más ventas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(20,27,43,0.05)] transition-shadow duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-6`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
              </div>
              <p className="font-[var(--font-manrope)] text-[48px] font-extrabold text-[#141b2b] tracking-tight leading-none mb-2">
                {stat.value}
              </p>
              <h3 className="text-[16px] font-bold text-[#141b2b] mb-2">
                {stat.label}
              </h3>
              <p className="text-[14px] text-[#464554] leading-relaxed">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
