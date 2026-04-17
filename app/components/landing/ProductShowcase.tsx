"use client";

import { QrCode, Smartphone, CreditCard } from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Phone triptych — 3 stages of the checkout flow, inline SVG.
   ────────────────────────────────────────────────────────────── */
function Phone({ x, y, children, highlighted = false }: { x: number; y: number; children: React.ReactNode; highlighted?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Glow behind highlighted phone */}
      {highlighted && (
        <ellipse cx="100" cy="210" rx="150" ry="200" fill="#c2410c" opacity="0.08" />
      )}
      <rect width="200" height="420" rx="32" fill="#1c1410" />
      <rect x="6" y="6" width="188" height="408" rx="28" fill="#fdfaf6" />
      {/* Dynamic island */}
      <rect x="75" y="14" width="50" height="14" rx="7" fill="#1c1410" />
      {children}
    </g>
  );
}

function TriptychIllustration() {
  return (
    <svg
      viewBox="0 0 960 540"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Tres pantallas móviles mostrando el flujo de PayR: escaneo del QR, revisión de la cuenta, y confirmación del pago"
      className="w-full h-full"
    >
      <g aria-hidden="true">
        {/* Background */}
        <rect width="960" height="540" fill="#f5f5f4" />
        <line x1="0" y1="450" x2="960" y2="450" stroke="#e7e5e4" strokeWidth="1" />

        {/* Step labels */}
        <text x="160" y="500" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" textAnchor="middle" letterSpacing="1.5">1 · ESCANEÁ</text>
        <text x="480" y="500" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill="#c2410c" textAnchor="middle" letterSpacing="1.5">2 · REVISÁ</text>
        <text x="800" y="500" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" textAnchor="middle" letterSpacing="1.5">3 · PAGÁ</text>

        {/* ── Phone 1: Scanner ── */}
        <Phone x={60} y={60}>
          <text x="100" y="55" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" textAnchor="middle" letterSpacing="1">APUNTÁ AL QR</text>

          {/* Viewfinder frame */}
          <rect x="40" y="100" width="120" height="120" rx="8" fill="none" stroke="#c2410c" strokeWidth="2" strokeDasharray="8 4" />

          {/* Corner brackets */}
          {[[40, 100, 0], [160, 100, 1], [40, 220, 2], [160, 220, 3]].map(([cx, cy, rot], i) => (
            <path
              key={i}
              d="M 0 -8 L 0 0 L 8 0"
              transform={`translate(${cx} ${cy}) rotate(${(rot as number) * 90})`}
              stroke="#c2410c"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* Visible QR inside viewfinder */}
          <rect x="60" y="120" width="80" height="80" fill="#ffffff" />
          <g fill="#1c1410">
            {[
              [0, 0, 3, 3], [5, 0, 3, 3], [0, 5, 3, 3],
              [4, 4, 1, 1], [5, 5, 1, 1], [6, 6, 2, 2],
              [3, 0, 1, 1], [0, 4, 1, 1], [2, 3, 1, 1],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={62 + x * 9.5} y={122 + y * 9.5} width={w * 9.5 - 1} height={h * 9.5 - 1} />
            ))}
          </g>

          <text x="100" y="260" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1c1410" textAnchor="middle">Mesa detectada</text>
          <text x="100" y="278" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c" textAnchor="middle">La Barra · Mesa 04</text>

          {/* CTA */}
          <rect x="20" y="320" width="160" height="40" rx="10" fill="#1c1410" />
          <text x="100" y="345" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700" fill="#ffffff" textAnchor="middle">Ver mi cuenta</text>
        </Phone>

        {/* ── Phone 2: Bill Review (highlighted) ── */}
        <Phone x={380} y={60} highlighted>
          <text x="16" y="55" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" letterSpacing="1">TU CUENTA</text>
          <text x="16" y="75" fontSize="14" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410">Mesa 04</text>

          <line x1="16" y1="90" x2="184" y2="90" stroke="#e7e5e4" strokeWidth="1" />
          {[
            ["Hamburguesa", "$42.000"],
            ["Cerveza ×3", "$27.000"],
            ["Postre", "$15.000"],
          ].map(([name, price], i) => (
            <g key={i}>
              <text x="16" y={110 + i * 18} fontSize="10" fontFamily="Inter, sans-serif" fill="#1c1410">{name}</text>
              <text x="184" y={110 + i * 18} fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1c1410" textAnchor="end">{price}</text>
            </g>
          ))}

          {/* Tip selector */}
          <text x="16" y="190" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" fill="#78716c" letterSpacing="1">PROPINA</text>
          {["10%", "15%", "20%"].map((label, i) => {
            const active = i === 1;
            return (
              <g key={i}>
                <rect x={16 + i * 58} y="200" width="52" height="34" rx="8" fill={active ? "#c2410c" : "#ffffff"} stroke={active ? "#c2410c" : "#e7e5e4"} strokeWidth="1" />
                <text x={42 + i * 58} y="222" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill={active ? "#ffffff" : "#1c1410"} textAnchor="middle">{label}</text>
              </g>
            );
          })}

          {/* Totals */}
          <line x1="16" y1="256" x2="184" y2="256" stroke="#1c1410" strokeWidth="1" />
          <text x="16" y="278" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#1c1410">TOTAL</text>
          <text x="184" y="280" fontSize="18" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410" textAnchor="end">$96.600</text>

          {/* Split + Pay */}
          <rect x="16" y="298" width="76" height="36" rx="8" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1" />
          <text x="54" y="320" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1c1410" textAnchor="middle">Dividir</text>

          <rect x="100" y="298" width="84" height="36" rx="8" fill="#c2410c" />
          <text x="142" y="320" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#ffffff" textAnchor="middle">Pagar</text>
        </Phone>

        {/* ── Phone 3: Success ── */}
        <Phone x={700} y={60}>
          {/* Success check */}
          <circle cx="100" cy="150" r="40" fill="#c2410c" opacity="0.1" />
          <circle cx="100" cy="150" r="28" fill="#c2410c" />
          <path d="M 88 150 L 96 158 L 112 142" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          <text x="100" y="210" fontSize="15" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410" textAnchor="middle">Pago aprobado</text>
          <text x="100" y="240" fontSize="24" fontFamily="Fraunces, serif" fontWeight="700" fill="#1c1410" textAnchor="middle">$96.600</text>
          <text x="100" y="260" fontSize="10" fontFamily="Inter, sans-serif" fill="#78716c" textAnchor="middle">vía Nequi · Ref #A48291</text>

          <line x1="30" y1="285" x2="170" y2="285" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="2 3" />

          {/* Receipt row */}
          <rect x="20" y="300" width="160" height="44" rx="10" fill="#fdfaf6" stroke="#e7e5e4" strokeWidth="1" />
          <circle cx="40" cy="322" r="10" fill="#c2410c" opacity="0.15" />
          <text x="40" y="326" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#c2410c" textAnchor="middle">DIAN</text>
          <text x="58" y="318" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" fill="#1c1410">Comprobante</text>
          <text x="58" y="332" fontSize="8" fontFamily="Inter, sans-serif" fill="#78716c">Enviado a Siigo ✓</text>

          {/* Close */}
          <rect x="20" y="358" width="160" height="36" rx="8" fill="#1c1410" />
          <text x="100" y="380" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill="#ffffff" textAnchor="middle">Cerrar</text>
        </Phone>
      </g>
    </svg>
  );
}

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
           <div className="bg-gradient-to-b from-[#fdfaf6] to-[#f5f5f4] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default card-lift elev-sm">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] elev-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <QrCode className="w-8 h-8 text-[#1c1410]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">1. Escanean el QR</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Cada mesa tiene un código o NFC estático asociado a la comanda activa de tu POS Siigo.
              </p>
           </div>

           {/* Step 2 */}
           <div className="bg-gradient-to-b from-[#fdfaf6] to-[#f5f5f4] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default card-lift elev-sm">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] elev-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Smartphone className="w-8 h-8 text-[#c2410c]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">2. Revisan el consumo</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Ven la factura en vivo. Aplican propina recomendada, o bien deciden dividir la cuenta entre sus amigos.
              </p>
           </div>

           {/* Step 3 */}
           <div className="bg-gradient-to-b from-[#fdfaf6] to-[#f5f5f4] border border-[#e7e5e4] rounded-[24px] p-8 flex flex-col items-center text-center group cursor-default card-lift elev-sm">
              <div className="w-16 h-16 bg-white border border-[#e7e5e4] elev-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <CreditCard className="w-8 h-8 text-[#1c1410]" />
              </div>
              <h3 className="font-serif text-[22px] font-bold text-[#1c1410] mb-3">3. Pagan instantáneo</h3>
              <p className="text-[15px] text-[#78716c] leading-relaxed">
                 Usan Nequi, PSE, Tarjeta o Apple Pay (vía Wompi). El comprobante viaja directamente a tu base de datos y la DIAN.
              </p>
           </div>
        </div>

        {/* Triptych illustration */}
        <div className="mt-20 flex justify-center fade-in-up">
           <div className="w-full max-w-4xl aspect-[16/9] bg-[#f5f5f4] border border-[#e7e5e4] rounded-[32px] overflow-hidden elev-lg">
              <TriptychIllustration />
           </div>
        </div>
      </div>
    </section>
  );
}
