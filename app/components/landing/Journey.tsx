"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Smartphone, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    id: 1,
    label: "Paso 01",
    title: "La cuenta llega al cliente",
    desc: "Cuando el mesero cierra el pedido en el POS, la cuenta aparece en un QR único por mesa. El cliente escanea y ve cada ítem, impuesto y total en su propio teléfono.",
    icon: Receipt,
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },
  {
    id: 2,
    label: "Paso 02",
    title: "Pago en 30 segundos",
    desc: "El cliente elige método — Nequi, Daviplata, tarjeta — deja propina si quiere, divide la cuenta si van en grupo, y paga sin levantarse. Cada método se procesa por Wompi.",
    icon: Smartphone,
    accent: "from-violet-500 via-fuchsia-500 to-pink-500",
  },
  {
    id: 3,
    label: "Paso 03",
    title: "Cierre automático",
    desc: "El webhook confirma el pago, la mesa cambia a disponible, el POS se sincroniza, y el mesero recibe la notificación. Sin cuadrar caja, sin firmas en papel.",
    icon: CheckCircle2,
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
  },
];

export function Journey() {
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));

      setProgress(p);

      if (p < 0.33) setActiveStep(1);
      else if (p < 0.66) setActiveStep(2);
      else setActiveStep(3);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="historia"
      ref={containerRef}
      className="relative bg-white border-t border-gray-100"
    >
      {/* Desktop: sticky scroll-driven */}
      <div className="h-[280vh] hidden lg:block">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="max-w-[1280px] mx-auto w-full px-6 grid grid-cols-[1fr_1.15fr] gap-16 items-center">
            {/* LEFT — text stack with progress */}
            <div className="relative flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-8">
                La experiencia completa
              </span>
              <h2 className="text-[40px] xl:text-[52px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900 mb-12 max-w-[480px]">
                Del POS a la mesa.
                <br />
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Sin pasos manuales.
                </span>
              </h2>

              <div className="relative flex gap-5 pl-1">
                {/* Vertical progress bar */}
                <div className="relative w-[3px] mt-2 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 rounded-full bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500 transition-[height] duration-300 ease-out"
                    style={{ height: `${progress * 100}%` }}
                  />
                </div>

                <div className="flex flex-col gap-12">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`max-w-[440px] transition-opacity duration-500 ${
                        activeStep === step.id ? "opacity-100" : "opacity-30"
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        {step.label}
                      </p>
                      <h3 className="text-[28px] font-bold tracking-tight text-gray-900 mb-3 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-[15px] text-gray-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — visual (single active at a time) */}
            <div className="relative h-[560px] flex items-center justify-center">
              {/* Glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 flex items-center justify-center"
              >
                <div
                  className={`w-[440px] h-[440px] rounded-full bg-gradient-to-br transition-all duration-700 ${
                    steps[activeStep - 1].accent
                  } opacity-25 blur-3xl`}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {activeStep === 1 && <Visual1 />}
                  {activeStep === 2 && <Visual2 />}
                  {activeStep === 3 && <Visual3 />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal snap cards */}
      <div className="lg:hidden py-20">
        <div className="px-6 mb-10">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            La experiencia completa
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900">
            Del POS a la mesa.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Sin pasos manuales.
            </span>
          </h2>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-10 [&::-webkit-scrollbar]:hidden">
          {steps.map((step) => (
            <MobileStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Visual 1: POS → QR ────────────────────────────────────────────

function Visual1() {
  return (
    <div className="relative w-full max-w-[540px] h-[500px]">
      <div className="absolute top-[60px] left-0 w-[280px] rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-900">
            Siigo POS
          </span>
          <span className="text-[10px] font-medium text-emerald-500">
            ● EN LÍNEA
          </span>
        </div>
        <div className="p-4 space-y-2">
          {[
            { name: "Hamburguesa artesanal", qty: 2, price: "$28.000" },
            { name: "Cerveza Club", qty: 3, price: "$9.000" },
            { name: "Postre casa", qty: 1, price: "$15.000" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-1.5 text-[11px]"
            >
              <span className="text-gray-700">
                {item.qty}× {item.name}
              </span>
              <span className="text-gray-900 font-medium tabular-nums">
                {item.price}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900 tabular-nums">$84.500</span>
          </div>
        </div>
      </div>

      {/* Arrow SVG */}
      <svg
        className="absolute top-[190px] left-[260px] z-20"
        width="80"
        height="40"
        viewBox="0 0 80 40"
        fill="none"
      >
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <path
          d="M 4 20 Q 40 10 76 20"
          stroke="url(#flow-grad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="76" cy="20" r="3" fill="#d946ef" />
      </svg>

      <div className="absolute top-[20px] right-0 w-[220px] rounded-3xl bg-gray-900 p-2 shadow-[0_30px_60px_-20px_rgba(139,92,246,0.4)]">
        <div className="rounded-[20px] bg-white overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[10px] font-medium text-gray-900">
            <span>9:41</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-gray-900" />
              <span className="w-1 h-1 rounded-full bg-gray-900" />
              <span className="w-1 h-1 rounded-full bg-gray-900" />
            </span>
          </div>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
            <span className="text-[11px] font-semibold text-gray-900">
              La Barra · M05
            </span>
          </div>
          <div className="px-4 py-6 flex flex-col items-center">
            <div className="w-[130px] h-[130px] rounded-xl border border-gray-200 p-3 mb-2 relative">
              <QrGraphic />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">
              Total
            </span>
            <span className="text-[18px] font-bold text-gray-900 tabular-nums">
              $84.500
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visual 2: client phone + merchant dashboard ──────────────────

function Visual2() {
  return (
    <div className="relative w-full max-w-[620px] h-[500px] tilt-stage">
      {/* Floating accent dots */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <span className="absolute top-[10%] left-[45%] w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 blur-[1px] float-a opacity-70" />
        <span className="absolute bottom-[15%] right-[40%] w-2.5 h-2.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 blur-[1px] float-b opacity-60" />
        <span className="absolute top-[50%] left-[5%] w-1.5 h-1.5 rounded-full bg-violet-500 float-c opacity-70" style={{ animationDelay: "1s" }} />
      </div>

      {/* Client phone — left, tilted towards center */}
      <div
        className="absolute top-[20px] left-0 w-[250px] rounded-[36px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-[8px] tilt-phone-left"
        style={{
          boxShadow:
            "0 50px 100px -20px rgba(217,70,239,0.4), 0 30px 60px -20px rgba(99,102,241,0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)",
        }}
      >
        <div className="relative rounded-[28px] bg-white overflow-hidden">
          {/* Dynamic island */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-30 w-[72px] h-[20px] rounded-full bg-black" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-[9px] font-semibold text-gray-900">
            <span>9:41</span>
            <span className="flex items-center gap-0.5">
              <span className="flex items-end gap-[1px] h-2">
                <span className="w-[2px] h-[3px] rounded-[1px] bg-gray-900" />
                <span className="w-[2px] h-[5px] rounded-[1px] bg-gray-900" />
                <span className="w-[2px] h-[6.5px] rounded-[1px] bg-gray-900" />
                <span className="w-[2px] h-[8px] rounded-[1px] bg-gray-900" />
              </span>
              <span className="w-5 h-2 rounded-[2px] border border-gray-900/80 relative ml-0.5">
                <span className="absolute inset-[1px] rounded-[1px] bg-gray-900" style={{ width: "70%" }} />
              </span>
            </span>
          </div>

          {/* URL bar */}
          <div className="px-3 pt-2 pb-2">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1">
              <svg width="9" height="9" viewBox="0 0 9 9" className="text-gray-500 shrink-0">
                <path d="M7 4V3a2.5 2.5 0 00-5 0v1M1.5 4h6v4.5h-6z" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>
              <span className="text-[8.5px] text-gray-600 truncate">
                smart-checkout.co/la-barra
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="px-4 pt-2 pb-3">
            <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
              Total a pagar
            </p>
            <p className="text-[26px] font-[900] text-gray-900 tabular-nums leading-none">
              $84.500
            </p>
          </div>

          {/* Payment method list */}
          <div className="px-4 pb-3 space-y-1.5">
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Método de pago
            </p>
            {[
              { name: "Nequi", logo: "N", color: "bg-fuchsia-500", selected: true, badge: "Recomendado" },
              { name: "Daviplata", logo: "D", color: "bg-red-500", selected: false, badge: null },
              { name: "Tarjeta", logo: "T", color: "bg-gray-900", selected: false, badge: null },
            ].map((method) => (
              <div
                key={method.name}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  method.selected
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className={`w-6 h-6 rounded-md ${method.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {method.logo}
                </div>
                <span className="text-[10.5px] font-semibold text-gray-900 flex-1">
                  {method.name}
                </span>
                {method.badge && (
                  <span className="text-[8px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                    {method.badge}
                  </span>
                )}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                    method.selected ? "border-violet-500 bg-violet-500" : "border-gray-300"
                  } flex items-center justify-center shrink-0`}
                >
                  {method.selected && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
            ))}
          </div>

          {/* Pay CTA */}
          <div className="px-4 pb-4">
            <button className="relative w-full py-2.5 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
              <span className="relative text-white text-[11px] font-bold">
                Pagar con Nequi
              </span>
            </button>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-1.5">
            <div className="w-[70px] h-[3px] rounded-full bg-gray-900/80" />
          </div>
        </div>
      </div>

      {/* Signal arrow — phone → dashboard with traveling particle */}
      <svg
        className="absolute top-[220px] left-[240px] z-20"
        width="140"
        height="60"
        viewBox="0 0 140 60"
        fill="none"
      >
        <defs>
          <linearGradient id="j2-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <radialGradient id="j2-dot-glow">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="40%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M 4 30 Q 70 0 136 30"
          stroke="url(#j2-flow)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <circle cx="4" cy="30" r="3" fill="#a855f7" />
        <circle cx="136" cy="30" r="3" fill="#ec4899" />
        {/* Traveling particle */}
        <circle r="4" fill="url(#j2-dot-glow)">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M 4 30 Q 70 0 136 30"
            rotate="auto"
          />
        </circle>
        <circle r="6" fill="#ec4899" opacity="0.25">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M 4 30 Q 70 0 136 30"
          />
        </circle>
      </svg>

      {/* Merchant dashboard — right, tilted towards phone */}
      <div
        className="absolute top-[60px] right-0 w-[310px] rounded-2xl bg-white border border-gray-200 overflow-hidden tilt-phone-right"
        style={{
          boxShadow:
            "0 50px 100px -20px rgba(236,72,153,0.3), 0 30px 60px -20px rgba(99,102,241,0.15), 0 20px 40px -16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Window chrome */}
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 mx-2 h-4 rounded bg-gray-50 flex items-center px-2">
            <span className="text-[8px] text-gray-400">
              app.smart-checkout.co/dashboard
            </span>
          </div>
        </div>

        {/* Live notification — highlighted */}
        <div className="relative px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-900">
                  Pago recibido
                </p>
                <span className="text-[9px] text-gray-400">hace 2s</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Mesa 05 · Nequi · $84.500
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                  APPROVED
                </span>
                <span className="text-[9px] text-gray-400">
                  Ref: INV-2847
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Older notifications */}
        <div className="px-4 py-2 space-y-2">
          {[
            { table: "Mesa 08", method: "Daviplata", amount: "$46.200", time: "1m" },
            { table: "Mesa 03", method: "Tarjeta", amount: "$92.100", time: "3m" },
            { table: "Mesa 07", method: "PSE", amount: "$28.500", time: "5m" },
          ].map((n) => (
            <div
              key={n.table}
              className="flex items-center gap-2.5 py-1.5"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-medium text-gray-900">
                    {n.table} · {n.method}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-gray-700 tabular-nums font-medium">
                    {n.amount}
                  </span>
                  <span className="text-[9px] text-gray-400 w-6 text-right">
                    {n.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
            Actividad reciente
          </span>
          <span className="text-[9px] text-violet-600 font-semibold">Ver todo →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Visual 3: dashboard + sync ───────────────────────────────────

function Visual3() {
  const tables = [
    { n: 1, status: "AVAILABLE" },
    { n: 2, status: "OCCUPIED" },
    { n: 3, status: "AVAILABLE" },
    { n: 4, status: "PAYING" },
    { n: 5, status: "AVAILABLE", changed: true },
    { n: 6, status: "OCCUPIED" },
    { n: 7, status: "AVAILABLE" },
    { n: 8, status: "OCCUPIED" },
  ];

  return (
    <div className="relative w-full max-w-[540px] h-[500px]">
      <div className="absolute top-[40px] left-0 right-0 mx-auto w-[440px] rounded-2xl border border-gray-200 bg-white shadow-[0_30px_60px_-20px_rgba(16,185,129,0.3)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-gray-900">
              Estado de mesas
            </p>
            <p className="text-[10px] text-gray-400">Actualizado en vivo</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            8 mesas activas
          </div>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2">
          {tables.map((t) => (
            <div
              key={t.n}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold ${
                t.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : t.status === "PAYING"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {t.changed && (
                <span className="absolute inset-0 rounded-lg border-2 border-emerald-400 animate-ping" />
              )}
              <span className="text-[14px] font-bold text-gray-900">
                M{t.n.toString().padStart(2, "0")}
              </span>
              <span className="text-[8px] uppercase tracking-wide mt-0.5">
                {t.status === "AVAILABLE"
                  ? "Libre"
                  : t.status === "PAYING"
                    ? "Pagando"
                    : "Ocupada"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-4 right-8 w-[220px] rounded-xl border border-white/60 bg-white/95 backdrop-blur-md shadow-[0_16px_40px_-12px_rgba(16,185,129,0.4)] p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-900">
            Mesa 05 cerrada
          </p>
          <p className="text-[10px] text-gray-500">
            Sincronizada con Siigo · hace 2s
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 backdrop-blur-md px-4 py-2 shadow-sm">
        <svg
          className="w-3.5 h-3.5 text-emerald-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="42"
            strokeDashoffset="10"
          />
        </svg>
        <span className="text-[11px] font-medium text-gray-700">
          Sincronizando POS → Wompi → Dashboard
        </span>
      </div>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────

function MobileStepCard({ step }: { step: (typeof steps)[number] }) {
  const Icon = step.icon;
  return (
    <div className="min-w-[88vw] sm:min-w-[420px] snap-center">
      <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-7 overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute -top-14 -right-14 h-40 w-40 rounded-full bg-gradient-to-br ${step.accent} opacity-20 blur-2xl`}
        />
        <div
          className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} text-white items-center justify-center mb-5 shadow-sm`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          {step.label}
        </p>
        <h3 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">
          {step.title}
        </h3>
        <p className="text-[14px] text-gray-500 leading-relaxed">
          {step.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Decorative QR graphic ────────────────────────────────────────

function QrGraphic() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" fill="white" />
      {[
        [0, 0],
        [0, 70],
        [70, 0],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 2} y={y + 2} width="26" height="26" fill="#111827" />
          <rect x={x + 6} y={y + 6} width="18" height="18" fill="white" />
          <rect x={x + 10} y={y + 10} width="10" height="10" fill="#111827" />
        </g>
      ))}
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (i * 7) % 60;
        const y = Math.floor((i * 7) / 60) * 6 + 32;
        if (y > 96 || x < 32) return null;
        return (
          <rect
            key={i}
            x={x + 32}
            y={y}
            width="3.5"
            height="3.5"
            fill="#111827"
          />
        );
      })}
      {Array.from({ length: 30 }).map((_, i) => (
        <rect
          key={`r-${i}`}
          x={((i * 5) % 28) + 2}
          y={Math.floor((i * 5) / 28) * 5 + 32}
          width="3"
          height="3"
          fill="#111827"
        />
      ))}
    </svg>
  );
}
