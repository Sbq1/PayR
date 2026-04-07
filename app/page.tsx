"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  stagger,
  animate,
} from "framer-motion";
import {
  QrCode,
  CreditCard,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Check,
  ArrowRight,
  Smartphone,
  Receipt,
  Wallet,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ============================================
   SMOOTH ANIMATED COUNTER
   ============================================ */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inViewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(inViewRef, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        if (ref.current)
          ref.current.textContent = Math.floor(value).toLocaleString("es-CO") + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix]);

  return (
    <div ref={inViewRef}>
      <span ref={ref} className="font-black tabular-nums">
        0{suffix}
      </span>
    </div>
  );
}

/* ============================================
   FLOATING PARTICLES BACKGROUND
   ============================================ */
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.15 + 0.03,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: "-10px",
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -(typeof window !== "undefined" ? window.innerHeight : 900) - 100],
            x: [0, (Math.random() - 0.5) * 120],
            rotate: [0, 360],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================
   STAGGER VARIANTS
   ============================================ */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

/* ============================================
   DATA
   ============================================ */
const features = [
  {
    icon: QrCode,
    title: "Pago con QR",
    desc: "El cliente escanea, ve su cuenta y paga al instante. Sin apps, sin esperas.",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    glow: "rgba(99,102,241,0.12)",
  },
  {
    icon: CreditCard,
    title: "Todos los métodos",
    desc: "Tarjeta, Nequi, PSE, Bancolombia, Daviplata. El dinero va directo al restaurante.",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    glow: "rgba(6,182,212,0.12)",
  },
  {
    icon: TrendingUp,
    title: "Dashboard KPI",
    desc: "Ventas en tiempo real, ticket promedio, productos top y horas pico.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    glow: "rgba(16,185,129,0.12)",
  },
  {
    icon: Zap,
    title: "Cross-selling",
    desc: "Sugiere postres, bebidas o extras antes del pago. Aumenta el ticket promedio.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    glow: "rgba(245,158,11,0.12)",
  },
  {
    icon: Shield,
    title: "Seguro y confiable",
    desc: "Encriptación AES-256, webhooks validados con HMAC. PCI-DSS vía Wompi.",
    color: "bg-rose-50 text-rose-600 border-rose-100",
    glow: "rgba(244,63,94,0.12)",
  },
  {
    icon: Clock,
    title: "Cierre automático",
    desc: "Al pagar, la mesa se cierra automáticamente en tu POS. Cero errores.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
    glow: "rgba(168,85,247,0.12)",
  },
];

const steps = [
  {
    icon: Smartphone,
    title: "Escanea el QR",
    desc: "El cliente escanea el código QR en su mesa con su cámara. Sin apps.",
    number: "01",
  },
  {
    icon: Receipt,
    title: "Ve su cuenta",
    desc: "Aparece la cuenta completa con detalle, impuestos y propinas.",
    number: "02",
  },
  {
    icon: Wallet,
    title: "Paga y listo",
    desc: "Elige su método, confirma y la mesa se cierra sola en el POS.",
    number: "03",
  },
];

const plans = [
  {
    name: "Starter",
    price: "89.000",
    tables: "Hasta 5 mesas",
    features: [
      "Pago QR integrado",
      "Selector de propina",
      "Panel admin básico",
      "Soporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "149.000",
    tables: "Hasta 15 mesas",
    features: [
      "Todo de Starter",
      "Cross-selling",
      "Dividir cuenta",
      "Reportes avanzados",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "249.000",
    tables: "Mesas ilimitadas",
    features: [
      "Todo de Pro",
      "Analytics completo",
      "Soporte prioritario",
      "API personalizada",
    ],
    highlighted: false,
  },
];

const stats = [
  { value: 150, suffix: "+", label: "Restaurantes" },
  { value: 50000, suffix: "+", label: "Transacciones" },
  { value: 99, suffix: "%", label: "Uptime" },
  { value: 15, suffix: "%", label: "Más propinas" },
];

/* ============================================
   COMPONENT
   ============================================ */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress, scrollY } = useScroll();

  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const bgY = useTransform(scrollY, [0, 1200], [0, 300]);

  // Smooth spring progress bar
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">

      {/* ===== SCROLL PROGRESS BAR ===== */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* ===== ANIMATED BACKGROUND ===== */}
      <motion.div className="fixed inset-0 z-0 pointer-events-none" style={{ y: bgY }}>
        <div className="absolute inset-0 gradient-mesh" />
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[30%] right-[-15%] w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -50, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        />
      </motion.div>

      {/* ========== NAVBAR ========== */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
        className={`fixed top-[3px] inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-2xl border-b border-white/30 shadow-[0_4px_40px_rgba(0,0,0,0.06)] py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
              <span className="text-white font-bold text-xs tracking-tight">SC</span>
            </motion.div>
            <span className="font-bold text-[16px] tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
              Smart Checkout
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-md px-2 py-1.5 rounded-full border border-gray-200/60 shadow-sm">
            {["Funciones", "Cómo funciona", "Precios"].map((item) => (
              <motion.a
                key={item}
                href={`#${item === "Funciones" ? "funciones" : item === "Cómo funciona" ? "como-funciona" : "precios"}`}
                className="text-[14px] font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200 px-5 py-2 rounded-full hover:bg-indigo-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-[14px] font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Iniciar sesión
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="relative overflow-hidden text-[14px] font-semibold text-white bg-gray-900 px-5 py-2.5 rounded-xl group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Empezar gratis
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 overflow-x-hidden">

        {/* ========== HERO ========== */}
        <section className="pt-32 pb-24 md:pt-52 md:pb-36 relative min-h-screen flex items-center">
          <FloatingParticles />
          <motion.div
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
            className="max-w-[1200px] mx-auto px-6 text-center w-full"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center"
            >
              {/* Badge */}
              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/80 shadow-sm rounded-full px-4 py-1.5 mb-8 cursor-default"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </span>
                  <Sparkles className="w-3.5 h-3.5" />
                  Sistema #1 de pago QR para restaurantes
                </motion.div>
              </motion.div>

              {/* Title — word-by-word reveal */}
              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl lg:text-[90px] font-extrabold tracking-tight leading-[1.04] max-w-5xl mx-auto mb-8"
              >
                Tus clientes pagan{" "}
                <br className="hidden md:block" />
                con un{" "}
                <motion.span
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  simple QR
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium mb-12"
              >
                Conecta tu POS, genera un QR por mesa y observa cómo tus clientes
                pagan en segundos. Sin fricción,{" "}
                <span className="text-gray-900 font-semibold">más propinas</span> y cero errores.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
              >
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/register"
                    className="group relative flex items-center justify-center gap-2 text-[16px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/25 w-full sm:w-auto"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                    />
                    <span className="relative z-10">Crear cuenta gratis</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="#como-funciona"
                    className="group flex items-center justify-center gap-2 text-[16px] font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 px-8 py-4 rounded-2xl transition-colors duration-300 w-full sm:w-auto"
                  >
                    Ver Demo
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={containerVariants}
                className="flex flex-wrap items-center justify-center gap-3 text-[14px] font-medium text-gray-500"
              >
                {["Setup en 10 min", "Cero comisiones ocultas", "Cancela cuando quieras"].map(
                  (text, i) => (
                    <motion.span
                      key={text}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm cursor-default"
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </motion.div>
                      {text}
                    </motion.span>
                  )
                )}
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              animate={{ y: [0, 10, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Scroll</span>
              <div className="w-5 h-9 rounded-full border-2 border-gray-300 flex items-start justify-center pt-1.5">
                <motion.div
                  className="w-1.5 h-2.5 bg-gray-400 rounded-full"
                  animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========== STATS BAR ========== */}
        <section className="relative">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-2xl border-y border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" />
          <div className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="text-center px-4 py-4 rounded-2xl hover:bg-indigo-50/50 transition-colors duration-300 cursor-default"
                >
                  <div className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-400 mt-2 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section id="funciones" className="py-24 md:py-32 relative">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block text-indigo-600 font-semibold tracking-widest uppercase text-xs mb-4 bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100"
              >
                Características
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mt-4">
                Todo lo que necesitas,{" "}
                <span className="text-gray-400">sin la complejidad.</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    boxShadow: `0 24px 60px ${f.glow}, 0 8px 24px rgba(0,0,0,0.05)`,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                  className="glass-card rounded-3xl p-8 group border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden bg-white/70 backdrop-blur-md cursor-default"
                >
                  {/* Hover gradient sweep */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${f.glow} 0%, transparent 70%)`,
                    }}
                  />

                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border relative z-10 ${f.color}`}
                  >
                    <f.icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="font-bold text-[18px] text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300 relative z-10">
                    {f.title}
                  </h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed relative z-10">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section id="como-funciona" className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-950" />
          {/* Animated radial glow */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(ellipse at 20% 50%, #6366f1 0%, transparent 60%)",
                "radial-gradient(ellipse at 80% 50%, #7c3aed 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 20%, #4f46e5 0%, transparent 60%)",
                "radial-gradient(ellipse at 20% 50%, #6366f1 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl mx-auto mb-24"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block text-indigo-400 font-semibold tracking-widest uppercase text-xs mb-4 bg-indigo-950/80 px-4 py-1 rounded-full border border-indigo-800/60"
              >
                Proceso
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mt-4">
                Tan simple como contar hasta tres
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-16 relative">
              {/* Animated connecting line */}
              <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
                  initial={{ scaleX: 0, transformOrigin: "left" }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Traveling dot */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                  animate={{ left: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
              </div>

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gray-900 border-2 border-gray-700 group-hover:border-indigo-500 flex items-center justify-center mb-8 relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500"
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-black text-white flex items-center justify-center text-sm shadow-lg shadow-indigo-500/30"
                      whileHover={{ scale: 1.1, rotate: 12 }}
                    >
                      {step.number}
                    </motion.span>
                    <step.icon className="w-9 h-9 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[15px] text-gray-400 leading-relaxed max-w-[260px] group-hover:text-gray-300 transition-colors">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section id="precios" className="py-24 md:py-32 relative">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block text-indigo-600 font-semibold tracking-widest uppercase text-xs mb-4 bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100"
              >
                Precios
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mt-4">
                Invierte en tu crecimiento
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    y: plan.highlighted ? -8 : -6,
                    scale: plan.highlighted ? 1.03 : 1.02,
                    transition: { duration: 0.25, ease: "easeOut" },
                  }}
                  className={`rounded-[2rem] p-8 md:p-10 relative overflow-hidden ${
                    plan.highlighted
                      ? "bg-gray-900 text-white shadow-2xl shadow-indigo-500/25 lg:scale-[1.06] z-10 ring-2 ring-indigo-500/40"
                      : "bg-white/80 backdrop-blur-md border border-gray-200/80 shadow-xl shadow-gray-200/40 hover:border-indigo-200/60"
                  }`}
                >
                  {/* Animated highlight shimmer for featured card */}
                  {plan.highlighted && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-transparent"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  {plan.highlighted && (
                    <div className="absolute top-0 right-8 -translate-y-1/2">
                      <motion.span
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="inline-flex items-center gap-1.5 font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30"
                      >
                        ✦ Más Popular
                      </motion.span>
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold relative z-10 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-[15px] mt-2 font-medium relative z-10 ${plan.highlighted ? "text-indigo-300" : "text-gray-500"}`}>
                    {plan.tables}
                  </p>

                  <div className="my-8 relative z-10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tight">${plan.price}</span>
                      <span className={`text-[15px] font-medium ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                        /mes
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 relative z-10">
                    {plan.features.map((f, fi) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + fi * 0.07 }}
                        className="flex items-start gap-3"
                      >
                        <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-indigo-400" : "text-indigo-600"}`} />
                        <span className={`text-[15px] ${plan.highlighted ? "text-gray-300" : "text-gray-600"}`}>
                          {f}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative z-10">
                    <Link
                      href="/register"
                      className={`block text-center py-4 rounded-xl font-bold text-[15px] transition-all duration-300 ${
                        plan.highlighted
                          ? "bg-white text-gray-900 hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                          : "bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
                      }`}
                    >
                      Seleccionar Plan
                    </Link>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="py-24 md:py-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
          {/* Animated grid */}
          <motion.div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Spotlight blob */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.h2
                variants={itemVariants}
                className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight"
              >
                ¿Listo para dar el siguiente paso?
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="mt-6 text-xl text-indigo-100/90 max-w-xl mx-auto font-medium"
              >
                Moderniza tu restaurante hoy. Únete a más de 150 restaurantes que confían
                en Smart Checkout.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-12">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-block"
                >
                  <Link
                    href="/register"
                    className="relative overflow-hidden inline-flex items-center justify-center gap-3 text-[17px] font-bold text-indigo-700 bg-white px-10 py-5 rounded-2xl shadow-2xl shadow-indigo-900/30 group"
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent -skew-x-12"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    />
                    <span className="relative z-10">Crear cuenta gratis</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-950 border-t border-gray-800/60 py-12 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20"
              >
                <span className="text-white font-bold text-xs">SC</span>
              </motion.div>
              <span className="text-[16px] font-bold text-white">Smart Checkout</span>
            </div>
            <div className="flex items-center gap-8 text-[14px] font-medium text-gray-500">
              {["Funciones", "Proceso", "Precios"].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-white transition-colors"
                  whileHover={{ y: -1 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
            <p className="text-[14px] text-gray-600">
              © 2026 Smart Checkout. Hecho con ❤️ en Colombia.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
