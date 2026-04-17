"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Phone-on-table illustration — inline SVG, no external deps.
   Restaurant plank + plate + QR stand + phone with bill UI.
   ──────────────────────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 450"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Mesa de restaurante con QR en soporte y celular mostrando el checkout de PayR"
      className="w-full h-full"
    >
      <g aria-hidden="true">
        {/* Wood plank background */}
        <rect width="600" height="450" fill="#fdfaf6" />
        <line x1="0" y1="150" x2="600" y2="150" stroke="#e7e5e4" strokeWidth="1" />
        <line x1="0" y1="310" x2="600" y2="310" stroke="#e7e5e4" strokeWidth="1" />

        {/* Radial shadow under phone */}
        <ellipse cx="300" cy="395" rx="180" ry="10" fill="#1c1410" opacity="0.08" />

        {/* Plate bottom-left */}
        <circle cx="120" cy="350" r="70" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1" />
        <circle cx="120" cy="350" r="58" fill="none" stroke="#e7e5e4" strokeWidth="0.5" />
        <circle cx="108" cy="340" r="1.5" fill="#78716c" opacity="0.5" />
        <circle cx="132" cy="352" r="1.2" fill="#78716c" opacity="0.5" />
        <circle cx="118" cy="368" r="1" fill="#78716c" opacity="0.4" />

        {/* Folded napkin — terracotta triangle */}
        <polygon points="50,400 170,400 110,340" fill="#c2410c" opacity="0.25" />

        {/* Steam lines over plate */}
        <path d="M 95 290 Q 100 280 95 270 Q 90 260 95 250" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M 120 295 Q 125 283 120 272 Q 115 260 120 248" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M 145 292 Q 150 281 145 270 Q 140 260 145 250" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* QR stand card (back-right) */}
        <g transform="translate(440 115)">
          <rect width="110" height="170" rx="8" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1" />
          <rect x="15" y="15" width="80" height="80" fill="#fdfaf6" rx="2" />
          {/* Stylized QR grid 8x8 */}
          <g fill="#1c1410">
            {[
              [0, 0, 3, 3], [5, 0, 3, 3], [0, 5, 3, 3],
              [1, 1, 1, 1], [6, 1, 1, 1], [1, 6, 1, 1],
              [4, 4, 1, 1], [5, 5, 1, 1], [6, 6, 2, 2],
              [3, 0, 1, 1], [4, 1, 1, 1], [0, 4, 1, 1],
              [2, 3, 1, 1], [5, 3, 1, 1], [3, 5, 1, 1],
              [7, 4, 1, 1], [4, 7, 1, 1],
            ].map(([x, y, w, h], i) => (
              <rect
                key={i}
                x={17 + x * 9.5}
                y={17 + y * 9.5}
                width={w * 9.5 - 1}
                height={h * 9.5 - 1}
              />
            ))}
          </g>
          {/* Mesa pill */}
          <rect x="15" y="110" width="80" height="24" rx="12" fill="#c2410c" />
          <text x="55" y="127" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#ffffff" textAnchor="middle" letterSpacing="1">
            MESA 04
          </text>
          <text x="55" y="152" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600" fill="#78716c" textAnchor="middle">
            Escaneá para pagar
          </text>
          {/* Stand base */}
          <polygon points="35,170 75,170 80,180 30,180" fill="#e7e5e4" />
        </g>

        {/* iPhone mockup front-center */}
        <g transform="translate(180 -10)">
          <rect width="240" height="460" rx="40" fill="#1c1410" />
          <rect x="8" y="8" width="224" height="444" rx="34" fill="#fdfaf6" />

          {/* Dynamic island */}
          <rect x="90" y="16" width="60" height="18" rx="9" fill="#1c1410" />

          {/* Status bar */}
          <text x="30" y="29" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1c1410">12:34</text>

          {/* Bill header */}
          <text x="24" y="72" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" letterSpacing="1.5">TU CUENTA</text>
          <text x="24" y="100" fontSize="18" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410">La Barra · Mesa 04</text>

          {/* Items */}
          <line x1="24" y1="120" x2="216" y2="120" stroke="#e7e5e4" strokeWidth="1" />
          {[
            ["Hamburguesa artesanal", "$42.000"],
            ["Cerveza Club (×3)", "$27.000"],
            ["Postre de la casa", "$15.000"],
          ].map(([name, price], i) => (
            <g key={i}>
              <text x="24" y={145 + i * 22} fontSize="11" fontFamily="Inter, sans-serif" fill="#1c1410">{name}</text>
              <text x="216" y={145 + i * 22} fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1c1410" textAnchor="end">{price}</text>
            </g>
          ))}

          {/* Separator */}
          <line x1="24" y1="225" x2="216" y2="225" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="2 3" />

          {/* Subtotals */}
          <text x="24" y="245" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c">Subtotal</text>
          <text x="216" y="245" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c" textAnchor="end">$84.000</text>
          <text x="24" y="262" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c">Propina (15%)</text>
          <text x="216" y="262" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c" textAnchor="end">$12.600</text>

          {/* Total */}
          <line x1="24" y1="278" x2="216" y2="278" stroke="#1c1410" strokeWidth="1" />
          <text x="24" y="302" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700" fill="#1c1410">TOTAL</text>
          <text x="216" y="304" fontSize="22" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410" textAnchor="end">$96.600</text>

          {/* CTA */}
          <rect x="24" y="326" width="192" height="46" rx="12" fill="#c2410c" />
          <text x="120" y="354" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="700" fill="#ffffff" textAnchor="middle">
            Pagar con Nequi
          </text>

          {/* Trust row */}
          <text x="120" y="395" fontSize="8" fontFamily="Inter, sans-serif" fill="#78716c" textAnchor="middle">
            Procesado por Wompi · Bancolombia
          </text>

          {/* Home indicator */}
          <rect x="96" y="430" width="48" height="4" rx="2" fill="#1c1410" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32 wood-grain">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left: Copy */}
          <div className="max-w-2xl fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#e7e5e4] rounded-full text-[12px] font-bold text-[#c2410c] tracking-wide uppercase elev-sm mb-8">
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

          {/* Right: Illustration */}
          <div className="relative fade-in-up" style={{ animationDelay: "0.2s" }}>
             {/* Decorator offset block */}
             <div className="absolute inset-0 -translate-x-6 translate-y-6 bg-[#f5f5f4] border border-[#e7e5e4] rounded-[32px] -z-10" />

             <div className="relative bg-white rounded-[32px] border border-[#e7e5e4] elev-lg overflow-hidden aspect-[4/3]">
                <HeroIllustration />
             </div>

             {/* Floating trust badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-[#e7e5e4] elev-md hidden sm:flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c2410c]/10 rounded-full flex items-center justify-center">
                   <CheckCircle2 className="w-6 h-6 text-[#c2410c]" strokeWidth={2.5} aria-hidden="true" />
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
