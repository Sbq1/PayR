"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <div className="max-w-2xl fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#e7e5e4] rounded-full text-[12px] font-bold text-[#c2410c] tracking-wide uppercase shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c2410c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c2410c]"></span>
              </span>
              Para restaurantes en Colombia
            </div>
            
            <h1 className="text-[48px] sm:text-[60px] lg:text-[72px] font-bold tracking-tight text-[#1c1410] leading-[1.05] mb-6">
              El cobro deja de ser el cuello de botella.
            </h1>
            
            <p className="text-[18px] sm:text-[20px] leading-relaxed text-[#78716c] mb-10">
              Conectamos tu POS Siigo con Wompi a través de un QR en la mesa. 
              Tu cliente paga sin llamar al mesero. Tú recibes el recaudo directo en tu cuenta NIT. Cero hardware extra.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c2410c] text-white text-[16px] font-bold rounded-xl shadow-[0_8px_24px_rgba(194,65,12,0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(194,65,12,0.3)] transition-all duration-300"
              >
                Empezá gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#producto"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-[#e7e5e4] text-[#1c1410] text-[16px] font-bold rounded-xl hover:bg-[#f5f5f4] transition-colors"
              >
                <PlayCircle className="w-5 h-5 text-[#c2410c]" /> Ver en acción
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-3 text-[13px] font-medium text-[#78716c]">
               <span>✓ Sin comisiones de retención PayR</span>
               <span className="w-1 h-1 rounded-full bg-[#e7e5e4]" />
               <span>✓ Setup en 5 minutos</span>
            </div>
          </div>
          
          {/* Right: Mockup */}
          <div className="relative fade-in-up" style={{ animationDelay: "0.2s" }}>
             {/* Decorator background block */}
             <div className="absolute inset-0 -translate-x-6 translate-y-6 bg-[#f5f5f4] border border-[#e7e5e4] rounded-[32px] -z-10" />
             
             <div className="relative bg-white rounded-[32px] border border-[#e7e5e4] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden aspect-[4/3] flex items-center justify-center">
                
                {/* TODO: Reemplazar con <Image src="..." /> real de una mesa apuntando al phone mockup */}
                <div className="flex flex-col items-center justify-center text-center p-8">
                   <div className="w-20 h-20 mb-4 bg-[#fdfaf6] border border-[#e7e5e4] rounded-2xl flex items-center justify-center">
                     <span className="text-[#c2410c] font-serif text-3xl opacity-50">🖼️</span>
                   </div>
                   <h3 className="font-serif font-bold text-[#1c1410] text-xl mb-2">Señal Visual Principal</h3>
                   <p className="text-[14px] text-[#78716c] max-w-sm">
                      Poner foto de QRs impresos en mesas o pantalla celular del cliente pagando la cuenta.
                   </p>
                   <code className="mt-4 px-3 py-1.5 bg-[#fdfaf6] text-[#c2410c] text-[11px] font-mono rounded">
                     {"// TODO: Reemplazar este bloque por next/image real"}
                   </code>
                </div>

             </div>

             {/* Floating trust badge mockup */}
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-[#e7e5e4] shadow-[0_12px_24px_rgba(0,0,0,0.06)] flex items-center gap-4 hidden sm:flex">
                <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-full flex items-center justify-center">
                   <span className="text-[20px]">⚡️</span>
                </div>
                <div>
                   <p className="text-[13px] font-semibold text-[#1c1410] leading-none mb-1">Pago Exitoso</p>
                   <p className="text-[12px] text-[#78716c]">Cobro en 30 segundos</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
