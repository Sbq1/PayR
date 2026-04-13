"use client";

import { motion } from "framer-motion";
import { QrCode, Smartphone, CreditCard } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    step: "01",
    title: "Genera tu QR",
    desc: "Crea mesas en el dashboard, cada una genera un código QR único. Imprímelo o muéstralo en un soporte.",
    bg: "bg-[#e1e0ff]",
    color: "text-[#4648d4]",
  },
  {
    icon: Smartphone,
    step: "02",
    title: "El cliente escanea",
    desc: "Sin app, sin descarga. El comensal abre la cámara, ve su cuenta en vivo y elige cómo pagar.",
    bg: "bg-[#e9ddff]",
    color: "text-[#6b38d4]",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Pago confirmado",
    desc: "Nequi, Daviplata, tarjeta o PSE. El pago se confirma al instante y tu dashboard se actualiza.",
    bg: "bg-[#ffd6fd]",
    color: "text-[#9e00b5]",
  },
];

export function Journey() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[44px] font-bold text-[#141b2b] mb-4">
            De la configuración al éxito en minutos
          </h2>
          <p className="text-[16px] text-[#464554] max-w-xl mx-auto">
            Tres pasos. Sin hardware. Sin capacitación compleja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-3xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(20,27,43,0.05)] transition-shadow duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center`}
                >
                  <s.icon className={`w-6 h-6 ${s.color}`} strokeWidth={2} />
                </div>
                <span className="text-[36px] font-extrabold text-[#e1e8fd] font-[var(--font-manrope)]">
                  {s.step}
                </span>
              </div>
              <h3 className="font-[var(--font-manrope)] text-[18px] font-bold text-[#141b2b] mb-3">
                {s.title}
              </h3>
              <p className="text-[14px] text-[#464554] leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
