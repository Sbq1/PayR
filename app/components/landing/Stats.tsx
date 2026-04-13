"use client";

import { motion } from "framer-motion";
import { Zap, PackageMinus, Cable, Clock } from "lucide-react";

const stats = [
  {
    value: "30s",
    label: "Tiempo promedio de pago",
    sub: "Desde que escanean hasta que confirman",
    icon: Zap,
    accent: "from-indigo-500 to-violet-500",
  },
  {
    value: "0",
    label: "Hardware adicional",
    sub: "Cero terminales, cero datáfonos extra",
    icon: PackageMinus,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    value: "100%",
    label: "Sincronización POS",
    sub: "La cuenta viene directo de tu sistema",
    icon: Cable,
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    value: "24/7",
    label: "Visibilidad operativa",
    sub: "Mesas, pagos y métricas en vivo",
    icon: Clock,
    accent: "from-pink-500 to-rose-500",
  },
];

export function Stats() {
  return (
    <section className="relative bg-white py-24 md:py-32 border-t border-gray-100 overflow-hidden grain">
      {/* Subtle gradient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgb(165 180 252 / 0.15) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-[720px] mb-16"
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            Los números
          </span>
          <h2 className="text-[36px] md:text-[52px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900">
            Cobros más rápidos.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Operación más simple.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 overflow-hidden glow-hover"
            >
              {/* Gradient corner accent */}
              <div
                aria-hidden="true"
                className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
              />

              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.accent} text-white mb-5 shadow-sm`}
              >
                <stat.icon className="w-5 h-5" strokeWidth={2.2} />
              </div>

              <p className="text-[52px] md:text-[60px] font-[900] tracking-[-0.04em] leading-none text-gray-900 mb-2">
                {stat.value}
              </p>
              <p className="text-[14px] font-semibold text-gray-900 mb-1">
                {stat.label}
              </p>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
