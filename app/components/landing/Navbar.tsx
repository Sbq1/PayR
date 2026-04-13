"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Producto", href: "#historia" },
  { label: "Features", href: "#features" },
  { label: "Precios", href: "#precios" },
];

export function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-gray-200/60 py-3 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)]"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-black text-[13px] tracking-tighter">
                SC
              </span>
            </div>
          </div>
          <span className="font-bold text-[15px] text-gray-900 tracking-tight">
            Smart Checkout
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="group text-[13.5px] font-semibold text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Empezar
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
