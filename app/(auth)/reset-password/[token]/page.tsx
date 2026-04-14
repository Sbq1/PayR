"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos cambiar tu contraseña");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="font-serif text-[28px] font-black text-[#1c1410] mb-2 leading-tight">
            Contraseña actualizada
          </h1>
          <p className="text-[15px] text-[#78716c] font-medium leading-relaxed">
            Ya puedes iniciar sesión con tu nueva contraseña. Te redirigimos en
            un momento...
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1c1410] hover:text-[#c2410c] transition-colors underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c]"
        >
          Ir al login
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] font-black tracking-tight text-[#1c1410] mb-2 leading-tight">
          Nueva contraseña
        </h1>
        <p className="text-[15px] text-[#78716c] font-medium">
          Elige una contraseña segura de al menos 8 caracteres.
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
            htmlFor="rp-password"
            className="block text-[13px] font-bold text-[#1c1410] mb-2"
          >
            Nueva contraseña
          </label>
          <div className="flex items-center gap-3 bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 focus-within:border-[#c2410c] focus-within:ring-4 focus-within:ring-[#c2410c]/10 transition-all">
            <Lock className="w-4.5 h-4.5 flex-shrink-0 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="rp-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#1c1410] placeholder:text-[#a8a29e] font-medium tracking-wide"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-[#c2410c] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="rp-confirm"
            className="block text-[13px] font-bold text-[#1c1410] mb-2"
          >
            Confirmar contraseña
          </label>
          <div className="flex items-center gap-3 bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 focus-within:border-[#c2410c] focus-within:ring-4 focus-within:ring-[#c2410c]/10 transition-all">
            <Lock className="w-4.5 h-4.5 flex-shrink-0 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="rp-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#1c1410] placeholder:text-[#a8a29e] font-medium tracking-wide"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-[16px] text-white bg-[#c2410c] hover:bg-[#a3360a] shadow-[0_4px_16px_rgba(194,65,12,0.25)] hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              Actualizar contraseña
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
