"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loginAction } from "./actions";

const inputVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
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
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
        className="mb-8"
      >
        <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-2">
          Bienvenido de vuelta 👋
        </h1>
        <p className="text-[15px] text-gray-500 font-medium">
          Ingresa a tu panel de control
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-3 text-[14px] font-medium text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email field */}
        <motion.div custom={0} variants={inputVariants}>
          <label htmlFor="login-email" className="block text-[13px] font-semibold text-gray-600 mb-1.5">
            Correo electrónico
          </label>
          <motion.div
            animate={{
              boxShadow: focused === "email"
                ? "0 0 0 3px rgba(99,102,241,0.15), 0 4px 12px rgba(99,102,241,0.08)"
                : "0 1px 3px rgba(0,0,0,0.04)",
              borderColor: focused === "email" ? "#6366f1" : email ? "#d1d5db" : "#e5e7eb",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3 transition-colors"
          >
            <Mail className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-200 ${focused === "email" ? "text-indigo-500" : "text-gray-400"}`} />
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
              className="flex-1 bg-transparent outline-none text-[14px] text-gray-900 placeholder:text-gray-400 font-medium"
            />
          </motion.div>
        </motion.div>

        {/* Password field */}
        <motion.div custom={1} variants={inputVariants}>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-[13px] font-semibold text-gray-600">
              Contraseña
            </label>
            <span
              className="text-[12px] font-semibold text-gray-400 cursor-default"
              title="Próximamente"
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
          <motion.div
            animate={{
              boxShadow: focused === "password"
                ? "0 0 0 3px rgba(99,102,241,0.15), 0 4px 12px rgba(99,102,241,0.08)"
                : "0 1px 3px rgba(0,0,0,0.04)",
              borderColor: focused === "password" ? "#6366f1" : password ? "#d1d5db" : "#e5e7eb",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3"
          >
            <Lock className={`w-4.5 h-4.5 flex-shrink-0 transition-colors duration-200 ${focused === "password" ? "text-indigo-500" : "text-gray-400"}`} />
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
              className="flex-1 bg-transparent outline-none text-[14px] text-gray-900 placeholder:text-gray-400 font-medium"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={showPassword ? "eye-off" : "eye"}
                  initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Submit */}
        <motion.div custom={2} variants={inputVariants}>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="w-full mt-2 py-3.5 rounded-xl font-bold text-[15px] text-white overflow-hidden relative shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
            {/* Button shimmer */}
            {!loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </motion.span>
                ) : (
                  <motion.span
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Iniciar sesión
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        custom={3}
        variants={inputVariants}
        className="mt-8 pt-6 relative"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-4 text-gray-400 bg-white rounded">¿No tienes cuenta?</span>
        </div>
      </motion.div>

      <motion.div custom={4} variants={inputVariants} className="mt-4 text-center">
        <Link href="/register">
          <motion.span
            whileHover={{ scale: 1.03 }}
            className="inline-block text-[14px] font-bold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Regístrate gratis →
          </motion.span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
