"use client";

import { KeyRound, Printer, HandPlatter } from "lucide-react";

export function Journey() {
  return (
    <section id="como-funciona" className="py-24 bg-white border-y border-[#e7e5e4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20 fade-in-up">
           <h2 className="font-serif text-[36px] md:text-[44px] font-bold text-[#1c1410] tracking-tight mb-4">
             Del alta operativa a cobrar, en 3 pasos.
           </h2>
           <p className="text-[17px] text-[#78716c] leading-relaxed">
             Nada de ingenieros. El proceso de Onboarding ha sido optimizado para gestores administrativos. 
             Si tienes tus credenciales a la mano, arrancas en 5 minutos.
           </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
           {/* Background guiding line — terracotta-directional */}
           <div className="hidden md:block absolute top-[48px] left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#d6d3d1] to-[#c2410c]/40" />

           <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
              
              <div className="fade-in-up">
                 <div className="w-24 h-24 bg-gradient-to-br from-[#fdfaf6] to-[#f5f5f4] border border-[#e7e5e4] rounded-full mx-auto flex items-center justify-center mb-6 elev-md">
                    <KeyRound className="w-8 h-8 text-[#1c1410]" />
                 </div>
                 <h3 className="font-serif text-[20px] font-bold text-[#1c1410] mb-2">1. Vincula tus Pasarelas</h3>
                 <p className="text-[14px] text-[#78716c] leading-relaxed px-4">
                    Inyecta de forma segura tus llaves API de Siigo Facturación y Wompi Bancolombia dentro del Dashboard PayR.
                 </p>
              </div>

              <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
                 <div className="w-24 h-24 bg-gradient-to-br from-[#fdfaf6] to-[#f5f5f4] border border-[#e7e5e4] rounded-full mx-auto flex items-center justify-center mb-6 elev-md">
                    <Printer className="w-8 h-8 text-[#1c1410]" />
                 </div>
                 <h3 className="font-serif text-[20px] font-bold text-[#1c1410] mb-2">2. Despliega las Mesas</h3>
                 <p className="text-[14px] text-[#78716c] leading-relaxed px-4">
                    Asigna tu menú, añade tu logotipo y el software autogenerará laminas maestras PDF en Formato A4 listas para llevar a la imprenta.
                 </p>
              </div>

              <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
                 <div className="w-24 h-24 bg-[#c2410c] shadow-[0_8px_24px_rgba(194,65,12,0.35),0_2px_6px_rgba(194,65,12,0.25)] border border-[#c2410c] rounded-full mx-auto flex items-center justify-center mb-6">
                    <HandPlatter className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="font-serif text-[20px] font-bold text-[#1c1410] mb-2">3. Opera Inmediatamente</h3>
                 <p className="text-[14px] text-[#78716c] leading-relaxed px-4">
                    Colócalos en las mesas. Tus clientes comienzan a transaccionar directo. Tu recaudo ya está en línea.
                 </p>
              </div>

           </div>
        </div>
      </div>
    </section>
  );
}
