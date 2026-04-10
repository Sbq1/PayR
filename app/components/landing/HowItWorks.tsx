import { motion } from "framer-motion";
import { Smartphone, Receipt, Wallet } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Escanea el QR",
    desc: "El cliente escanea el código en su mesa. Sin descargas.",
    number: "01",
  },
  {
    icon: Receipt,
    title: "Revisa la cuenta",
    desc: "Aparece la cuenta completa con detalle al instante.",
    number: "02",
  },
  {
    icon: Wallet,
    title: "Pago rápido",
    desc: "Elige el método, confirma y la cuenta se actualiza.",
    number: "03",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-gray-50 border-y border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest">
            Proceso
          </span>
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-gray-900 mt-3">
            Tan simple como contar hasta tres
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-16 relative">
          <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px overflow-hidden">
            <motion.div
              className="h-full bg-gray-200"
              initial={{ scaleX: 0, transformOrigin: "left" }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-8 relative z-10 shadow-sm">
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-lg bg-gray-900 text-white font-bold flex items-center justify-center text-[12px]">
                  {step.number}
                </span>
                <step.icon className="w-8 h-8 text-gray-400 group-hover:text-gray-900 transition-colors duration-200" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed max-w-[260px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
