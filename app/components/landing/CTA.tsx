import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="py-24 md:py-32 bg-gray-50 border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
        >
          <motion.h2
            variants={fadeUp}
            className="text-[28px] md:text-[40px] font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight"
          >
            Comienza a agilizar tus cobros
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-5 text-[16px] text-gray-500 max-w-xl mx-auto"
          >
            Implementa nuestra solución en tu restaurante de manera rápida.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 text-[15px] font-medium text-white bg-gray-900 px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
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
  );
}
