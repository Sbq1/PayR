import { motion } from "framer-motion";
import { QrCode, CreditCard, TrendingUp, Zap, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Pago con QR",
    desc: "El cliente escanea, ve su cuenta y paga al instante. Sin apps, sin esperas.",
  },
  {
    icon: CreditCard,
    title: "Todos los métodos",
    desc: "Tarjeta, Nequi, PSE, Bancolombia, Daviplata. El dinero va directo al negocio.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard de ventas",
    desc: "Ventas en tiempo real, ticket promedio, productos principales y analítica.",
  },
  {
    icon: Zap,
    title: "Cross-selling",
    desc: "Sugiere extras antes del pago. Aumenta el ticket promedio.",
  },
  {
    icon: Shield,
    title: "Seguro y confiable",
    desc: "Plataforma protegida con estándares de encriptación seguros para tus pagos.",
  },
  {
    icon: Clock,
    title: "Sincronización automática",
    desc: "Al pagar, la cuenta se actualiza en el sistema automáticamente.",
  },
];

export function Features() {
  return (
    <section id="funciones" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest">
            Características
          </span>
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-gray-900 mt-3">
            Todo lo que necesitas,{" "}
            <span className="text-gray-400">bien diseñado.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-gray-200 rounded-lg p-7 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 text-gray-900">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[15px] text-gray-900 mb-2">
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
