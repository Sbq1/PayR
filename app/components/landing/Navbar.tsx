import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
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
              className="text-[14px] font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Empezar
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
