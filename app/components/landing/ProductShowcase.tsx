"use client";

import { QrCode, Smartphone, CreditCard, Ban } from "lucide-react";

export function ProductShowcase() {
  return (
    <section id="producto" className="py-24 bg-white border-b border-[#e7e5e4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20 fade-in-up">
          <h2 className="font-serif text-[36px] md:text-[44px] font-bold text-[#1c1410] tracking-tight mb-6">
            Dinero directo en tu cuenta, sin intermediar el salón.
          </h2>
          <p className="text-[18px] text-[#78716c] leading-relaxed">
            Elimina el ciclo de &ldquo;pedir la cuenta, buscar datáfono, cobrar, devolver datáfono&rdquo;.
            Tus comensales se autogestionan y tú ganas 15 minutos en la rotación de cada mesa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {/* Step 1 */}
           <div className="bg-[#fdfaf6] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default btn-lift">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] shadow-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <QrCode className="w-8 h-8 text-[#1c1410]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">1. Escanean el QR</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Cada mesa tiene un código o NFC estático asociado a la comanda activa de tu POS Siigo.
              </p>
           </div>
           
           {/* Step 2 */}
           <div className="bg-[#fdfaf6] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default btn-lift">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] shadow-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Smartphone className="w-8 h-8 text-[#c2410c]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">2. Revisan el consumo</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Ven la factura en vivo. Aplican propina recomendada, o bien deciden dividir la cuenta entre sus amigos.
              </p>
           </div>

           {/* Step 3 */}
           <div className="bg-[#fdfaf6] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default btn-lift">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] shadow-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <CreditCard className="w-8 h-8 text-[#1c1410]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">3. Pagan instantáneo</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Usan Nequi, PSE, Tarjeta o Apple Pay (vía Wompi). El comprobante viaja directamente a tu base de datos y la DIAN.
              </p>
           </div>
        </div>

        {/* Big single Mockup Image area */}
        <div className="mt-20 flex justify-center fade-in-up">
           <div className="w-full max-w-4xl aspect-[16/9] bg-[#f5f5f4] border border-[#e7e5e4] rounded-[32px] overflow-hidden flex flex-col items-center justify-center text-[#78716c]">
              <Ban className="w-12 h-12 opacity-50 mb-4" />
              <p className="font-serif text-lg font-bold">Screenshot del Frontend del Checkout en Móviles</p>
              <code className="text-xs bg-[#e7e5e4] px-2 py-1 rounded mt-2 text-[#1c1410]">{"// TODO: Reemplazar este bloque por un Mockup con render del pago en celulares."}</code>
           </div>
        </div>
      </div>
    </section>
  );
}
