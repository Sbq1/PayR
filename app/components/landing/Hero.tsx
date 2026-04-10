import Link from "next/link";
import { motion, MotionValue } from "framer-motion";
import { Sparkles, ArrowRight, ChevronRight, Check } from "lucide-react";

export function Hero({ heroY, heroOpacity }: { heroY: MotionValue<number>; heroOpacity: MotionValue<number> }) {
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
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
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
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-1.5 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-gray-900" />
              Plataforma de pagos rápida
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[36px] md:text-[56px] lg:text-[72px] font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto mb-6 text-gray-900"
          >
            Tus clientes pagan <br className="hidden md:block" /> con un{" "}
            <span className="text-gray-500">
              simple QR
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-[16px] md:text-[20px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Conecta tu sistema, genera un código por mesa y observa cómo tus usuarios
            completan el proceso sin fricción.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 text-[15px] font-medium text-white bg-gray-900 px-7 py-3.5 rounded-lg hover:bg-gray-800 shadow-sm transition-colors w-full sm:w-auto"
              >
                Crear cuenta
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="#como-funciona"
                className="flex items-center justify-center gap-2 text-[15px] font-medium text-gray-600 bg-white border border-gray-200 px-7 py-3.5 rounded-lg hover:bg-gray-50 shadow-sm transition-colors w-full sm:w-auto"
              >
                Ver Demo
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-gray-500"
          >
            {["Rápida integración", "Sin comisiones ocultas"].map(
              (text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-gray-900" />
                  {text}
                </span>
              )
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
