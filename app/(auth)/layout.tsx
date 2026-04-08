"use client";

import Link from "next/link";
import { Check, Shield, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
  show: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT — Branding panel ===== */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between bg-gray-950 text-white p-12 relative overflow-hidden">

        {/* — Animated gradient blobs — */}
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(50px)" }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-100px] right-[-80px] w-[450px] h-[450px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", filter: "blur(50px)" }}
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)", filter: "blur(40px)" }}
          animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 auth-grid-bg opacity-20 z-0" />

        {/* — Logo — */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
              >
                <span className="text-white font-black text-sm">SC</span>
              </div>
              <span className="font-bold text-[18px] text-white group-hover:text-indigo-300 transition-colors duration-300">
                Smart Checkout
              </span>
            </Link>
          </motion.div>
        </div>

        {/* — Main Value Prop — */}
        <motion.div
          className="relative z-10 -mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Glass card */}
          <div className="backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] p-8 rounded-3xl shadow-2xl shadow-black/20">
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
                <Zap className="w-3.5 h-3.5" />
                Rápido. Seguro. Sin comisiones.
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl xl:text-[46px] font-extrabold leading-[1.1] tracking-tight text-white mb-6"
            >
              Revoluciona
              <br />
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 inline-block"
              >
                tus pagos
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[16px] text-gray-300/80 leading-relaxed max-w-[340px]"
            >
              Más propinas, menos errores y clientes que vuelven. Únete a la plataforma líder en cobros QR.
            </motion.p>

            {/* Features list */}
            <div className="mt-8 space-y-4">
              {[
                "Sin comisiones adicionales",
                "Integración con el POS en 10 min",
                "Cierre automático de mesas",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  custom={i}
                  className="flex items-center gap-3.5 text-[15px] font-medium text-gray-300 group cursor-default"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.15, backgroundColor: "rgba(99,102,241,0.4)" }}
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                  </motion.div>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stars / rating */}
          <motion.div
            variants={itemVariants}
            className="mt-6 flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl w-fit backdrop-blur-sm"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 300 }}
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </motion.div>
              ))}
            </div>
            <span className="text-[13px] font-semibold text-gray-300">4.9 de 150+ reseñas</span>
          </motion.div>
        </motion.div>

        {/* — Bottom social proof — */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500 bg-black/20 backdrop-blur-sm border border-white/[0.05] px-4 py-3 rounded-2xl w-fit">
            <div className="flex -space-x-2">
              {["#818cf8", "#c084fc", "#34d399"].map((c, i) => (
                <motion.div
                  key={c}
                  className="w-7 h-7 rounded-full border-2 border-gray-950"
                  style={{ background: `radial-gradient(circle at 35% 35%, white 0%, ${c} 60%)` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1, type: "spring" }}
                />
              ))}
            </div>
            <span className="text-gray-400">+150 restaurantes activos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              PCI-DSS
            </span>
          </div>
        </motion.div>
      </div>

      {/* ===== RIGHT — Form area ===== */}
      <div className="lg:w-[520px] xl:w-[560px] flex flex-col relative bg-gray-50 auth-grid-bg">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end relative z-10">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-[10px]">SC</span>
            </div>
            <span className="font-bold text-[15px] text-gray-900">Smart Checkout</span>
          </Link>
        </div>

        {/* Form — with entrance animation */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12 relative z-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[430px] bg-white rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.07)] border border-gray-100/80 p-8 sm:p-10"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
