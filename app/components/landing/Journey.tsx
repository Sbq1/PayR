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

// ─── Visual 2: payment methods ────────────────────────────────────

function Visual2() {
  return (
    <div className="relative w-full max-w-[540px] h-[500px]">
      <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[260px] rounded-[32px] bg-gray-900 p-2 shadow-[0_30px_60px_-20px_rgba(217,70,239,0.4)]">
        <div className="rounded-[24px] bg-white overflow-hidden">
          <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-medium text-gray-900">
            <span>9:41</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-gray-900" />
              <span className="w-1 h-1 rounded-full bg-gray-900" />
              <span className="w-1 h-1 rounded-full bg-gray-900" />
            </span>
          </div>
          <div className="px-5 pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
              Total a pagar
            </p>
            <p className="text-[32px] font-[900] text-gray-900 tabular-nums mb-4">
              $84.500
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                Método
              </p>
              {[
                { name: "Nequi", badge: "Recomendado", selected: true },
                { name: "Daviplata", badge: null, selected: false },
                { name: "Tarjeta de crédito", badge: null, selected: false },
              ].map((method) => (
                <div
                  key={method.name}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    method.selected
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        method.selected
                          ? "border-violet-500 bg-violet-500"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {method.selected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-gray-900">
                      {method.name}
                    </span>
                  </div>
                  {method.badge && (
                    <span className="text-[9px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                      {method.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[12px] font-bold">
              Confirmar pago
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-[220px] left-0 w-[180px] rounded-xl border border-gray-200 bg-white shadow-[0_16px_40px_-16px_rgba(217,70,239,0.3)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">
            ÷
          </div>
          <p className="text-[11px] font-semibold text-gray-900">
            Dividir cuenta
          </p>
        </div>
        <div className="space-y-1.5">
          {["Ana", "Carlos", "Sofía"].map((name) => (
            <div
              key={name}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="text-gray-600">{name}</span>
              <span className="text-gray-900 font-medium tabular-nums">
                $28.166
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-[60px] right-0 w-[150px] rounded-xl border border-gray-200 bg-white shadow-[0_16px_40px_-16px_rgba(217,70,239,0.3)] p-3">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Propina
        </p>
        <div className="flex gap-1">
          {["5%", "10%", "15%"].map((t) => (
            <div
              key={t}
              className={`flex-1 py-1.5 rounded-md text-center text-[10px] font-semibold ${
                t === "10%"
                  ? "bg-fuchsia-500 text-white"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              {t}
            </div>
          ))}
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
