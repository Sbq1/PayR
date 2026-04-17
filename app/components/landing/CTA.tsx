"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-[#1c1410] py-20 lg:py-32 relative overflow-hidden wood-grain-dark">
      {/* Decorative Warm Blob */}
      <div className="absolute -top-[100px] -right-[100px] w-96 h-96 bg-[#c2410c] rounded-full blur-[120px] opacity-30 mix-blend-screen" />
      
      <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10 text-center fade-in-up">
        <h2 className="font-serif text-[40px] md:text-[64px] font-black text-white tracking-tight leading-[1.05] mb-6">
          Escala el cheque promedio de tus comensales hoy mismo.
        </h2>
        <p className="text-[18px] md:text-[22px] text-[#a8a29e] mb-12 max-w-2xl mx-auto leading-relaxed">
          Cobra sin datáfono, sin colas. Tus clientes pagan desde el celular y tú recibes directo en tu cuenta.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
           <Link
             href="/register"
             className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#c2410c] text-white text-[18px] font-bold rounded-2xl shadow-[0_8px_32px_rgba(194,65,12,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(194,65,12,0.5)] transition-all duration-300"
           >
             Empezá gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </Link>
           <span className="text-[14px] text-[#78716c] font-medium hidden sm:block mx-4">
              Setup en 5 minutos
           </span>
        </div>
      </div>
    </section>
  );
}
