"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="glass-card rounded-3xl p-8 shadow-xl shadow-indigo-500/5 fade-in-up">
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-lg">SC</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
        <p className="text-gray-500 text-sm mt-1">Inicia sesion en tu panel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@restaurante.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="glow-btn w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Iniciar sesion"}
        </button>
        <p className="text-center text-sm text-gray-500">
          No tienes cuenta?{" "}
          <Link href="/register" className="text-indigo-500 font-medium hover:text-indigo-600">
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
}
