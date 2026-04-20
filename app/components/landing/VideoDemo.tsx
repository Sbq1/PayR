"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, Maximize, CreditCard, Check } from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────

type SceneId = "qr" | "cuenta" | "propina" | "pago" | "exito";

type Scene = {
  id: SceneId;
  label: string;
  caption: string;
  durationMs: number;
};

const SCENES: Scene[] = [
  { id: "qr",      label: "01",  caption: "El cliente escanea el QR de su mesa.",             durationMs: 4500 },
  { id: "cuenta",  label: "02",  caption: "Visualiza su cuenta en tiempo real.",              durationMs: 4500 },
  { id: "propina", label: "03",  caption: "Agrega propina voluntaria (Ley 2300 / 2023).",     durationMs: 4500 },
  { id: "pago",    label: "04",  caption: "Paga con Nequi, tarjeta o PSE vía Wompi.",         durationMs: 4500 },
  { id: "exito",   label: "05",  caption: "Mesa cerrada. Factura DIAN emitida por Siigo.",    durationMs: 4500 },
];

const TOTAL_DURATION = SCENES.reduce((acc, s) => acc + s.durationMs, 0);

const formatTimecode = (timeMs: number) => {
  const mins = Math.floor(timeMs / 60000);
  const secs = Math.floor((timeMs % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// ─── HOOKS ────────────────────────────────────────────────

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, duration: number, active: boolean, resetKey: string | number = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    let startTime: number | null = null;
    let frame: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, active, resetKey]);
  return count;
}

// ─── SHARED LAYOUT ────────────────────────────────────────

const sceneFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

// ─── SCENES ───────────────────────────────────────────────

const SceneQR = () => (
  <motion.div {...sceneFade} className="absolute inset-0 bg-[#fdfaf6] flex items-center justify-center">
    <div className="flex flex-col items-center gap-8">
      <div className="bg-white rounded-2xl border border-[#e7e5e4] p-4" style={{ width: 200, height: 200 }}>
        <div className="relative w-full h-full">
          <Image
            src="/qr-mesa-patio.png"
            alt="QR de la mesa"
            fill
            priority
            sizes="200px"
            className="object-contain"
          />
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-semibold tracking-[2px] text-[#78716c] uppercase mb-1">Mesa 04</div>
        <div className="font-serif text-xl text-[#1c1410] font-semibold">La Barra</div>
      </div>
    </div>
  </motion.div>
);

const SceneCuenta = ({ active, loopKey }: { active: boolean; loopKey: number }) => {
  const total = useCountUp(84000, 900, active, loopKey);
  return (
    <motion.div {...sceneFade} className="absolute inset-0 bg-[#f5f5f4] flex justify-center items-center p-8">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-[#e7e5e4] p-7">
        <div className="flex justify-between items-baseline mb-6">
          <h3 className="font-serif text-xl text-[#1c1410] font-semibold">Tu cuenta</h3>
          <span className="text-[10px] font-semibold tracking-[1.5px] text-[#78716c] uppercase">Mesa 04</span>
        </div>
        <div className="space-y-3">
          {[
            ["Bife de chorizo", 20000],
            ["Copa de malbec", 35000],
            ["Agua con gas", 29000],
          ].map(([item, price]) => (
            <div key={item} className="flex justify-between text-sm">
              <span className="text-[#78716c]">{item}</span>
              <span className="text-[#1c1410] tabular-nums font-medium">
                ${(price as number).toLocaleString("es-CO")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-[#e7e5e4] flex justify-between items-baseline">
          <span className="text-[#78716c] text-sm">Total</span>
          <span className="font-serif text-2xl font-semibold text-[#1c1410] tabular-nums">
            ${total.toLocaleString("es-CO")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const ScenePropina = () => (
  <motion.div {...sceneFade} className="absolute inset-0 bg-[#fdfaf6] flex flex-col justify-center items-center p-8">
    <h3 className="font-serif text-2xl text-[#1c1410] mb-8 font-semibold">Propina</h3>
    <div className="grid grid-cols-3 gap-3 w-full max-w-md">
      {[10, 15, 20].map((pct) => {
        const selected = pct === 15;
        return (
          <div
            key={pct}
            className={`flex flex-col items-center justify-center py-5 rounded-xl border ${
              selected
                ? "border-[#c2410c] bg-white"
                : "border-[#e7e5e4] bg-white"
            }`}
          >
            <span className={`text-xl font-semibold ${selected ? "text-[#c2410c]" : "text-[#1c1410]"}`}>
              {pct}%
            </span>
            <span className="text-[11px] text-[#78716c] mt-1 tabular-nums">
              ${(pct * 840).toLocaleString("es-CO")}
            </span>
          </div>
        );
      })}
    </div>
    <div className="mt-8 text-[11px] text-[#78716c] text-center max-w-sm">
      La propina es voluntaria. Ley 2300 de 2023.
    </div>
  </motion.div>
);

const ScenePago = () => (
  <motion.div {...sceneFade} className="absolute inset-0 bg-[#1c1410] flex flex-col justify-center items-center">
    <div className="relative w-14 h-14 mb-8">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/15 border-t-[#c2410c]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <CreditCard className="absolute inset-0 m-auto w-6 h-6 text-white/70" strokeWidth={1.5} />
    </div>
    <div className="text-center">
      <div className="font-serif text-xl text-white font-semibold mb-2">Procesando pago</div>
      <div className="text-[11px] tracking-[2px] text-white/50 uppercase font-semibold">
        Wompi &middot; Bancolombia
      </div>
    </div>
  </motion.div>
);

const SceneExito = ({ active, loopKey }: { active: boolean; loopKey: number }) => {
  const total = useCountUp(96600, 700, active, loopKey);
  return (
    <motion.div {...sceneFade} className="absolute inset-0 bg-[#fdfaf6] flex flex-col justify-center items-center p-8">
      <div className="w-14 h-14 rounded-full bg-[#c2410c] flex items-center justify-center mb-6">
        <Check className="w-7 h-7 text-white" strokeWidth={3} />
      </div>
      <h2 className="font-serif text-2xl text-[#1c1410] font-semibold mb-2">Pago exitoso</h2>
      <div className="text-3xl font-semibold text-[#1c1410] tabular-nums mb-8">
        ${total.toLocaleString("es-CO")}
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {["Mesa cerrada", "Factura DIAN", "Comprobante enviado"].map((chip) => (
          <div
            key={chip}
            className="bg-white border border-[#e7e5e4] px-3 py-1 rounded-full text-[11px] text-[#1c1410] font-medium"
          >
            {chip}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────

export function VideoDemo() {
  const reducedMotion = useReducedMotion();
  const { ref: sectionRef, inView } = useInView<HTMLElement>(0.35);

  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [globalTime, setGlobalTime] = useState(0);
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    if (inView && !userPaused) setIsPlaying(true);
    else if (!inView) setIsPlaying(false);
  }, [inView, userPaused, reducedMotion]);

  useEffect(() => {
    if (!isPlaying) return;
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setGlobalTime((prev) => {
        const next = prev + dt;
        if (next >= TOTAL_DURATION) {
          setLoopCount((c) => c + 1);
          return 0;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const activeIndex = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (globalTime < acc + SCENES[i].durationMs) return i;
      acc += SCENES[i].durationMs;
    }
    return SCENES.length - 1;
  }, [globalTime]);

  const activeScene = SCENES[activeIndex];
  const sceneKey = `${loopCount}-${activeScene.id}`;

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      const next = !p;
      setUserPaused(!next);
      return next;
    });
  }, []);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setGlobalTime(ratio * TOTAL_DURATION);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="demo-video"
      className="w-full py-24 bg-white border-y border-[#e7e5e4]"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <div className="flex flex-col items-center text-center mb-14 space-y-4 max-w-2xl mx-auto">
          <div className="text-[11px] font-semibold tracking-[2px] text-[#c2410c] uppercase">
            Demo del producto
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1c1410] leading-[1.1] font-semibold">
            De la mesa a tu cuenta bancaria en 30 segundos.
          </h2>
          <p className="text-[#78716c] text-base max-w-xl">
            El mismo flujo que vive tu comensal. Integración directa con Wompi y Siigo POS.
          </p>
        </div>

        {/* Video Player */}
        <div className="w-full aspect-video bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden relative">
          {/* Top chrome */}
          <div className="h-10 bg-white border-b border-[#e7e5e4] flex items-center px-4 justify-between select-none z-30 absolute top-0 w-full">
            <div className="text-[11px] font-semibold text-[#1c1410] tracking-wider">
              PayR · Demo
            </div>
            <div className="text-[11px] text-[#78716c] tabular-nums">
              {formatTimecode(globalTime)} / {formatTimecode(TOTAL_DURATION)}
            </div>
          </div>

          {/* Scene frame */}
          <div className="absolute top-10 bottom-[52px] left-0 right-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <div key={sceneKey} className="absolute inset-0">
                {activeScene.id === "qr" && <SceneQR />}
                {activeScene.id === "cuenta" && <SceneCuenta active={isPlaying} loopKey={loopCount} />}
                {activeScene.id === "propina" && <ScenePropina />}
                {activeScene.id === "pago" && <ScenePago />}
                {activeScene.id === "exito" && <SceneExito active={isPlaying} loopKey={loopCount} />}
              </div>
            </AnimatePresence>

            {/* Scene label */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              <div className="text-[10px] font-semibold tracking-[2px] text-[#78716c] uppercase">
                {activeScene.label} &middot; {activeScene.id}
              </div>
            </div>

            {/* Play overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-[1px] group"
                aria-label="Reproducir demo"
              >
                <div className="w-14 h-14 rounded-full bg-[#1c1410] flex items-center justify-center group-hover:bg-[#c2410c] transition-colors">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </button>
            )}
          </div>

          {/* Bottom chrome */}
          <div className="bg-white border-t border-[#e7e5e4] absolute bottom-0 w-full h-[52px] flex flex-col z-30">
            {/* Progress bar */}
            <div
              className="h-[3px] flex gap-[2px] w-full bg-[#f5f5f4] cursor-pointer"
              onClick={seekTo}
            >
              {SCENES.map((scene, i) => {
                const isActive = i === activeIndex;
                const isPast = i < activeIndex;
                const start = SCENES.slice(0, i).reduce((a, b) => a + b.durationMs, 0);
                const progress = isActive ? (globalTime - start) / scene.durationMs : isPast ? 1 : 0;
                return (
                  <div key={scene.id} className="flex-1 h-full relative">
                    <div className="absolute inset-y-0 left-0 bg-[#c2410c]" style={{ width: `${progress * 100}%` }} />
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex-1 px-4 flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="text-[#1c1410] hover:text-[#c2410c] transition-colors"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <div className="flex items-center gap-4 text-[#78716c]">
                <button className="hover:text-[#1c1410] transition-colors" aria-label="Volumen">
                  <Volume2 className="w-4 h-4" strokeWidth={2} />
                </button>
                <button className="hover:text-[#1c1410] transition-colors" aria-label="Pantalla completa">
                  <Maximize className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="mt-8 text-center h-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeScene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[#1c1410] text-base font-medium"
            >
              {activeScene.caption}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
