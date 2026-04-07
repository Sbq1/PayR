import Link from "next/link";
import { QrCode, CreditCard, TrendingUp, Zap, Shield, Clock, Check } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Pago con QR",
    desc: "El cliente escanea, ve su cuenta y paga al instante. Sin apps, sin esperas.",
  },
  {
    icon: CreditCard,
    title: "Todos los metodos",
    desc: "Tarjeta, Nequi, PSE, Bancolombia, Daviplata. El dinero va directo al restaurante.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard KPI",
    desc: "Ventas en tiempo real, ticket promedio, productos top y horas pico.",
  },
  {
    icon: Zap,
    title: "Cross-selling",
    desc: "Sugiere postres, bebidas o extras antes del pago. Aumenta el ticket promedio.",
  },
  {
    icon: Shield,
    title: "Seguro y confiable",
    desc: "Encriptacion AES-256, webhooks validados con HMAC. PCI-DSS via Wompi.",
  },
  {
    icon: Clock,
    title: "Cierre automatico",
    desc: "Al pagar, la mesa se cierra automaticamente en tu POS. Cero errores.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "89.000",
    tables: "5 mesas",
    features: ["Pago QR integrado", "Selector de propina", "Panel admin basico", "Soporte por email"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "149.000",
    tables: "15 mesas",
    features: ["Todo de Starter", "Cross-selling", "Dividir cuenta", "Reportes avanzados"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "249.000",
    tables: "Ilimitadas",
    features: ["Todo de Pro", "Analytics completo", "Soporte prioritario", "API personalizada"],
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Smart Checkout</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="glow-btn text-sm font-semibold bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-bg relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 py-24 md:py-36 text-center relative">
          <div className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Sistema de pago QR para restaurantes
          </div>
          <h1 className="fade-in-up fade-in-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Tus clientes pagan con{" "}
            <span className="gradient-text">un QR</span>, sin esperar al mesero
          </h1>
          <p className="fade-in-up fade-in-up-delay-2 mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Conecta tu POS, genera un QR por mesa y deja que tus clientes paguen solos.
            Mayor rotacion, mejor experiencia, cero errores en el cierre.
          </p>
          <div className="fade-in-up fade-in-up-delay-3 mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="glow-btn pulse-ring inline-flex items-center justify-center text-base font-semibold bg-indigo-500 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/25"
            >
              Empezar gratis
            </Link>
            <Link
              href="#precios"
              className="inline-flex items-center justify-center text-base font-semibold text-gray-700 px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 transition-all"
            >
              Ver planes
            </Link>
          </div>
          <div className="fade-in-up fade-in-up-delay-4 mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-500" /> Sin comisiones</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-500" /> Setup en 10 min</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-500" /> Cancela cuando quieras</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Todo lo que necesitas
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Un sistema completo para modernizar los pagos en tu restaurante
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`glass-card rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 fade-in-up fade-in-up-delay-${Math.min(i + 1, 4)}`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 md:py-32 bg-gray-50/80">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Planes simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Escoge segun el tamano de tu restaurante. Sin letra pequena.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-white ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]"
                    : "bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-semibold bg-indigo-500 text-white px-3 py-1 rounded-full mb-4">
                    Mas popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.tables}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/mes</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Empezar ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold gradient-text">150+</div>
              <p className="text-sm text-gray-500 mt-1">Restaurantes</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold gradient-text">50K+</div>
              <p className="text-sm text-gray-500 mt-1">Transacciones</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold gradient-text">99.9%</div>
              <p className="text-sm text-gray-500 mt-1">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50/50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">SC</span>
            </div>
            <span className="font-semibold text-gray-900">Smart Checkout</span>
          </div>
          <p className="text-sm text-gray-400">
            2026 Smart Checkout. Sistema de pago QR para restaurantes colombianos.
          </p>
        </div>
      </footer>
    </div>
  );
}
