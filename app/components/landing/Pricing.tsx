"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

export function Pricing() {
  return (
    <section className="py-24 bg-[#fdfaf6]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 fade-in-up">
          <h2 className="font-serif text-[36px] md:text-[44px] font-bold text-[#1c1410] tracking-tight mb-4">
            Planes directos, sin letra pequeña.
          </h2>
          <p className="text-[17px] text-[#78716c] leading-relaxed">
            Las comisiones bancarias quedan entre ti y Bancolombia. PayR solo te cobra el uso de su arquitectura tecnológica en mensualidades planas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
           
           {/* Starter */}
           <div className="bg-white border border-[#e7e5e4] rounded-[32px] p-8 flex flex-col fade-in-up">
              <h3 className="font-bold text-[#1c1410] text-[18px] mb-4">Starter</h3>
              <div className="flex items-baseline gap-1 mb-2">
                 <span className="text-[36px] font-black tabular-nums text-[#1c1410]">$89.000</span>
                 <span className="text-[14px] font-bold text-[#78716c]">/ mes</span>
              </div>
              <p className="text-[14px] text-[#78716c] mb-8 pb-8 border-b border-[#e7e5e4]">
                 Hasta 5 mesas operativas y conexión Wompi estándar.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-medium"><Check className="w-5 h-5 text-[#c2410c] shrink-0" /> Generación ilimitada de cobros</li>
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-medium"><Check className="w-5 h-5 text-[#c2410c] shrink-0" /> Panel de caja y cortes de turno</li>
              </ul>
              <Link href="/register" className="w-full py-3.5 bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#1c1410] font-bold text-center rounded-xl transition-colors">
                 Comenzar con Starter
              </Link>
           </div>

           {/* Pro */}
           <div className="bg-white border-2 border-[#c2410c] shadow-[0_16px_40px_rgba(194,65,12,0.15)] rounded-[32px] p-8 flex flex-col relative md:scale-105 z-10 fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c2410c] text-white px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5">
                 <Sparkles className="w-3.5 h-3.5" /> Plan Recomendado
              </div>
              <h3 className="font-bold text-[#c2410c] text-[18px] mb-4">Pro Business</h3>
              <div className="flex items-baseline gap-1 mb-2">
                 <span className="text-[36px] font-black tabular-nums text-[#1c1410]">$149.000</span>
                 <span className="text-[14px] font-bold text-[#78716c]">/ mes</span>
              </div>
              <p className="text-[14px] text-[#78716c] mb-8 pb-8 border-b border-[#e7e5e4]">
                 Hasta 15 mesas y sync en tiempo real vía Siigo para operaciones de volumen.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-bold"><Check className="w-5 h-5 text-[#c2410c] shrink-0 stroke-[3]" /> División de cuenta avanzada</li>
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-bold"><Check className="w-5 h-5 text-[#c2410c] shrink-0 stroke-[3]" /> Trazabilidad total de Upsells</li>
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-medium"><Check className="w-5 h-5 text-[#c2410c] shrink-0" /> Integración ERP Siigo</li>
              </ul>
              <Link href="/register" className="w-full py-3.5 bg-[#c2410c] shadow-lg hover:bg-[#a3360a] text-white font-bold text-center rounded-xl transition-colors">
                 Comenzar con Pro Business
              </Link>
           </div>

           {/* Enterprise */}
           <div className="bg-white border border-[#e7e5e4] rounded-[32px] p-8 flex flex-col fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="font-bold text-[#1c1410] text-[18px] mb-4">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-2">
                 <span className="text-[36px] font-black text-[#1c1410]">Custom</span>
              </div>
              <p className="text-[14px] text-[#78716c] mb-8 pb-8 border-b border-[#e7e5e4]">
                 Multi-sucursal, API, marca blanca. La capa que requiere tu franquicia.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-medium"><Check className="w-5 h-5 text-[#c2410c] shrink-0" /> Webhooks REST API directa</li>
                 <li className="flex items-start gap-3 text-[14px] text-[#1c1410] font-medium"><Check className="w-5 h-5 text-[#c2410c] shrink-0" /> 100% Whitelabel branding</li>
              </ul>
              <Link href="mailto:hola@smartcheckout.co" className="w-full py-3.5 bg-white border border-[#e7e5e4] hover:bg-[#f5f5f4] text-[#1c1410] font-bold text-center rounded-xl transition-colors">
                 Agendar consulta
              </Link>
           </div>

        </div>

        <div className="mt-12 text-center fade-in-up" style={{ animationDelay: "0.3s" }}>
           <Link href="/pricing" className="text-[15px] font-bold text-[#c2410c] hover:text-[#a3360a] transition-colors underline underline-offset-4">
              Ver comparación completa de planes &rarr;
           </Link>
        </div>
      </div>
    </section>
  );
}
