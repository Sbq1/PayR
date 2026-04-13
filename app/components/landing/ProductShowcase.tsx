"use client";

import { motion } from "framer-motion";
import { Check, TrendingUp, ShieldCheck, Users } from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Seguridad de Grado Bancario",
    desc: "Encriptación de extremo a extremo en cada transacción.",
  },
  {
    icon: TrendingUp,
    title: "Reportes en Tiempo Real",
    desc: "Toma decisiones basadas en datos exactos de tus ventas diarias.",
  },
  {
    icon: Users,
    title: "Multi-usuario y Multi-sucursal",
    desc: "Gestiona todo tu equipo y múltiples locales con un solo clic.",
  },
];

export function ProductShowcase() {
  return (
    <section id="historia" className="py-24 md:py-32 px-6 bg-[#f1f3ff]/50">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="relative bg-white p-4 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(20,27,43,0.08)]">
              {/* Dashboard mockup */}
              <div className="rounded-[24px] bg-[#f9f9ff] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-[#767586] uppercase tracking-wider">
                      Dashboard
                    </p>
                    <p className="text-[18px] font-extrabold text-[#141b2b] font-[var(--font-manrope)]">
                      La Barra
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    En vivo
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Ventas hoy", value: "$4.8M", change: "+12%" },
                    { label: "Órdenes", value: "243", change: "+8%" },
                    { label: "Ticket prom.", value: "$19.7k", change: "+3%" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <p className="text-[9px] font-medium text-[#767586] uppercase tracking-wider">
                        {kpi.label}
                      </p>
                      <p className="text-[20px] font-extrabold text-[#141b2b] tabular-nums font-[var(--font-manrope)]">
                        {kpi.value}
                      </p>
                      <p className="text-[10px] font-medium text-emerald-600">
                        {kpi.change}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <p className="text-[10px] font-medium text-[#767586] uppercase tracking-wider mb-3">
                    Ventas últimas 7h
                  </p>
                  <div className="flex items-end gap-2 h-16">
                    {[35, 55, 45, 70, 60, 85, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-md bg-gradient-to-t from-[#4648d4] to-[#6063ee]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-[0_20px_40px_rgba(20,27,43,0.08)] hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#767586] uppercase tracking-wider">
                    Pago Recibido
                  </p>
                  <p className="text-[16px] font-bold text-[#141b2b]">
                    $450.000 COP
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT — Benefits list */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[40px] font-bold text-[#141b2b] mb-8 leading-tight">
              Control total desde la palma de tu mano
            </h2>
            <ul className="space-y-6">
              {benefits.map((b) => (
                <li key={b.title} className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e1e0ff] text-[#4648d4] shrink-0 mt-0.5">
                    <b.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#141b2b] mb-1">
                      {b.title}
                    </h4>
                    <p className="text-[14px] text-[#464554] leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
