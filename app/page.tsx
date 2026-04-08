"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
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
   ANIMATED COUNTER
   ============================================ */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inViewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(inViewRef, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration: 2,
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
   ANIMATION VARIANTS
   ============================================ */
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ============================================
   DATA
   ============================================ */
const features = [
  {
    icon: QrCode,
    title: "Pago con QR",
    desc: "El cliente escanea, ve su cuenta y paga al instante. Sin apps, sin esperas.",
    accent: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: CreditCard,
    title: "Todos los métodos",
    desc: "Tarjeta, Nequi, PSE, Bancolombia, Daviplata. El dinero va directo al restaurante.",
    accent: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: TrendingUp,
    title: "Dashboard KPI",
    desc: "Ventas en tiempo real, ticket promedio, productos top y horas pico.",
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Zap,
    title: "Cross-selling",
    desc: "Sugiere postres, bebidas o extras antes del pago. Aumenta el ticket promedio.",
    accent: "text-amber-600 bg-amber-50",
  },
  {
    icon: Shield,
    title: "Seguro y confiable",
    desc: "Encriptación AES-256, webhooks validados con HMAC. PCI-DSS vía Wompi.",
    accent: "text-rose-600 bg-rose-50",
  },
  {
    icon: Clock,
    title: "Cierre automático",
    desc: "Al pagar, la mesa se cierra automáticamente en tu POS. Cero errores.",
    accent: "text-purple-600 bg-purple-50",
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
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ========== NAVBAR ========== */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-semibold text-[11px]">SC</span>
            </div>
            <span className="font-semibold text-[15px] text-gray-900">
              Smart Checkout
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Funciones", "Cómo funciona", "Precios"].map((item) => (
              <a
                key={item}
                href={`#${item === "Funciones" ? "funciones" : item === "Cómo funciona" ? "como-funciona" : "precios"}`}
                className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="text-[14px] font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                Empezar gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main>

        {/* ========== HERO ========== */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 relative">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="max-w-[1200px] mx-auto px-6 text-center"
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center"
            >
              {/* Badge */}
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-8">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                  Sistema #1 de pago QR para restaurantes
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto mb-6"
              >
                Tus clientes pagan{" "}
                <br className="hidden md:block" />
                con un{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900">
                  simple QR
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10"
              >
                Conecta tu POS, genera un QR por mesa y observa cómo tus clientes
                pagan en segundos. Sin fricción,{" "}
                <span className="text-gray-900 font-medium">más propinas</span> y cero errores.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 text-[15px] font-medium text-white bg-gray-900 px-7 py-3.5 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
                  >
                    Crear cuenta gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="#como-funciona"
                    className="flex items-center justify-center gap-2 text-[15px] font-medium text-gray-600 bg-white border border-gray-200 px-7 py-3.5 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    Ver Demo
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-gray-400"
              >
                {["Setup en 10 min", "Cero comisiones ocultas", "Cancela cuando quieras"].map(
                  (text) => (
                    <span key={text} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {text}
                    </span>
                  )
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========== STATS BAR ========== */}
        <section className="border-y border-gray-200 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[13px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section id="funciones" className="py-24 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="text-[12px] font-medium text-gray-400 uppercase tracking-widest">
                Características
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-3">
                Todo lo que necesitas,{" "}
                <span className="text-gray-400">sin la complejidad.</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-gray-200 rounded-2xl p-7 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.accent}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[15px] text-gray-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">
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

          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto mb-20"
            >
              <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest">
                Proceso
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-3">
                Tan simple como contar hasta tres
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-16 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px overflow-hidden">
                <motion.div
                  className="h-full bg-gray-700"
                  initial={{ scaleX: 0, transformOrigin: "left" }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 group-hover:border-gray-700 flex items-center justify-center mb-8 relative z-10 transition-colors duration-200">
                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-900 font-bold flex items-center justify-center text-[12px]">
                      {step.number}
                    </span>
                    <step.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-gray-400 leading-relaxed max-w-[260px]">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section id="precios" className="py-24 md:py-32 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="text-[12px] font-medium text-gray-400 uppercase tracking-widest">
                Precios
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-3">
                Invierte en tu crecimiento
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl p-8 relative ${
                    plan.highlighted
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[11px] font-semibold bg-white text-gray-900 px-3 py-1 rounded-full">
                        Más popular
                      </span>
                    </div>
                  )}

                  <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-[13px] mt-1 ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.tables}
                  </p>

                  <div className="my-6">
                    <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                    <span className={`text-[14px] ml-1 ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                      /mes
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-gray-400" : "text-gray-900"}`} />
                        <span className={`text-[14px] ${plan.highlighted ? "text-gray-300" : "text-gray-600"}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Link
                      href="/register"
                      className={`block text-center py-3 rounded-lg font-medium text-[14px] transition-colors ${
                        plan.highlighted
                          ? "bg-white text-gray-900 hover:bg-gray-100"
                          : "bg-gray-900 text-white hover:bg-gray-800"
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
        <section className="py-24 md:py-32 bg-gray-900">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight"
              >
                ¿Listo para dar el siguiente paso?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-5 text-lg text-gray-400 max-w-xl mx-auto"
              >
                Moderniza tu restaurante hoy. Únete a más de 150 restaurantes que confían
                en Smart Checkout.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 text-[15px] font-medium text-gray-900 bg-white px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Crear cuenta gratis
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gray-800 flex items-center justify-center">
                <span className="text-white font-semibold text-[10px]">SC</span>
              </div>
              <span className="text-[14px] font-semibold text-white">Smart Checkout</span>
            </div>
            <div className="flex items-center gap-8 text-[13px] text-gray-500">
              {["Funciones", "Proceso", "Precios"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <p className="text-[13px] text-gray-600">
              © 2026 Smart Checkout
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
