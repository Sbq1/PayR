"use client";

import Link from "next/link";
import { Check, Shield, Zap, ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT — Branding panel (50%) ===== */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gray-950 text-white p-10 xl:p-14 relative overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ scale: [1, 1.15, 1], x: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <div className="absolute inset-0 auth-grid-bg opacity-[0.06] z-0" />

        {/* Logo */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-[12px]">SC</span>
            </div>
            <span className="font-semibold text-[15px] text-white/90">
              Smart Checkout
            </span>
          </Link>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="relative z-10 max-w-[460px]"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400 text-[12px] font-medium mb-6">
              <Zap className="w-3 h-3 text-indigo-400" />
              Pagos QR para restaurantes
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[40px] xl:text-[48px] font-bold leading-[1.08] tracking-tight text-white mb-4"
          >
            Tu restaurante{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              cobra solo
            </span>
          </motion.h1>

          {/* One-liner */}
          <motion.p
            variants={fadeUp}
            className="text-[15px] text-gray-400 leading-relaxed mb-8"
          >
            Escanean el QR, pagan y la mesa se cierra automáticamente en Siigo. Sin esperar al mesero.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-10">
            <Link
              href="/register"
              className="flex items-center gap-2 text-[14px] font-medium text-gray-900 bg-white px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Empieza gratis
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/#como-funciona"
              className="flex items-center gap-2 text-[14px] font-medium text-gray-400 hover:text-white transition-colors"
            >
              Ver cómo funciona
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Business benefits */}
          <motion.div variants={fadeUp} className="space-y-2.5 mb-10">
            {[
              "Reduce tiempos de espera en un 40%",
              "Propinas 15% más altas en promedio",
              "Aumenta rotación de mesas",
              "Menos errores en caja",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 text-[13px] text-gray-300"
              >
                <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </motion.div>

        </motion.div>

        {/* Bottom — trust signals */}
        <motion.div
          className="relative z-10 flex items-center gap-5 text-[12px] text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <span className="flex items-center gap-1.5 text-emerald-400/80">
            <Shield className="w-3 h-3" />
            Pagos 100% seguros
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="text-gray-400">Sin manejo de efectivo</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="text-gray-400">Integrado con Siigo</span>
        </motion.div>
      </div>

      {/* ===== RIGHT — Form area (50%) ===== */}
      <div className="flex-1 lg:w-1/2 flex flex-col relative bg-gray-50">
        <div className="absolute inset-0 auth-grid-bg pointer-events-none" />

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end relative z-10">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">SC</span>
            </div>
            <span className="font-semibold text-[15px] text-gray-900">Smart Checkout</span>
          </Link>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
