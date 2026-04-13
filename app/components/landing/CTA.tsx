"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1000px] mx-auto">
        <div className="relative rounded-[48px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#312e81] via-[#3730a3] to-[#1e1b4b]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10 px-8 py-14 md:px-16 md:py-20 text-center">
            <h2 className="font-[var(--font-manrope)] text-[28px] md:text-[44px] font-extrabold text-white mb-4 leading-tight">
              ¿Listo para transformar tu forma de cobrar?
            </h2>
            <p className="text-[16px] text-indigo-200 max-w-xl mx-auto mb-10 leading-relaxed">
              Crea tu cuenta, configura tus mesas, genera QR. Empiezas a cobrar
              hoy sin datáfono nuevo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-[#312e81] rounded-2xl font-bold text-[15px] hover:scale-[1.02] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]"
              >
                Comenzar Gratis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="mailto:hola@smart-checkout.co"
                className="inline-flex items-center justify-center px-10 py-5 bg-white/10 text-white border border-indigo-400/30 backdrop-blur-sm rounded-2xl font-bold text-[15px] hover:bg-white/20 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]"
              >
                Agendar Demo
              </a>
            </div>
            <p className="text-[12px] text-indigo-300/60 mt-8">
              Setup en 5 minutos · Sin tarjeta de crédito · 14 días de prueba
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
