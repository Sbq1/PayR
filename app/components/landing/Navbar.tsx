"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar({ scrolled }: { scrolled: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-[#fdfaf6]/90 backdrop-blur-md border-[#e7e5e4] elev-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex lg:flex-1">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                {/* Logo Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                  <span className="font-serif font-bold text-lg leading-none -translate-y-px">P</span>
                </div>
                <span className="font-serif font-bold text-[22px] tracking-tight text-foreground">
                  PayR
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex lg:gap-x-10">
              <Link href="#producto" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">
                Producto
              </Link>
              <Link href="#features" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">
                Características
              </Link>
              <Link href="#como-funciona" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">
                Cómo funciona
              </Link>
              <Link href="/pricing" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">
                Precios
              </Link>
            </nav>

            {/* Desktop Auth */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-6">
              <Link
                href="/login"
                className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-bold text-white bg-primary rounded-xl overflow-hidden btn-lift"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  Empezar gratis <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Abrir menú principal</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-foreground/10"
            >
              <div className="flex items-center justify-between h-8 mb-6">
                <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                   <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                      <span className="font-serif font-bold text-lg leading-none -translate-y-px">P</span>
                   </div>
                   <span className="font-serif font-bold text-xl text-foreground">PayR</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Cerrar menú</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-border">
                  <div className="space-y-2 py-6">
                    {["Producto", "Características", "Cómo funciona"].map((item) => (
                      <Link
                        key={item}
                        href={`#${item.toLowerCase().replace(" ", "-")}`}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item}
                      </Link>
                    ))}
                    <Link
                      href="/pricing"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Precios
                    </Link>
                  </div>
                  <div className="py-6 flex flex-col gap-4">
                    <Link
                      href="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Ingresar
                    </Link>
                    <Link
                      href="/register"
                      className="w-full text-center rounded-xl bg-primary px-3 py-3.5 text-base font-bold text-white shadow-sm hover:opacity-90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Empezar gratis
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
