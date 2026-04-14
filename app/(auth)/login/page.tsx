"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { loginAction } from "./actions";

const inputVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginAction({ email, password });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="show"
    >
      {/* Heading */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="mb-8"
      >
        <h1 className="font-serif text-[32px] font-black tracking-tight text-[#1c1410] mb-2 leading-tight">
          Bienvenido de vuelta 👋
        </h1>
        <p className="text-[15px] text-[#78716c] font-medium">
          Ingresa a tu panel de control de facturación
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              className="flex items-center gap-3 text-[14px] font-medium text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email field */}
        <motion.div custom={0} variants={inputVariants}>
          <label htmlFor="login-email" className="block text-[13px] font-bold text-[#1c1410] mb-2">
            Correo electrónico
          </label>
          <motion.div
            animate={{
              boxShadow: focused === "email"
                ? "0 0 0 3px rgba(194,65,12,0.15), 0 4px 12px rgba(194,65,12,0.08)"
                : "0 1px 2px rgba(0,0,0,0.02)",
              borderColor: focused === "email" ? "#c2410c" : email ? "#d1d5db" : "#e7e5e4",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-[#fcfcff] border rounded-xl px-4 py-3.5 transition-colors"
          >
            <Mail className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-200 ${focused === "email" ? "text-[#c2410c]" : "text-gray-400"}`} />
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              placeholder="tu@restaurante.com"
              required
              autoComplete="email"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#1c1410] placeholder:text-[#a8a29e] font-medium"
            />
          </motion.div>
        </motion.div>

        {/* Password field */}
        <motion.div custom={1} variants={inputVariants}>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="text-[13px] font-bold text-[#1c1410]">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-semibold text-[#78716c] hover:text-[#c2410c] transition-colors"
            >
              ¿Olvidaste tu clave?
            </Link>
          </div>
          <motion.div
            animate={{
              boxShadow: focused === "password"
                ? "0 0 0 3px rgba(194,65,12,0.15), 0 4px 12px rgba(194,65,12,0.08)"
                : "0 1px 2px rgba(0,0,0,0.02)",
              borderColor: focused === "password" ? "#c2410c" : password ? "#d1d5db" : "#e7e5e4",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-[#fcfcff] border rounded-xl px-4 py-3.5 transition-colors"
          >
            <Lock className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-200 ${focused === "password" ? "text-[#c2410c]" : "text-gray-400"}`} />
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#1c1410] placeholder:text-[#a8a29e] font-medium tracking-wide"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-[#c2410c] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </motion.div>
        </motion.div>

        {/* Submit */}
        <motion.div custom={2} variants={inputVariants} className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-[16px] text-white bg-[#c2410c] hover:bg-[#a3360a] shadow-[0_4px_16px_rgba(194,65,12,0.25)] hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        custom={3}
        variants={inputVariants}
        className="mt-8 pt-6 relative"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e7e5e4]" />
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-4 text-[#78716c] font-medium bg-white">¿Aún no tienes cuenta?</span>
        </div>
      </motion.div>

      <motion.div custom={4} variants={inputVariants} className="mt-4 text-center">
        <Link href="/register">
          <span className="inline-block text-[15px] font-bold text-[#1c1410] hover:text-[#c2410c] transition-colors cursor-pointer underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c]">
            Regístrate gratis &rarr;
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
