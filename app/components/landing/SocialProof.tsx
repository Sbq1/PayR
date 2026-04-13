"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Wompi", label: "Pagos" },
  { name: "Siigo", label: "POS & Contabilidad" },
  { name: "Supabase", label: "Base de datos" },
  { name: "Vercel", label: "Infraestructura" },
  { name: "Sentry", label: "Observabilidad" },
  { name: "Upstash", label: "Rate limiting" },
];

export function SocialProof() {
  return (
    <section className="relative bg-white border-t border-gray-100 py-14 md:py-16">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-9"
        >
          Infraestructura construida sobre
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8 items-center justify-items-center"
        >
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-[20px] md:text-[22px] font-[800] tracking-tight text-gray-400 group-hover:text-gray-700 transition-colors">
                {p.name}
              </span>
              <span className="text-[10px] text-gray-300 group-hover:text-gray-400 transition-colors uppercase tracking-wide">
                {p.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
