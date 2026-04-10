import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Base",
    price: "$89.000",
    desc: "El entorno esencial para habilitar la experiencia de pago interactivo en tu establecimiento.",
    features: ["Visualización de tickets", "Todas las opciones de pago", "Soporte estándar"],
  },
  {
    name: "Avanzado",
    price: "$149.000",
    desc: "Arquitectura completa con flujos dinámicos ideales para escalar los ingresos y optimizar la sala.",
    features: ["Todo del plan base", "Motor de cross-selling", "División de cuentas avanzada", "API e integraciones"],
  }
];

export function Pricing() {
  return (
    <section id="precios" className="py-24 md:py-40 bg-white border-t border-gray-200">
      <div className="max-w-[1000px] mx-auto px-6">
        
        <div className="mb-16 md:mb-24">
          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest block mb-4">
            Estructuras
          </span>
          <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-gray-900 leading-[1.1]">
            Capacidad lineal.<br/>
            <span className="text-gray-400">Paga con base en tu uso.</span>
          </h2>
        </div>

        <div className="flex flex-col border-t border-gray-200">
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-center py-10 md:py-12 border-b border-gray-200 group hover:bg-gray-50/50 transition-colors"
            >
              <div className="md:w-[40%] mb-6 md:mb-0 pr-8">
                <h3 className="text-[20px] font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-4 max-w-[280px]">{plan.desc}</p>
                <div className="text-[24px] font-medium text-gray-900">
                  {plan.price} <span className="text-[13px] text-gray-400 font-normal">/mes</span>
                </div>
              </div>

              <div className="md:w-[35%] mb-8 md:mb-0">
                <ul className="space-y-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[14px] text-gray-600">
                      <Check className="w-4 h-4 text-gray-900 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:w-[25%] flex md:justify-end">
                <Link
                  href="/register"
                  className={`w-full md:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-[14px] font-medium shadow-sm transition-colors ${
                    i === 1 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "border border-gray-200 text-gray-900 bg-white hover:bg-gray-50"
                  }`}
                >
                  Continuar
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
