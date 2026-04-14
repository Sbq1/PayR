"use client";

import Link from "next/link";
import { Check, Shield, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex selection:bg-[#c2410c]/20 selection:text-[#c2410c] font-sans">
      {/* ===== LEFT — Branding panel (50%) ===== */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#fdfaf6] text-[#1c1410] border-r border-[#e7e5e4] p-10 xl:p-14 relative overflow-hidden">
        
        {/* Subtle decorative mesh */}
        <div className="absolute inset-0 bg-[#f5f5f4]/50 pointer-events-none" style={{ backgroundImage: "radial-gradient(#e7e5e4 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        
        {/* Warm subtle blob */}
        <motion.div
           className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.03]"
           style={{ background: "radial-gradient(circle, #c2410c 0%, transparent 70%)", filter: "blur(80px)" }}
           animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-10 h-10 rounded-xl bg-[#c2410c] text-white flex items-center justify-center">
              <span className="font-serif font-bold text-lg leading-none -translate-y-px">P</span>
            </div>
            <span className="font-serif font-bold text-[22px] text-[#1c1410] tracking-tight">
              PayR
            </span>
          </Link>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="relative z-10 max-w-[460px] pb-16"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-serif text-[44px] xl:text-[52px] font-black leading-[1.05] tracking-tight text-[#1c1410] mb-6"
          >
            Tu restaurante cobra <span className="text-[#c2410c]">solo.</span>
          </motion.h1>

          {/* One-liner */}
          <motion.p
            variants={fadeUp}
            className="text-[17px] text-[#78716c] leading-relaxed mb-10 font-medium"
          >
            Escanean el QR, pagan y la mesa se cierra automáticamente en tu POS. Tu ecosistema operando limpio y sin intermediarios.
          </motion.p>

          {/* Business benefits */}
          <motion.div variants={fadeUp} className="space-y-4 mb-12">
            {[
              "Reduce el cuello de botella del cobro",
              "Más propinas porque el cliente decide solo",
              "Aumenta rotación de mesas",
              "Menos errores en caja",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-[15px] font-medium text-[#1c1410]"
              >
                <div className="w-6 h-6 flex-shrink-0 bg-[#c2410c]/10 text-[#c2410c] rounded-full flex items-center justify-center">
                   <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                {item}
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[14px] font-bold text-[#fdfaf6] bg-[#1c1410] px-6 py-3 rounded-xl hover:bg-[#2d1810] transition-colors shadow-sm"
            >
              Volver al sitio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom — trust signals (Partners) */}
        <motion.div
          className="relative z-10 flex items-center gap-4 text-[13px] font-bold text-[#78716c] uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <span className="flex items-center gap-2 text-[#1c1410]">
            <Shield className="w-4 h-4 text-[#c2410c]" />
            Partners Tecnológicos:
          </span>
          <span className="text-[#1c1410] capitalize">Wompi</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e7e5e4]" />
          <span className="text-[#1c1410] capitalize">Bancolombia</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e7e5e4]" />
          <span className="text-[#1c1410] capitalize">Siigo</span>
        </motion.div>
      </div>

      {/* ===== RIGHT — Form area (50%) ===== */}
      <div className="flex-1 lg:w-1/2 flex flex-col relative bg-white">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end border-b border-[#e7e5e4] lg:border-transparent relative z-10 bg-white">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#c2410c] flex items-center justify-center">
              <span className="text-white font-serif font-bold text-[14px] leading-none">P</span>
            </div>
            <span className="font-serif font-bold text-[18px] text-[#1c1410] tracking-tight">PayR</span>
          </Link>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[420px] bg-white rounded-3xl md:shadow-[0_8px_40px_rgba(0,0,0,0.04)] md:border border-[#e7e5e4] p-6 sm:p-10"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
