"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("No pudimos procesar tu solicitud. Intenta más tarde.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="font-serif text-[28px] font-black text-[#1c1410] mb-2 leading-tight">
            Revisa tu correo
          </h1>
          <p className="text-[15px] text-[#78716c] font-medium leading-relaxed">
            Si el email existe en nuestro sistema, recibirás un enlace para
            restablecer tu contraseña. El enlace vence en 1 hora.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-[15px] font-bold text-[#1c1410] hover:text-[#c2410c] transition-colors underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c]"
        >
          &larr; Volver a iniciar sesión
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="font-serif text-[32px] font-black tracking-tight text-[#1c1410] mb-2 leading-tight">
          ¿Olvidaste tu clave?
        </h1>
        <p className="text-[15px] text-[#78716c] font-medium">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-[14px] font-medium text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label
            htmlFor="fp-email"
            className="block text-[13px] font-bold text-[#1c1410] mb-2"
          >
            Correo electrónico
          </label>
          <motion.div
            animate={{
              boxShadow: focused
                ? "0 0 0 3px rgba(194,65,12,0.15), 0 4px 12px rgba(194,65,12,0.08)"
                : "0 1px 2px rgba(0,0,0,0.02)",
              borderColor: focused ? "#c2410c" : email ? "#d1d5db" : "#e7e5e4",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-[#fcfcff] border rounded-xl px-4 py-3.5"
          >
            <Mail
              className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${focused ? "text-[#c2410c]" : "text-gray-400"}`}
            />
            <input
              type="email"
              id="fp-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="tu@restaurante.com"
              required
              autoComplete="email"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#1c1410] placeholder:text-[#a8a29e] font-medium"
            />
          </motion.div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-[16px] text-white bg-[#c2410c] hover:bg-[#a3360a] shadow-[0_4px_16px_rgba(194,65,12,0.25)] hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar enlace
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#e7e5e4] text-center">
        <Link
          href="/login"
          className="text-[15px] font-bold text-[#1c1410] hover:text-[#c2410c] transition-colors underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c]"
        >
          &larr; Volver a iniciar sesión
        </Link>
      </div>
    </motion.div>
  );
}
