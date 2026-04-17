"use client";

import { SplitSquareHorizontal, Zap, TerminalSquare, BadgeDollarSign } from "lucide-react";

const featuresData = [
  {
    title: "Dividir la cuenta entre amigos",
    description: "El cliente divide solo desde su celular: por monto igual o por ítems específicos. Tus meseros dejan de hacer matemáticas en la mesa.",
    icon: SplitSquareHorizontal
  },
  {
    title: "Cierres de caja sin Excel",
    description: "Concilia automáticamente lo cobrado por Wompi contra las facturas de Siigo. Reporte exportable a Excel al cierre del día.",
    icon: BadgeDollarSign
  },
  {
    title: "Tu marca en cada QR",
    description: "Sube tu logo y ajusta colores. Cada QR de mesa y cada plantilla imprimible queda con tu identidad, sin marca de PayR (en plan Enterprise).",
    icon: TerminalSquare
  },
  {
    title: "Más propinas, sin presión",
    description: "El cliente ve opciones claras de propina (10%, 15% o 20%) en su pantalla y elige solo, en su tiempo. Sin que el mesero tenga que estar pendiente.",
    icon: Zap
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#fdfaf6] wood-grain">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">

        <div className="mb-20 fade-in-up">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#e7e5e4] rounded-full text-[12px] font-bold text-[#c2410c] tracking-wide elev-sm mb-6 uppercase">
              Operaciones blindadas
           </div>
           <h2 className="font-serif text-[36px] md:text-[44px] font-bold text-[#1c1410] max-w-2xl leading-[1.1] tracking-tight">
             Todo lo necesario para la tranquilidad gerencial.
           </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           {featuresData.map((f, i) => {
             const Icon = f.icon;
             return (
               <div key={i} className="group flex gap-6 items-start fade-in-up bg-white border border-[#e7e5e4] rounded-2xl p-6 card-lift elev-sm">
                 <div className="w-12 h-12 bg-white border border-[#e7e5e4] rounded-xl flex items-center justify-center shrink-0 elev-sm group-hover:bg-[#c2410c]/5 group-hover:border-[#c2410c]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#1c1410] group-hover:text-[#c2410c] transition-colors" />
                 </div>
                 <div>
                    <h3 className="text-[20px] font-bold text-[#1c1410] mb-2">{f.title}</h3>
                    <p className="text-[15px] text-[#78716c] leading-relaxed">
                       {f.description}
                    </p>
                 </div>
               </div>
             )
           })}
        </div>

      </div>
    </section>
  );
}
