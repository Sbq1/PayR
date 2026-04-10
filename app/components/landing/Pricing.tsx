import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Standard",
    price: "89.000",
    tables: "Para restaurantes en crecimiento",
    features: [
      "Pago QR integrado",
      "Selector de propina",
      "Panel de administración básico",
      "Soporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Avanzado",
    price: "149.000",
    tables: "Para más capacidad",
    features: [
      "Todo de Standard",
      "Venta cruzada",
      "Dividir cuenta",
      "Reportes de rendimiento",
    ],
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-[12px] font-medium text-gray-400 uppercase tracking-widest">
            Planes
          </span>
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-gray-900 mt-3">
            Opciones adaptables
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-lg p-8 relative shadow-sm border ${
                plan.highlighted
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[12px] font-semibold bg-gray-900 text-white px-3 py-1 rounded-lg">
                    Recomendado
                  </span>
                </div>
              )}

              <h3 className="text-[18px] font-semibold text-gray-900">
                {plan.name}
              </h3>
              <p className="text-[13px] mt-1 text-gray-500">
                {plan.tables}
              </p>

              <div className="my-6">
                <span className="text-[36px] font-bold tracking-tight text-gray-900">${plan.price}</span>
                <span className="text-[14px] ml-1 text-gray-500">
                  /mes
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-gray-900" />
                    <span className="text-[14px] text-gray-600">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-lg font-medium text-[14px] transition-colors shadow-sm ${
                    plan.highlighted
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Seleccionar Plan
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
