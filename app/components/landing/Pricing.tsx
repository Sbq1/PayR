"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const highlights = [
  { name: "Starter", price: "$89.000", desc: "QR + dashboard + Wompi", highlighted: false },
  { name: "Pro Business", price: "$149.000", desc: "POS + upsells + split bill", highlighted: true, badge: "Más Popular" },
  { name: "Enterprise", price: "Custom", desc: "API + multi-sucursal + SLA", highlighted: false },
];

export function Pricing() {
  return (
    <section
      id="precios"
      className="relative bg-white py-24 md:py-32 border-t border-gray-100 overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            Precios
          </span>
          <h2 className="text-[36px] md:text-[56px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900 mb-4">
            Planes claros.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Sin sorpresas.
            </span>
          </h2>
          <p className="text-[16px] text-gray-500 max-w-[520px] mx-auto leading-relaxed">
            Mensualidad fija. Sin comisión por transacción desde la app.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {highlights.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 flex flex-col items-center text-center ${
                plan.highlighted
                  ? "bg-white border-2 border-indigo-500 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)]"
                  : "bg-white border border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                {plan.name}
              </p>
              <p className={`text-[32px] font-[900] tracking-tight mb-1 ${
                plan.highlighted
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"
                  : "text-gray-900"
              }`}>
                {plan.price}
              </p>
              {plan.price !== "Custom" && (
                <p className="text-[13px] text-gray-400 mb-3">/mes</p>
              )}
              <p className="text-[13px] text-gray-500">{plan.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-900 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Ver todos los planes y comparar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <p className="text-center text-[13px] text-gray-400 mt-6">
          14 días de prueba · Sin contrato · Cancelas cuando quieras
        </p>
      </div>
    </section>
  );
}
