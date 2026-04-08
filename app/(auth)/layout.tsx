"use client";

import Link from "next/link";
import { Check, Shield, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};
const fadeRight = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
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
        {/* Animated gradient orbs */}
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

        {/* Grid */}
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

        {/* Main content — centered */}
        <motion.div
          className="relative z-10 max-w-[440px]"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400 text-[12px] font-medium mb-8">
              <Zap className="w-3 h-3 text-indigo-400" />
              Rápido. Seguro. Sin comisiones.
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[42px] xl:text-[52px] font-bold leading-[1.08] tracking-tight text-white mb-5"
          >
            Tu restaurante{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              cobra solo
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-[15px] text-gray-400 leading-relaxed mb-8 max-w-[380px]"
          >
            El cliente escanea el QR en su mesa, ve la cuenta de Siigo y paga con tarjeta, Nequi o PSE. La mesa se cierra sola en tu POS.
          </motion.p>

          <div className="space-y-3">
            {[
              "Conecta Siigo en 10 minutos",
              "Propinas 15% más altas en promedio",
              "La mesa se cierra sola en el POS",
            ].map((item) => (
              <motion.div
                key={item}
                variants={fadeRight}
                className="flex items-center gap-3 text-[14px] text-gray-300"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-indigo-400" />
                </div>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom — social proof */}
        <motion.div
          className="relative z-10 flex items-center gap-6 text-[13px] text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {["#818cf8", "#c084fc", "#34d399"].map((c) => (
                <div
                  key={c}
                  className="w-6 h-6 rounded-full border-2 border-gray-950"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span className="text-gray-400">+150 restaurantes</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-gray-400">4.9</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="flex items-center gap-1 text-emerald-400/80">
            <Shield className="w-3 h-3" />
            PCI-DSS
          </span>
        </motion.div>
      </div>

      {/* ===== RIGHT — Form area (50%) ===== */}
      <div className="flex-1 lg:w-1/2 flex flex-col relative bg-gray-50">
        {/* Subtle grid */}
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
