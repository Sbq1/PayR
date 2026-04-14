"use client";

export function SocialProof() {
  return (
    <section className="py-12 border-y border-[#e7e5e4] bg-[#f5f5f4]/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-[13px] font-bold uppercase tracking-widest text-[#78716c] mb-8">
          Tecnología y rieles verificables potenciados por
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 sm:gap-x-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          
          <div className="flex items-center gap-2 font-bold text-[22px] text-[#1c1410]">
             {/* Wompi mock logo */}
             <div className="w-6 h-6 rounded bg-[#1c1410]" /> Wompi
          </div>
          
          <div className="flex items-center gap-2 font-bold text-[22px] text-[#1c1410]">
             {/* Bancolombia mock logo */}
             <div className="flex px-1 gap-0.5"><div className="w-1.5 h-6 bg-[#1c1410]" /><div className="w-1.5 h-6 bg-[#1c1410]" /><div className="w-1.5 h-6 bg-[#1c1410]" /></div> Bancolombia
          </div>

          <div className="flex items-center gap-2 font-bold text-[22px] text-[#1c1410]">
             {/* Siigo mock logo */}
             <span className="text-[#1c1410] italic">Siigo.</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-[20px] text-[#1c1410]">
             {/* DIAN mock text */}
             <span className="border-2 border-[#1c1410] px-2 rounded-sm tracking-widest">DIAN</span>
          </div>
          
        </div>
      </div>
    </section>
  );
}
