"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-gray-100">
      <div className="relative bg-gray-900 py-24 md:py-36 overflow-hidden grain">
        {/* Aurora mesh */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 aurora-dark" />

        {/* Gradient orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute top-[-40%] left-[-10%] h-[600px] w-[600px] rounded-full opacity-50 blur-3xl motion-safe:animate-[spin_40s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, #6366f1 0deg, #8b5cf6 120deg, #d946ef 240deg, #6366f1 360deg)",
            }}
          />
          <div
            className="absolute bottom-[-40%] right-[-10%] h-[600px] w-[600px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, #ec4899 0%, #8b5cf6 50%, transparent 70%)",
            }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)",
            }}
          />
          {/* Floating dots */}
          <span className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-indigo-400 blur-[1px] float-a" />
          <span className="absolute top-[30%] right-[20%] w-3 h-3 rounded-full bg-fuchsia-400 blur-[2px] float-b" />
          <span className="absolute bottom-[25%] left-[25%] w-2.5 h-2.5 rounded-full bg-violet-400 blur-[1.5px] float-c" />
          <span className="absolute bottom-[20%] right-[15%] w-2 h-2 rounded-full bg-pink-400 blur-[1px] float-a" style={{ animationDelay: "2s" }} />
          <span className="absolute top-[50%] left-[45%] w-1.5 h-1.5 rounded-full bg-white float-b opacity-70" style={{ animationDelay: "3s" }} />
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="relative max-w-[1100px] mx-auto px-6 text-center"
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-3 py-1 text-[12px] font-medium text-white/90 mb-8"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Aceptando restaurantes en Colombia
          </motion.span>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="text-[42px] sm:text-[56px] md:text-[76px] font-[900] tracking-[-0.04em] leading-[0.98] text-white max-w-[900px] mx-auto mb-6"
          >
            Tu próxima mesa
            <br />
            paga en{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              30 segundos.
            </span>
          </motion.h2>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="text-[17px] md:text-[19px] text-white/70 max-w-[560px] mx-auto mb-10 leading-relaxed"
          >
            Crea tu cuenta, configura tus mesas, genera QR. Empiezas a cobrar
            hoy sin datáfono nuevo.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-[15px] font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors shadow-[0_8px_32px_-8px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="mailto:hola@smart-checkout.co"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-[15px] font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <MessageSquare className="w-4 h-4" />
              Hablar con ventas
            </a>
          </motion.div>

          <motion.p
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.5 } },
            }}
            className="text-[12px] text-white/50 mt-8"
          >
            Setup en 5 minutos · Sin tarjeta de crédito · 14 días de prueba
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
